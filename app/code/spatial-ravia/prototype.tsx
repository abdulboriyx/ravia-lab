"use client";

import { FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  SpatialSessionState,
  applyFollowUpCommand,
  applyCounterfactualIntervention,
  compareActiveBranchToBaseline,
  createCounterfactualBranch,
  createInitialSession,
  dispatchScientificSessionEvent,
  redoScientificSessionEvent,
  returnToBaselineBranch,
  resetScientificSession,
  setRepresentationMode,
  setTimelinePosition,
  startSessionFromPrompt,
  undoScientificSessionEvent
} from "./model";
import type { ScientificClaim, ScientificClaimProvenance } from "./model";
import { initialExamples, processPacks } from "./process-registry";
import type { CompiledSceneNode, ResolvedGeometry } from "./scene-compiler";
import { compileSceneFromSession } from "./scene-compiler";
import {
  resolveStructureForSession,
  structureClaimProvenance
} from "./structure-visualization";

export function SpatialRaviaPrototype() {
  const [session, setSession] = useState<SpatialSessionState>(() => createInitialSession());
  const [prompt, setPrompt] = useState("");
  const [command, setCommand] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const previousTick = useRef<number | null>(null);

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
                delta / current.activeModel.renderPlan.progressDurationMs *
                  current.playback.speed) %
              1
          }
        };
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function generate(event?: FormEvent<HTMLFormElement>, nextPrompt = prompt) {
    event?.preventDefault();
    const trimmed = nextPrompt.trim();
    const updated = startSessionFromPrompt(session, trimmed, processPacks);

    setPrompt(trimmed);
    setSession(updated);
  }

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSession((current) => applyFollowUpCommand(current, command));
    setCommand("");
  }

  const generated = Boolean(session.activeModel);
  const examples = session.activeModel?.examples ?? initialExamples;

  return (
    <main className={generated ? "spatialWorkspace isGenerated" : "spatialWorkspace"}>
      {!generated ? (
        <section className="promptStage" aria-label="Spatial Ravia prompt">
          <form className="centralPrompt" onSubmit={generate}>
            <label htmlFor="initial-science-prompt">
              Describe a biological process you want to understand.
            </label>
            <textarea
              id="initial-science-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe a biological process you want to understand."
              autoFocus
            />
            <ExamplePromptButtons examples={examples} generate={generate} setPrompt={setPrompt} />
            <button className="primaryAction" type="submit">
              Generate
            </button>
          </form>

          {session.activeIntervention === "unsupported prompt" ? (
            <p className="unsupportedNotice">
              Unsupported process. This local prototype does not have a process pack for that yet.
            </p>
          ) : null}
        </section>
      ) : (
        <>
          <section className="workspaceTop" aria-label="Current process">
            <form className="compactPrompt" onSubmit={generate}>
              <label htmlFor="science-prompt">Prompt</label>
              <input
                id="science-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
              <button type="submit">Generate</button>
            </form>
            <p>{session.activeModel?.process}</p>
            <span>{session.activeModel?.renderPlan.subtitle}</span>
          </section>

          <div className={inspectorOpen ? "workspaceShell" : "workspaceShell inspectorClosed"}>
            <aside className="workspacePanel leftPanel" aria-label="Controls and context">
              <PanelBlock title="Examples">
                <ExamplePromptButtons examples={examples} generate={generate} setPrompt={setPrompt} />
              </PanelBlock>

              <PanelBlock title="Model assumptions">
                {session.activeModel?.assumptions.map((assumption) => (
                  <ClaimLine claim={assumption} key={assumption.id} />
                ))}
              </PanelBlock>

              <PanelBlock title="Sources">
                {session.activeModel?.sources.map((source) => (
                  <p key={source.id}>{source.authors}: {source.title}</p>
                ))}
              </PanelBlock>

              <PanelBlock title="Accuracy / status">
                <p>{session.activeIntervention}</p>
                {session.activeModel?.scaleDistortions.slice(0, 2).map((distortion) => (
                  <p key={distortion}>{distortion}</p>
                ))}
              </PanelBlock>
            </aside>

            <section className="simulationColumn" aria-label="Simulation workspace">
              <SimulationControls session={session} setSession={setSession} />
              <RepresentationView session={session} setSession={setSession} />
            </section>

            {inspectorOpen ? (
              <aside className="workspacePanel rightPanel" aria-label="Internal model">
                <button
                  className="inspectorToggle"
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                >
                  Collapse model
                </button>
                <ModelInspector session={session} setSession={setSession} />
                <form className="commandForm" onSubmit={submitCommand}>
                  <label htmlFor="follow-up-command">Follow-up command</label>
                  <input
                    id="follow-up-command"
                    value={command}
                    onChange={(event) => setCommand(event.target.value)}
                    placeholder={session.activeModel?.commandRules[0]?.phrases[0] ?? "enter command"}
                  />
                  <button type="submit">Apply</button>
                </form>
              </aside>
            ) : (
              <button
                className="openInspector"
                type="button"
                onClick={() => setInspectorOpen(true)}
              >
                Model
              </button>
            )}
          </div>

          <BottomPanel session={session} setSession={setSession} />
        </>
      )}
    </main>
  );
}

function ExamplePromptButtons({
  examples,
  generate,
  setPrompt
}: {
  examples: string[];
  generate: (event?: FormEvent<HTMLFormElement>, nextPrompt?: string) => void;
  setPrompt: (prompt: string) => void;
}) {
  return (
    <div className="examplePrompts" aria-label="Example prompts">
      {examples.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => {
            setPrompt(example);
            generate(undefined, example);
          }}
        >
          {example}
        </button>
      ))}
    </div>
  );
}

function SimulationControls({
  session,
  setSession
}: {
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  return (
    <div className="canvasToolbar" aria-label="Simulation controls">
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
        onClick={() => setSession((current) => applyFollowUpCommand(current, "restart"))}
      >
        Restart
      </button>
      <button
        type="button"
        onClick={() => setSession((current) => undoScientificSessionEvent(current, processPacks))}
        disabled={session.eventLog.length === 0}
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => setSession((current) => redoScientificSessionEvent(current, processPacks))}
        disabled={session.undoneEvents.length === 0}
      >
        Redo
      </button>
      <button
        type="button"
        onClick={() => setSession((current) => resetScientificSession(current))}
      >
        Reset
      </button>
      <label>
        Speed
        <input
          type="range"
          min="0.25"
          max="2"
          step="0.25"
          value={session.playback.speed}
          onChange={(event) =>
            setSession((current) =>
              dispatchScientificSessionEvent(current, {
                type: "PLAYBACK_CHANGED",
                playback: { speed: Number(event.target.value) }
              })
            )
          }
        />
      </label>
      <button
        type="button"
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
        onClick={() =>
          setSession((current) =>
            dispatchScientificSessionEvent(current, {
              type: "PLAYBACK_CHANGED",
              playback: { showDirectionality: !current.playback.showDirectionality }
            })
          )
        }
      >
        Direction
      </button>
    </div>
  );
}

function RepresentationView({
  session,
  setSession
}: {
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  if (session.representationMode === "timeline") {
    return <TimelineView session={session} />;
  }

  if (session.representationMode === "graph") {
    return <ProcessGraphView session={session} />;
  }

  if (session.representationMode === "molecular-structure") {
    return <MolecularStructureView session={session} />;
  }

  if (session.representationMode === "explanation") {
    return <ExplanationView session={session} />;
  }

  if (session.representationMode === "json") {
    return <JsonView session={session} />;
  }

  return <RenderPlanView session={session} setSession={setSession} />;
}

function RenderPlanView({
  session,
  setSession
}: {
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  const scene = compileSceneFromSession(session);
  const selected = new Set(session.selectedEntities);
  const selectedEntity = session.activeModel?.entities.find((entity) =>
    selected.has(entity.id)
  );

  if (!scene) {
    return null;
  }

  return (
    <div className="simulationCanvas">
      <div className="canvasMeta">
        <p>{scene.title}</p>
        <p>{scene.subtitle}</p>
        {scene.indicators.warning ? <span>{scene.indicators.warning}</span> : null}
      </div>

      <svg viewBox={scene.viewBox} role="img" aria-label={scene.ariaLabel}>
        <PrimitiveSvgDefs />
        <g>
          {scene.nodes
            .filter((node) => node.visible)
            .map((node) => (
              <PrimitiveSvgElement
                primitive={node}
                key={node.id}
                selected={selected}
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
            : "Click schematic parts to update the persistent model state."}
        </span>
      </div>
    </div>
  );
}

function PrimitiveSvgElement({
  primitive,
  selected,
  setSession
}: {
  primitive: CompiledSceneNode;
  selected: Set<string>;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  const className = [
    "scientificPrimitive",
    `primitive-${primitive.kind}`,
    `primitive-${primitive.styleToken}`,
    primitive.entityId && selected.has(primitive.entityId) ? "isActive" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const interactiveProps = primitive.entityId && primitive.selectable
    ? {
        role: "button",
        tabIndex: 0,
        onClick: () =>
          setSession((current) =>
            dispatchScientificSessionEvent(current, {
              type: "ENTITY_SELECTED",
              entityIds: [primitive.entityId ?? ""]
            })
          ),
        onKeyDown: (event: KeyboardEvent<SVGGElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSession((current) =>
              dispatchScientificSessionEvent(current, {
                type: "ENTITY_SELECTED",
                entityIds: [primitive.entityId ?? ""]
              })
            );
          }
        }
    }
    : {};

  const content = renderPrimitiveShape(primitive.geometry, primitive.kind, className);
  const labels = primitive.labels
    .filter((label) => label.visible)
    .map((label) => (
      <text
        className="renderLabel"
        key={`${primitive.id}-${label.text}`}
        x={label.x}
        y={label.y}
      >
        {label.text}
      </text>
    ));

  return (
    <g transform={primitive.transform.svg || undefined} {...interactiveProps}>
      {content}
      {labels}
    </g>
  );
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
    return (
      <circle
        className={className}
        cx={geometry.cx}
        cy={geometry.cy}
        r={geometry.r}
      />
    );
  }

  if (geometry.type === "ellipse") {
    return (
      <ellipse
        className={className}
        cx={geometry.cx}
        cy={geometry.cy}
        rx={geometry.rx}
        ry={geometry.ry}
      />
    );
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
    <text
      className={className}
      x={geometry.x}
      y={geometry.y}
    >
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

function ModelInspector({
  session,
  setSession
}: {
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  const model = session.activeModel;

  if (!model) {
    return null;
  }

  const visibleEntities = model.entities.filter((entity) => !session.hiddenEntities.includes(entity.id));

  return (
    <>
      <PanelBlock title="Current internal model">
        <p>{model.process}</p>
        <p>{model.biologicalContext}</p>
        <p>{session.representationMode}</p>
      </PanelBlock>

      <PanelBlock title="Entities">
        <ul>
          {visibleEntities.map((entity) => (
            <li className={session.selectedEntities.includes(entity.id) ? "activeEntity" : ""} key={entity.id}>
              <button
                type="button"
                onClick={() =>
                  setSession((current) =>
                    dispatchScientificSessionEvent(current, {
                      type: "ENTITY_SELECTED",
                      entityIds: [entity.id]
                    })
                  )
                }
              >
                {entity.label}
              </button>
              <ProvenanceDetails provenance={entity.provenance} />
            </li>
          ))}
        </ul>
      </PanelBlock>

      <PanelBlock title="Relations">
        {model.relations.slice(0, 5).map((relation) => (
          <div className="claimItem" key={relation.id}>
            <p>{relation.source} -&gt; {relation.target}: {relation.relation}</p>
            <ProvenanceDetails provenance={relation.provenance} />
          </div>
        ))}
      </PanelBlock>

      <PanelBlock title="Variables">
        <p>timeline_position = {Math.round(session.playback.timelinePosition * 100)}%</p>
        <p>speed = {session.playback.speed}x</p>
        {model.parameters.slice(0, 3).map((parameter) => (
          <div className="claimItem" key={parameter.id}>
            <p>{parameter.id} = {String(parameter.value)}</p>
            <ProvenanceDetails provenance={parameter.provenance} />
          </div>
        ))}
      </PanelBlock>

      <PanelBlock title="Assumptions">
        {model.assumptions.slice(0, 2).map((assumption) => (
          <ClaimLine claim={assumption} key={assumption.id} />
        ))}
      </PanelBlock>

      <PanelBlock title="Governing rules">
        {model.transitions.slice(0, 2).map((transition) => (
          <div className="claimItem" key={transition.id}>
            <p>{transition.rule}</p>
            <ProvenanceDetails provenance={transition.provenance} />
          </div>
        ))}
      </PanelBlock>

      <PanelBlock title="Active intervention">
        <p>{session.activeIntervention}</p>
      </PanelBlock>
    </>
  );
}

function TimelineView({ session }: { session: SpatialSessionState }) {
  const states = session.activeModel?.states ?? [];
  const divisor = Math.max(1, states.length - 1);

  return (
    <div className="alternateView">
      {states.map((state) => (
        <section key={state.id} className={state.order / divisor <= session.playback.timelinePosition ? "activeStage" : ""}>
          <span>{String(state.order + 1).padStart(2, "0")}</span>
          <h2>{state.label}</h2>
          <p>{state.description}</p>
        </section>
      ))}
    </div>
  );
}

function ProcessGraphView({ session }: { session: SpatialSessionState }) {
  return (
    <div className="graphView">
      {session.activeModel?.relations.map((relation) => (
        <div key={relation.id}>
          <span>{relation.source}</span>
          <b>{relation.relation}</b>
          <span>{relation.target}</span>
        </div>
      ))}
    </div>
  );
}

function ExplanationView({ session }: { session: SpatialSessionState }) {
  const model = session.activeModel;

  return (
    <div className="explanationView">
      <h2>{model?.process}</h2>
      {model?.representationRules.map((rule) => <ClaimLine claim={rule} key={rule.id} />)}
      <h3>Limitations</h3>
      {model?.limitations.map((limitation) => <ClaimLine claim={limitation} key={limitation.id} />)}
    </div>
  );
}

function MolecularStructureView({ session }: { session: SpatialSessionState }) {
  const structure = resolveStructureForSession(session);

  if (!structure.supported) {
    return (
      <div className="structureView structureUnavailable">
        <section>
          <p>Molecular structure</p>
          <h2>no suitable reviewed structure selected</h2>
          <p>{structure.reason}</p>
          {structure.warnings.map((warning) => (
            <p key={warning.code}><b>{warning.code}</b> {warning.message}</p>
          ))}
        </section>
      </div>
    );
  }

  const metadata = structure.record.structure;
  const provenance = structureClaimProvenance(structure);

  return (
    <div className="structureView">
      <div className="structureViewer">
        <iframe
          title={`Molstar view of PDB ${structure.mapping.pdbId}`}
          src={structure.viewerUrl}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>

      <aside className="structureMetadata" aria-label="Structure metadata and warnings">
        <p>Molecular structure / Mol*</p>
        <h2>{structure.mapping.entityLabel}</h2>
        <dl>
          <div>
            <dt>PDB</dt>
            <dd>{structure.mapping.pdbId}</dd>
          </div>
          <div>
            <dt>Assembly</dt>
            <dd>
              {structure.mapping.useBiologicalAssembly
                ? `biological assembly ${structure.mapping.assemblyId}`
                : "asymmetric unit"}
            </dd>
          </div>
          <div>
            <dt>Method</dt>
            <dd>{metadata?.method}</dd>
          </div>
          <div>
            <dt>Resolution</dt>
            <dd>{metadata?.resolutionAngstrom ? `${metadata.resolutionAngstrom} A` : "not reported"}</dd>
          </div>
          <div>
            <dt>Organism</dt>
            <dd>{metadata?.organism}</dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>
              {structure.record.evidence.experimental ? "experimentally determined" : "not experimental"}
              {structure.record.evidence.predicted ? " / predicted" : ""}
            </dd>
          </div>
        </dl>

        <section>
          <h3>Chains</h3>
          {metadata?.chains.map((chain) => (
            <p key={chain.id}>{chain.id}: {chain.label} / {chain.moleculeType}</p>
          ))}
        </section>

        <section>
          <h3>Ligands</h3>
          {metadata?.ligands.map((ligand) => (
            <p key={ligand.id}>{ligand.id}: {ligand.name} / {ligand.native ? "native or physiological ion" : "non-native"}</p>
          ))}
        </section>

        <section>
          <h3>Warnings</h3>
          {structure.warnings.map((warning) => (
            <p key={warning.code}><b>{warning.code}</b> {warning.message}</p>
          ))}
        </section>

        <section>
          <h3>Provenance</h3>
          <p>{provenance.title}</p>
          <p>{provenance.urlOrDoi}</p>
          <p>{provenance.supportedClaim}</p>
        </section>
      </aside>
    </div>
  );
}

function JsonView({ session }: { session: SpatialSessionState }) {
  return (
    <pre className="jsonView">
      {JSON.stringify(
        {
          model: session.activeModel,
          selectedEntities: session.selectedEntities,
          hiddenEntities: session.hiddenEntities,
          isolatedEntity: session.isolatedEntity,
          activeIntervention: session.activeIntervention,
          playback: session.playback
        },
        null,
        2
      )}
    </pre>
  );
}

function BottomPanel({
  session,
  setSession
}: {
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  return (
    <section className="bottomPanel" aria-label="Timeline and representation controls">
      <div className="timelineControl">
        <label htmlFor="timeline">Timeline</label>
        <input
          id="timeline"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={session.playback.timelinePosition}
          onChange={(event) =>
            setSession((current) => setTimelinePosition(current, Number(event.target.value)))
          }
        />
      </div>

      <div className="segmentedControl" aria-label="Baseline or intervention">
        <button
          type="button"
          className={session.activeIntervention === "baseline" ? "isSelected" : ""}
          onClick={() =>
            setSession((current) =>
              dispatchScientificSessionEvent(current, {
                type: "INTERVENTION_APPLIED",
                interventionId: "baseline"
              })
            )
          }
        >
          Baseline
        </button>
        <button
          type="button"
          className={session.activeIntervention !== "baseline" ? "isSelected" : ""}
          onClick={() =>
            setSession((current) => {
              const command = current.activeModel?.commandRules.find((rule) =>
                rule.patch.activeIntervention?.startsWith("compare")
              );
              return command
                ? applyFollowUpCommand(current, command.phrases[0])
                : { ...current, activeIntervention: "intervention" };
            })
          }
        >
          Intervention
        </button>
      </div>

      <div className="representationSelect">
        <label htmlFor="representation">Representation</label>
        <select
          id="representation"
          value={session.representationMode}
          onChange={(event) =>
            setSession((current) =>
              setRepresentationMode(
                current,
                event.target.value as SpatialSessionState["representationMode"]
              )
            )
          }
        >
          <option value="scene">scene</option>
          <option value="mixed">mixed workspace</option>
          <option value="molecular-structure">molecular structure</option>
          <option value="timeline">process timeline</option>
          <option value="graph">process graph</option>
          <option value="voltage-graph">voltage graph</option>
          <option value="explanation">explanation</option>
          <option value="json">developer JSON</option>
        </select>
      </div>

      <div className="branchPanel" aria-label="Counterfactual branches">
        <p>Branch: {session.branches.find((branch) => branch.id === session.activeBranchId)?.name ?? "Baseline"}</p>
        <button
          type="button"
          onClick={() =>
            setSession((current) =>
              createCounterfactualBranch(current, `Branch ${current.branches.length}`)
            )
          }
          disabled={!session.activeModel}
        >
          Clone
        </button>
        <button
          type="button"
          onClick={() => setSession((current) => returnToBaselineBranch(current))}
          disabled={session.activeBranchId === "baseline"}
        >
          Baseline
        </button>
        <select
          aria-label="Switch branch"
          value={session.activeBranchId}
          onChange={(event) =>
            setSession((current) =>
              dispatchScientificSessionEvent(current, {
                type: "BRANCH_SWITCHED",
                branchId: event.target.value
              })
            )
          }
        >
          {session.branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
        <div className="branchInterventions">
          {session.activeModel?.interventions
            .filter((intervention) => intervention.modelDelta)
            .map((intervention) => (
              <button
                key={intervention.id}
                type="button"
                onClick={() =>
                  setSession((current) =>
                    applyCounterfactualIntervention(current, intervention.id)
                  )
                }
              >
                {intervention.label}
              </button>
            ))}
        </div>
        {session.activeBranchId !== "baseline" ? (
          <div className="branchDiffs">
            {compareActiveBranchToBaseline(session).slice(0, 6).map((difference) => (
              <p key={`${difference.path}-${difference.counterfactual}`}>
                <b>{difference.source}</b> {difference.path}: {difference.baseline} {"->"} {difference.counterfactual} ({difference.classification})
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="limitations">
        <p>Scientific limitations and citations</p>
        <p>
          {session.activeModel?.limitations[0]?.claim} Sources:{" "}
          {session.activeModel?.sources.map((source) => source.authors).join("; ")}
        </p>
      </div>
    </section>
  );
}

function ClaimLine({ claim }: { claim: ScientificClaim }) {
  return (
    <div className="claimItem">
      <p>{claim.claim}</p>
      <span>{claim.claimType} / {claim.status}</span>
      <ProvenanceDetails provenance={claim.provenance} />
    </div>
  );
}

function ProvenanceDetails({ provenance }: { provenance: ScientificClaimProvenance[] }) {
  const disagreement = provenance.find((item) => item.disagreementNote);

  return (
    <details className="provenanceDetails">
      <summary>provenance</summary>
      {provenance.map((item) => (
        <div key={`${item.sourceId}-${item.supportedClaim}`}>
          <p>{item.title}</p>
          <p>{item.authorsOrInstitution} / {item.publicationType} / {item.accessDate}</p>
          <p>{item.supportType} / {item.claimStatus} / confidence {Math.round(item.confidence * 100)}%</p>
          <p>{item.supportedClaim}</p>
          <p>{item.urlOrDoi}</p>
          {item.license ? <p>{item.license}</p> : null}
        </div>
      ))}
      {disagreement ? <p>Disagreement: {disagreement.disagreementNote}</p> : <p>No source disagreement recorded.</p>}
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
      <div>{children}</div>
    </section>
  );
}
