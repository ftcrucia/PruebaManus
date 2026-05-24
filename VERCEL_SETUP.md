# Configuración de Vercel para PruebaManus

## Pasos para desplegar en Vercel

### 1. Conectar el repositorio a Vercel
- Ve a [vercel.com](https://vercel.com)
- Haz clic en "New Project"
- Selecciona tu repositorio `PruebaManus` de GitHub
- Vercel detectará automáticamente que es un proyecto Vite + React

### 2. Configurar Variables de Entorno
En la sección **Environment Variables** de Vercel, agrega las siguientes variables:

#### Firebase Configuration (Frontend - Vite)
```
VITE_FIREBASE_API_KEY=AIzaSyDZvSdwfjY9bsYcng3sGi1CPn-guXZYqX8
VITE_FIREBASE_AUTH_DOMAIN=pruebamanus-c64f1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pruebamanus-c64f1
VITE_FIREBASE_STORAGE_BUCKET=pruebamanus-c64f1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=708184658593
VITE_FIREBASE_APP_ID=1:708184658593:web:d742d922895cb2cbf716e0
```

#### Gemini API Key (Backend - Node.js)
```
GEMINI_API_KEY=your_gemini_api_key_here
```

**Nota:** Reemplaza `your_gemini_api_key_here` con tu clave real de Gemini.

### 3. Configuración del Build
Vercel debería detectar automáticamente:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Desplegar
Una vez configuradas las variables de entorno:
1. Haz clic en "Deploy"
2. Vercel compilará y desplegará tu aplicación automáticamente
3. Recibirás una URL pública para acceder a tu app

### 5. Despliegues Automáticos
Cada vez que hagas `git push` a la rama principal (main/master), Vercel desplegará automáticamente los cambios.

## Estructura del Proyecto

```
PruebaManus/
├── src/
│   ├── firebase.ts          # Configuración de Firebase
│   ├── App.tsx              # Componente principal (integrado con Firebase)
│   └── ...
├── api/
│   └── digitalize.ts        # API handler para Gemini
├── .env.local               # Variables locales (NO subir a Git)
├── .env.example             # Plantilla de variables de entorno
├── vercel.json              # Configuración de Vercel
└── package.json
```

## Características Implementadas

✅ **Firebase Firestore Integration**
- Los documentos digitalizados se guardan automáticamente en Firestore
- Autenticación anónima para acceso seguro
- Colección: `digitalized_documents`

✅ **Local Storage Fallback**
- Si Firebase no está disponible, la app sigue funcionando con localStorage
- Los datos se sincronizan cuando Firebase vuelve a estar disponible

✅ **Gemini AI Integration**
- Digitalización de documentos con Gemini 3.1 Flash Lite
- Extracción de datos en formato JSON, CSV y Markdown

✅ **Vercel Deployment Ready**
- Build optimizado para Vercel
- Rewrites configurados en `vercel.json`
- Soporte para API routes serverless

## Troubleshooting

### Error: "GEMINI_API_KEY no configurado"
- Asegúrate de agregar `GEMINI_API_KEY` en las variables de entorno de Vercel

### Error: "Firebase initialization failed"
- Verifica que todas las variables `VITE_FIREBASE_*` estén correctamente configuradas
- Las variables de Vite deben tener el prefijo `VITE_` para ser accesibles en el frontend

### La app no guarda documentos en Firestore
- Verifica que Firebase esté correctamente inicializado
- Revisa la consola del navegador para errores de autenticación
- Comprueba que la colección `digitalized_documents` existe en Firestore

## Próximos Pasos

1. **Configurar Firestore Security Rules** (opcional pero recomendado)
2. **Agregar autenticación de usuarios** para mejor control de datos
3. **Implementar exportación de datos** desde Firestore
4. **Agregar análisis** con Google Analytics

¡Tu aplicación está lista para desplegar! 🚀
