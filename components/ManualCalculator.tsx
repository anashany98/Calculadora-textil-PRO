import React, { useState } from 'react';
import { Calculator, ArrowRight, CheckCircle2, RotateCw, Ban } from 'lucide-react';
import { FABRIC_WIDTHS, CalculationResult } from '../types';
import { calculateConsumption } from '../utils/calculationLogic';

export const ManualCalculator: React.FC = () => {
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [fabricWidth, setFabricWidth] = useState<string>(FABRIC_WIDTHS[0].toString());
  const [isPatterned, setIsPatterned] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(width);
    const h = parseFloat(height);
    const fw = parseFloat(fabricWidth);

    if (!isNaN(w) && !isNaN(h) && !isNaN(fw)) {
      setResult(calculateConsumption(w, h, fw, isPatterned));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col md:flex-row">
      
      {/* Left Side: Input Form */}
      <div className="p-6 md:p-8 md:w-1/3 bg-white border-b md:border-b-0 md:border-r border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">Calculadora Rápida</h2>
            <p className="text-xs text-slate-400 font-medium">Cálculo individual</p>
          </div>
        </div>

        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ancho (cm)</label>
              <input
                type="number"
                step="0.1"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium text-slate-700"
                placeholder="40"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alto (cm)</label>
              <input
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium text-slate-700"
                placeholder="50"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ancho de Tela</label>
            <select
              value={fabricWidth}
              onChange={(e) => setFabricWidth(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 cursor-pointer"
            >
              {FABRIC_WIDTHS.map(w => (
                <option key={w} value={w}>{w} cm</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition select-none">
              <input 
                type="checkbox" 
                checked={isPatterned}
                onChange={(e) => setIsPatterned(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">Tela con Dibujo</span>
                <span className="text-[10px] text-slate-400">Impide girar las piezas para optimizar</span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-slate-200 hover:shadow-indigo-200 flex items-center justify-center gap-2 group"
          >
            Calcular
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>

      {/* Right Side: Results */}
      <div className="p-6 md:p-8 md:w-2/3 bg-slate-50/50 flex flex-col justify-center relative min-h-[300px]">
        {!result ? (
           <div className="text-center opacity-30 select-none">
             <Calculator className="w-16 h-16 mx-auto mb-4 text-slate-400" />
             <p className="text-slate-500 font-medium">Introduce medidas para calcular</p>
           </div>
        ) : !result.isValid ? (
           <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center animate-fadeIn">
             <p className="text-red-600 font-bold mb-1">Imposible Calcular</p>
             <p className="text-sm text-red-500">El cojín es demasiado grande para este ancho de tela.</p>
           </div>
        ) : (
          <div className="animate-fadeIn w-full">
             {/* Main Result Card */}
             <div className="flex items-center justify-between mb-6">
                <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consumo Estimado</span>
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-black text-indigo-600 tracking-tight">{result.consumoM.toFixed(4)}</span>
                     <span className="text-lg font-medium text-slate-500">m</span>
                   </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                  result.orientation === 'rotated' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                   {result.orientation === 'rotated' ? <RotateCw className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                   {result.orientation === 'rotated' ? 'Girado (Opt)' : 'Normal'}
                </div>
             </div>

             {/* Detailed Grid */}
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Placa */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Placa Final</span>
                  <div className="font-semibold text-slate-700">{result.anchoPlaca} x {result.altoPlaca} cm</div>
                </div>
                
                {/* Rendimiento */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Placas/Fila</span>
                  <div className="font-semibold text-slate-700">{result.placasPorFila}</div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cojines/Franja</span>
                  <div className="font-semibold text-slate-700">{result.cojinesTeoFranja}</div>
                </div>
             </div>

             <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Lógica Estricta Aplicada • {result.note}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};