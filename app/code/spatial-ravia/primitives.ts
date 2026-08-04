export type Coord = number | { base: number; progress: number };

export type PrimitiveKind =
  | "strand"
  | "molecular-complex"
  | "particle"
  | "membrane"
  | "compartment"
  | "connector"
  | "directional-arrow"
  | "field"
  | "surface"
  | "label"
  | "annotation"
  | "timeline-event"
  | "graph-node"
  | "graph-edge";

export type PrimitiveGeometryType =
  | "path"
  | "polyline"
  | "line"
  | "rect"
  | "circle"
  | "ellipse"
  | "polygon"
  | "text"
  | "area"
  | "node"
  | "edge"
  | "event";

export type PrimitiveStyleToken =
  | "primary"
  | "secondary"
  | "muted"
  | "guide"
  | "accent"
  | "warning"
  | "surface"
  | "field";

export type PrimitiveClassification = "literal" | "schematic" | "mixed";

export type PrimitiveVisibility = {
  mode: "always" | "labels" | "directionality" | "intervention";
  interventions?: string[];
};

export type PrimitiveSelectableState = {
  enabled: boolean;
  selected?: boolean;
};

export type PrimitiveTransform = {
  translate?: [Coord, Coord];
  rotate?: Coord;
  scale?: Coord;
};

export type PrimitiveAnimationBinding = {
  property:
    | "x"
    | "y"
    | "x1"
    | "x2"
    | "cx"
    | "points"
    | "path"
    | "opacity"
    | "transform";
  parameter: string;
};

export type PrimitiveLabel = {
  text: string;
  at: [Coord, Coord];
  visibility?: PrimitiveVisibility;
};

export type PrimitiveProvenance = {
  sourceId: string;
  note: string;
};

export type PrimitiveBase = {
  id: string;
  kind: PrimitiveKind;
  entityId?: string;
  geometryType: PrimitiveGeometryType;
  semanticRole: string;
  styleToken: PrimitiveStyleToken;
  transform: PrimitiveTransform;
  visibility: PrimitiveVisibility;
  selectable: PrimitiveSelectableState;
  animationBindings: PrimitiveAnimationBinding[];
  labels: PrimitiveLabel[];
  provenance: PrimitiveProvenance[];
  classification: PrimitiveClassification;
};

export type StrandPrimitive = PrimitiveBase & {
  kind: "strand";
  geometryType: "path" | "polyline";
  geometry: { d: (progress: number) => string };
};

export type MolecularComplexPrimitive = PrimitiveBase & {
  kind: "molecular-complex";
  geometryType: "circle" | "rect" | "polygon";
  geometry:
    | { cx: Coord; cy: Coord; r: Coord }
    | { x: Coord; y: Coord; width: Coord; height: Coord }
    | { points: Array<[Coord, Coord]> };
};

export type ParticlePrimitive = PrimitiveBase & {
  kind: "particle";
  geometryType: "circle";
  geometry: { cx: Coord; cy: Coord; r: Coord };
};

export type MembranePrimitive = PrimitiveBase & {
  kind: "membrane";
  geometryType: "path" | "area";
  geometry: { d: (progress: number) => string };
};

export type CompartmentPrimitive = PrimitiveBase & {
  kind: "compartment";
  geometryType: "rect" | "ellipse";
  geometry:
    | { x: Coord; y: Coord; width: Coord; height: Coord }
    | { cx: Coord; cy: Coord; rx: Coord; ry: Coord };
};

export type ConnectorPrimitive = PrimitiveBase & {
  kind: "connector";
  geometryType: "line" | "path";
  geometry:
    | { x1: Coord; y1: Coord; x2: Coord; y2: Coord }
    | { d: (progress: number) => string };
};

export type DirectionalArrowPrimitive = PrimitiveBase & {
  kind: "directional-arrow";
  geometryType: "line" | "path";
  geometry:
    | { x1: Coord; y1: Coord; x2: Coord; y2: Coord }
    | { d: (progress: number) => string };
};

export type FieldPrimitive = PrimitiveBase & {
  kind: "field";
  geometryType: "area";
  geometry: { d: (progress: number) => string };
};

export type SurfacePrimitive = PrimitiveBase & {
  kind: "surface";
  geometryType: "polygon" | "rect";
  geometry:
    | { points: Array<[Coord, Coord]> }
    | { x: Coord; y: Coord; width: Coord; height: Coord };
};

export type LabelPrimitive = PrimitiveBase & {
  kind: "label";
  geometryType: "text";
  geometry: { x: Coord; y: Coord; text: string };
};

export type AnnotationPrimitive = PrimitiveBase & {
  kind: "annotation";
  geometryType: "text" | "path";
  geometry: { x: Coord; y: Coord; text: string } | { d: (progress: number) => string };
};

export type TimelineEventPrimitive = PrimitiveBase & {
  kind: "timeline-event";
  geometryType: "event";
  geometry: { time: number; lane: number; label: string };
};

export type GraphNodePrimitive = PrimitiveBase & {
  kind: "graph-node";
  geometryType: "node";
  geometry: { x: Coord; y: Coord; radius: Coord; label: string };
};

export type GraphEdgePrimitive = PrimitiveBase & {
  kind: "graph-edge";
  geometryType: "edge";
  geometry: { x1: Coord; y1: Coord; x2: Coord; y2: Coord; label?: string };
};

export type ScientificPrimitive =
  | StrandPrimitive
  | MolecularComplexPrimitive
  | ParticlePrimitive
  | MembranePrimitive
  | CompartmentPrimitive
  | ConnectorPrimitive
  | DirectionalArrowPrimitive
  | FieldPrimitive
  | SurfacePrimitive
  | LabelPrimitive
  | AnnotationPrimitive
  | TimelineEventPrimitive
  | GraphNodePrimitive
  | GraphEdgePrimitive;

export function resolveCoord(coord: Coord, progress: number) {
  return typeof coord === "number" ? coord : coord.base + coord.progress * progress;
}

export function primitiveBase<
  const T extends Omit<
    PrimitiveBase,
    "transform" | "visibility" | "selectable" | "animationBindings" | "labels" | "provenance"
  > &
    Partial<
      Pick<
        PrimitiveBase,
        "transform" | "visibility" | "selectable" | "animationBindings" | "labels" | "provenance"
      >
    >
>(
  input: T
): T & Pick<PrimitiveBase, "transform" | "visibility" | "selectable" | "animationBindings" | "labels" | "provenance"> {
  return {
    ...input,
    transform: input.transform ?? {},
    visibility: input.visibility ?? { mode: "always" },
    selectable: input.selectable ?? { enabled: Boolean(input.entityId) },
    animationBindings: input.animationBindings ?? [],
    labels: input.labels ?? [],
    provenance: input.provenance ?? []
  } as T & Pick<PrimitiveBase, "transform" | "visibility" | "selectable" | "animationBindings" | "labels" | "provenance">;
}

export function validatePrimitive(primitive: ScientificPrimitive) {
  const errors: string[] = [];

  if (!primitive.id) {
    errors.push("primitive id is required");
  }

  if (!primitive.kind) {
    errors.push("primitive kind is required");
  }

  if (!primitive.geometryType) {
    errors.push("primitive geometryType is required");
  }

  if (!primitive.semanticRole) {
    errors.push("primitive semanticRole is required");
  }

  if (!primitive.styleToken) {
    errors.push("primitive styleToken is required");
  }

  if (!primitive.visibility?.mode) {
    errors.push("primitive visibility mode is required");
  }

  if (!primitive.selectable) {
    errors.push("primitive selectable state is required");
  }

  if (!primitive.classification) {
    errors.push("primitive classification is required");
  }

  if (!("geometry" in primitive)) {
    errors.push("primitive geometry is required");
  }

  return { valid: errors.length === 0, errors };
}

export const primitiveGalleryPrimitives: ScientificPrimitive[] = [
  {
    ...primitiveBase({
      id: "gallery-strand",
      kind: "strand",
      geometryType: "path",
      semanticRole: "polymer path",
      styleToken: "primary",
      classification: "schematic",
      labels: [{ text: "strand", at: [36, 42] }]
    }),
    geometry: { d: () => "M24 70 C70 20 120 120 176 58" }
  },
  {
    ...primitiveBase({
      id: "gallery-complex",
      kind: "molecular-complex",
      geometryType: "polygon",
      semanticRole: "assembled complex",
      styleToken: "accent",
      classification: "schematic",
      labels: [{ text: "complex", at: [224, 42] }]
    }),
    geometry: { points: [[230, 74], [260, 36], [304, 74], [260, 112]] }
  },
  {
    ...primitiveBase({
      id: "gallery-particle",
      kind: "particle",
      geometryType: "circle",
      semanticRole: "discrete object",
      styleToken: "secondary",
      classification: "schematic",
      labels: [{ text: "particle", at: [374, 42] }]
    }),
    geometry: { cx: 404, cy: 76, r: 22 }
  },
  {
    ...primitiveBase({
      id: "gallery-membrane",
      kind: "membrane",
      geometryType: "path",
      semanticRole: "boundary layer",
      styleToken: "muted",
      classification: "schematic",
      labels: [{ text: "membrane", at: [36, 166] }]
    }),
    geometry: { d: () => "M24 200 C72 168 116 232 178 194" }
  },
  {
    ...primitiveBase({
      id: "gallery-compartment",
      kind: "compartment",
      geometryType: "rect",
      semanticRole: "bounded region",
      styleToken: "surface",
      classification: "schematic",
      labels: [{ text: "compartment", at: [224, 166] }]
    }),
    geometry: { x: 226, y: 178, width: 90, height: 58 }
  },
  {
    ...primitiveBase({
      id: "gallery-connector",
      kind: "connector",
      geometryType: "line",
      semanticRole: "relationship",
      styleToken: "guide",
      classification: "schematic",
      labels: [{ text: "connector", at: [374, 166] }]
    }),
    geometry: { x1: 374, y1: 210, x2: 470, y2: 184 }
  },
  {
    ...primitiveBase({
      id: "gallery-arrow",
      kind: "directional-arrow",
      geometryType: "line",
      semanticRole: "directional change",
      styleToken: "primary",
      classification: "schematic",
      labels: [{ text: "arrow", at: [36, 290] }]
    }),
    geometry: { x1: 34, y1: 326, x2: 158, y2: 326 }
  },
  {
    ...primitiveBase({
      id: "gallery-field",
      kind: "field",
      geometryType: "area",
      semanticRole: "continuous field",
      styleToken: "field",
      classification: "schematic",
      labels: [{ text: "field", at: [224, 290] }]
    }),
    geometry: { d: () => "M226 326 C254 294 286 294 318 326 C286 358 254 358 226 326Z" }
  },
  {
    ...primitiveBase({
      id: "gallery-surface",
      kind: "surface",
      geometryType: "polygon",
      semanticRole: "surface",
      styleToken: "surface",
      classification: "schematic",
      labels: [{ text: "surface", at: [374, 290] }]
    }),
    geometry: { points: [[376, 342], [424, 304], [478, 324], [430, 362]] }
  },
  {
    ...primitiveBase({
      id: "gallery-label",
      kind: "label",
      geometryType: "text",
      semanticRole: "label",
      styleToken: "primary",
      classification: "schematic"
    }),
    geometry: { x: 36, y: 452, text: "label" }
  },
  {
    ...primitiveBase({
      id: "gallery-annotation",
      kind: "annotation",
      geometryType: "text",
      semanticRole: "annotation",
      styleToken: "muted",
      classification: "schematic"
    }),
    geometry: { x: 224, y: 452, text: "annotation" }
  },
  {
    ...primitiveBase({
      id: "gallery-timeline-event",
      kind: "timeline-event",
      geometryType: "event",
      semanticRole: "time marker",
      styleToken: "accent",
      classification: "schematic"
    }),
    geometry: { time: 0.62, lane: 0, label: "event" }
  },
  {
    ...primitiveBase({
      id: "gallery-graph-node",
      kind: "graph-node",
      geometryType: "node",
      semanticRole: "graph vertex",
      styleToken: "primary",
      classification: "schematic"
    }),
    geometry: { x: 376, y: 452, radius: 20, label: "node" }
  },
  {
    ...primitiveBase({
      id: "gallery-graph-edge",
      kind: "graph-edge",
      geometryType: "edge",
      semanticRole: "graph edge",
      styleToken: "guide",
      classification: "schematic"
    }),
    geometry: { x1: 430, y1: 452, x2: 500, y2: 452, label: "edge" }
  }
];
