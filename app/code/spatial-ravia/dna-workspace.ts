import { dnaReplicationPack } from "./dna-process.ts";
import type { SpatialSessionState } from "./model.ts";
import { startSessionFromPrompt } from "./model.ts";
import { processPacks } from "./process-registry.ts";

export type DnaWorkspaceResult = {
  session: SpatialSessionState;
  unsupportedReason: string | null;
};

export const dnaWorkspacePacks = processPacks.filter((pack) => pack.id === dnaReplicationPack.id);

export function startDnaWorkspaceFromPrompt(
  current: SpatialSessionState,
  prompt: string
): DnaWorkspaceResult {
  const next = startSessionFromPrompt(current, prompt, dnaWorkspacePacks);
  const lastSystemMessage = next.conversationHistory
    .filter((turn) => turn.role === "system")
    .at(-1)?.message ?? null;

  return {
    session: next,
    unsupportedReason: next.activeIntervention === "unsupported prompt" ? lastSystemMessage : null
  };
}
