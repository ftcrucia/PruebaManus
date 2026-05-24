import { DigitalizedDocument } from './types';

export const mockDocs: DigitalizedDocument[] = [
  {
    id: 'doc-factura-001',
    name: 'factura_compra_carrefour.png',
    type: 'factura',
    confidence: 0.98,
    language: 'es',
    summary: 'Factura simplificada de Carrefour Express por compras de papelería, cafetería y limpieza de oficina.',
    timestamp: '2026-05-23T11:45:00Z',
    fileSize: '432 KB',
    fileMime: 'image/png',
    extractedData: {
      plainText: `
# FACTURA DE COMPRA - CARREFOUR EXPRESS
**Emisor:** INC S.A. (Carrefour Argentina)  
**Domicilio:** Av. Santa Fe 3254, CABA, Argentina  
**CUIT:** 30-68731045-3  
**Fecha:** 22/05/2026 15:32:10  
**Nro. Factura:** Nro. 0005-00124856  
**Tipo:** Factura B (Consumidor Final)

---

### ÍTEMS COMPRADOS
| Cantidad | Descripción | Precio Unitario | Subtotal |
| :--- | :--- | :---: | :---: |
| 2 unidades | Cuaderno Universitario A4 Rivadavia | $1.850,00 | $3.700,00 |
| 1 unidad | Café Molido Cabrales Gold 500g | $4.200,00 | $4.200,00 |
| 3 unidades | Resaltador Filgo Trazo Grueso (Pack Frio) | $650,00 | $1.950,00 |
| 1 unidad | Detergente Ala Axión Limón 750ml | $1.450,00 | $1.450,00 |

---

### RESUMEN DE IMPORTES
- **Subtotal:** $11.300,00
- **IVA (21%):** Incluido en precios unitarios
- **TOTAL PAGADO:** **$11.300,00 ARS**

**Método de Pago:** Tarjeta de Débito Visa Banco Galicia (Termulación: ****4315)
`,
      jsonData: JSON.stringify({
        cabecera: {
          emisor: "INC S.A. (Carrefour Argentina)",
          cuit: "30-68731045-3",
          direccion: "Av. Santa Fe 3254, CABA, Argentina",
          nro_factura: "0005-00124856",
          tipo: "Factura B",
          fecha: "22/05/2026 15:32",
        },
        items: [
          { cantidad: 2, descripcion: "Cuaderno Universitario A4 Rivadavia", precio_unitario: 1850.00, subtotal: 3700.00 },
          { cantidad: 1, descripcion: "Café Molido Cabrales Gold 500g", precio_unitario: 4200.00, subtotal: 4200.00 },
          { cantidad: 3, descripcion: "Resaltador Filgo Trazo Grueso", precio_unitario: 650.00, subtotal: 1950.00 },
          { cantidad: 1, descripcion: "Detergente Ala Axión Limón 750ml", precio_unitario: 1450.00, subtotal: 1450.00 }
        ],
        totales: {
          subtotal: 11300.00,
          iva_alicuota: 21.0,
          total: 11300.00,
          moneda: "ARS"
        },
        pago: {
          metodo: "Tarjeta de Debito (Galicia)",
          tarjeta_terminacion: "4315"
        }
      }, null, 2),
      csvData: `Cantidad,Descripcion,Precio_Unitario,Subtotal
2,Cuaderno Universitario A4 Rivadavia,1850.00,3700.00
1,Café Molido Cabrales Gold 500g,4200.00,4200.00
3,Resaltador Filgo Trazo Grueso,650.00,1950.00
1,Detergente Ala Axión Limón 750ml,1450.00,1450.00`
    }
  },
  {
    id: 'doc-remito-002',
    name: 'remito_entrega_materiales.pdf',
    type: 'remito',
    confidence: 0.95,
    language: 'es',
    summary: 'Remito de entrega de materiales de construcción y ferretería para obra civil firmado por el receptor.',
    timestamp: '2026-05-23T12:10:00Z',
    fileSize: '1.2 MB',
    fileMime: 'application/pdf',
    extractedData: {
      plainText: `
# REMITO DE ENTREGA (DOCUMENTO NO VÁLIDO COMO FACTURA)
**Proveedor:** Bulonera & Materiales Nordelta S.A.  
**Domicilio:** Ruta 27 Km 4.5, Tigre, Prov. Buenos Aires  
**Fecha de Emisión:** 18/05/2026  
**Nro. Remito:** R-0002-00045124  
**Cliente:** Constructora Del Plata S.R.L.  
**Lugar de Entrega:** Obra "Mosaicos", Calle de las Artes 450, Benavídez

---

### DETALLE DE PRODUCTOS ENTREGADOS
| Item | Código | Descripción del Material | Cantidad | Estado |
| :---: | :---: | :--- | :---: | :---: |
| 1 | CEM-CRE | Bolsa de Cemento Portland Loma Negra (50kg) | 40 bolsas | Entregado conforme |
| 2 | ARE-GR | Arena Gruesa a Granel para revoque | 2 metros³ | Entregado conforme |
| 3 | VAR-08 | Varilla de Hierro Nervado del 8 (6 metros) | 15 unidades | Entregado conforme |
| 4 | CLA-02 | Clavos cabeza plana de acero 2 pulgadas (X kg) | 5 kg | Entregado conforme |

---

### RECEPCIÓN Y OBSERVACIONES
- **Entregado por:** Chofer Carlos Gómez (Camión patente AF-432-ED)
- **Recibe conforme:** Arq. Esteban Paz (Firma manuscrita digitalizada en archivo)
- **Fecha de Recepción:** 18/05/2026 10:15
- **Observaciones:** Sin reclamos. Todos los empaques cerrados y secos.
`,
      jsonData: JSON.stringify({
        proveedor: {
          nombre: "Bulonera & Materiales Nordelta S.A.",
          direccion: "Ruta 27 Km 4.5, Tigre, Prov. Buenos Aires"
        },
        documento: {
          id: "R-0002-00045124",
          fecha_emision: "18/05/2026",
          tipo: "Remito de Entrega"
        },
        cliente: {
          nombre: "Constructora Del Plata S.R.L.",
          direccion_entrega: "Calle de las Artes 450, Benavídez"
        },
        productos: [
          { item: 1, codigo: "CEM-CRE", descripcion: "Bolsa de Cemento Portland Loma Negra (50kg)", cantidad: "40 bolsas", estado: "Conforme" },
          { item: 2, codigo: "ARE-GR", descripcion: "Arena Gruesa a Granel para revoque", cantidad: "2 metros³", estado: "Conforme" },
          { item: 3, codigo: "VAR-08", descripcion: "Varilla de Hierro Nervado del 8 (6 metros)", cantidad: "15 unidades", estado: "Conforme" },
          { item: 4, codigo: "CLA-02", descripcion: "Clavos cabeza plana de acero 2 pulgadas", cantidad: "5 kg", estado: "Conforme" }
        ],
        recepcion: {
          entregado_por: "Carlos Gomez (Patente AF-432-ED)",
          recibido_por: "Arq. Esteban Paz",
          fecha_hora_recepcion: "18/05/2026 10:15",
          observaciones: "Sin reclamos. Todos los empaques cerrados y secos."
        }
      }, null, 2),
      csvData: `Item,Codigo,Descripcion,Cantidad,Estado
1,CEM-CRE,Bolsa de Cemento Portland Loma Negra (50kg),40 bolsas,Conforme
2,ARE-GR,Arena Gruesa a Granel para revoque,2 metros³,Conforme
3,VAR-08,Varilla de Hierro Nervado del 8 (6 metros),15 unidades,Conforme
4,CLA-02,Clavos cabeza plana de acero 2 pulgadas,5 kg,Conforme`
    }
  }
];
