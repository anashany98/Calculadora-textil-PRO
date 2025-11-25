import React, { useState } from 'react';
import { Sparkles, Copy, Download, AlertTriangle, CheckCircle2, Package, ArrowRight, RefreshCw, FileText, Cpu, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';

// 1. Tipos y Constantes
export interface SkuItem {
  code: string;
  description: string;
  family: string;
}

export const FAMILY_DEFINITIONS = [
  { code: "CNSM", name: "Consumibles", examples: "Cremalleras, hilos, colas" },
  { code: "HRRJ", name: "Herrajes", examples: "Anillas, soportes, ganchos" },
  { code: "RIBA", name: "Rieles y Barras", examples: "Perfiles, rieles técnicos" },
  { code: "MADR", name: "Madera", examples: "Tableros, listones" },
  { code: "HERR", name: "Herramientas", examples: "Brocas, tornillos" },
  { code: "ESBT", name: "Espuma y Boata", examples: "Rellenos, guata" },
  { code: "FUND", name: "Fundas", examples: "Confección de fundas" },
  { code: "CDRT", name: "Cuadrante", examples: "Cojines" },
  { code: "SOMB", name: "Sombra", examples: "Toldos completos" },
  { code: "LNCR", name: "Lencería", examples: "Tejidos varios" },
  { code: "CORT", name: "Cortinas", examples: "Tejidos de cortina" },
  { code: "ESTR", name: "Estores", examples: "Paqueto, enrollable" },
  { code: "MNTL", name: "Mantelería", examples: "Manteles, servilletas" },
  { code: "MO", name: "Mano de Obra", examples: "Instalaciones, tapizados" }
];

// 2. Algoritmo Determinista (Lógica Estricta JavaScript) - v2.1
const generateSkuAlgorithm = (description: string, forcedFamily: string): string => {
  // A. Limpieza
  const cleanDesc = description.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/g, '');

  const ignoredWords = ['DE', 'CON', 'PARA', 'EL', 'LA', 'LOS', 'LAS', 'Y', 'EN', 'DEL', 'POR'];
  const words = cleanDesc.split(' ').filter(w => w.length > 0 && !ignoredWords.includes(w));

  if (words.length === 0) return (forcedFamily + "GEN").slice(0, 10);

  // B. Extracción
  let root = "";
  let numbers = "";
  let attributes = "";

  // 1. Raíz
  if (words.length > 0) {
    const firstWord = words[0];
    const noVowels = firstWord.replace(/[AEIOU]/g, '');
    const baseRoot = noVowels.length > 0 ? noVowels : firstWord;
    root = baseRoot.slice(0, 4); 
  }

  // 2. Medida (Números)
  const allNumbers = cleanDesc.match(/\d+/g);
  if (allNumbers) {
    numbers = allNumbers.join('');
  }

  // 3. Atributos
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    if (!/^\d+$/.test(w)) {
      attributes += w.charAt(0);
    }
  }

  // C. Ensamblaje (NUEVO ORDEN: Familia + Raíz + Atributos + Medida)
  let sku = forcedFamily + root + attributes + numbers;

  // D. Truncado Inteligente (Prioridad de sacrificio: Atributos -> Números -> Raíz)
  if (sku.length > 10) {
    const excess = sku.length - 10;
    
    if (attributes.length >= excess) {
      // Cortar atributos primero
      attributes = attributes.slice(0, attributes.length - excess);
    } else {
      const remainingAfterAttrs = excess - attributes.length;
      attributes = ""; // Eliminar atributos si no es suficiente
      
      if (numbers.length >= remainingAfterAttrs) {
        // Cortar números (medida)
        numbers = numbers.slice(0, numbers.length - remainingAfterAttrs);
      } else {
        const remainingAfterNums = remainingAfterAttrs - numbers.length;
        numbers = ""; // Eliminar números
        
        // Cortar raíz (último recurso, no tocar familia)
        if (root.length > remainingAfterNums) {
           root = root.slice(0, root.length - remainingAfterNums);
        }
      }
    }
    // Reconstruir con el nuevo orden tras el recorte
    sku = forcedFamily + root + attributes + numbers;
  }

  return sku;
};

const SkuRow = ({ item }: { item: SkuItem }) => {
  const isLengthValid = item.code.length <= 10;

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="p-3">
        <span className="inline-block px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono text-slate-500">
          {item.family}
        </span>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-700 text-sm">{item.code}</span>
          {isLengthValid ? (
            <span className="text-[10px] text-emerald-500 font-medium bg-emerald-50 px-1 rounded">
              OK
            </span>
          ) : (
            <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1 rounded flex items-center">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> {item.code.length} chars
            </span>
          )}
        </div>
      </td>
      <td className="p-3 text-sm text-slate-600 truncate max-w-xs" title={item.description}>
        {item.description}
      </td>
    </tr>
  );
};

export const AutoSkuModule: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('CNSM');
  const [generatedItems, setGeneratedItems] = useState<SkuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setGeneratedItems([]);

    setTimeout(() => {
      const lines = inputText.split('\n');
      const items: SkuItem[] = [];

      lines.forEach(line => {
        const desc = line.trim();
        if (!desc) return;
        const code = generateSkuAlgorithm(desc, selectedFamily);
        items.push({ code, description: desc, family: selectedFamily });
      });

      setGeneratedItems(items);
      setLoading(false);
    }, 300);
  };

  const handleCopy = () => {
    const csvContent = "CODIGO;DESCRIPCION;FAMILIA\n" + generatedItems.map(i => `${i.code};${i.description};${i.family}`).join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(generatedItems);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SKUs");
    XLSX.writeFile(workbook, "AutoSKU_Export.xlsx");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fadeIn pb-20">
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
        <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl text-white shadow-lg">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">AutoSKU Architect (Offline)</h2>
          <p className="text-slate-500 font-medium">Generación algorítmica de códigos de inventario</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                1. Selección de Familia (Obligatorio)
              </label>
              <div className="relative">
                <select
                  value={selectedFamily}
                  onChange={(e) => setSelectedFamily(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  {FAMILY_DEFINITIONS.map(f => (
                    <option key={f.code} value={f.code}>{f.code} - {f.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Package className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="mb-6 flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                2. Lista de Artículos (Una por línea)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ejemplos:
Cinta adhesiva doble cara 25mm
Riel técnico extensible blanco 2m
Cojín cuadrado 45x45 loneta gris`}
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <div className="text-right mt-1">
                <span className="text-[10px] text-slate-400">
                   {inputText.split('\n').filter(l => l.trim()).length} líneas detectadas
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !inputText.trim()}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading || !inputText.trim()
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-slate-900 hover:bg-indigo-600 hover:shadow-indigo-500/30 hover:scale-[1.02]'
              }`}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
              {loading ? 'Procesando...' : 'Generar Códigos SKU'}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
             <h4 className="text-blue-800 font-bold text-xs uppercase mb-2 flex items-center gap-1">
               <FileText className="w-3 h-3" /> Algoritmo V2.1 (Fam+Raiz+Atr+Num)
             </h4>
             <ul className="text-xs text-blue-700/80 space-y-1 list-disc pl-4">
               <li><strong>Familia:</strong> 4 caracteres fijos (ej. CNSM).</li>
               <li><strong>Raíz:</strong> 1ª palabra sin vocales (CINTA &rarr; CNT).</li>
               <li><strong>Atributos:</strong> Iniciales del resto (Doble Cara &rarr; DC).</li>
               <li><strong>Medida:</strong> Dígitos encontrados (25).</li>
               <li><strong>Límite:</strong> 10 caracteres estricto.</li>
             </ul>
          </div>
        </div>

        <div className="lg:col-span-7 h-full flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden min-h-[500px]">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 shadow-sm">
                   {generatedItems.length} SKUs
                 </span>
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={handleCopy}
                   disabled={generatedItems.length === 0}
                   className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                   title="Copiar CSV"
                 >
                   {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                 </button>
                 <button 
                   onClick={handleDownload}
                   disabled={generatedItems.length === 0}
                   className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Download className="w-4 h-4" /> Exportar
                 </button>
               </div>
             </div>

             <div className="flex-1 overflow-auto">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50 sticky top-0 z-10">
                   <tr>
                     <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b">Familia</th>
                     <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b">SKU Generado</th>
                     <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b">Descripción Original</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {generatedItems.length === 0 ? (
                     <tr>
                       <td colSpan={3} className="p-12 text-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                           <ArrowRight className="w-6 h-6 text-slate-300" />
                         </div>
                         <p className="text-slate-400 text-sm font-medium">Los resultados aparecerán aquí</p>
                       </td>
                     </tr>
                   ) : (
                     generatedItems.map((item, idx) => (
                       <SkuRow key={idx} item={item} />
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};