#!/usr/bin/env bash
# ============================================================
# backup.sh — Backup completo de catalog-clean (Android)
#
# Uso:
#   ./backup.sh                    Backup a ./backups/YYYY-MM-DD_HHMMSS/
#   ./backup.sh /ruta/al/destino   Backup a ruta personalizada
#
# Incluye:
#   - Base de datos SQLite (catalog.db + WAL/SHM)
#   - Imagenes de productos
#   - PDFs de catalogos
#   - Preferencias (auth, onboarding, etc.)
#   - Exportacion de familias y productos a JSON
#
# Requisitos: adb conectado, app instalada en el dispositivo.
# Paquete Android: com.anonymous.catalogclean
# ============================================================
set -euo pipefail

# --- Config ---
PACKAGE="com.anonymous.catalogclean"
DB_NAME="catalog.db"

# Rutas internas de la app (Android)
DB_DIR="/data/data/${PACKAGE}/databases"
FILES_DIR="/data/data/${PACKAGE}/files"

# --- Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()   { echo -e "${CYAN}[BACKUP]${NC} $*"; }
ok()    { echo -e "${GREEN}  ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}  ⚠${NC} $*"; }
fail()  { echo -e "${RED}  ✗${NC} $*" >&2; exit 1; }
header() { echo -e "\n${BOLD}${CYAN}── $* ──${NC}"; }

timestamp() { date '+%Y-%m-%d_%H%M%S'; }

# --- Verificaciones previas ---
check_adb() {
    if ! command -v adb &>/dev/null; then
        fail "adb no encontrado. Instala Android SDK Platform Tools."
    fi

    local devices
    devices=$(adb devices 2>/dev/null | grep -cw 'device' || true)
    if [[ "$devices" -lt 1 ]]; then
        fail "No hay dispositivos Android conectados via USB/debugging."
    fi
}

check_package() {
    if ! adb shell pm list packages 2>/dev/null | grep -q "^package:${PACKAGE}$"; then
        fail "La app ${PACKAGE} no esta instalada en el dispositivo."
    fi
}

check_sqlite3() {
    if ! command -v sqlite3 &>/dev/null; then
        warn "sqlite3 no encontrado. Se exportara la DB cruda sin extraer JSON."
        return 1
    fi
    return 0
}

# --- Backup de la base de datos ---
backup_database() {
    local dest="$1"
    header "Base de datos"

    adb shell "run-as ${PACKAGE} cat ${DB_DIR}/${DB_NAME}" > "${dest}/${DB_NAME}" 2>/dev/null \
        || adb shell "cat ${DB_DIR}/${DB_NAME}" > "${dest}/${DB_NAME}" 2>/dev/null \
        || fail "No se pudo leer la base de datos. La app necesita estar cerrada."

    adb shell "run-as ${PACKAGE} cat ${DB_DIR}/${DB_NAME}-wal" > "${dest}/${DB_NAME}-wal" 2>/dev/null || true
    adb shell "run-as ${PACKAGE} cat ${DB_DIR}/${DB_NAME}-shm" > "${dest}/${DB_NAME}-shm" 2>/dev/null || true

    local size
    size=$(stat -c%s "${dest}/${DB_NAME}" 2>/dev/null || stat -f%z "${dest}/${DB_NAME}" 2>/dev/null || echo 0)
    if [[ "$size" -lt 100 ]]; then
        fail "La base de datos extraida parece vacia (${size} bytes)."
    fi

    ok "catalog.db: ${size} bytes"
}

# --- Exportar familias y productos a JSON ---
export_tables_json() {
    local dest="$1"

    if ! check_sqlite3; then
        return 0
    fi

    header "Exportar familias y productos (JSON)"

    # Fusionar WAL antes de leer
    local tmp_db="${dest}/.tmp_catalog.db"
    cp "${dest}/${DB_NAME}" "$tmp_db"
    if [[ -s "${dest}/${DB_NAME}-wal" ]]; then
        sqlite3 "$tmp_db" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
    fi

    # Exportar familias
    local families_count
    sqlite3 -json "$tmp_db" "SELECT id, name, createdAt, updatedAt FROM families ORDER BY name;" \
        > "${dest}/familias.json" 2>/dev/null || echo "[]" > "${dest}/familias.json"
    families_count=$(sqlite3 "$tmp_db" "SELECT COUNT(*) FROM families;" 2>/dev/null || echo 0)
    ok "Familias exportadas: ${families_count} registros -> familias.json"

    # Exportar productos
    local products_count
    sqlite3 -json "$tmp_db" \
        "SELECT id, name, code, price, stock, format, photoUri, familyId, createdAt, updatedAt FROM products ORDER BY name;" \
        > "${dest}/productos.json" 2>/dev/null || echo "[]" > "${dest}/productos.json"
    products_count=$(sqlite3 "$tmp_db" "SELECT COUNT(*) FROM products;" 2>/dev/null || echo 0)
    ok "Productos exportados: ${products_count} registros -> productos.json"

    # Exportar catalogs
    sqlite3 -json "$tmp_db" \
        "SELECT id, name, familyId, familyIds, format, productIds, pdfUri, createdAt FROM catalogs ORDER BY createdAt;" \
        > "${dest}/catalogos.json" 2>/dev/null || echo "[]" > "${dest}/catalogos.json"
    local catalogs_count
    catalogs_count=$(sqlite3 "$tmp_db" "SELECT COUNT(*) FROM catalogs;" 2>/dev/null || echo 0)
    ok "Catalogos exportados: ${catalogs_count} registros -> catalogos.json"

    # Exportar profile
    sqlite3 -json "$tmp_db" \
        "SELECT * FROM profile;" \
        > "${dest}/perfil.json" 2>/dev/null || echo "[]" > "${dest}/perfil.json"
    ok "Perfil exportado -> perfil.json"

    # Estadisticas resumen
    local migrations_ver
    migrations_ver=$(sqlite3 "$tmp_db" "SELECT MAX(version) FROM schema_migrations;" 2>/dev/null || echo "?")
    ok "Version del schema: ${migrations_ver}"

    rm -f "$tmp_db"
}

# --- Backup de archivos (imagenes, PDFs) ---
backup_files() {
    local dest="$1"
    header "Archivos (imagenes y PDFs)"

    local images_dir="${dest}/product-images"
    local pdfs_dir="${dest}/catalog-pdfs"

    mkdir -p "$images_dir" "$pdfs_dir"

    # Imagenes de productos
    local img_count
    img_count=$(adb shell "run-as ${PACKAGE} ls ${FILES_DIR}/product-images/ 2>/dev/null | wc -l" || echo 0)
    img_count=$(echo "$img_count" | tr -d '[:space:]')
    if [[ "$img_count" -gt 0 ]]; then
        adb shell "run-as ${PACKAGE} cp -r ${FILES_DIR}/product-images/." /sdcard/backup_catalog_tmp_images/ 2>/dev/null || true
        adb pull /sdcard/backup_catalog_tmp_images/ "$images_dir/" 2>/dev/null || true
        adb shell "rm -rf /sdcard/backup_catalog_tmp_images/" 2>/dev/null || true
        local real_count
        real_count=$(find "$images_dir" -type f 2>/dev/null | wc -l)
        ok "Imagenes de productos: ${real_count} archivos"
    else
        warn "No hay imagenes de productos para copiar."
    fi

    # PDFs de catalogos
    local pdf_count
    pdf_count=$(adb shell "run-as ${PACKAGE} ls ${FILES_DIR}/catalog-pdfs/ 2>/dev/null | wc -l" || echo 0)
    pdf_count=$(echo "$pdf_count" | tr -d '[:space:]')
    if [[ "$pdf_count" -gt 0 ]]; then
        adb shell "run-as ${PACKAGE} cp -r ${FILES_DIR}/catalog-pdfs/." /sdcard/backup_catalog_tmp_pdfs/ 2>/dev/null || true
        adb pull /sdcard/backup_catalog_tmp_pdfs/ "$pdfs_dir/" 2>/dev/null || true
        adb shell "rm -rf /sdcard/backup_catalog_tmp_pdfs/" 2>/dev/null || true
        local real_count
        real_count=$(find "$pdfs_dir" -type f 2>/dev/null | wc -l)
        ok "PDFs de catalogos: ${real_count} archivos"
    else
        warn "No hay PDFs de catalogos para copiar."
    fi
}

# --- Backup de SharedPreferences ---
backup_preferences() {
    local dest="$1"
    header "Preferencias (SharedPreferences)"

    local prefs_dir="${dest}/shared-preferences"
    mkdir -p "$prefs_dir"

    adb shell "run-as ${PACKAGE} ls /data/data/${PACKAGE}/shared_preferences/ 2>/dev/null" \
        | tr -d '\r' \
        | while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            adb shell "run-as ${PACKAGE} cat /data/data/${PACKAGE}/shared_preferences/${file}" \
                > "${prefs_dir}/${file}" 2>/dev/null || true
        done

    local count
    count=$(find "$prefs_dir" -type f 2>/dev/null | wc -l)
    if [[ "$count" -gt 0 ]]; then
        ok "Archivos de preferencias: ${count}"
    else
        warn "No se encontraron preferencias."
    fi
}

# --- Metadata del backup ---
write_manifest() {
    local dest="$1"
    local db_size
    db_size=$(stat -c%s "${dest}/${DB_NAME}" 2>/dev/null || stat -f%z "${dest}/${DB_NAME}" 2>/dev/null || echo 0)

    local img_count=0
    [[ -d "${dest}/product-images" ]] && img_count=$(find "${dest}/product-images" -type f 2>/dev/null | wc -l)

    local pdf_count=0
    [[ -d "${dest}/catalog-pdfs" ]] && pdf_count=$(find "${dest}/catalog-pdfs" -type f 2>/dev/null | wc -l)

    local families_count=0
    [[ -f "${dest}/familias.json" ]] && families_count=$(python3 -c "import json; print(len(json.load(open('${dest}/familias.json'))))" 2>/dev/null || echo "?")

    local products_count=0
    [[ -f "${dest}/productos.json" ]] && products_count=$(python3 -c "import json; print(len(json.load(open('${dest}/productos.json'))))" 2>/dev/null || echo "?")

    cat > "${dest}/manifest.json" <<EOF
{
  "app": "catalog-clean",
  "version": "2.0.0",
  "package": "${PACKAGE}",
  "schemaVersion": 6,
  "backupDate": "$(date -Iseconds)",
  "backupType": "full",
  "database": {
    "file": "${DB_NAME}",
    "sizeBytes": ${db_size}
  },
  "counts": {
    "families": ${families_count},
    "products": ${products_count},
    "productImages": ${img_count},
    "catalogPdfs": ${pdf_count}
  },
  "tables": [
    "families",
    "products",
    "catalogs",
    "profile",
    "schema_migrations"
  ],
  "files": {
    "familias.json": "Exportacion de familias",
    "productos.json": "Exportacion de productos",
    "catalogos.json": "Exportacion de catalogos",
    "perfil.json": "Exportacion de perfil",
    "shared-preferences/": "Preferencias de la app"
  }
}
EOF
    ok "Manifest generado."
}

# --- Comprimir ---
compress_backup() {
    local dest="$1"
    local parent
    parent=$(dirname "$dest")
    local base
    base=$(basename "$dest")

    header "Comprimir"
    (cd "$parent" && tar -czf "${base}.tar.gz" "$base")
    local archive="${parent}/${base}.tar.gz"
    local archive_size
    archive_size=$(stat -c%s "$archive" 2>/dev/null || stat -f%z "$archive" 2>/dev/null || echo 0)
    local archive_mb
    archive_mb=$(echo "scale=2; ${archive_size} / 1048576" | bc 2>/dev/null || echo "?")
    ok "Archivo: ${base}.tar.gz (${archive_mb} MB)"
}

# --- Resumen final ---
print_summary() {
    local dest="$1"
    local archive="${dest}.tar.gz"

    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Backup completado exitosamente         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}Ubicacion:${NC} ${dest}"
    echo -e "  ${BOLD}Archivo:${NC}   ${archive}"
    echo ""
    echo -e "  ${BOLD}Contenido:${NC}"
    [[ -f "${dest}/${DB_NAME}" ]] && echo -e "    - ${DB_NAME}"
    [[ -f "${dest}/familias.json" ]] && echo -e "    - familias.json"
    [[ -f "${dest}/productos.json" ]] && echo -e "    - productos.json"
    [[ -f "${dest}/catalogos.json" ]] && echo -e "    - catalogos.json"
    [[ -f "${dest}/perfil.json" ]] && echo -e "    - perfil.json"
    [[ -d "${dest}/product-images" ]] && echo -e "    - product-images/"
    [[ -d "${dest}/catalog-pdfs" ]] && echo -e "    - catalog-pdfs/"
    [[ -d "${dest}/shared-preferences" ]] && echo -e "    - shared-preferences/"
    echo -e "    - manifest.json"
    echo ""
    echo -e "  ${BOLD}Restaurar:${NC}  ./restore.sh ${dest}"
    echo ""
}

# --- Main ---
main() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   catalog-clean — Backup Completo        ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo ""

    check_adb
    check_package

    local ts
    ts=$(timestamp)

    local dest_root="${1:-./backups}"
    local dest="${dest_root}/${ts}"

    mkdir -p "$dest"

    log "Destino: ${dest}"

    backup_database "$dest"
    export_tables_json "$dest"
    backup_files "$dest"
    backup_preferences "$dest"
    write_manifest "$dest"
    compress_backup "$dest"
    print_summary "$dest"
}

main "$@"
