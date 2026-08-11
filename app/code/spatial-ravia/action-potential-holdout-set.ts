export type ActionPotentialHoldoutCase = {
  id: string;
  category: string;
  prompt: string;
  expected:
    | {
        supported: true;
        requiredEntities: string[];
        forbiddenEntities?: string[];
        requiredRelations?: Array<{
          subject: string;
          relation: string;
          object: string;
        }>;
        currentPhase?: string;
        renderer: "mechanistic-3d";
      }
    | { supported: false };
};

function supported(
  category: string,
  prompts: string[],
  expected: Omit<Extract<ActionPotentialHoldoutCase["expected"], { supported: true }>, "supported">
) {
  return prompts.map((prompt, index) => ({
    id: `${category}-${String(index + 1).padStart(2, "0")}`,
    category,
    prompt,
    expected: { supported: true as const, ...expected },
  }));
}

function unsupported(category: string, prompts: string[]) {
  return prompts.map((prompt, index) => ({
    id: `${category}-${String(index + 1).padStart(2, "0")}`,
    category,
    prompt,
    expected: { supported: false as const },
  }));
}

const apCore = ["plasma-membrane", "voltage-gated-sodium-channel", "voltage-gated-potassium-channel", "membrane-potential"];
const gradients = [
  { subject: "sodium-ion", relation: "higher_concentration_in", object: "extracellular-space" },
  { subject: "potassium-ion", relation: "higher_concentration_in", object: "cytoplasm" },
];
const sodiumFlux = [{ subject: "sodium-current", relation: "flows_into", object: "cytoplasm" }];
const potassiumFlux = [{ subject: "potassium-current", relation: "flows_out_to", object: "extracellular-space" }];

export const actionPotentialHoldoutFrozen = true;
export const actionPotentialHoldoutVersion = "action-potential-holdout-v1";

export const actionPotentialHoldoutCases: ActionPotentialHoldoutCase[] = [
  ...supported("general-action-potential", [
    "show the local membrane events of a neuronal spike",
    "visualize a nerve impulse at one axon membrane patch",
    "show the voltage-gated channel sequence during a spike",
    "map the phases of a neuronal membrane spike",
    "show a membrane action potential with sodium and potassium channels",
    "visualize the ordered ion-channel states in a spike",
    "show an excitable membrane firing once",
    "what happens across the membrane during a nerve impulse",
    "show the local axon spike mechanism",
    "visualize the canonical action-potential phases",
    "show a single membrane spike from rest to recovery",
    "show how sodium and potassium channels shape an action potential",
  ], { renderer: "mechanistic-3d", requiredEntities: apCore, requiredRelations: [...gradients, ...sodiumFlux, ...potassiumFlux] }),
  ...supported("resting-potential", [
    "show the membrane at rest before a spike",
    "visualize the resting voltage-gated channel configuration",
    "what does the excitable membrane look like before firing",
    "show sodium outside and potassium inside at rest",
    "show closed sodium and potassium channels before the action potential",
    "show the representative minus seventy millivolt state",
    "show resting ionic gradients in an axon membrane",
    "visualize the pre-threshold resting membrane",
    "show available closed sodium channels at rest",
    "show the resting membrane potential setup",
  ], { renderer: "mechanistic-3d", requiredEntities: apCore, requiredRelations: gradients, currentPhase: "rest" }),
  ...supported("threshold", [
    "show the firing threshold opening sodium channels",
    "what changes when the membrane reaches threshold",
    "visualize the trigger point for a neuronal spike",
    "show initial sodium-channel opening at threshold",
    "show the membrane near the representative minus fifty-five millivolt point",
    "show enough depolarization to start the spike",
    "visualize threshold before the rising phase",
    "show sodium channels beginning to open at the trigger point",
    "show how threshold starts positive feedback",
    "show the threshold phase of a local action potential",
  ], { renderer: "mechanistic-3d", requiredEntities: apCore, requiredRelations: sodiumFlux, currentPhase: "threshold" }),
  ...supported("depolarization", [
    "show Na+ rushing inward in the rising phase",
    "why does the axon membrane voltage shoot upward",
    "visualize sodium influx making the inside less negative",
    "show voltage-gated sodium channels open during the upswing",
    "show inward Na current causing rapid depolarization",
    "what produces the rising limb of the spike",
    "show sodium entry through voltage-sensitive channels",
    "show depolarizing sodium current across the membrane",
    "visualize Na entering down its electrochemical gradient",
    "show the membrane becoming more positive from sodium influx",
    "show the AP rising phase without receptor signaling",
    "ignore receptor signaling and show sodium entry through voltage gates",
  ], { renderer: "mechanistic-3d", requiredEntities: ["voltage-gated-sodium-channel", "sodium-current", "membrane-potential"], requiredRelations: sodiumFlux, currentPhase: "depolarization" }),
  ...supported("peak-inactivation", [
    "show sodium channels once the spike reaches the top",
    "what happens to Na channels at the positive peak",
    "visualize channel inactivation at the apex of the spike",
    "show the point where sodium current shuts down and potassium begins",
    "show inactivated sodium channels near plus thirty millivolts",
    "show the peak before the falling phase",
    "what changes at the top of the action potential waveform",
    "show Na-channel inactivation and K-channel opening at peak",
    "visualize the transition from rising to falling phase",
    "show why sodium influx stops after the peak",
  ], { renderer: "mechanistic-3d", requiredEntities: apCore, requiredRelations: potassiumFlux, currentPhase: "peak" }),
  ...supported("repolarization", [
    "show K+ leaving during the falling phase",
    "what causes voltage to return negative after the spike top",
    "visualize outward potassium current repolarizing the membrane",
    "show open voltage-gated potassium channels after Na-channel inactivation",
    "show the membrane falling back down because K exits",
    "what produces repolarization in a neuron",
    "show potassium efflux after the action-potential peak",
    "visualize the AP falling limb",
    "show K current through delayed voltage-gated channels",
    "show the voltage drop driven by potassium leaving",
    "show repolarization without making a receptor pathway",
    "ignore translation and show potassium-driven repolarization",
  ], { renderer: "mechanistic-3d", requiredEntities: ["voltage-gated-potassium-channel", "potassium-current", "membrane-potential"], requiredRelations: potassiumFlux, currentPhase: "repolarization" }),
  ...supported("hyperpolarization", [
    "show the undershoot after the spike",
    "why does voltage dip below rest after repolarization",
    "visualize slow potassium-channel closing causing afterhyperpolarization",
    "show continued K efflux below the resting potential",
    "show afterhyperpolarization in a local membrane patch",
    "what causes the membrane to become too negative briefly",
    "show potassium channels still open during the undershoot",
    "visualize below-rest membrane voltage after a spike",
    "show the hyperpolarized state before recovery",
    "show the AP undershoot from lingering K conductance",
  ], { renderer: "mechanistic-3d", requiredEntities: ["voltage-gated-potassium-channel", "potassium-current", "membrane-potential"], requiredRelations: potassiumFlux, currentPhase: "hyperpolarization" }),
  ...supported("recovery-refractory", [
    "show channels returning to the resting configuration after a spike",
    "visualize sodium channels recovering from inactivation",
    "show potassium channels closing during recovery",
    "what restores channel availability after the action potential",
    "show why a neuron cannot immediately fire again",
    "visualize the absolute refractory idea from Na-channel inactivation",
    "show reduced excitability from lingering K conductance",
    "show recovery without reversing the ion gradients",
    "show sodium channel reset and potassium channel closure",
    "what happens after hyperpolarization ends",
  ], { renderer: "mechanistic-3d", requiredEntities: apCore, requiredRelations: gradients, currentPhase: "recovery" }),
  ...supported("ion-gradients-flux", [
    "which direction does Na+ move during the spike",
    "which direction does K+ move during repolarization",
    "place sodium mainly outside and potassium mainly inside",
    "show Na outside to inside and K inside to outside",
    "visualize the sodium gradient and the potassium gradient",
    "show electrochemical gradients for the action potential",
    "show ion movement directions without changing the gradients completely",
    "show inward sodium current and outward potassium current",
    "what way do the main ions cross the membrane",
    "show sodium influx versus potassium efflux",
    "show Na/K flux directions in an excitable membrane",
    "visualize the two opposing ion currents in a spike",
  ], { renderer: "mechanistic-3d", requiredEntities: ["sodium-ion", "potassium-ion", "sodium-current", "potassium-current"], requiredRelations: [...gradients, ...sodiumFlux, ...potassiumFlux] }),
  ...supported("channel-state", [
    "show a voltage-gated sodium channel by itself in the membrane",
    "show a voltage-gated potassium channel by itself in the membrane",
    "show sodium channels closed then open then inactivated",
    "show potassium channels opening with a delay",
    "show channel state changes across the spike phases",
    "visualize open closed and inactivated channel states",
    "show the Na channel gate sequence",
    "show the K channel delayed gate sequence",
    "show voltage-gated channel state transitions",
    "show ion channels crossing the axon membrane",
  ], { renderer: "mechanistic-3d", requiredEntities: ["plasma-membrane"], requiredRelations: [] }),
  ...unsupported("unsupported-cross-domain", [
    "show sodium",
    "show a membrane protein",
    "show electricity in a cell",
    "make the neuron fire somehow",
    "show a protein near sodium",
    "show a charged membrane object",
    "show a cellular wave",
    "show a channel without saying which channel",
    "show ions doing something",
    "show a membrane event",
    "show the cell becoming excited",
    "show a random ion channel thing",
    "show membrane biology",
    "draw cellular electricity",
    "show the spike protein",
  ]),
];
