import { dnaReplicationPack } from "./dna-process.ts";
import { eukaryoticTranscriptionPack } from "./transcription-process.ts";

export const processPacks = [dnaReplicationPack, eukaryoticTranscriptionPack];

export const initialExamples = processPacks.flatMap((pack) => pack.examples.slice(0, 2)).slice(0, 4);
