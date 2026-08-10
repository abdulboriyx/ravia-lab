import type { BiologySceneSpec } from "./biology-scene-spec.ts";

export type BiologyRenderer =
  | "molstar"
  | "three"
  | "cell-context";

export function chooseBiologyRenderer(
  scene: BiologySceneSpec
): BiologyRenderer {
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