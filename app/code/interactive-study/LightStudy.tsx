"use client";

import { useMemo, useState } from "react";
import styles from "./light-study.module.css";

type Interaction = "reflection" | "absorption" | "refraction";

const interactions: { id: Interaction; label: string; summary: string }[] = [
  { id: "reflection", label: "Reflection", summary: "A ray bounces from a surface. The incoming and outgoing angles match." },
  { id: "absorption", label: "Absorption", summary: "A surface takes in light energy instead of returning the ray." },
  { id: "refraction", label: "Refraction", summary: "A ray changes direction as it enters a medium where it travels more slowly." }
];

function wavelengthColor(wavelength: number) {
  const stops: [number, number, number, number][] = [
    [400, 127, 94, 231],
    [450, 69, 112, 242],
    [490, 54, 183, 225],
    [530, 79, 197, 139],
    [570, 232, 207, 76],
    [610, 245, 151, 71],
    [700, 226, 82, 93]
  ];
  const upper = stops.findIndex(([value]) => value >= wavelength);
  if (upper <= 0) return `rgb(${stops[0].slice(1).join(", ")})`;
  const start = stops[upper - 1];
  const end = stops[upper];
  const t = (wavelength - start[0]) / (end[0] - start[0]);
  return `rgb(${[1, 2, 3].map((i) => Math.round(start[i] + (end[i] - start[i]) * t)).join(", ")})`;
}

function WaveDiagram({ wavelength, amplitude, color }: { wavelength: number; amplitude: number; color: string }) {
  const period = 42 + ((wavelength - 400) / 300) * 58;
  const height = 18 + amplitude * 0.4;
  const path = useMemo(() => {
    const points: string[] = [];
    for (let x = 52; x <= 848; x += 3) {
      const y = 142 - Math.sin(((x - 52) / period) * 2 * Math.PI) * height;
      points.push(`${x === 52 ? "M" : "L"}${x} ${y.toFixed(2)}`);
    }
    return points.join(" ");
  }, [height, period]);

  return (
    <svg className={styles.waveSvg} viewBox="0 0 900 270" role="img" aria-label={`Wave diagram at ${wavelength} nanometers and ${amplitude} percent amplitude`}>
      <defs>
        <pattern id="light-study-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="900" height="270" fill="url(#light-study-grid)" className={styles.grid} />
      <line x1="50" y1="142" x2="850" y2="142" className={styles.axis} />
      <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="142" r="5" fill={color} />
      <line x1="52" y1="210" x2={52 + period} y2="210" className={styles.measure} />
      <line x1="52" y1="202" x2="52" y2="218" className={styles.measure} />
      <line x1={52 + period} y1="202" x2={52 + period} y2="218" className={styles.measure} />
      <text x={52 + period / 2} y="238" textAnchor="middle" className={styles.svgLabel}>WAVELENGTH</text>
      <line x1="805" y1={142 - height} x2="805" y2="142" className={styles.measure} />
      <line x1="797" y1={142 - height} x2="813" y2={142 - height} className={styles.measure} />
      <line x1="797" y1="142" x2="813" y2="142" className={styles.measure} />
      <text x="790" y="76" textAnchor="end" className={styles.svgLabel}>AMPLITUDE</text>
    </svg>
  );
}

function OpticsDiagram({ interaction, angle, color }: { interaction: Interaction; angle: number; color: string }) {
  const theta = (angle * Math.PI) / 180;
  const refracted = Math.asin(Math.sin(theta) / 1.33);
  const impact = { x: 450, y: 215 };
  const rayLength = 190;
  const start = { x: impact.x - Math.sin(theta) * rayLength, y: impact.y - Math.cos(theta) * rayLength };
  const reflected = { x: impact.x + Math.sin(theta) * rayLength, y: impact.y - Math.cos(theta) * rayLength };
  const transmitted = { x: impact.x + Math.sin(refracted) * rayLength, y: impact.y + Math.cos(refracted) * rayLength };
  const output = interaction === "reflection" ? reflected : transmitted;

  return (
    <svg className={styles.opticsSvg} viewBox="0 0 900 440" role="img" aria-label={`${interaction} diagram with light arriving at ${angle} degrees from the normal`}>
      <defs>
        <marker id="light-ray-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M1 1 L9 5 L1 9" fill="none" stroke={color} strokeWidth="1.6" />
        </marker>
        <pattern id="absorbing-surface" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" strokeWidth="3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="900" height="440" className={styles.sceneBackground} />
      {interaction === "refraction" && <rect x="0" y="215" width="900" height="225" className={styles.water} />}
      {interaction === "absorption" && <rect x="0" y="215" width="900" height="225" className={styles.absorber} />}
      <line x1="55" y1="215" x2="845" y2="215" className={styles.surface} />
      <line x1="450" y1="38" x2="450" y2="403" className={styles.normal} />
      <text x="462" y="49" className={styles.svgLabel}>NORMAL</text>
      <text x="75" y="64" className={styles.mediumLabel}>AIR</text>
      <text x="75" y="389" className={styles.mediumLabel}>{interaction === "refraction" ? "WATER · n = 1.33" : interaction === "absorption" ? "ABSORBING SURFACE" : "REFLECTIVE SURFACE"}</text>
      <line x1={start.x} y1={start.y} x2="443" y2="209" stroke={color} strokeWidth="4" strokeLinecap="round" markerEnd="url(#light-ray-arrow)" />
      <circle cx="450" cy="215" r="7" fill={color} />
      {interaction !== "absorption" && (
        <line x1="457" y1={interaction === "reflection" ? 209 : 221} x2={output.x} y2={output.y} stroke={color} strokeWidth="4" strokeLinecap="round" markerEnd="url(#light-ray-arrow)" />
      )}
      {interaction === "absorption" && (
        <g fill={color} opacity="0.8">
          <circle cx="424" cy="253" r="4" /><circle cx="450" cy="263" r="5" /><circle cx="478" cy="249" r="3" />
          <circle cx="436" cy="283" r="2" /><circle cx="468" cy="292" r="3" />
        </g>
      )}
      <text x={start.x - 15} y={start.y - 12} className={styles.rayLabel}>INCIDENT RAY</text>
      {interaction !== "absorption" && <text x={output.x + 14} y={output.y + (interaction === "reflection" ? -7 : 18)} className={styles.rayLabel}>{interaction === "reflection" ? "REFLECTED RAY" : "REFRACTED RAY"}</text>}
      <text x="400" y="181" className={styles.angleLabel}>{angle}°</text>
      {interaction === "reflection" && <text x="472" y="181" className={styles.angleLabel}>{angle}°</text>}
      {interaction === "refraction" && <text x="469" y="259" className={styles.angleLabel}>{Math.round((refracted * 180) / Math.PI)}°</text>}
    </svg>
  );
}

export function LightStudy() {
  const [wavelength, setWavelength] = useState(550);
  const [amplitude, setAmplitude] = useState(50);
  const [interaction, setInteraction] = useState<Interaction>("reflection");
  const [angle, setAngle] = useState(40);
  const color = wavelengthColor(wavelength);
  const frequency = Math.round(299792.458 / wavelength);
  const selected = interactions.find(({ id }) => id === interaction)!;

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.hero}>
          <div className={styles.eyebrow}><span>CODE / INTERACTIVE STUDY</span><span>01 — THE EYE</span></div>
          <h1>Properties<br />of <em>Light</em></h1>
          <p>Before light becomes vision, it travels as an electromagnetic wave and interacts with the world. Change the controls to see how its properties and path relate.</p>
          <div className={styles.topicLine}><span>WAVES</span><span>SPECTRUM</span><span>OPTICS</span></div>
        </header>

        <section className={styles.studySection} aria-labelledby="wave-title">
          <div className={styles.sectionHeading}><span>01 / ELECTROMAGNETIC RADIATION</span><h2 id="wave-title">A wave of energy</h2><p>Wavelength is the distance between successive peaks. Frequency counts cycles per second. For light in a vacuum, a shorter wavelength means a higher frequency.</p></div>
          <div className={styles.wavePanel}>
            <div className={styles.panelTop}><span>WAVE VIEW</span><span>DIAGRAM NOT TO PHYSICAL SCALE</span></div>
            <WaveDiagram wavelength={wavelength} amplitude={amplitude} color={color} />
            <div className={styles.readouts}>
              <div><span>WAVELENGTH</span><strong>{wavelength}<small>nm</small></strong><p>Distance between peaks</p></div>
              <div><span>FREQUENCY</span><strong>{frequency}<small>THz</small></strong><p>Cycles each second</p></div>
              <div><span>AMPLITUDE</span><strong>{amplitude}<small>%</small></strong><p>Relative wave height</p></div>
            </div>
            <div className={styles.controls}>
              <label htmlFor="wavelength">Wavelength <output>{wavelength} nm</output></label>
              <input id="wavelength" type="range" min="400" max="700" step="1" value={wavelength} onChange={(event) => setWavelength(Number(event.target.value))} style={{ accentColor: color }} />
              <div className={styles.rangeEnds}><span>400 nm · VIOLET</span><span>700 nm · RED</span></div>
              <label htmlFor="amplitude">Amplitude <output>{amplitude}%</output></label>
              <input id="amplitude" type="range" min="10" max="90" step="1" value={amplitude} onChange={(event) => setAmplitude(Number(event.target.value))} style={{ accentColor: color }} />
              <div className={styles.rangeEnds}><span>SMALLER</span><span>LARGER</span></div>
            </div>
          </div>
          <div className={styles.spectrumPanel}>
            <div><span className={styles.miniLabel}>VISIBLE SPECTRUM</span><h3>A narrow window</h3><p>Human vision detects only about 400–700 nm of the electromagnetic spectrum. The selected wavelength is shown below.</p></div>
            <div className={styles.spectrumVisual}>
              <div className={styles.spectrumBar}><span className={styles.spectrumMarker} style={{ left: `${((wavelength - 400) / 300) * 100}%` }} /></div>
              <div className={styles.spectrumTicks}><span>400</span><span>500</span><span>600</span><span>700 nm</span></div>
              <div className={styles.spectrumSelected}><span className={styles.colorDot} style={{ backgroundColor: color }} />{wavelength} nm selected</div>
            </div>
          </div>
        </section>

        <section className={styles.studySection} aria-labelledby="optics-title">
          <div className={styles.sectionHeading}><span>02 / OPTICS</span><h2 id="optics-title">When light meets matter</h2><p>Optics studies light rays and their interactions. Choose an interaction, then change the incoming angle to see how the ray behaves.</p></div>
          <div className={styles.opticsPanel}>
            <div className={styles.modeTabs} role="group" aria-label="Light interaction">
              {interactions.map(({ id, label }, index) => <button key={id} type="button" aria-pressed={interaction === id} className={interaction === id ? styles.activeTab : ""} onClick={() => setInteraction(id)}><span>0{index + 1}</span>{label}</button>)}
            </div>
            <OpticsDiagram interaction={interaction} angle={angle} color={color} />
            <div className={styles.opticsFooter}>
              <div><span className={styles.miniLabel}>{selected.label.toUpperCase()}</span><h3>{selected.label}</h3><p>{selected.summary}</p>{interaction === "refraction" && <p className={styles.detail}>Air → water · the refracted angle is computed with Snell&apos;s law.</p>}{interaction === "absorption" && <p className={styles.detail}>The dots indicate energy transferred into the surface, not a continuing light ray.</p>}</div>
              <div className={styles.angleControl}><label htmlFor="incident-angle">Incident angle <output>{angle}°</output></label><input id="incident-angle" type="range" min="0" max="70" step="1" value={angle} onChange={(event) => setAngle(Number(event.target.value))} style={{ accentColor: color }} /><div className={styles.rangeEnds}><span>PERPENDICULAR</span><span>OBLIQUE</span></div></div>
            </div>
          </div>
        </section>

        <footer className={styles.reference}>REFERENCE · Bear, Connors &amp; Paradiso, <cite>Neuroscience: Exploring the Brain</cite>, Chapter 9, pp. 295–296 (Figs. 9.1–9.3). Diagrams are original teaching illustrations.</footer>
      </div>
    </main>
  );
}
