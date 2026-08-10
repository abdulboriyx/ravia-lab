"use client";

import { useState } from "react";

import MechanisticScene from "./MechanisticScene";
import { DnaMolecularView } from "./DnaMolecularView";
import { parseBiologyPrompt } from "./biology-prompt-parser";
import { chooseBiologyRenderer } from "./biology-renderer-router";

export default function Page() {
  const [prompt, setPrompt] = useState("show helicase opening DNA");
  const [submittedPrompt, setSubmittedPrompt] = useState(
    "show helicase opening DNA"
  );

  let scene = null;
  let renderer = null;
  let error: string | null = null;

  try {
    scene = parseBiologyPrompt(submittedPrompt);
    renderer = chooseBiologyRenderer(scene);
  } catch {
    error = "I cannot interpret this biology prompt yet.";
  }

  return (
    <main>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedPrompt(prompt);
        }}
        style={{
            display: "flex",
            gap: "12px",
            margin: "28px auto 18px",
            width: "min(900px, calc(100% - 40px))",
            padding: "16px",
            background: "#111",
            border: "1px solid #444",
          }}
      >
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe what you want to see..."
          style={{
            flex: 1,
            padding: "14px 16px",
            fontSize: "16px",
            background: "#fff",
            color: "#000",
            border: "1px solid #777",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "14px 20px",
            background: "#fff",
            color: "#000",
            border: "1px solid #777",
            cursor: "pointer",
          }}
        >
          Generate
        </button>
      </form>

      <section
  style={{
    width: "100%",
    minHeight: "700px",
    position: "relative",
    overflow: "hidden",
  }}
>
  {!error && scene && renderer === "three" && (
    <MechanisticScene scene={scene} />
  )}

  {!error && renderer === "molstar" && (
    <DnaMolecularView embedded />
  )}

  {!error && renderer === "cell-context" && (
    <p style={{ textAlign: "center" }}>
      Cell-context rendering is not implemented yet.
    </p>
  )}
</section>
    </main>
  );
}
