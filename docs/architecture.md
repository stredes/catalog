# Arquitectura del Sistema

## Visión General

Catalog Clean sigue una arquitectura **Clean Architecture** con separación clara de capas:

```
┌─────────────────────────────────────────────────┐
│                 PRESENTATION                      │
│  (React Native Components, Hooks, Screens)       │
├─────────────────────────────────────────────────┤
│                 APPLICATION                       │
│  (Use Cases, DTOs, Interfaces)                   │
├─────────────────────────────────────────────────┤
│                   DOMAIN                          │
│  (Entities, Value Objects, Repository Interfaces)│
├─────────────────────────────────────────────────┤
│               INFRASTRUCTURE                     │
│  (SQLite, External APIs, Services)               │
└─────────────────────────────────────────────────┘
```

## Capas

### 1. Domain (Dominio)

Contiene las reglas de negocio puras, sin dependencias externas.

```typescript
// src/modules/products/domain/entities/Product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  familyId: string;
  stock: number;
}

// src/modules/products/domain/repositories/ProductRepository.ts
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findByFamily(familyId: string): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 2. Application (Aplicación)

Contiene los casos de uso que orquestan la lógica de negocio.

```typescript
// src/modules/products/application/use-cases/ProductUseCases.ts
export class ProductUseCases {
  constructor(private productRepo: ProductRepository) {}

  async createProduct(dto: CreateProductDTO): Promise<Product> {
    // Validaciones de negocio
    if (dto.price < 0) throw new Error('Price cannot be negative');
    
    const product: Product = {
      id: generateId(),
      ...dto
    };
    
    await this.productRepo.save(product);
    return product;
  }
}
```

### 3. Infrastructure (Infraestructura)

Implementa las interfaces definidas en el dominio.

```typescript
// src/modules/products/infrastructure/repositories/SQLiteProductRepository.ts
export class SQLiteProductRepository implements ProductRepository {
  async findById(id: string): Promise<Product | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return result ? this.toDomain(result) : null;
  }
}
```

### 4. Presentation (Presentación)

Componentes React Native que interactúan con el usuario.

```typescript
// src/modules/products/presentation/screens/ProductsScreen.tsx
export function ProductsScreen() {
  const { products, loading } = useProducts();
  
  if (loading) return <ProductsSkeleton />;
  
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => <ProductCard product={item} />}
      keyExtractor={item => item.id}
    />
  );
}
```

## Patrones de Diseño

### 1. Repository Pattern

Abstrae el acceso a datos, permitiendo cambiar implementaciones sin afectar la lógica de negocio.

### 2. Use Cases

Encapsulan la lógica de negocio específica, haciendo el código más testeable y reutilizable.

### 3. Dependency Injection

Las dependencias se inyectan en lugar de crearse directamente, facilitando testing y flexibilidad.

### 4. DTOs (Data Transfer Objects)

Objetos planos para transferir datos entre capas, desacoplando las representaciones.

## Base de Datos

### Esquema

```sql
-- Tabla principal de productos
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  familyId TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de familias
CREATE TABLE families (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_products_familyId ON products(familyId);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_families_name ON families(name);
```

### Migraciones

El sistema usa migraciones versionadas para manejar cambios en el esquema:

```typescript
// src/shared/infrastructure/migrations/001_schema_base.ts
export const migration: Migration = {
  version: 1,
  name: 'schema_base',
  up: `
    CREATE TABLE products (...);
    CREATE TABLE families (...);
  `,
  down: `
    DROP TABLE products;
    DROP TABLE families;
  `
};
```

## Seguridad

### Encriptación

```typescript
// Datos sensibles encriptados
const encrypted = await encryption.encrypt(sensitiveData);
```

### Permisos

```typescript
// Control por rol
if (permissions.canDelete('products')) {
  await deleteProduct.execute(id);
}
```

### Auditoría

```typescript
// Log de actividades
await audit.log('data_deleted', userId, 'products', productId);
```

## Testing

### Estrategia

1. **Unit Tests**: Prueban funciones aisladas
2. **Integration Tests**: Prueban interacción entre módulos
3. **E2E Tests**: Prueban flujos completos

### Cobertura

La cobertura mínima aceptable es del 80%.

```bash
npm test -- --coverage
```

## Performance

### Optimizaciones

1. **Índices en SQLite**: Consultas frecuentes indexadas
2. **Virtualización**: FlatList para listas grandes
3. **Lazy Loading**: Carga bajo demanda
4. **Memoización**: Evitar re-renders innecesarios

## Escalabilidad

### Nuevo Módulo

1. Crear estructura en `src/modules/nuevo-modulo/`
2. Implementar domain, application, infrastructure, presentation
3. Agregar migración si es necesario
4. Crear tests
5. Registrar en dependencies.tsx

## Diagrama de Componentes

```
App
├── Navigation
│   ├── HomeScreen
│   ├── ProductsScreen
│   ├── FamiliesScreen
│   ├── ClientsScreen
│   ├── BackupScreen
│   └── SettingsScreen
├── Shared Components
│   ├── Button
│   ├── Card
│   ├── Input
│   └── Skeletons
└── Services
    ├── Database
    ├── Encryption
    ├── Permissions
    └── Audit
```

## Decisiones de Arquitectura

| Decisión | Alternativa | Razón |
|----------|-------------|-------|
| SQLite | Realm, WatermelonDB | Simplicidad, sin dependencias nativas |
| Clean Architecture | MVC | Mejor separación de capas |
| TypeScript | JavaScript | Type safety, mejor DX |
| Expo | React Native CLI | Build simplificado, EAS |
