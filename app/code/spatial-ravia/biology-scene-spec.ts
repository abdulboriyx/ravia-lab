import { z } from "zod";

export const BiologySceneSpecSchema = z.object({
  intent: z.enum([
    "structure",
    "mechanism",
    "relation",
    "process",
    "comparison",
  ]),

  scale: z.enum([
    "atomic",
    "molecular",
    "complex",
    "cellular",
  ]),

  entities: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum([
        "protein",
        "dna",
        "rna",
        "complex",
        "membrane",
        "organelle",
        "other",
      ]),
    })
  ),

  relations: z.array(
    z.object({
      subject: z.string(),
      relation: z.string(),
      object: z.string(),
    })
  ),

  actions: z.array(
    z.object({
      actor: z.string(),
      action: z.string(),
      target: z.string().optional(),
    })
  ),

  renderMode: z.enum([
    "molecular-structure",
    "mechanistic-3d",
    "cell-context",
  ]),
});

export type BiologySceneSpec =
  z.infer<typeof BiologySceneSpecSchema>;