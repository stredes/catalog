# Catalog Clean — Informe de Lanzamiento App Store

## 1. Datos Generales

| Campo | Valor |
|-------|-------|
| **Nombre** | Catalog Clean |
| **Bundle ID** | com.anonymous.catalogclean |
| **Versión** | 1.0.3 (app.json) → subir a 1.0.4 |
| **Plataforma** | iOS 15.0+ |
| **Orientación** | Portrait |
| **Tablet** | Soportado (`supportsTablet: true`) |
| **Idioma** | Español (Chile) |
| **Categoría sugerida** | Productividad / Negocios |
| **Price Tier** | Gratis |

---

## 2. Descripción para App Store

### Título
Catalog Clean — Catálogos PDF profesionales

### Subtítulo (30 chars)
Catálogos PDF al instante

### Descripción

> Catalog Clean te permite crear catálogos PDF profesionales desde tu iPhone en segundos.
>
> Organiza tus productos por familias, asígnales precios y fotos, y genera catálogos PDF con un diseño limpio y moderno. Todo localmente, sin necesidad de internet.
>
> **Características principales:**
> - Inventario de productos con fotos, precios y formatos
> - Organización por familias/categorías
> - Selección inteligente: elige productos por familia o individualmente
> - 6 formatos de catálogo PDF: grilla 2, grilla 3, grilla 4×5, grilla 3×7, lista simple, portada premium
> - Vista previa antes de generar
> - Comparte por WhatsApp, correo, AirDrop, etc.
> - Historial de catálogos generados
> - Perfil de negocio con logo y datos de contacto
> - Modo oscuro
> - 100% offline — tus datos se guardan localmente

### Palabras clave (100 chars)
catálogo, pdf, productos, inventario, negocio, ventas, precios, fotos, catalogo, digital

### URL de soporte
https://tudominio.com/soporte

### URL de marketing (opcional)
https://tudominio.com

### Política de privacidad (requerido)
URL a política de privacidad (necesitas una, aunque la app no recolecte datos)

---

## 3. Características Técnicas

| Feature | Detalle |
|---------|---------|
| **Framework** | React Native 0.81.5 + Expo SDK 54 |
| **Base de datos** | SQLite local (expo-sqlite) |
| **PDF** | Generación HTML a PDF vía `expo-print` |
| **Imágenes** | `expo-image-picker` (cámara + galería) |
| **Persistencia** | `expo-file-system` |
| **Compartir** | `expo-sharing` (native share sheet) |
| **Sin conexión** | 100% offline |
| **Registro/Cuenta** | No requiere |

---

## 4. Permisos iOS (Info.plist)

La app solicitará estos permisos en tiempo de ejecución:

| Permiso | Descripción | Propósito |
|---------|-------------|-----------|
| **Cámara** | `NSCameraUsageDescription` | "Usar la cámara para tomar fotos de productos." |
| **Galería** | `NSPhotoLibraryUsageDescription` | "Acceder a tu galería para seleccionar fotos de productos." |

> ⚠️ **Importante:** Ambos permisos son opcionales. El usuario puede usar la app sin concederlos (solo no podrá agregar fotos a productos).

---

## 5. Pantallas y Funcionalidades

| Nº | Pantalla | Función |
|----|----------|---------|
| 1 | **Dashboard** | Resumen: total productos, familias, catálogos, valor inventario. Accesos rápidos. |
| 2 | **Productos** | CRUD completo: crear, editar, eliminar. Vista grilla/lista. Buscar, filtrar por familia, ordenar. |
| 3 | **Familias** | CRUD de categorías. Cada familia agrupa productos. |
| 4 | **Catálogos** | Historial de PDFs generados. Compartir, duplicar, eliminar. |
| 5 | **Crear Catálogo** | Wizard 5 pasos: nombre → selección (familias/productos) → formato → vista previa → generar PDF. |
| 6 | **Perfil** | Datos del negocio (nombre, dueño, teléfono, email, dirección, web, logo). Modo oscuro. |

---

## 6. Capturas de Pantalla Recomendadas

Para App Store necesitas capturas en estos tamaños:
- **6.7″** (1290×2796 px) — iPhone 14 Pro Max / 15 Pro Max
- **6.5″** (1242×2688 px) — iPhone 14 Plus
- **5.5″** (1242×2208 px) — iPhone SE / 8 Plus
- **iPad Pro** (2048×2732 px) — si aplica

### Flujo sugerido para capturas (6-8 imágenes):

1. Dashboard principal con resumen
2. Lista de productos (vista grilla)
3. Formulario de crear producto (mostrando cámara/galería)
4. Crear catálogo — paso selección por familias
5. Crear catálogo — paso elegir formato
6. Vista previa del catálogo
7. Catálogo generado — compartir
8. Perfil de negocio

> 📱 Cada captura debe mostrar la app en español con datos de ejemplo realistas.

---

## 7. Checklist de Configuración iOS

- [ ] **Apple Developer Program** ($99/año) — necesario para distribuir
- [ ] **Crear App ID** en developer.apple.com con bundle `com.anonymous.catalogclean`
- [ ] **Generar certificados** (distribution) y **provisioning profile**
- [ ] **App Store Connect** — crear nuevo app con nombre "Catalog Clean"
- [ ] **Rellenar metadata** (descripción, keywords, categoría, calificación)
- [ ] **Política de privacidad** — subir URL válida
- [ ] **Subir icono** 1024×1024 px (sin transparencia)
- [ ] **Capturas de pantalla** en todos los tamaños requeridos
- [ ] **Versión iOS mínima:** 15.0 (configurar en Xcode o app.json)

### Configuración en app.json para iOS:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.catalogclean",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Usar la cámara para tomar fotos de productos.",
        "NSPhotoLibraryUsageDescription": "Acceder a tu galería para seleccionar fotos de productos."
      },
      "appStoreCategory": "public.app-category.productivity"
    }
  }
}
```

---

## 8. Tamaño Estimado de la App

| Componente | Tamaño |
|------------|--------|
| Código JS bundle | ~2.5 MB |
| Assets (iconos, fonts) | ~2 MB |
| React Native shell | ~15 MB |
| Hermes engine | ~3 MB |
| Expo runtime | ~8 MB |
| **Total estimado** | **~30-40 MB** |

---

## 9. Recomendaciones Previas al Lanzamiento

- [ ] **Unificar versión:** app.json → `"version": "1.0.4"` (coincidir con package.json)
- [ ] **Cambiar bundle ID** de `com.anonymous.catalogclean` a uno personalizado (ej: `com.tumarca.catalogclean`)
- [ ] **Agregar icono 1024×1024 px** para iOS (actualmente solo hay icono Android)
- [ ] **Probar en dispositivo físico iOS** con `npx expo run:ios` (requiere Mac)
- [ ] **Probar todos los flujos:** crear producto con foto (cámara y galería), generar PDF, compartir
- [ ] **Correr tests:** `npx vitest run`
- [ ] **TypeScript:** `npx tsc --noEmit` (limpio)
- [ ] **Preparar política de privacidad** aunque la app no recolecte datos

---

## 10. Construcción del IPA

### Opción A: EAS Build (recomendado, desde cualquier SO)

```bash
# 1. Login en Expo
npx eas login

# 2. Configurar eas.json
npx eas build:configure

# 3. Construir IPA
npx eas build --platform ios --profile production
```

### Opción B: Xcode (requiere macOS)

```bash
npx expo run:ios
# Luego Archive desde Xcode > Product > Archive
```

---

## 11. Dependencias Clave

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| expo | 54.0.35 | SDK principal |
| react-native | 0.81.5 | Framework RN |
| expo-print | ~15.0.8 | Generar PDF desde HTML |
| expo-sharing | ~14.0.8 | Compartir archivos |
| expo-sqlite | ~16.0.10 | Base de datos local |
| expo-image-picker | ~17.0.11 | Cámara y galería |
| expo-file-system | ~19.0.23 | Persistencia de archivos |
| react-hook-form + zod | ^7.81 / ^4.4 | Formularios y validación |
| @expo/vector-icons | ^15.0.3 | Iconografía |

---

## 12. Resumen de Archivos para App Store Connect

| Archivo | Ruta |
|---------|------|
| Icono 1024×1024 | `assets/icon.png` (necesitas generar versión iOS 1024px) |
| Capturas de pantalla | (generar externamente con simulador) |
| app.json | `app.json` — configuración principal |
| Metadata | `CATALOG_CLEAN_APP_STORE_REPORT.md` (este archivo) |
