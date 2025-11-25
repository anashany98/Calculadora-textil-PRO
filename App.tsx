import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Cloud, Save, Loader2, Scissors, Layers, RotateCw, Ban, Calculator, Sparkles } from 'lucide-react';
import { CushionItem } from './types';
import { processExcelFile, downloadExcel } from './utils/excelService';
import { runStrictAudit, calculateAllWidths } from './utils/calculationLogic';
import { saveBatchToSupabase, fetchHistoryFromSupabase } from './utils/dataService';
import { isSupabaseConfigured } from './utils/supabaseClient';
import { ManualCalculator } from './components/ManualCalculator';
import { ResultsTable } from './components/ResultsTable';
import { AutoSkuModule } from './components/AutoSkuModule';

function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'calculator' | 'autosku'>('calculator');

  // Calculator State
  const [items, setItems] = useState<CushionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditFailed, setAuditFailed] = useState(false);
  const [isPatterned, setIsPatterned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAppConfigured, setIsAppConfigured] = useState(true);

  useEffect(() => {
    try {
      runStrictAudit();
    } catch (e) {
      console.error(e);
      setAuditFailed(true);
      setError("ERROR CRÍTICO DE LÓGICA: El sistema ha detectado una desviación en las fórmulas obligatorias.");
    }

    if (!isSupabaseConfigured()) {
      setIsAppConfigured(false);
    }
  }, []);

  useEffect(() => {
    setItems(prevItems => {
      if (prevItems.length === 0) return prevItems;
      return prevItems.map(item => ({
        ...item,
        results: calculateAllWidths(item.width, item.height, isPatterned)
      }));
    });
  }, [isPatterned]); 

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (auditFailed) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await processExcelFile(file);
      if (data.length === 0) {
          setError("No se encontraron columnas válidas. Usa 'Ancho' y 'Alto'.");
      } else {
          const itemsWithCurrentSetting = data.map(item => ({
            ...item,
            results: calculateAllWidths(item.width, item.height, isPatterned)
          }));
          setItems(itemsWithCurrentSetting);
      }
    } catch (err) {
      console.error(err);
      setError("Error al leer el archivo. Asegúrate de que es un Excel válido (.xlsx).");
    } finally {
      setLoading(false);
    }
    e.target.value = '';
  };

  const handleSaveToCloud = async () => {
    if (!isAppConfigured || items.length === 0) return;
    setIsSaving(true);
    try {
      const batchName = `Lote ${new Date().toLocaleString()}`;
      await saveBatchToSupabase(items, batchName);
      alert("✅ Datos guardados correctamente en la nube.");
    } catch (err) {
      console.error(err);
      alert("❌ Error al guardar en la base de datos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadHistory = async () => {
    if (!isAppConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const historyItems = await fetchHistoryFromSupabase();
      if (historyItems.length === 0) {
        alert("No hay datos guardados.");
      } else {
        const reCalcItems = historyItems.map(item => ({
            ...item,
            results: calculateAllWidths(item.width, item.height, isPatterned)
        }));
        setItems(reCalcItems);
      }
    } catch (err) {
      console.error(err);
      setError("Error al recuperar datos de la nube.");
    } finally {
      setLoading(false);
    }
  };

  if (auditFailed) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg text-center border border-red-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Lógica Comprometida</h1>
          <p className="text-slate-600 mb-6 leading-relaxed">Error Code: STRICT_AUDIT_MISMATCH</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-slate-900 text-white pt-6 pb-20 px-4 md:px-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-800 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-xs font-medium tracking-wider text-indigo-100 uppercase backdrop-blur-md">
                  v2.0 Strict Mode
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">
                Calculadora Textil Pro
              </h1>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/10 backdrop-blur-md w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'calculator' 
                    ? 'bg-white text-indigo-900 shadow-lg' 
                    : 'text-indigo-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Calculator className="w-4 h-4" />
                Calculadora
              </button>
              <button
                onClick={() => setActiveTab('autosku')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'autosku' 
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' 
                    : 'text-indigo-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AutoSKU
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
        
        {/* TABA 1: CALCULADORA TEXTIL */}
        {activeTab === 'calculator' && (
          <div className="animate-fadeIn">
             {/* Controls Bar for Calculator */}
             <div className="flex justify-end mb-6">
               <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  {/* Pattern Switch */}
                  <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex items-center">
                    <button
                      onClick={() => setIsPatterned(false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        !isPatterned ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <RotateCw className="w-3 h-3" /> Lisa (Girar)
                    </button>
                    <button
                      onClick={() => setIsPatterned(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        isPatterned ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Ban className="w-3 h-3" /> Con Dibujo
                    </button>
                  </div>

                  {/* Cloud Actions */}
                  {isAppConfigured && (
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                      <button 
                        onClick={handleLoadHistory}
                        disabled={loading}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Cargar Historial"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      </button>
                      <div className="w-px h-6 bg-slate-100"></div>
                      <button 
                        onClick={handleSaveToCloud}
                        disabled={isSaving || items.length === 0}
                        className={`p-2 rounded-lg transition flex items-center gap-2 ${
                          items.length === 0 
                            ? 'text-slate-300 cursor-not-allowed' 
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title="Guardar Lote"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
               </div>
             </div>

             <ManualCalculator />

             <div className="flex items-center gap-4 my-8">
                <div className="h-px bg-slate-300 flex-1"></div>
                <div className="flex items-center gap-2 text-slate-400 font-medium text-xs uppercase tracking-widest">
                   <Layers className="w-3 h-3" /> Procesamiento por Lotes
                </div>
                <div className="h-px bg-slate-300 flex-1"></div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8 transition-all hover:shadow-md">
                 <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all group overflow-hidden">
                     <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] group-hover:bg-grid-indigo-100/50 transition-colors"></div>
                     <div className="relative flex flex-col items-center justify-center z-10">
                         {loading ? (
                              <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                <span className="text-xs font-medium text-indigo-600">Procesando...</span>
                              </div>
                         ) : (
                             <>
                                 <div className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:border-indigo-200 transition-all">
                                   <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                                 </div>
                                 <p className="text-sm text-slate-600 font-semibold">Cargar Excel (.xlsx)</p>
                             </>
                         )}
                     </div>
                     <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} />
                 </label>
                 
                 {error && (
                     <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-start gap-2 text-sm animate-fadeIn">
                         <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                         <span>{error}</span>
                     </div>
                 )}
             </div>

             <ResultsTable items={items} onDownload={() => downloadExcel(items)} />
             
             {items.length === 0 && !loading && !error && (
                 <div className="text-center py-12 opacity-40">
                     <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                     <p className="text-slate-400 text-sm">Esperando datos...</p>
                 </div>
             )}
          </div>
        )}

        {/* TAB 2: AUTOSKU ARCHITECT */}
        {activeTab === 'autosku' && (
          <div className="mt-8">
            <AutoSkuModule />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;