"use client";

import type { ProductionTeachingViewV1 } from "./production-teaching-adapter";

type Props = {
  view: ProductionTeachingViewV1;
  onAudienceChange?: (audience: ProductionTeachingViewV1["audience"]) => void;
  onChapterChange?: (chapterId: string) => void;
};

/** Minimal DOM surface; canonical evaluation remains outside React. */
export function ProductionTeachingPanel({ view, onAudienceChange, onChapterChange }: Props) {
  const activeSegments = [
    ...view.explanationSegments,
    ...view.annotationSegments,
    ...view.causalSegments,
    ...view.comparisonSegments,
    ...view.correctionSegments,
  ];

  return (
    <aside className="productionTeachingPanel" aria-label="Teaching explanation" data-teaching-support={view.support.status}>
      {view.support.status === "UNAVAILABLE" ? (
        <p role="status" className="productionTeachingFailure">
          Teaching unavailable{view.support.code ? `: ${view.support.code}` : ""}.
        </p>
      ) : (
        <>
          <div className="productionTeachingHeader">
            <div>
              <p className="productionTeachingEyebrow">{view.audience}</p>
              <h2>{view.activeChapter?.title ?? "Teaching"}</h2>
            </div>
            {onAudienceChange && (
              <div className="productionTeachingAudience" aria-label="Teaching audience">
                {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((audience) => (
                  <button key={audience} type="button" onClick={() => onAudienceChange(audience)} aria-pressed={view.audience === audience}>
                    {audience}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="productionTeachingObjective">{view.objectiveText}</p>
          <div className="productionTeachingSegments">
            {activeSegments.map((segment) => <p key={segment.segmentId} data-teaching-segment={segment.kind}>{segment.text}</p>)}
          </div>
          {view.chapterList.length > 0 && (
            <nav className="productionTeachingNavigation" aria-label="Teaching chapters">
              <button type="button" disabled={!view.navigation.canGoPrevious} onClick={() => {
                const previous = view.chapterList[view.chapterList.findIndex((chapter) => chapter.chapterId === view.activeChapter?.chapterId) - 1];
                if (previous) onChapterChange?.(previous.chapterId);
              }}>Previous</button>
              <span>{view.activeChapter?.order ?? 0} / {view.chapterList.length}</span>
              <button type="button" disabled={!view.navigation.canGoNext} onClick={() => {
                const next = view.chapterList[view.chapterList.findIndex((chapter) => chapter.chapterId === view.activeChapter?.chapterId) + 1];
                if (next) onChapterChange?.(next.chapterId);
              }}>Next</button>
            </nav>
          )}
          {view.provenanceRefs.length > 0 && <p className="productionTeachingProvenance">Grounded source references: {view.provenanceRefs.length}</p>}
        </>
      )}
    </aside>
  );
}
