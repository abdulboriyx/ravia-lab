"use client";

import { useState } from "react";
import pageStyles from "./light-study.module.css";
import styles from "./eye-structure.module.css";

type PartId = "cornea" | "pupil" | "sclera" | "lens" | "ciliary" | "aqueous" | "vitreous" | "retina" | "nerve" | "disk" | "fovea";

type Part = {
  id: PartId;
  name: string;
  group: string;
  role: string;
  location: string;
  connection: string;
  point: [number, number];
};

const parts: Part[] = [
  { id: "cornea", name: "Cornea", group: "Transparent entrance", role: "The clear, curved front surface. It bends incoming light and provides much of the eye's focusing power.", location: "At the front of the eyeball, continuous with the sclera.", connection: "Light first crosses the cornea before entering the fluid-filled space behind it.", point: [275, 260] },
  { id: "pupil", name: "Pupil + iris", group: "Light gate", role: "The pupil is the opening for light. The surrounding iris changes its size and gives the eye its visible color.", location: "Behind the cornea and in front of the lens.", connection: "Light passes through the pupil; the iris itself is not transparent.", point: [351, 260] },
  { id: "sclera", name: "Sclera", group: "Outer wall", role: "The tough white outer wall protects and supports the eyeball.", location: "Around the outer eye, continuous with the cornea at the front.", connection: "It is structural support, not a step in the central light path.", point: [505, 80] },
  { id: "lens", name: "Lens", group: "Adjustable focus", role: "A transparent structure that changes shape to bring light from different distances into focus on the retina.", location: "Immediately behind the iris and pupil.", connection: "After the pupil, light passes through the lens toward the back of the eye.", point: [406, 260] },
  { id: "ciliary", name: "Ciliary muscle + zonule fibers", group: "Focus control", role: "The ciliary muscle forms a ring. Zonule fibers suspend the lens; changes in their tension alter lens shape.", location: "Around the edge of the lens, attached toward the eye wall.", connection: "This system adjusts focus without lying across the central light path.", point: [373, 169] },
  { id: "aqueous", name: "Aqueous humor", group: "Front chamber", role: "Watery fluid between the cornea and lens. It nourishes the cornea, which has no blood vessels.", location: "The space behind the cornea and around the iris, before the lens.", connection: "Light passes through this fluid on the way to the lens.", point: [322, 222] },
  { id: "vitreous", name: "Vitreous humor", group: "Inner chamber", role: "A clear, jelly-like material that fills the large space behind the lens and helps the eye retain its shape.", location: "Between the lens and retina.", connection: "Light crosses it after the lens and before reaching the retina.", point: [527, 265] },
  { id: "retina", name: "Retina", group: "Neural surface", role: "Light-sensitive neural tissue lining the back of the eye. Photoreceptors begin converting light into neural signals here.", location: "A thin layer along the inside of the posterior eye wall.", connection: "The light path ends at the retina; information then leaves as nerve signals.", point: [635, 157] },
  { id: "nerve", name: "Optic nerve", group: "Signal exit", role: "A bundle of retinal neuron axons that carries visual signals away from the eye toward the brain.", location: "Exits the back of the eyeball at the optic disk.", connection: "Neural signals travel through it; light itself does not.", point: [756, 349] },
  { id: "disk", name: "Optic disk / blind spot", group: "Retinal landmark", role: "The spot where optic nerve fibers leave the retina. It has no photoreceptors, creating a blind spot.", location: "At the posterior retina where the optic nerve exits, offset from the fovea.", connection: "Compare it with the fovea: one has no photoreceptors; the other serves central vision.", point: [651, 326] },
  { id: "fovea", name: "Macula + fovea", group: "Retinal landmark", role: "The macula is the region for central vision. The fovea is its small central pit, specialized for fine detail.", location: "Near the center of the posterior retina, away from the optic disk.", connection: "Focused light for direct gaze reaches the fovea, not the optic disk.", point: [666, 260] }
];

const path: { id: PartId; label: string }[] = [
  { id: "cornea", label: "Cornea" },
  { id: "pupil", label: "Pupil" },
  { id: "lens", label: "Lens" },
  { id: "vitreous", label: "Vitreous" },
  { id: "retina", label: "Retina" },
  { id: "nerve", label: "Optic nerve" }
];

function EyeDiagram({ selected, onSelect }: { selected: PartId; onSelect: (id: PartId) => void }) {
  const activePart = parts.find((part) => part.id === selected)!;
  const pathIndex = path.findIndex((step) => step.id === selected);
  const stageX = [275, 351, 406, 527, 666, 775][pathIndex] ?? 275;

  return (
    <svg className={styles.eyeSvg} viewBox="0 0 900 520" role="group" aria-label="Interactive cross section of the eye; select a numbered marker or a structure below">
      <defs>
        <linearGradient id="eye-vitreous" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#d8f4f0" /><stop offset="100%" stopColor="#abd8d7" />
        </linearGradient>
        <linearGradient id="eye-cornea" x1="0" x2="1">
          <stop offset="0%" stopColor="#f4fcfb" /><stop offset="100%" stopColor="#83c9d1" />
        </linearGradient>
        <linearGradient id="eye-lens" x1="0" x2="1">
          <stop offset="0%" stopColor="#f8f4db" /><stop offset="55%" stopColor="#fffdf0" /><stop offset="100%" stopColor="#b9dccb" />
        </linearGradient>
        <marker id="eye-path-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M1 1 L8 4.5 L1 8" fill="none" stroke="#ddab49" strokeWidth="1.5" />
        </marker>
      </defs>
      <rect width="900" height="520" className={styles.diagramBackground} />
      <text x="65" y="67" className={styles.diagramLabel}>OUTSIDE WORLD</text>
      <text x="687" y="67" className={styles.diagramLabel}>BACK OF EYE</text>
      <path d="M314 160 C382 76 570 52 656 159 C711 224 711 304 656 364 C570 467 382 443 314 360 C249 351 234 179 314 160 Z" className={styles.scleraShape} />
      <path d="M324 174 C396 90 561 81 643 169 C685 218 685 306 643 351 C563 434 396 425 324 346 C304 308 303 212 324 174 Z" fill="url(#eye-vitreous)" className={styles.innerEye} />
      <path d="M314 160 C248 175 242 345 314 360 C297 317 297 203 314 160 Z" fill="url(#eye-cornea)" className={styles.corneaShape} />
      <path d="M316 182 C295 218 295 304 316 339 C331 326 351 302 367 274 L367 246 C351 218 331 195 316 182 Z" className={styles.aqueousShape} />
      <path d="M342 182 Q365 203 365 236 L349 236 Q347 209 338 196 Z M342 338 Q365 317 365 284 L349 284 Q347 311 338 324 Z" className={styles.irisShape} />
      <path d="M356 177 Q366 157 385 163 L391 179 Q374 184 365 201 Z M356 343 Q366 363 385 357 L391 341 Q374 336 365 319 Z" className={styles.ciliaryShape} />
      <path d="M372 189 L389 219 M382 182 L399 214 M372 331 L389 301 M382 338 L399 306" className={styles.zonules} />
      <ellipse cx="406" cy="260" rx="32" ry="67" fill="url(#eye-lens)" className={styles.lensShape} />
      <path d="M444 99 C577 83 673 158 674 260 C674 361 577 437 444 421" className={styles.retinaShape} />
      <path d="M649 250 Q660 241 674 250 M649 270 Q660 279 674 270" className={styles.maculaShape} />
      <circle cx="665" cy="260" r="6" className={styles.foveaShape} />
      <path d="M645 313 Q660 308 674 318 L674 336 Q658 339 645 331 Z" className={styles.diskShape} />
      <path d="M669 313 C711 318 738 334 801 338 L801 371 C739 369 709 351 669 337 Z" className={styles.nerveShape} />
      <path d="M671 322 C719 335 758 352 800 354 M671 328 C717 345 755 362 800 362" className={styles.nerveFibers} />
      <path d="M70 260 H663" className={styles.lightGuide} />
      {pathIndex >= 0 && <path d={`M70 260 H${Math.min(stageX, 666)}`} className={styles.lightProgress} markerEnd="url(#eye-path-arrow)" />}
      <text x="86" y="286" className={styles.lightLabel}>LIGHT</text>
      <text x="689" y="292" className={styles.signalLabel}>NEURAL SIGNAL</text>
      {parts.map((part, index) => {
        const isSelected = part.id === selected;
        const [x, y] = part.point;
        return (
          <g key={part.id} role="button" tabIndex={0} aria-label={`Select ${part.name}`} aria-pressed={isSelected} className={`${styles.marker} ${isSelected ? styles.selectedMarker : ""}`} onClick={() => onSelect(part.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(part.id); } }}>
            <circle cx={x} cy={y} r="17" className={styles.markerHit} />
            <circle cx={x} cy={y} r={isSelected ? 15 : 12} className={styles.markerCircle} />
            <text x={x} y={y + 4} textAnchor="middle" className={styles.markerText}>{index + 1}</text>
          </g>
        );
      })}
      <text x="63" y="477" className={styles.diagramFoot}>SCHEMATIC CROSS SECTION · NOT TO SCALE</text>
      <text x="837" y="477" textAnchor="end" className={styles.diagramFoot}>SELECTED: {activePart.name.toUpperCase()}</text>
    </svg>
  );
}

export function EyeStructureStudy() {
  const [selected, setSelected] = useState<PartId>("cornea");
  const [answer, setAnswer] = useState<"disk" | "fovea" | null>(null);
  const activePart = parts.find((part) => part.id === selected)!;

  return (
    <section className={pageStyles.studySection} aria-labelledby="eye-structure-title">
      <div className={pageStyles.sectionHeading}>
        <span>03 / EYE ANATOMY</span>
        <h2 id="eye-structure-title">Structure of the eye</h2>
        <p>Follow the route from the outside world to the retina, then inspect the structures around it. Select a numbered point or a name to learn what it does and where it sits.</p>
      </div>

      <div className={styles.pathPanel}>
        <div className={styles.pathHeader}><span>TRACE THE PATH</span><span>LIGHT → NEURAL SIGNAL</span></div>
        <div className={styles.pathSteps}>
          <span className={styles.worldStep}>OUTSIDE WORLD</span>
          {path.map((step, index) => <button key={step.id} type="button" aria-pressed={selected === step.id} onClick={() => setSelected(step.id)}><small>{index + 1}</small>{step.label}</button>)}
        </div>
        <p>Light also travels through aqueous humor between the cornea and lens. At the retina, photoreceptors begin converting light into neural signals; the optic nerve carries those signals onward.</p>
      </div>

      <div className={styles.explorer}>
        <div className={styles.diagramWrap}><EyeDiagram selected={selected} onSelect={setSelected} /></div>
        <aside className={styles.detail} aria-live="polite">
          <span className={styles.detailKicker}>STRUCTURE {String(parts.indexOf(activePart) + 1).padStart(2, "0")} / {activePart.group.toUpperCase()}</span>
          <h3>{activePart.name}</h3>
          <p className={styles.role}>{activePart.role}</p>
          <div className={styles.detailRule}><strong>WHERE TO LOOK</strong><p>{activePart.location}</p></div>
          <div className={styles.detailRule}><strong>CONNECT THE PATH</strong><p>{activePart.connection}</p></div>
        </aside>
      </div>

      <div className={styles.structureList} aria-label="Eye structures">
        {parts.map((part, index) => <button key={part.id} type="button" aria-pressed={selected === part.id} onClick={() => setSelected(part.id)}><span>{String(index + 1).padStart(2, "0")}</span>{part.name}<span aria-hidden="true">↗</span></button>)}
      </div>

      <div className={styles.landmarks}>
        <div className={styles.landmarkIntro}><span>RETINAL LANDMARKS</span><h3>Two places, two very different jobs.</h3><p>Both sit on the retina, but they should never be confused.</p></div>
        <button type="button" className={styles.landmarkCard} onClick={() => setSelected("fovea")}><span>01 / CENTRAL VISION</span><strong>Macula + fovea</strong><p>The fovea lies within the macula and specializes in seeing fine detail where you look directly.</p><small>SELECT ON DIAGRAM ↗</small></button>
        <button type="button" className={styles.landmarkCard} onClick={() => setSelected("disk")}><span>02 / BLIND SPOT</span><strong>Optic disk</strong><p>The optic nerve leaves here. There are no photoreceptors at this spot, so light falling on it is not detected.</p><small>SELECT ON DIAGRAM ↗</small></button>
      </div>

      <div className={styles.check}>
        <div><span>QUICK CHECK</span><h3>Which retinal landmark has no photoreceptors?</h3></div>
        <div className={styles.checkActions}><button type="button" aria-pressed={answer === "fovea"} onClick={() => { setAnswer("fovea"); setSelected("fovea"); }}>Macula / fovea</button><button type="button" aria-pressed={answer === "disk"} onClick={() => { setAnswer("disk"); setSelected("disk"); }}>Optic disk</button></div>
        {answer && <p role="status" className={answer === "disk" ? styles.correct : styles.tryAgain}>{answer === "disk" ? "Correct. The optic disk is where nerve fibers exit, so it creates a blind spot." : "Look again: the fovea is specialized for central detail. Try the other landmark."}</p>}
      </div>
    </section>
  );
}
