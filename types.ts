export const FABRIC_WIDTHS = [140, 160, 180, 200, 220, 240, 260, 280, 290, 300, 320] as const;

export type FabricWidth = typeof FABRIC_WIDTHS[number];

export interface CalculationResult {
  fabricWidth: number;
  anchoPlaca: number;
  altoPlaca: number;
  placasPorFila: number;
  cojinesTeoFranja: number;
  alturaFranjaCm: number;
  consumoCm: number;
  consumoM: number;
  isValid: boolean;
  orientation?: 'normal' | 'rotated';
  note?: string;
}

export interface CushionItem {
  id: string;
  originalRow: any; // Keep original data to merge back
  width: number;
  height: number;
  results: Record<number, CalculationResult>; // Map fabric width to result
}

export interface ManualCalculationState {
  width: string;
  height: string;
  selectedFabricWidth: string;
  result: CalculationResult | null;
}