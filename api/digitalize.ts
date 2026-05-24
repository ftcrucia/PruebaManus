import { GoogleGenAI, Type } from "@google/genai";

// Lazy-initialization of the Gemini API Client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurado. Asegurese de establecerlo en la configuracion de Secretos.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  // CORS Headers for serverless environment compatibility
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Solo se permite el metodo POST" });
  }

  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ error: "Faltan los datos del archivo en base64 o el tipo MIME" });
    }

    const ai = getAiClient();

    // Prepare content parts
    const filePart = {
      inlineData: {
        mimeType,
        data: fileBase64,
      },
    };

    const promptText = `
Eres un digitalizador experto de documentos para el mercado hispanohablante.
Analiza el archivo provisto (que puede ser una factura, remito, nota, presupuesto, informe, recibo, planilla de Excel escaneada, etc.) y realiza una extracción completa y detallada en español.

Debes extraer la información para retornar una respuesta exactamente estructurada en el esquema JSON solicitado:
1. Identifica el tipo de documento ('factura', 'remito', 'nota', 'presupuesto', 'informe', 'recibo', 'planilla', o 'otro').
2. Determina el idioma (debería ser español).
3. Genera un resumen ejecutivo breve de 1 o 2 oraciones en español.
4. Genera tres representaciones del documento digitalizado:
   - 'plainText': El contenido completo del documento estructurado en Markdown elegante y limpio. Si hay tablas, represéntalas con formato de tabla Markdown. Debe conservar todos los detalles (emisor, destinatario, listas, totales, anotaciones, etc.).
   - 'jsonData': Un string que sea un JSON válido y bien formateado que represente la totalidad de la información estructurada del documento de manera jerárquica (con datos del emisor, receptor, fechas, un listado de ítems/artículos si los hay, subtotales, impuestos y totales). Todo con nombres de propiedades descriptivos en español.
   - 'csvData': El contenido tabular o lista de ítems del documento formateado como un string CSV clásico. Usa coma (,) para separar valores, y encierra los textos que tengan espacios o caracteres especiales en comillas dobles ("). Si el documento no tiene formato de tabla estricto, genera una tabla CSV con los campos clave encontrados organizados en filas (ej. 'Campo,Valor').

Asegúrate de que la extracción sea extremadamente precisa y profesional. No inventes datos. Si un campo no es legible o no existe, omítelo o no asumas ningún valor.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [filePart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: {
              type: Type.STRING,
              description: "Tipo de documento detectado en minusculas, ej: 'factura', 'remito', 'nota', 'presupuesto', 'informe', 'recibo', 'planilla', 'otro'."
            },
            documentTypeConfidence: {
              type: Type.NUMBER,
              description: "Confianza del modelo en la clasificacion del documento (de 0 a 1)."
            },
            language: {
              type: Type.STRING,
              description: "Idioma principal detectado."
            },
            summary: {
              type: Type.STRING,
              description: "Resumen ejecutivo corto en espanol de 1 o 2 oraciones sobre el contenido del documento."
            },
            extractedData: {
              type: Type.OBJECT,
              properties: {
                plainText: {
                  type: Type.STRING,
                  description: "Digitalizacion completa en Markdown limpio con tablas elegantes si corresponde."
                },
                jsonData: {
                  type: Type.STRING,
                  description: "JSON stringificado ordenado y completo del documento en espanol con todos los valores extraidos."
                },
                csvData: {
                  type: Type.STRING,
                  description: "String CSV estandar (con cabecera y filas) de los items, filas, o de las claves y valores del documento."
                }
              },
              required: ["plainText", "jsonData", "csvData"]
            }
          },
          required: ["documentType", "documentTypeConfidence", "language", "summary", "extractedData"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No se recibio respuesta textual del modelo");
    }

    try {
      const parsedResult = JSON.parse(response.text.trim());
      return res.status(200).json(parsedResult);
    } catch (parseError: any) {
      console.error("Error parsing Gemini response json:", parseError, response.text);
      // Fallback: If parse fails, return the raw response text so the client can try to recover
      return res.status(200).json({
        documentType: "otro",
        documentTypeConfidence: 0.5,
        language: "es",
        summary: "Error al parsear el JSON estructurado del modelo, se provee la respuesta cruda.",
        extractedData: {
          plainText: response.text,
          jsonData: JSON.stringify({ rawResponse: response.text }),
          csvData: "Error,No se pudo formatear como CSV estructural"
        }
      });
    }

  } catch (error: any) {
    console.error("Error en digitalize API handler:", error);
    return res.status(500).json({
      error: error.message || "Error interno al procesar el archivo mediante Gemini AI."
    });
  }
}
