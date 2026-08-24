import * as THREE from "three";

export function isFiniteVector3(value: unknown): value is THREE.Vector3 {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as { x?: unknown; y?: unknown; z?: unknown };
  return Number.isFinite(candidate.x) && Number.isFinite(candidate.y) && Number.isFinite(candidate.z);
}

export function isFiniteRnapPresentation(presentation: unknown, transform: unknown): boolean {
  if (presentation === null || typeof presentation !== "object" || transform === null || typeof transform !== "object") return false;
  const presentationRecord = presentation as { cleft?: unknown; lobes?: unknown };
  const transformRecord = transform as { position?: unknown; quaternion?: unknown; scale?: unknown };
  if (presentationRecord.cleft === null || typeof presentationRecord.cleft !== "object" || !Array.isArray(presentationRecord.lobes)) return false;
  if (transformRecord.quaternion === null || typeof transformRecord.quaternion !== "object") return false;
  const cleft = presentationRecord.cleft as { center?: unknown; axis?: unknown; length?: unknown; radius?: unknown };
  const quaternion = transformRecord.quaternion as { x?: unknown; y?: unknown; z?: unknown; w?: unknown };
  return isFiniteVector3(transformRecord.position)
    && typeof transformRecord.scale === "number" && Number.isFinite(transformRecord.scale) && transformRecord.scale > 0
    && Number.isFinite(quaternion.x) && Number.isFinite(quaternion.y)
    && Number.isFinite(quaternion.z) && Number.isFinite(quaternion.w)
    && isFiniteVector3(cleft.center) && isFiniteVector3(cleft.axis)
    && typeof cleft.length === "number" && Number.isFinite(cleft.length)
    && typeof cleft.radius === "number" && Number.isFinite(cleft.radius)
    && presentationRecord.lobes.every((lobe) => {
      if (lobe === null || typeof lobe !== "object") return false;
      const candidate = lobe as { center?: unknown; radii?: unknown };
      return isFiniteVector3(candidate.center) && isFiniteVector3(candidate.radii);
    });
}
