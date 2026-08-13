import { canonicalDnaView, type CanonicalDnaView } from "./DnaVisualSystem.ts";

export type LocalChemistrySubject = "gc-base-pair" | "nucleotide" | "thymine-dimer" | "mismatch";
export type LocalChemistryAtom = {
  id: string;
  element: "C" | "N" | "O" | "P";
  residue: string;
  role: "base" | "sugar" | "phosphate" | "context" | "lesion";
  position: readonly [number, number, number];
};
export type LocalChemistryBond = {
  id: string;
  from: string;
  to: string;
  kind: "covalent" | "hydrogen" | "lesion-crosslink";
};
export type LocalChemistryActor = { id: string; label: string; kind: "base" | "nucleotide" | "lesion" | "repair-context"; emphasis: "primary" | "secondary" | "context" };
export type DnaLocalChemistryPlan = {
  subject: LocalChemistrySubject;
  view: CanonicalDnaView;
  atoms: readonly LocalChemistryAtom[];
  bonds: readonly LocalChemistryBond[];
  actors: readonly LocalChemistryActor[];
  contextOpacity: number;
  camera: { azimuthDegrees: number; elevationDegrees: number; distanceScale: number; framing: "local" };
};

const atom = (id: string, element: LocalChemistryAtom["element"], residue: string, role: LocalChemistryAtom["role"], position: LocalChemistryAtom["position"]): LocalChemistryAtom => ({ id, element, residue, role, position });
const bond = (id: string, from: string, to: string, kind: LocalChemistryBond["kind"] = "covalent"): LocalChemistryBond => ({ id, from, to, kind });

const guanineCytosineAtoms = [
  atom("g-o6", "O", "G", "base", [-0.78, 0.55, 0]), atom("g-n1", "N", "G", "base", [-0.78, 0, 0]), atom("g-n2", "N", "G", "base", [-0.78, -0.55, 0]),
  atom("g-c", "C", "G", "base", [-1.28, 0, 0]), atom("g-sugar", "C", "DG", "sugar", [-1.85, -0.12, 0]), atom("g-phosphate", "P", "DG", "phosphate", [-2.3, -0.28, 0]),
  atom("c-n4", "N", "C", "base", [0.78, 0.55, 0]), atom("c-n3", "N", "C", "base", [0.78, 0, 0]), atom("c-o2", "O", "C", "base", [0.78, -0.55, 0]),
  atom("c-c", "C", "C", "base", [1.28, 0, 0]), atom("c-sugar", "C", "DC", "sugar", [1.85, -0.12, 0]), atom("c-phosphate", "P", "DC", "phosphate", [2.3, -0.28, 0]),
] as const;

const guanineCytosineBonds = [
  bond("g-base-1", "g-o6", "g-c"), bond("g-base-2", "g-n1", "g-c"), bond("g-base-3", "g-n2", "g-c"), bond("g-sugar", "g-c", "g-sugar"), bond("g-phosphate", "g-sugar", "g-phosphate"),
  bond("c-base-1", "c-n4", "c-c"), bond("c-base-2", "c-n3", "c-c"), bond("c-base-3", "c-o2", "c-c"), bond("c-sugar", "c-c", "c-sugar"), bond("c-phosphate", "c-sugar", "c-phosphate"),
  bond("gc-hbond-o6-n4", "g-o6", "c-n4", "hydrogen"), bond("gc-hbond-n1-n3", "g-n1", "c-n3", "hydrogen"), bond("gc-hbond-n2-o2", "g-n2", "c-o2", "hydrogen"),
] as const;

const nucleotideAtoms = [
  atom("nt-p", "P", "DG", "phosphate", [-1.35, 0.1, 0]), atom("nt-o5", "O", "DG", "phosphate", [-0.92, 0.14, 0]),
  atom("nt-c5", "C", "DG", "sugar", [-0.55, 0.28, 0]), atom("nt-c4", "C", "DG", "sugar", [-0.2, 0.02, 0]), atom("nt-o4", "O", "DG", "sugar", [0.05, 0.32, 0]), atom("nt-c1", "C", "DG", "sugar", [0.26, -0.04, 0]), atom("nt-c3", "C", "DG", "sugar", [-0.18, -0.37, 0]),
  atom("nt-n9", "N", "G", "base", [0.66, -0.03, 0]), atom("nt-c6", "C", "G", "base", [1.02, 0.28, 0]), atom("nt-o6", "O", "G", "base", [1.42, 0.28, 0]), atom("nt-n1", "N", "G", "base", [1.02, -0.34, 0]),
] as const;
const nucleotideBonds = [
  bond("nt-p-o5", "nt-p", "nt-o5"), bond("nt-o5-c5", "nt-o5", "nt-c5"), bond("nt-sugar-1", "nt-c5", "nt-c4"), bond("nt-sugar-2", "nt-c4", "nt-o4"), bond("nt-sugar-3", "nt-o4", "nt-c1"), bond("nt-sugar-4", "nt-c1", "nt-c3"), bond("nt-sugar-5", "nt-c3", "nt-c4"), bond("nt-glycosidic", "nt-c1", "nt-n9"), bond("nt-base-1", "nt-n9", "nt-c6"), bond("nt-base-2", "nt-c6", "nt-o6"), bond("nt-base-3", "nt-c6", "nt-n1"),
] as const;

const thymineDimerAtoms = [
  atom("t1-c5", "C", "T", "lesion", [-0.42, 0.32, 0]), atom("t1-c6", "C", "T", "lesion", [-0.12, 0, 0]), atom("t1-o4", "O", "T", "lesion", [-0.48, -0.32, 0]), atom("t1-sugar", "C", "DT", "sugar", [-0.88, 0.02, 0]),
  atom("t2-c5", "C", "T", "lesion", [0.42, 0.32, 0]), atom("t2-c6", "C", "T", "lesion", [0.12, 0, 0]), atom("t2-o4", "O", "T", "lesion", [0.48, -0.32, 0]), atom("t2-sugar", "C", "DT", "sugar", [0.88, 0.02, 0]),
  atom("context-a", "N", "A", "context", [-1.55, -0.12, 0]), atom("context-g", "N", "G", "context", [1.55, -0.12, 0]),
] as const;
const thymineDimerBonds = [
  bond("t1-ring", "t1-c5", "t1-c6"), bond("t1-sugar", "t1-c6", "t1-sugar"), bond("t1-o4", "t1-c5", "t1-o4"), bond("t2-ring", "t2-c5", "t2-c6"), bond("t2-sugar", "t2-c6", "t2-sugar"), bond("t2-o4", "t2-c5", "t2-o4"),
  bond("thymine-dimer-cyclobutane-a", "t1-c5", "t2-c5", "lesion-crosslink"), bond("thymine-dimer-cyclobutane-b", "t1-c6", "t2-c6", "lesion-crosslink"),
] as const;

const mismatchAtoms = [
  atom("m-g-o6", "O", "G", "base", [-0.7, 0.3, 0]), atom("m-g-n1", "N", "G", "base", [-0.7, -0.27, 0]), atom("m-g-sugar", "C", "DG", "sugar", [-1.25, 0, 0]),
  atom("m-t-o4", "O", "T", "lesion", [0.7, 0.28, 0]), atom("m-t-n3", "N", "T", "lesion", [0.7, -0.27, 0]), atom("m-t-sugar", "C", "DT", "sugar", [1.25, 0, 0]),
] as const;
const mismatchBonds = [bond("m-g-o6", "m-g-o6", "m-g-sugar"), bond("m-g-n1", "m-g-n1", "m-g-sugar"), bond("m-t-o4", "m-t-o4", "m-t-sugar"), bond("m-t-n3", "m-t-n3", "m-t-sugar"), bond("mismatch-contact", "m-g-n1", "m-t-o4", "hydrogen")] as const;

const localView = (focus: "base-pair" | "nucleotide" | "local-chemistry") => canonicalDnaView(focus);

export function getDnaLocalChemistryPlan(subject: LocalChemistrySubject): DnaLocalChemistryPlan {
  switch (subject) {
    case "gc-base-pair": return { subject, view: localView("base-pair"), atoms: guanineCytosineAtoms, bonds: guanineCytosineBonds, actors: [{ id: "guanine", label: "Guanine", kind: "base", emphasis: "primary" }, { id: "cytosine", label: "Cytosine", kind: "base", emphasis: "primary" }], contextOpacity: 0.18, camera: { ...localView("base-pair").camera, framing: "local" } };
    case "nucleotide": return { subject, view: localView("nucleotide"), atoms: nucleotideAtoms, bonds: nucleotideBonds, actors: [{ id: "phosphate", label: "Phosphate", kind: "nucleotide", emphasis: "primary" }, { id: "deoxyribose", label: "Deoxyribose", kind: "nucleotide", emphasis: "primary" }, { id: "guanine-base", label: "Guanine base", kind: "nucleotide", emphasis: "primary" }], contextOpacity: 0.1, camera: { ...localView("nucleotide").camera, framing: "local" } };
    case "thymine-dimer": return { subject, view: localView("local-chemistry"), atoms: thymineDimerAtoms, bonds: thymineDimerBonds, actors: [{ id: "thymine-1", label: "Thymine", kind: "lesion", emphasis: "primary" }, { id: "thymine-2", label: "Thymine", kind: "lesion", emphasis: "primary" }, { id: "neighboring-bases", label: "Neighboring bases", kind: "base", emphasis: "context" }], contextOpacity: 0.14, camera: { ...localView("local-chemistry").camera, framing: "local" } };
    case "mismatch": return { subject, view: localView("base-pair"), atoms: mismatchAtoms, bonds: mismatchBonds, actors: [{ id: "guanine", label: "Guanine", kind: "base", emphasis: "primary" }, { id: "thymine-mismatch", label: "Thymine mismatch", kind: "lesion", emphasis: "primary" }, { id: "repair-context", label: "Local repair context", kind: "repair-context", emphasis: "secondary" }], contextOpacity: 0.16, camera: { ...localView("base-pair").camera, framing: "local" } };
  }
}

export function isValidDnaLocalChemistryPlan(plan: DnaLocalChemistryPlan) {
  const atomIds = new Set(plan.atoms.map((atom) => atom.id));
  return plan.camera.framing === "local"
    && plan.contextOpacity >= 0 && plan.contextOpacity <= 0.2
    && plan.bonds.every((bond) => atomIds.has(bond.from) && atomIds.has(bond.to));
}
