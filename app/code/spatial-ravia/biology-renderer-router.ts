import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { DnaVisualTemplate } from "./biology-dna-visual-dispatcher.ts";

export type BiologyRenderer =
  | "molstar"
  | "three"
  | "cell-context"
  | "dna-template";

export function chooseBiologyRenderer(
  scene: BiologySceneSpec,
  dnaTemplate?: DnaVisualTemplate,
): BiologyRenderer {
  // DNA templates are resolved before legacy render-mode ownership. This
  // prevents an otherwise generic mechanism scene from becoming RNAP/fork
  // context merely because a legacy renderer sees a broad entity name.
  if (dnaTemplate) return "dna-template";
  if (scene.renderMode === "molecular-structure") {
    return "molstar";
  }

  if (scene.renderMode === "mechanistic-3d") {
    return "three";
  }

  if (scene.renderMode === "cell-context") {
    return "cell-context";
  }

  throw new Error(`Unsupported render mode: ${scene.renderMode}`);
}
