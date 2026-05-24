import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Code, 
  Database, 
  Copy, 
  Check, 
  Download, 
  AlertCircle, 
  Layers, 
  Columns, 
  Minimize2, 
  Maximize2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { DigitalizedDocument } from '../types';

interface DigitalizationViewProps {
  document: DigitalizedDocument;
}

export default function DigitalizationView({ document }: DigitalizationViewProps) {
  // Read and persist viewMode ('tabs' | 'side-by-side')
  const [viewMode, setViewMode] = useState<'tabs' | 'side-by-side'>(() => {
    return (localStorage.getItem('digit_view_mode') as 'tabs' | 'side-by-side') || 'tabs';
  });

  // Read and persist collapsed state for the 3 columns in side-by-side layout
  const [collapsed, setCollapsed] = useState<{ plain: boolean; json: boolean; csv: boolean }>(() => {
    try {
      const saved = localStorage.getItem('digit_collapsed_panels');
      return saved ? JSON.parse(saved) : { plain: false, json: false, csv: false };
    } catch {
      return { plain: false, json: false, csv: false };
    }
  });

  const [activeTab, setActiveTab] = useState<'plain' | 'json' | 'csv'>('plain');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const { type, confidence, language, summary, extractedData, timestamp, name } = document;
  const { plainText, jsonData, csvData } = extractedData;

  // Persist view mode changes
  useEffect(() => {
    localStorage.setItem('digit_view_mode', viewMode);
  }, [viewMode]);

  // Persist collapsed columns additions
  useEffect(() => {
    localStorage.setItem('digit_collapsed_panels', JSON.stringify(collapsed));
  }, [collapsed]);

  // Try to beautify JSON string
  let formattedJson = '';
  try {
    const parsed = JSON.parse(jsonData);
    formattedJson = JSON.stringify(parsed, null, 2);
  } catch (e) {
    formattedJson = jsonData;
  }

  // Helper to copy content to clipboard
  const handleCopy = (content: string, section: string) => {
    navigator.clipboard.writeText(content);
    setCopiedSection(section);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  // Helper to trigger custom downloads
  const handleDownload = (content: string, ext: string, mime: string, label: string) => {
    const cleanName = name.split('.')[0] || 'documento';
    const finalFileName = `${cleanName}_${label}.${ext}`;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = finalFileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Safe CSV parser to render a beautiful preview table
  const parseCSV = (csv: string) => {
    if (!csv) return { headers: [], rows: [] };
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => parseLine(line));
    return { headers, rows };
  };

  const tableData = parseCSV(csvData);

  const toggleCollapse = (panel: 'plain' | 'json' | 'csv') => {
    setCollapsed(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  // Check how many panels are active/expanded to determine responsive grid column count
  const expandedCount = Object.values(collapsed).filter(v => !v).length;

  return (
    <div id="digit-view-parent" className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Document Classification Header */}
      <div id="digit-meta-header" className="p-6 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-red-brand/10 text-red-brand border border-red-brand/20">
                {type}
              </span>
              <span className="text-xs text-slate-505 font-medium">
                Procesado el {new Date(timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 id="digit-doc-title" className="font-sans font-semibold text-lg text-slate-800 mt-2">
              Resultados de Digitalización: <span className="text-slate-950 font-bold">{name}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confianza IA</p>
              <p className="text-sm font-black text-slate-900 font-mono">{(confidence * 100).toFixed(0)}%</p>
            </div>
            <div className="w-2 h-8 rounded-full bg-slate-100 overflow-hidden relative">
              <div 
                className="absolute bottom-0 left-0 right-0 rounded-full bg-red-brand transition-all duration-500"
                style={{ height: `${confidence * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {summary && (
          <div id="digit-summary" className="mt-4 p-3.5 bg-red-brand/[0.02] border border-red-brand/10 rounded-lg flex items-start space-x-2.5">
            <span className="text-xs font-bold text-red-brand uppercase mt-0.5 whitespace-nowrap">Resumen:</span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">{summary}</p>
          </div>
        )}
      </div>

      {/* Control View Switcher Bar (Tabs vs Columns) */}
      <div className="px-6 py-3.5 bg-slate-100/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Formato de Visualización</span>
        
        <div className="flex p-0.5 bg-slate-200/80 rounded-lg border border-slate-300/40">
          <button
            onClick={() => setViewMode('tabs')}
            className={`flex items-center space-x-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all duration-150 ${
              viewMode === 'tabs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-550 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pestañas Individuales</span>
          </button>
          
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center space-x-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all duration-150 ${
              viewMode === 'side-by-side'
                ? 'bg-red-brand text-white shadow-xs'
                : 'text-slate-550 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Lado a Lado (3 Columnas)</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW 1: ACTIVE TAB VIEW */}
      {viewMode === 'tabs' && (
        <div className="flex flex-col flex-1">
          {/* Tabs Menu Selection */}
          <div id="digit-tabs-menu" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
            <div className="flex bg-slate-150 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
              <button
                id="tab-btn-plain"
                onClick={() => setActiveTab('plain')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 py-2 px-4 text-xs font-bold rounded-lg transition-all duration-150 ${
                  activeTab === 'plain'
                    ? 'bg-red-brand text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Texto Plano (MD)</span>
              </button>

              <button
                id="tab-btn-json"
                onClick={() => setActiveTab('json')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 py-2 px-4 text-xs font-bold rounded-lg transition-all duration-150 ${
                  activeTab === 'json'
                    ? 'bg-red-brand text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>

              <button
                id="tab-btn-csv"
                onClick={() => setActiveTab('csv')}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 py-2 px-4 text-xs font-bold rounded-lg transition-all duration-150 ${
                  activeTab === 'csv'
                    ? 'bg-red-brand text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>CSV / Tabla</span>
              </button>
            </div>

            {/* Global Actions */}
            <div id="tab-action-buttons" className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  const content = activeTab === 'plain' ? plainText : activeTab === 'json' ? formattedJson : csvData;
                  handleCopy(content, activeTab);
                }}
                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors flex items-center space-x-1.5 text-xs font-semibold hover:bg-slate-100"
                title="Copiar contenido"
              >
                {copiedSection === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 text-[10px] uppercase font-bold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const content = activeTab === 'plain' ? plainText : activeTab === 'json' ? formattedJson : csvData;
                  const format = activeTab === 'plain' ? 'md' : activeTab === 'json' ? 'json' : 'csv';
                  const mime = activeTab === 'plain' ? 'text/markdown' : activeTab === 'json' ? 'application/json' : 'text/csv';
                  handleDownload(content, format, mime, activeTab);
                }}
                className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors flex items-center space-x-1.5 text-xs font-semibold hover:bg-slate-100"
                title="Descargar archivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>

          {/* Current single tab viewport */}
          <div id="digital-tab-content" className="flex-1 p-6 overflow-y-auto max-h-[600px] min-h-[350px] bg-slate-50/20">
            <AnimatePresence mode="wait">
              {activeTab === 'plain' && (
                <motion.div
                  key="tab-plain-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="prose prose-sm max-w-none text-slate-800 text-sm leading-relaxed"
                >
                  <div className="markdown-body font-normal space-y-3">
                    <Markdown>{plainText}</Markdown>
                  </div>
                </motion.div>
              )}

              {activeTab === 'json' && (
                <motion.div
                  key="tab-json-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <pre className="font-mono text-xs bg-slate-900 text-slate-100 p-5 rounded-lg overflow-x-auto shadow-inner leading-normal border border-slate-800">
                    <code className="text-red-300">{formattedJson}</code>
                  </pre>
                </motion.div>
              )}

              {activeTab === 'csv' && (
                <motion.div
                  key="tab-csv-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  {tableData.headers.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200">
                              {tableData.headers.map((header, idx) => (
                                <th key={`tab-csv-h-${idx}`} className="p-3 text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tableData.rows.map((row, rowIdx) => (
                              <tr key={`tab-csv-r-${rowIdx}`} className="hover:bg-slate-50/50 transition-colors">
                                {row.map((cell, cellIdx) => (
                                  <td key={`tab-csv-c-${rowIdx}-${cellIdx}`} className="p-3 text-sm text-slate-600 leading-normal">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg bg-white">
                      <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600">Sin datos de tabla estructurada disponibles</p>
                      <p className="text-xs text-slate-400 mt-1">
                        No se detectó un formato tabular estricto en este documento. Prueba a revisar el texto plano o la vista de datos cruda.
                      </p>
                    </div>
                  )}

                  {/* Raw CSV preview */}
                  <div className="space-y-1.5 mt-6">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CSV Crudo (Separado por comas)</label>
                    <pre className="font-mono text-[11px] bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto border border-slate-800 shadow-inner">
                      <code>{csvData}</code>
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* RENDER VIEW 2: MULTI-COLUMNS SIDE-BY-SIDE VIEW */}
      {viewMode === 'side-by-side' && (
        <div className="flex-1 p-6 bg-slate-50/50 min-h-[450px]">
          <div className="flex flex-col lg:flex-row gap-4 h-full items-stretch">
            
            {/* COLUMN 1: PLAIN TEXT (MARKDOWN) */}
            {collapsed.plain ? (
              <div 
                onClick={() => toggleCollapse('plain')}
                className="flex lg:flex-col items-center justify-between lg:justify-start lg:py-6 p-3 bg-white h-auto lg:w-14 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all text-slate-500 group flex-shrink-0"
                title="Expandir Texto Plano"
              >
                <div className="flex items-center space-x-2 lg:space-x-0 lg:flex-col lg:space-y-4">
                  <FileText className="w-5 h-5 text-red-brand" />
                  <span className="text-xs font-bold font-mono tracking-wider uppercase lg:[writing-mode:vertical-lr] lg:rotate-180">
                    Texto Plano (Min)
                  </span>
                </div>
                <Maximize2 className="w-4 h-4 mt-auto text-slate-400 group-hover:text-red-brand" />
              </div>
            ) : (
              <div className="flex-1 min-w-[280px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-250 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-red-brand" />
                    <span className="text-xs font-bold text-slate-700">Texto Plano (Markdown)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button 
                      onClick={() => handleCopy(plainText, 'col-plain')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Copiar texto"
                    >
                      {copiedSection === 'col-plain' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={() => handleDownload(plainText, 'md', 'text/markdown', 'texto')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Descargar MD"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => toggleCollapse('plain')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Contraer columna"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[500px] text-xs leading-relaxed text-slate-700 prose prose-sm max-w-none">
                  <div className="markdown-body">
                    <Markdown>{plainText}</Markdown>
                  </div>
                </div>
              </div>
            )}

            {/* COLUMN 2: JSON ESTRUCTURADO */}
            {collapsed.json ? (
              <div 
                onClick={() => toggleCollapse('json')}
                className="flex lg:flex-col items-center justify-between lg:justify-start lg:py-6 p-3 bg-white h-auto lg:w-14 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all text-slate-500 group flex-shrink-0"
                title="Expandir JSON"
              >
                <div className="flex items-center space-x-2 lg:space-x-0 lg:flex-col lg:space-y-4">
                  <Code className="w-5 h-5 text-red-brand" />
                  <span className="text-xs font-bold font-mono tracking-wider uppercase lg:[writing-mode:vertical-lr] lg:rotate-180">
                    JSON Estructurado (Min)
                  </span>
                </div>
                <Maximize2 className="w-4 h-4 mt-auto text-slate-400 group-hover:text-red-brand" />
              </div>
            ) : (
              <div className="flex-1 min-w-[280px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-250 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4 text-red-brand" />
                    <span className="text-xs font-bold text-slate-700">JSON Estructurado</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button 
                      onClick={() => handleCopy(formattedJson, 'col-json')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Copiar JSON"
                    >
                      {copiedSection === 'col-json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={() => handleDownload(formattedJson, 'json', 'application/json', 'datos')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Descargar JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => toggleCollapse('json')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Contraer columna"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[500px] bg-slate-900 text-[11px] font-mono leading-relaxed h-full">
                  <pre className="text-red-200 whitespace-pre-wrap word-break-all">
                    <code>{formattedJson}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* COLUMN 3: CSV / TABLA */}
            {collapsed.csv ? (
              <div 
                onClick={() => toggleCollapse('csv')}
                className="flex lg:flex-col items-center justify-between lg:justify-start lg:py-6 p-3 bg-white h-auto lg:w-14 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-all text-slate-500 group flex-shrink-0"
                title="Expandir CSV"
              >
                <div className="flex items-center space-x-2 lg:space-x-0 lg:flex-col lg:space-y-4">
                  <Database className="w-5 h-5 text-red-brand" />
                  <span className="text-xs font-bold font-mono tracking-wider uppercase lg:[writing-mode:vertical-lr] lg:rotate-180">
                    Tabla CSV (Min)
                  </span>
                </div>
                <Maximize2 className="w-4 h-4 mt-auto text-slate-400 group-hover:text-red-brand" />
              </div>
            ) : (
              <div className="flex-1 min-w-[280px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col transition-all overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-250 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-red-brand" />
                    <span className="text-xs font-bold text-slate-700">Tabla / CSV</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button 
                      onClick={() => handleCopy(csvData, 'col-csv')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Copiar CSV"
                    >
                      {copiedSection === 'col-csv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={() => handleDownload(csvData, 'csv', 'text/csv', 'tabla')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Descargar CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => toggleCollapse('csv')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                      title="Contraer columna"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 overflow-y-auto max-h-[500px] flex-1 space-y-3">
                  {tableData.headers.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white max-w-full">
                      <table className="w-full text-left text-[11px] border-collapse min-w-full">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 font-bold sticky top-0 text-slate-700 font-sans">
                            {tableData.headers.map((header, idx) => (
                              <th key={`grid-csv-h-${idx}`} className="p-2 truncate whitespace-nowrap">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {tableData.rows.map((row, rowIdx) => (
                            <tr key={`grid-csv-r-${rowIdx}`} className="hover:bg-slate-50/50">
                              {row.map((cell, cellIdx) => (
                                <td key={`grid-csv-c-${rowIdx}-${cellIdx}`} className="p-2 text-slate-600 truncate max-w-[120px]" title={cell}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-4 border border-slate-150 rounded bg-slate-50">
                      <p className="text-[10px] text-slate-500 font-medium">Sin tabla de datos lineal.</p>
                    </div>
                  )}

                  {/* Raw Text Box */}
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Texto CSV Crudo</label>
                    <pre className="mt-1 font-mono text-[10px] bg-slate-900 text-emerald-300 p-2.5 rounded overflow-x-auto max-h-[140px] leading-tight">
                      <code>{csvData}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Quick restore banner context helper if everything is collapsed */}
          {expandedCount === 0 && (
            <div className="mt-4 p-4 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-500">
              <p className="text-sm font-semibold">Todas las columnas están colapsadas.</p>
              <button 
                onClick={() => setCollapsed({ plain: false, json: false, csv: false })}
                className="mt-2 text-xs font-bold text-red-brand hover:underline"
              >
                Restaurar y mostrar las 3 columnas
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
