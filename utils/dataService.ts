import { supabase } from './supabaseClient';
import { CushionItem } from '../types';
import { calculateAllWidths } from './calculationLogic';

export const saveBatchToSupabase = async (items: CushionItem[], batchName: string = 'Carga Manual') => {
  const rowsToInsert = items.map(item => ({
    batch_name: batchName,
    cushion_width: item.width,
    cushion_height: item.height,
    original_row: item.originalRow
  }));

  const { data, error } = await supabase
    .from('calculation_history')
    .insert(rowsToInsert)
    .select();

  if (error) throw error;
  return data;
};

export const fetchHistoryFromSupabase = async (): Promise<CushionItem[]> => {
  // Obtenemos los datos crudos
  const { data, error } = await supabase
    .from('calculation_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  // REGLA ESTRICTA:
  // No confiamos en resultados guardados (si los hubiera).
  // Recalculamos todo usando la lógica vigente en calculationLogic.ts
  // para asegurar cumplimiento normativo.
  
  return data.map((row: any, index: number) => {
    const width = parseFloat(row.cushion_width);
    const height = parseFloat(row.cushion_height);
    
    return {
      id: `db-${row.id}-${index}`,
      originalRow: row.original_row || { ancho: width, alto: height, _source: 'Cloud DB' },
      width,
      height,
      results: calculateAllWidths(width, height)
    };
  });
};