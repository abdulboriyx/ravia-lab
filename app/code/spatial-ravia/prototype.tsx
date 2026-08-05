"use client";

import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DnaMolecularView } from "./DnaMolecularView";
import { dnaReplicationPack } from "./dna-process.ts";
import { startDnaWorkspaceFromPrompt } from "./dna-workspace.ts";
import type {
  ScientificClaim,
  ScientificClaimProvenance,
  ScientificEntity,
  SpatialSessionState
} from "./model.ts";
import {
  createInitialSession,
  dispatchScientificSessionEvent,
  setTimelinePosition
} from "./model.ts";
import type {
  CompiledScene,
  CompiledSceneNode,
  ResolvedGeometry
} from "./scene-compiler.ts";
import { compileSceneFromSession } from "./scene-compiler.ts";

type ScaleView = "fork" | "structure";

const speedOptions = [0.25, 0.5, 1, 2] as const;

export function SpatialRaviaPrototype() {
  const [session, setSession] = useState<SpatialSessionState>(() => createInitialSession());
  const [prompt, setPrompt] = useState("Show DNA replication");
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);
  const [scaleView, setScaleView] = useState<ScaleView>("fork");
  const previousTick = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.spatialRavia = "active";
    return () => {
      delete document.documentElement.dataset.spatialRavia;
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const tick = (now: number) => {
      if (previousTick.current === null) {
        previousTick.current = now;
      }

      const delta = now - previousTick.current;
      previousTick.current = now;

      setSession((current) => {
        if (!current.activeModel || !current.playback.playing) {
          return current;
        }

        return {
          ...current,
          playback: {
            ...current.playback,
            timelinePosition:
              (current.playback.timelinePosition +
                (delta / current.activeModel.renderPlan.progressDurationMs) * current.playback.speed) %
              1
          }
        };
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const scene = useMemo(() => compileSceneFromSession(session), [session]);
  const hasScene = Boolean(session.activeModel && scene);

  function submitPrompt(event?: FormEvent<HTMLFormElement>, nextPrompt = prompt) {
    event?.preventDefault();
    const trimmed = nextPrompt.trim();
    const result = startDnaWorkspaceFromPrompt(session, trimmed);

    setPrompt(trimmed);
    setSession(result.session);
    setUnsupportedReason(result.unsupportedReason);
    if (!result.unsupportedReason) {
      setScaleView("fork");
    }
  }

  return (
    <main className={hasScene ? "spatialWorkspace dnaWorkspace isGenerated" : "spatialWorkspace dnaWorkspace"}>
      {!hasScene ? (
        <section className="promptStage" aria-label="Spatial Ravia prompt">
          <form className="centralPrompt" onSubmit={submitPrompt}>
            <label htmlFor="initial-science-prompt">Describe the replication fork.</label>
            <textarea
              id="initial-science-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.currentTarget.value)}
              placeholder="Show DNA replication"
              autoFocus
            />
            <ExamplePromptButtons onSelect={submitPrompt} setPrompt={setPrompt} />
            <button className="primaryAction" type="submit">
              Generate
            </button>
          </form>
          {unsupportedReason ? <UnsupportedPrompt reason={unsupportedReason} /> : null}
        </section>
      ) : (
        <>
          <section className="workspaceTop" aria-label="Current process">
            <form className="compactPrompt" onSubmit={submitPrompt}>
              <label htmlFor="science-prompt">Prompt</label>
              <input
                id="science-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.currentTarget.value)}
              />
              <button type="submit">Generate</button>
            </form>
            <div>
              <h1>{session.activeModel?.process}</h1>
              <p>{session.activeModel?.biologicalContext}</p>
            </div>
            <span>{scaleView === "fork" ? "Schematic explanatory model" : "Literal B-DNA reference"}</span>
          </section>

          {unsupportedReason ? <UnsupportedPrompt reason={unsupportedReason} compact /> : null}

          <div className="workspaceShell dnaWorkspaceShell">
            <aside className="workspacePanel leftPanel" aria-label="Workspace controls and context">
              <PanelBlock title="Scale">
                <div className="segmentedControl scaleMode">
                  <button
                    type="button"
                    className={scaleView === "fork" ? "isSelected" : ""}
                    onClick={() => setScaleView("fork")}
                  >
                    Fork mechanism
                  </button>
                  <button
                    type="button"
                    className={scaleView === "structure" ? "isSelected" : ""}
                    onClick={() => setScaleView("structure")}
                  >
                    DNA structure
                  </button>
                </div>
                <p>
                  {scaleView === "fork"
                    ? "Schematic explanatory model; normalized time; replication-fork process representation."
                    : "Existing B-DNA Mol* view; literal deposited PDB 1ZF5 coordinates; not a replication-fork structure."}
                </p>
              </PanelBlock>

              <StagePanel scene={scene} />
              <SelectionPanel session={session} setSession={setSession} />
            </aside>

            <section className="simulationColumn" aria-label="DNA replication workspace">
              <PlaybackControls session={session} setSession={setSession} />
              {scaleView === "fork" && scene ? (
                <DnaForkScene scene={scene} session={session} setSession={setSession} />
              ) : (
                <section className="molecularScaleView" aria-label="B-DNA molecular reference">
                  <div className="molecularScaleNotice">
                    <strong>DNA structure</strong>
                    <span>Literal deposited PDB 1ZF5 coordinates for B-DNA only; not a replication-fork structure.</span>
                  </div>
                  <DnaMolecularView />
                </section>
              )}
            </section>

            <aside className="workspacePanel rightPanel" aria-label="Evidence and sources">
              <EvidencePanel session={session} scene={scene} />
            </aside>
          </div>
        </>
      )}
    </main>
  );
}

function ExamplePromptButtons({
  onSelect,
  setPrompt
}: {
  onSelect: (event?: FormEvent<HTMLFormElement>, nextPrompt?: string) => void;
  setPrompt: (prompt: string) => void;
}) {
  return (
    <div className="examplePrompts" aria-label="Example prompts">
      {dnaReplicationPack.examples.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => {
            setPrompt(example);
            onSelect(undefined, example);
          }}
        >
          {example}
        </button>
      ))}
    </div>
  );
}

function UnsupportedPrompt({
  reason,
  compact = false
}: {
  reason: string;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "unsupportedNotice unsupportedNoticeDocked" : "unsupportedNotice"}>
      <p>{reason}</p>
      <span>Supported actions: show DNA replication, inspect components, play, pause, restart, scrub, hide, isolate, and open the B-DNA structure reference.</span>
    </section>
  );
}

function PlaybackControls({
  session,
  setSession
}: {
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  return (
    <div className="canvasToolbar" aria-label="Playback and view controls">
      <button
        type="button"
        onClick={() =>
          setSession((current) =>
            dispatchScientificSessionEvent(current, {
              type: "PLAYBACK_CHANGED",
              playback: { playing: !current.playback.playing }
            })
          )
        }
      >
        {session.playback.playing ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        onClick={() =>
          setSession((current) =>
            dispatchScientificSessionEvent(current, {
              type: "PLAYBACK_CHANGED",
              playback: { playing: true, timelinePosition: 0 }
            })
          )
        }
      >
        Restart
      </button>
      <label className="timelineControl">
        <span>Timeline {Math.round(session.playback.timelinePosition * 100)}%</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(session.playback.timelinePosition * 100)}
          onChange={(event) => {
            const nextTimelinePosition = Number(event.currentTarget.value) / 100;
            setSession((current) => setTimelinePosition(current, nextTimelinePosition));
          }}
        />
      </label>
      <div className="segmentedControl speedControl" aria-label="Playback speed">
        {speedOptions.map((speed) => (
          <button
            key={speed}
            type="button"
            className={session.playback.speed === speed ? "isSelected" : ""}
            onClick={() =>
              setSession((current) =>
                dispatchScientificSessionEvent(current, {
                  type: "PLAYBACK_CHANGED",
                  playback: { speed }
                })
              )
            }
          >
            {speed}x
          </button>
        ))}
      </div>
      <button
        type="button"
        className={session.playback.showLabels ? "isSelected" : ""}
        onClick={() =>
          setSession((current) =>
            dispatchScientificSessionEvent(current, {
              type: "PLAYBACK_CHANGED",
              playback: { showLabels: !current.playback.showLabels }
            })
          )
        }
      >
        Labels
      </button>
      <button
        type="button"
        className={session.playback.showDirectionality ? "isSelected" : ""}
        onClick={() =>
          setSession((current) =>
            dispatchScientificSessionEvent(current, {
              type: "PLAYBACK_CHANGED",
              playback: { showDirectionality: !current.playback.showDirectionality }
            })
          )
        }
      >
        5&apos;/3&apos;
      </button>
    </div>
  );
}

function DnaForkScene({
  scene,
  session,
  setSession
}: {
  scene: CompiledScene;
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  const selectedEntity = selectedEntityForSession(session);

  return (
    <div className="simulationCanvas dnaForkCanvas">
      <div className="canvasMeta">
        <p>{scene.title}</p>
        <span>{scene.subtitle}</span>
        <span>Evidence mode: schematic explanatory model</span>
      </div>

      <svg viewBox={scene.viewBox} role="img" aria-label={scene.ariaLabel}>
        <PrimitiveSvgDefs />
        <g>
          {scene.nodes
            .filter((node) => node.visible)
            .map((node) => (
              <PrimitiveSvgElement
                key={node.id}
                node={node}
                selectedEntityIds={session.selectedEntities}
                setSession={setSession}
              />
            ))}
        </g>
      </svg>

      <div className="selectionReadout">
        <p>{selectedEntity ? selectedEntity.label : "Select a component"}</p>
        <span>
          {selectedEntity
            ? selectedEntity.description
            : "Click a fork component to inspect, hide, or isolate it."}
        </span>
      </div>
    </div>
  );
}

function PrimitiveSvgElement({
  node,
  selectedEntityIds,
  setSession
}: {
  node: CompiledSceneNode;
  selectedEntityIds: string[];
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  const isSelected = Boolean(node.entityId && selectedEntityIds.includes(node.entityId));
  const className = [
    "scientificPrimitive",
    `primitive-${node.kind}`,
    `primitive-${node.styleToken}`,
    isSelected ? "isActive" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const interactiveProps = node.entityId && node.selectable
    ? {
        role: "button",
        tabIndex: 0,
        "aria-label": `Select ${node.entityId}`,
        onClick: () =>
          setSession((current) =>
            dispatchScientificSessionEvent(current, {
              type: "ENTITY_SELECTED",
              entityIds: [node.entityId ?? ""]
            })
          ),
        onKeyDown: (event: KeyboardEvent<SVGGElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSession((current) =>
              dispatchScientificSessionEvent(current, {
                type: "ENTITY_SELECTED",
                entityIds: [node.entityId ?? ""]
              })
            );
          }
        }
      }
    : {};

  return (
    <g className={isSelected ? "isActive" : undefined} transform={node.transform.svg || undefined} {...interactiveProps}>
      {node.entityId && node.selectable ? renderPrimitiveHitTarget(node.geometry) : null}
      {renderPrimitiveShape(node.geometry, node.kind, className)}
      {node.labels
        .filter((label) => label.visible)
        .map((label) => (
          <text
            className="renderLabel"
            key={label.id}
            x={label.x}
            y={label.y}
          >
            {label.text}
          </text>
        ))}
    </g>
  );
}

function renderPrimitiveHitTarget(geometry: ResolvedGeometry) {
  const bounds = geometryBounds(geometry);

  if (!bounds) {
    return null;
  }

  return (
    <rect
      className="primitiveHitTarget"
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
    />
  );
}

function geometryBounds(geometry: ResolvedGeometry) {
  const padding = 20;

  if (geometry.type === "line" || geometry.type === "graph-edge") {
    const x = Math.min(geometry.x1, geometry.x2) - padding;
    const y = Math.min(geometry.y1, geometry.y2) - padding;
    return {
      x,
      y,
      width: Math.abs(geometry.x2 - geometry.x1) + padding * 2,
      height: Math.abs(geometry.y2 - geometry.y1) + padding * 2
    };
  }

  if (geometry.type === "rect") {
    return {
      x: geometry.x - padding,
      y: geometry.y - padding,
      width: geometry.width + padding * 2,
      height: geometry.height + padding * 2
    };
  }

  if (geometry.type === "circle" || geometry.type === "graph-node") {
    const radius = geometry.type === "circle" ? geometry.r : geometry.radius;
    const x = geometry.type === "circle" ? geometry.cx : geometry.x;
    const y = geometry.type === "circle" ? geometry.cy : geometry.y;
    return {
      x: x - radius - padding,
      y: y - radius - padding,
      width: (radius + padding) * 2,
      height: (radius + padding) * 2
    };
  }

  if (geometry.type === "ellipse") {
    return {
      x: geometry.cx - geometry.rx - padding,
      y: geometry.cy - geometry.ry - padding,
      width: (geometry.rx + padding) * 2,
      height: (geometry.ry + padding) * 2
    };
  }

  if (geometry.type === "polygon") {
    const xs = geometry.points.map(([x]) => x);
    const ys = geometry.points.map(([, y]) => y);
    return {
      x: Math.min(...xs) - padding,
      y: Math.min(...ys) - padding,
      width: Math.max(...xs) - Math.min(...xs) + padding * 2,
      height: Math.max(...ys) - Math.min(...ys) + padding * 2
    };
  }

  if (geometry.type === "path") {
    const values = Array.from(geometry.d.matchAll(/-?\d+(?:\.\d+)?/g), (match) => Number(match[0]));
    const xs = values.filter((_, index) => index % 2 === 0);
    const ys = values.filter((_, index) => index % 2 === 1);

    if (xs.length === 0 || ys.length === 0) {
      return null;
    }

    return {
      x: Math.min(...xs) - padding,
      y: Math.min(...ys) - padding,
      width: Math.max(...xs) - Math.min(...xs) + padding * 2,
      height: Math.max(...ys) - Math.min(...ys) + padding * 2
    };
  }

  if (geometry.type === "text" || geometry.type === "timeline-event") {
    return {
      x: geometry.x - padding,
      y: geometry.y - padding,
      width: 220,
      height: 64
    };
  }

  return null;
}

function renderPrimitiveShape(
  geometry: ResolvedGeometry,
  kind: CompiledSceneNode["kind"],
  className: string
) {
  const directionalProps =
    kind === "directional-arrow" ? { markerEnd: "url(#primitive-arrowhead)" } : {};

  if (geometry.type === "path") {
    return <path className={className} d={geometry.d} {...directionalProps} />;
  }

  if (geometry.type === "line") {
    return (
      <line
        className={className}
        {...directionalProps}
        x1={geometry.x1}
        y1={geometry.y1}
        x2={geometry.x2}
        y2={geometry.y2}
      />
    );
  }

  if (geometry.type === "rect") {
    return (
      <rect
        className={className}
        x={geometry.x}
        y={geometry.y}
        width={geometry.width}
        height={geometry.height}
      />
    );
  }

  if (geometry.type === "circle") {
    return <circle className={className} cx={geometry.cx} cy={geometry.cy} r={geometry.r} />;
  }

  if (geometry.type === "ellipse") {
    return <ellipse className={className} cx={geometry.cx} cy={geometry.cy} rx={geometry.rx} ry={geometry.ry} />;
  }

  if (geometry.type === "polygon") {
    return (
      <polygon
        className={className}
        points={geometry.points.map(([x, y]) => `${x},${y}`).join(" ")}
      />
    );
  }

  if (geometry.type === "timeline-event") {
    return (
      <g className={className}>
        <line x1={geometry.x} y1={geometry.y} x2={geometry.x} y2={geometry.y + 36} />
        <text x={geometry.x + 8} y={geometry.y + 26}>{geometry.label}</text>
      </g>
    );
  }

  if (geometry.type === "graph-node") {
    return (
      <g className={className}>
        <circle cx={geometry.x} cy={geometry.y} r={geometry.radius} />
        <text x={geometry.x + 28} y={geometry.y + 4}>{geometry.label}</text>
      </g>
    );
  }

  if (geometry.type === "graph-edge") {
    return (
      <g className={className}>
        <line x1={geometry.x1} y1={geometry.y1} x2={geometry.x2} y2={geometry.y2} />
        {geometry.label ? <text x={(geometry.x1 + geometry.x2) / 2} y={(geometry.y1 + geometry.y2) / 2}>{geometry.label}</text> : null}
      </g>
    );
  }

  return geometry.type === "text" ? (
    <text className={className} x={geometry.x} y={geometry.y}>
      {geometry.text}
    </text>
  ) : null;
}

function PrimitiveSvgDefs() {
  return (
    <defs>
      <marker
        id="primitive-arrowhead"
        markerHeight="10"
        markerWidth="10"
        orient="auto"
        refX="8"
        refY="5"
      >
        <path d="M0 0 L10 5 L0 10 Z" className="primitiveMarker" />
      </marker>
    </defs>
  );
}

function StagePanel({ scene }: { scene: CompiledScene | null }) {
  const activeStage = scene?.timeline.stages.find((stage) => stage.active);

  return (
    <PanelBlock title="Active stage">
      <p>{activeStage?.label ?? "No active stage"}</p>
      <ol className="stageList">
        {scene?.timeline.stages.map((stage) => (
          <li className={stage.active ? "activeEntity" : ""} key={stage.id}>
            {stage.label}
          </li>
        ))}
      </ol>
    </PanelBlock>
  );
}

function SelectionPanel({
  session,
  setSession
}: {
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  const selectedEntity = selectedEntityForSession(session);

  return (
    <PanelBlock title="Selected component">
      <p>{selectedEntity?.label ?? "None selected"}</p>
      <span>{selectedEntity?.description ?? "Select a visible fork component."}</span>
      <div className="componentActions">
        <button
          type="button"
          disabled={!selectedEntity}
          onClick={() =>
            selectedEntity &&
            setSession((current) =>
              dispatchScientificSessionEvent(current, {
                type: "ENTITY_HIDDEN",
                entityIds: [selectedEntity.id]
              })
            )
          }
        >
          Hide
        </button>
        <button
          type="button"
          disabled={!selectedEntity}
          onClick={() =>
            selectedEntity &&
            setSession((current) =>
              dispatchScientificSessionEvent(current, {
                type: "ENTITY_ISOLATED",
                entityId: selectedEntity.id,
                entityIds: current.activeModel?.renderPlan.isolationGroups[selectedEntity.id] ?? [selectedEntity.id]
              })
            )
          }
        >
          Isolate
        </button>
        <button
          type="button"
          disabled={session.hiddenEntities.length === 0 && !session.isolatedEntity}
          onClick={() =>
            setSession((current) =>
              dispatchScientificSessionEvent(
                dispatchScientificSessionEvent(current, {
                  type: "ENTITY_SHOWN",
                  entityIds: current.hiddenEntities
                }),
                {
                  type: "ENTITY_ISOLATED",
                  entityId: null,
                  entityIds: []
                }
              )
            )
          }
        >
          Clear view
        </button>
      </div>
    </PanelBlock>
  );
}

function EvidencePanel({
  session,
  scene
}: {
  session: SpatialSessionState;
  scene: CompiledScene | null;
}) {
  const model = session.activeModel;
  const selectedEntity = selectedEntityForSession(session);

  if (!model) {
    return null;
  }

  return (
    <>
      <PanelBlock title="Evidence mode">
        <p>Fork mechanism: schematic explanatory model</p>
        <p>Time basis: normalized</p>
        <p>Structure reference: literal B-DNA coordinates only</p>
        {scene?.indicators.warning ? <p>{scene.indicators.warning}</p> : null}
      </PanelBlock>

      {selectedEntity ? (
        <PanelBlock title="Component evidence">
          <p>{selectedEntity.label}</p>
          <p>{selectedEntity.description}</p>
          <ProvenanceDetails provenance={selectedEntity.provenance} />
        </PanelBlock>
      ) : null}

      <PanelBlock title="Assumptions">
        {model.assumptions.map((assumption) => (
          <ClaimLine claim={assumption} key={assumption.id} />
        ))}
      </PanelBlock>

      <PanelBlock title="Limitations">
        {model.limitations.map((limitation) => (
          <ClaimLine claim={limitation} key={limitation.id} />
        ))}
      </PanelBlock>

      <PanelBlock title="Sources">
        {model.sources.map((source) => (
          <p key={source.id}>
            <a href={source.urlOrDoi} target="_blank" rel="noreferrer">
              {source.title}
            </a>
          </p>
        ))}
      </PanelBlock>
    </>
  );
}

function selectedEntityForSession(session: SpatialSessionState): ScientificEntity | undefined {
  return session.activeModel?.entities.find((entity) => session.selectedEntities.includes(entity.id));
}

function ClaimLine({ claim }: { claim: ScientificClaim }) {
  return (
    <div className="claimItem">
      <p>{claim.claim}</p>
      <ProvenanceDetails provenance={claim.provenance} />
    </div>
  );
}

function ProvenanceDetails({ provenance }: { provenance: ScientificClaimProvenance[] }) {
  return (
    <details className="provenanceDetails">
      <summary>Claim-level sources</summary>
      <div>
        {provenance.map((item) => (
          <p key={`${item.sourceId}-${item.supportedClaim}`}>
            <a href={item.urlOrDoi} target="_blank" rel="noreferrer">
              {item.title}
            </a>
            {" - "}
            {item.supportedClaim}
          </p>
        ))}
      </div>
    </details>
  );
}

function PanelBlock({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panelBlock">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
