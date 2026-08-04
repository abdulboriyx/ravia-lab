import type {
  RenderPlan,
  ScientificModel,
  ScientificState,
  SpatialSessionState
} from "./model.ts";
import type {
  Coord,
  PrimitiveClassification,
  PrimitiveGeometryType,
  PrimitiveKind,
  PrimitiveLayoutHint,
  PrimitiveLabel,
  PrimitiveProvenance,
  PrimitiveStyleToken,
  ScientificPrimitive
} from "./primitives.ts";
import { resolveCoord } from "./primitives.ts";

export type ResolvedPoint = [number, number];

export type ResolvedGeometry =
  | { type: "path"; d: string }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number }
  | { type: "rect"; x: number; y: number; width: number; height: number }
  | { type: "circle"; cx: number; cy: number; r: number }
  | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { type: "polygon"; points: ResolvedPoint[] }
  | { type: "text"; x: number; y: number; text: string }
  | { type: "timeline-event"; time: number; lane: number; label: string; x: number; y: number }
  | { type: "graph-node"; x: number; y: number; radius: number; label: string }
  | { type: "graph-edge"; x1: number; y1: number; x2: number; y2: number; label?: string };

export type ResolvedTransform = {
  translate?: [number, number];
  rotate?: number;
  scale?: number;
  svg: string;
};

export type CompiledSceneLabel = {
  id: string;
  primitiveId: string;
  entityId?: string;
  text: string;
  x: number;
  y: number;
  visible: boolean;
};

export type StageVisibility = {
  activeStageId: string | null;
  activeStageOrder: number | null;
  entityActiveInStage: boolean | null;
};

export type CompiledSceneNode = {
  id: string;
  primitiveId: string;
  entityId?: string;
  kind: PrimitiveKind;
  semanticRole: string;
  styleToken: PrimitiveStyleToken;
  classification: PrimitiveClassification;
  geometryType: PrimitiveGeometryType;
  geometry: ResolvedGeometry;
  transform: ResolvedTransform;
  visible: boolean;
  selectable: boolean;
  selected: boolean;
  isolated: boolean;
  hiddenReason: string | null;
  stageVisibility: StageVisibility;
  layout: PrimitiveLayoutHint | null;
  animationParameters: string[];
  labels: CompiledSceneLabel[];
  provenance: PrimitiveProvenance[];
};

export type SceneGroup = {
  id: string;
  entityIds: string[];
  nodeIds: string[];
};

export type SceneOverlay = {
  id: string;
  label: string;
  entityIds: string[];
  visible: boolean;
};

export type SceneCameraFocus = {
  targetEntityIds: string[];
  viewBox: string;
  reason: "selection" | "isolation" | "full-scene";
};

export type SceneTimeline = {
  progress: number;
  activeStageId: string | null;
  stages: Array<{
    id: string;
    label: string;
    order: number;
    active: boolean;
  }>;
};

export type CompiledScene = {
  id: string;
  title: string;
  subtitle: string;
  ariaLabel: string;
  viewBox: string;
  progress: number;
  nodes: CompiledSceneNode[];
  labels: CompiledSceneLabel[];
  groups: SceneGroup[];
  overlays: SceneOverlay[];
  camera: SceneCameraFocus;
  timeline: SceneTimeline;
  indicators: {
    literalCount: number;
    schematicCount: number;
    mixedCount: number;
    warning: string | null;
  };
};

export function compileSceneFromSession(session: SpatialSessionState): CompiledScene | null {
  if (!session.activeModel) {
    return null;
  }

  return compileScene(session.activeModel, session.activeModel.renderPlan, {
    progress: session.playback.timelinePosition,
    selectedEntityIds: session.selectedEntities,
    hiddenEntityIds: session.hiddenEntities,
    isolatedEntityId: session.isolatedEntity,
    activeIntervention: session.activeIntervention,
    showLabels: session.playback.showLabels,
    showDirectionality: session.playback.showDirectionality
  });
}

export function compileScene(
  model: ScientificModel,
  plan: RenderPlan,
  options: {
    progress: number;
    selectedEntityIds?: string[];
    hiddenEntityIds?: string[];
    isolatedEntityId?: string | null;
    activeIntervention?: string;
    showLabels?: boolean;
    showDirectionality?: boolean;
  }
): CompiledScene {
  const progress = clamp01(options.progress);
  const selected = new Set(options.selectedEntityIds ?? []);
  const hidden = new Set(options.hiddenEntityIds ?? []);
  const isolatedGroup = resolveIsolationGroup(plan, options.isolatedEntityId);
  const activeStage = resolveActiveStage(model.states, progress);
  const initialNodes = plan.primitives.map((primitive) =>
    compileSceneNode(primitive, model, plan, {
      progress,
      selected,
      hidden,
      isolatedGroup,
      isolatedEntityId: options.isolatedEntityId ?? null,
      activeIntervention: options.activeIntervention ?? "baseline",
      showLabels: options.showLabels ?? true,
      showDirectionality: options.showDirectionality ?? true,
      activeStage
    })
  );
  const nodes = applyRelativeAnchors(initialNodes, plan.primitives, progress);
  const labels = nodes.flatMap((node) => node.labels);
  const visibleNodes = nodes.filter((node) => node.visible);
  const groups = compileGroups(plan, nodes);
  const overlays = compileInterventionOverlays(model, options.activeIntervention ?? "baseline");
  const camera = compileCameraFocus(plan, visibleNodes, selected, isolatedGroup);
  const indicators = compileIndicators(nodes, model.scaleDistortions);

  return {
    id: plan.id,
    title: plan.title,
    subtitle: plan.subtitle,
    ariaLabel: plan.ariaLabel,
    viewBox: plan.viewBox,
    progress,
    nodes,
    labels,
    groups,
    overlays,
    camera,
    timeline: {
      progress,
      activeStageId: activeStage?.id ?? null,
      stages: model.states
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((stage) => ({
          id: stage.id,
          label: stage.label,
          order: stage.order,
          active: stage.id === activeStage?.id
        }))
    },
    indicators
  };
}

export function createSceneSnapshot(scene: CompiledScene) {
  return {
    id: scene.id,
    progress: round(scene.progress),
    activeStageId: scene.timeline.activeStageId,
    camera: scene.camera,
    visibleNodeIds: scene.nodes.filter((node) => node.visible).map((node) => node.id),
    selectedNodeIds: scene.nodes.filter((node) => node.selected).map((node) => node.id),
    isolatedNodeIds: scene.nodes.filter((node) => node.isolated).map((node) => node.id),
    overlays: scene.overlays.filter((overlay) => overlay.visible).map((overlay) => overlay.id),
    indicators: scene.indicators,
    geometry: scene.nodes.map((node) => ({
      id: node.id,
      visible: node.visible,
      selected: node.selected,
      isolated: node.isolated,
      geometry: snapshotGeometry(node.geometry),
      transform: node.transform.svg,
      labels: node.labels
        .filter((label) => label.visible)
        .map((label) => ({ text: label.text, x: round(label.x), y: round(label.y) }))
    }))
  };
}

function compileSceneNode(
  primitive: ScientificPrimitive,
  model: ScientificModel,
  plan: RenderPlan,
  context: {
    progress: number;
    selected: Set<string>;
    hidden: Set<string>;
    isolatedGroup: Set<string> | null;
    isolatedEntityId: string | null;
    activeIntervention: string;
    showLabels: boolean;
    showDirectionality: boolean;
    activeStage: ScientificState | null;
  }
): CompiledSceneNode {
  const visibility = resolveVisibility(primitive, plan, context);
  const entityId = primitive.entityId;
  const labels = primitive.labels.map((label) =>
    compileLabel(primitive, label, context.progress, {
      activeIntervention: context.activeIntervention,
      showLabels: context.showLabels,
      showDirectionality: context.showDirectionality
    })
  );

  return {
    id: primitive.id,
    primitiveId: primitive.id,
    entityId,
    kind: primitive.kind,
    semanticRole: primitive.semanticRole,
    styleToken: primitive.styleToken,
    classification: primitive.classification,
    geometryType: primitive.geometryType,
    geometry: resolveGeometry(primitive, context.progress),
    transform: resolveTransform(primitive.transform, context.progress),
    visible: visibility.visible,
    selectable: Boolean(entityId && primitive.selectable.enabled),
    selected: Boolean(entityId && context.selected.has(entityId)),
    isolated: Boolean(entityId && context.isolatedGroup?.has(entityId)),
    hiddenReason: visibility.reason,
    stageVisibility: {
      activeStageId: context.activeStage?.id ?? null,
      activeStageOrder: context.activeStage?.order ?? null,
      entityActiveInStage: entityId ? context.activeStage?.activeEntities.includes(entityId) ?? false : null
    },
    layout: primitive.layout ?? null,
    animationParameters: primitive.animationBindings.map((binding) => binding.parameter),
    labels,
    provenance: primitive.provenance
  };
}

function applyRelativeAnchors(
  nodes: CompiledSceneNode[],
  primitives: ScientificPrimitive[],
  progress: number
): CompiledSceneNode[] {
  const primitiveById = new Map(primitives.map((primitive) => [primitive.id, primitive]));
  const nodeByPrimitiveId = new Map(nodes.map((node) => [node.primitiveId, node]));

  return nodes.map((node) => {
    const primitive = primitiveById.get(node.primitiveId);

    if (!primitive?.layout?.anchorId) {
      return node;
    }

    const anchor = nodeByPrimitiveId.get(primitive.layout.anchorId);
    const anchorBounds = anchor ? geometryBounds(anchor.geometry) : null;

    if (!anchorBounds) {
      return {
        ...node,
        hiddenReason: node.hiddenReason ?? "unresolved-anchor"
      };
    }

    const [anchorX, anchorY] = anchorPoint(anchorBounds, primitive.layout.anchorPoint ?? "center");
    const offset: [number, number] = primitive.layout.offset
      ? [
          resolveCoord(primitive.layout.offset[0], progress),
          resolveCoord(primitive.layout.offset[1], progress)
        ]
      : [0, 0];
    const delta: [number, number] = [anchorX + offset[0], anchorY + offset[1]];

    return {
      ...node,
      geometry: offsetGeometry(node.geometry, delta),
      labels: node.labels.map((label) => ({
        ...label,
        x: label.x + delta[0],
        y: label.y + delta[1]
      }))
    };
  });
}

function resolveVisibility(
  primitive: ScientificPrimitive,
  plan: RenderPlan,
  context: {
    hidden: Set<string>;
    isolatedGroup: Set<string> | null;
    isolatedEntityId: string | null;
    activeIntervention: string;
    showLabels: boolean;
    showDirectionality: boolean;
  }
) {
  if (primitive.visibility.mode === "labels" && !context.showLabels) {
    return { visible: false, reason: "labels-disabled" };
  }

  if (primitive.visibility.mode === "directionality" && !context.showDirectionality) {
    return { visible: false, reason: "directionality-disabled" };
  }

  if (
    primitive.visibility.mode === "intervention" &&
    !primitive.visibility.interventions?.includes(context.activeIntervention)
  ) {
    return { visible: false, reason: "inactive-intervention" };
  }

  if (!primitive.entityId) {
    return { visible: true, reason: null };
  }

  if (context.hidden.has(primitive.entityId)) {
    return { visible: false, reason: "hidden-entity" };
  }

  if (!context.isolatedEntityId) {
    return { visible: true, reason: null };
  }

  const group = context.isolatedGroup ?? new Set(plan.isolationGroups[context.isolatedEntityId] ?? [
    context.isolatedEntityId
  ]);

  return group.has(primitive.entityId)
    ? { visible: true, reason: null }
    : { visible: false, reason: "outside-isolation" };
}

function compileLabel(
  primitive: ScientificPrimitive,
  label: PrimitiveLabel,
  progress: number,
  context: {
    activeIntervention: string;
    showLabels: boolean;
    showDirectionality: boolean;
  }
): CompiledSceneLabel {
  return {
    id: `${primitive.id}:${label.text}`,
    primitiveId: primitive.id,
    entityId: primitive.entityId,
    text: label.text,
    x: resolveCoord(label.at[0], progress),
    y: resolveCoord(label.at[1], progress),
    visible: shouldShowLabel(label, context)
  };
}

function shouldShowLabel(
  label: PrimitiveLabel,
  context: {
    activeIntervention: string;
    showLabels: boolean;
    showDirectionality: boolean;
  }
) {
  const mode = label.visibility?.mode ?? "always";

  if (mode === "labels") {
    return context.showLabels;
  }

  if (mode === "directionality") {
    return context.showDirectionality;
  }

  if (mode === "intervention") {
    return label.visibility?.interventions?.includes(context.activeIntervention) ?? false;
  }

  return true;
}

function resolveGeometry(primitive: ScientificPrimitive, progress: number): ResolvedGeometry {
  const geometry = primitive.geometry;

  if ("d" in geometry) {
    return { type: "path", d: geometry.d(progress) };
  }

  if ("x1" in geometry) {
    if (primitive.geometryType === "edge") {
      return {
        type: "graph-edge",
        x1: resolveCoord(geometry.x1, progress),
        y1: resolveCoord(geometry.y1, progress),
        x2: resolveCoord(geometry.x2, progress),
        y2: resolveCoord(geometry.y2, progress),
        label: "label" in geometry ? geometry.label : undefined
      };
    }

    return {
      type: "line",
      x1: resolveCoord(geometry.x1, progress),
      y1: resolveCoord(geometry.y1, progress),
      x2: resolveCoord(geometry.x2, progress),
      y2: resolveCoord(geometry.y2, progress)
    };
  }

  if ("width" in geometry) {
    return {
      type: "rect",
      x: resolveCoord(geometry.x, progress),
      y: resolveCoord(geometry.y, progress),
      width: resolveCoord(geometry.width, progress),
      height: resolveCoord(geometry.height, progress)
    };
  }

  if ("r" in geometry) {
    return {
      type: "circle",
      cx: resolveCoord(geometry.cx, progress),
      cy: resolveCoord(geometry.cy, progress),
      r: resolveCoord(geometry.r, progress)
    };
  }

  if ("rx" in geometry) {
    return {
      type: "ellipse",
      cx: resolveCoord(geometry.cx, progress),
      cy: resolveCoord(geometry.cy, progress),
      rx: resolveCoord(geometry.rx, progress),
      ry: resolveCoord(geometry.ry, progress)
    };
  }

  if ("points" in geometry) {
    return {
      type: "polygon",
      points: geometry.points.map(([x, y]) => [
        resolveCoord(x, progress),
        resolveCoord(y, progress)
      ])
    };
  }

  if ("time" in geometry) {
    return {
      type: "timeline-event",
      time: geometry.time,
      lane: geometry.lane,
      label: geometry.label,
      x: 60 + geometry.time * 760,
      y: 92 + geometry.lane * 36
    };
  }

  if ("radius" in geometry) {
    return {
      type: "graph-node",
      x: resolveCoord(geometry.x, progress),
      y: resolveCoord(geometry.y, progress),
      radius: resolveCoord(geometry.radius, progress),
      label: geometry.label
    };
  }

  return {
    type: "text",
    x: resolveCoord(geometry.x, progress),
    y: resolveCoord(geometry.y, progress),
    text: geometry.text
  };
}

function resolveTransform(
  transform: { translate?: [Coord, Coord]; rotate?: Coord; scale?: Coord },
  progress: number
): ResolvedTransform {
  const resolved: ResolvedTransform = { svg: "" };
  const parts: string[] = [];

  if (transform.translate) {
    resolved.translate = [
      resolveCoord(transform.translate[0], progress),
      resolveCoord(transform.translate[1], progress)
    ];
    parts.push(`translate(${round(resolved.translate[0])} ${round(resolved.translate[1])})`);
  }

  if (transform.rotate !== undefined) {
    resolved.rotate = resolveCoord(transform.rotate, progress);
    parts.push(`rotate(${round(resolved.rotate)})`);
  }

  if (transform.scale !== undefined) {
    resolved.scale = resolveCoord(transform.scale, progress);
    parts.push(`scale(${round(resolved.scale)})`);
  }

  resolved.svg = parts.join(" ");
  return resolved;
}

function resolveActiveStage(states: ScientificState[], progress: number) {
  if (states.length === 0) {
    return null;
  }

  const ordered = states.slice().sort((left, right) => left.order - right.order);
  const index = Math.min(
    ordered.length - 1,
    Math.max(0, Math.floor(clamp01(progress) * ordered.length))
  );

  return ordered[index] ?? null;
}

function resolveIsolationGroup(plan: RenderPlan, isolatedEntityId?: string | null) {
  if (!isolatedEntityId) {
    return null;
  }

  return new Set(plan.isolationGroups[isolatedEntityId] ?? [isolatedEntityId]);
}

function compileGroups(plan: RenderPlan, nodes: CompiledSceneNode[]): SceneGroup[] {
  const groups = new Map<string, Set<string>>();

  for (const [groupId, entityIds] of Object.entries(plan.isolationGroups)) {
    groups.set(groupId, new Set(entityIds));
  }

  for (const node of nodes) {
    if (!node.entityId) {
      continue;
    }

    if (!groups.has(node.entityId)) {
      groups.set(node.entityId, new Set([node.entityId]));
    }
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, entityIds]) => ({
      id,
      entityIds: Array.from(entityIds).sort(),
      nodeIds: nodes
        .filter((node) => node.entityId && entityIds.has(node.entityId))
        .map((node) => node.id)
        .sort()
    }));
}

function compileInterventionOverlays(
  model: ScientificModel,
  activeIntervention: string
): SceneOverlay[] {
  return model.interventions.map((intervention) => ({
    id: intervention.id,
    label: intervention.label,
    entityIds: [...intervention.affectedEntities],
    visible: intervention.id === activeIntervention
  }));
}

function compileCameraFocus(
  plan: RenderPlan,
  visibleNodes: CompiledSceneNode[],
  selected: Set<string>,
  isolatedGroup: Set<string> | null
): SceneCameraFocus {
  const focusEntityIds = selected.size > 0
    ? Array.from(selected)
    : isolatedGroup
      ? Array.from(isolatedGroup)
      : [];

  if (focusEntityIds.length === 0) {
    return {
      targetEntityIds: [],
      viewBox: plan.viewBox,
      reason: "full-scene"
    };
  }

  const focusNodes = visibleNodes.filter((node) => node.entityId && focusEntityIds.includes(node.entityId));
  const viewBox = viewBoxForNodes(focusNodes) ?? plan.viewBox;

  return {
    targetEntityIds: focusEntityIds.sort(),
    viewBox,
    reason: selected.size > 0 ? "selection" : "isolation"
  };
}

function viewBoxForNodes(nodes: CompiledSceneNode[]) {
  const boxes = nodes
    .map((node) => geometryBounds(node.geometry))
    .filter((box): box is NonNullable<ReturnType<typeof geometryBounds>> => box !== null);

  if (boxes.length === 0) {
    return null;
  }

  const minX = Math.min(...boxes.map((box) => box.minX));
  const minY = Math.min(...boxes.map((box) => box.minY));
  const maxX = Math.max(...boxes.map((box) => box.maxX));
  const maxY = Math.max(...boxes.map((box) => box.maxY));
  const padding = 80;

  return [
    round(minX - padding),
    round(minY - padding),
    round(Math.max(160, maxX - minX + padding * 2)),
    round(Math.max(160, maxY - minY + padding * 2))
  ].join(" ");
}

function geometryBounds(geometry: ResolvedGeometry) {
  if (geometry.type === "line" || geometry.type === "graph-edge") {
    return {
      minX: Math.min(geometry.x1, geometry.x2),
      minY: Math.min(geometry.y1, geometry.y2),
      maxX: Math.max(geometry.x1, geometry.x2),
      maxY: Math.max(geometry.y1, geometry.y2)
    };
  }

  if (geometry.type === "rect") {
    return {
      minX: geometry.x,
      minY: geometry.y,
      maxX: geometry.x + geometry.width,
      maxY: geometry.y + geometry.height
    };
  }

  if (geometry.type === "circle") {
    return {
      minX: geometry.cx - geometry.r,
      minY: geometry.cy - geometry.r,
      maxX: geometry.cx + geometry.r,
      maxY: geometry.cy + geometry.r
    };
  }

  if (geometry.type === "ellipse") {
    return {
      minX: geometry.cx - geometry.rx,
      minY: geometry.cy - geometry.ry,
      maxX: geometry.cx + geometry.rx,
      maxY: geometry.cy + geometry.ry
    };
  }

  if (geometry.type === "polygon") {
    return {
      minX: Math.min(...geometry.points.map(([x]) => x)),
      minY: Math.min(...geometry.points.map(([, y]) => y)),
      maxX: Math.max(...geometry.points.map(([x]) => x)),
      maxY: Math.max(...geometry.points.map(([, y]) => y))
    };
  }

  if (geometry.type === "text" || geometry.type === "graph-node") {
    return {
      minX: geometry.x - ("radius" in geometry ? geometry.radius : 20),
      minY: geometry.y - ("radius" in geometry ? geometry.radius : 12),
      maxX: geometry.x + ("radius" in geometry ? geometry.radius : 160),
      maxY: geometry.y + ("radius" in geometry ? geometry.radius : 12)
    };
  }

  if (geometry.type === "timeline-event") {
    return {
      minX: geometry.x - 8,
      minY: geometry.y - 28,
      maxX: geometry.x + 180,
      maxY: geometry.y + 20
    };
  }

  return null;
}

function anchorPoint(
  box: NonNullable<ReturnType<typeof geometryBounds>>,
  point: NonNullable<PrimitiveLayoutHint["anchorPoint"]>
): [number, number] {
  if (point === "start") {
    return [box.minX, (box.minY + box.maxY) / 2];
  }

  if (point === "end") {
    return [box.maxX, (box.minY + box.maxY) / 2];
  }

  return [(box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2];
}

function offsetGeometry(geometry: ResolvedGeometry, [dx, dy]: [number, number]): ResolvedGeometry {
  if (geometry.type === "path") {
    return geometry;
  }

  if (geometry.type === "line") {
    return {
      ...geometry,
      x1: geometry.x1 + dx,
      y1: geometry.y1 + dy,
      x2: geometry.x2 + dx,
      y2: geometry.y2 + dy
    };
  }

  if (geometry.type === "rect") {
    return {
      ...geometry,
      x: geometry.x + dx,
      y: geometry.y + dy
    };
  }

  if (geometry.type === "circle") {
    return {
      ...geometry,
      cx: geometry.cx + dx,
      cy: geometry.cy + dy
    };
  }

  if (geometry.type === "ellipse") {
    return {
      ...geometry,
      cx: geometry.cx + dx,
      cy: geometry.cy + dy
    };
  }

  if (geometry.type === "polygon") {
    return {
      ...geometry,
      points: geometry.points.map(([x, y]) => [x + dx, y + dy])
    };
  }

  if (geometry.type === "text" || geometry.type === "graph-node") {
    return {
      ...geometry,
      x: geometry.x + dx,
      y: geometry.y + dy
    };
  }

  if (geometry.type === "timeline-event") {
    return {
      ...geometry,
      x: geometry.x + dx,
      y: geometry.y + dy
    };
  }

  return {
    ...geometry,
    x1: geometry.x1 + dx,
    y1: geometry.y1 + dy,
    x2: geometry.x2 + dx,
    y2: geometry.y2 + dy
  };
}

function compileIndicators(nodes: CompiledSceneNode[], scaleDistortions: string[]) {
  const visible = nodes.filter((node) => node.visible);
  const literalCount = visible.filter((node) => node.classification === "literal").length;
  const schematicCount = visible.filter((node) => node.classification === "schematic").length;
  const mixedCount = visible.filter((node) => node.classification === "mixed").length;

  return {
    literalCount,
    schematicCount,
    mixedCount,
    warning: schematicCount > 0 || mixedCount > 0
      ? scaleDistortions[0] ?? "Schematic elements are not drawn at literal molecular scale."
      : null
  };
}

function snapshotGeometry(geometry: ResolvedGeometry) {
  if (geometry.type === "polygon") {
    return {
      ...geometry,
      points: geometry.points.map(([x, y]) => [round(x), round(y)])
    };
  }

  return Object.fromEntries(
    Object.entries(geometry).map(([key, value]) => [
      key,
      typeof value === "number" ? round(value) : value
    ])
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
