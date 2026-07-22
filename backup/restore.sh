#!/usr/bin/env bash
# ============================================================
# restore.sh — Restaurar backup de catalog-clean (Android)
#
# Uso:
#   ./restore.sh /ruta/al/backup          Restaurar desde directorio
#   ./restore.sh /ruta/backup.tar.gz      Restaurar desde archivo comprimido
#   ./restore.sh                          Listar backups disponibles
#
# Opciones:
#   --db-only       Restaurar solo la base de datos
#   --files-only    Restaurar solo archivos (imagenes, PDFs)
#   --prefs-only    Restaurar solo preferencias
#   --no-prefs      Restaurar todo excepto preferencias
#   --list          Listar backups disponibles
#   --dry-run       Mostrar que se restauraria sin ejecutar
#
# Requisitos: adb conectado, app instalada y CERRADA.
# Paquete Android: com.anonymous.catalogclean
# ============================================================
set -euo pipefail

# --- Config ---
PACKAGE="com.anonymous.catalogclean"
DB_NAME="catalog.db"

DB_DIR="/data/data/${PACKAGE}/databases"
FILES_DIR="/data/data/${PACKAGE}/files"

# --- Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()   { echo -e "${CYAN}[RESTORE]${NC} $*"; }
ok()    { echo -e "${GREEN}  ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}  ⚠${NC} $*"; }
fail()  { echo -e "${RED}  ✗${NC} $*" >&2; exit 1; }
header() { echo -e "\n${BOLD}${CYAN}── $* ──${NC}"; }

# --- Verificaciones ---
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

# --- Listar backups disponibles ---
list_backups() {
    local backup_root="${1:-./backups}"

    header "Backups disponibles"

    if [[ ! -d "$backup_root" ]]; then
        warn "No existe el directorio: ${backup_root}"
        return 1
    fi

    local count=0
    echo -e "  ${BOLD}Directorio:${NC} ${backup_root}"
    echo ""

    for dir in "${backup_root}"/????-??-??_??????/; do
        [[ ! -d "$dir" ]] && continue
        count=$((count + 1))
        local base
        base=$(basename "$dir")
        local manifest="${dir}/manifest.json"

        echo -e "  ${CYAN}${count}.${NC} ${base}"

        if [[ -f "$manifest" ]]; then
            local db_size img_count pdf_count families products
            db_size=$(python3 -c "import json; m=json.load(open('${manifest}')); print(m.get('database',{}).get('sizeBytes','?'))" 2>/dev/null || echo "?")
            families=$(python3 -c "import json; m=json.load(open('${manifest}')); print(m.get('counts',{}).get('families','?'))" 2>/dev/null || echo "?")
            products=$(python3 -c "import json; m=json.load(open('${manifest}')); print(m.get('counts',{}).get('products','?'))" 2>/dev/null || echo "?")
            img_count=$(python3 -c "import json; m=json.load(open('${manifest}')); print(m.get('counts',{}).get('productImages','?'))" 2>/dev/null || echo "?")
            pdf_count=$(python3 -c "import json; m=json.load(open('${manifest}')); print(m.get('counts',{}).get('catalogPdfs','?'))" 2>/dev/null || echo "?")
            echo -e "    DB: ${db_size} bytes | Familias: ${families} | Productos: ${products}"
            echo -e "    Imagenes: ${img_count} | PDFs: ${pdf_count}"
        fi

        # Verificar si hay archivo comprimido
        if [[ -f "${backup_root}/${base}.tar.gz" ]]; then
            local archive_size
            archive_size=$(stat -c%s "${backup_root}/${base}.tar.gz" 2>/dev/null || stat -f%z "${backup_root}/${base}.tar.gz" 2>/dev/null || echo "?")
            echo -e "    ${GREEN}Comprimido:${NC} ${base}.tar.gz (${archive_size} bytes)"
        fi
        echo ""
    done

    if [[ "$count" -eq 0 ]]; then
        warn "No se encontraron backups en ${backup_root}"
        return 1
    fi

    echo -e "  ${BOLD}Total:${NC} ${count} backups"
    echo ""
}

# --- Resolver directorio de backup ---
resolve_backup_dir() {
    local input="$1"

    # Si es un .tar.gz, extraerlo primero
    if [[ -f "$input" && "$input" == *.tar.gz ]]; then
        local parent
        parent=$(dirname "$input")
        local base
        base=$(basename "$input" .tar.gz)
        local extract_dir="${parent}/${base}"

        if [[ -d "$extract_dir" ]]; then
            log "Directorio ya extraido: ${extract_dir}"
        else
            log "Descomprimiendo: ${input}"
            (cd "$parent" && tar -xzf "${base}.tar.gz")
            ok "Extraido a: ${extract_dir}"
        fi
        echo "$extract_dir"
        return 0
    fi

    # Si es un directorio, usarlo directamente
    if [[ -d "$input" ]]; then
        echo "$input"
        return 0
    fi

    fail "No se encontro el backup: ${input}"
}

# --- Verificar integridad del backup ---
verify_backup() {
    local dir="$1"
    header "Verificar integridad"

    local errors=0

    if [[ ! -f "${dir}/${DB_NAME}" ]]; then
        warn "No se encontro ${DB_NAME}"
        errors=$((errors + 1))
    else
        local size
        size=$(stat -c%s "${dir}/${DB_NAME}" 2>/dev/null || stat -f%z "${dir}/${DB_NAME}" 2>/dev/null || echo 0)
        if [[ "$size" -lt 100 ]]; then
            warn "${DB_NAME} parece corrupto (${size} bytes)"
            errors=$((errors + 1))
        else
            ok "${DB_NAME}: ${size} bytes"
        fi
    fi

    if [[ -f "${dir}/manifest.json" ]]; then
        ok "manifest.json presente"
    else
        warn "manifest.json no encontrado (backup antiguo?)"
    fi

    local img_count=0
    [[ -d "${dir}/product-images" ]] && img_count=$(find "${dir}/product-images" -type f 2>/dev/null | wc -l)
    ok "Imagenes: ${img_count}"

    local pdf_count=0
    [[ -d "${dir}/catalog-pdfs" ]] && pdf_count=$(find "${dir}/catalog-pdfs" -type f 2>/dev/null | wc -l)
    ok "PDFs: ${pdf_count}"

    if [[ "$errors" -gt 0 ]]; then
        warn "Se encontraron ${errors} problemas de integridad."
        read -r -p "  ¿Continuar con la restauracion? (s/N): " confirm
        if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
            fail "Restauracion cancelada por el usuario."
        fi
    fi
}

# --- Confirmar restauracion ---
confirm_restore() {
    local dir="$1"
    local mode="$2"

    echo ""
    echo -e "${YELLOW}╔══════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║   ADVERTENCIA: Esto sobrescribira datos  ║${NC}"
    echo -e "${YELLOW}║   actuales en el dispositivo.            ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}Backup:${NC}     $(basename "$dir")"
    echo -e "  ${BOLD}Modo:${NC}       ${mode}"
    echo -e "  ${BOLD}Paquete:${NC}   ${PACKAGE}"
    echo ""

    read -r -p "  ¿Confirmar restauracion? (s/N): " confirm
    if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
        fail "Restauracion cancelada por el usuario."
    fi
}

# --- Restaurar base de datos ---
restore_database() {
    local dir="$1"
    local dry_run="$2"

    header "Restaurar base de datos"

    if [[ ! -f "${dir}/${DB_NAME}" ]]; then
        warn "No hay ${DB_NAME} para restaurar."
        return 1
    fi

    if [[ "$dry_run" == "true" ]]; then
        ok "[DRY-RUN] Se restauraria: ${DB_NAME}"
        return 0
    fi

    log "Copiando base de datos al dispositivo..."

    # Copiar DB al sdcard temporalmente y luego usar run-as para colocarla
    adb push "${dir}/${DB_NAME}" /sdcard/restore_catalog_tmp.db 2>/dev/null \
        || fail "No se pudo copiar la DB al dispositivo."

    adb shell "run-as ${PACKAGE} cp /sdcard/restore_catalog_tmp.db ${DB_DIR}/${DB_NAME}" 2>/dev/null \
        || fail "No se pudo colocar la DB en el directorio de la app."

    # Copiar WAL si existe
    if [[ -f "${dir}/${DB_NAME}-wal" ]]; then
        adb push "${dir}/${DB_NAME}-wal" /sdcard/restore_catalog_tmp.db-wal 2>/dev/null || true
        adb shell "run-as ${PACKAGE} cp /sdcard/restore_catalog_tmp.db-wal ${DB_DIR}/${DB_NAME}-wal" 2>/dev/null || true
    fi

    # Copiar SHM si existe
    if [[ -f "${dir}/${DB_NAME}-shm" ]]; then
        adb push "${dir}/${DB_NAME}-shm" /sdcard/restore_catalog_tmp.db-shm 2>/dev/null || true
        adb shell "run-as ${PACKAGE} cp /sdcard/restore_catalog_tmp.db-shm ${DB_DIR}/${DB_NAME}-shm" 2>/dev/null || true
    fi

    # Limpiar temporales
    adb shell "rm -f /sdcard/restore_catalog_tmp.db /sdcard/restore_catalog_tmp.db-wal /sdcard/restore_catalog_tmp.db-shm" 2>/dev/null || true

    ok "Base de datos restaurada."
}

# --- Restaurar archivos ---
restore_files() {
    local dir="$1"
    local dry_run="$2"

    header "Restaurar archivos"

    # Imagenes
    if [[ -d "${dir}/product-images" ]]; then
        local img_count
        img_count=$(find "${dir}/product-images" -type f 2>/dev/null | wc -l)
        if [[ "$img_count" -gt 0 ]]; then
            if [[ "$dry_run" == "true" ]]; then
                ok "[DRY-RUN] Se restaurarian ${img_count} imagenes"
            else
                log "Copiando imagenes de productos..."
                adb shell "mkdir -p ${FILES_DIR}/product-images/" 2>/dev/null || true
                adb push "${dir}/product-images/." /sdcard/restore_catalog_tmp_images/ 2>/dev/null || true
                adb shell "cp -r /sdcard/restore_catalog_tmp_images/. ${FILES_DIR}/product-images/" 2>/dev/null || true
                adb shell "rm -rf /sdcard/restore_catalog_tmp_images/" 2>/dev/null || true
                ok "Imagenes restauradas: ${img_count}"
            fi
        else
            warn "Directorio de imagenes vacio."
        fi
    else
        warn "No hay imagenes para restaurar."
    fi

    # PDFs
    if [[ -d "${dir}/catalog-pdfs" ]]; then
        local pdf_count
        pdf_count=$(find "${dir}/catalog-pdfs" -type f 2>/dev/null | wc -l)
        if [[ "$pdf_count" -gt 0 ]]; then
            if [[ "$dry_run" == "true" ]]; then
                ok "[DRY-RUN] Se restaurarian ${pdf_count} PDFs"
            else
                log "Copiando PDFs de catalogos..."
                adb shell "mkdir -p ${FILES_DIR}/catalog-pdfs/" 2>/dev/null || true
                adb push "${dir}/catalog-pdfs/." /sdcard/restore_catalog_tmp_pdfs/ 2>/dev/null || true
                adb shell "cp -r /sdcard/restore_catalog_tmp_pdfs/. ${FILES_DIR}/catalog-pdfs/" 2>/dev/null || true
                adb shell "rm -rf /sdcard/restore_catalog_tmp_pdfs/" 2>/dev/null || true
                ok "PDFs restaurados: ${pdf_count}"
            fi
        else
            warn "Directorio de PDFs vacio."
        fi
    else
        warn "No hay PDFs para restaurar."
    fi
}

# --- Restaurar preferencias ---
restore_preferences() {
    local dir="$1"
    local dry_run="$2"

    header "Restaurar preferencias"

    local prefs_dir="${dir}/shared-preferences"
    if [[ ! -d "$prefs_dir" ]]; then
        warn "No hay preferencias para restaurar."
        return 0
    fi

    local count
    count=$(find "$prefs_dir" -type f 2>/dev/null | wc -l)
    if [[ "$count" -eq 0 ]]; then
        warn "Directorio de preferencias vacio."
        return 0
    fi

    if [[ "$dry_run" == "true" ]]; then
        ok "[DRY-RUN] Se restaurarian ${count} archivos de preferencias"
        return 0
    fi

    log "Copiando preferencias..."

    adb shell "mkdir -p /data/data/${PACKAGE}/shared_preferences/" 2>/dev/null || true

    find "$prefs_dir" -type f | while IFS= read -r file; do
        local base
        base=$(basename "$file")
        adb push "$file" /sdcard/restore_catalog_tmp_prefs.xml 2>/dev/null || true
        adb shell "run-as ${PACKAGE} cp /sdcard/restore_catalog_tmp_prefs.xml /data/data/${PACKAGE}/shared_preferences/${base}" 2>/dev/null || true
    done

    adb shell "rm -f /sdcard/restore_catalog_tmp_prefs.xml" 2>/dev/null || true

    ok "Preferencias restauradas: ${count} archivos"
}

# --- Main ---
main() {
    local target=""
    local db_only=false
    local files_only=false
    local prefs_only=false
    local no_prefs=false
    local list_mode=false
    local dry_run=false
    local backup_root="./backups"

    # Parsear argumentos
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --db-only)      db_only=true;      shift ;;
            --files-only)   files_only=true;    shift ;;
            --prefs-only)   prefs_only=true;    shift ;;
            --no-prefs)     no_prefs=true;      shift ;;
            --list)         list_mode=true;     shift ;;
            --dry-run)      dry_run=true;       shift ;;
            --help|-h)
                echo "Uso: $0 [OPCIONES] [RUTA_BACKUP]"
                echo ""
                echo "Opciones:"
                echo "  --db-only       Restaurar solo la base de datos"
                echo "  --files-only    Restaurar solo archivos (imagenes, PDFs)"
                echo "  --prefs-only    Restaurar solo preferencias"
                echo "  --no-prefs      Restaurar todo excepto preferencias"
                echo "  --list          Listar backups disponibles"
                echo "  --dry-run       Mostrar que se restauraria sin ejecutar"
                echo "  -h, --help      Mostrar esta ayuda"
                echo ""
                echo "Ejemplos:"
                echo "  $0 --list"
                echo "  $0 ./backups/2026-07-16_120000"
                echo "  $0 --db-only ./backups/2026-07-16_120000"
                echo "  $0 --dry-run ./backups/2026-07-16_120000"
                exit 0
                ;;
            *)
                if [[ -z "$target" ]]; then
                    target="$1"
                else
                    fail "Argumento no reconocido: $1"
                fi
                shift
                ;;
        esac
    done

    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   catalog-clean — Restaurar Backup       ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo ""

    # Modo listado
    if [[ "$list_mode" == "true" ]]; then
        list_backups "$backup_root"
        exit 0
    fi

    # Sin destino: listar disponibles
    if [[ -z "$target" ]]; then
        list_backups "$backup_root"
        exit 0
    fi

    # Verificaciones
    check_adb
    check_package

    # Resolver directorio
    local backup_dir
    backup_dir=$(resolve_backup_dir "$target")

    # Verificar integridad
    verify_backup "$backup_dir"

    # Calcular modo de restauracion
    local mode="completo"
    if [[ "$db_only" == "true" ]]; then
        mode="solo DB"
    elif [[ "$files_only" == "true" ]]; then
        mode="solo archivos"
    elif [[ "$prefs_only" == "true" ]]; then
        mode="solo preferencias"
    elif [[ "$no_prefs" == "true" ]]; then
        mode="DB + archivos (sin preferencias)"
    fi

    if [[ "$dry_run" == "true" ]]; then
        mode="[DRY-RUN] ${mode}"
    fi

    # Confirmar
    confirm_restore "$backup_dir" "$mode"

    # Ejecutar restauracion
    if [[ "$db_only" == "true" ]]; then
        restore_database "$backup_dir" "$dry_run"
    elif [[ "$files_only" == "true" ]]; then
        restore_files "$backup_dir" "$dry_run"
    elif [[ "$prefs_only" == "true" ]]; then
        restore_preferences "$backup_dir" "$dry_run"
    elif [[ "$no_prefs" == "true" ]]; then
        restore_database "$backup_dir" "$dry_run"
        restore_files "$backup_dir" "$dry_run"
    else
        restore_database "$backup_dir" "$dry_run"
        restore_files "$backup_dir" "$dry_run"
        restore_preferences "$backup_dir" "$dry_run"
    fi

    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   Restauracion completada                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${BOLD}Nota:${NC} Abre la app para verificar los datos."
    echo -e "  ${BOLD}Si la app no inicia:${NC} desinstala y vuelve a instalar."
    echo ""
}

main "$@"
