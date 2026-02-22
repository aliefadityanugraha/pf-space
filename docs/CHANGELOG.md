# Changelog

All notable changes to PF Space project will be documented in this file.

## [Unreleased]

### Added

- **Centralized Validation**: Implementasi Zod schema untuk validasi request secara terpusat
  - Middleware `validateRequest` untuk body, params, dan query
  - Transformasi data otomatis (misal: ID dari string ke number)
  - Penanganan error validasi yang konsisten

- **Unit Testing**: Suite pengetesan komprehensif untuk backend
  - Tests untuk `FilmService.normalizeData` (crew cleaning & sanitization)
  - Tests untuk `Validation Middleware` (Zod integration)
  - Tests untuk `Sanitization Utility` (XSS prevention)

### Changed

- **Refactoring Controller**: Pembersihan logika bisnis dari controller ke service layer
  - `FilmController` sekarang lebih ramping (Thin Controller)
  - Pembersihan data `crew` dipindahkan ke `FilmService.normalizeData`
  - Sanitasi HTML dipindahkan ke service layer untuk konsistensi

- **FilmScene Management**: Refactor `FilmSceneController` menggunakan centralized validation
  - Penghapusan manual `parseInt` dan `isNaN` checks
  - Proteksi rute yang lebih ketat dengan Zod

### Fixed

- **Data Consistency**: Penanganan field `crew` yang lebih aman dari input yang tidak valid
- **Security**: Sanitasi HTML yang lebih merata di seluruh operasi create/update film
- **Error Handling**: Standardisasi pesan error untuk kegagalan validasi dan otorisasi

### Optimized

- **Code Reuse**: Ekstraksi logika pembersihan data ke service layer mencegah duplikasi kode antara create dan update.

- **Draft System**: Auto-save form data ke localStorage untuk mencegah kehilangan data
  - Composable `useFilmDraft` untuk mengelola draft
  - Auto-save setiap 3 detik saat form diisi
  - Draft banner untuk restore atau discard draft
  - Draft expiry setelah 7 hari
  - Visual indicator untuk draft tersimpan

- **Resumable Upload**: Implementasi Tus.io protocol untuk upload yang dapat dilanjutkan
  - Support resume upload setelah koneksi terputus
  - Progress tracking dengan visual progress bar
  - Retry mechanism dengan exponential backoff
  - Support file hingga 1GB untuk video

- **Documentation**: Dokumentasi lengkap untuk developer
  - `docs/PROJECT_STRUCTURE.md` - Struktur project dan arsitektur
  - `docs/UPLOAD_SYSTEM.md` - Sistem upload dan draft management
  - `docs/CLEANUP_GUIDE.md` - Panduan maintenance dan cleanup
  - `docs/TESTING_GUIDE.md` - Panduan testing lengkap
  - `QUICK_START.md` - Quick start guide untuk setup project
  - `CONTRIBUTING.md` - Panduan kontribusi untuk developer
  - `PROJECT_OVERVIEW.md` - Overview lengkap project
  - `CODE_CLEANUP_REPORT.md` - Laporan cleanup backend
  - `FRONTEND_CLEANUP_REPORT.md` - Laporan cleanup frontend

- **Testing**: Unit tests untuk composable
  - Tests untuk `useFilmDraft` composable
  - Coverage untuk save, load, clear, dan expire draft

### Changed

- **FilmForm Component**: Enhanced dengan draft management
  - Integrasi dengan `useFilmDraft` composable
  - Draft banner notification
  - Auto-save functionality
  - Clear draft setelah submit berhasil

### Removed

- **Unused Components**: Cleanup frontend components
  - Removed `DashboardHero.vue` (tidak digunakan)
  - Removed `DashboardSection.vue` (tidak digunakan)
  - Removed `CuratedFilmCard.vue` (tidak digunakan)
  - Removed `UserProfileCard.vue` (tidak digunakan)
- **Unused Functions**: Cleanup utility functions
  - Removed `formatYear()` dari `lib/format.js` (tidak digunakan)

### Fixed

- Upload flow yang lebih robust dengan error handling
- Validasi file type dan size sebelum upload
- Memory leak prevention dengan cleanup di onUnmounted
- Template structure di FilmForm.vue (missing/invalid closing tags)

### Optimized

- Removed unnecessary console.log dari upload progress
- Simplified progress callback untuk non-video files
- Reduced bundle size dengan menghapus unused code (~175 lines)

## [1.0.0] - 2024-12-30

### Initial Release

- Backend API dengan Fastify
- Frontend dengan Vue 3
- Authentication dengan Better Auth
- Film management system
- Discussion system
- Voting system
- Collections/bookmark feature
- AI chat integration
- Admin dashboard
- Role-based access control

---

## Version Format

Format: `[MAJOR.MINOR.PATCH]`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements
