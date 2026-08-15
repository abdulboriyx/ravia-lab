"use client";

import { useSyncExternalStore, useState } from "react";

import MechanisticScene from "./MechanisticScene";
import { DnaMolecularView } from "./DnaMolecularView";
import { DnaPackagingView } from "./DnaPackagingView";
import { DnaLocalChemistryView } from "./DnaLocalChemistryView";
import { SpatialPromptDock } from "./SpatialPromptDock";
import { parseBiologyScenePrompt } from "./biology-parser";
import { chooseBiologyRenderer } from "./biology-renderer-router";
import { resolveDnaTemplateRendererOwner, resolveDnaVisualTemplate } from "./biology-dna-visual-dispatcher";
import { DnaMechanismPresentationView } from "./DnaMechanismPresentationView";
import { resolveDnaMechanismPresentation } from "./DnaMechanismPresentationRouter";
import { resolveRnaPresentation } from "./RnaPresentationRouter";
import { RnaPresentationView } from "./RnaPresentationView";
import { normalizeSpatialRaviaTheme, spatialRaviaThemeStorageKey, type SpatialRaviaTheme } from "./spatial-ravia-theme";

const spatialRaviaThemeChangeEvent = "spatial-ravia-theme-change";

function subscribeToSpatialRaviaTheme(onStoreChange: () => void) {
  window.addEventListener(spatialRaviaThemeChangeEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(spatialRaviaThemeChangeEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readSpatialRaviaTheme(): SpatialRaviaTheme {
  return normalizeSpatialRaviaTheme(window.localStorage.getItem(spatialRaviaThemeStorageKey));
}

export default function Page() {
  const [prompt, setPrompt] = useState("show helicase opening DNA");
  const [submittedPrompt, setSubmittedPrompt] = useState(
    "show helicase opening DNA"
  );
  const theme = useSyncExternalStore<SpatialRaviaTheme>(
    subscribeToSpatialRaviaTheme,
    readSpatialRaviaTheme,
    () => "light"
  );

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(spatialRaviaThemeStorageKey, next);
    window.dispatchEvent(new Event(spatialRaviaThemeChangeEvent));
  };

  let scene = null;
  let renderer = null;
  let dnaTemplate = null;
  let parseSource = null;
  let error: string | null = null;

  const rnaPresentationRoute = resolveRnaPresentation(submittedPrompt);
  const result = rnaPresentationRoute ? null : parseBiologyScenePrompt(submittedPrompt);
  const dnaMechanismRoute = resolveDnaMechanismPresentation(submittedPrompt);

  if (result?.status === "supported") {
    scene = result.scene;
    parseSource = result.source;
    dnaTemplate = resolveDnaVisualTemplate(scene, result.dnaSelection);
    renderer = chooseBiologyRenderer(scene, dnaTemplate);
  } else if (!rnaPresentationRoute && result) {
    error = result.reason;
  }

  const submitPrompt = () => {
    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length === 0) {
      return;
    }

    setSubmittedPrompt(trimmedPrompt);
  };

  return (
    <main className="spatialRaviaWorkspace" data-spatial-theme={theme}>
      <section
        className="spatialRaviaViewport"
        aria-label="Spatial Ravia visualization"
      >
        {!error && !rnaPresentationRoute && dnaMechanismRoute && (
          <DnaMechanismPresentationView route={dnaMechanismRoute} theme={theme} visualTemplate={dnaTemplate ?? undefined} />
        )}

        {!error && rnaPresentationRoute && <RnaPresentationView route={rnaPresentationRoute} theme={theme} />}

        {!error && !rnaPresentationRoute && !dnaMechanismRoute && scene && renderer === "three" && (
          <MechanisticScene key={submittedPrompt} scene={scene} theme={theme} />
        )}

        {!error && !rnaPresentationRoute && !dnaMechanismRoute && renderer === "molstar" && <DnaMolecularView embedded theme={theme} />}

        {!error && !rnaPresentationRoute && !dnaMechanismRoute && scene && renderer === "dna-template" && dnaTemplate && (
          resolveDnaTemplateRendererOwner(dnaTemplate) === "mechanistic-dna"
            ? <MechanisticScene key={`dna-${dnaTemplate.templateId}-${submittedPrompt}`} scene={scene} theme={theme} />
            : resolveDnaTemplateRendererOwner(dnaTemplate) === "packaging"
              ? <DnaPackagingView key={`dna-${dnaTemplate.templateId}-${submittedPrompt}`} prompt={submittedPrompt} theme={theme} />
              : resolveDnaTemplateRendererOwner(dnaTemplate) === "local-chemistry"
                ? <DnaLocalChemistryView key={`dna-${dnaTemplate.templateId}-${submittedPrompt}`} subject={dnaTemplate.localChemistrySubject ?? (dnaTemplate.family === "damageRepair" ? "mismatch" : "gc-base-pair")} theme={theme} />
                : <DnaMolecularView key={`dna-${dnaTemplate.templateId}-${submittedPrompt}`} embedded theme={theme} visualTemplate={dnaTemplate} regulationPrompt={submittedPrompt} />
        )}

        {!error && !rnaPresentationRoute && renderer === "cell-context" && (
          <p className="spatialRaviaStatus">
            Cell-context rendering is not implemented yet.
          </p>
        )}

        {error && (
          <p role="status" className="spatialRaviaStatus">
            {error}
          </p>
        )}

        {!error && !rnaPresentationRoute && parseSource && (
          <p aria-label="Parser source" className="spatialRaviaParseSource">
            Parsed by {parseSource}
          </p>
        )}
      </section>

      <button type="button" className="spatialRaviaThemeToggle" onClick={toggleTheme}
        aria-label={theme === "light" ? "Switch to dark background" : "Switch to light background"}
        aria-pressed={theme === "dark"} title={theme === "light" ? "Switch to dark background" : "Switch to light background"}>
        {theme === "light" ? "DARK" : "LIGHT"}
      </button>

      <SpatialPromptDock
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={submitPrompt}
      />
    </main>
  );
}
