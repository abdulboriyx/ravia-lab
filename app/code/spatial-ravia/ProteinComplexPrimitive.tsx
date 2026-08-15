"use client";

import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  getStateAdjustedDomain,
  type ProteinChannelDefinition,
  type ProteinComplexDefinition,
  type ProteinDomainDefinition,
} from "./ProteinComplexDefinitions";
import {
  spatialRaviaColors,
  spatialRaviaMaterialDefaults,
} from "./SpatialRaviaVisualSystem";

const materialColors = {
  body: spatialRaviaColors.protein,
  lobe: spatialRaviaColors.proteinLight,
  secondary: spatialRaviaColors.proteinDark,
  accent: spatialRaviaColors.proteinActive,
  shadow: spatialRaviaColors.cavity,
};

function ProteinDomain({ domain, opacity = 1 }: { domain: ProteinDomainDefinition; opacity?: number }) {
  const color = materialColors[domain.materialVariant ?? "body"];
  const rotation = domain.rotation ?? [0, 0, 0];

  return (
    <mesh position={domain.position} rotation={rotation} scale={domain.scale}>
      {(domain.shape ?? "ellipsoid") === "rounded-box" ? (
        <boxGeometry args={[1, 1, 1, 2, 2, 2]} />
      ) : (domain.shape ?? "ellipsoid") === "capsule" ? (
        <capsuleGeometry args={[0.42, 0.72, 8, 18]} />
      ) : (
        <sphereGeometry args={[0.5, 32, 22]} />
      )}
      <meshStandardMaterial
        color={color}
        {...spatialRaviaMaterialDefaults.protein}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function ProteinChannel({
  channel,
  stateScale = 1,
  opacity = 1,
}: {
  channel: ProteinChannelDefinition;
  stateScale?: number;
  opacity?: number;
}) {
  return (
    <mesh position={channel.position} rotation={channel.rotation ?? [0, 0, 0]}>
      <cylinderGeometry
        args={[
          channel.radius * stateScale,
          channel.radius * stateScale,
          channel.length,
          28,
        ]}
      />
      <meshStandardMaterial
        color={channel.variant === "groove" ? spatialRaviaColors.proteinDark : spatialRaviaColors.cavity}
        roughness={0.9}
        transparent
        opacity={(channel.variant === "groove" ? 0.72 : 0.9) * opacity}
      />
    </mesh>
  );
}

export function ProteinComplexPrimitive({
  definition,
  position,
  quaternion,
  rotation,
  scale = 1,
  state,
  label,
  compactLabel = false,
  opacity = 1,
}: {
  definition: ProteinComplexDefinition;
  position: THREE.Vector3;
  quaternion?: THREE.Quaternion;
  rotation?: [number, number, number];
  scale?: number;
  state?: string;
  label?: string;
  compactLabel?: boolean;
  opacity?: number;
}) {
  const stateModifier = state ? definition.states?.[state] : undefined;

  return (
    <group position={position} quaternion={quaternion} rotation={rotation} scale={scale}>
      {definition.domains.map((domain) => (
        <ProteinDomain
          key={domain.id}
          domain={getStateAdjustedDomain(definition, domain, state)}
          opacity={opacity}
        />
      ))}
      {(definition.channels ?? []).map((channel) => (
        <ProteinChannel
          key={channel.id}
          channel={channel}
          stateScale={stateModifier?.channelScale?.[channel.id] ?? 1}
          opacity={opacity}
        />
      ))}
      {label && !compactLabel && (
        <Text position={[0, 0.72, 0.2]} fontSize={0.1} fillOpacity={0.74}>
          {label}
        </Text>
      )}
    </group>
  );
}
