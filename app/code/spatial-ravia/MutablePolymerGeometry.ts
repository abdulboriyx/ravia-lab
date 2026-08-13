import * as THREE from "three";

export type MutableTubeGeometryConfig = {
  sampleCount: number;
  radialSegments: number;
  radius: number;
};

export type MutableTubeGeometryHandle = {
  geometry: THREE.BufferGeometry;
  positionAttribute: THREE.BufferAttribute;
  normalAttribute: THREE.BufferAttribute;
  indexAttribute: THREE.BufferAttribute;
  sampleCount: number;
  radialSegments: number;
  vertexCount: number;
  indexCount: number;
  radius: number;
};

export type TubeFrame = {
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
};

const FULL_TURN = Math.PI * 2;
const MIN_VECTOR_LENGTH = 0.000001;

function assertFiniteVector(point: THREE.Vector3) {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.z)
  );
}

function getFallbackNormal(tangent: THREE.Vector3): THREE.Vector3 {
  const candidate =
    Math.abs(tangent.dot(new THREE.Vector3(0, 1, 0))) > 0.92
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(0, 1, 0);

  return candidate
    .sub(tangent.clone().multiplyScalar(candidate.dot(tangent)))
    .normalize();
}

export function computeTubeFrames(points: THREE.Vector3[]): TubeFrame[] {
  if (points.length === 0) {
    return [];
  }

  const frames: TubeFrame[] = [];
  let previousNormal: THREE.Vector3 | null = null;

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(index - 1, 0)];
    const next = points[Math.min(index + 1, points.length - 1)];
    const tangent = next.clone().sub(previous);

    if (tangent.lengthSq() < MIN_VECTOR_LENGTH) {
      tangent.set(1, 0, 0);
    } else {
      tangent.normalize();
    }

    let normal: THREE.Vector3 = previousNormal
      ? previousNormal
          .clone()
          .sub(tangent.clone().multiplyScalar(previousNormal.dot(tangent)))
      : getFallbackNormal(tangent);

    if (normal.lengthSq() < MIN_VECTOR_LENGTH) {
      normal = getFallbackNormal(tangent);
    } else {
      normal.normalize();
    }

    const binormal = new THREE.Vector3().crossVectors(tangent, normal);
    if (binormal.lengthSq() < MIN_VECTOR_LENGTH) {
      normal = getFallbackNormal(tangent);
      binormal.crossVectors(tangent, normal);
    }
    binormal.normalize();
    normal.crossVectors(binormal, tangent).normalize();

    frames.push({ tangent, normal, binormal });
    previousNormal = normal;
  }

  return frames;
}

function createTubeIndices(sampleCount: number, radialSegments: number) {
  const indexCount = Math.max(0, sampleCount - 1) * radialSegments * 6;
  const vertexCount = sampleCount * radialSegments;
  const useUint32 = vertexCount > 65535;
  const indices = useUint32
    ? new Uint32Array(indexCount)
    : new Uint16Array(indexCount);

  let writeIndex = 0;
  for (let ring = 0; ring < sampleCount - 1; ring += 1) {
    for (let radial = 0; radial < radialSegments; radial += 1) {
      const nextRadial = (radial + 1) % radialSegments;
      const a = ring * radialSegments + radial;
      const b = (ring + 1) * radialSegments + radial;
      const c = (ring + 1) * radialSegments + nextRadial;
      const d = ring * radialSegments + nextRadial;

      indices[writeIndex] = a;
      indices[writeIndex + 1] = b;
      indices[writeIndex + 2] = d;
      indices[writeIndex + 3] = b;
      indices[writeIndex + 4] = c;
      indices[writeIndex + 5] = d;
      writeIndex += 6;
    }
  }

  return indices;
}

export function createMutableTubeGeometry({
  sampleCount,
  radialSegments,
  radius,
}: MutableTubeGeometryConfig): MutableTubeGeometryHandle {
  if (sampleCount < 2) {
    throw new Error("Mutable tube geometry requires at least two samples.");
  }

  if (radialSegments < 3) {
    throw new Error("Mutable tube geometry requires at least three radial segments.");
  }

  if (radius <= 0 || !Number.isFinite(radius)) {
    throw new Error("Mutable tube geometry requires a finite positive radius.");
  }

  const vertexCount = sampleCount * radialSegments;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices = createTubeIndices(sampleCount, radialSegments);
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  const normalAttribute = new THREE.BufferAttribute(normals, 3);
  const indexAttribute = new THREE.BufferAttribute(indices, 1);

  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("normal", normalAttribute);
  geometry.setIndex(indexAttribute);
  geometry.setDrawRange(0, 0);
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 8);

  return {
    geometry,
    positionAttribute,
    normalAttribute,
    indexAttribute,
    sampleCount,
    radialSegments,
    vertexCount,
    indexCount: indices.length,
    radius,
  };
}

export function getMutableTubeDrawCount(
  handle: MutableTubeGeometryHandle,
  activeSampleCount: number
) {
  const clampedSamples = Math.min(
    Math.max(Math.floor(activeSampleCount), 0),
    handle.sampleCount
  );

  if (clampedSamples < 2) {
    return 0;
  }

  return (clampedSamples - 1) * handle.radialSegments * 6;
}

export function updateMutableTubeGeometry({
  handle,
  points,
  activeSampleCount = points.length,
}: {
  handle: MutableTubeGeometryHandle;
  points: THREE.Vector3[];
  activeSampleCount?: number;
}) {
  if (points.length !== handle.sampleCount) {
    throw new Error(
      `Mutable tube geometry expected ${handle.sampleCount} points but received ${points.length}.`
    );
  }

  for (const point of points) {
    if (!assertFiniteVector(point)) {
      throw new Error("Mutable tube geometry received a non-finite point.");
    }
  }

  const frames = computeTubeFrames(points);
  const positions = handle.positionAttribute.array as Float32Array;
  const normals = handle.normalAttribute.array as Float32Array;
  const clampedActiveSamples = Math.min(
    Math.max(Math.floor(activeSampleCount), 0),
    handle.sampleCount
  );
  const lastActivePoint =
    points[Math.max(Math.min(clampedActiveSamples - 1, points.length - 1), 0)];

  for (let ring = 0; ring < handle.sampleCount; ring += 1) {
    const isActive = ring < clampedActiveSamples;
    const center = isActive ? points[ring] : lastActivePoint;
    const frame = frames[Math.min(ring, Math.max(clampedActiveSamples - 1, 0))];
    const ringRadius = isActive ? handle.radius : 0;

    for (let radial = 0; radial < handle.radialSegments; radial += 1) {
      const angle = (radial / handle.radialSegments) * FULL_TURN;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const writeIndex = (ring * handle.radialSegments + radial) * 3;
      const normalX = frame.normal.x * cos + frame.binormal.x * sin;
      const normalY = frame.normal.y * cos + frame.binormal.y * sin;
      const normalZ = frame.normal.z * cos + frame.binormal.z * sin;

      positions[writeIndex] = center.x + normalX * ringRadius;
      positions[writeIndex + 1] = center.y + normalY * ringRadius;
      positions[writeIndex + 2] = center.z + normalZ * ringRadius;
      normals[writeIndex] = normalX;
      normals[writeIndex + 1] = normalY;
      normals[writeIndex + 2] = normalZ;
    }
  }

  handle.positionAttribute.needsUpdate = true;
  handle.normalAttribute.needsUpdate = true;
  handle.geometry.setDrawRange(
    0,
    getMutableTubeDrawCount(handle, clampedActiveSamples)
  );
}
