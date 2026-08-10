import OpenAI from "openai";
import {
  BiologySceneSpecSchema,
  type BiologySceneSpec,
} from "./biology-scene-spec";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseBiologyPromptWithAI(
  prompt: string
): Promise<BiologySceneSpec> {
  const response = await openai.responses.create({
    model: "gpt-5-mini",

    input: `
You convert cell-biology requests into structured biological scene descriptions.

Interpret the user's biological meaning, not just keywords.

User request:
"${prompt}"

Return ONLY JSON matching this structure:

{
  "intent": "structure | mechanism | relation | process | comparison",
  "scale": "atomic | molecular | complex | cellular",
  "entities": [
    {
      "id": "string",
      "name": "string",
      "type": "protein | dna | rna | complex | membrane | organelle | other"
    }
  ],
  "relations": [
    {
      "subject": "entity id",
      "relation": "string",
      "object": "entity id"
    }
  ],
  "actions": [
    {
      "actor": "entity id",
      "action": "string",
      "target": "entity id"
    }
  ],
  "renderMode": "molecular-structure | mechanistic-3d | cell-context"
}

Use biologically meaningful canonical names.
`,
  });

  const raw = response.output_text;

  const parsed = JSON.parse(raw);

  return BiologySceneSpecSchema.parse(parsed);
}