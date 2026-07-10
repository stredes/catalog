# Release Checklist - Google Play Store

## Pre-release

### Configuración
- [ ] `applicationId` definido como `com.catalogclean.app` en `app.json` y `build.gradle`
- [ ] Keystore de producción generado (`android/app/catalogclean-release.jks`)
- [ ] `android/keystore.properties` configurado con credenciales
- [ ] `.gitignore` incluye keystore y keystore.properties
- [ ] Permisos Android podados (solo INTERNET, CAMERA, READ_EXTERNAL_STORAGE)
- [ ] `versionCode` incrementado en `app.json` y `build.gradle`
- [ ] `versionName` actualizado en `app.json` y `build.gradle`

### Build
- [ ] `npx tsc --noEmit` sin errores
- [ ] `npm test` pasa todos los tests
- [ ] `cd android && ./gradlew clean`
- [ ] `cd android && ./gradlew bundleRelease` genera `.aab`
- [ ] Verificar que el `.aab` está en `android/app/build/outputs/bundle/release/`
- [ ] Probar build release sin Metro bundler

### Funcionalidad
- [ ] Crear familia exitosamente
- [ ] Crear producto con foto desde cámara
- [ ] Crear producto con foto desde galería
- [ ] Editar producto
- [ ] Eliminar producto con confirmación
- [ ] Generar catálogo PDF con diferentes formatos
- [ ] Compartir PDF por WhatsApp
- [ ] Ver historial de catálogos
- [ ] Duplicar catálogo
- [ ] Eliminar catálogo
- [ ] Configurar perfil de negocio
- [ ] Onboarding se muestra solo en primer inicio

### UI/UX
- [ ] Todos los textos en español con caracteres especiales correctos
- [ ] Sin mojibake (textos corruptos)
- [ ] Navegación funciona correctamente
- [ ] Empty states muestran mensajes claros
- [ ] Loading states funcionan
- [ ] Errores muestran mensajes amigables

### Play Store
- [ ] Título de la app configurado
- [ ] Descripción corta (80 caracteres máximo)
- [ ] Descripción completa
- [ ] Icono de launcher configurado (512x512 PNG)
- [ ] Screenshots (mínimo 2, recomendado 4-8)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Categoría seleccionada
- [ ] Política de privacidad configurada
- [ ] Data Safety form completado según `docs/privacy-data-inventory.md`
- [ ] Formulario de contato de privacidad

## Release

### Post-release
- [ ] Monitorear crash reports en Google Play Console
- [ ] Verificar reviews de usuarios
- [ ] Planificar siguiente versión
