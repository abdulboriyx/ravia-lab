import {
  BiologySceneSpecSchema,
  type BiologySceneSpec,
} from "./biology-scene-spec.ts";
import { normalizeBiologyPrompt } from "./biology-normalizer.ts";
import { detectBiologyContext } from "./biology-context.ts";

function dnaReplicationSynthesisScene(
  focus:
    | "polymerase"
    | "leading-strand"
    | "lagging-strand"
    | "okazaki-fragment"
    | "ligase"
    | "directionality"
): BiologySceneSpec {
  const entities: BiologySceneSpec["entities"] = [
    { id: "dna", name: "DNA replication fork", type: "dna" },
    { id: "polymerase", name: "DNA polymerase", type: "protein" },
    { id: "daughter-leading-strand", name: "growing leading daughter strand", type: "dna" },
    { id: "daughter-lagging-strand", name: "growing lagging daughter strand", type: "dna" },
    { id: "rna-primer-leading", name: "leading-strand RNA primer", type: "rna" },
    { id: "rna-primer-lagging", name: "lagging-strand RNA primers", type: "rna" },
    { id: "okazaki-fragment", name: "Okazaki fragment", type: "dna" },
  ];

  if (focus === "ligase") {
    entities.push({ id: "ligase", name: "DNA ligase", type: "protein" });
  }

  if (focus === "directionality") {
    entities.push(
      { id: "template-5-prime", name: "5' template end", type: "other" },
      { id: "template-3-prime", name: "3' template end", type: "other" }
    );
  }

  return BiologySceneSpecSchema.parse({
    intent: "mechanism",
    scale: "complex",
    entities,
    relations: [
      { subject: "polymerase", relation: "binds_to", object: "dna" },
      { subject: "daughter-leading-strand", relation: "extends_from", object: "rna-primer-leading" },
      { subject: "daughter-lagging-strand", relation: "extends_from", object: "rna-primer-lagging" },
      { subject: "rna-primer-leading", relation: "placed_on", object: "leading-template" },
      { subject: "rna-primer-lagging", relation: "placed_on", object: "lagging-template" },
      { subject: "okazaki-fragment", relation: "part_of", object: "daughter-lagging-strand" },
      ...(focus === "leading-strand"
        ? [{ subject: "daughter-leading-strand", relation: "continuous_with", object: "fork" }]
        : []),
      ...(focus === "lagging-strand" || focus === "okazaki-fragment" || focus === "ligase"
        ? [{ subject: "okazaki-fragment", relation: "discontinuous_on", object: "lagging-template" }]
        : []),
      ...(focus === "ligase"
        ? [{ subject: "ligase", relation: "joins", object: "okazaki-fragment" }]
        : []),
      ...(focus === "directionality"
        ? [
            { subject: "daughter-leading-strand", relation: "direction", object: "5-to-3" },
            { subject: "daughter-lagging-strand", relation: "direction", object: "5-to-3" },
          ]
        : []),
    ],
    actions: [
      { actor: "polymerase", action: "synthesizes", target: "daughter-leading-strand" },
      { actor: "polymerase", action: "synthesizes", target: "daughter-lagging-strand" },
      ...(focus === "ligase"
        ? [{ actor: "ligase", action: "ligates", target: "okazaki-fragment" }]
        : []),
    ],
    renderMode: "mechanistic-3d",
  });
}

export function parseBiologyPrompt(prompt: string): BiologySceneSpec {
  const text = normalizeBiologyPrompt(prompt);
  const context = detectBiologyContext(prompt);

  // RPA bound to ssDNA
  if (
    text.includes("rpa") &&
    (text.includes("ssdna") || text.includes("single-stranded dna"))
  ) {
    return BiologySceneSpecSchema.parse({
      intent: "relation",
      scale: "complex",
      entities: [
        {
          id: "rpa",
          name: "RPA",
          type: "protein",
        },
        {
          id: "ssdna",
          name: "single-stranded DNA",
          type: "dna",
        },
      ],
      relations: [
        {
          subject: "rpa",
          relation: "binds_to",
          object: "ssdna",
        },
      ],
      actions: [],
      renderMode: "mechanistic-3d",
    });
  }

  // What keeps separated DNA strands stable/apart?
  if (
  text.includes("dna") &&
  (
    text.includes("keeps") ||
    text.includes("holds") ||
    text.includes("stabil")
  ) &&
  (
    text.includes("apart") ||
    text.includes("separated") ||
    text.includes("single-stranded")
  )
) {
  const stabilizer =
    context.organism === "bacterial"
      ? {
          id: "ssb",
          name: "Single-strand binding protein",
          type: "protein" as const,
        }
      : context.organism === "eukaryotic"
      ? {
          id: "rpa",
          name: "Replication Protein A",
          type: "protein" as const,
        }
      : {
          id: "ssdna-binding-protein",
          name: "ssDNA-binding protein",
          type: "protein" as const,
        };

  return BiologySceneSpecSchema.parse({
    intent: "relation",
    scale: "complex",
    entities: [
      {
        id: "dna",
        name: "DNA",
        type: "dna",
      },
      stabilizer,
    ],
    relations: [
      {
        subject: stabilizer.id,
        relation: "stabilizes",
        object: "dna",
      },
    ],
    actions: [],
    renderMode: "mechanistic-3d",
  });
}



  // Topoisomerase relative to helicase
  if (
  text.includes("topoisomerase") &&
  text.includes("helicase")
) {
  return BiologySceneSpecSchema.parse({
    intent: "relation",
    scale: "complex",

    entities: [
      {
        id: "dna",
        name: "DNA",
        type: "dna",
      },
      {
        id: "topoisomerase",
        name: "Topoisomerase",
        type: "protein",
      },
      {
        id: "helicase",
        name: "Helicase",
        type: "protein",
      },
    ],

    relations: [
      {
        subject: "topoisomerase",
        relation: "acts_ahead_of",
        object: "helicase",
      },
    ],

    actions: [
      {
        actor: "helicase",
        action: "unwinds",
        target: "dna",
      },
    ],

    renderMode: "mechanistic-3d",
  });
}

  // Primase making RNA primer
 if (
  text.includes("primase") &&
  (
    text.includes("primer") ||
    text.includes("rna primer")
  )
) {
  return BiologySceneSpecSchema.parse({
    intent: "mechanism",
    scale: "complex",

    entities: [
      {
        id: "dna",
        name: "DNA",
        type: "dna",
      },
      {
        id: "primase",
        name: "Primase",
        type: "protein",
      },
      {
        id: "rna-primer",
        name: "RNA primer",
        type: "rna",
      },
    ],

    relations: [
  {
    subject: "primase",
    relation: "binds_to",
    object: "dna",
  },
  {
    subject: "rna-primer",
    relation: "attached_to",
    object: "dna",
  },
],

    actions: [
      {
        actor: "primase",
        action: "synthesizes",
        target: "rna-primer",
      },
    ],

    renderMode: "mechanistic-3d",
  });
}

  // DNA polymerase synthesis
  if (
    text.includes("polymerase") &&
    (
      text.includes("synthes") ||
      text.includes("making") ||
      text.includes("makes")
    )
  ) {
    return dnaReplicationSynthesisScene("polymerase");
  }

  if (text.includes("leading strand") && text.includes("synthesis")) {
    return dnaReplicationSynthesisScene("leading-strand");
  }

  if (text.includes("lagging strand") && text.includes("synthesis")) {
    return dnaReplicationSynthesisScene("lagging-strand");
  }

  if (text.includes("okazaki")) {
    if (
      text.includes("what") ||
      text.includes("joins") ||
      text.includes("ligates") ||
      text.includes("seal")
    ) {
      return dnaReplicationSynthesisScene("ligase");
    }

    return dnaReplicationSynthesisScene("okazaki-fragment");
  }

  if (text.includes("ligase") && text.includes("dna")) {
    return dnaReplicationSynthesisScene("ligase");
  }

  if (
    text.includes("5-prime") ||
    text.includes("3-prime") ||
    text.includes("direction")
  ) {
    return dnaReplicationSynthesisScene("directionality");
  }

  // Helicase acting on DNA
  if (
    text.includes("helicase") &&
    text.includes("dna")
  ) {
    return BiologySceneSpecSchema.parse({
      intent: "mechanism",
      scale: "complex",
      entities: [
        {
          id: "dna",
          name: "DNA",
          type: "dna",
        },
        {
          id: "helicase",
          name: "Helicase",
          type: "protein",
        },
      ],
      relations: [],
      actions: [
        {
          actor: "helicase",
          action: "unwinds",
          target: "dna",
        },
      ],
      renderMode: "mechanistic-3d",
    });
  }

  // Helicase by itself
  if (text.includes("helicase")) {
    return BiologySceneSpecSchema.parse({
      intent: "structure",
      scale: "molecular",
      entities: [
        {
          id: "helicase",
          name: "Helicase",
          type: "protein",
        },
      ],
      relations: [],
      actions: [],
      renderMode: "molecular-structure",
    });
  }

  // Topoisomerase by itself
  if (text.includes("topoisomerase")) {
    return BiologySceneSpecSchema.parse({
      intent: "structure",
      scale: "molecular",
      entities: [
        {
          id: "topoisomerase",
          name: "Topoisomerase",
          type: "protein",
        },
      ],
      relations: [],
      actions: [],
      renderMode: "molecular-structure",
    });
  }

  // Primase by itself
  if (text.includes("primase")) {
    return BiologySceneSpecSchema.parse({
      intent: "structure",
      scale: "molecular",
      entities: [
        {
          id: "primase",
          name: "Primase",
          type: "protein",
        },
      ],
      relations: [],
      actions: [],
      renderMode: "molecular-structure",
    });
  }

  // Polymerase by itself
  if (text.includes("polymerase")) {
    return BiologySceneSpecSchema.parse({
      intent: "structure",
      scale: "molecular",
      entities: [
        {
          id: "polymerase",
          name: "DNA polymerase",
          type: "protein",
        },
      ],
      relations: [],
      actions: [],
      renderMode: "molecular-structure",
    });
  }

  // RPA by itself
  if (text.includes("rpa")) {
    return BiologySceneSpecSchema.parse({
      intent: "structure",
      scale: "molecular",
      entities: [
        {
          id: "rpa",
          name: "RPA",
          type: "protein",
        },
      ],
      relations: [],
      actions: [],
      renderMode: "molecular-structure",
    });
  }

  // Generic DNA structure
  if (text.includes("dna")) {
    return BiologySceneSpecSchema.parse({
      intent: "structure",
      scale: "molecular",
      entities: [
        {
          id: "dna",
          name: "DNA",
          type: "dna",
        },
      ],
      relations: [],
      actions: [],
      renderMode: "molecular-structure",
    });
  }

  throw new Error("Unsupported biology prompt");
}
