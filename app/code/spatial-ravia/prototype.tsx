"use client";

import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

type ComponentId =
  | "helicase"
  | "parentalTop"
  | "parentalBottom"
  | "leadingStrand"
  | "laggingStrand"
  | "rnaPrimers"
  | "okazakiFragments"
  | "polymerase"
  | "ligase";

type Representation = "3D scene" | "process graph" | "equations" | "explanation";

type ScientificModel = {
  prompt: string;
  demo: "DNA replication";
  representation: Representation;
  time: number;
  speed: number;
  paused: boolean;
  zoom: number;
  rotation: number;
  selected: ComponentId | null;
  hidden: ComponentId[];
  isolated: ComponentId | null;
  showPrimers: boolean;
  showRules: boolean;
  compareNoLigase: boolean;
  activeIntervention: string;
};

type Entity = {
  id: ComponentId;
  label: string;
  role: string;
};

const examples = [
  "Show DNA replication at the replication fork",
  "Visualize orbital motion around Earth",
  "Explain quantum tunnelling"
];

const entities: Entity[] = [
  {
    id: "helicase",
    label: "Helicase",
    role: "Unwinds parental DNA ahead of the replication fork."
  },
  {
    id: "parentalTop",
    label: "Parental strand A",
    role: "Original template strand."
  },
  {
    id: "parentalBottom",
    label: "Parental strand B",
    role: "Original template strand."
  },
  {
    id: "leadingStrand",
    label: "Leading strand",
    role: "Synthesized continuously toward the fork."
  },
  {
    id: "laggingStrand",
    label: "Lagging strand",
    role: "Synthesized discontinuously away from the fork."
  },
  {
    id: "rnaPrimers",
    label: "RNA primers",
    role: "Short starting segments for DNA polymerase."
  },
  {
    id: "okazakiFragments",
    label: "Okazaki fragments",
    role: "Short lagging-strand DNA fragments."
  },
  {
    id: "polymerase",
    label: "Polymerase",
    role: "Extends new DNA in the 5' to 3' direction."
  },
  {
    id: "ligase",
    label: "Ligase",
    role: "Seals nicks between Okazaki fragments."
  }
];

const initialModel: ScientificModel = {
  prompt: "Show DNA replication at the replication fork",
  demo: "DNA replication",
  representation: "3D scene",
  time: 0,
  speed: 1,
  paused: false,
  zoom: 1,
  rotation: 0,
  selected: null,
  hidden: [],
  isolated: null,
  showPrimers: true,
  showRules: false,
  compareNoLigase: false,
  activeIntervention: "baseline"
};

export function SpatialRaviaPrototype() {
  const [model, setModel] = useState<ScientificModel>(initialModel);
  const [prompt, setPrompt] = useState(initialModel.prompt);
  const [command, setCommand] = useState("");
  const previousTick = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;

    const tick = (now: number) => {
      if (previousTick.current === null) {
        previousTick.current = now;
      }

      const delta = now - previousTick.current;
      previousTick.current = now;

      setModel((current) => {
        if (current.paused) {
          return current;
        }

        return {
          ...current,
          time: (current.time + (delta / 9000) * current.speed) % 1
        };
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const visibleEntities = useMemo(
    () =>
      entities.filter((entity) => {
        if (model.hidden.includes(entity.id)) {
          return false;
        }

        return model.isolated ? entity.id === model.isolated : true;
      }),
    [model.hidden, model.isolated]
  );

  function updateModel(patch: Partial<ScientificModel>) {
    setModel((current) => ({ ...current, ...patch }));
  }

  function restart() {
    updateModel({
      time: 0,
      paused: false,
      activeIntervention: "restarted baseline playback"
    });
  }

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = prompt.trim() || initialModel.prompt;

    setModel({
      ...initialModel,
      prompt: normalized,
      demo: "DNA replication",
      activeIntervention:
        normalized === initialModel.prompt
          ? "baseline"
          : "prototype maps unsupported prompts back to DNA replication"
    });
  }

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyCommand(command);
    setCommand("");
  }

  function applyCommand(value: string) {
    const normalized = value.trim().toLowerCase();

    setModel((current) => {
      if (normalized === "hide helicase") {
        return {
          ...current,
          hidden: addUnique(current.hidden, "helicase"),
          selected: null,
          activeIntervention: "hide helicase"
        };
      }

      if (normalized === "isolate lagging strand") {
        return {
          ...current,
          isolated: "laggingStrand",
          selected: "laggingStrand",
          activeIntervention: "isolate lagging strand"
        };
      }

      if (normalized === "remove ligase") {
        return {
          ...current,
          hidden: addUnique(current.hidden, "ligase"),
          compareNoLigase: true,
          activeIntervention: "remove ligase"
        };
      }

      if (normalized === "slow down") {
        return {
          ...current,
          speed: Math.max(0.25, current.speed / 2),
          activeIntervention: "slow down"
        };
      }

      if (normalized === "pause") {
        return { ...current, paused: true, activeIntervention: "pause" };
      }

      if (normalized === "restart") {
        return {
          ...initialModel,
          prompt: current.prompt,
          activeIntervention: "restart"
        };
      }

      if (normalized === "show primers") {
        return {
          ...current,
          showPrimers: true,
          hidden: current.hidden.filter((id) => id !== "rnaPrimers"),
          selected: "rnaPrimers",
          activeIntervention: "show primers"
        };
      }

      if (normalized === "compare normal vs no ligase") {
        return {
          ...current,
          compareNoLigase: true,
          activeIntervention: "compare normal vs no ligase"
        };
      }

      if (
        normalized === "show equations / rules" ||
        normalized === "show equations" ||
        normalized === "show rules"
      ) {
        return {
          ...current,
          showRules: true,
          representation: "equations",
          activeIntervention: "show equations / rules"
        };
      }

      return {
        ...current,
        activeIntervention: "unsupported command: deterministic prototype abstained"
      };
    });
  }

  return (
    <main className="spatialWorkspace">
      <section className="workspaceTop" aria-labelledby="spatial-title">
        <p>Spatial Ravia / prototype</p>
        <h1 id="spatial-title">DNA replication workspace</h1>
        <span>Schematic, not molecularly exact</span>
      </section>

      <div className="workspaceShell">
        <aside className="workspacePanel leftPanel" aria-label="Prompt controls">
          <form className="promptForm" onSubmit={generate}>
            <label htmlFor="science-prompt">
              Describe a scientific process you want to understand
            </label>
            <textarea
              id="science-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div className="examplePrompts" aria-label="Example prompts">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </button>
              ))}
            </div>
            <button className="primaryAction" type="submit">
              Generate
            </button>
          </form>

          <PanelBlock title="Model assumptions">
            <p>Double-stranded DNA is represented as two template curves.</p>
            <p>Replication proceeds from left to right at one fork.</p>
            <p>Leading synthesis is continuous; lagging synthesis is segmented.</p>
          </PanelBlock>

          <PanelBlock title="Sources">
            <p>Alberts et al., Essential Cell Biology.</p>
            <p>NCBI Bookshelf: DNA replication overview.</p>
          </PanelBlock>

          <PanelBlock title="Accuracy / status">
            <p>{model.activeIntervention}</p>
            <p>Validated only as a schematic teaching representation.</p>
          </PanelBlock>
        </aside>

        <section className="simulationColumn" aria-label="Simulation workspace">
          <div className="canvasToolbar" aria-label="Simulation controls">
            <button type="button" onClick={() => updateModel({ paused: true })}>
              Pause
            </button>
            <button type="button" onClick={() => updateModel({ paused: false })}>
              Resume
            </button>
            <button type="button" onClick={restart}>
              Restart
            </button>
            <button
              type="button"
              onClick={() =>
                updateModel({ speed: Math.max(0.25, model.speed / 2) })
              }
            >
              Slow down
            </button>
            <label>
              Zoom
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.05"
                value={model.zoom}
                onChange={(event) =>
                  updateModel({ zoom: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Rotate
              <input
                type="range"
                min="-18"
                max="18"
                step="1"
                value={model.rotation}
                onChange={(event) =>
                  updateModel({ rotation: Number(event.target.value) })
                }
              />
            </label>
          </div>

          <SimulationCanvas model={model} updateModel={updateModel} />
        </section>

        <aside className="workspacePanel rightPanel" aria-label="Internal model">
          <PanelBlock title="Current internal model">
            <p>{model.demo}</p>
            <p>{model.representation}</p>
            <p>Time {model.time.toFixed(2)} / speed {model.speed.toFixed(2)}x</p>
          </PanelBlock>

          <PanelBlock title="Entities">
            <ul>
              {visibleEntities.map((entity) => (
                <li
                  className={model.selected === entity.id ? "activeEntity" : ""}
                  key={entity.id}
                >
                  {entity.label}
                </li>
              ))}
            </ul>
          </PanelBlock>

          <PanelBlock title="Relations">
            <p>Helicase opens the fork.</p>
            <p>Polymerase extends from primers.</p>
            <p>Ligase joins adjacent Okazaki fragments.</p>
          </PanelBlock>

          <PanelBlock title="Variables">
            <p>fork_position = {Math.round(model.time * 100)}%</p>
            <p>primer_visibility = {model.showPrimers ? "on" : "off"}</p>
            <p>ligase_present = {model.hidden.includes("ligase") ? "false" : "true"}</p>
          </PanelBlock>

          <PanelBlock title="Assumptions">
            <p>Single origin segment; enzymes are symbolic markers.</p>
          </PanelBlock>

          <PanelBlock title="Governing rules">
            {model.showRules ? (
              <p>
                new_DNA_length = fork_rate * time; lagging_joining requires
                ligase_present.
              </p>
            ) : (
              <p>Use "show equations / rules" to reveal symbolic rules.</p>
            )}
          </PanelBlock>

          <PanelBlock title="Active intervention">
            <p>{model.activeIntervention}</p>
          </PanelBlock>

          <form className="commandForm" onSubmit={submitCommand}>
            <label htmlFor="follow-up-command">Follow-up command</label>
            <input
              id="follow-up-command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="hide helicase"
            />
            <button type="submit">Apply</button>
          </form>
        </aside>
      </div>

      <section className="bottomPanel" aria-label="Timeline and representation controls">
        <div className="timelineControl">
          <label htmlFor="timeline">Timeline</label>
          <input
            id="timeline"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={model.time}
            onChange={(event) =>
              updateModel({ time: Number(event.target.value), paused: true })
            }
          />
        </div>

        <div className="segmentedControl" aria-label="Baseline or intervention">
          <button
            type="button"
            className={!model.compareNoLigase ? "isSelected" : ""}
            onClick={() => updateModel({ compareNoLigase: false })}
          >
            Baseline
          </button>
          <button
            type="button"
            className={model.compareNoLigase ? "isSelected" : ""}
            onClick={() =>
              updateModel({
                compareNoLigase: true,
                activeIntervention: "compare normal vs no ligase"
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
            value={model.representation}
            onChange={(event) =>
              updateModel({
                representation: event.target.value as Representation,
                showRules: event.target.value === "equations" || model.showRules
              })
            }
          >
            <option>3D scene</option>
            <option>process graph</option>
            <option>equations</option>
            <option>explanation</option>
          </select>
        </div>

        <div className="limitations">
          <p>Scientific limitations and citations</p>
          <p>
            Schematic geometry, mocked timing, no atomistic forces, no sequence
            specificity. Citations: Alberts et al.; NCBI Bookshelf.
          </p>
        </div>
      </section>
    </main>
  );
}

function SimulationCanvas({
  model,
  updateModel
}: {
  model: ScientificModel;
  updateModel: (patch: Partial<ScientificModel>) => void;
}) {
  const forkX = 278 + model.time * 290;
  const componentVisible = (id: ComponentId) =>
    !model.hidden.includes(id) && (!model.isolated || model.isolated === id);

  const select = (id: ComponentId) => updateModel({ selected: id });
  const interactiveProps = (id: ComponentId) => ({
    role: "button",
    tabIndex: 0,
    onClick: () => select(id),
    onKeyDown: (event: KeyboardEvent<SVGGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select(id);
      }
    }
  });
  const selectedEntity = entities.find((entity) => entity.id === model.selected);

  return (
    <div className="simulationCanvas">
      <div className="canvasMeta">
        <p>Default demo: DNA replication</p>
        <p>Schematic, not molecularly exact</p>
      </div>

      <svg
        viewBox="0 0 900 560"
        role="img"
        aria-label="Animated schematic of a DNA replication fork"
      >
        <g
          style={{
            transform: `translate(450px, 280px) rotate(${model.rotation}deg) scale(${model.zoom}) translate(-450px, -280px)`
          }}
        >
          <path className="forkGuide" d="M118 280 C230 232 336 230 452 280" />
          <path className="forkGuide" d="M118 280 C230 328 336 330 452 280" />

          {componentVisible("parentalTop") ? (
            <g {...interactiveProps("parentalTop")}>
              <path
                className={componentClass(model, "parentalTop")}
                d={`M118 280 C230 232 ${forkX - 90} 228 ${forkX} 222 C640 192 724 148 800 96`}
              />
            </g>
          ) : null}

          {componentVisible("parentalBottom") ? (
            <g {...interactiveProps("parentalBottom")}>
              <path
                className={componentClass(model, "parentalBottom")}
                d={`M118 280 C230 328 ${forkX - 90} 332 ${forkX} 338 C640 368 724 412 800 464`}
              />
            </g>
          ) : null}

          {componentVisible("leadingStrand") ? (
            <g {...interactiveProps("leadingStrand")}>
              <path
                className={componentClass(model, "leadingStrand")}
                d={`M132 292 C238 316 ${forkX - 88} 318 ${forkX - 20} 335`}
              />
            </g>
          ) : null}

          {componentVisible("laggingStrand") ? (
            <g {...interactiveProps("laggingStrand")}>
              <g className={componentClass(model, "laggingStrand")}>
                <path d={`M${forkX - 38} 232 C${forkX - 88} 238 ${forkX - 132} 256 ${forkX - 176} 270`} />
                <path d={`M${forkX - 132} 252 C${forkX - 184} 262 ${forkX - 228} 274 ${forkX - 270} 286`} />
                <path d={`M${forkX - 232} 272 C${forkX - 282} 284 ${forkX - 326} 292 ${forkX - 360} 300`} />
              </g>
            </g>
          ) : null}

          {model.showPrimers && componentVisible("rnaPrimers") ? (
            <g {...interactiveProps("rnaPrimers")}>
              <g className={componentClass(model, "rnaPrimers")}>
                <line x1={forkX - 52} y1="232" x2={forkX - 28} y2="226" />
                <line x1={forkX - 146} y1="254" x2={forkX - 122} y2="248" />
                <line x1={forkX - 246} y1="276" x2={forkX - 222} y2="270" />
              </g>
            </g>
          ) : null}

          {componentVisible("okazakiFragments") ? (
            <g {...interactiveProps("okazakiFragments")}>
              <g className={componentClass(model, "okazakiFragments")}>
                <rect x={forkX - 182} y="265" width="48" height="8" />
                <rect x={forkX - 278} y="287" width="58" height="8" />
                <rect x={forkX - 358} y="304" width="44" height="8" />
              </g>
            </g>
          ) : null}

          {componentVisible("helicase") ? (
            <g {...interactiveProps("helicase")}>
              <g className={componentClass(model, "helicase")}>
                <polygon
                  points={`${forkX - 24},280 ${forkX + 4},248 ${forkX + 42},280 ${forkX + 4},312`}
                />
                <text x={forkX + 56} y="284">helicase</text>
              </g>
            </g>
          ) : null}

          {componentVisible("polymerase") ? (
            <g {...interactiveProps("polymerase")}>
              <g className={componentClass(model, "polymerase")}>
                <circle cx={forkX - 38} cy="336" r="22" />
                <circle cx={forkX - 78} cy="238" r="18" />
                <text x={forkX - 20} y="378">polymerase</text>
              </g>
            </g>
          ) : null}

          {componentVisible("ligase") ? (
            <g {...interactiveProps("ligase")}>
              <g className={componentClass(model, "ligase")}>
                <rect x={forkX - 318} y="268" width="28" height="28" />
                <text x={forkX - 344} y="326">ligase</text>
              </g>
            </g>
          ) : null}

          {model.compareNoLigase ? (
            <g className="comparisonLayer">
              <line x1="620" y1="150" x2="808" y2="150" />
              <line x1="642" y1="180" x2="695" y2="180" />
              <line x1="712" y1="180" x2="765" y2="180" />
              <text x="620" y="128">no ligase: fragment joins unresolved</text>
            </g>
          ) : null}
        </g>
      </svg>

      <div className="selectionReadout">
        <p>{selectedEntity ? selectedEntity.label : "Select a component"}</p>
        <span>{selectedEntity ? selectedEntity.role : "Clickable schematic parts update the internal model."}</span>
      </div>
    </div>
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

function componentClass(model: ScientificModel, id: ComponentId) {
  const classes = ["simComponent", id];

  if (model.selected === id) {
    classes.push("isActive");
  }

  if (model.isolated && model.isolated !== id) {
    classes.push("isMuted");
  }

  return classes.join(" ");
}

function addUnique(values: ComponentId[], value: ComponentId) {
  return values.includes(value) ? values : [...values, value];
}
