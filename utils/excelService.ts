import * as XLSX from 'xlsx';
import { CushionItem, FABRIC_WIDTHS } from '../types';
import { detectDimensions, calculateAllWidths } from './calculationLogic';

export const processExcelFile = async (file: File): Promise<CushionItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const processedData: CushionItem[] = jsonData.map((row: any, index) => {
          const { width, height } = detectDimensions(row);
          
          if (width !== null && height !== null) {
            return {
              id: `row-${index}`,
              originalRow: row,
              width,
              height,
              results: calculateAllWidths(width, height)
            };
          }
          return null;
        }).filter((item): item is CushionItem => item !== null);

        resolve(processedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const generateExportData = (items: CushionItem[]) => {
  return items.map(item => {
    const exportRow: any = { ...item.originalRow };
    
    // Add calculated data columns for every fabric width
    FABRIC_WIDTHS.forEach(fw => {
      const res = item.results[fw];
      const prefix = `Tela_${fw}cm`;
      
      if (res && res.isValid) {
        exportRow[`${prefix}_Placas`] = res.placasPorFila;
        exportRow[`${prefix}_CojinesTeo`] = res.cojinesTeoFranja;
        exportRow[`${prefix}_Consumo_M`] = Number(res.consumoM.toFixed(4)); // Format for readability
      } else {
        exportRow[`${prefix}_Estado`] = "NO CABE";
      }
    });

    return exportRow;
  });
};

export const downloadExcel = (items: CushionItem[]) => {
  const data = generateExportData(items);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Consumo");
  XLSX.writeFile(workbook, "Calculo_Consumo_Telas.xlsx");
};