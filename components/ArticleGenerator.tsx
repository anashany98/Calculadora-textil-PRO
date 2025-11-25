import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Tag, Ruler, Type, Hash, Check } from 'lucide-react';

export const ArticleGenerator: React.FC = () => {
  // Estado del formulario
  const [familia, setFamilia] = useState('COJ');
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [tejido, setTejido] = useState('');
  const [color, setColor] = useState('');
  const [acabado, setAcabado] = useState('S/VIVO');
  
  const [generatedName, setGeneratedName] = useState('');
  const [copied, setCopied] = useState(false);

  // Lógica de generación (Simulación de la lógica EGEA/SIMGEST)
  // Formato típico: FAMILIA - MEDIDA - ACABADO - TEJIDO - COLOR
  useEffect(() => {
    const parts = [];

    // 1. Familia
    if (familia) parts.push(familia.toUpperCase());

    // 2. Medidas (Format: 40X40)
    if (ancho || alto) {
      const w = ancho || '00';
      const h = alto || '00';
      parts.push(`${w}X${h}`);
    }

    // 3. Acabado
    if (acabado) parts.push(acabado.toUpperCase());

    // 4. Tejido
    if (tejido) parts.push(tejido.toUpperCase().trim());

    // 5. Color/Variante
    if (color) parts.push(color.toUpperCase().trim());

    setGeneratedName(parts.join(' '));
  }, [familia, ancho, alto, tejido, color, acabado]);

  const handleCopy = () => {
    if (!generatedName) return;
    navigator.clipboard.writeText(generatedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setAncho('');
    setAlto('');
    setTejido('');
    setColor('');
    setCopied(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header del Módulo */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Generador de Artículos EGEA</h2>
        <p className="text-slate-500">Estandarización de nombres para sistema SIMGEST</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Panel de Entrada */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-indigo-700 font-bold uppercase text-xs tracking-wider border-b border-slate-100 pb-2">
            <Type className="w-4 h-4" /> Configuración del Artículo
          </div>

          <div className="space-y-4">
            {/* Familia */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Familia / Tipo</label>
              <select 
                value={familia} 
                onChange={(e) => setFamilia(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="COJ">COJ (Cojín Completo)</option>
                <option value="FUN">FUN (Funda Cojín)</option>
                <option value="REL">REL (Relleno)</option>
                <option value="COL">COL (Colcha)</option>
                <option value="PLA">PLA (Plaid)</option>
              </select>
            </div>

            {/* Dimensiones */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ancho (cm)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={ancho}
                    onChange={(e) => setAncho(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej. 50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Alto (cm)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={alto}
                    onChange={(e) => setAlto(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej. 30"
                  />
                </div>
              </div>
            </div>

            {/* Acabado */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Acabado / Confección</label>
              <select 
                value={acabado} 
                onChange={(e) => setAcabado(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="S/VIVO">S/VIVO (Sin Vivo)</option>
                <option value="C/VIVO">C/VIVO (Con Vivo)</option>
                <option value="PESTAÑA">PESTAÑA</option>
                <option value="CREMALLERA">CREMALLERA</option>
              </select>
            </div>

            {/* Tejido y Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tejido / Modelo</label>
                <input 
                  type="text" 
                  value={tejido}
                  onChange={(e) => setTejido(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej. LONETA"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Color / Ref</label>
                <input 
                  type="text" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej. 05 AZUL"
                />
              </div>
            </div>
            
             <button 
              onClick={handleReset}
              className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition mt-2"
            >
              <RefreshCw className="w-3 h-3" /> Limpiar Campos
            </button>
          </div>
        </div>

        {/* Panel de Resultado */}
        <div className="flex flex-col">
          <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl flex-1 flex flex-col justify-center relative overflow-hidden">
             {/* Background decorative */}
             <div className="absolute top-0 right-0 p-10 opacity-5">
               <Hash className="w-32 h-32" />
             </div>

             <label className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
               <Tag className="w-4 h-4" /> Resultado SIMGEST
             </label>

             <div className="bg-black/30 p-6 rounded-xl border border-white/10 backdrop-blur-sm mb-6">
                <p className="font-mono text-2xl md:text-3xl font-bold break-all text-center leading-relaxed">
                  {generatedName || <span className="text-white/20 italic text-lg">Esperando datos...</span>}
                </p>
             </div>

             <div className="flex gap-3">
               <button
                 onClick={handleCopy}
                 disabled={!generatedName}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all shadow-lg ${
                   copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                 } ${!generatedName && 'opacity-50 cursor-not-allowed'}`}
               >
                 {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                 {copied ? '¡Copiado!' : 'Copiar Nombre'}
               </button>
             </div>
             
             <div className="mt-6 text-center">
               <p className="text-xs text-slate-400">
                 Longitud actual: <span className="font-mono text-white">{generatedName.length}</span> caracteres
               </p>
             </div>
          </div>
          
          <div className="mt-4 bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-xs leading-relaxed">
            <strong>Nota:</strong> Este generador sigue la estructura estándar: <br/>
            <code>FAMILIA + MEDIDA + ACABADO + TEJIDO + COLOR</code>. <br/>
            Asegúrate de que coincide con la parametrización de tu ERP.
          </div>
        </div>

      </div>
    </div>
  );
};