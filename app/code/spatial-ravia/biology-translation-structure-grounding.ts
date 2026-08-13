import * as THREE from "three";
import { expandStructureAssembly, extractNucleicTrace, parseMolecularStructureAsync, resolveStructureChain } from "./biology-structure-parser.ts";
import type { MolecularChain } from "./biology-structure-grounding.ts";
import type { StructureConstrainedResidue } from "./StructureConstrainedNucleicGeometry.ts";
import { deriveStructureDerivedContext, type StructureDerivedContextGeometry } from "./StructureDerivedContextGeometry.ts";
import { translation4v5cAudit } from "./biology-translation-4v5c-audit.ts";
import type { SelectedMolecularAtom } from "./SelectedResidueDetailGeometry.ts";

export type GroundedTranslationSite = { position: THREE.Vector3; quaternion: THREE.Quaternion; anticodon: THREE.Vector3; acceptor: THREE.Vector3; trace: THREE.Vector3[] };
export type GroundedTranslation = {
  ribosome: {
    large: THREE.Vector3[];
    small: THREE.Vector3[];
    context?: { large: StructureDerivedContextGeometry; small: StructureDerivedContextGeometry };
  };
  mrna: THREE.Vector3[];
  codonContact: THREE.Vector3;
  activeResidues: {
    anticodon: { a: StructureConstrainedResidue[]; p: StructureConstrainedResidue[]; e: StructureConstrainedResidue[] };
    acceptor: { a: StructureConstrainedResidue[]; p: StructureConstrainedResidue[]; e: StructureConstrainedResidue[] };
    codon: StructureConstrainedResidue[];
  };
  activeAtoms: {
    acceptor: { a: SelectedMolecularAtom[]; p: SelectedMolecularAtom[]; e: SelectedMolecularAtom[] };
    anticodon: { a: SelectedMolecularAtom[]; p: SelectedMolecularAtom[]; e: SelectedMolecularAtom[] };
    codon: SelectedMolecularAtom[];
    status: "atom-derived" | "residue-derived";
  };
  peptidylTransferCenter: THREE.Vector3;
  sites: { a: GroundedTranslationSite; p: GroundedTranslationSite; e: GroundedTranslationSite };
  peptideExit: { position: THREE.Vector3; direction: THREE.Vector3 };
};

let cached: Promise<GroundedTranslation> | undefined;

function centroid(points: THREE.Vector3[]) {
  return points.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length);
}

function anchorFromResidues(chain: MolecularChain, labelSeqIds: readonly number[]) {
  const points = residuePointsFor(chain, labelSeqIds);
  if (points.length !== labelSeqIds.length) throw new Error(`Missing residue-aware tRNA anchor on ${chain.labelAsymId}`);
  return centroid(points);
}

function residuePointsFor(chain: MolecularChain, labelSeqIds: readonly number[]) {
  return labelSeqIds.map((labelSeqId) => {
    const residue = chain.residues.find((candidate) => candidate.labelSeqId === labelSeqId);
    if (!residue) throw new Error(`Missing residue-aware tRNA anchor on ${chain.labelAsymId}`);
    return new THREE.Vector3(...residue.centroid);
  });
}

function residueDetailsFor(chain: MolecularChain, labelSeqIds: readonly number[], map: (point: THREE.Vector3) => THREE.Vector3) {
  return labelSeqIds.map((labelSeqId) => {
    const residue = chain.residues.find((candidate) => candidate.labelSeqId === labelSeqId);
    if (!residue) throw new Error(`Missing residue-aware tRNA anchor on ${chain.labelAsymId}`);
    return { position: map(new THREE.Vector3(...residue.centroid)), labelSeqId, residueName: residue.residueName };
  });
}

function atomDetailsFor(chain: MolecularChain, labelSeqIds: readonly number[], map: (point: THREE.Vector3) => THREE.Vector3) {
  return chain.residues.filter((residue) => labelSeqIds.includes(residue.labelSeqId ?? -1)).flatMap((residue) => residue.atoms
    .filter((atom) => atom.element.toUpperCase() !== "H")
    .map((atom) => ({ position: map(new THREE.Vector3(atom.x, atom.y, atom.z)), element: atom.element, atomName: atom.atomName.trim(), residueName: residue.residueName })));
}

function mappedResidueDetailsFor(chain: MolecularChain, map: (point: THREE.Vector3) => THREE.Vector3) {
  return chain.residues.map((residue) => ({
    residue,
    position: map(new THREE.Vector3(...residue.centroid)),
  }));
}

function frameFromChain(chain: MolecularChain, points: THREE.Vector3[], anchors: { anticodonLabelSeqIds: readonly number[]; acceptorLabelSeqIds: readonly number[] }, map: (point: THREE.Vector3) => THREE.Vector3) {
  const anticodon = map(anchorFromResidues(chain, anchors.anticodonLabelSeqIds));
  const acceptor = map(anchorFromResidues(chain, anchors.acceptorLabelSeqIds));
  const axis = acceptor.clone().sub(anticodon);
  if (axis.lengthSq() < 1e-8) throw new Error(`Degenerate tRNA functional axis on ${chain.labelAsymId}`);
  axis.normalize();
  return { position: centroid(points), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis), anticodon, acceptor, trace: points };
}

function centerAndScale(groups: THREE.Vector3[][]) {
  const all = groups.flat();
  const center = all.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / Math.max(all.length, 1));
  let radius = 1;
  for (const point of all) radius = Math.max(radius, point.distanceTo(center));
  const scale = 2.15 / radius;
  return { center, scale, map: (point: THREE.Vector3) => point.clone().sub(center).multiplyScalar(scale) };
}

export async function loadGroundedTranslation(): Promise<GroundedTranslation> {
  if (cached) return cached;
  cached = (async () => {
    const response = await fetch("/spatial-ravia/structures/4V5C.cif");
    if (!response.ok) throw new Error(`4V5C coordinate load failed: ${response.status}`);
    const source = await parseMolecularStructureAsync({ structureId: "4V5C", source: "rcsb-pdb", format: "mmcif", text: await response.text() });
    const assembly = expandStructureAssembly(source, translation4v5cAudit.assemblyId);
    const byEntity = (ids: readonly string[]) => assembly.chains.filter((chain) => ids.includes(chain.entityId ?? ""));
    const largeChains = byEntity(translation4v5cAudit.largeSubunitEntityIds);
    const smallChains = byEntity(translation4v5cAudit.smallSubunitEntityIds);
    const mRNA = resolveStructureChain(assembly, translation4v5cAudit.mRNA);
    const a = resolveStructureChain(assembly, translation4v5cAudit.aSiteTRNA);
    const p = resolveStructureChain(assembly, translation4v5cAudit.pSiteTRNA);
    const e = resolveStructureChain(assembly, translation4v5cAudit.eSiteTRNA);
    const residues = (chains: typeof assembly.chains, stride: number) => chains.flatMap((chain) => chain.residues.filter((_, index) => index % stride === 0).map((residue) => new THREE.Vector3(...residue.centroid)));
    const rawMrna = extractNucleicTrace(mRNA);
    const rawA = extractNucleicTrace(a), rawP = extractNucleicTrace(p), rawE = extractNucleicTrace(e);
    const decodingCenter = centroid([...rawA, ...rawP, ...rawE]);
    const contextResidues = (chains: typeof assembly.chains) => chains.flatMap((chain) => chain.residues.filter((residue, index) => {
      const nearDecodingCenter = new THREE.Vector3(...residue.centroid).distanceToSquared(decodingCenter) < 900;
      return index % (nearDecodingCenter ? 10 : 24) === 0;
    }).map((residue) => new THREE.Vector3(...residue.centroid)));
    const rawLarge = contextResidues(largeChains), rawSmall = contextResidues(smallChains);
    const transform = centerAndScale([rawLarge, rawSmall, rawMrna, rawA, rawP, rawE]);
    const map = transform.map;
    const large = rawLarge.map(map), small = rawSmall.map(map), mrna = rawMrna.map(map), aPoints = rawA.map(map), pPoints = rawP.map(map), ePoints = rawE.map(map);
    const site = (chain: MolecularChain, points: THREE.Vector3[], anchor: { anticodonLabelSeqIds: readonly number[]; acceptorLabelSeqIds: readonly number[] }) => frameFromChain(chain, points, anchor, map);
    const activeResidues = {
      anticodon: {
        a: residueDetailsFor(a, translation4v5cAudit.tRNAResidueAnchors.a.anticodonLabelSeqIds, map),
        p: residueDetailsFor(p, translation4v5cAudit.tRNAResidueAnchors.p.anticodonLabelSeqIds, map),
        e: residueDetailsFor(e, translation4v5cAudit.tRNAResidueAnchors.e.anticodonLabelSeqIds, map),
      },
      acceptor: {
        a: residueDetailsFor(a, translation4v5cAudit.tRNAResidueAnchors.a.acceptorLabelSeqIds, map),
        p: residueDetailsFor(p, translation4v5cAudit.tRNAResidueAnchors.p.acceptorLabelSeqIds, map),
        e: residueDetailsFor(e, translation4v5cAudit.tRNAResidueAnchors.e.acceptorLabelSeqIds, map),
      },
      codon: [] as StructureConstrainedResidue[],
    };
    const aSite = site(a, aPoints, translation4v5cAudit.tRNAResidueAnchors.a);
    const pSite = site(p, pPoints, translation4v5cAudit.tRNAResidueAnchors.p);
    const eSite = site(e, ePoints, translation4v5cAudit.tRNAResidueAnchors.e);
    const localCenter = centroid([aSite.position, pSite.position, eSite.position, ...activeResidues.anticodon.a.map((residue) => residue.position)]);
    const largeContext = deriveStructureDerivedContext(large, localCenter);
    const smallContext = deriveStructureDerivedContext(small, localCenter);
    const largeCenter = large.reduce((sum, point) => sum.add(point), new THREE.Vector3()).multiplyScalar(1 / large.length);
    const peptidylTransferCenter = aSite.acceptor.clone().add(pSite.acceptor).multiplyScalar(0.5);
    const exitDirection = peptidylTransferCenter.clone().sub(largeCenter).normalize();
    const peptideExit = large.reduce((best, point) => point.clone().sub(peptidylTransferCenter).dot(exitDirection) > best.clone().sub(peptidylTransferCenter).dot(exitDirection) ? point : best, large[0]).clone();
    // Select actual chain-X residues nearest the deposited A-site anticodon. This is
    // positional codon context, not a claim of sequence-specific decoding.
    const codonCandidates = mappedResidueDetailsFor(mRNA, map)
      .sort((left, right) => left.position.distanceToSquared(aSite.anticodon) - right.position.distanceToSquared(aSite.anticodon))
      .slice(0, 3);
    activeResidues.codon = codonCandidates.map(({ residue, position }) => ({
      position: position.clone(),
      labelSeqId: residue.labelSeqId,
      residueName: residue.residueName,
    }));
    const activeAtoms = {
      acceptor: {
        a: atomDetailsFor(a, translation4v5cAudit.tRNAResidueAnchors.a.acceptorLabelSeqIds, map),
        p: atomDetailsFor(p, translation4v5cAudit.tRNAResidueAnchors.p.acceptorLabelSeqIds, map),
        e: atomDetailsFor(e, translation4v5cAudit.tRNAResidueAnchors.e.acceptorLabelSeqIds, map),
      },
      anticodon: {
        a: atomDetailsFor(a, translation4v5cAudit.tRNAResidueAnchors.a.anticodonLabelSeqIds, map),
        p: atomDetailsFor(p, translation4v5cAudit.tRNAResidueAnchors.p.anticodonLabelSeqIds, map),
        e: atomDetailsFor(e, translation4v5cAudit.tRNAResidueAnchors.e.anticodonLabelSeqIds, map),
      },
      codon: [] as SelectedMolecularAtom[],
      status: "atom-derived" as GroundedTranslation["activeAtoms"]["status"],
    };
    const codonPoints = activeResidues.codon.map((residue) => residue.position);
    activeAtoms.codon = codonCandidates.flatMap(({ residue }) => residue.atoms
      .filter((atom) => atom.element.toUpperCase() !== "H")
      .map((atom) => ({
        position: map(new THREE.Vector3(atom.x, atom.y, atom.z)),
        element: atom.element,
        atomName: atom.atomName.trim(),
        residueName: residue.residueName,
      })));
    activeAtoms.status = activeAtoms.acceptor.a.length > 0 && activeAtoms.anticodon.a.length > 0 && activeAtoms.codon.length > 0
      ? "atom-derived"
      : "residue-derived";
    return { ribosome: { large, small, context: { large: largeContext, small: smallContext } }, mrna, codonContact: centroid(codonPoints), activeResidues, activeAtoms, peptidylTransferCenter, sites: { a: aSite, p: pSite, e: eSite }, peptideExit: { position: peptideExit, direction: exitDirection } };
  })();
  return cached;
}

export function clearGroundedTranslationCache() { cached = undefined; }
