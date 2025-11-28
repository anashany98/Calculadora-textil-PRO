// AutoSkuModule v3.1 - Strict Logic Update (NO Attributes)
import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Download, AlertTriangle, CheckCircle2, Package, ArrowRight, RefreshCw, FileText, Cpu, Calculator, Database, ServerCrash, Save, Check, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../utils/supabaseClient';

// 1. Tipos y Constantes
export interface SkuItem {
  code: string;
  description: string;
  family: string;
}

interface Toast {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

interface Family {
  id: number;
  code: string;
  name: string;
}

// 2. Algoritmo Determinista V3.1 (Sin Atributos)
const generateSkuAlgorithm = (description: string, forcedFamily: string): string => {
  // A. Limpieza
  const cleanDesc = description.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/g, '');

  const ignoredWords = ['DE', 'CON', 'PARA', 'EL', 'LA', 'LOS', 'LAS', 'Y', 'EN', 'DEL', 'POR'];
  const words = cleanDesc.split(' ').filter(w => w.length > 0 && !ignoredWords.includes(w));

  if (words.length === 0) return (forcedFamily + "GEN").slice(0, 10);

  // B. Extracción de Componentes
  let root = "";
  let numbers = "";

  // 1. Raíz (R) -> Máximo 3 caracteres
  if (words.length > 0) {
    const firstWord = words[0];
    const noVowels = firstWord.replace(/[AEIOU]/g, '');
    const baseRoot = noVowels.length > 0 ? noVowels : firstWord;
    // Límite estricto V3.1: 3 caracteres
    root = baseRoot.slice(0, 3); 
  }

  // 2. Medida (M) -> Máximo 3 dígitos
  const allNumbers = cleanDesc.match(/\d+/g);
  if (allNumbers) {
    // Concatenar todos y truncar a 3
    numbers = allNumbers.join('').slice(0, 3);
  }

  // 3. Atributos (A) -> ELIMINADO EN V3.1

  // C. Ensamblaje V3.1: F + R + M
  // F(4) + R(3) + M(3) = Máximo 10 caracteres.
  let sku = forcedFamily + root + numbers;

  // Corte de seguridad final por si acaso
  return sku.slice(0, 10);
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
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });
  const [families, setFamilies] = useState<Family[]>([]);

  // Cargar las familias desde la BD al montar el componente
  useEffect(() => {
    const fetchFamilies = async () => {
      const { data, error } = await supabase.from('product_families').select('id, code, name').order('code');
      if (error) {
        console.error("Error fetching families:", error);
        showToast("Error al cargar familias de la BD", "error");
      } else if (data) {
        setFamilies(data);
        if (data.length > 0 && !selectedFamily) {
          setSelectedFamily(data[0].code); // Seleccionar la primera por defecto
        }
      }
    };
    fetchFamilies();
  }, []);

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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleFetchFromDB = async () => {
    setIsFetching(true);
    setFetchError(null);
    setGeneratedItems([]);

    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          sku,
          original_description,
          product_families ( code )
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limitar a los 100 más recientes para no sobrecargar

      if (error) {
        throw error;
      }

      if (data) {
        const items: SkuItem[] = data.map((item: any) => ({
          code: item.sku,
          description: item.original_description,
          family: item.product_families.code,
        }));
        setGeneratedItems(items);
        showToast(`${items.length} artículos cargados desde la BD.`, 'success');
      }
    } catch (error: any) {
      console.error("Error fetching from Supabase:", error);
      setFetchError("No se pudo conectar con la base de datos. Revisa la consola para más detalles.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveToDB = async () => {
    if (generatedItems.length === 0) return;
    setIsSaving(true);

    // Encontrar el ID de la familia seleccionada desde el estado
    const currentFamily = families.find(f => f.code === selectedFamily);
    if (!currentFamily) {
      showToast(`Error: La familia "${selectedFamily}" no se encontró en la BD.`, 'error');
      setIsSaving(false);
      return;
    }

    const articlesToInsert = generatedItems.map(item => ({
      sku: item.code,
      original_description: item.description,
      family_id: currentFamily.id,
    }));

    try {
      const { error } = await supabase.from('articles').insert(articlesToInsert);

      if (error && error.code !== '23505') { // 23505 es el código de violación de unicidad
        throw error;
      }
      showToast('¡Artículos guardados en la base de datos!', 'success');
    } catch (error: any) {
      console.error("Error saving to Supabase:", error);
      showToast('Error al guardar. Revisa la consola.', 'error');
    } finally {
      setIsSaving(false);
    }
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
                  {families.map(f => (
                    <option key={f.id} value={f.code}>{f.code} - {f.name}</option>
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
               <FileText className="w-3 h-3" /> Algoritmo V3.1 (Sin Atributos)
             </h4>
             <ul className="text-xs text-blue-700/80 space-y-1 list-disc pl-4">
               <li><strong>Familia (F):</strong> 4 caracteres INTOCABLES.</li>
               <li><strong>Raíz (R):</strong> Máx. 3 caracteres (sin vocales).</li>
               <li><strong>Medida (M):</strong> Máx. 3 dígitos.</li>
               <li><strong>Orden:</strong> F + R + M.</li>
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
                   onClick={handleFetchFromDB}
                   disabled={isFetching}
                   className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Cargar artículos desde la Base de Datos"
                 >
                   {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} Cargar desde BD
                 </button>
                 <button 
                   onClick={handleSaveToDB}
                   disabled={isSaving || generatedItems.length === 0}
                   className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Guardar los SKUs generados en la Base de Datos"
                 >
                   {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar en BD
                 </button>
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
                   {isFetching ? (
                     <tr>
                       <td colSpan={3} className="p-12 text-center">
                         <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-3" />
                         <p className="text-slate-400 text-sm font-medium">Cargando datos...</p>
                       </td>
                     </tr>
                   ) : generatedItems.length === 0 ? (
                     <tr>
                       <td colSpan={3} className="p-12 text-center">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                           <ArrowRight className="w-6 h-6 text-slate-300" />
                         </div>
                         <p className="text-slate-400 text-sm font-medium">Los resultados aparecerán aquí</p>
                         {fetchError && <p className="text-red-500 text-xs mt-2 flex items-center justify-center gap-1"><ServerCrash className="w-3 h-3"/> {fetchError}</p>}
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

      {/* Toast Notification */}
      <div className={`fixed bottom-5 right-5 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className={`flex items-center gap-3 p-3 rounded-lg shadow-2xl text-sm font-semibold ${
          toast.type === 'success' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {toast.message}
        </div>
      </div>

    </div>
  );
};