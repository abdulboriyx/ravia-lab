"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { DnaSceneCameraFrame } from "./DnaSceneCamera";

function applyDnaSceneCameraFrame(camera: THREE.Camera, frame: DnaSceneCameraFrame) {
  camera.position.set(...frame.position);
  if ("fov" in camera) {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = frame.fov;
    perspective.updateProjectionMatrix();
  }
  camera.lookAt(...frame.target);
}

/** Applies a geometry-owned static family frame once per mounted DNA view. */
export function DnaSceneCameraRig({ frame, controls }: { frame: DnaSceneCameraFrame; controls: OrbitControlsImpl | null }) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    applyDnaSceneCameraFrame(camera, frame);
    controls?.target.set(...frame.target);
    controls?.update();
    // DREI initializes controls after the Canvas camera. Reapply on the next
    // frame so an initialization update cannot restore the default target.
    const request = window.requestAnimationFrame(() => {
      applyDnaSceneCameraFrame(camera, frame);
      controls?.target.set(...frame.target);
      controls?.update();
    });
    return () => window.cancelAnimationFrame(request);
  }, [camera, controls, frame]);

  return null;
}
