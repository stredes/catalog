# Release Checklist - Google Play Store

## Pre-release

### Configuracion
- [x] `applicationId` definido como `com.anonymous.catalogclean` en `app.json`
- [ ] Keystore de produccion generado (`android/app/catalogclean-release.jks`)
- [ ] `android/keystore.properties` configurado con credenciales
- [ ] `.gitignore` incluye keystore y keystore.properties
- [ ] Permisos Android podados (solo INTERNET, CAMERA, READ_EXTERNAL_STORAGE)
- [x] `versionCode` incrementado en `app.json` (15)
- [x] `versionName` actualizado en `app.json` (3.1.8)
- [x] `package.json` version sincronizado (3.1.8)
- [x] `DatabaseBackupService` y `sqlite.ts` usan `DATABASE_SCHEMA_VERSION`

### Build
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm test` pasa todos los tests (38/39, 1 fallo pre-existente en AutoBackupService)
- [ ] `cd android && ./gradlew clean`
- [ ] `cd android && ./gradlew assembleRelease` genera APK
- [ ] Verificar que el APK esta en `android/app/build/outputs/apk/release/`
- [ ] Probar build release sin Metro bundler
- [ ] Patch `react-native-safe-area-context` CMakeLists.txt despues de npm install

### Funcionalidad - CRUD
- [ ] Crear familia exitosamente
- [ ] Crear producto con foto desde camara
- [ ] Crear producto con foto desde galeria
- [ ] Editar producto
- [ ] Eliminar producto con confirmacion
- [ ] Crear catalogo PDF con diferentes formatos
- [ ] Compartir PDF por WhatsApp
- [ ] Ver historial de catalogos
- [ ] Duplicar catalogo
- [ ] Eliminar catalogo
- [ ] Configurar perfil de negocio
- [ ] Onboarding se muestra solo en primer inicio

### Funcionalidad - Carrito y Ordenes
- [ ] Agregar producto al carrito con cantidad
- [ ] Modificar cantidades en carrito (+/-)
- [ ] Eliminar item del carrito
- [ ] Generar orden de compra (PDF)
- [ ] Ver historial de ordenes
- [ ] Numeracion progresiva de pedidos (N 0001, N 0002...)

### Funcionalidad - Compra Proveedor
- [ ] Seleccionar productos para compra proveedor
- [ ] Generar PDF de solicitud de compra
- [ ] Compartir PDF de compra

### Funcionalidad - Backup
- [ ] Backup basico desde ProfileScreen (exporta JSON)
- [ ] Backup avanzado con etiqueta y auto-backup
- [ ] Restaurar backup exitosamente
- [ ] Backup incluye orders (v3.1.8)
- [ ] Backup incluye images y PDFs
- [ ] Compartir backup por share sheet
- [ ] Import backup desde archivo (expo-document-picker)

### Funcionalidad - Datos del Cliente
- [ ] Migracion de backups viejos (schemaVersion 9) funciona con migrate-backup.js
- [ ] Backups con `com.anonymous.catalogclean` se restauran correctamente
- [ ] Orders se preservan durante backup/restore

### UI/UX
- [ ] Todos los textos en espanol con caracteres especiales correctos
- [ ] Sin mojibake (textos corruptos)
- [ ] Navegacion funciona correctamente
- [ ] Empty states muestran mensajes claros
- [ ] Loading states funcionan
- [ ] Errores muestran mensajes amigables
- [ ] BottomMenu funciona (5 tabs)
- [ ] LiquidGlassContainer efecto frosted glass visible
- [ ] Tema claro/oscuro funciona

### Play Store
- [ ] Titulo de la app configurado
- [ ] Descripcion corta (80 caracteres maximo)
- [ ] Descripcion completa
- [ ] Icono de launcher configurado (512x512 PNG)
- [ ] Screenshots (minimo 2, recomendado 4-8)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Categoria seleccionada
- [ ] Politica de privacidad configurada
- [ ] Data Safety form completado segun `docs/privacy-data-inventory.md`
- [ ] Formulario de contacto de privacidad

## Release

### Post-release
- [ ] Monitorear crash reports en Google Play Console
- [ ] Verificar reviews de usuarios
- [ ] Planificar siguiente version

## Notas de v3.1.8

- Package: `com.anonymous.catalogclean` (intencional, mantiene compat con instalacion existente)
- versionCode: 15 (permite update sobre instalacion existente del cliente)
- Backup/restore ahora incluye orders en el payload JSON
- migrate-backup.js disponible para clientes que necesiten convertir backups viejos
- Database schema version: 10 (orders.orderNumber)
