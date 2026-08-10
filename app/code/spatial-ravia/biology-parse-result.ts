import type { BiologySceneSpec } from "./biology-scene-spec.ts";

export type BiologyParseSource = "deterministic" | "semantic";

export type BiologyParseResult =
  | {
      status: "supported";
      scene: BiologySceneSpec;
      confidence: number;
      source: BiologyParseSource;
    }
  | {
      status: "unsupported";
      reason: string;
      confidence: number;
    };
