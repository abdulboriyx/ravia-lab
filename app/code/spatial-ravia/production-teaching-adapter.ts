/** A-H: thin production projection over canonical teaching state.
 *
 * This module deliberately contains no scientific, temporal, renderer, or
 * camera authority. It only arranges already-evaluated teaching data for
 * production surfaces.
 */
import type { AudienceTeachingProgramV1 } from "./teaching-audience-policy.ts";
import type { NarrationCueProgramV1, TeachingTextBundleV1, TeachingTextSegmentV1 } from "./teaching-text.ts";
import type { TeachingSnapshotV1, TeachingCursorV1 } from "./teaching-snapshot.ts";
import type { TeachingReference } from "./teaching-plan.ts";

export const productionTeachingViewSchemaVersion = "1" as const;
export type ProductionTeachingSupportStatus = "SUPPORTED" | "UNAVAILABLE";
export type ProductionTeachingFailureCode =
  | "TEACHING_UNAVAILABLE"
  | "TEACHING_TIMELINE_REQUIRED"
  | "SCIENTIFIC_STATE_UNAVAILABLE"
  | "AUDIENCE_DETAIL_UNAVAILABLE"
  | "MISCONCEPTION_EVIDENCE_UNAVAILABLE"
  | "FRAGMENTATION_UNGROUNDED"
  | "PRESENTATION_TARGET_UNAVAILABLE";

export type ProductionTeachingChapterV1 = Readonly<{
  chapterId: string;
  status: "ACTIVE" | "COMPLETED" | "PENDING";
  order: number;
  title: string;
}>;

export type ProductionTeachingLabelProjectionV1 = Readonly<{
  segmentId: string;
  targetRefs: readonly TeachingReference[];
  priority: "PRIMARY" | "SECONDARY" | "NONE";
  anchorStatus: "EXISTING_PRODUCTION_SEAM_REQUIRED";
}>;

export type ProductionTeachingViewV1 = Readonly<{
  schemaVersion: "1";
  teachingPlanId: string;
  snapshotTrace: TeachingTextBundleV1["snapshotTrace"];
  activeChapter: ProductionTeachingChapterV1 | null;
  chapterList: readonly ProductionTeachingChapterV1[];
  objectiveText: string;
  explanationSegments: readonly TeachingTextSegmentV1[];
  annotationSegments: readonly TeachingTextSegmentV1[];
  causalSegments: readonly TeachingTextSegmentV1[];
  comparisonSegments: readonly TeachingTextSegmentV1[];
  correctionSegments: readonly TeachingTextSegmentV1[];
  labelProjections: readonly ProductionTeachingLabelProjectionV1[];
  activeFocusRefs: readonly TeachingReference[];
  secondaryContextRefs: readonly TeachingReference[];
  suppressedRefs: readonly TeachingReference[];
  audience: AudienceTeachingProgramV1["audience"];
  detail: TeachingSnapshotV1["detail"];
  terminologyLevel: TeachingSnapshotV1["terminologyLevel"];
  narrationCueIds: readonly string[];
  activeNarrationSegments: readonly TeachingTextSegmentV1[];
  captionSegments: TeachingTextBundleV1["captionSegments"];
  provenanceRefs: readonly TeachingReference[];
  navigation: Readonly<{ mode: TeachingCursorV1["mode"]; chapterId?: string; canGoPrevious: boolean; canGoNext: boolean }>;
  support: Readonly<{ status: ProductionTeachingSupportStatus; code?: ProductionTeachingFailureCode; reasons: readonly string[] }>;
  exportBoundary: "TEACHING_DOM_EXPORT_NOT_YET_GUARANTEED";
}>;

export type BuildProductionTeachingViewInput = Readonly<{
  snapshot: TeachingSnapshotV1;
  textBundle: TeachingTextBundleV1;
  narrationProgram: NarrationCueProgramV1;
  chapterTitles?: Readonly<Record<string, string>>;
}>;

const orderStatus = (snapshot: TeachingSnapshotV1, id: string): ProductionTeachingChapterV1["status"] =>
  snapshot.activeChapterIds.includes(id) ? "ACTIVE" : snapshot.completedChapterIds.includes(id) ? "COMPLETED" : "PENDING";

const segmentRefs = (segments: readonly TeachingTextSegmentV1[]): ProductionTeachingLabelProjectionV1[] => segments.map((segment) => ({
  segmentId: segment.segmentId,
  targetRefs: segment.targetRefs,
  priority: segment.emphasis ?? "NONE",
  anchorStatus: "EXISTING_PRODUCTION_SEAM_REQUIRED",
}));

function failureFromSnapshot(snapshot: TeachingSnapshotV1, bundle: TeachingTextBundleV1): ProductionTeachingViewV1["support"] {
  if (snapshot.support.status === "UNAVAILABLE") return { status: "UNAVAILABLE", code: snapshot.support.code as ProductionTeachingFailureCode | undefined, reasons: snapshot.support.reasons };
  if (bundle.support.status === "UNAVAILABLE") return { status: "UNAVAILABLE", code: bundle.support.code as ProductionTeachingFailureCode | undefined, reasons: bundle.support.reasons };
  return { status: "SUPPORTED", reasons: [] };
}

/** Pure projection. It never evaluates science, time, or presentation geometry. */
export function buildProductionTeachingView(input: BuildProductionTeachingViewInput): ProductionTeachingViewV1 {
  const { snapshot, textBundle, narrationProgram } = input;
  const ids = [...new Set([...snapshot.completedChapterIds, ...snapshot.activeChapterIds, ...snapshot.pendingChapterIds])];
  const chapterList = ids.map((chapterId, index) => ({
    chapterId,
    status: orderStatus(snapshot, chapterId),
    order: index + 1,
    title: input.chapterTitles?.[chapterId] ?? (chapterId === textBundle.chapterId ? textBundle.chapterTitle : chapterId),
  }));
  const activeChapter = chapterList.find((chapter) => chapter.status === "ACTIVE") ?? null;
  const activeNarrationSegments = textBundle.narrationSegments.filter((segment) => snapshot.narrationCueIds.includes(segment.cueId ?? ""));
  const support = failureFromSnapshot(snapshot, textBundle);
  return {
    schemaVersion: productionTeachingViewSchemaVersion,
    teachingPlanId: snapshot.teachingPlanId,
    snapshotTrace: textBundle.snapshotTrace,
    activeChapter,
    chapterList,
    objectiveText: textBundle.learningObjectiveText,
    explanationSegments: textBundle.explanationSegments,
    annotationSegments: textBundle.annotationText,
    causalSegments: textBundle.causalText,
    comparisonSegments: textBundle.contrastText,
    correctionSegments: textBundle.correctionText,
    labelProjections: segmentRefs([...textBundle.annotationText, ...textBundle.causalText, ...textBundle.contrastText, ...textBundle.correctionText]),
    activeFocusRefs: snapshot.activeFocusRefs,
    secondaryContextRefs: snapshot.activeContextRefs,
    suppressedRefs: snapshot.suppressedRefs,
    audience: snapshot.audience,
    detail: snapshot.detail,
    terminologyLevel: snapshot.terminologyLevel,
    narrationCueIds: snapshot.narrationCueIds,
    activeNarrationSegments,
    captionSegments: textBundle.captionSegments.filter((caption) => snapshot.narrationCueIds.includes(caption.cueId)),
    provenanceRefs: snapshot.provenanceRefs,
    navigation: {
      mode: snapshot.cursor?.mode ?? "TIME_FOLLOWING",
      ...(snapshot.cursor?.chapterId ? { chapterId: snapshot.cursor.chapterId } : {}),
      canGoPrevious: Boolean(activeChapter && activeChapter.order > 1),
      canGoNext: Boolean(activeChapter && activeChapter.order < chapterList.length),
    },
    support,
    exportBoundary: "TEACHING_DOM_EXPORT_NOT_YET_GUARANTEED",
  };
}

export function productionTeachingCursor(mode: TeachingCursorV1["mode"], chapterId?: string): TeachingCursorV1 {
  return { schemaVersion: "1", mode, ...(chapterId ? { chapterId } : {}) };
}

export function serializeProductionTeachingView(view: ProductionTeachingViewV1): string {
  return JSON.stringify(view);
}
