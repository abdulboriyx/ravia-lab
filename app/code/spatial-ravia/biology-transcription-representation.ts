import * as THREE from "three";
import { getTranscriptionPathFrame } from "./biology-transcription-geometry.ts";

// One visual grammar for the transcription illustration. These dimensions are
// intentionally smaller than the generic polymer defaults: the active RNAP
// and its locally opened DNA, rather than oversized tubing, carry the figure.
export const transcriptionVisualScalePolicy = {
  dnaBackboneRadius: 0.022,
  basePairRadius: 0.007,
  rnaBackboneRadius: 0.021,
  rnaTerminalRadius: 0.03,
  regionLineRadius: 0.009,
  annotationFontSize: 0.075,
  annotationOpacity: 0.72,
  proteinOpacity: 0.96,
} as const;

export type TranscriptionDnaRegionAnnotation = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  connectorStart: THREE.Vector3;
  connectorEnd: THREE.Vector3;
  labelPosition: THREE.Vector3;
};

/**
 * Keeps promoter/gene/terminator annotations attached to the actual DNA path
 * rather than treating biological sequence regions as detached objects.
 */
export function deriveTranscriptionDnaRegionAnnotation(
  centerX: number,
  width: number
): TranscriptionDnaRegionAnnotation {
  const startFrame = getTranscriptionPathFrame(centerX - width / 2);
  const endFrame = getTranscriptionPathFrame(centerX + width / 2);
  const offset = new THREE.Vector3(0, 0.23, 0.12);
  const start = startFrame.position.clone().add(offset);
  const end = endFrame.position.clone().add(offset);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  return {
    start,
    end,
    connectorStart: midpoint,
    connectorEnd: getTranscriptionPathFrame(centerX).position.clone(),
    labelPosition: midpoint.clone().add(new THREE.Vector3(0, 0.12, 0)),
  };
}

export function isFiniteTranscriptionAnnotation(annotation: TranscriptionDnaRegionAnnotation) {
  return [annotation.start, annotation.end, annotation.connectorStart, annotation.connectorEnd, annotation.labelPosition]
    .every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
}
