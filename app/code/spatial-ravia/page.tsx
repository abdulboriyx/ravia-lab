"use client";

import { useSyncExternalStore, useState } from "react";
import { applyScinaTheme, readScinaTheme, subscribeToScinaTheme, type ScinaTheme } from "@/app/scina-theme";

import MechanisticScene from "./MechanisticScene";
import { DnaMolecularView } from "./DnaMolecularView";
import { DnaPackagingView } from "./DnaPackagingView";
import { DnaLocalChemistryView } from "./DnaLocalChemistryView";
import { SpatialPromptDock } from "./SpatialPromptDock";
import { resolveDnaTemplateRendererOwner } from "./biology-dna-visual-dispatcher";
import { DnaMechanismPresentationView } from "./DnaMechanismPresentationView";
import { ProductionRoutingStatus } from "./ProductionRoutingStatus";
import { CellularProductionOwnerView } from "./CellularProductionOwnerView";
import { RnaPresentationView } from "./RnaPresentationView";
import { resolveScinaRequest } from "./scina-request-resolver";

export default function Page() {
  const [prompt, setPrompt] = useState("show helicase opening DNA");
  const [submittedPrompt, setSubmittedPrompt] = useState(
    "show helicase opening DNA"
  );
  const theme = useSyncExternalStore<ScinaTheme>(
    subscribeToScinaTheme,
    readScinaTheme,
    () => "dark"
  );

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    applyScinaTheme(next, true);
  };

  const resolved = resolveScinaRequest(submittedPrompt);
  const route = resolved.route;

  const submitPrompt = () => {
    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length === 0) {
      return;
    }

    setSubmittedPrompt(trimmedPrompt);
  };

  return (
    <main
      className="spatialRaviaWorkspace"
      data-spatial-theme={theme}
      data-scina-domain={resolved.request.domain}
      data-scina-organism={resolved.request.organism}
      data-scina-capability={resolved.request.capabilityId}
      data-scina-identity={resolved.request.identity.polymeraseClass ?? resolved.request.identity.entity}
      data-scina-owner={resolved.request.owner.production}
      data-scina-renderer={resolved.request.renderer}
      data-scina-fidelity={resolved.request.fidelity}
    >
      <header className="scinaWorkspaceHeader" aria-label="Scina workspace header">
        <div className="scinaWorkspaceBrand">
          <span className="scinaMark" aria-hidden="true"><i /><i /><i /></span>
          <div>
            <strong>Scina</strong>
            <span>Interactive molecular notebook</span>
          </div>
        </div>
        <div className="scinaWorkspaceMeta">
          <span className="scinaLiveIndicator"><i aria-hidden="true" /> Live local</span>
          <span>{resolved.request.domain}{resolved.request.identity.polymeraseClass ? ` / ${resolved.request.identity.polymeraseClass}` : ""} · {resolved.request.renderer}</span>
        </div>
      </header>

      <section
        className="spatialRaviaViewport"
        aria-label="Scina visualization"
      >
        {route.kind === "dna-mechanism" && <DnaMechanismPresentationView route={route.route} theme={theme} />}

        {route.kind === "rna" && <RnaPresentationView route={route.route} theme={theme} />}

        {route.kind === "cellular" && <CellularProductionOwnerView route={route.route} theme={theme} />}

        {route.kind === "dna-scene" && route.renderer === "three" && <MechanisticScene key={submittedPrompt} scene={route.scene} theme={theme} />}

        {route.kind === "dna-scene" && route.renderer === "molstar" && <DnaMolecularView embedded theme={theme} />}

        {route.kind === "dna-scene" && route.renderer === "dna-template" && (
          resolveDnaTemplateRendererOwner(route.template) === "mechanistic-dna"
            ? <MechanisticScene key={`dna-${route.template.templateId}-${submittedPrompt}`} scene={route.scene} theme={theme} />
            : resolveDnaTemplateRendererOwner(route.template) === "packaging"
              ? <DnaPackagingView key={`dna-${route.template.templateId}-${submittedPrompt}`} prompt={submittedPrompt} theme={theme} />
              : resolveDnaTemplateRendererOwner(route.template) === "local-chemistry"
                ? <DnaLocalChemistryView key={`dna-${route.template.templateId}-${submittedPrompt}`} subject={route.template.localChemistrySubject ?? (route.template.family === "damageRepair" ? "mismatch" : "gc-base-pair")} theme={theme} />
                : <DnaMolecularView key={`dna-${route.template.templateId}-${submittedPrompt}`} embedded theme={theme} visualTemplate={route.template} regulationPrompt={submittedPrompt} />
        )}

        {route.kind === "dna-scene" && route.renderer === "cell-context" && (
          <p className="spatialRaviaStatus">
            Cell-context rendering is not implemented yet.
          </p>
        )}

        {route.kind === "error" && <ProductionRoutingStatus route={route.route} />}

        {route.kind === "dna-scene" && route.parseSource && (
          <p aria-label="Parser source" className="spatialRaviaParseSource">
            Parsed by {route.parseSource}
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
