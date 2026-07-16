# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Multi-agent development workflow
- Real-time monitoring of parallel development

### Changed
- Improved development process with parallel agents

## [2.1.0] - 2026-07-16

### Added
- **Backup System**
  - Complete backup via ADB (DB, images, PDFs, preferences)
  - Restore from backup with validation
  - Export families/products to JSON
  - Incremental backup support
  - Integrity verification
  - Automatic compression

- **Backup UI Module**
  - BackupSettingsScreen: main settings interface
  - BackupHistory: list of previous backups with restore option
  - AutoBackupToggle: automatic backup configuration
  - ManualBackupButton: create backup on demand

- **Database Migrations**
  - Versioned migration system
  - 8 migrations for schema evolution
  - Performance indexes
  - Audit log table

- **Cascade Delete Protection**
  - Prevents deleting families with active products
  - Force delete option for admins
  - Product count validation

- **Security Module**
  - Encryption service (SHA256)
  - Role-based permissions (admin/seller/viewer)
  - Session management with timeout
  - Audit logging system

- **UX/UI Improvements**
  - Global search hook (useSearch)
  - Skeleton loading components
  - Theme system (colors, typography, spacing)
  - Onboarding screens with animations

- **Testing**
  - Unit tests for all modules
  - Integration tests for backup system
  - E2E tests for critical flows
  - >80% code coverage

- **DevOps**
  - GitHub Actions CI/CD
  - Automated builds with EAS
  - Semantic versioning
  - CHANGELOG generation
  - Staging environment
  - Rollback scripts

- **Documentation**
  - Comprehensive README
  - Architecture documentation
  - Development guide

### Changed
- Refactored product list with FlatList virtualization
- Improved theme system with semantic colors
- Enhanced onboarding with animations

### Fixed
- Screen blanking issue on Kali
- Database query optimization
- Performance improvements

## [2.0.0] - 2026-07-15

### Added
- Editorial module
- Bottom menu fix
- Version bump

### Changed
- Merged main editorial experience into playstore

## [1.0.0] - 2026-07-14

### Added
- Initial release
- Product management
- Family management
- Client management
- Basic inventory tracking

[Unreleased]: https://github.com/stredes/catalog/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/stredes/catalog/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/stredes/catalog/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/stredes/catalog/releases/tag/v1.0.0
