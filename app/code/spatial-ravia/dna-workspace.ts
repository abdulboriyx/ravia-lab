import type { SpatialSessionState } from "./model.ts";
import { startSessionFromPrompt } from "./model.ts";
import { processPacks } from "./process-registry.ts";

export type SpatialWorkspaceResult = {
  session: SpatialSessionState;
  unsupportedReason: string | null;
};

export const spatialWorkspacePacks = processPacks.filter((pack) =>
  ["eukaryotic-transcription", "action-potential", "two-body-orbit"].includes(pack.id)
);

export function startSpatialWorkspaceFromPrompt(
  current: SpatialSessionState,
  prompt: string
): SpatialWorkspaceResult {
  const next = startSessionFromPrompt(current, prompt, spatialWorkspacePacks);
  const lastSystemMessage = next.conversationHistory
    .filter((turn) => turn.role === "system")
    .at(-1)?.message ?? null;

  return {
    session: next,
    unsupportedReason: next.activeIntervention === "unsupported prompt" ? lastSystemMessage : null
  };
}
