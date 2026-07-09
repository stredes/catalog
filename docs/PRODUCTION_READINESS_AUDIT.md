# Analisis de Produccion y Cobertura de HU

Fecha: 2026-07-07

## Resumen Ejecutivo

La aplicacion tiene una base funcional y modular: arquitectura por capas, persistencia local con SQLite, imagenes persistentes, generacion de PDF persistente, historial y compartir nativo. Para un uso controlado o piloto, la cobertura funcional es alta. Para produccion formal, todavia requiere estabilizar build Android, ampliar pruebas automatizadas, fortalecer migraciones SQLite y cerrar detalles de UX/consistencia de datos.

Estado general: **parcialmente lista para piloto, no lista aun para produccion cerrada**.

## Criterios de Produccion Evaluados

- Cobertura funcional contra HU.
- Persistencia de datos y archivos.
- Manejo de errores.
- Arquitectura y separacion de responsabilidades.
- Validaciones.
- Experiencia movil.
- Compatibilidad de build Android.
- Mantenibilidad.
- Riesgo de perdida de datos.
- Preparacion para QA.

## Matriz de Historias de Usuario

| HU | Historia | Estado | Evidencia | Brecha |
| --- | --- | --- | --- | --- |
| HU-001 | Crear familia | Cumple | `FamiliesScreen`, `CreateFamilyUseCase`, `SQLiteFamilyRepository` | Falta test automatizado. |
| HU-002 | Editar familia | Cumple | `UpdateFamilyUseCase`, formulario de edicion | Falta prevenir nombres duplicados. |
| HU-003 | Eliminar familia | Parcial | `DeleteFamilyUseCase`, FK cascade en SQLite | Falta advertir cuantos productos se eliminaran. |
| HU-004 | Crear producto con imagen | Cumple | `ProductsScreen`, `ExpoImagePickerService`, `SQLiteProductRepository` | Falta comprimir/redimensionar imagen antes de persistir. |
| HU-005 | Editar producto | Cumple | `UpdateProductUseCase`, formulario de edicion | Falta limpiar imagen anterior si se reemplaza. |
| HU-006 | Eliminar producto | Parcial | `DeleteProductUseCase` | Falta borrar imagen fisica si ningun producto la usa. |
| HU-007 | Generar PDF por familia | Cumple | `CatalogBuilderScreen`, `GenerateCatalogPdfUseCase` | Falta preview visual antes de generar. |
| HU-008 | Elegir formato 4x5/3x7 | Cumple | `CatalogFormat`, `CatalogDtos`, `ExpoPdfGenerator` | Falta prueba visual por dispositivo/impresora. |
| HU-009 | Compartir catalogo | Cumple | `ShareCatalogPdfUseCase`, `ExpoNativeShareService` | Falta fallback si compartir no esta disponible. |
| HU-010 | Ver historial | Cumple | `HistoryScreen`, `SQLiteCatalogRepository` | Falta refresco por foco de pantalla. |
| HU-011 | Duplicar catalogo | Parcial | `DuplicateCatalogUseCase` | Duplica referencia al mismo PDF, no regenera archivo propio. |
| HU-012 | Eliminar catalogo | Cumple | `SQLiteCatalogRepository.delete` borra PDF si no hay referencias | Falta manejo visible de error al eliminar. |

## Hallazgos por Severidad

### Criticos

1. **Build Android no esta estabilizada para entrega APK.**
   - Se genero `android/`, pero la build nativa fallo inicialmente con `newArchEnabled=true`.
   - Se cambio a `newArchEnabled=false`, pero debe completarse una build limpia y copiar APK antes de considerar release.
   - Riesgo: no hay artefacto instalable confiable para QA.

2. **Cobertura automatizada aun es inicial.**
   - Existen tests unitarios para casos de uso criticos de familias, productos y catalogos.
   - Faltan tests de repositorios SQLite, adaptadores nativos, pantallas y generacion visual de PDF.
   - Riesgo: flujos de infraestructura o UI pueden romperse sin aviso.

3. **No hay estrategia formal de migraciones SQLite.**
   - Se usa `CREATE TABLE IF NOT EXISTS`, suficiente para primera version.
   - Riesgo: al agregar campos futuros, usuarios existentes no migraran correctamente.

### Altos

4. **Duplicar catalogo duplica metadata, no el archivo PDF.**
   - El duplicado apunta al mismo `pdfUri`.
   - Esto es aceptable si se busca reutilizar el mismo archivo, pero no si se espera una copia independiente.

5. **Eliminacion de producto no borra imagen fisica.**
   - Las imagenes persistidas quedan en `document/product-images`.
   - Riesgo: acumulacion de archivos no usados.

6. **Las pantallas cargan datos al montar, pero no siempre al recuperar foco.**
   - Si el usuario navega entre modulos, podria ver informacion desactualizada hasta recargar/remontar.

### Medios

7. **Validaciones funcionales presentes, pero faltan reglas de negocio.**
   - Faltan reglas como nombres unicos por familia, precio maximo razonable, catalogo sin productos eliminados, etc.

8. **Errores controlados incompletos en algunas acciones destructivas.**
   - Crear/generar/compartir tiene feedback.
   - Algunas eliminaciones dentro de `Alert.onPress` no muestran error si falla.

9. **PDF sin sanitizacion HTML completa.**
   - Nombres de productos/familias se interpolan en HTML.
   - Riesgo bajo en uso local, pero debe escaparse texto antes de generar HTML.

10. **Falta observabilidad local.**
   - No hay logs estructurados, version visible, ni pantalla de diagnostico.

## Persistencia

### Cumple

- Familias: SQLite.
- Productos: SQLite.
- Catalogos: SQLite.
- Imagenes: `document/product-images`.
- PDFs: `document/catalog-pdfs`.

### A reforzar

- Migraciones versionadas.
- Limpieza de imagenes huerfanas.
- Verificacion de existencia de PDF antes de compartir.
- Backup/exportacion futura de SQLite.

## Arquitectura

### Fortalezas

- Separacion por modulos.
- Dominio con entidades y contratos.
- Aplicacion con casos de uso.
- Infraestructura con adaptadores concretos.
- Presentacion separada en screens/hooks/components.
- Dependencias compuestas en `bootstrap/dependencies.tsx`.

### Brechas

- Algunos detalles de orquestacion siguen en pantallas.
- Falta capa de ViewModel mas explicita para estados de formulario y errores.
- Falta completar suite de tests por capa.

## Recomendaciones Para Cerrar Produccion

### Sprint 1: Estabilidad funcional

1. Completar build APK con `newArchEnabled=false`.
2. Agregar refresco por foco usando `useFocusEffect`.
3. Escapar texto HTML antes de generar PDF.
4. Validar existencia de PDF antes de compartir.
5. Capturar errores en eliminaciones.

### Sprint 2: Persistencia robusta

1. Crear migraciones SQLite versionadas.
2. Agregar limpieza de imagenes huerfanas.
3. Definir si duplicar catalogo copia PDF o solo metadata.
4. Agregar export/import de respaldo local.

### Sprint 3: QA automatizado

1. Tests unitarios para use cases. Estado: cobertura inicial agregada.
2. Tests de repositorios con SQLite de prueba o fake repository.
3. Tests de generacion HTML/PDF por formato.
4. Checklist manual por dispositivo Android.

## Criterio de Salida Para Produccion

La aplicacion puede considerarse lista para produccion cuando:

- Todas las HU esten en estado Cumple.
- Exista APK instalable generado y probado en al menos un dispositivo fisico.
- Se pueda cerrar y abrir la app manteniendo familias, productos, imagenes, catalogos y PDFs.
- Compartir PDF funcione desde catalogo recien generado y desde historial.
- Existan pruebas automatizadas minimas para casos de uso criticos. Estado: cumplido inicialmente.
- Las migraciones SQLite esten versionadas.

## Estado Final de Cobertura

- Cumplen: 8/12 HU.
- Parciales: 4/12 HU.
- Bloqueantes de produccion: build APK pendiente de cierre, cobertura de infraestructura/UI insuficiente, migraciones no versionadas.
