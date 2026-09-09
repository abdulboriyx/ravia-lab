#!/usr/bin/env python3
"""Leakage-safe, fixed-population ds004148 eyes-closed SAS baseline.

Downloads one public raw recording at a time, extracts fixed features, then removes
the raw file unless --keep-downloads is supplied. No session-2 labels or features
participate in fitting any transform or model.
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
CACHE = ROOT / "research" / "personalized-bci" / "local-data" / "ds004148-eyesclosed"
OUTPUT = AUDIT / "eyesclosed_fixed_population_baseline.json"
TASK = "eyesclosed"
SAMPLE_RATE = 500
CHANNELS = 61
WINDOW_SECONDS = 5
RIDGE_ALPHA = 100.0
BANDS = {"delta": (1, 4), "theta": (4, 8), "alpha": (8, 13), "beta": (13, 30), "gamma": (30, 45)}


def read_manifest():
    with (AUDIT / "analysis_manifest.csv").open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    by_subject = {}
    for row in rows:
        if row["analysis_cohort_included"] != "true" or row["session_id"] not in {"session1", "session2"}:
            continue
        by_subject.setdefault(row["subject_id"], {})[row["session_id"]] = row
    cohort = []
    for subject, sessions in sorted(by_subject.items()):
        if set(sessions) != {"session1", "session2"}:
            raise RuntimeError(f"Frozen manifest inconsistency for {subject}")
        cohort.append((subject, sessions["session1"], sessions["session2"]))
    if len(cohort) != 58:
        raise RuntimeError(f"Expected frozen 58-participant cohort; found {len(cohort)}")
    return cohort


def url_for(subject, session):
    filename = f"{subject}_ses-{session}_task-{TASK}_eeg.eeg"
    return f"https://s3.amazonaws.com/openneuro.org/ds004148/{subject}/ses-{session}/eeg/{filename}", filename


def download_then_feature(subject, session, keep_downloads):
    url, filename = url_for(subject, session)
    CACHE.mkdir(parents=True, exist_ok=True)
    destination = CACHE / filename
    feature_cache = CACHE / f"{subject}_ses-{session}_task-{TASK}_features.npy"
    provenance_cache = CACHE / f"{subject}_ses-{session}_task-{TASK}_provenance.json"
    if feature_cache.exists() and provenance_cache.exists():
        return np.load(feature_cache), json.loads(provenance_cache.read_text())
    if not destination.exists():
        descriptor, temporary = tempfile.mkstemp(prefix="download-", suffix=".eeg", dir=CACHE)
        os.close(descriptor)
        try:
            urlretrieve(url, temporary)
            Path(temporary).replace(destination)
        finally:
            Path(temporary).unlink(missing_ok=True)
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    try:
        features = features_from_brainvision(destination)
        provenance = {"subject_id": subject, "session_id": session, "url": url, "sha256": digest}
        np.save(feature_cache, features)
        provenance_cache.write_text(json.dumps(provenance) + "\n")
        return features, provenance
    finally:
        if not keep_downloads:
            destination.unlink(missing_ok=True)


def features_from_brainvision(path):
    raw = np.fromfile(path, dtype="<f4")
    if raw.size % CHANNELS:
        raise RuntimeError(f"Unexpected sample count in {path.name}")
    data = raw.reshape((-1, CHANNELS)).astype(np.float64, copy=False)
    if data.shape[0] != SAMPLE_RATE * 300:
        raise RuntimeError(f"Unexpected duration in {path.name}: {data.shape[0] / SAMPLE_RATE:.3f}s")
    data = np.nan_to_num(data - np.nanmean(data, axis=0, keepdims=True), nan=0.0, posinf=0.0, neginf=0.0)
    samples_per_window = SAMPLE_RATE * WINDOW_SECONDS
    windows = data.reshape((-1, samples_per_window, CHANNELS))
    spectrum = np.fft.rfft(windows, axis=1)
    power = (np.abs(spectrum) ** 2).mean(axis=0)
    frequencies = np.fft.rfftfreq(samples_per_window, d=1 / SAMPLE_RATE)
    total = power[(frequencies >= 1) & (frequencies < 45)].sum(axis=0)
    spectral = []
    for low, high in BANDS.values():
        band = power[(frequencies >= low) & (frequencies < high)].sum(axis=0)
        spectral.append(np.log10(np.maximum(band / np.maximum(total, 1e-12), 1e-12)))
    correlation = np.corrcoef(data, rowvar=False)
    upper_triangle = correlation[np.triu_indices(CHANNELS)]
    return np.concatenate([*spectral, upper_triangle])


def fit_transform(train):
    median = np.nanmedian(train, axis=0)
    filled = np.where(np.isfinite(train), train, median)
    mean = filled.mean(axis=0)
    scale = filled.std(axis=0)
    scale[scale == 0] = 1.0
    return median, mean, scale


def transform(values, fitted):
    median, mean, scale = fitted
    filled = np.where(np.isfinite(values), values, median)
    return (filled - mean) / scale


def ridge_predict(train_x, train_y, test_x):
    fitted = fit_transform(train_x)
    x_train = transform(train_x, fitted)
    x_test = transform(test_x, fitted)
    y_mean = train_y.mean()
    centered_y = train_y - y_mean
    dual = np.linalg.solve(x_train @ x_train.T + RIDGE_ALPHA * np.eye(x_train.shape[0]), centered_y)
    return x_test @ x_train.T @ dual + y_mean


def metrics(observed, predicted):
    errors = predicted - observed
    return {"mae": float(np.mean(np.abs(errors))), "rmse": float(np.sqrt(np.mean(errors ** 2)))}


def bootstrap_drop(session1_y, session1_pred, session2_y, session2_pred):
    rng = np.random.default_rng(20260910)
    drops = []
    for _ in range(10000):
        indices = rng.integers(0, len(session1_y), len(session1_y))
        drops.append(metrics(session2_y[indices], session2_pred[indices])["mae"] - metrics(session1_y[indices], session1_pred[indices])["mae"])
    return {"metric": "MAE(participant-disjoint session2) - MAE(participant-disjoint session1)", "bootstrap_participants": 10000, "seed": 20260910, "mean": float(np.mean(drops)), "ci_95": [float(np.quantile(drops, 0.025)), float(np.quantile(drops, 0.975))]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--keep-downloads", action="store_true", help="retain raw downloads in ignored local-data cache")
    args = parser.parse_args()
    cohort = read_manifest()
    session1_features, session2_features, session1_y, session2_y, provenance = [], [], [], [], []
    for subject, session1, session2 in cohort:
        features, source = download_then_feature(subject, "session1", args.keep_downloads)
        session1_features.append(features); session1_y.append(float(session1["sas"])); provenance.append(source)
        features, source = download_then_feature(subject, "session2", args.keep_downloads)
        session2_features.append(features); session2_y.append(float(session2["sas"])); provenance.append(source)
    x1, x2 = np.vstack(session1_features), np.vstack(session2_features)
    y1, y2 = np.asarray(session1_y), np.asarray(session2_y)
    loo_predictions = np.empty_like(y1)
    loo_later_predictions = np.empty_like(y2)
    for held_out in range(len(y1)):
        train_indices = np.array([index for index in range(len(y1)) if index != held_out])
        loo_predictions[held_out] = ridge_predict(x1[train_indices], y1[train_indices], x1[held_out : held_out + 1])[0]
        loo_later_predictions[held_out] = ridge_predict(x1[train_indices], y1[train_indices], x2[held_out : held_out + 1])[0]
    later_predictions = ridge_predict(x1, y1, x2)
    results = {
        "status": "complete",
        "scope": "fixed population model only; no personalization or target-session fitting",
        "task": "eyes-closed resting EEG",
        "frozen_cohort_subjects": len(cohort),
        "features": {"spectral_bands_hz": BANDS, "window_seconds": WINDOW_SECONDS, "channels": CHANNELS, "correlation_upper_triangle_features": CHANNELS * (CHANNELS + 1) // 2, "total_feature_count": int(x1.shape[1])},
        "model": {"type": "ridge regression", "alpha": RIDGE_ALPHA, "selection": "fixed before execution; no hyperparameter search"},
        "fit_boundary": "all imputers, feature standardizers, and ridge fits use session-1 training participants only",
        "session1_participant_disjoint_reference": metrics(y1, loo_predictions),
        "session2_participant_disjoint_later_test": metrics(y2, loo_later_predictions),
        "session2_direct_later_test": metrics(y2, later_predictions),
        "later_session_mae_drop": bootstrap_drop(y1, loo_predictions, y2, loo_later_predictions),
        "anchored_session2_change": {"observed_definition": "SAS_session2 - SAS_session1", "predicted_definition": "predicted_SAS_session2 - observed_SAS_session1", "metrics": metrics(y2 - y1, later_predictions - y1)},
        "predictions": [{"subject_id": subject, "session1_sas": float(y1[index]), "session1_participant_disjoint_prediction": float(loo_predictions[index]), "session2_sas": float(y2[index]), "session2_participant_disjoint_prediction": float(loo_later_predictions[index]), "session2_direct_prediction": float(later_predictions[index]), "observed_anchored_change": float(y2[index] - y1[index]), "predicted_anchored_change": float(later_predictions[index] - y1[index])} for index, (subject, _, _) in enumerate(cohort)],
        "raw_source_provenance": provenance,
    }
    OUTPUT.write_text(json.dumps(results, indent=2) + "\n")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} for {len(cohort)} frozen participants.")


if __name__ == "__main__":
    main()
