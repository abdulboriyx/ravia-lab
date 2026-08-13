import { CIF } from "molstar/lib/mol-io/reader/cif.js";
import { createAssemblies } from "molstar/lib/mol-model-formats/structure/property/assembly.js";
import type {
  MolecularAtom,
  NormalizedMolecularEntity,
  NormalizedPolymerClass,
  NormalizedAssembly,
  StructureManifestEntry,
} from "./biology-structure-grounding.ts";
import { StructureGroundingError } from "./biology-structure-grounding.ts";

const absent = (value: string | undefined) => !value || value === "." || value === "?";
const optionalNumber = (value: string | undefined) => absent(value) ? undefined : Number.isFinite(Number(value)) ? Number(value) : undefined;

export function polymerClassFromMmcif(type: string | undefined): NormalizedPolymerClass {
  const value = type?.toLowerCase() ?? "";
  if (value.includes("polypeptide")) return "protein";
  if (value.includes("deoxyribonucleotide/polyribonucleotide")) return "hybrid";
  if (value.includes("deoxyribonucleotide")) return "dna";
  if (value.includes("ribonucleotide")) return "rna";
  return value ? "other-polymer" : "unknown";
}

export async function parseMmcifWithMolstar(options: {
  text: string;
  structureId: string;
  source: StructureManifestEntry["provider"];
  title?: string;
  organism?: string;
  assemblyId?: string;
}) {
  const parsed = await CIF.parse(options.text).run();
  if (parsed.isError) throw new StructureGroundingError("mmcif-parse-failed", `${options.structureId}: ${parsed.message}`);
  const frame = parsed.result.blocks[0];
  if (!frame) throw new StructureGroundingError("mmcif-data-block-not-found", `No data block in ${options.structureId}`);
  const db = CIF.schema.mmCIF(frame);
  const value = (column: { value: (index: number) => unknown }, index: number) => String(column.value(index) ?? "");
  const entities = new Map<string, NormalizedMolecularEntity>();
  for (let i = 0; i < db.entity._rowCount; i += 1) {
    const id = value(db.entity.id, i);
    entities.set(id, { entityId: id, entityType: value(db.entity.type, i), description: value(db.entity.pdbx_description, i), polymerClass: "unknown", labelAsymIds: [] });
  }
  for (let i = 0; i < db.entity_poly._rowCount; i += 1) {
    const id = value(db.entity_poly.entity_id, i);
    const entity = entities.get(id) ?? { entityId: id, polymerClass: "unknown", labelAsymIds: [] };
    entity.polymerTypeRaw = value(db.entity_poly.type, i);
    entity.polymerClass = polymerClassFromMmcif(entity.polymerTypeRaw);
    entities.set(id, entity);
  }
  const asymEntity = new Map<string, string>();
  for (let i = 0; i < db.struct_asym._rowCount; i += 1) asymEntity.set(value(db.struct_asym.id, i), value(db.struct_asym.entity_id, i));
  const assemblies: NormalizedAssembly[] = createAssemblies(db.pdbx_struct_assembly, db.pdbx_struct_assembly_gen, db.pdbx_struct_oper_list).map((assembly) => {
    const groups = assembly.operatorGroups as unknown as Array<{ asymIds?: string[] | string; operators: ReadonlyArray<{ matrix: ArrayLike<number>; assembly?: { operId?: number; operList?: string[] }; name?: string }> }>;
    const sourceLabelAsymIds = [...new Set(groups.flatMap((group) => Array.isArray(group.asymIds) ? group.asymIds : group.asymIds?.split(",") ?? []))];
    const operators = groups.flatMap((group) => group.operators.map((operator) => ({ operatorId: operator.assembly?.operList?.join("*") ?? String(operator.assembly?.operId ?? operator.name ?? "unknown"), matrix: Array.from(operator.matrix) })));
    return { assemblyId: assembly.id, description: assembly.details, sourceLabelAsymIds, operators };
  });
  const atoms: MolecularAtom[] = [];
  for (let i = 0; i < db.atom_site._rowCount; i += 1) {
    // Some small legacy-shaped mmCIF fixtures omit label identifiers. Use the
    // author alias only as a compatibility fallback; real mmCIF label IDs are
    // always retained as their own namespace.
    const declaredLabelAsymId = value(db.atom_site.label_asym_id, i);
    const authAsymId = value(db.atom_site.auth_asym_id, i);
    const labelAsymId = absent(declaredLabelAsymId) ? authAsymId : declaredLabelAsymId;
    const entityId = value(db.atom_site.label_entity_id, i) || asymEntity.get(labelAsymId);
    const entity = entityId ? entities.get(entityId) : undefined;
    const x = Number(value(db.atom_site.Cartn_x, i)), y = Number(value(db.atom_site.Cartn_y, i)), z = Number(value(db.atom_site.Cartn_z, i));
    if (![x, y, z].every(Number.isFinite)) throw new StructureGroundingError("parse-failed", `Invalid atom coordinate in ${options.structureId}`);
    atoms.push({
      serial: optionalNumber(value(db.atom_site.id, i)) ?? i + 1,
      atomName: value(db.atom_site.auth_atom_id, i) || value(db.atom_site.label_atom_id, i),
      residueName: value(db.atom_site.label_comp_id, i) || value(db.atom_site.auth_comp_id, i),
      residueSequence: optionalNumber(value(db.atom_site.auth_seq_id, i)) ?? optionalNumber(value(db.atom_site.label_seq_id, i)) ?? 0,
      residueInsertionCode: absent(value(db.atom_site.pdbx_PDB_ins_code, i)) ? "" : value(db.atom_site.pdbx_PDB_ins_code, i),
      chainId: labelAsymId,
      labelAsymId, authAsymId: absent(authAsymId) ? undefined : authAsymId, entityId,
      labelSeqId: optionalNumber(value(db.atom_site.label_seq_id, i)), authSeqId: optionalNumber(value(db.atom_site.auth_seq_id, i)),
      modelNumber: optionalNumber(value(db.atom_site.pdbx_PDB_model_num, i)),
      entityType: entity?.polymerClass === "protein" ? "protein" : entity?.polymerClass === "dna" ? "dna" : entity?.polymerClass === "rna" || entity?.polymerClass === "hybrid" ? "rna" : "other",
      element: value(db.atom_site.type_symbol, i), x, y, z,
      occupancy: optionalNumber(value(db.atom_site.occupancy, i)), bFactor: optionalNumber(value(db.atom_site.B_iso_or_equiv, i)),
    });
  }
  for (const [labelAsymId, entityId] of asymEntity) {
    const entity = entities.get(entityId);
    if (entity) entity.labelAsymIds.push(labelAsymId);
  }
  return { atoms, entities: [...entities.values()], assemblies };
}
