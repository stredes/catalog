#!/usr/bin/env node

/**
 * Script de migración de datos para clientes.
 * 
 * Convierte un backup JSON exportado desde la versión vieja (com.anonymous.catalogclean,
 * schemaVersion 9) a un formato compatible con la versión nueva (com.catalogclean.app,
 * schemaVersion 10).
 *
 * Uso:
 *   node migrate-backup.js <input.json> [output.json]
 *
 * El archivo de salida se puede importar directamente desde la app nueva
 * usando la función de restaurar backup.
 */

const fs = require('fs');
const path = require('path');

const OLD_PACKAGE = 'com.anonymous.catalogclean';
const NEW_PACKAGE = 'com.catalogclean.app';
const TARGET_SCHEMA_VERSION = 10;

function migrateBackup(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log(`Backup leído: schemaVersion ${data.schemaVersion}, ${data.families?.length ?? 0} familias, ${data.products?.length ?? 0} productos`);

  // Actualizar versión del schema
  data.schemaVersion = TARGET_SCHEMA_VERSION;

  // Actualizar rutas de imágenes si apuntan al paquete viejo
  let imagesUpdated = 0;
  if (data.products) {
    for (const product of data.products) {
      if (product.photoUri && product.photoUri.includes(OLD_PACKAGE)) {
        product.photoUri = product.photoUri.replace(OLD_PACKAGE, NEW_PACKAGE);
        imagesUpdated++;
      }
    }
  }

  // Actualizar logo del perfil
  if (data.profile) {
    for (const prof of data.profile) {
      if (prof.logoUri && prof.logoUri.includes(OLD_PACKAGE)) {
        prof.logoUri = prof.logoUri.replace(OLD_PACKAGE, NEW_PACKAGE);
        imagesUpdated++;
      }
    }
  }

  // Asegurar que orders exista (schema v9 puede no tener orders en el backup)
  if (!data.orders) {
    data.orders = [];
  }

  // Asegurar que schemaMigrations exista
  if (!data.schemaMigrations) {
    data.schemaMigrations = [];
  }

  // Agregar migración v10 si no existe
  const hasV10 = data.schemaMigrations.some(m => m.version === 10);
  if (!hasV10) {
    data.schemaMigrations.push({
      version: 10,
      appliedAt: new Date().toISOString(),
    });
  }

  // Agregar images como data URI si hay imágenes en disco
  // (esto es para backups que incluyen las imágenes como base64)
  if (!data.images) {
    data.images = {};
  }

  console.log(`Migración completada:`);
  console.log(`  - schemaVersion: ${data.schemaVersion}`);
  console.log(`  - Rutas de imágenes actualizadas: ${imagesUpdated}`);
  console.log(`  - Orders: ${data.orders.length}`);
  console.log(`  - Paquete destino: ${NEW_PACKAGE}`);

  return data;
}

// Main
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Uso: node migrate-backup.js <input.json> [output.json]');
  process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputPath = args[1] ? path.resolve(args[1]) : inputPath.replace('.json', '_migrated.json');

if (!fs.existsSync(inputPath)) {
  console.error(`Archivo no encontrado: ${inputPath}`);
  process.exit(1);
}

const migrated = migrateBackup(inputPath);
fs.writeFileSync(outputPath, JSON.stringify(migrated, null, 2));
console.log(`Backup migrado guardado en: ${outputPath}`);
