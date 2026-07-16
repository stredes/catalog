# Catalog Clean - React Native

App móvil de catálogo de productos para vendedores. Permite gestionar familias, productos, inventario y clientes.

## Características

- **Gestión de Productos**: CRUD completo con búsqueda y filtros
- **Familias de Productos**: Organización jerárquica con protección de borrado
- **Inventario**: Control de stock con alertas de stock bajo
- **Clientes**: Gestión de cartera con historial de compras
- **Backup**: Sistema completo de respaldo y restauración
- **Multi-rol**: Permisos por rol (admin, seller, viewer)

## Arquitectura

```
src/
├── modules/           # Módulos de negocio
│   ├── products/      # Productos
│   ├── families/      # Familias
│   ├── catalogs/      # Catálogos
│   ├── clients/       # Clientes
│   ├── inventory/     # Inventario
│   ├── backup/        # Sistema de backup
│   └── onboarding/    # Onboarding
├── shared/            # Componentes compartidos
│   ├── infrastructure/# Base de datos, migraciones, seguridad
│   ├── presentation/  # UI components, hooks, theme
│   └── domain/        # Tipos y entidades
└── bootstrap/         # Configuración inicial
```

## Instalación

```bash
# Clonar repositorio
git clone git@github.com:stredes/catalog.git
cd catalog

# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env

# Ejecutar en desarrollo
npx expo start
```

## Scripts

```bash
# Tests
npm test                    # Ejecutar todos los tests
npm test -- --coverage      # Con cobertura
npm test -- --watch         # Modo watch

# Build
eas build --platform android # Build para Android
eas build --platform ios     # Build para iOS

# Linting
npm run lint
npm run typecheck
```

## Base de Datos

### Migraciones

El sistema usa migraciones versionadas para manejar cambios en el esquema:

```bash
# Ejecutar migraciones pendientes
npx expo run:android

# Las migraciones se ejecutan automáticamente al iniciar la app
```

### Backup

```bash
# Crear backup manual
./backup/backup.sh

# Restaurar desde backup
./backup/restore.sh /ruta/al/backup

# Backup incremental (solo cambios)
./backup/backup.sh --incremental
```

## Seguridad

- **Encriptación**: Datos sensibles encriptados con SHA256
- **Permisos**: Control por rol (admin/seller/viewer)
- **Sesión**: Timeout automático y lockout por intentos fallidos
- **Auditoría**: Log de todas las actividades

## CI/CD

### GitHub Actions

- **CI**: Tests automáticos en cada push/PR
- **Release**: Build automático con EAS
- **Staging**: Deploy a Google Play Internal Track
- **Rollback**: Script de rollback manual

### Release

```bash
# Semantic versioning
./scripts/release.sh patch   # 1.0.0 → 1.0.1
./scripts/release.sh minor   # 1.0.0 → 1.1.0
./scripts/release.sh major   # 1.0.0 → 2.0.0
```

## Desarrollo

### Estructura de un Módulo

```
src/modules/example/
├── domain/
│   ├── entities/       # Entidades del dominio
│   └── repositories/   # Interfaces de repositorios
├── application/
│   └── use-cases/      # Casos de uso
├── infrastructure/
│   └── repositories/   # Implementaciones
└── presentation/
    ├── screens/        # Pantallas
    ├── components/     # Componentes UI
    └── hooks/          # Hooks personalizados
```

### Convenciones

- **TypeScript**: Todo debe estar tipado
- **Tests**: Cada módulo debe tener tests unitarios
- **Naming**: PascalCase para componentes, camelCase para funciones
- **Imports**: Usar alias `@/` para imports relativos

## Testing

### Tipos de Tests

1. **Unitarios**: Prueban funciones aisladas
2. **Integración**: Prueban interacción entre módulos
3. **E2E**: Prueban flujos completos del usuario

### Cobertura

La cobertura mínima aceptable es del 80%. Ejecutar:

```bash
npm test -- --coverage
```

## Deploy

### Android

1. **Google Play Store**: Via EAS Build
2. **Internal Testing**: Via GitHub Actions
3. **Production**: Release automático con tags

### iOS

1. **App Store**: Via EAS Build
2. **TestFlight**: Via GitHub Actions

## Troubleshooting

### Errores Comunes

```bash
# Limpiar cache
npx expo start --clear

# Reinstalar dependencias
rm -rf node_modules && npm install

# Resetear base de datos
npx expo run:android --reset
```

## Licencia

MIT

## Contacto

- **GitHub**: [@stredes](https://github.com/stredes)
- **Issues**: [GitHub Issues](https://github.com/stredes/catalog/issues)
