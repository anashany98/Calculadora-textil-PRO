import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Copy, Download, AlertTriangle, CheckCircle2, Package, ArrowRight, RefreshCw, FileText } from 'lucide-react';
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

// 2. Lógica de Prompting
const getSkuSystemInstruction = (forcedFamilyCode: string | null) => {
  const familyList = FAMILY_DEFINITIONS.map(f => `* **${f.code}** = ${f.name}`).join('\n');
  const override = forcedFamilyCode 
    ? `\n### ⚠️ REGLA DE PRIORIDAD: EL USUARIO FORZÓ LA FAMILIA **${forcedFamilyCode}**. IGNORA TU CLASIFICACIÓN Y USA ESA.` 
    : '';

  return `
Actúa como Arquitecto de Inventario. Tu tarea: Convertir descripciones en SKUs de MÁXIMO 10 CARACTERES.
${override}
1. FAMILIA (4 letras): Usa una de estas: \n${familyList}
2. DEFINICIÓN (6 letras):
   - Raíz: 3-4 letras (quita vocales, ej: CINTA->CINT).
   - Medidas: Números (ej: 25mm->25).
   - Atributos: 1 letra (B=Blanco, A=Adhesivo).
SALIDA: Tabla CSV con cabecera CODIGO;DESCRIPCION;FAMILIA
Sin explicaciones extra, solo el CSV.
  `;
};

// 3. Componente Visual
export const AutoSkuModule: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [generatedItems, setGeneratedItems] = useState<SkuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSkus = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setGeneratedItems([]);

    try {
      if (!process.env.API_KEY) {
        throw new Error("Falta API Key de Google (VITE_GOOGLE_API_KEY en .env)");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: inputText,
        config: {
          systemInstruction: getSkuSystemInstruction(selectedFamily || null),
          temperature: 0.1,
        }
      });

      const text = response.text || "";
      
      // Parseo básico de CSV
      // Limpiamos bloques de código si los hubiera
      const cleanText = text.replace(/```csv/g, '').replace(/```/g, '').trim();
      const lines = cleanText.split('\n');
      const items: SkuItem[] = [];

      // Empezamos desde 1 asumiendo que la línea 0 es cabecera
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [code, description, family] = line.split(';');
        if (code) {
          items.push({
            code: code.trim(),
            description: description ? description.trim() : '',
            family: family ? family.trim() : ''
          });
        }
      }

      setGeneratedItems(items);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al generar SKUs");
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fadeIn">
      
      {/* Header Module */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
        <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl text-white shadow-lg">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">AutoSKU Architect</h2>
          <p className="text-slate-500 font-medium">Generación inteligente de códigos de inventario con IA</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* INPUT PANEL */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            
            {/* Family Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                1. Configuración de Familia
              </label>
              <div className="relative">
                <select
                  value={selectedFamily}
                  onChange={(e) => setSelectedFamily(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                >
                  <option value="">✨ Auto-Detectar (Recomendado)</option>
                  {FAMILY_DEFINITIONS.map(f => (
                    <option key={f.code} value={f.code}>{f.code} - {f.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Package className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Input Textarea */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                2. Lista de Artículos
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Pega aquí tu lista, ej:
Cinta adhesiva doble cara 25mm
Riel técnico extensible blanco
Cojín cuadrado 45x45 loneta gris`}
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />
              <div className="text-right mt-1">
                <span className="text-[10px] text-slate-400">
                   {inputText.split('\n').filter(l => l.trim()).length} líneas detectadas
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={generateSkus}
              disabled={loading || !inputText.trim()}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading || !inputText.trim()
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-slate-900 hover:bg-indigo-600 hover:shadow-indigo-500/30 hover:scale-[1.02]'
              }`}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Arquitecto pensando...' : 'Generar Códigos SKU'}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
             <h4 className="text-indigo-800 font-bold text-xs uppercase mb-2 flex items-center gap-1">
               <FileText className="w-3 h-3" /> Reglas de Negocio
             </h4>
             <ul className="text-xs text-indigo-700/80 space-y-1 list-disc pl-4">
               <li>Máximo 10 caracteres por SKU.</li>
               <li>Se eliminan vocales de la raíz para comprimir.</li>
               <li>Números se mantienen para medidas.</li>
               <li>Colores y atributos se abrevian a 1 letra.</li>
             </ul>
          </div>
        </div>

        {/* OUTPUT PANEL */}
        <div className="lg:col-span-7 h-full flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden h-[600px]">
             
             {/* Toolbar */}
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

             {/* Table */}
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
                       <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                         <td className="p-3">
                           <span className="inline-block px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-mono text-slate-500">
                             {item.family}
                           </span>
                         </td>
                         <td className="p-3">
                           <div className="flex items-center gap-2">
                             <span className="font-mono font-bold text-slate-700 text-sm">{item.code}</span>
                             {item.code.length > 10 ? (
                               <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1 rounded flex items-center">
                                 <AlertTriangle className="w-3 h-3 mr-0.5" /> {item.code.length} chars
                               </span>
                             ) : (
                               <span className="text-[10px] text-emerald-500 font-medium bg-emerald-50 px-1 rounded">
                                 OK
                               </span>
                             )}
                           </div>
                         </td>
                         <td className="p-3 text-sm text-slate-600 truncate max-w-xs" title={item.description}>
                           {item.description}
                         </td>
                       </tr>
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