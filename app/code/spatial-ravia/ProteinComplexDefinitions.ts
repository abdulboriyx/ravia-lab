import * as THREE from "three";

export type ProteinDomainShape = "ellipsoid" | "capsule" | "rounded-box";

export type ProteinDomainDefinition = {
  id: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  shape?: ProteinDomainShape;
  materialVariant?: "body" | "lobe" | "secondary" | "accent" | "shadow";
};

export type ProteinChannelDefinition = {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  length: number;
  radius: number;
  variant?: "channel" | "groove";
};

export type ProteinAttachmentPoint = {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
};

export type ProteinStateModifier = {
  domainOffsets?: Record<string, [number, number, number]>;
  domainScales?: Record<string, [number, number, number]>;
  channelScale?: Record<string, number>;
};

export type ProteinComplexDefinition = {
  id: string;
  domains: ProteinDomainDefinition[];
  channels?: ProteinChannelDefinition[];
  attachmentPoints?: ProteinAttachmentPoint[];
  states?: Record<string, ProteinStateModifier>;
};

export const rnaPolymeraseComplexDefinition: ProteinComplexDefinition = {
  id: "rna-polymerase",
  domains: [
    { id: "core", position: [0, 0, 0], scale: [0.72, 0.5, 0.42], shape: "ellipsoid", materialVariant: "body" },
    { id: "clamp", position: [-0.28, 0.25, 0.12], scale: [0.48, 0.32, 0.34], rotation: [0.1, -0.16, -0.28], shape: "ellipsoid", materialVariant: "lobe" },
    { id: "jaw", position: [0.28, -0.26, 0.08], scale: [0.44, 0.3, 0.3], rotation: [-0.04, 0.12, 0.22], shape: "ellipsoid", materialVariant: "secondary" },
    { id: "upper-domain", position: [-0.08, 0.05, 0.38], scale: [0.34, 0.24, 0.24], rotation: [0.24, 0.1, 0], shape: "capsule", materialVariant: "lobe" },
    { id: "rna-exit-domain", position: [0.18, -0.5, 0.24], scale: [0.3, 0.18, 0.18], rotation: [0.25, 0, -0.18], shape: "capsule", materialVariant: "secondary" },
  ],
  channels: [
    { id: "dna-channel", position: [0.04, -0.03, 0.02], rotation: [0, 0, Math.PI / 2], length: 0.96, radius: 0.17, variant: "channel" },
  ],
  attachmentPoints: [
    { id: "dna-entry", position: [-0.52, -0.03, 0.02] },
    { id: "dna-exit", position: [0.56, -0.03, 0.02] },
    { id: "rna-exit", position: [0.18, -0.54, 0.28], rotation: [0.2, 0, -0.3] },
  ],
  states: {
    open: {
      domainOffsets: { clamp: [-0.03, 0.04, 0.02], jaw: [0.02, -0.03, 0] },
      channelScale: { "dna-channel": 1.12 },
    },
    closed: {
      domainOffsets: { clamp: [0.02, -0.02, -0.01], jaw: [-0.02, 0.02, 0] },
      channelScale: { "dna-channel": 0.82 },
    },
  },
};

export const sigmaFactorComplexDefinition: ProteinComplexDefinition = {
  id: "sigma-factor",
  domains: [
    { id: "recognition-core", position: [0, 0, 0], scale: [0.3, 0.2, 0.18], shape: "ellipsoid", materialVariant: "accent" },
    { id: "dna-contact", position: [0.18, -0.08, 0.04], scale: [0.16, 0.12, 0.12], rotation: [0.1, 0.1, -0.3], shape: "capsule", materialVariant: "lobe" },
  ],
};

export const dnaPolymeraseComplexDefinition: ProteinComplexDefinition = {
  id: "dna-polymerase",
  domains: [
    { id: "palm", position: [0, 0, 0], scale: [0.46, 0.34, 0.28], shape: "rounded-box", materialVariant: "body" },
    { id: "fingers", position: [-0.24, 0.26, 0.1], scale: [0.22, 0.38, 0.2], rotation: [0, 0, -0.28], shape: "capsule", materialVariant: "lobe" },
    { id: "thumb", position: [0.28, -0.2, 0.1], scale: [0.2, 0.36, 0.2], rotation: [0, 0, 0.38], shape: "capsule", materialVariant: "secondary" },
    { id: "active-site", position: [0.02, 0.04, 0.22], scale: [0.14, 0.1, 0.08], shape: "ellipsoid", materialVariant: "accent" },
  ],
  channels: [
    { id: "template-groove", position: [0, 0.02, 0.12], rotation: [0, Math.PI / 2, 0], length: 0.76, radius: 0.11, variant: "groove" },
  ],
  attachmentPoints: [
    { id: "template-entry", position: [-0.42, 0.02, 0.12] },
    { id: "product-exit", position: [0.44, 0.02, 0.12] },
  ],
  states: {
    active: {
      domainOffsets: { fingers: [0.04, -0.03, 0], thumb: [-0.03, 0.02, 0] },
      channelScale: { "template-groove": 1.1 },
    },
  },
};

export function validateProteinComplexDefinition(definition: ProteinComplexDefinition) {
  if (definition.domains.length === 0) {
    return { ok: false, reason: "Protein complex requires at least one domain." };
  }

  for (const domain of definition.domains) {
    if (domain.scale.some((value) => !Number.isFinite(value) || value <= 0)) {
      return { ok: false, reason: `Invalid scale for domain ${domain.id}.` };
    }
    if (domain.position.some((value) => !Number.isFinite(value))) {
      return { ok: false, reason: `Invalid position for domain ${domain.id}.` };
    }
  }

  for (const channel of definition.channels ?? []) {
    if (channel.length <= 0 || channel.radius <= 0) {
      return { ok: false, reason: `Invalid channel ${channel.id}.` };
    }
  }

  return { ok: true, reason: "" };
}

export function resolveProteinAttachmentPoint(
  definition: ProteinComplexDefinition,
  attachmentId: string,
  transform?: { position?: THREE.Vector3; quaternion?: THREE.Quaternion; scale?: number }
) {
  const attachment = definition.attachmentPoints?.find((point) => point.id === attachmentId);
  if (!attachment) {
    return null;
  }

  const scale = transform?.scale ?? 1;
  const local = new THREE.Vector3(...attachment.position).multiplyScalar(scale);
  if (transform?.quaternion) local.applyQuaternion(transform.quaternion);
  if (transform?.position) local.add(transform.position);
  return local;
}

export function getStateAdjustedDomain(
  definition: ProteinComplexDefinition,
  domain: ProteinDomainDefinition,
  state?: string
): ProteinDomainDefinition {
  const modifier = state ? definition.states?.[state] : undefined;
  const offset = modifier?.domainOffsets?.[domain.id] ?? [0, 0, 0];
  const scale = modifier?.domainScales?.[domain.id] ?? [1, 1, 1];

  return {
    ...domain,
    position: [
      domain.position[0] + offset[0],
      domain.position[1] + offset[1],
      domain.position[2] + offset[2],
    ],
    scale: [
      domain.scale[0] * scale[0],
      domain.scale[1] * scale[1],
      domain.scale[2] * scale[2],
    ],
  };
}
