"use client";

import { DnaLocalChemistryView } from "./DnaLocalChemistryView";
import { DnaMolecularView } from "./DnaMolecularView";
import type { DnaVisualTemplate } from "./biology-dna-visual-dispatcher";
import type { SpatialRaviaTheme } from "./spatial-ravia-theme";
import type { DnaMechanismPresentationRoute } from "./DnaMechanismPresentationRouter";

export function DnaMechanismPresentationView({
  route,
  theme,
  visualTemplate,
}: {
  route: DnaMechanismPresentationRoute;
  theme: SpatialRaviaTheme;
  visualTemplate?: DnaVisualTemplate;
}) {
  const localSubject = route.localChemistrySubject;
  return (
    <section
      aria-label={`DNA mechanism: ${route.family}`}
      data-dna-mechanism-family={route.family}
      data-dna-mechanism-owner={route.owner}
      data-dna-mechanism-camera={route.plan.cameraIntent}
      data-dna-mechanism-labels={route.plan.requiredLabels.join(",")}
      data-dna-mechanism-interactions={route.plan.highlightedInteractions.join(",")}
    >
      {localSubject ? (
        <DnaLocalChemistryView subject={localSubject} theme={theme} />
      ) : (
        <DnaMolecularView embedded theme={theme} visualTemplate={visualTemplate} />
      )}
    </section>
  );
}

