"use client";

import { useLayoutEffect, useRef } from "react";
import type { CompositeExportSurfaceV1 } from "./composite-teaching-frame";
import type { ProductionTeachingViewV1 } from "./production-teaching-adapter";
import styles from "./TeachingExportSurface.module.css";

type Props = Readonly<{
  surface: CompositeExportSurfaceV1;
  view: ProductionTeachingViewV1;
  sceneCanvas?: HTMLCanvasElement | null;
  sceneReady: boolean;
  fontsReady: boolean;
  onLayoutReady?: (ready: boolean) => void;
}>;

/** Export-only DOM. It has no controls and receives canonical evaluated data. */
export function TeachingExportSurface({ surface, view, sceneCanvas, sceneReady, fontsReady, onLayoutReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = surface.exactFrame.width * surface.exactFrame.pixelRatio;
  const height = surface.exactFrame.height * surface.exactFrame.pixelRatio;
  useLayoutEffect(() => {
    const target = canvasRef.current;
    if (!target || !sceneCanvas || !sceneReady) {
      onLayoutReady?.(false);
      return;
    }
    target.width = width;
    target.height = height;
    const context = target.getContext("2d");
    if (!context) {
      onLayoutReady?.(false);
      return;
    }
    context.clearRect(0, 0, width, height);
    context.drawImage(sceneCanvas, 0, 0, width, height);
    onLayoutReady?.(fontsReady);
  }, [fontsReady, height, onLayoutReady, sceneCanvas, sceneReady, width]);
  const segments = [...view.explanationSegments, ...view.annotationSegments, ...view.causalSegments, ...view.comparisonSegments, ...view.correctionSegments];
  return (
    <section
      className={styles.surface}
      data-export-surface={surface.exportSurface}
      data-application-id={surface.exactFrame.applicationId}
      data-time-seconds={surface.exactFrame.timeSeconds}
      data-teaching-chapter={surface.teachingText.chapterId}
      data-teaching-audience={surface.teachingSnapshot.audience}
      data-teaching-mode={surface.teachingSnapshot.requestMode}
      data-export-ready={sceneReady && fontsReady}
      style={{ "--teaching-export-width": `${surface.dimensions.width}px`, "--teaching-export-height": `${surface.dimensions.height}px`, "--teaching-export-background": surface.background.mode === "transparent" ? "transparent" : surface.background.color ?? "#000000" } as React.CSSProperties}
    >
      <canvas ref={canvasRef} className={styles.scene} aria-label="Exact scientific scene frame" />
      <div className={styles.panel} data-teaching-overlay="text">
        <p className={styles.eyebrow}>{view.audience} · {view.snapshotTrace.timeSeconds}s</p>
        <h1>{view.activeChapter?.title ?? surface.teachingText.chapterId}</h1>
        <p className={styles.objective}>{view.objectiveText}</p>
        {segments.map((segment) => <p className={styles.segment} data-kind={segment.kind} key={segment.segmentId}>{segment.text}</p>)}
        {surface.overlay.includeCaptions && view.captionSegments.map((caption) => <p className={styles.caption} data-caption-id={caption.segmentId} key={caption.segmentId}>{caption.text}</p>)}
        {surface.overlay.includeProvenance && <p className={styles.provenance}>Grounded references: {view.provenanceRefs.length}</p>}
      </div>
    </section>
  );
}
