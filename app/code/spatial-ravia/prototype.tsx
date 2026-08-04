"use client";

import { FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import {
  SpatialSessionState,
  applyFollowUpCommand,
  createInitialSession,
  setRepresentationMode,
  setTimelinePosition,
  startSessionFromPrompt
} from "./model";

const examples = [
  "How is DNA copied?",
  "Show a replication fork.",
  "Why are Okazaki fragments necessary?",
  "What happens without ligase?"
];

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
              (current.playback.timelinePosition + (delta / 11000) * current.playback.speed) % 1
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
    const updated = startSessionFromPrompt(session, trimmed);

    setPrompt(trimmed);
    setSession(updated);
  }

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSession((current) => applyFollowUpCommand(current, command));
    setCommand("");
  }

  const generated = Boolean(session.activeModel);

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
            <button className="primaryAction" type="submit">
              Generate
            </button>
          </form>

          {session.activeIntervention === "unsupported prompt" ? (
            <p className="unsupportedNotice">
              Unsupported process. This local prototype currently supports DNA replication only.
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
            <span>Schematic, not molecularly exact</span>
          </section>

          <div className={inspectorOpen ? "workspaceShell" : "workspaceShell inspectorClosed"}>
            <aside className="workspacePanel leftPanel" aria-label="Controls and context">
              <PanelBlock title="Examples">
                <div className="examplePrompts">
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
              </PanelBlock>

              <PanelBlock title="Model assumptions">
                {session.activeModel?.assumptions.map((assumption) => (
                  <p key={assumption}>{assumption}</p>
                ))}
              </PanelBlock>

              <PanelBlock title="Sources">
                {session.activeModel?.sources.map((source) => (
                  <p key={source.id}>{source.authors}: {source.title}</p>
                ))}
              </PanelBlock>

              <PanelBlock title="Accuracy / status">
                <p>{session.activeIntervention}</p>
                <p>Schematic biology representation; mocked timing and distances.</p>
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
                    placeholder="isolate the lagging strand"
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
          setSession((current) => ({
            ...current,
            playback: { ...current.playback, playing: !current.playback.playing }
          }))
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
      <label>
        Speed
        <input
          type="range"
          min="0.25"
          max="2"
          step="0.25"
          value={session.playback.speed}
          onChange={(event) =>
            setSession((current) => ({
              ...current,
              playback: { ...current.playback, speed: Number(event.target.value) }
            }))
          }
        />
      </label>
      <button
        type="button"
        onClick={() =>
          setSession((current) => ({
            ...current,
            playback: { ...current.playback, showLabels: !current.playback.showLabels }
          }))
        }
      >
        Labels
      </button>
      <button
        type="button"
        onClick={() =>
          setSession((current) => ({
            ...current,
            playback: {
              ...current.playback,
              showDirectionality: !current.playback.showDirectionality
            }
          }))
        }
      >
        5&apos;/3&apos;
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

  if (session.representationMode === "explanation") {
    return <ExplanationView session={session} />;
  }

  if (session.representationMode === "json") {
    return <JsonView session={session} />;
  }

  return <DnaReplicationCanvas session={session} setSession={setSession} />;
}

function DnaReplicationCanvas({
  session,
  setSession
}: {
  session: SpatialSessionState;
  setSession: (updater: (current: SpatialSessionState) => SpatialSessionState) => void;
}) {
  const progress = session.playback.timelinePosition;
  const forkX = 270 + progress * 310;
  const noLigase =
    session.hiddenEntities.includes("ligase") || session.activeIntervention === "compare-no-ligase";
  const selected = new Set(session.selectedEntities);
  const visible = (id: string) =>
    !session.hiddenEntities.includes(id) &&
    (!session.isolatedEntity ||
      id === session.isolatedEntity ||
      (session.isolatedEntity === "lagging-strand" &&
        ["okazaki-fragments", "rna-primers"].includes(id)));

  const interactiveProps = (id: string) => ({
    role: "button",
    tabIndex: 0,
    onClick: () =>
      setSession((current) => ({ ...current, selectedEntities: [id] })),
    onKeyDown: (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setSession((current) => ({ ...current, selectedEntities: [id] }));
      }
    }
  });

  const selectedEntity = session.activeModel?.entities.find((entity) =>
    selected.has(entity.id)
  );

  return (
    <div className="simulationCanvas">
      <div className="canvasMeta">
        <p>DNA replication / replication fork</p>
        <p>Schematic, not molecularly exact</p>
      </div>

      <svg viewBox="0 0 920 560" role="img" aria-label="DNA replication fork schematic">
        <g>
          <path className="forkGuide" d="M108 280 C232 222 360 226 470 280" />
          <path className="forkGuide" d="M108 280 C232 338 360 334 470 280" />

          {visible("parental-strand-5to3") ? (
            <g {...interactiveProps("parental-strand-5to3")}>
              <path
                className={componentClass(selected, "parental-strand-5to3")}
                d={`M112 280 C230 224 ${forkX - 70} 222 ${forkX} 214 C650 186 738 142 820 92`}
              />
            </g>
          ) : null}

          {visible("parental-strand-3to5") ? (
            <g {...interactiveProps("parental-strand-3to5")}>
              <path
                className={componentClass(selected, "parental-strand-3to5")}
                d={`M112 280 C230 336 ${forkX - 70} 338 ${forkX} 346 C650 374 738 418 820 468`}
              />
            </g>
          ) : null}

          {visible("leading-strand") ? (
            <g {...interactiveProps("leading-strand")}>
              <path
                className={componentClass(selected, "leading-strand")}
                d={`M130 296 C260 322 ${forkX - 110} 324 ${forkX - 24} 342`}
              />
            </g>
          ) : null}

          {visible("lagging-strand") ? (
            <g {...interactiveProps("lagging-strand")}>
              <g className={componentClass(selected, "lagging-strand")}>
                <path d={`M${forkX - 44} 228 C${forkX - 96} 236 ${forkX - 140} 254 ${forkX - 186} 270`} />
                <path d={`M${forkX - 138} 252 C${forkX - 190} 264 ${forkX - 234} 276 ${forkX - 282} 288`} />
                <path d={`M${forkX - 238} 276 C${forkX - 288} 288 ${forkX - 332} 298 ${forkX - 372} 306`} />
              </g>
            </g>
          ) : null}

          {visible("rna-primers") ? (
            <g {...interactiveProps("rna-primers")}>
              <g className={componentClass(selected, "rna-primers")}>
                <line x1={forkX - 54} y1="229" x2={forkX - 26} y2="223" />
                <line x1={forkX - 150} y1="254" x2={forkX - 122} y2="248" />
                <line x1={forkX - 252} y1="278" x2={forkX - 224} y2="272" />
              </g>
            </g>
          ) : null}

          {visible("okazaki-fragments") ? (
            <g {...interactiveProps("okazaki-fragments")}>
              <g className={componentClass(selected, "okazaki-fragments")}>
                <rect x={forkX - 190} y="267" width="54" height="8" />
                <rect x={forkX - 288} y="290" width="62" height="8" />
                <rect x={forkX - 372} y="309" width="48" height="8" />
              </g>
            </g>
          ) : null}

          {visible("ssb") ? (
            <g {...interactiveProps("ssb")}>
              <g className={componentClass(selected, "ssb")}>
                <circle cx={forkX + 72} cy="190" r="9" />
                <circle cx={forkX + 103} cy="176" r="9" />
                <circle cx={forkX + 74} cy="370" r="9" />
                <circle cx={forkX + 104} cy="386" r="9" />
              </g>
            </g>
          ) : null}

          {visible("helicase") ? (
            <g {...interactiveProps("helicase")}>
              <g className={componentClass(selected, "helicase")}>
                <polygon points={`${forkX - 28},280 ${forkX + 4},244 ${forkX + 46},280 ${forkX + 4},316`} />
                {session.playback.showLabels ? <text x={forkX + 56} y="284">helicase</text> : null}
              </g>
            </g>
          ) : null}

          {visible("primase") ? (
            <g {...interactiveProps("primase")}>
              <g className={componentClass(selected, "primase")}>
                <rect x={forkX - 92} y="210" width="34" height="24" />
                {session.playback.showLabels ? <text x={forkX - 130} y="204">primase</text> : null}
              </g>
            </g>
          ) : null}

          {visible("dna-polymerase") ? (
            <g {...interactiveProps("dna-polymerase")}>
              <g className={componentClass(selected, "dna-polymerase")}>
                <circle cx={forkX - 42} cy="342" r="22" />
                <circle cx={forkX - 84} cy="238" r="18" />
                {session.playback.showLabels ? <text x={forkX - 24} y="382">polymerase</text> : null}
              </g>
            </g>
          ) : null}

          {visible("ligase") ? (
            <g {...interactiveProps("ligase")}>
              <g className={componentClass(selected, "ligase")}>
                <rect x={forkX - 326} y="270" width="28" height="28" />
                {session.playback.showLabels ? <text x={forkX - 354} y="330">ligase</text> : null}
              </g>
            </g>
          ) : null}

          {session.playback.showDirectionality ? (
            <g className="directionLabels">
              <text x="88" y="250">5&apos;</text>
              <text x="812" y="76">3&apos;</text>
              <text x="88" y="328">3&apos;</text>
              <text x="812" y="494">5&apos;</text>
              <text x={forkX - 18} y="372">5&apos; -&gt; 3&apos;</text>
            </g>
          ) : null}

          {noLigase ? (
            <g className="comparisonLayer">
              <line x1="642" y1="150" x2="824" y2="150" />
              <line x1="662" y1="180" x2="710" y2="180" />
              <line x1="730" y1="180" x2="778" y2="180" />
              <text x="642" y="128">no ligase: nicks remain</text>
            </g>
          ) : null}
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
                  setSession((current) => ({
                    ...current,
                    selectedEntities: [entity.id]
                  }))
                }
              >
                {entity.label}
              </button>
            </li>
          ))}
        </ul>
      </PanelBlock>

      <PanelBlock title="Relations">
        {model.relations.slice(0, 5).map((relation) => (
          <p key={relation.id}>{relation.source} -&gt; {relation.target}: {relation.relation}</p>
        ))}
      </PanelBlock>

      <PanelBlock title="Variables">
        <p>fork_position = {Math.round(session.playback.timelinePosition * 100)}%</p>
        <p>speed = {session.playback.speed}x</p>
        <p>ligase_present = {String(!session.hiddenEntities.includes("ligase"))}</p>
      </PanelBlock>

      <PanelBlock title="Assumptions">
        <p>{model.assumptions[0]}</p>
      </PanelBlock>

      <PanelBlock title="Governing rules">
        <p>synthesis_direction = 5&apos; -&gt; 3&apos;</p>
        <p>lagging_joining requires ligase_present</p>
      </PanelBlock>

      <PanelBlock title="Active intervention">
        <p>{session.activeIntervention}</p>
      </PanelBlock>
    </>
  );
}

function TimelineView({ session }: { session: SpatialSessionState }) {
  return (
    <div className="alternateView">
      {session.activeModel?.states.map((state) => (
        <section key={state.id} className={state.order / 4 <= session.playback.timelinePosition ? "activeStage" : ""}>
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
      <h2>Why Okazaki fragments are necessary</h2>
      <p>
        DNA polymerase can extend only in the 5&apos; to 3&apos; direction. At a replication fork,
        one new strand can follow the fork continuously, while the opposite template is
        exposed in the reverse orientation. The lagging strand is therefore synthesized
        in short 5&apos; to 3&apos; segments called Okazaki fragments, then processed and sealed.
      </p>
      <h3>Limitations</h3>
      {model?.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}
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
          className={session.activeIntervention !== "compare-no-ligase" ? "isSelected" : ""}
          onClick={() =>
            setSession((current) => ({ ...current, activeIntervention: "baseline" }))
          }
        >
          Baseline
        </button>
        <button
          type="button"
          className={session.activeIntervention === "compare-no-ligase" ? "isSelected" : ""}
          onClick={() =>
            setSession((current) =>
              applyFollowUpCommand(current, "compare normal replication with no ligase")
            )
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
          <option value="scene">3D scene</option>
          <option value="timeline">process timeline</option>
          <option value="graph">process graph</option>
          <option value="explanation">explanation</option>
          <option value="json">developer JSON</option>
        </select>
      </div>

      <div className="limitations">
        <p>Scientific limitations and citations</p>
        <p>
          {session.activeModel?.limitations[0]} Sources:{" "}
          {session.activeModel?.sources.map((source) => source.authors).join("; ")}
        </p>
      </div>
    </section>
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

function componentClass(selected: Set<string>, id: string) {
  return selected.has(id) ? "simComponent isActive" : "simComponent";
}
