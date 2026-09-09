#!/usr/bin/env python3
"""Frozen-cohort ds004148 task-wise SAS model comparison; no personalization.

Each task is evaluated in isolation. Raw public EEG is streamed one file at a
time, checksum-recorded, feature-extracted, then removed. Only ignored feature
caches remain locally. Session-2 data never fit an imputer, scaler, or model.
"""

import argparse
import csv
import hashlib
import json
import os
import tempfile
from pathlib import Path
from urllib.request import urlretrieve

import numpy as np


ROOT = Path.cwd()
AUDIT = ROOT / "research" / "personalized-bci" / "audit"
CACHE = ROOT / "research" / "personalized-bci" / "local-data" / "ds004148-task-features"
TASKS = ("eyesclosed", "eyesopen", "mathematic", "memory", "music")
SAMPLE_RATE, CHANNELS, WINDOW_SECONDS = 500, 61, 5
RIDGE_ALPHA, KERNEL_RIDGE_ALPHA = 100.0, 1.0
BANDS = {"delta": (1, 4), "theta": (4, 8), "alpha": (8, 13), "beta": (13, 30), "gamma": (30, 45)}
CONTEXT_FIELDS = ("sds", "ess", "kss", "panas_positive", "panas_negative")


def cohort():
    with (AUDIT / "analysis_manifest.csv").open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    grouped = {}
    for row in rows:
        if row["analysis_cohort_included"] == "true" and row["session_id"] in {"session1", "session2"}:
            grouped.setdefault(row["subject_id"], {})[row["session_id"]] = row
    result = [(subject, data["session1"], data["session2"]) for subject, data in sorted(grouped.items()) if set(data) == {"session1", "session2"}]
    if len(result) != 58:
        raise RuntimeError(f"Expected the frozen 58-person cohort; found {len(result)}")
    return result


def source_url(subject, session, task):
    name = f"{subject}_ses-{session}_task-{task}_eeg.eeg"
    return f"https://s3.amazonaws.com/openneuro.org/ds004148/{subject}/ses-{session}/eeg/{name}", name


def eeg_features(path):
    raw = np.fromfile(path, dtype="<f4")
    if raw.size % CHANNELS:
        raise RuntimeError(f"Unexpected data shape: {path.name}")
    data = raw.reshape((-1, CHANNELS)).astype(np.float64, copy=False)
    if data.shape[0] != SAMPLE_RATE * 300:
        raise RuntimeError(f"Unexpected duration in {path.name}: {data.shape[0] / SAMPLE_RATE:.3f}s")
    data = np.nan_to_num(data - np.nanmean(data, axis=0, keepdims=True), nan=0.0, posinf=0.0, neginf=0.0)
    windows = data.reshape((-1, SAMPLE_RATE * WINDOW_SECONDS, CHANNELS))
    power = (np.abs(np.fft.rfft(windows, axis=1)) ** 2).mean(axis=0)
    frequencies = np.fft.rfftfreq(SAMPLE_RATE * WINDOW_SECONDS, d=1 / SAMPLE_RATE)
    total = power[(frequencies >= 1) & (frequencies < 45)].sum(axis=0)
    spectral = [np.log10(np.maximum(power[(frequencies >= low) & (frequencies < high)].sum(axis=0) / np.maximum(total, 1e-12), 1e-12)) for low, high in BANDS.values()]
    correlation = np.corrcoef(data, rowvar=False)
    return np.concatenate([*spectral, correlation[np.triu_indices(CHANNELS)]])


def cached_features(subject, session, task):
    CACHE.mkdir(parents=True, exist_ok=True)
    url, name = source_url(subject, session, task)
    feature_path = CACHE / f"{subject}_ses-{session}_task-{task}_features.npy"
    provenance_path = CACHE / f"{subject}_ses-{session}_task-{task}_provenance.json"
    if feature_path.exists() and provenance_path.exists():
        return np.load(feature_path), json.loads(provenance_path.read_text())
    raw_path = CACHE / name
    if not raw_path.exists():
        descriptor, temporary = tempfile.mkstemp(prefix="download-", suffix=".eeg", dir=CACHE)
        os.close(descriptor)
        try:
            urlretrieve(url, temporary)
            Path(temporary).replace(raw_path)
        finally:
            Path(temporary).unlink(missing_ok=True)
    digest = hashlib.sha256(raw_path.read_bytes()).hexdigest()
    try:
        values = eeg_features(raw_path)
        provenance = {"subject_id": subject, "session_id": session, "task": task, "url": url, "sha256": digest}
        np.save(feature_path, values)
        provenance_path.write_text(json.dumps(provenance) + "\n")
        return values, provenance
    finally:
        raw_path.unlink(missing_ok=True)


def fit_transform(train):
    median = np.nanmedian(train, axis=0)
    filled = np.where(np.isfinite(train), train, median)
    mean, scale = filled.mean(axis=0), filled.std(axis=0)
    scale[scale == 0] = 1.0
    return median, mean, scale


def transform(values, fitted):
    median, mean, scale = fitted
    return (np.where(np.isfinite(values), values, median) - mean) / scale


def ridge(train_x, train_y, test_x):
    fitted = fit_transform(train_x)
    x_train, x_test = transform(train_x, fitted), transform(test_x, fitted)
    centered = train_y - train_y.mean()
    dual = np.linalg.solve(x_train @ x_train.T + RIDGE_ALPHA * np.eye(len(train_y)), centered)
    return x_test @ x_train.T @ dual + train_y.mean()


def rbf_kernel_ridge(train_x, train_y, test_x):
    fitted = fit_transform(train_x)
    x_train, x_test = transform(train_x, fitted), transform(test_x, fitted)
    gamma = 1.0 / x_train.shape[1]  # fixed after standardization; no test-data or outcome tuning
    train_distances = ((x_train[:, None, :] - x_train[None, :, :]) ** 2).sum(axis=2)
    test_distances = ((x_test[:, None, :] - x_train[None, :, :]) ** 2).sum(axis=2)
    kernel = np.exp(-gamma * train_distances)
    weights = np.linalg.solve(kernel + KERNEL_RIDGE_ALPHA * np.eye(len(train_y)), train_y - train_y.mean())
    return np.exp(-gamma * test_distances) @ weights + train_y.mean()


def metrics(actual, predicted):
    error = predicted - actual
    return {"mae": float(np.mean(np.abs(error))), "rmse": float(np.sqrt(np.mean(error ** 2)))}


def paired_ci(reference_actual, reference_predicted, later_actual, later_predicted):
    rng = np.random.default_rng(20260910)
    differences = []
    for _ in range(10000):
        index = rng.integers(0, len(reference_actual), len(reference_actual))
        differences.append(metrics(later_actual[index], later_predicted[index])["mae"] - metrics(reference_actual[index], reference_predicted[index])["mae"])
    return {"metric": "MAE(participant-disjoint session2) - MAE(participant-disjoint session1)", "bootstrap_participants": 10000, "seed": 20260910, "mean": float(np.mean(differences)), "ci_95": [float(np.quantile(differences, 0.025)), float(np.quantile(differences, 0.975))]}


def eeg_added_value_ci(context_actual, context_predicted, combined_predicted):
    rng = np.random.default_rng(20260910)
    differences = []
    for _ in range(10000):
        index = rng.integers(0, len(context_actual), len(context_actual))
        differences.append(metrics(context_actual[index], combined_predicted[index])["mae"] - metrics(context_actual[index], context_predicted[index])["mae"])
    return {"metric": "MAE(EEG+context) - MAE(context-only), participant-disjoint session2", "bootstrap_participants": 10000, "seed": 20260910, "mean": float(np.mean(differences)), "ci_95": [float(np.quantile(differences, 0.025)), float(np.quantile(differences, 0.975))]}


def evaluate(name, predictor, x1, x2, y1, y2):
    reference, later = np.empty_like(y1), np.empty_like(y2)
    for held_out in range(len(y1)):
        train = np.array([index for index in range(len(y1)) if index != held_out])
        reference[held_out] = predictor(x1[train], y1[train], x1[held_out : held_out + 1])[0]
        later[held_out] = predictor(x1[train], y1[train], x2[held_out : held_out + 1])[0]
    direct = predictor(x1, y1, x2)
    return {"name": name, "participant_disjoint_session1": metrics(y1, reference), "participant_disjoint_session2": metrics(y2, later), "later_session_mae_difference": paired_ci(y1, reference, y2, later), "direct_session1_trained_session2": metrics(y2, direct), "predictions": {"session1_participant_disjoint": reference, "session2_participant_disjoint": later, "session2_direct": direct}}


def mean_predictor(train_x, train_y, test_x):
    return np.full(len(test_x), train_y.mean())


def run(task):
    rows = cohort()
    x1, x2, c1, c2, y1, y2, provenance = [], [], [], [], [], [], []
    for index, (subject, session1, session2) in enumerate(rows, start=1):
        values, source = cached_features(subject, "session1", task); x1.append(values); provenance.append(source)
        values, source = cached_features(subject, "session2", task); x2.append(values); provenance.append(source)
        c1.append([float(session1[field]) if session1[field] else np.nan for field in CONTEXT_FIELDS])
        c2.append([float(session2[field]) if session2[field] else np.nan for field in CONTEXT_FIELDS])
        y1.append(float(session1["sas"])); y2.append(float(session2["sas"]))
        print(f"{task}: {index}/{len(rows)}", flush=True)
    x1, x2, c1, c2, y1, y2 = map(np.asarray, (x1, x2, c1, c2, y1, y2))
    methods = {
        "session1_mean": evaluate("session1 mean SAS", mean_predictor, x1[:, :1], x2[:, :1], y1, y2),
        "eeg_ridge": evaluate("EEG spectral + correlation ridge", ridge, x1, x2, y1, y2),
        "eeg_rbf_kernel_ridge": evaluate("EEG spectral + correlation RBF kernel ridge", rbf_kernel_ridge, x1, x2, y1, y2),
        "context_ridge": evaluate("contemporaneous psychometric/context ridge", ridge, c1, c2, y1, y2),
        "eeg_context_ridge": evaluate("EEG + contemporaneous psychometric/context ridge", ridge, np.hstack([x1, c1]), np.hstack([x2, c2]), y1, y2),
    }
    last_known = y1.copy()
    methods["last_known_sas"] = {"name": "last-known session1 SAS", "direct_session1_trained_session2": metrics(y2, last_known), "note": "Only available for the later-session task; it cannot be scored as a session-1 reference without trivially using the target itself."}
    context_later = methods["context_ridge"]["predictions"]["session2_participant_disjoint"]
    combined_later = methods["eeg_context_ridge"]["predictions"]["session2_participant_disjoint"]
    result = {
        "status": "complete", "scope": "task-wise fixed population comparison only; no personalization", "task": task,
        "frozen_cohort_subjects": len(rows), "eeg_feature_count": int(x1.shape[1]), "context_fields": list(CONTEXT_FIELDS),
        "fixed_models": {"ridge_alpha": RIDGE_ALPHA, "rbf_kernel_ridge_alpha": KERNEL_RIDGE_ALPHA, "rbf_gamma": "1 / training feature count after train-only standardization", "hyperparameter_search": "none"},
        "methods": {key: {name: value for name, value in method.items() if name != "predictions"} for key, method in methods.items()},
        "eeg_added_value_beyond_context": eeg_added_value_ci(y2, context_later, combined_later),
        "participant_predictions": [{"subject_id": subject, "session1_sas": float(y1[i]), "session2_sas": float(y2[i]), "last_known_sas_prediction": float(y1[i]), **{f"{method_key}_{prediction_key}": float(prediction[i]) for method_key, method in methods.items() if "predictions" in method for prediction_key, prediction in method["predictions"].items()}} for i, (subject, _, _) in enumerate(rows)],
        "raw_source_provenance": provenance,
    }
    (AUDIT / f"{task}_model_comparison.json").write_text(json.dumps(result, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", required=True, choices=TASKS)
    run(parser.parse_args().task)


if __name__ == "__main__":
    main()
