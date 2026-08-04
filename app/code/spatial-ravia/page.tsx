import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spatial Ravia | Ravia Lab",
  description:
    "A conversational scientific world-model system for interactive scientific representations."
};

const milestones = [
  "Define the narrow MVP and supported scientific domains.",
  "Design the Scientific Intermediate Representation.",
  "Define entities, variables, equations, units, assumptions, and interventions.",
  "Build persistent session state for follow-up prompts.",
  "Create a validated model/template registry.",
  "Implement natural-language prompt -> structured model conversion.",
  "Add deterministic validation and abstention rules.",
  "Build representation selection: 3D, graph, field, state space, or mixed.",
  "Create the first three cross-domain demos.",
  "Add counterfactual controls, citations, limitations, and evaluation tests."
];

const demos = [
  "DNA replication",
  "Orbital mechanics or projectile motion",
  "Quantum tunnelling"
];

const representations = [
  "3D scenes",
  "Fields",
  "Graphs",
  "State spaces",
  "Equation-driven animations",
  "Mixed views"
];

export default function SpatialRaviaPage() {
  return (
    <main className="projectPage spatialRaviaPage">
      <section className="projectHero" aria-labelledby="spatial-ravia-title">
        <p className="projectKicker">Code / Project structure</p>
        <div className="projectTitleBlock">
          <h1 id="spatial-ravia-title">Spatial Ravia</h1>
          <p>
            A conversational scientific world-model system that converts
            natural-language questions into the most appropriate interactive
            scientific representation.
          </p>
        </div>
      </section>

      <section className="projectBody" aria-label="Spatial Ravia structure">
        <div className="projectAside">
          <p>Initial scope</p>
          <p>
            No full simulator yet. This page defines the early structure:
            internal model, validated transformations, representation choice,
            and first demonstration targets.
          </p>
        </div>

        <div className="projectMain">
          <section className="projectSection" aria-labelledby="model-title">
            <h2 id="model-title">World Model</h2>
            <p>
              Spatial Ravia should maintain a persistent internal model so a
              user can modify parameters, remove components, test
              counterfactuals, inspect equations, compare outcomes, and preserve
              context across follow-up prompts.
            </p>
          </section>

          <section
            className="projectSection"
            aria-labelledby="representations-title"
          >
            <h2 id="representations-title">Representations</h2>
            <ul className="projectTokenList">
              {representations.map((representation) => (
                <li key={representation}>{representation}</li>
              ))}
            </ul>
          </section>

          <section className="projectSection" aria-labelledby="demos-title">
            <h2 id="demos-title">First Demos</h2>
            <ul className="projectPlainList">
              {demos.map((demo) => (
                <li key={demo}>{demo}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section className="milestoneSection" aria-labelledby="milestones-title">
        <div className="milestoneHeader">
          <p>Build order</p>
          <h2 id="milestones-title">First Ten Milestones</h2>
        </div>
        <ol className="milestoneList">
          {milestones.map((milestone, index) => (
            <li key={milestone}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{milestone}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
