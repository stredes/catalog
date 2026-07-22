# Changelog

Todos los cambios notables de catalog-clean.

Formato basado en [Keep a Changelog](https://keepachangelog.com/).

## [3.1.8] - 2026-07-22

### Fixed
- **Package name:** `com.anonymous.catalogclean` (mantiene compatibilidad con instalacion existente del cliente, permite update directo).

### Changed
- **Backup/restore con orders:** `CreateBackupUseCase` y `RestoreBackupUseCase` ahora incluyen orders en el payload y restauracion.
- **BackupSnapshot:** Campo `ordersCount` agregado a entidades y repositorio, con fallback para DBs viejas sin la columna.
- **SQLiteBackupRepository:** `INSERT` con try/catch para `ordersCount` — si la DB no tiene la columna, usa INSERT sin ordersCount.
- **Version sync:** `DatabaseBackupService` y `sqlite.ts` ahora usan `DATABASE_SCHEMA_VERSION` en vez de hardcodear el numero de schema.
- **Backup/restore scripts:** `backup.sh` y `restore.sh` alineados a `com.anonymous.catalogclean`.

### Added
- **migrate-backup.js:** Script de migracion para convertir backups de clientes (schemaVersion 9, `com.anonymous.catalogclean`) a formato v10 compatible con la app nueva. Actualiza rutas de imagenes, agrega orders vacio si falta, y registra migracion v10.
- **ordersCount en backup snapshots:** Conteo de ordenes visible en metadata de backups.

## [3.1.6] - 2026-07-21

### Added
- Compra proveedor (PurchaseDetailScreen): seleccion de productos con cantidades, generacion de PDF.
- Historial de pedidos (OrderHistoryScreen): busqueda, eliminar, numeros de orden progresivos (N 0001, N 0002...).
- Import backup desde archivo (expo-document-picker, restaurar con imagenes).
- Migration v10: `orders.orderNumber` para numeracion progresiva.

### Changed
- Backup basico y avanzado con UI mejorada.
- E2E tests (3 tests en e2e-flow.test.ts).
- Sentry crash reporting (lazy load, graceful fallback).
- Analytics SQLite (analytics_events table, catalog_generated event).
- Lazy image loading (batches de 5 en ExpoPdfGenerator).
- PDF cache SHA256 (PdfCacheService integrado).
- IVA removido de carrito/ordenes (productos ya incluyen IVA).

## [2.0.0] - 2026-07-16

### Added
- Modulo editorial: contenido profesional auto-generado offline (80+ templates).
- Template premium cover con tokens (Colors, Spacing, Typography, Grid).
- BottomMenu restaurado (5 tabs: Inicio, Productos, Familias, Catalogos, Perfil).
- Cart icon en ProductsScreen con badge de cantidad.
- Backup module (merge desde remoto).
- Onboarding 3 pasos.
- Auth local (email/password) con bypass a Dashboard.

### Changed
- Navegacion manual por useState (sin React Navigation).
- UI con LiquidGlassContainer (efecto frosted glass).
- Modo claro/oscuro via ThemeContext.

## [1.0.0] - 2026-07-10

### Added
- CRUD familias con cascade delete.
- CRUD productos con precio, formato, codigo, stock, imagen.
- Catalog builder wizard (7 pasos).
- 6 formatos de catalogo PDF (grid-2, grid-3, grid-4x5, grid-3x7, simple-list, premium-cover).
- Perfil del negocio con logo, datos bancarios.
- Carrito de compras con cantidades.
- Compartir PDFs por share sheet nativo.
- SQLite local con expo-sqlite.
