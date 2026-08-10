import {
  BiologySceneSpecSchema,
  type BiologySceneSpec,
} from "./biology-scene-spec.ts";
import { normalizeBiologyPrompt } from "./biology-normalizer.ts";
import { detectBiologyContext } from "./biology-context.ts";
import { dnaReplicationSynthesisScene } from "./biology-scene-builders.ts";

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
    !text.includes("rna") &&
    !text.includes("transcription") &&
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
    if (text.includes("rna") || text.includes("transcription")) {
      throw new Error("Unsupported biology prompt");
    }
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
    if (text.includes("rna") || text.includes("making")) {
      throw new Error("Unsupported biology prompt");
    }
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
    if (
      text.includes("rna") ||
      text.includes("transcription") ||
      text.includes("gene") ||
      text.includes("biology")
    ) {
      throw new Error("Unsupported biology prompt");
    }
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
  if (
    text.includes("dna") &&
    (
      text.includes("structure") ||
      text.includes("helix") ||
      text.includes("b-dna") ||
      text.includes("molecular") ||
      text.includes("model") ||
      /^show dna$/.test(text) ||
      /^visualize dna$/.test(text)
    ) &&
    !text.includes("replication") &&
    !text.includes("repair") &&
    !text.includes("protein")
  ) {
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
