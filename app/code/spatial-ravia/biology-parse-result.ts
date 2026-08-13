import type { BiologySceneSpec } from "./biology-scene-spec.ts";
import type { DnaPromptSelection } from "./biology-dna-prompt-intent.ts";

export type BiologyParseSource = "deterministic" | "semantic";

export type BiologyParseResult =
  | {
      status: "supported";
      scene: BiologySceneSpec;
      confidence: number;
      source: BiologyParseSource;
      /** Present only when the prompt asks for a DNA scene. */
      dnaSelection?: DnaPromptSelection;
    }
  | {
      status: "unsupported";
      reason: string;
      confidence: number;
    };
