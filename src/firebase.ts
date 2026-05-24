import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { getAuth, signInAnonymously, Auth } from "firebase/auth";

// Configuración de Firebase con tus credenciales
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDZvSdwfjY9bsYcng3sGi1CPn-guXZYqX8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pruebamanus-c64f1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pruebamanus-c64f1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pruebamanus-c64f1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "708184658593",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:708184658593:web:d742d922895cb2cbf716e0",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Auth
export const auth = getAuth(app);

// Función para autenticarse anónimamente (opcional, pero recomendado para Firestore)
export async function initializeAuth(): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) {
      await signInAnonymously(auth);
      console.log("Autenticación anónima iniciada");
    }
  } catch (error) {
    console.error("Error al autenticar:", error);
  }
}

// Interfaz para los documentos digitalizados
export interface DigitalizedDocument {
  fileName: string;
  documentType: string;
  documentTypeConfidence: number;
  language: string;
  summary: string;
  extractedData: {
    plainText: string;
    jsonData: string;
    csvData: string;
  };
  uploadedAt: Timestamp;
  mimeType?: string;
}

// Función para guardar un documento digitalizado en Firestore
export async function saveDigitalizedDocument(
  documentData: Omit<DigitalizedDocument, "uploadedAt">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "digitalized_documents"), {
      ...documentData,
      uploadedAt: Timestamp.now(),
    });
    console.log("Documento guardado con ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar documento:", error);
    throw error;
  }
}

// Función para obtener todos los documentos digitalizados
export async function getDigitalizedDocuments(): Promise<(DigitalizedDocument & { id: string })[]> {
  try {
    const q = query(collection(db, "digitalized_documents"));
    const querySnapshot = await getDocs(q);
    const documents: (DigitalizedDocument & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      } as DigitalizedDocument & { id: string });
    });
    return documents;
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    throw error;
  }
}

// Función para obtener documentos por tipo
export async function getDocumentsByType(
  documentType: string
): Promise<(DigitalizedDocument & { id: string })[]> {
  try {
    const q = query(
      collection(db, "digitalized_documents"),
      where("documentType", "==", documentType)
    );
    const querySnapshot = await getDocs(q);
    const documents: (DigitalizedDocument & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      } as DigitalizedDocument & { id: string });
    });
    return documents;
  } catch (error) {
    console.error("Error al obtener documentos por tipo:", error);
    throw error;
  }
}

// Función para eliminar un documento
export async function deleteDigitalizedDocument(docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "digitalized_documents", docId));
    console.log("Documento eliminado:", docId);
  } catch (error) {
    console.error("Error al eliminar documento:", error);
    throw error;
  }
}

// Función para actualizar un documento
export async function updateDigitalizedDocument(
  docId: string,
  updates: Partial<DigitalizedDocument>
): Promise<void> {
  try {
    await updateDoc(doc(db, "digitalized_documents", docId), updates);
    console.log("Documento actualizado:", docId);
  } catch (error) {
    console.error("Error al actualizar documento:", error);
    throw error;
  }
}
