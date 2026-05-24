import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Menu, 
  X, 
  Trash2, 
  Sparkles, 
  FileText, 
  Receipt, 
  FileSpreadsheet, 
  CreditCard, 
  Truck, 
  FileSignature, 
  File,
  History,
  FolderOpen,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DigitalizedDocument, DocumentType } from './types';
import { mockDocs } from './mockData';
import FileUploader from './components/FileUploader';
import DocumentPreview from './components/DocumentPreview';
import DigitalizationView from './components/DigitalizationView';

// Helper to get visual icons for document classes
export const getDocumentIcon = (type: DocumentType) => {
  switch (type) {
    case 'factura':
      return <CreditCard className="w-4 h-4" />;
    case 'remito':
      return <Truck className="w-4 h-4" />;
    case 'nota':
      return <FileText className="w-4 h-4" />;
    case 'presupuesto':
      return <FileSignature className="w-4 h-4" />;
    case 'informe':
      return <FileText className="w-4 h-4" />;
    case 'recibo':
      return <Receipt className="w-4 h-4" />;
    case 'planilla':
      return <FileSpreadsheet className="w-4 h-4" />;
    default:
      return <File className="w-4 h-4" />;
  }
};

export default function App() {
  const [history, setHistory] = useState<DigitalizedDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [loadStep, setLoadStep] = useState<number>(0);

  // Initialize history and active document selection from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('digitalizer_history_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          
          // Get saved active doc ID if available
          const savedActiveId = localStorage.getItem('digitalizer_active_doc_id');
          if (savedActiveId && parsed.some(d => d.id === savedActiveId)) {
            setActiveDocId(savedActiveId);
          } else {
            setActiveDocId(parsed[0].id);
          }
          return;
        }
      } catch (e) {
        console.error('Error parsing stored history:', e);
      }
    }
    // Fallback to mockDocs if nothing is in local storage
    setHistory(mockDocs);
    if (mockDocs.length > 0) {
      setHistory(mockDocs);
      // Save it immediately so it persists automatically from the start 
      localStorage.setItem('digitalizer_history_v1', JSON.stringify(mockDocs));
      setActiveDocId(mockDocs[0].id);
    }
  }, []);

  // Update active selected document and cache in localStorage
  const selectActiveDoc = (id: string | null) => {
    setActiveDocId(id);
    if (id) {
      localStorage.setItem('digitalizer_active_doc_id', id);
    } else {
      localStorage.removeItem('digitalizer_active_doc_id');
    }
  };

  // Save history to localStorage on change
  const saveHistory = (newHistory: DigitalizedDocument[]) => {
    setHistory(newHistory);
    localStorage.setItem('digitalizer_history_v1', JSON.stringify(newHistory));
  };

  // Cycling helpful messages during loading transitions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isUploading) {
      setLoadStep(0);
      interval = setInterval(() => {
        setLoadStep(prev => (prev + 1) % 4);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const activeDoc = history.find(doc => doc.id === activeDocId) || null;

  const handleFileSelected = async (base64: string, mimeType: string, name: string, size: string) => {
    setIsUploading(true);
    setError(null);
    setLoadStep(0);

    try {
      const response = await fetch('/api/digitalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: base64,
          mimeType,
          fileName: name,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Error del servidor (${response.status})`);
      }

      const extracted = await response.json();

      const newDoc: DigitalizedDocument = {
        id: `doc-${Date.now()}`,
        name,
        type: extracted.documentType || 'otro',
        confidence: extracted.documentTypeConfidence || 0.9,
        language: extracted.language || 'es',
        summary: extracted.summary || 'Documento digitalizado con éxito.',
        extractedData: {
          plainText: extracted.extractedData?.plainText || '# Sin contenido',
          jsonData: extracted.extractedData?.jsonData || '{}',
          csvData: extracted.extractedData?.csvData || 'Col,Valor\nSin tabular,Disponible en plainText',
        },
        timestamp: new Date().toISOString(),
        fileSize: size,
        fileMime: mimeType,
        filePreview: base64, // Keep base64 locally in state for rendering!
      };

      const updatedHistory = [newDoc, ...history];
      saveHistory(updatedHistory);
      selectActiveDoc(newDoc.id);
      setIsSidebarOpen(false); // Close mobile sidebar
    } catch (err: any) {
      console.error('Error al digitalizar el archivo:', err);
      setError(err.message || 'Ocurrió un error desconocido al subir y analizar el documento.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('¿Está seguro de que desea eliminar este documento digitalizado de su historial local?');
    if (!confirmed) return;

    const filtered = history.filter(doc => doc.id !== id);
    saveHistory(filtered);
    
    if (activeDocId === id) {
      selectActiveDoc(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleStartNewUpload = () => {
    selectActiveDoc(null);
    setError(null);
    setIsSidebarOpen(false);
  };

  // Loading statements
  const loadingStatements = [
    'Subiendo archivo de forma segura...',
    'Estructurando textos y reconociendo caracteres con Gemini 3.1 Flash Lite...',
    'Esquematizando tablas de datos y generando archivo CSV...',
    'Finalizando codificación JSON y estructuración semántica...'
  ];

  return (
    <div id="main-app-container" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Banner Header */}
      <header id="app-top-navbar" className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            id="mobile-menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-150 rounded-lg text-slate-600 md:hidden"
            title="Abrir menú"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div id="brand-logo-panel" className="flex items-center space-x-2">
            <div className="p-2 bg-red-brand rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-sans font-black text-slate-900 text-sm tracking-tight leading-none sm:text-base">
                Digitalizador de Archivos
              </h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Gemini 3.1 Flash Lite v4.2</span>
            </div>
          </div>
        </div>

        <button
          id="btn-nav-upload-new"
          onClick={handleStartNewUpload}
          className="flex items-center space-x-1.5 py-2 px-3.5 bg-red-brand hover:bg-red-brand-hover text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Digitalizar Nuevo Objeto</span>
        </button>
      </header>

      {/* Main Responsive Split Layout */}
      <div id="app-split-content" className="flex-1 flex relative overflow-hidden">
        
        {/* Sidebar Panel of Past Extractions (History) */}
        <aside
          id="app-history-sidebar"
          className={`w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full absolute md:relative z-30 transition-transform duration-300 text-slate-400 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
          style={{ height: 'calc(100vh - 73px)' }}
        >
          <div id="sidebar-header" className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-300">
              <History className="w-4 h-4 text-red-brand" />
              <span className="font-sans text-xs font-bold uppercase tracking-wider">Historial Local</span>
            </div>
            <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          </div>

          <div id="sidebar-list-container" className="flex-1 overflow-y-auto p-4 space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-10 px-4">
                <FolderOpen className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No hay documentos digitalizados.</p>
                <p className="text-[10px] text-slate-600 mt-1">Sube un archivo para comenzar.</p>
              </div>
            ) : (
              history.map(doc => {
                const isActive = doc.id === activeDocId;
                return (
                  <div
                    id={`sidebar-item-${doc.id}`}
                    key={doc.id}
                    onClick={() => {
                      selectActiveDoc(doc.id);
                      setIsSidebarOpen(false); // Close mobile panel
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer group flex items-start justify-between ${
                      isActive
                        ? 'bg-slate-800 border-slate-700 text-white shadow-xs'
                        : 'bg-transparent border-transparent hover:border-slate-800 hover:bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                      <div className={`p-1.5 rounded mt-0.5 ${isActive ? 'bg-red-brand text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {getDocumentIcon(doc.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans font-semibold text-xs leading-snug truncate">
                          {doc.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[9px] font-mono bg-slate-950/45 px-1 py-0.2 border border-slate-800 rounded text-slate-450 uppercase font-bold">
                            {doc.type}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(doc.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      id={`btn-delete-${doc.id}`}
                      onClick={(e) => handleDeleteDoc(doc.id, e)}
                      className="p-1 hover:bg-slate-700/80 text-slate-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Vercel App Tip Footer inside Sidebar */}
          <div id="sidebar-footer-tip" className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-start space-x-2">
            <Info className="w-3.5 h-3.5 text-red-brand flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-normal">
              Esta app guarda tus documentos <b>únicamente en tu navegador</b> para respetar tu privacidad. Puedes exportar o descargar en texto, JSON y CSV cuando desees.
            </p>
          </div>
        </aside>

        {/* Sidebar Overlay on mobile */}
        {isSidebarOpen && (
          <div
            id="mobile-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            style={{ top: '73px' }}
          ></div>
        )}

        {/* Main Central Workspace */}
        <main id="app-main-workspace" className="flex-1 p-6 overflow-y-auto" style={{ height: 'calc(100vh - 73px)' }}>
          <AnimatePresence mode="wait">
            
            {/* Case: Active Upload Loader State */}
            {isUploading && (
              <motion.div
                id="workspace-loader-state"
                key="loader-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto my-12 text-center py-12 px-6 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center justify-center"
              >
                <div className="relative flex items-center justify-center p-6 bg-red-brand/10 rounded-full text-red-brand mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-red-brand/20 border-t-red-brand animate-spin"></div>
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>

                <h3 className="font-sans font-black text-lg text-slate-800 mb-1">
                  Digitalizando Documento
                </h3>
                
                {/* Cyclical Statement */}
                <motion.p
                  key={loadStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm text-red-brand font-bold h-6 mt-2"
                >
                  {loadingStatements[loadStep]}
                </motion.p>

                <p className="text-xs text-slate-400 max-w-sm mt-4 leading-normal">
                  La API multimodal Gemini 3.1 Flash Lite están analizando la imagen u hoja de PDF para transcribirla, estructurarla conceptualmente en JSON y resumir sus tablas como CSV. Esto toma unos segundos.
                </p>
              </motion.div>
            )}

            {/* Case: No Document Loaded & Not Uploading (Uploader Dashboard) */}
            {!isUploading && activeDocId === null && (
              <motion.div
                id="workspace-picker-state"
                key="picker-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-xl mx-auto my-6"
              >
                <FileUploader 
                  onFileSelected={handleFileSelected} 
                  isLoading={isUploading} 
                  error={error} 
                />
              </motion.div>
            )}

            {/* Case: Document Selected & Finished Processing */}
            {!isUploading && activeDocId !== null && activeDoc && (
              <motion.div
                id="workspace-results-state"
                key={`results-${activeDoc.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-6"
              >
                {/* Column 1: Document View & Quick Info (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <DocumentPreview
                    fileName={activeDoc.name}
                    fileMime={activeDoc.fileMime}
                    fileSize={activeDoc.fileSize}
                    fileBase64={activeDoc.filePreview}
                  />

                  {/* Document Quick Metadata Stats */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 text-xs space-y-3.5">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Detalles de Extracción</p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Idioma</span>
                        <p className="font-bold text-slate-700 capitalize mt-0.5">{activeDoc.language === 'es' ? 'Español' : activeDoc.language}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Clasificación</span>
                        <p className="font-bold text-slate-700 capitalize mt-0.5">{activeDoc.type}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Extracted 3 States Tabs Viewer (8 cols) */}
                <div className="lg:col-span-8">
                  <DigitalizationView document={activeDoc} />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}
