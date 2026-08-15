"use client";

import type { RnaPresentationRoute } from "./RnaPresentationRouter";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";
import { ProductionRnaScene } from "./ProductionRnaScene";

export function RnaPresentationView({ route, theme }: { route: RnaPresentationRoute; theme: SpatialRaviaTheme }) {
  return (
    <section
      aria-label={`RNA presentation: ${route.family}`}
      className="rnaProductionMount"
      data-rna-family={route.family}
      data-rna-owner={route.owner}
      data-rna-camera={route.cameraIntent}
      data-rna-type={route.rnaType}
      data-rna-representation={route.representationMode}
      data-rna-theme={theme}
    >
      <ProductionRnaScene route={route} theme={theme} />
      {process.env.NODE_ENV !== "production" && (
        <details className="rnaProductionMetadata">
          <summary>RNA presentation metadata</summary>
          <dl>
            <dt>Family</dt><dd>{route.family}</dd>
            <dt>Owner</dt><dd>{route.owner}</dd>
            <dt>Camera</dt><dd>{route.cameraIntent}</dd>
            <dt>RNA type</dt><dd>{route.rnaType}</dd>
            <dt>Structural state</dt><dd>{route.structuralState}</dd>
            <dt>Grounding</dt><dd>{route.groundingStatus}</dd>
            <dt>Representation</dt><dd>{route.representationMode}</dd>
            <dt>Labels</dt><dd>{route.labels.join(", ") || "none"}</dd>
            <dt>Highlights</dt><dd>{[...route.highlightedRegions, ...route.highlightedInteractions].join(", ") || "none"}</dd>
          </dl>
        </details>
      )}
    </section>
  );
}
