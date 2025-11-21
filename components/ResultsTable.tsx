import React, { useState, useMemo } from 'react';
import { CushionItem, FABRIC_WIDTHS } from '../types';
import { Download, ArrowUpDown, Filter, Check, Search, X, ChevronDown, Ruler, RotateCw, Ban, Maximize2 } from 'lucide-react';
import { CalculationResult } from '../types';

interface Props {
  items: CushionItem[];
  onDownload: () => void;
}

type SortConfig = {
  key: 'dimensions' | number;
  direction: 'asc' | 'desc';
};

export const ResultsTable: React.FC<Props> = ({ items, onDownload }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [visibleWidths, setVisibleWidths] = useState<number[]>([...FABRIC_WIDTHS]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ item: CushionItem, fabricWidth: number, result: CalculationResult } | null>(null);
  
  const [isDimFilterOpen, setIsDimFilterOpen] = useState(false);
  const [filterWidth, setFilterWidth] = useState('');
  const [filterHeight, setFilterHeight] = useState('');
  
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleSort = (key: 'dimensions' | number) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleWidthVisibility = (width: number) => {
    setVisibleWidths(current => 
      current.includes(width) 
        ? current.filter(w => w !== width)
        : [...current, width].sort((a, b) => a - b)
    );
  };

  const toggleAll = () => {
    if (visibleWidths.length === FABRIC_WIDTHS.length) {
      setVisibleWidths([]);
    } else {
      setVisibleWidths([...FABRIC_WIDTHS]);
    }
  };

  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterWidth && item.width !== parseFloat(filterWidth)) return false;
      if (filterHeight && item.height !== parseFloat(filterHeight)) return false;

      if (!searchTerm.trim()) return true;

      const lowerTerm = searchTerm.toLowerCase().trim();
      const dimensionMatch = lowerTerm.match(/^(\d+(?:[\.,]\d+)?)\s*[xX*]\s*(\d+(?:[\.,]\d+)?)$/);
      if (dimensionMatch) {
        const searchW = parseFloat(dimensionMatch[1].replace(',', '.'));
        const searchH = parseFloat(dimensionMatch[2].replace(',', '.'));
        return (item.width === searchW && item.height === searchH);
      }
      
      if (item.width.toString().includes(lowerTerm)) return true;
      if (item.height.toString().includes(lowerTerm)) return true;
      if (item.id.toLowerCase().includes(lowerTerm)) return true;
      if (item.originalRow) {
        const rowValues = Object.values(item.originalRow)
          .filter(v => v !== null && v !== undefined)
          .join(' ')
          .toLowerCase();
        if (rowValues.includes(lowerTerm)) return true;
      }
      return false;
    });
  }, [items, searchTerm, filterWidth, filterHeight]);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return filteredItems;
    
    return [...filteredItems].sort((a, b) => {
      let valA, valB;

      if (sortConfig.key === 'dimensions') {
        valA = a.width * a.height;
        valB = b.width * b.height;
      } else {
        const width = sortConfig.key as number;
        valA = a.results[width]?.isValid ? a.results[width].consumoM : 999999;
        valB = b.results[width]?.isValid ? b.results[width].consumoM : 999999;
      }

      if (valA === valB) return 0;
      const comparison = valA < valB ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortConfig]);

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col h-[calc(100dvh-200px)] md:h-[calc(100vh-280px)] min-h-[400px] animate-fadeIn relative overflow-hidden">
      
      {/* === MODAL DE DETALLE (AUDIT TICKET) === */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedCell(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded">Ficha Técnica</span>
                   <span className="text-xs text-slate-400 font-mono">ID: {selectedCell.item.id.split('-').pop()}</span>
                </div>
                <h3 className="font-bold text-xl text-slate-800">Cojín {selectedCell.item.width} x {selectedCell.item.height}</h3>
                <p className="text-slate-500 text-sm">Tela Ancho {selectedCell.fabricWidth} cm</p>
              </div>
              <button onClick={() => setSelectedCell(null)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
               
               {/* Main Consumption Big Number */}
               <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consumo Final</span>
                  <div className="text-5xl font-black text-indigo-600 my-1 tracking-tighter">
                    {selectedCell.result.consumoM.toFixed(4)}
                    <span className="text-2xl text-indigo-300 ml-1 font-medium">m</span>
                  </div>
                  
                  {/* Orientation Badge */}
                  <div className="flex justify-center mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                       selectedCell.result.orientation === 'rotated'
                       ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                       : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                       {selectedCell.result.orientation === 'rotated' ? <RotateCw className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                       {selectedCell.result.orientation === 'rotated' ? 'Orientación Girada' : 'Orientación Normal'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic">{selectedCell.result.note}</p>
               </div>

               <div className="h-px bg-slate-100 w-full"></div>

               {/* Technical Details Grid */}
               <div className="grid grid-cols-2 gap-4">
                  {/* Placa info */}
                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Ancho Placa</span>
                        <span className="font-mono font-bold text-slate-700">{selectedCell.result.anchoPlaca} cm</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Alto Placa</span>
                        <span className="font-mono font-bold text-slate-700">{selectedCell.result.altoPlaca} cm</span>
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span className="text-xs text-slate-500 font-medium">Alto Franja</span>
                        <span className="font-mono font-bold text-indigo-600">{selectedCell.result.alturaFranjaCm} cm</span>
                     </div>
                  </div>

                  {/* Performance info */}
                  <div className="space-y-3 border-l border-slate-100 pl-4">
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Placas/Fila</span>
                        <span className="font-mono font-bold text-slate-700">{selectedCell.result.placasPorFila}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Cojines/Franja</span>
                        <span className="font-mono font-bold text-slate-700">{selectedCell.result.cojinesTeoFranja}</span>
                     </div>
                     <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span className="text-xs text-slate-500 font-medium">Consumo (cm)</span>
                        <span className="font-mono font-bold text-indigo-600">{selectedCell.result.consumoCm.toFixed(2)}</span>
                     </div>
                  </div>
               </div>

            </div>
            
            {/* Modal Footer */}
            <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
               <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                 <Check className="w-3 h-3" /> Auditoría de Lógica Estricta v2.0 OK
               </span>
            </div>
          </div>
        </div>
      )}

      {/* === TOOLBAR HEADER === */}
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white z-20 relative">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg hidden sm:block">
             <Maximize2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              Resultados
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium border border-slate-200">
                {filteredItems.length}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          
          {/* SEARCH & FILTERS GROUP */}
          <div className="flex flex-1 gap-2">
             {/* Main Search */}
             <div className="relative group flex-1 min-w-[140px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition shadow-sm bg-slate-50 focus:bg-white"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
             </div>

             {/* Dimensions Filter Button */}
             <div className="relative">
                <button
                  onClick={() => setIsDimFilterOpen(!isDimFilterOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition border h-full ${
                    isDimFilterOpen || filterWidth || filterHeight
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Filtrar por medidas exactas"
                >
                  <Ruler className="w-4 h-4" />
                  {(filterWidth || filterHeight) && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                </button>

                {/* Dimensions Popover */}
                {isDimFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsDimFilterOpen(false)}></div>
                    <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-4 animate-fadeIn">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Dimensiones Exactas</h4>
                       <div className="flex gap-2 mb-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Ancho</label>
                            <input 
                              type="number" 
                              value={filterWidth} 
                              onChange={(e) => setFilterWidth(e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Alto</label>
                            <input 
                              type="number" 
                              value={filterHeight} 
                              onChange={(e) => setFilterHeight(e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                       </div>
                       <button 
                         onClick={() => { setFilterWidth(''); setFilterHeight(''); setIsDimFilterOpen(false); }}
                         className="w-full py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                       >
                         Limpiar Filtros
                       </button>
                    </div>
                  </>
                )}
             </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fabric Columns Filter */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition border ${
                  isFilterOpen || visibleWidths.length < FABRIC_WIDTHS.length
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden xl:inline">Columnas</span>
                {visibleWidths.length < FABRIC_WIDTHS.length && (
                  <span className="ml-1 w-5 h-5 flex items-center justify-center bg-indigo-600 text-white text-[10px] rounded-full">
                      {visibleWidths.length}
                  </span>
                )}
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsFilterOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2 grid grid-cols-2 gap-1">
                    <button 
                      onClick={toggleAll}
                      className="col-span-2 text-xs font-bold text-center p-2 text-indigo-600 hover:bg-indigo-50 rounded mb-1 transition"
                    >
                      {visibleWidths.length === FABRIC_WIDTHS.length ? 'Ocultar Todo' : 'Mostrar Todo'}
                    </button>
                    {FABRIC_WIDTHS.map(fw => (
                      <button
                        key={fw}
                        onClick={() => toggleWidthVisibility(fw)}
                        className={`flex items-center justify-between px-3 py-2 text-xs rounded transition ${
                          visibleWidths.includes(fw)
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        Tela {fw}
                        {visibleWidths.includes(fw) && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-lg shadow-slate-200 hover:shadow-indigo-200"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xl:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* === MOBILE CARD LIST (Collapsible) === */}
      <div className="md:hidden flex-1 overflow-y-auto bg-slate-50 p-3 space-y-3">
        {sortedItems.map((item) => {
           const isExpanded = expandedItems.has(item.id);
           const extraInfo = item.originalRow && Object.keys(item.originalRow).find(k => !['width','height','ancho','alto'].includes(k.toLowerCase()));
           const extraInfoValue = extraInfo ? item.originalRow[extraInfo] : null;

           return (
             <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
                {/* Card Header */}
                <div 
                  onClick={() => toggleItemExpansion(item.id)}
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center border border-indigo-100 shrink-0">
                       <span className="text-xs font-bold leading-none">{item.width}</span>
                       <div className="h-px w-4 bg-indigo-200 my-0.5"></div>
                       <span className="text-xs font-bold leading-none">{item.height}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-800">Cojín {item.width} x {item.height}</span>
                       <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                         <span className="font-mono bg-slate-100 px-1.5 rounded">#{item.id.split('-').pop()}</span>
                         {extraInfoValue && <span className="truncate max-w-[120px]">• {extraInfoValue}</span>}
                       </div>
                    </div>
                  </div>
                  <div className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>

                {/* Card Body (Results Grid) - Collapsible Content */}
                {isExpanded && (
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fadeIn">
                     {visibleWidths.map(fw => {
                        const res = item.results[fw];
                        const isValid = res.isValid;
                        
                        return (
                          <div 
                            key={fw}
                            onClick={() => isValid && setSelectedCell({ item, fabricWidth: fw, result: res })}
                            className={`
                              p-3 rounded-lg border flex flex-col items-center text-center transition-all relative overflow-hidden
                              ${isValid 
                                ? 'bg-white border-indigo-100 hover:border-indigo-300 cursor-pointer shadow-sm active:scale-95' 
                                : 'bg-slate-100 border-slate-200 opacity-50'}
                            `}
                          >
                             <span className="text-[9px] font-bold text-slate-400 uppercase mb-1">Tela {fw}</span>
                             {isValid ? (
                               <>
                                 <span className="text-lg font-black text-indigo-600 leading-none">{res.consumoM.toFixed(3)}</span>
                                 <span className="text-[9px] text-slate-500 mt-1">{res.placasPorFila} pl/fila</span>
                                 {res.orientation === 'rotated' && (
                                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm ring-2 ring-white"></div>
                                 )}
                               </>
                             ) : (
                               <span className="text-[9px] text-red-400 font-medium mt-1 flex items-center gap-1"><Ban className="w-3 h-3"/> No</span>
                             )}
                          </div>
                        );
                     })}
                  </div>
                )}
             </div>
           );
        })}
        {sortedItems.length === 0 && (
           <div className="p-12 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Sin resultados</p>
           </div>
        )}
      </div>

      {/* === DESKTOP TABLE === */}
      <div className="hidden md:block overflow-auto flex-1 w-full relative bg-white scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white sticky top-0 z-10 shadow-sm">
            <tr>
              <th 
                onClick={() => handleSort('dimensions')}
                className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b sticky left-0 bg-white z-20 cursor-pointer hover:bg-slate-50 transition group min-w-[160px]"
              >
                <div className="flex items-center justify-between gap-1">
                  Especificaciones
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === 'dimensions' ? 'text-indigo-600' : 'text-slate-200'}`} />
                </div>
              </th>
              {visibleWidths.map(fw => (
                <th 
                  key={fw} 
                  onClick={() => handleSort(fw)}
                  className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b min-w-[110px] text-center border-l border-slate-100 cursor-pointer hover:bg-slate-50 transition"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Tela {fw}</span>
                    {sortConfig?.key === fw && (
                       <span className="text-indigo-600 font-bold text-[9px]">{sortConfig.direction === 'asc' ? '↓ Menor' : '↑ Mayor'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="p-3 sticky left-0 bg-white group-hover:bg-slate-50/80 font-medium text-slate-700 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200">
                       {item.id.split('-').pop()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{item.width} x {item.height}</span>
                      {item.originalRow && Object.keys(item.originalRow).find(k => !['width','height','ancho','alto'].includes(k.toLowerCase())) && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                          {String(Object.values(item.originalRow)[0] || '')}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                {visibleWidths.map(fw => {
                    const res = item.results[fw];
                    
                    return (
                        <td 
                          key={fw} 
                          onClick={() => res.isValid && setSelectedCell({ item, fabricWidth: fw, result: res })}
                          className={`p-2 text-center border-r border-slate-50 relative transition-all ${
                            !res.isValid 
                              ? 'bg-slate-50/50' 
                              : 'cursor-pointer hover:bg-indigo-50/40 active:bg-indigo-100/50'
                          }`}
                        >
                            {res.isValid ? (
                                <div className="flex flex-col items-center relative">
                                    <span className="font-black text-slate-700 text-sm">{res.consumoM.toFixed(3)}</span>
                                    <span className="text-[10px] text-slate-400">{res.placasPorFila} pl/fila</span>
                                    {res.orientation === 'rotated' && (
                                      <div className="absolute top-0 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" title="Girado"></div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-300 font-medium flex justify-center items-center">
                                  -
                                </span>
                            )}
                        </td>
                    );
                })}
              </tr>
            ))}
            {sortedItems.length === 0 && (
              <tr>
                <td colSpan={visibleWidths.length + 1} className="p-12 text-center text-slate-400">
                   <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                   <p>No hay resultados para los filtros actuales</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="p-3 bg-white border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center">
        <span>Mostrando {visibleWidths.length} anchos de tela</span>
        <span className="hidden md:inline flex items-center gap-1"><Check className="w-3 h-3"/> Sistema en línea</span>
      </div>
    </div>
  );
};