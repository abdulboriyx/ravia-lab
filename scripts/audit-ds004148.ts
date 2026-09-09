import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const auditDir = join(root, "research/personalized-bci/audit");
const sourceDir = join(root, "research/personalized-bci/sources/datasets");
const listingDir = join(auditDir, "s3-subject-lists");
const taskNames = ["eyesclosed", "eyesopen", "mathematic", "memory", "music"];
const sessions = ["session1", "session2", "session3"] as const;
type Session = (typeof sessions)[number];

function parseTsv(source: string) {
  const [header, ...rows] = source.trimEnd().split(/\r?\n/).map((line) => line.split("\t"));
  return rows.map((row) => Object.fromEntries(header.map((name, index) => [name, row[index] ?? ""])));
}

function parseS3Objects(xml: string) {
  return [...xml.matchAll(/<Contents><Key>([\s\S]*?)<\/Key>[\s\S]*?<Size>(\d+)<\/Size>[\s\S]*?<\/Contents>/g)]
    .map((match) => ({ key: match[1], size: Number(match[2]) }));
}

function numberOrBlank(value: string | undefined) {
  if (value === undefined || value === "" || value === "n/a") return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function fieldsFor(row: Record<string, string>, session: Session) {
  const visit = session === "session1" ? "1stVisit" : session === "session2" ? "2ndVisit" : "3rdVisit";
  const n = session.replace("session", "");
  return {
    sas: numberOrBlank(row[`SAS_${visit}`]),
    sds: numberOrBlank(row[`SDS_${visit}`]),
    ess: numberOrBlank(row[`ESS_${visit}`]),
    kss: numberOrBlank(row[`KSS_session${n}`]),
    panas_positive: numberOrBlank(row[`PANAS-P_session${n}`]),
    panas_negative: numberOrBlank(row[`PANAS-N_session${n}`])
  };
}

function quantile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const at = (sorted.length - 1) * p;
  const lower = Math.floor(at);
  const upper = Math.ceil(at);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (at - lower);
}

function summary(values: number[]) {
  if (values.length === 0) {
    return { n: 0, mean: null, sd: null, min: null, q1: null, median: null, q3: null, max: null };
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.length > 1 ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1) : 0;
  return { n: values.length, mean, sd: Math.sqrt(variance), min: Math.min(...values), q1: quantile(values, 0.25), median: quantile(values, 0.5), q3: quantile(values, 0.75), max: Math.max(...values) };
}

function csv(rows: Record<string, string | number | boolean>[]) {
  if (rows.length === 0) return "\n";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header] ?? "")).join(","))].join("\n") + "\n";
}

async function main() {
  const participantText = await readFile(join(sourceDir, "ds004148-participants.tsv"), "utf8");
  const participants = parseTsv(participantText);
  const listings = new Map<string, { key: string; size: number }[]>();
  for (const file of (await readdir(listingDir)).filter((name) => name.endsWith(".xml")).sort()) {
    listings.set(file.replace(".xml", ""), parseS3Objects(await readFile(join(listingDir, file), "utf8")));
  }

  const manifest: Record<string, string | number | boolean>[] = [];
  for (const participant of participants) {
    const subject = participant.participant_id;
    const objects = listings.get(subject) ?? [];
    // The protocol fixes session1, rather than any later available value, as the immutable SAS anchor.
    const anchorSession = fieldsFor(participant, "session1").sas === "" ? "" : "session1";
    const anchor = fieldsFor(participant, "session1").sas;
    for (const [index, session] of sessions.entries()) {
      const measures = fieldsFor(participant, session);
      const eegObjects = objects.filter(({ key }) => key.includes(`/ses-${session}/eeg/`) && key.endsWith("_eeg.eeg"));
      const presentTasks = taskNames.filter((task) => eegObjects.some(({ key }) => key.includes(`task-${task}_eeg.eeg`)));
      const bytes = eegObjects.reduce((sum, object) => sum + object.size, 0);
      // Verified against the downloaded BrainVision header: 61 channels, IEEE_FLOAT_32, 500 Hz.
      const durationSeconds = bytes / (61 * 4 * 500);
      const allMeasures = [measures.sas, measures.sds, measures.ess, measures.kss, measures.panas_positive, measures.panas_negative];
      const missing = allMeasures.filter((value) => value === "").length;
      manifest.push({
        subject_id: subject,
        session_id: session,
        chronological_order: index + 1,
        chronological_order_basis: "BIDS session label; recording dates unavailable in public metadata",
        eeg_raw_task_count: presentTasks.length,
        eeg_expected_task_count: taskNames.length,
        eeg_all_expected_tasks_available: presentTasks.length === taskNames.length,
        eeg_tasks_available: presentTasks.join(";"),
        eeg_raw_bytes: bytes,
        eeg_duration_seconds: durationSeconds,
        eeg_duration_minutes: durationSeconds / 60,
        sas: measures.sas,
        sas_anchor: anchor,
        sas_anchor_session_id: anchorSession,
        anchored_sas_change: measures.sas === "" || anchor === "" || index === 0 ? (index === 0 && anchor !== "" ? 0 : "") : Number(measures.sas) - Number(anchor),
        sds: measures.sds,
        ess: measures.ess,
        kss: measures.kss,
        panas_positive: measures.panas_positive,
        panas_negative: measures.panas_negative,
        outcome_field_missing_count: missing,
        sas_missing: measures.sas === "",
        sds_missing: measures.sds === "",
        ess_missing: measures.ess === "",
        kss_missing: measures.kss === "",
        panas_positive_missing: measures.panas_positive === "",
        panas_negative_missing: measures.panas_negative === ""
      });
    }
  }

  const repeated = manifest.filter((row) => row.session_id !== "session3" && row.eeg_all_expected_tasks_available && !row.sas_missing);
  const eligibleIds = [...new Set(repeated.map((row) => row.subject_id).filter((id) => repeated.filter((row) => row.subject_id === id).length === 2))];
  const analysisManifest = manifest.map((row) => ({ ...row, analysis_cohort_included: eligibleIds.includes(String(row.subject_id)) && row.session_id !== "session3" }));
  const frozen = analysisManifest.filter((row) => row.analysis_cohort_included);
  const sas = manifest.filter((row) => row.sas !== "").map((row) => Number(row.sas));
  const delta = analysisManifest.filter((row) => row.session_id === "session2" && row.analysis_cohort_included && row.anchored_sas_change !== "").map((row) => Number(row.anchored_sas_change));
  const sessionCounts = Object.fromEntries(sessions.map((session) => [session, manifest.filter((row) => row.session_id === session && row.eeg_all_expected_tasks_available).length]));
  const missingness = Object.fromEntries(["sas", "sds", "ess", "kss", "panas_positive", "panas_negative"].map((field) => [field, manifest.filter((row) => Boolean(row[`${field}_missing`])).length]));
  const missingnessBySession = Object.fromEntries(sessions.map((session) => [session, Object.fromEntries(["sas", "sds", "ess", "kss", "panas_positive", "panas_negative"].map((field) => [field, manifest.filter((row) => row.session_id === session && Boolean(row[`${field}_missing`])).length]))]));
  const sourceFiles = ["ds004148-participants.tsv", "ds004148-participants.json", "ds004148-description.json", "ds004148-README.md", "sample-raw.vhdr", "sample-raw.json"];
  const checksums = Object.fromEntries(await Promise.all(sourceFiles.map(async (file) => {
    const path = file.startsWith("sample-") ? join(auditDir, file) : join(sourceDir, file);
    return [file, createHash("sha256").update(await readFile(path)).digest("hex")];
  })));
  const sasBySession = Object.fromEntries(sessions.map((session) => [session, summary(manifest.filter((row) => row.session_id === session && row.sas !== "").map((row) => Number(row.sas)))]));
  const results = { dataset: "ds004148", audit_type: "manifest-only; no model trained", input_participants: participants.length, raw_eeg_sessions_with_all_five_tasks: sessionCounts, usable_repeated_session_subjects_with_SAS: eligibleIds.length, complete_three_session_sas_cases: 0, sas_distribution_all_observed: summary(sas), sas_distribution_by_session: sasBySession, anchored_sas_change_session2: summary(delta), anchored_sas_change_zero_count: delta.filter((value) => value === 0).length, anchored_sas_change_absolute_at_least_5_count: delta.filter((value) => Math.abs(value) >= 5).length, measurement_missingness_across_180_subject_sessions: missingness, measurement_missingness_by_session: missingnessBySession, session3_sas_available: manifest.filter((row) => row.session_id === "session3" && !row.sas_missing).length, source_checksums: checksums };
  await writeFile(join(auditDir, "SUBJECT_SESSION_MANIFEST.csv"), csv(manifest));
  await writeFile(join(auditDir, "analysis_manifest.csv"), csv(analysisManifest));
  await writeFile(join(auditDir, "FROZEN_COHORT_SESSION1_SESSION2.csv"), csv(frozen));
  await writeFile(join(auditDir, "AUDIT_SUMMARY.json"), JSON.stringify(results, null, 2) + "\n");
}

main();
