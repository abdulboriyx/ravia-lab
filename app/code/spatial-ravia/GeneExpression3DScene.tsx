"use client";

import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { GeneExpressionProductionProjectionV1 } from "./gene-expression-production";
import { BakedTranscriptionMolecularActor } from "./BakedTranscriptionMolecularActor";
import { deriveTranscriptionCameraFrame, type TranscriptionActiveSiteRoi } from "./transcription-active-site-camera";
import { resolveEukaryoticPolIIStructureGrounding } from "./biology-transcription-structure-grounding";
import { resolveEukaryoticPolIIStructuralActorPackage, transcriptionStructuralScalePolicy } from "./transcription-structural-actors";
import { normalizeSpatialRaviaTheme, spatialRaviaThemePresentation, type SpatialRaviaTheme } from "./spatial-ravia-theme";
import { isValidTranscriptionPresentationState, type TranscriptionPresentationStateV1 } from "./transcription-presentation-state";
import type { ExpertTranscriptionGeometryMode, ExpertTranscriptionTarget } from "./transcription-expert-controls";
import { transcriptionVisualContract, transcriptionVisualLayer } from "./transcription-visual-contract";

type SceneProps = { projection: GeneExpressionProductionProjectionV1; presentation?: TranscriptionPresentationStateV1; theme: SpatialRaviaTheme; selectedTarget?: ExpertTranscriptionTarget; geometryMode?: ExpertTranscriptionGeometryMode; cameraRevision?: number; sceneRevision?: number };

function applyTranscriptionCameraFrame(camera: THREE.Camera, frame: ReturnType<typeof deriveTranscriptionCameraFrame>) {
  const perspectiveCamera = camera as THREE.PerspectiveCamera;
  perspectiveCamera.fov = frame.fov;
  perspectiveCamera.position.copy(frame.position);
  perspectiveCamera.lookAt(frame.target);
  perspectiveCamera.updateProjectionMatrix();
}

/** Reapplies the active-site fit after the structure-derived ROI has loaded. */
function TranscriptionCameraRig({ roi, controls, cameraRevision = 0 }: { roi: TranscriptionActiveSiteRoi | null; controls: OrbitControlsImpl | null; cameraRevision?: number }) {
  const { camera, size } = useThree();
  const frame = useMemo(() => roi ? deriveTranscriptionCameraFrame({ roi, width: size.width, height: size.height, fov: 34 }) : null, [roi, size.width, size.height]);

  useLayoutEffect(() => {
    if (!frame) return;
    applyTranscriptionCameraFrame(camera, frame);
    controls?.target.copy(frame.target);
    controls?.update();
    const request = window.requestAnimationFrame(() => {
      applyTranscriptionCameraFrame(camera, frame);
      controls?.target.copy(frame.target);
      controls?.update();
    });
    return () => window.cancelAnimationFrame(request);
  }, [camera, controls, frame, cameraRevision]);

  return null;
}

/**
 * 5FLM DEPOSITED GEOMETRY supplies the eukaryotic Pol II molecular geometry. Translocation is
 * explicitly derived between its grounded DNA anchors, so the viewport is an animation of a
 * deposited molecular state rather than a falsely claimed experimental movie.
 */
export function GeneExpression3DScene({ presentation, theme, selectedTarget = "NONE", geometryMode = "DEPOSITED", cameraRevision = 0, sceneRevision = 0 }: SceneProps) {
  const [roi, setRoi] = useState<TranscriptionActiveSiteRoi | null>(null);
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
  const structuralEntry = useMemo(() => resolveEukaryoticPolIIStructureGrounding(), []);
  const structuralPackage = useMemo(() => {
    try {
      return structuralEntry ? resolveEukaryoticPolIIStructuralActorPackage(structuralEntry) : null;
    } catch {
      return null;
    }
  }, [structuralEntry]);
  const handleRoiReady = useCallback((nextRoi: TranscriptionActiveSiteRoi | null) => setRoi(nextRoi), []);
  const exactTime = presentation?.exactTimeSeconds ?? 0;
  const temporalStage = exactTime <= 0.001 ? "START" : exactTime <= 0.5 ? "INITIATION" : exactTime < 2 ? "ELONGATION" : "TERMINATION";
  const colors = spatialRaviaThemePresentation[normalizeSpatialRaviaTheme(theme)];
  const depositedLayer = transcriptionVisualLayer("DEPOSITED_COORDINATES");
  const proteinLayer = transcriptionVisualLayer("COMPUTED_PROTEIN_ENVELOPE");
  const nucleicLayer = transcriptionVisualLayer("COMPUTED_NUCLEIC_RENDER");
  const motionLayer = transcriptionVisualLayer("INFERRED_MOTION");

  if (!isValidTranscriptionPresentationState(presentation)) {
    return <section className="spatialRaviaStatus" role="alert" data-error-code="TRANSCRIPTION_PRESENTATION_STATE_INVALID"><strong>TRANSCRIPTION_PRESENTATION_STATE_INVALID</strong>{process.env.NODE_ENV !== "production" && <div>GeneExpression3DScene received no complete presentation state.</div>}</section>;
  }
  if (!structuralEntry || !structuralPackage) {
    return <section className="spatialRaviaStatus" role="alert" data-error-code="TRANSCRIPTION_STRUCTURAL_SOURCE_UNSUPPORTED"><strong>TRANSCRIPTION_STRUCTURAL_SOURCE_UNSUPPORTED</strong></section>;
  }

  return <div className="geneExpression3DCanvas" data-3d-transcription-scene="true" data-visual-contract-version={transcriptionVisualContract.schemaVersion} data-visual-contract-modes={Object.keys(transcriptionVisualContract.modes).join(",")} data-transcription-stage={temporalStage} data-polymerase-presentation={temporalStage === "ELONGATION" ? "TRANSLOCATING" : temporalStage} data-molecular-viewport-owner="r3f-structure-derived" data-camera-owner="r3f-structure-derived" data-camera-fit={roi ? "STRUCTURE_DERIVED_ACTIVE_SITE" : "WAITING_FOR_STRUCTURE_ROI"} data-structural-source={transcriptionVisualContract.source.structureId} data-polymerase-class="EUKARYOTIC_POL_II" data-transcription-bubble={presentation.bubbleOpenFraction > 0.02 ? "OPEN" : "CLOSED"} data-bubble-open-fraction={presentation.bubbleOpenFraction.toFixed(3)} data-polymerase-state={temporalStage} data-polymerase-gene-position={presentation.polymeraseGenePosition.toFixed(3)} data-rna-length={presentation.nascentRnaVisualLength.toFixed(2)} data-rna-boundary="5FLM:N:7-20" data-hybrid-window="5FLM:O:7-20+N:7-20" data-active-center="5FLM:R:active-mg" data-rna-exit-evidence="GROUNDED_SOURCE_REFERENCE" data-source-coordinate-status={depositedLayer.fidelity} data-surface-render-status={proteinLayer.fidelity} data-nucleic-render-status={nucleicLayer.fidelity} data-motion-status={motionLayer.fidelity} data-nucleic-representation="MOLSTAR_POLYMER_TRACE_PLUS_LOCAL_ATOMISTIC" data-motion-source="5FLM_STRUCTURE_DERIVED_KINEMATIC_TRANSLOCATION" data-expert-selected-target={selectedTarget} data-expert-geometry-mode={geometryMode} data-expert-camera-revision={cameraRevision} data-expert-scene-revision={sceneRevision}>
    <Canvas key={sceneRevision} camera={{ position: [3.6, 2.25, 4.7], fov: 34 }} dpr={[1, 2]} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; gl.outputColorSpace = THREE.SRGBColorSpace; }}>
      <color attach="background" args={[colors.canvasBackground]} />
      <hemisphereLight args={["#f7fbff", "#20333a", 0.9]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3.5, 5, 6]} intensity={3.2} color="#fffaf2" />
      <directionalLight position={[-4, 1, -2]} intensity={1.15} color="#9fc6dc" />
      <TranscriptionCameraRig roi={roi} controls={controls} cameraRevision={cameraRevision} />
      <BakedTranscriptionMolecularActor entry={structuralEntry} scale={transcriptionStructuralScalePolicy.angstromToScene} presentation={presentation} selectedTarget={selectedTarget} geometryMode={geometryMode} onRoiReady={handleRoiReady} />
      <OrbitControls ref={setControls} enablePan={false} enableDamping dampingFactor={0.08} />
    </Canvas>
    <div className="transcriptionStructuralNotice" role="note">{transcriptionVisualContract.source.structureId} SOURCE-ANCHORED FRAME · {proteinLayer.label.toUpperCase()} · {motionLayer.label.toUpperCase()}</div>
    <div className="transcriptionVisualTruthLegend" role="note" aria-label="Transcription visual evidence legend">
      <span><i className="transcriptionTruthSwatch transcriptionTruthSwatch--deposited" /> {depositedLayer.label}: 5FLM</span>
      <span><i className="transcriptionTruthSwatch transcriptionTruthSwatch--computed" /> C0 computed surface/mesh</span>
      <span><i className="transcriptionTruthSwatch transcriptionTruthSwatch--inferred" /> {motionLayer.label}</span>
    </div>
  </div>;
}
