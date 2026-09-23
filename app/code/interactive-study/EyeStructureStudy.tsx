"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import pageStyles from "./light-study.module.css";
import styles from "./eye-structure.module.css";

const Eye3DScene = dynamic(() => import("./Eye3DScene"), { ssr: false });

export type EyePart = "cornea" | "pupil" | "sclera" | "lens" | "ciliary" | "aqueous" | "vitreous" | "retina" | "nerve" | "disk" | "fovea";
export type EyeView = "cutaway" | "front" | "inside";

const structures: { id: EyePart; name: string; short: string; detail: string; group: string }[] = [
  { id: "cornea", name: "Cornea", group: "Entry", short: "Clear curved window", detail: "The transparent front surface bends incoming light before it enters the eye. It continues into the white sclera around the sides." },
  { id: "pupil", name: "Pupil + iris", group: "Entry", short: "Adjustable aperture", detail: "The pupil is an opening, not a black structure. The iris is the colored ring of muscle around it; changing the opening changes how much light enters." },
  { id: "aqueous", name: "Aqueous humor", group: "Entry", short: "Clear fluid in front", detail: "Watery fluid occupies the space between the cornea and lens. Light crosses it on its way through the pupil." },
  { id: "lens", name: "Lens", group: "Focus", short: "Adjustable optical element", detail: "The transparent lens changes shape to bring light from different distances into focus on the retina." },
  { id: "ciliary", name: "Ciliary muscle + zonules", group: "Focus", short: "The lens suspension", detail: "The ciliary muscle forms a ring around the lens. Fine zonule fibers suspend it; changes in their tension alter the lens shape." },
  { id: "vitreous", name: "Vitreous humor", group: "Interior", short: "Clear inner chamber", detail: "This transparent gel fills the large space between the lens and retina and helps the eye retain its shape." },
  { id: "retina", name: "Retina", group: "Interior", short: "Light-sensitive lining", detail: "Light ends at this thin neural layer along the back of the eye. Photoreceptors begin the conversion into signals for the brain." },
  { id: "fovea", name: "Macula + fovea", group: "Landmark", short: "Sharp central vision", detail: "The macula is a central retinal region. Its tiny fovea is specialized for fine detail; light from the point you look at is focused here." },
  { id: "disk", name: "Optic disk / blind spot", group: "Landmark", short: "No photoreceptors here", detail: "The optic nerve exits at this retinal spot. Because it has no photoreceptors, it creates a blind spot—distinct from the fovea." },
  { id: "nerve", name: "Optic nerve", group: "Signal", short: "Information leaves the eye", detail: "Axons from retinal neurons gather into the optic nerve and carry neural signals toward the brain. Light itself does not travel through it." },
  { id: "sclera", name: "Sclera", group: "Wall", short: "Protective outer coat", detail: "The tough white outer wall supports and protects the eyeball. At the front, it meets the clear cornea." },
];

const route: { id: EyePart; label: string }[] = [
  { id: "cornea", label: "Cornea" }, { id: "pupil", label: "Pupil" }, { id: "lens", label: "Lens" },
  { id: "vitreous", label: "Vitreous" }, { id: "retina", label: "Retina" }, { id: "nerve", label: "Optic nerve" },
];

export function EyeStructureStudy() {
  const [selected, setSelected] = useState<EyePart>("fovea");
  const [view, setView] = useState<EyeView>("cutaway");
  const [pupil, setPupil] = useState(0.27);
  const [lightOn, setLightOn] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const part = structures.find((item) => item.id === selected)!;

  return (
    <section className={pageStyles.studySection} aria-labelledby="eye-structure-title">
      <div className={pageStyles.sectionHeading}>
        <span>03 / EYE ANATOMY</span>
        <h2 id="eye-structure-title">Inside the eye</h2>
        <p>Turn the eye, look through its layers, and follow light from the outside world to the retina. Select any structure to see its place in the story.</p>
      </div>

      <div className={styles.studio}>
        <div className={styles.stage}>
          <div className={styles.stageHeader}>
            <span className={styles.stageTitle}><span className={styles.liveDot} /> INTERACTIVE EYE / {view.toUpperCase()}</span>
            <span className={styles.stageHint}>DRAG TO ROTATE · SCROLL TO ZOOM</span>
          </div>
          <Eye3DScene selected={selected} onSelect={setSelected} view={view} pupil={pupil} lightOn={lightOn} resetKey={resetKey} />
          <div className={styles.stageFooter}>
            <span>FRONT <span aria-hidden="true">→</span> BACK</span>
            <button type="button" onClick={() => setResetKey((value) => value + 1)}>RESET VIEW ↺</button>
          </div>
        </div>

        <aside className={styles.inspector} aria-live="polite">
          <div className={styles.viewControls} aria-label="Eye view">
            {(["cutaway", "front", "inside"] as EyeView[]).map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)}>{option === "cutaway" ? "Cutaway" : option === "front" ? "Front" : "Inside"}</button>
            ))}
          </div>
          <div className={styles.partDetail}>
            <span className={styles.eyebrow}>{part.group.toUpperCase()} / SELECTED STRUCTURE</span>
            <h3>{part.name}</h3>
            <p className={styles.short}>{part.short}</p>
            <p className={styles.description}>{part.detail}</p>
          </div>
          <div className={styles.controlBlock}>
            <div className={styles.controlHead}><label htmlFor="eye-pupil">PUPIL OPENING</label><span>{pupil < 0.24 ? "CONSTRICTED" : pupil > 0.38 ? "DILATED" : "MEDIUM"}</span></div>
            <input id="eye-pupil" type="range" min="0.16" max="0.48" step="0.01" value={pupil} onChange={(event) => { setPupil(Number(event.target.value)); setSelected("pupil"); }} />
            <p>Move the iris to change the aperture and see which rays enter.</p>
          </div>
          <button type="button" className={styles.lightToggle} aria-pressed={lightOn} onClick={() => setLightOn((value) => !value)}><span className={styles.toggleIcon}>{lightOn ? "✦" : "○"}</span><span>Trace light</span><span>{lightOn ? "ON" : "OFF"}</span></button>
        </aside>
      </div>

      <div className={styles.route} aria-label="Light and neural signal pathway">
        <span className={styles.routeLabel}>FOLLOW THE PATH</span>
        <div className={styles.routeSteps}><span>OUTSIDE WORLD</span>{route.map((step, index) => <button key={step.id} type="button" aria-pressed={selected === step.id} onClick={() => setSelected(step.id)}><small>{String(index + 1).padStart(2, "0")}</small>{step.label}</button>)}</div>
        <p>Light stops at the retina. Beyond it, the optic nerve carries <em>neural signals</em>, not light.</p>
      </div>

      <div className={styles.index} aria-label="Select an eye structure">
        <span className={styles.indexTitle}>EXPLORE STRUCTURES</span>
        <div>{structures.map((item) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{item.name}</button>)}</div>
      </div>
      <p className={styles.modelNote}>Anatomical teaching model · simplified geometry, not to scale. The retinal landmarks are deliberately separated so you can compare them.</p>
    </section>
  );
}
