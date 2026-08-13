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

  // Sequence features belong to the DNA presentation model. They are ranges
  // on DNA, not independent floating molecular actors.
  dnaRegions: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["enhancer", "promoter", "gene", "terminator"]),
      label: z.string().optional(),
      center: z.number().finite().optional(),
      width: z.number().positive().finite().optional(),
    })
  ).optional(),

  renderMode: z.enum([
    "molecular-structure",
    "mechanistic-3d",
    "cell-context",
  ]),

  temporal: z
    .object({
      currentPhase: z.string(),
      phases: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          order: z.number(),
          durationMs: z.number().positive().optional(),
          states: z.record(z.string(), z.string()),
          voltage: z.string().optional(),
          dominantFlux: z.string().optional(),
        })
      ),
    })
    .optional(),
});

export type BiologySceneSpec =
  z.infer<typeof BiologySceneSpecSchema>;
