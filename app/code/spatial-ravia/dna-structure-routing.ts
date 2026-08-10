import type {
  DnaTransformationState,
  StructureCameraPreset,
  StructureColorMode,
  StructureIsolationMode,
  StructureSource,
  StructureViewMode
} from "./DnaMolecularView";

export type SpatialSceneCommand = {
  kind: "SHOW_STRUCTURE";
  prompt: string;
  source: StructureSource;
  viewMode: StructureViewMode;
  colorMode: StructureColorMode;
  isolationMode: StructureIsolationMode;
  focusedBasePair: number;
  bubbleProgress: number;
  transformation: DnaTransformationState;
  cameraPreset: StructureCameraPreset;
};

export type PromptResolution =
  | { supported: true; command: SpatialSceneCommand }
  | { supported: false; reason: string };

export function parseSpatialScenePrompt(prompt: string): PromptResolution {
  const normalized = prompt.trim().toLowerCase();
  const words = new Set(normalized.split(/[^a-z0-9']+/).filter(Boolean));

  if (!isDnaStructurePrompt(normalized, words)) {
    return {
      supported: false,
      reason: "Spatial Ravia no longer supports schematic biological process simulations."
    };
  }

  const requestedBasePairs = readBasePairCount(normalized);
  const transformation = resolveTransformation(normalized, words, requestedBasePairs);
  const source: StructureSource =
    words.has("ideal") ||
    words.has("idealized") ||
    requestedBasePairs > 0 ||
    hasActiveTransformation(transformation)
      ? "idealized"
      : "experimental";
  const viewMode: StructureViewMode = words.has("atomic")
    ? "atomic"
    : normalized.includes("ball") || normalized.includes("stick")
      ? "ball-stick"
      : "cartoon";
  const colorMode: StructureColorMode = words.has("element")
    ? "element"
    : words.has("strand")
      ? "strand"
      : words.has("backbone")
        ? "backbone"
        : "base";
  const isolationMode = resolvePromptIsolation(normalized, words, requestedBasePairs);
  const focusedBasePair = readBasePairPosition(normalized) ?? 1;
  const bubbleProgress = requestedBasePairs > 0 ? Math.min(1, requestedBasePairs / 6) : 0;
  const cameraPreset: StructureCameraPreset = words.has("groove")
    ? "groove"
    : isolationMode === "base-pair"
      ? "base-pair"
      : "reset";

  return {
    supported: true,
    command: {
      kind: "SHOW_STRUCTURE",
      prompt,
      source,
      viewMode: isolationMode === "base-pair" ? "ball-stick" : viewMode,
      colorMode,
      isolationMode,
      focusedBasePair,
      bubbleProgress,
      transformation,
      cameraPreset
    }
  };
}

function isDnaStructurePrompt(normalized: string, words: Set<string>) {
  if (!normalized) {
    return false;
  }

  const mentionsDna =
    words.has("dna") ||
    normalized.includes("b-dna") ||
    normalized.includes("bdna") ||
    normalized.includes("double helix") ||
    normalized.includes("double-helix") ||
    normalized.includes("helix");
  const structureIntent =
    words.has("structure") ||
    words.has("show") ||
    words.has("visualize") ||
    words.has("view") ||
    words.has("display") ||
    normalized.includes("double helix") ||
    normalized.includes("b-dna") ||
    normalized.includes("bdna");
  const processIntent =
    normalized.includes("transcription") ||
    normalized.includes("replication") ||
    normalized.includes("replication fork") ||
    normalized.includes("action potential") ||
    normalized.includes("orbit");

  return mentionsDna && structureIntent && !processIntent;
}

function resolveTransformation(
  normalized: string,
  words: Set<string>,
  requestedBasePairs: number
): DnaTransformationState {
  return {
    strandSeparation:
      normalized.includes("separate strand") || normalized.includes("separate the strand") || normalized.includes("split strand")
        ? 1
        : 0,
    bubbleBasePairs: requestedBasePairs,
    bend: words.has("bend") || words.has("bent") || normalized.includes("bend dna") ? 0.72 : 0,
    exposeBases:
      normalized.includes("expose base") || normalized.includes("show exposed base") || normalized.includes("flip base")
        ? 1
        : 0
  };
}

function hasActiveTransformation(transformation: DnaTransformationState) {
  return (
    transformation.strandSeparation > 0 ||
    transformation.bubbleBasePairs > 0 ||
    transformation.bend > 0 ||
    transformation.exposeBases > 0
  );
}

function resolvePromptIsolation(
  normalized: string,
  words: Set<string>,
  requestedBasePairs: number
): StructureIsolationMode {
  if (normalized.includes("hydrogen bond") || normalized.includes("h bond") || normalized.includes("h-bond")) {
    return "hydrogen-bonds";
  }

  if (normalized.includes("only backbone") || normalized.includes("backbone only") || words.has("backbone")) {
    return "backbone";
  }

  if (words.has("phosphate") || words.has("phosphates") || normalized.includes("highlight phosphate")) {
    return "phosphates";
  }

  if (words.has("sugar") || words.has("sugars")) {
    return "sugars";
  }

  if (words.has("bases") || normalized.includes("only base")) {
    return "bases";
  }

  if (normalized.includes("strand a") || normalized.includes("chain a")) {
    return "strand-a";
  }

  if (normalized.includes("strand b") || normalized.includes("chain b")) {
    return "strand-b";
  }

  if (
    normalized.includes("step through base") ||
    normalized.includes("step through nucleotide") ||
    normalized.includes("complementary partner") ||
    normalized.includes("pairing partner") ||
    normalized.includes("base pair partner")
  ) {
    return "base-pair";
  }

  if (requestedBasePairs > 0 && !normalized.includes("open")) {
    return "base-pair";
  }

  return "all";
}

function readBasePairCount(normalized: string) {
  if (!normalized.includes("open")) {
    return 0;
  }

  const numeric = normalized.match(/open\s+(\d+)\s+(?:base\s*)?pairs?/);
  if (numeric) {
    return Number(numeric[1]);
  }

  const wordNumber = normalized.match(/open\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:base\s*)?pairs?/);
  return wordNumber ? wordToNumber(wordNumber[1]) : 0;
}

function readBasePairPosition(normalized: string) {
  const numeric = normalized.match(/(?:base\s*pair|bp|base|nucleotide)\s+(\d+)/);
  if (numeric) {
    return Math.min(10, Math.max(1, Number(numeric[1])));
  }

  return undefined;
}

function wordToNumber(word: string) {
  switch (word) {
    case "one":
      return 1;
    case "two":
      return 2;
    case "three":
      return 3;
    case "four":
      return 4;
    case "five":
      return 5;
    case "six":
      return 6;
    case "seven":
      return 7;
    case "eight":
      return 8;
    case "nine":
      return 9;
    case "ten":
      return 10;
    default:
      return 0;
  }
}
