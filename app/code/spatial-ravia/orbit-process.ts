import type {
  BiologicalProcessPack,
  ScientificClaim,
  ScientificClaimProvenance,
  ScientificEntity,
  ScientificEntityKind,
  ScientificIntervention,
  ScientificParameter,
  ScientificRelation,
  ScientificSource,
  ScientificState,
  ScientificTransition
} from "./model.ts";
import { validateBiologicalProcessPack } from "./model.ts";
import type { PhenomenonSpec } from "./phenomenon-spec.ts";
import type { ScientificPrimitive } from "./primitives.ts";
import { primitiveBase } from "./primitives.ts";
import {
  orbitBenchmarkMetadata,
  orbitBenchmarkPoints
} from "./orbit-fixture.ts";

const orbitSources: ScientificSource[] = [
  {
    id: "jpl-horizons-earth-sun-2026",
    title: "JPL Horizons Earth heliocentric vector benchmark",
    authors: "NASA/JPL Solar System Dynamics Group",
    locator: "Earth (399), Sun center (10), vectors, 2026-Jan-01 through 2026-Jan-06",
    note: "Authoritative geometric state vectors used as the offline benchmark fixture.",
    urlOrDoi: "https://ssd.jpl.nasa.gov/horizons/manual.html",
    publicationType: "database",
    accessDate: "2026-08-06",
    license: "NASA/JPL public ephemeris service metadata; fixture values are stored locally for reproducible validation."
  },
  {
    id: "jpl-horizons-api-docs",
    title: "JPL Horizons API documentation",
    authors: "NASA/JPL Solar System Dynamics Group",
    locator: "Horizons API vector table parameters",
    note: "Documents vector ephemeris output, units, centers, and table configuration.",
    urlOrDoi: "https://ssd-api.jpl.nasa.gov/doc/horizons.html",
    publicationType: "documentation",
    accessDate: "2026-08-06"
  },
  {
    id: "scipy-solve-ivp-docs",
    title: "SciPy integrate.solve_ivp documentation",
    authors: "SciPy developers",
    locator: "Initial value problem integration reference",
    note: "Reference for the offline ODE integration workflow used to generate the checked two-body fixture.",
    urlOrDoi: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html",
    publicationType: "documentation",
    accessDate: "2026-08-06"
  }
];

export const orbitPhenomenonSpec: PhenomenonSpec = {
  schemaVersion: "1.0.0",
  packVersion: "1.0.0",
  id: "two-body-orbit",
  title: "Two-body orbit",
  modelClass: "simulation",
  description: "A curated Sun-Earth two-body orbit scene checked against a local JPL Horizons fixture.",
  aliases: [
    "two-body orbit",
    "earth orbit",
    "earth around the sun",
    "orbital mechanics",
    "sun earth orbit"
  ],
  components: [
    component("sun", "Sun", "spatial-body", "Central gravitating body in the heliocentric two-body model.", ["orbit-claim-two-body"]),
    component("earth", "Earth", "spatial-body", "Orbiting body whose heliocentric state is benchmarked against JPL Horizons.", ["orbit-claim-jpl-benchmark"]),
    component("heliocentric-frame", "Heliocentric frame", "spatial-reference-frame", "Ecliptic J2000 frame centered on the Sun.", ["orbit-claim-frame"]),
    component("two-body-equation", "Two-body equation", "equation-model", "Sun-only gravitational equation used for the offline propagated model.", ["orbit-claim-equation"]),
    component("orbit-trajectory", "Orbit trajectory", "equation-state", "Fixed two-body trajectory over the benchmark interval.", ["orbit-claim-fixture"]),
    component("gravity-vector", "Gravity vector", "spatial-vector", "Direction of the central acceleration toward the Sun.", ["orbit-claim-equation"]),
    component("jpl-benchmark", "JPL benchmark", "equation-state", "Stored Horizons geometric vector checkpoints used for validation.", ["orbit-claim-jpl-benchmark"])
  ],
  relations: [
    relationSpec("sun-attracts-earth", "sun", "earth", "gravitationally attracts", "The Sun provides the central acceleration in the two-body model.", ["orbit-claim-equation"]),
    relationSpec("earth-state-in-frame", "earth", "heliocentric-frame", "state expressed in", "Earth state vectors are expressed in the ecliptic J2000 heliocentric frame.", ["orbit-claim-frame"]),
    relationSpec("trajectory-compared-to-jpl", "orbit-trajectory", "jpl-benchmark", "benchmarked against", "The local two-body fixture is checked against JPL vector checkpoints.", ["orbit-claim-jpl-benchmark"])
  ],
  states: [
    stateSpec("epoch-0", "Initial benchmark epoch", 0, "The model starts at the JPL initial Earth/Sun state.", ["sun", "earth", "heliocentric-frame", "two-body-equation", "jpl-benchmark"], ["orbit-claim-jpl-benchmark"]),
    stateSpec("epoch-1", "One day propagated", 1, "The Earth marker advances one day along the fixed two-body trajectory.", ["sun", "earth", "orbit-trajectory", "gravity-vector"], ["orbit-claim-fixture"]),
    stateSpec("epoch-3", "Mid benchmark interval", 2, "The scene shows accumulated two-body propagation against the stored benchmark.", ["sun", "earth", "orbit-trajectory", "jpl-benchmark"], ["orbit-claim-fixture"]),
    stateSpec("epoch-5", "Final benchmark epoch", 3, "The maximum fixture error remains inside the declared tolerance.", ["sun", "earth", "orbit-trajectory", "jpl-benchmark"], ["orbit-claim-tolerance"])
  ],
  transitions: [
    transitionSpec("propagate-day-1", "epoch-0", "epoch-1", "offline integration step", "Advance the fixed state trajectory by physical days.", ["orbit-claim-fixture"]),
    transitionSpec("propagate-midpoint", "epoch-1", "epoch-3", "continued offline integration", "Continue the Sun-Earth two-body trajectory.", ["orbit-claim-fixture"]),
    transitionSpec("validate-final-error", "epoch-3", "epoch-5", "benchmark comparison", "Compare final position error against declared tolerance.", ["orbit-claim-tolerance"])
  ],
  parameters: [
    {
      id: "solar-mu",
      label: "Solar gravitational parameter",
      value: {
        value: orbitBenchmarkMetadata.solarGravitationalParameterAu3PerDay2,
        unit: "AU^3/day^2",
        bounds: [0.00029, 0.0003],
        claimId: "orbit-claim-equation"
      },
      editable: false
    },
    {
      id: "benchmark-duration",
      label: "Benchmark duration",
      value: {
        value: 5,
        unit: "day",
        bounds: [0, 5],
        claimId: "orbit-claim-fixture"
      },
      editable: false
    },
    {
      id: "position-error-tolerance",
      label: "Position error tolerance",
      value: {
        value: orbitBenchmarkMetadata.maximumPositionErrorAu,
        unit: "AU",
        bounds: [0, 0.0001],
        claimId: "orbit-claim-tolerance"
      },
      editable: false
    }
  ],
  timeline: {
    basis: "physical",
    duration: {
      value: 5,
      unit: "day",
      bounds: [0, 5],
      claimId: "orbit-claim-fixture"
    },
    keyframes: [
      { at: 0, stateId: "epoch-0", claimIds: ["orbit-claim-jpl-benchmark"] },
      { at: 0.2, stateId: "epoch-1", claimIds: ["orbit-claim-fixture"] },
      { at: 0.6, stateId: "epoch-3", claimIds: ["orbit-claim-fixture"] },
      { at: 1, stateId: "epoch-5", claimIds: ["orbit-claim-tolerance"] }
    ]
  },
  views: [
    {
      id: "orbit-r3f-view",
      title: "Sun-Earth two-body spatial scene",
      kind: "spatial-scene",
      renderer: "r3f",
      evidenceMode: "derived",
      public: true,
      componentIds: ["sun", "earth", "heliocentric-frame", "two-body-equation", "orbit-trajectory", "gravity-vector", "jpl-benchmark"],
      synchronizedBy: "time"
    }
  ],
  interactions: [
    ...["sun", "earth", "orbit-trajectory", "gravity-vector", "jpl-benchmark"].flatMap((id) => [
      { id: `select-${id}`, type: "select" as const, targetIds: [id], description: `Select ${id}.` },
      { id: `hide-${id}`, type: "hide" as const, targetIds: [id], description: `Hide ${id}.` },
      { id: `isolate-${id}`, type: "isolate" as const, targetIds: [id], description: `Isolate ${id}.` }
    ]),
    {
      id: "playback-controls",
      type: "playback",
      targetIds: ["play", "pause", "restart", "timeline", "speed"],
      description: "Control physical-time playback, timeline position, and speed."
    }
  ],
  claims: [
    claimSpec("orbit-claim-two-body", "The visible orbit is a Sun-Earth two-body model, not an N-body solar-system simulation.", ["jpl-horizons-earth-sun-2026"], "verified", "assumption"),
    claimSpec("orbit-claim-jpl-benchmark", "The benchmark uses JPL Horizons Earth heliocentric geometric state vectors for 2026-Jan-01 through 2026-Jan-06.", ["jpl-horizons-earth-sun-2026", "jpl-horizons-api-docs"], "verified", "direct"),
    claimSpec("orbit-claim-frame", "The vector fixture uses the ecliptic J2000 frame with the Sun as center.", ["jpl-horizons-earth-sun-2026"], "verified", "direct"),
    claimSpec("orbit-claim-equation", "The offline model uses the standard central-gravity two-body acceleration with solar mu in AU^3/day^2.", ["scipy-solve-ivp-docs"], "verified", "inferred"),
    claimSpec("orbit-claim-fixture", "The rendered trajectory is a fixed offline fixture over five physical days, not a live browser-side equation solver.", ["scipy-solve-ivp-docs", "jpl-horizons-earth-sun-2026"], "verified", "direct"),
    claimSpec("orbit-claim-tolerance", `The maximum stored model-to-JPL position error is below ${orbitBenchmarkMetadata.maximumPositionErrorAu} AU for the benchmark epochs.`, ["jpl-horizons-earth-sun-2026"], "verified", "direct")
  ],
  sources: orbitSources.map((source) => ({
    id: source.id,
    title: source.title,
    authors: source.authors,
    locator: source.locator,
    urlOrDoi: source.urlOrDoi,
    publicationType:
      source.publicationType === "primary-literature" ? "primary-paper" :
      source.publicationType === "textbook" ? "review" :
      source.publicationType,
    accessDate: source.accessDate,
    license: source.license
  })),
  assumptions: [
    claimSpec("orbit-assumption-sun-only", "Only Sun-Earth two-body gravity is represented; lunar and planetary perturbations are intentionally omitted.", ["jpl-horizons-earth-sun-2026"], "verified", "assumption"),
    claimSpec("orbit-assumption-render-scale", "The 3D scene uses enlarged body markers and compressed distance for selection and teaching clarity.", ["jpl-horizons-api-docs"], "verified", "schematic-simplification")
  ],
  uncertainties: [
    claimSpec("orbit-uncertainty-short-window", "The declared tolerance applies only to the stored five-day benchmark window.", ["jpl-horizons-earth-sun-2026"], "uncertain", "assumption")
  ],
  limitations: [
    claimSpec("orbit-limitation-not-nbody", "Not an N-body mission simulation and not suitable for spacecraft navigation.", ["jpl-horizons-earth-sun-2026"], "verified", "schematic-simplification"),
    claimSpec("orbit-limitation-not-molecular", "The spatial renderer is schematic and not molecularly exact because it is orbital geometry, not molecular structure.", ["jpl-horizons-api-docs"], "verified", "schematic-simplification")
  ],
  supportedFollowUps: [
    "Show Earth orbit.",
    "Show a two-body orbit.",
    "Inspect Earth.",
    "Hide the benchmark markers.",
    "Isolate the gravity vector."
  ]
};

export const orbitPack: BiologicalProcessPack = {
  id: "two-body-orbit",
  phenomenonSpec: orbitPhenomenonSpec,
  process: "Two-body orbit",
  aliases: [
    "two-body orbit",
    "two body orbit",
    "earth orbit",
    "earth around the sun",
    "sun earth orbit",
    "orbital mechanics",
    "show orbit",
    "kepler orbit",
    "central gravity orbit"
  ],
  examples: [
    "Show Earth orbit.",
    "Show a two-body orbit.",
    "Visualize Earth around the Sun.",
    "Compare the two-body path to JPL."
  ],
  biologicalContexts: [
    "Sun-Earth two-body benchmark",
    "heliocentric Earth orbit"
  ],
  defaultContext: "Sun-Earth two-body benchmark",
  unsupportedMessage: "This prototype supports only the reviewed Sun-Earth two-body benchmark. It does not support N-body mission simulation, spacecraft navigation, or arbitrary orbital design.",
  entities: [
    entity("sun", "Sun", ["central body", "solar center"], "spatial-body", "Central body for the heliocentric two-body orbit.", false),
    entity("earth", "Earth", ["orbiting body", "planet"], "spatial-body", "Orbiting body advanced along the fixed offline trajectory.", false),
    entity("heliocentric-frame", "Heliocentric frame", ["ecliptic j2000", "sun-centered frame"], "spatial-reference-frame", "Sun-centered ecliptic J2000 coordinate frame.", false),
    entity("two-body-equation", "Two-body equation", ["central gravity equation", "solar gravity"], "equation-model", "Offline central-gravity model used to propagate the fixture.", false),
    entity("orbit-trajectory", "Orbit trajectory", ["orbit path", "trajectory"], "equation-state", "Fixed two-body trajectory for the five-day benchmark window.", false),
    entity("gravity-vector", "Gravity vector", ["central gravity", "acceleration vector", "central force"], "spatial-vector", "Direction of acceleration toward the Sun.", false),
    entity("jpl-benchmark", "JPL benchmark", ["jpl comparison markers", "comparison markers", "horizons vectors", "benchmark points"], "equation-state", "Stored JPL Horizons checkpoints for the same epochs.", false)
  ],
  relations: [
    relation("sun", "earth", "gravitationally attracts", "The Sun provides the central acceleration in the two-body model."),
    relation("earth", "heliocentric-frame", "state expressed in", "Earth vectors are represented in the Sun-centered ecliptic J2000 frame."),
    relation("orbit-trajectory", "jpl-benchmark", "benchmarked against", "The offline two-body path is checked against the JPL fixture."),
    relation("gravity-vector", "sun", "points toward", "The acceleration vector points from Earth toward the Sun.")
  ],
  states: [
    state("epoch-0", "Initial benchmark epoch", 0, "Earth starts at the JPL 2026-Jan-01 state.", ["sun", "earth", "heliocentric-frame", "jpl-benchmark"]),
    state("epoch-1", "One day propagated", 1, "Earth advances one physical day along the two-body fixture.", ["sun", "earth", "orbit-trajectory", "gravity-vector"]),
    state("epoch-3", "Mid benchmark interval", 2, "The benchmark comparison shows growing but bounded two-body error.", ["sun", "earth", "orbit-trajectory", "jpl-benchmark"]),
    state("epoch-5", "Final benchmark epoch", 3, "The final stored error remains under the declared tolerance.", ["sun", "earth", "orbit-trajectory", "jpl-benchmark"])
  ],
  transitions: [
    transition("propagate-day-1", "epoch-0", "epoch-1", "offline integration step", "physical_time_days advances"),
    transition("propagate-midpoint", "epoch-1", "epoch-3", "continued offline integration", "two_body_state follows central_gravity"),
    transition("validate-final-error", "epoch-3", "epoch-5", "benchmark comparison", "position_error remains below tolerance")
  ],
  parameters: [
    parameter("solar-mu", "Solar gravitational parameter", orbitBenchmarkMetadata.solarGravitationalParameterAu3PerDay2, "AU^3/day^2", "Central-gravity parameter used for the offline fixture."),
    parameter("benchmark-duration", "Benchmark duration", 5, "day", "Physical duration of the stored Horizons comparison window."),
    parameter("position-error-tolerance", "Position error tolerance", orbitBenchmarkMetadata.maximumPositionErrorAu, "AU", "Declared maximum allowable model-to-JPL position error.")
  ],
  interventions: [
    intervention("isolate-earth-state", "Isolate Earth state", "Focus the view on Earth, current vector, and orbit path.", ["earth", "orbit-trajectory", "gravity-vector"]),
    intervention("hide-benchmark-markers", "Hide benchmark markers", "Remove JPL checkpoint markers from the scene.", ["jpl-benchmark"]),
    intervention("show-gravity-vector", "Show gravity vector", "Select the central acceleration direction.", ["gravity-vector"]),
    intervention("inspect-tolerance", "Inspect tolerance", "Focus on the model-to-JPL error tolerance.", ["jpl-benchmark", "orbit-trajectory"])
  ],
  assumptions: [
    claim("orbit-assumption-sun-only", "Only Sun-Earth two-body gravity is represented; lunar and planetary perturbations are intentionally omitted.", "model-assumption", "jpl-horizons-earth-sun-2026"),
    claim("orbit-assumption-render-scale", "The 3D scene enlarges the Sun, Earth, markers, and vector arrows for selection and teaching clarity.", "schematic-simplification", "jpl-horizons-api-docs"),
    claim("orbit-assumption-offline-fixture", "The trajectory is generated offline and replayed as a fixed fixture, not solved live in the browser.", "model-assumption", "scipy-solve-ivp-docs")
  ],
  limitations: [
    claim("orbit-limitation-not-nbody", "This is not an N-body mission simulation and is not suitable for spacecraft navigation.", "schematic-simplification", "jpl-horizons-earth-sun-2026"),
    claim("orbit-limitation-short-window", "The benchmark tolerance applies only to the stored 2026-Jan-01 through 2026-Jan-06 interval.", "schematic-simplification", "jpl-horizons-earth-sun-2026"),
    claim("orbit-limitation-not-molecular", "The spatial renderer is schematic and not molecularly exact because it is orbital geometry, not molecular structure.", "schematic-simplification", "jpl-horizons-api-docs")
  ],
  sources: orbitSources,
  representationRules: [
    claim("orbit-rule-r3f", "Use an R3F spatial scene for the orbit because the representation is equation-derived spatial geometry.", "interpretation", "jpl-horizons-api-docs"),
    claim("orbit-rule-benchmark", "Render the local two-body path with JPL checkpoint markers and a declared error tolerance.", "interpretation", "jpl-horizons-earth-sun-2026"),
    claim("orbit-rule-offline", "Do not expose a general browser-side equation solver for this milestone.", "model-assumption", "scipy-solve-ivp-docs")
  ],
  commonMisconceptions: [
    claim("orbit-misconception-nbody", "A two-body orbit is not an N-body solar-system or mission-design simulation.", "direct-fact", "jpl-horizons-earth-sun-2026"),
    claim("orbit-misconception-literal-scale", "The body sizes and marker sizes in the renderer are not literal astronomical scale.", "schematic-simplification", "jpl-horizons-api-docs")
  ],
  validationRules: [
    {
      id: "required-orbit-entities",
      description: "Orbit pack requires bodies, frame, equation state, gravity vector, trajectory, and JPL benchmark.",
      requiredEntities: [
        "sun",
        "earth",
        "heliocentric-frame",
        "two-body-equation",
        "orbit-trajectory",
        "gravity-vector",
        "jpl-benchmark"
      ],
      requiredParameters: [
        { id: "solar-mu", value: orbitBenchmarkMetadata.solarGravitationalParameterAu3PerDay2 },
        { id: "benchmark-duration", value: 5 },
        { id: "position-error-tolerance", value: orbitBenchmarkMetadata.maximumPositionErrorAu }
      ],
      requiredRelations: [
        { source: "sun", target: "earth", relation: "gravitationally attracts" },
        { source: "orbit-trajectory", target: "jpl-benchmark", relation: "benchmarked against" }
      ],
      forbiddenVerifiedClaimPatterns: [
        {
          pattern: "\\bN-body mission simulation\\b.*\\bverified\\b",
          message: "The two-body pack must not claim N-body mission simulation support."
        }
      ]
    }
  ],
  incompatibilityRules: [
    {
      id: "no-nbody-mission-simulation",
      reason: "The orbit slice only supports a reviewed Sun-Earth two-body benchmark, not N-body mission simulation or spacecraft navigation.",
      match: [
        { any: ["n-body", "n body", "three body", "multi body", "mission", "spacecraft", "trajectory design", "lunar perturbation"] }
      ]
    },
    {
      id: "no-third-body-perturbation",
      reason: "The orbit slice supports only the reviewed Sun-Earth two-body benchmark; Jupiter or other third-body perturbations are outside this model.",
      match: [
        { any: ["jupiter", "third body", "perturbing", "perturbation"] },
        { any: ["earth orbit", "two-body orbit", "orbit"] }
      ]
    }
  ],
  promptRules: [
    {
      id: "show-earth-orbit",
      hints: ["earth orbit", "earth around the sun", "two-body orbit", "orbital mechanics"],
      context: "Sun-Earth two-body benchmark",
      intent: "Show the reviewed Sun-Earth two-body orbit benchmark."
    },
    {
      id: "compare-jpl",
      hints: ["compare to jpl", "benchmark", "horizons"],
      context: "Sun-Earth two-body benchmark",
      intent: "Show the JPL benchmark markers with the two-body path.",
      suggestedCommandId: "select-benchmark"
    }
  ],
  commandRules: [
    {
      id: "select-earth",
      phrases: ["inspect earth", "select earth", "show earth state"],
      patch: { selectedEntities: ["earth"] },
      response: "Selected Earth in the two-body orbit scene."
    },
    {
      id: "select-benchmark",
      phrases: ["inspect benchmark", "select jpl", "compare to jpl", "show benchmark"],
      patch: { selectedEntities: ["jpl-benchmark"] },
      response: "Selected the stored JPL benchmark checkpoints."
    },
    {
      id: "hide-benchmark",
      phrases: ["hide benchmark", "hide jpl", "remove benchmark markers"],
      patch: { hiddenEntities: { add: ["jpl-benchmark"] }, activeIntervention: "hide-benchmark-markers" },
      response: "Hid the benchmark markers while preserving the orbit path."
    },
    {
      id: "isolate-gravity",
      phrases: ["isolate gravity", "show gravity vector", "select gravity vector"],
      patch: { isolatedEntity: "gravity-vector", selectedEntities: ["gravity-vector"], activeIntervention: "show-gravity-vector" },
      response: "Isolated the central gravity vector."
    }
  ],
  animation: {
    planId: "two-body-orbit-r3f",
    title: "Two-body orbit / Sun-Earth benchmark",
    subtitle: "Equation-derived spatial scene; physical time in days; JPL Horizons benchmark fixture",
    ariaLabel: "Equation-derived Sun-Earth two-body orbit with JPL benchmark markers.",
    viewBox: "0 0 1000 620",
    progressDurationMs: 9000,
    isolationGroups: {
      sun: ["sun", "earth", "orbit-trajectory", "gravity-vector"],
      earth: ["earth", "orbit-trajectory", "gravity-vector", "jpl-benchmark"],
      "orbit-trajectory": ["orbit-trajectory", "earth", "sun", "jpl-benchmark"],
      "gravity-vector": ["gravity-vector", "earth", "sun"],
      "jpl-benchmark": ["jpl-benchmark", "orbit-trajectory", "earth"]
    },
    primitives: orbitPrimitives()
  },
  scaleDistortions: [
    "Body radii and marker sizes are enlarged relative to orbital distance.",
    "Only five days of a heliocentric orbit are shown in the benchmark fixture.",
    "The rendered path is equation-derived and not molecularly exact."
  ]
};

const validation = validateBiologicalProcessPack(orbitPack);
if (!validation.valid) {
  throw new Error(`Invalid orbit pack:\n${validation.errors.join("\n")}`);
}

function orbitPrimitives(): ScientificPrimitive[] {
  return [
    primitiveBase({
      id: "orbit-background",
      kind: "field",
      geometryType: "area",
      semanticRole: "spatial reference grid",
      styleToken: "field",
      classification: "schematic",
      selectable: { enabled: false },
      geometry: { d: () => "M40 40 H960 V580 H40 Z" },
      provenance: [{ sourceId: "jpl-horizons-api-docs", note: "Renderer frame is schematic." }]
    }),
    primitiveBase({
      id: "orbit-path",
      kind: "connector",
      entityId: "orbit-trajectory",
      geometryType: "path",
      semanticRole: "two-body trajectory",
      styleToken: "secondary",
      classification: "mixed",
      geometry: { d: () => "M500 310 m-320 0 a320 250 0 1 0 640 0 a320 250 0 1 0 -640 0" },
      labels: [{ text: "Two-body path", at: [610, 96], visibility: { mode: "labels" } }],
      provenance: [{ sourceId: "scipy-solve-ivp-docs", note: "Fixed offline two-body trajectory." }]
    }),
    primitiveBase({
      id: "sun-body",
      kind: "particle",
      entityId: "sun",
      geometryType: "circle",
      semanticRole: "central body",
      styleToken: "accent",
      classification: "schematic",
      geometry: { cx: 500, cy: 310, r: 38 },
      labels: [{ text: "Sun", at: [542, 304], visibility: { mode: "labels" } }],
      provenance: [{ sourceId: "jpl-horizons-earth-sun-2026", note: "Sun-centered benchmark frame." }]
    }),
    primitiveBase({
      id: "earth-body",
      kind: "particle",
      entityId: "earth",
      geometryType: "circle",
      semanticRole: "orbiting body",
      styleToken: "primary",
      classification: "mixed",
      geometry: { cx: { base: 430, progress: -88 }, cy: { base: 70, progress: 5 }, r: 20 },
      labels: [{ text: "Earth", at: [{ base: 458, progress: -88 }, { base: 74, progress: 5 }], visibility: { mode: "labels" } }],
      provenance: [{ sourceId: "jpl-horizons-earth-sun-2026", note: "Earth state uses the benchmark interval." }]
    }),
    primitiveBase({
      id: "jpl-benchmark-markers",
      kind: "connector",
      entityId: "jpl-benchmark",
      geometryType: "path",
      semanticRole: "benchmark checkpoints",
      styleToken: "guide",
      classification: "mixed",
      geometry: { d: () => benchmarkMarkerPath() },
      labels: [{ text: "JPL checkpoints", at: [676, 550], visibility: { mode: "labels" } }],
      provenance: [{ sourceId: "jpl-horizons-earth-sun-2026", note: "Horizons geometric vectors." }]
    }),
    primitiveBase({
      id: "gravity-vector-arrow",
      kind: "directional-arrow",
      entityId: "gravity-vector",
      geometryType: "line",
      semanticRole: "central acceleration vector",
      styleToken: "warning",
      classification: "schematic",
      geometry: { x1: { base: 430, progress: -88 }, y1: { base: 70, progress: 5 }, x2: 500, y2: 310 },
      labels: [{ text: "Acceleration toward Sun", at: [250, 218], visibility: { mode: "directionality" } }],
      provenance: [{ sourceId: "scipy-solve-ivp-docs", note: "Central force direction." }]
    })
  ];
}

function benchmarkMarkerPath() {
  return orbitBenchmarkPoints
    .map((point) => {
      const x = 500 + point.jpl.xAu * 390;
      const y = 310 - point.jpl.yAu * 250;
      return `M${(x - 6).toFixed(1)} ${y.toFixed(1)} h12 M${x.toFixed(1)} ${(y - 6).toFixed(1)} v12`;
    })
    .join(" ");
}

function entity(
  id: string,
  label: string,
  aliases: string[],
  kind: ScientificEntityKind,
  description: string,
  literal: boolean
): ScientificEntity {
  return {
    id,
    label,
    aliases,
    kind,
    description,
    literal,
    schematic: true,
    provenance: [provenanceFor(id)]
  };
}

function relation(source: string, target: string, relationName: string, description: string): ScientificRelation {
  return {
    id: `${source}-${relationName.replaceAll(" ", "-")}-${target}`,
    source,
    target,
    relation: relationName,
    description,
    provenance: [provenanceFor("orbit-claim-equation")]
  };
}

function state(id: string, label: string, order: number, description: string, activeEntities: string[]): ScientificState {
  return {
    id,
    label,
    order,
    description,
    activeEntities,
    provenance: [provenanceFor("orbit-claim-fixture")]
  };
}

function transition(id: string, from: string, to: string, trigger: string, rule: string): ScientificTransition {
  return {
    id,
    from,
    to,
    trigger,
    rule,
    provenance: [provenanceFor("orbit-claim-fixture")]
  };
}

function parameter(
  id: string,
  label: string,
  value: ScientificParameter["value"],
  unit: string,
  description: string
): ScientificParameter {
  return {
    id,
    label,
    value,
    unit,
    description,
    provenance: [provenanceFor(id === "solar-mu" ? "orbit-claim-equation" : "orbit-claim-fixture")]
  };
}

function intervention(
  id: string,
  label: string,
  description: string,
  affectedEntities: string[]
): ScientificIntervention {
  return { id, label, description, affectedEntities };
}

function claim(
  id: string,
  text: string,
  claimType: ScientificClaim["claimType"],
  sourceId: string
): ScientificClaim {
  return {
    id,
    claim: text,
    claimType,
    status: "verified",
    provenance: [provenance(sourceId, text, claimType)]
  };
}

function provenanceFor(id: string): ScientificClaimProvenance {
  const sourceId = id.includes("jpl") || id.includes("benchmark") || id.includes("frame")
    ? "jpl-horizons-earth-sun-2026"
    : id.includes("mu") || id.includes("equation")
      ? "scipy-solve-ivp-docs"
      : "jpl-horizons-api-docs";

  return provenance(sourceId, `Supports ${id}.`, "interpretation");
}

function provenance(
  sourceId: string,
  supportedClaim: string,
  supportType: ScientificClaim["claimType"]
): ScientificClaimProvenance {
  const source = orbitSources.find((candidate) => candidate.id === sourceId) ?? orbitSources[0];

  return {
    sourceId: source.id,
    title: source.title,
    authorsOrInstitution: source.authors,
    urlOrDoi: source.urlOrDoi,
    publicationType: source.publicationType,
    accessDate: source.accessDate,
    confidence: 0.9,
    supportedClaim,
    supportType,
    claimStatus: "verified",
    license: source.license
  };
}

function component(
  id: string,
  label: string,
  kind: PhenomenonSpec["components"][number]["kind"],
  description: string,
  claimIds: string[]
): PhenomenonSpec["components"][number] {
  return {
    id,
    label,
    kind,
    description,
    claimIds,
    evidenceMode: "derived",
    geometry: { primitiveIds: [], role: kind }
  };
}

function relationSpec(
  id: string,
  sourceComponentId: string,
  targetComponentId: string,
  relationName: string,
  description: string,
  claimIds: string[]
): PhenomenonSpec["relations"][number] {
  return { id, sourceComponentId, targetComponentId, relation: relationName, description, claimIds };
}

function stateSpec(
  id: string,
  label: string,
  order: number,
  description: string,
  activeComponentIds: string[],
  claimIds: string[]
): PhenomenonSpec["states"][number] {
  return { id, label, order, description, activeComponentIds, claimIds };
}

function transitionSpec(
  id: string,
  fromStateId: string,
  toStateId: string,
  trigger: string,
  rule: string,
  claimIds: string[]
): PhenomenonSpec["transitions"][number] {
  return { id, fromStateId, toStateId, trigger, rule, claimIds };
}

function claimSpec(
  id: string,
  text: string,
  sourceIds: string[],
  status: PhenomenonSpec["claims"][number]["status"],
  support: PhenomenonSpec["claims"][number]["support"]
): PhenomenonSpec["claims"][number] {
  return { id, text, sourceIds, status, support };
}
