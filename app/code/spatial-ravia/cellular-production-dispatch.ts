export const cellularProductionOwnerComponents = {
  GENE_EXPRESSION_CELLULAR_V1: "GeneExpressionProductionView",
  SECRETORY_PATHWAY_CELLULAR_V1: "SecretoryPathwayProductionView",
  INTRACELLULAR_TRANSPORT_CELLULAR_V1: "IntracellularTransportProductionView",
  CELL_SIGNALING_RTK_MAPK_V1: "CellularSignalingProductionView",
} as const;

export type CellularProductionOwner = keyof typeof cellularProductionOwnerComponents;
