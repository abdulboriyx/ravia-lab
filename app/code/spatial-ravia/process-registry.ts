import { actionPotentialPack } from "./action-potential-process.ts";
import { dnaReplicationPack } from "./dna-process.ts";
import type { PhenomenonPack } from "./model.ts";
import { eukaryoticTranscriptionPack } from "./transcription-process.ts";

export const phenomenonPacks: PhenomenonPack[] = [
  dnaReplicationPack,
  eukaryoticTranscriptionPack,
  actionPotentialPack
];

export const processPacks = phenomenonPacks;

export const initialExamples = processPacks.flatMap((pack) => pack.examples.slice(0, 2)).slice(0, 6);
