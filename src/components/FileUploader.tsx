import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface FileUploaderProps {
  onFileSelected: (base64: string, mimeType: string, name: string, size: string) => void;
  isLoading: boolean;
  error: string | null;
}

export default function FileUploader({ onFileSelected, isLoading, error }: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = (file: File) => {
    if (!file) return;

    // Allowed mimetypes: Web-friendly images or PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no soportado. Por favor suba imágenes (JPG, PNG, WEBP) o documentos PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part
      const base64Data = result.split(',')[1];
      const fileSizeString = formatFileSize(file.size);
      onFileSelected(base64Data, file.type, file.name, fileSizeString);
    };
    reader.onerror = () => {
      console.error('Error al leer el archivo');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div id="file-uploader-container" className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 id="uploader-title" className="font-sans font-medium text-lg text-gray-800 mb-2">
        Subir Documento para Digitalizar
      </h2>
      <p id="uploader-desc" className="text-sm text-gray-500 mb-6">
        Soporta fotos, capturas de pantalla, imágenes o archivos PDF (facturas, notas, etc.)
      </p>

      {/* Hidden inputs */}
      <input
        id="file-input-hidden"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />
      
      {/* Hidden input strictly for camera capture */}
      <input
        id="camera-input-hidden"
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />

      <div
        id="uploader-drop-zone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`w-full py-10 px-4 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${
          isDragActive 
            ? 'border-red-brand bg-red-brand/[0.03]' 
            : 'border-slate-200 hover:border-red-brand/40 hover:bg-slate-50/50'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <div id="upload-icon-wrapper" className="p-3 bg-red-brand/10 rounded-full text-red-brand mb-4">
          <Upload className="w-6 h-6" />
        </div>
        
        <p id="upload-action-text" className="font-sans font-medium text-sm text-slate-700 text-center mb-1">
          Arrastra y suelta tu archivo aquí, o <span className="text-red-brand font-semibold hover:underline">busca en tu equipo</span>
        </p>
        <p id="upload-formats-info" className="text-xs text-slate-400 text-center">
          PDF, JPG, PNG o WEBP de hasta 15MB
        </p>
      </div>

      <div id="uploader-actions-divider" className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-slate-100"></div>
        <span className="flex-shrink mx-4 text-xs text-slate-400 font-bold uppercase tracking-wider">O TAMBIÉN</span>
        <div className="flex-grow border-t border-slate-100"></div>
      </div>

      <div id="uploader-alternative-buttons" className="grid grid-cols-2 gap-4">
        <button
          id="btn-uploader-file"
          type="button"
          onClick={triggerFileSelect}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 py-3 px-4 border border-slate-200 hover:border-slate-300 rounded-lg text-xs text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Seleccionar Archivo</span>
        </button>

        <button
          id="btn-uploader-camera"
          type="button"
          onClick={triggerCamera}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 py-3 px-4 bg-red-brand hover:bg-red-brand-hover rounded-lg text-xs text-white font-bold shadow-sm transition-all disabled:opacity-55"
        >
          <Camera className="w-4 h-4" />
          <span>Tomar Foto (Cámara)</span>
        </button>
      </div>

      {isLoading && (
        <motion.div
          id="uploader-loader-indicator"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-brand/[0.03] rounded-lg border border-red-brand/10 flex items-center space-x-3 text-red-brand"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold text-sm">Procesando y digitalizando...</p>
            <p className="text-xs text-slate-500 truncate">El modelo Gemini está leyendo el archivo y estructurando los datos.</p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          id="uploader-error-indicator"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3 text-red-700"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-sans font-medium text-sm">Ocurrió un inconveniente</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
