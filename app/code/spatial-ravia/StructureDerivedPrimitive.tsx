"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import {
  type NormalizedMolecularStructure,
  type StructureDerivedGeometry,
  type StructureGroundingStatus,
  type StructureManifestEntry,
} from "./biology-structure-grounding.ts";
import { loadGroundedStructure } from "./biology-structure-loader.ts";

function chainColor(chainId: string, type: string) {
  if (type === "dna" || type === "rna") {
    return new THREE.Color("#8ec5ff");
  }
  const hue = ((chainId.charCodeAt(0) || 65) % 7) / 7;
  return new THREE.Color().setHSL(0.56 + hue * 0.08, 0.18, 0.76);
}

function isRenderable(
  geometry: StructureDerivedGeometry,
  position: THREE.Vector3,
  quaternion: THREE.Quaternion,
  scale: number
) {
  return geometry.residuePoints.length > 0 &&
    Number.isFinite(scale) && scale > 0 &&
    [position.x, position.y, position.z, quaternion.x, quaternion.y, quaternion.z, quaternion.w,
      geometry.bounds.min.x, geometry.bounds.min.y, geometry.bounds.min.z,
      geometry.bounds.max.x, geometry.bounds.max.y, geometry.bounds.max.z].every(Number.isFinite);
}

export function StructureDerivedPrimitive({
  entry,
  position,
  quaternion,
  scale = 1,
  visible = true,
  fallback,
  onResolved,
}: {
  entry: StructureManifestEntry;
  position: THREE.Vector3;
  quaternion?: THREE.Quaternion;
  scale?: number;
  visible?: boolean;
  onResolved?: (result: {
    structure: NormalizedMolecularStructure;
    geometry: StructureDerivedGeometry;
    groundingStatus: StructureGroundingStatus;
  }) => void;
  /** Rendered only after a typed coordinate load failure; never mislabeled as coordinate-derived. */
  fallback?: ReactNode;
}) {
  const [resolved, setResolved] = useState<{
    structure: NormalizedMolecularStructure;
    geometry: StructureDerivedGeometry;
    groundingStatus: StructureGroundingStatus;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const onResolvedRef = useRef(onResolved);

  useEffect(() => {
    onResolvedRef.current = onResolved;
  }, [onResolved]);

  useEffect(() => {
    let active = true;
    loadGroundedStructure(entry)
      .then((result) => {
        if (!active) return;
        const next = {
          ...result,
          groundingStatus: "structure-derived" as const,
        };
        setResolved(next);
        onResolvedRef.current?.(next);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [entry]);

  const pointDummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!resolved || !meshRef.current) return;
    resolved.geometry.residuePoints.forEach((sample, index) => {
      pointDummy.position.copy(sample.position);
      pointDummy.scale.setScalar(sample.entityType === "protein" ? 0.11 : 0.08);
      pointDummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, pointDummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [pointDummy, resolved]);

  const baseQuaternion = quaternion ?? new THREE.Quaternion();
  const renderable = resolved && isRenderable(resolved.geometry, position, baseQuaternion, scale);

  if (!visible || !resolved) {
    return failed ? <>{fallback}</> : null;
  }
  if (!renderable) {
    return <>{fallback}</>;
  }
  if (failed) {
    return null;
  }

  return (
    <group position={position} quaternion={baseQuaternion} scale={scale}>
      {resolved.geometry.tracePaths.map((trace) => {
        if (trace.points.length < 2) return null;
        const curve = new THREE.CatmullRomCurve3(trace.points);
        return (
          <mesh key={trace.chainId}>
            <tubeGeometry args={[curve, Math.max(12, trace.points.length * 3), 0.09, 10, false]} />
            <meshStandardMaterial
              color={chainColor(trace.chainId, trace.entityType)}
              roughness={0.55}
              metalness={0.05}
            />
          </mesh>
        );
      })}
      <instancedMesh ref={meshRef} args={[undefined, undefined, resolved.geometry.residuePoints.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#d9e2f2" roughness={0.58} metalness={0.04} />
      </instancedMesh>
    </group>
  );
}
