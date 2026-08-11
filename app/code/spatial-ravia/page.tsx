"use client";

import { useState } from "react";

import MechanisticScene from "./MechanisticScene";
import { DnaMolecularView } from "./DnaMolecularView";
import { SpatialPromptDock } from "./SpatialPromptDock";
import { parseBiologyScenePrompt } from "./biology-parser";
import { chooseBiologyRenderer } from "./biology-renderer-router";

export default function Page() {
  const [prompt, setPrompt] = useState("show helicase opening DNA");
  const [submittedPrompt, setSubmittedPrompt] = useState(
    "show helicase opening DNA"
  );

  let scene = null;
  let renderer = null;
  let parseSource = null;
  let error: string | null = null;

  const result = parseBiologyScenePrompt(submittedPrompt);

  if (result.status === "supported") {
    scene = result.scene;
    parseSource = result.source;
    renderer = chooseBiologyRenderer(scene);
  } else {
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
    <main className="spatialRaviaWorkspace">
      <section
        className="spatialRaviaViewport"
        aria-label="Spatial Ravia visualization"
      >
        {!error && scene && renderer === "three" && (
          <MechanisticScene key={submittedPrompt} scene={scene} />
        )}

        {!error && renderer === "molstar" && <DnaMolecularView embedded />}

        {!error && renderer === "cell-context" && (
          <p className="spatialRaviaStatus">
            Cell-context rendering is not implemented yet.
          </p>
        )}

        {error && (
          <p role="status" className="spatialRaviaStatus">
            {error}
          </p>
        )}

        {!error && parseSource && (
          <p aria-label="Parser source" className="spatialRaviaParseSource">
            Parsed by {parseSource}
          </p>
        )}
      </section>

      <SpatialPromptDock
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={submitPrompt}
      />
    </main>
  );
}
