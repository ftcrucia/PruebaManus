import React from 'react';
import { Eye, FileText, FileImage, Layers } from 'lucide-react';

interface DocumentPreviewProps {
  fileName: string;
  fileMime: string;
  fileSize: string;
  fileBase64?: string;
}

export default function DocumentPreview({ fileName, fileMime, fileSize, fileBase64 }: DocumentPreviewProps) {
  const isPdf = fileMime === 'application/pdf';
  const isImage = fileMime.startsWith('image/');
  
  // Reconstruct data URL for local display
  const fileDataUrl = fileBase64 ? `data:${fileMime};base64,${fileBase64}` : '';

  return (
    <div id="document-preview-container" className="w-full bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col h-full min-h-[300px]">
      <div id="preview-header-section" className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-red-brand" />
          <h3 className="font-sans font-bold text-slate-800">Vista del Archivo</h3>
        </div>
        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
          {fileSize}
        </span>
      </div>

      <div id="preview-content-area" className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 rounded-lg border border-slate-200 p-4 overflow-hidden relative">
        {isImage && fileDataUrl ? (
          <div id="preview-image-wrapper" className="w-full h-full flex items-center justify-center max-h-[400px]">
            <img
              id="preview-img-element"
              src={fileDataUrl}
              alt={fileName}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain rounded shadow-xs"
            />
          </div>
        ) : isPdf && fileDataUrl ? (
          <div id="preview-pdf-wrapper" className="w-full h-full flex flex-col items-center justify-center py-8">
            <div className="p-4 bg-red-brand/10 text-red-brand rounded-2xl mb-4">
              <FileText className="w-12 h-12" />
            </div>
            <p className="font-sans font-bold text-sm text-slate-800 text-center px-4 max-w-xs truncate">
              {fileName}
            </p>
            <p className="text-xs text-slate-400 mt-1">Archivo de documento PDF</p>
            <div className="mt-5 w-full max-w-xs border border-red-brand/10 bg-red-brand/[0.02] rounded-lg p-3 text-center">
              <p className="text-xs text-red-brand leading-normal">
                Gemini está analizando este archivo PDF directamente de forma multimodal página por página.
              </p>
            </div>
          </div>
        ) : (
          <div id="preview-fallback-wrapper" className="flex flex-col items-center justify-center py-10">
            <Layers className="w-10 h-10 text-gray-300 mb-3 animate-pulse" />
            <p className="text-sm font-sans font-medium text-gray-500 text-center">
              No hay un archivo visible seleccionado
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Suba una foto o un PDF para verlo en esta sección.
            </p>
          </div>
        )}
      </div>

      <div id="preview-footer-metadata" className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
        <span className="truncate max-w-[200px]">{fileName || 'Sin archivo'}</span>
        <span className="capitalize">{fileMime ? fileMime.split('/')[1] : ''}</span>
      </div>
    </div>
  );
}
