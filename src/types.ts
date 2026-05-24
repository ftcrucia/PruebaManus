export type DocumentType = 
  | 'factura' 
  | 'remito' 
  | 'nota' 
  | 'presupuesto' 
  | 'informe' 
  | 'recibo' 
  | 'planilla' 
  | 'otro';

export interface ExtractedData {
  plainText: string;
  jsonData: string; // JSON string
  csvData: string;
}

export interface DigitalizedDocument {
  id: string;
  name: string;
  type: DocumentType;
  confidence: number;
  language: string;
  summary: string;
  extractedData: ExtractedData;
  timestamp: string;
  fileSize: string;
  fileMime: string;
  filePreview?: string; // base64 representation of file or path
}
