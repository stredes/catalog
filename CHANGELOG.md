# Changelog

## v3.1.8 (2025-07-22)

### Fixed
- **Package name alignment**: Corrected Android package name to `com.anonymous.catalogclean` across all configs and scripts
- **Backup/Restore scripts**: Updated `PACKAGE` variable in `backup/backup.sh` and `backup/restore.sh`
- **Data preservation**: Backup metadata version bumped to `3.1.8`

### Changed
- `app.json`: `version` `3.1.7` → `3.1.8`, `versionCode` `14` → `15`, `package` `com.catalogclean.app` → `com.anonymous.catalogclean`
- `src/shared/infrastructure/DatabaseBackupService.ts`: Export version `3.1.7` → `3.1.8`
- `src/shared/infrastructure/sqlite.ts`: Auto-backup version `3.1.7` → `3.1.8`

---

## v3.1.7

_(see git log for prior history)_
