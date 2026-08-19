# Changelog

Semua perubahan penting pada project PF Space didokumentasikan di sini.

---

## [1.7.0] — 2026-08-19

### ✅ Added

- **Development Release Candidate (Sprint 15)**: Pelaksanaan *Code Freeze*, pengujian regresi komprehensif 100% PASS (446 test cases), verifikasi runtime CLI (`cli.js`, `reconcile.js`, `cleanup.js`), pencatatan *Performance Baseline* lokal, serta pembuatan dokumentasi rilis `docs/SPRINT15-REPORT.md`, `docs/DEVELOPMENT-RUNBOOK.md`, dan `docs/RELEASE-CHECKLIST.md`.
- **Final End-to-End QA & Release Validation (Sprint 14)**: Validasi QA akhir end-to-end seluruh siklus hidup transkoding dari upload hingga playback, penanganan kegagalan & recovery (zombie, missing queue, missing HLS, stale temp, orphan), regresi keamanan & otorisasi kepemilikan, regresi pemutaran browser dengan preservasi timestamp, suite pengujian `sprint14.e2e.test.js`, `sprint14.qa.test.js`, dan `sprint14.playback.test.js`, serta dokumentasi resmi rilis `docs/SPRINT14-REPORT.md`.
- **Development HLS Quality & Playback Intelligence (Sprint 13)**: Deteksi level resolusi HLS adaptif dinamis pada `VideoPlayer.vue`, pemilihan kualitas otomatis `Auto` berdasar bandwidth jaringan, penanganan *Playback Recovery Engine* untuk fatal error stream HLS dengan preservasi timestamp posisi putar saat fallback ke MP4, penstandardan 9 state pemutaran (`idle`, `loading`, `playing`, `buffering`, `switching_quality`, `recovering`, `fallback_mp4`, `error`, `ended`), pelacakan metrik performa playback development (`startupTimeMs`, `selectedQuality`, `bufferingCount`, `fallbackCount`), overlay badge status UI, serta suite pengujian frontend `VideoPlayer.sprint13.test.js`, `HlsPlayback.sprint13.test.js`, dan `PlaybackRecovery.sprint13.test.js`.
- **Development Transcoding Security & Access Control (Sprint 12)**: Verifikasi otorisasi & kepemilikan film (`verifyFilmOwnershipOrStaff()`), proteksi otentikasi rute audit/queue/status, pembatasan rate limiting (`5 req/min`), proteksi path traversal pada berkas sumber, idempotensi pada aksi retranscode & cancel, pencatatan audit event untuk akses ilegal yang diblokir, serta UI frontend *permission-aware* (`canManage`).
- **Development Data Consistency & Recovery (Sprint 10)**: Modul pemindai direktori HLS (`hlsScanner.js`), mesin rekonsiliasi data read-only (`reconcile.js`), perintah CLI `node src/runtime/reconcile.js`, layanan pemulihan data aman (`recoveryService.js` tanpa penghapusan MP4 sumber), suite pengujian pemulihan data `sprint10.recovery.test.js`, serta dokumentasi resmi `docs/SPRINT10-REPORT.md`.
- **Development Performance & Resource Control (Sprint 9)**: Konfigurasi *Adaptive Concurrency* (`TRANSCODER_CONCURRENCY`), mekanisme penahan beban RAM (*Resource Guard* `MIN_FREE_RAM_MB`), kebijakan performa FFmpeg (`FFMPEG_PRESET`, `FFMPEG_THREADS`, `FFMPEG_TIMEOUT_MS`), endpoint metrik antrean `GET /api/films/transcode/queue`, pencatatan durasi & metrik performa job, perluasan dashboard `TranscodingMonitor.vue`, serta suite pengujian performa & stres `sprint9.stress.test.js`.
- **Development Transcoding Observability & E2E Control (Sprint 8)**: Modul logging terstruktur (`transcoder/src/observability/logger.js`), endpoint debugging development-only `GET /api/films/:id/transcode/status`, komponen dashboard pengawasan `TranscodingMonitor.vue`, serta suite pengujian E2E `sprint8.e2e.test.js` yang menguji *happy path*, *corrupt file recovery*, dan skenario *cancel -> retry -> complete*.
- **Transcoding Management UI & Real-Time Status (Sprint 7)**: Komponen UI `TranscodeStatus.vue` dengan polling real-time transparan, penjaminan progres monotonik frontend (`Math.max(currentProgress, newProgress)`), tombol aksi Cancel (`POST /api/films/:id/transcode/cancel`) & Retry (`POST /api/films/:id/retranscode`), integrasi langsung pada `DetailVideoSection.vue`, guard MP4 fallback saat transkoding ulang, serta unit test frontend `TranscodeStatus.sprint7.test.js`.
- **Development Transcoding Operations & Queue Reliability (Sprint 6)**: Peningkatan keandalan antrean BullMQ dengan kebijakan retry & exponential backoff, penambahan fitur pembatalan transkoding (`POST /api/films/:id/transcode/cancel` & `cancelFfmpegProcess()`), penjaminan *monotonic progress update* `0..100%` di DB (`updateFilmStatus()`), pelacakan PID & terminasi sinyal SIGTERM/SIGKILL pada `ffmpeg.js`, pemulihan *zombie process/job* pada startup worker, penguatan validasi output HLS dengan tag `#EXT-X-ENDLIST` dan pemeriksaan ukuran berkas segmen non-0-byte, serta suite pengujian opsional `sprint6.operations.test.js`.
- **Development Environment Hardening (Sprint 4)**: Penguatan lingkungan pengembangan lokal Windows mencakup matriks pengujian input video nyata (360p, 720p, portrait, video tanpa audio dengan `-an` filter), penguatan validator HLS (`validateHlsOutput()` dengan verifikasi tag `#EXT-X-ENDLIST` dan ketersediaan berkas segmen `.ts` non-0-byte), pemulihan otomatis job terdampar (*Zombie Job Recovery* `recoverZombieJobs()`), presisi *progress tracking* DB 0-100%, pembatasan konkurensi terisolasi (`CONCURRENCY = 1`), serta standardisasi tag *logging observability* (`[Transcoder]`, `[FFprobe]`, `[FFmpeg]`, `[HLS]`, `[Database]`).
- **Browser Playback Verification & Production Readiness (Sprint 3.5)**: Integrasi playback HLS browser pada `VideoPlayer.vue` dengan dukungan prop `mp4Src`, `hlsSrc`, dan `transcodeStatus`, penyesuaian opsi kualitas Plyr adaptif berdasarkan ketersediaan level manifest HLS.js, *fatal error handler* otomatis untuk switch ke MP4 fallback jika stream HLS terputus/404, reset status fallback saat perpindahan judul film, pembersihan instansi `hls.destroy()` & `plyr.destroy()` saat unmount, pengujian unit frontend komprehensif (`VideoPlayer.sprint35.test.js`), serta verifikasi *Production Readiness Gate* untuk deployment Linux aaPanel.
- **HLS Verification & Hardening (Sprint 2.5)**: Verifikasi end-to-end pipelin transkoding HLS nyata, penguatan promosi direktori atomik dengan *backup-and-restore fallback* untuk OS Windows (`promoteTempToFinalHlsDir()`), pembersihan otomatis direktori temporary using `.tmp-*` yang usang saat startup worker (`cleanStaleTempDirectories()`), verifikasi pengiriman HTTP statis untuk `.m3u8` dan `.ts`, serta kepastian proteksi video asli MP4 tanpa penghapusan saat kegagalan.
- **Real HLS Transcoding Pipeline (Sprint 2)**: Pipelin transkoding video HLS nyata menggunakan FFprobe untuk inspeksi metadata video (`transcoder/src/ffprobe.js`), strategi pemilihan resolusi adaptif (`transcoder/src/renditions.js` — 1080p, 720p, 360p tanpa upscaling), mesin transkoding FFmpeg (`transcoder/src/ffmpeg.js` dengan `spawn` array argument & pelaporan progress 0-100%), pembentukan HLS master playlist (`transcoder/src/masterPlaylist.js`), validasi integritas struktur output HLS (`transcoder/src/validator.js`), pemindahan direktori output secara atomik via direktori temporary `.tmp-`, serta pembersihan *failure cleanup* tanpa menghapus video sumber MP4.
- **Transcoding Foundation (Sprint 1)**: Fondasi arsitektur HLS transkoding dengan modul queue producer Redis/BullMQ (`backend/src/lib/queue/transcoderQueue.js`), migrasi 3 kolom metadata (`transcode_status`, `hls_manifest_url`, `transcode_progress`), modul worker standalone terisolasi (`/transcoder`), dukungan static MIME `.m3u8` & `.ts` pada `static.routes.js`, dan integrasi post-commit enqueueing `FilmService.create()`.
- **Kategori Custom Materi Pembelajaran (`material_categories`)**: Skema tabel database baru, Objection.js model, Fastify CRUD API (`/api/material-categories`), dan halaman Admin Manajemen Kategori (`MaterialCategories.vue`).
- **Dynamic Grouped View Mode**: Mode tampilan berkelompok per kategori custom pada halaman materi pembelajaran (`LearningMaterials.vue`).
- **Dynamic Chunking Slider Karya Terbaru**: Pengelompokan karya terbaru menjadi maksimal 10 item per baris slider pada Beranda (`Home.vue`) dengan navigasi Swiper independen (`carouselId`).

### ⚡ Optimized & Enhanced

- **Upload Limit Video 4 GB**: Peningkatan batas maksimal unggah video dari 2 GB menjadi 4 GB pada backend Tus server (`backend/src/lib/tus.js`), client Tus uploader (`uploadFileTus.js`), form unggah arsip (`ArchiveUploadForm.vue`), dan editor feed (`useProductionFeedEditor.js`).
- **Admin Sidebar Redesign**: Perombakan tampilan sidebar administrasi (`AdminSidebar.vue`) dengan 4 seksi navigasi terorganisir (*UTAMA*, *KELOLA KONTEN*, *SISTEM & MODERASI*, *PENGATURAN*), kontras warna tinggi, dan footer profil mode gelap.
- **Redesign & Dark Mode Fix Diskusi Komunitas**: Perombakan penuh halaman diskusi publik (`Community.vue`), widget diskusi beranda (`CommunityDiscussion.vue`), dan diskusi admin (`CommunityDiscussions.vue`) dengan penyesuaian latar belakang, kartu balasan, dan kotak deskripsi topik yang kontras & estetis di mode gelap.
- **Pengaturan Sistem Dark Mode Fix**: Penyesuaian skema warna mode gelap pada halaman Pengaturan Sistem (`Settings.vue`).

---

## [1.4.0] — 2026-08-06

### ✅ Added

- **Production Feed**: Sistem pemantauan alur dan aktivitas produksi karya film (endpoint, service, controller, validation, upload, comment adapter, routes).
- **SEO Plugin**: Vite plugin untuk menyajikan `sitemap.xml` dan `robots.txt` dinamis langsung dari frontend tanpa konfigurasi nginx tambahan.
- **GitHub Actions CI**: Pipeline CI/CD otomatis — backend tests (185 tests) + frontend tests & build (84 tests) pada push/PR ke `main`.
- **Sitemap XML**: Daftar URL statis + dynamic film published, di-generate otomatis dari database.
- **Robots.txt**: Disallow `/admin/`, `/profile/`, `/auth/`, `/api/` + Sitemap URL.

### ⚡ Optimized

- **Frontend Test Suite**: 84 tests across 16 files (useAuth, useToast, useFilmDraft, format, ArchiveCard, AssetListItem, ArchiveUploadForm, dll.).
- **Backend Test Suite**: 185 tests across 21 files (termasuk productionFeed.service.unit, auth.controller, discussion.model, tus.routes, dll.).
- **Vite Plugin Architecture**: SEO files dilayani langsung oleh Vite dev server middleware, fallback ke static files saat build.

### 🔒 Security (18 Fixes — Audit S1-S12, R1-R8)

- **S7**: `init()` clear stale user saat `success:false`, `login()` cek `loginRes.success` sebelum getProfile.
- **S8**: Export `_resetNotificationsState()` & `_resetVotingState()`, `logout()` reset semua singletons.
- **S9**: `AnnouncementModal` fetchTimer cleanup, `ScrollToTop` animationId cancel di `onUnmounted`.
- **S10**: `useToast` global `hideTimer` clear sebelum showToast baru (cegah rapid-fire toast hilang).
- **S11**: RBAC self-edit prevention + last-admin protection (backend & frontend).
- **S12**: Discussion delete = owner OR admin (bukan moderator), community routes defense-in-depth role check.
- **R1**: `isValidDate()` guard di `formatDate`/`timeAgo` — return `'-'` untuk tanggal invalid.
- **R2**: `OAuthCallback` safeRedirect (cegah open-redirect), `ResetPassword` missingToken guard.
- **R3**: `ArchiveCard` imageFailed fallback, `Navbar` seeAllResults safe route, `Home` computed section title (fix template literal parse error).
- **R4**: `ChatSidebar` messageSeq/nextMid keys, errorTimer cleanup, historyFetchInFlight dedupe.
- **R5**: `RichTextEditor` null-guard watcher, `ConfirmDialog` loading-block dismiss.
- **R6**: `AssetListItem` safe slugify, `fileUrl` prop, download via `window.open` (noopener).
- **R8**: `useFilmForm` parseYear helper — `Number.isNaN ? null : parsed`.

### 🐛 Fixed

- **ErrorBoundary.vue**: Wrap `<slot>` dalam `<div style="display: contents;">` — fix Vue 3 `renderSlot` crash (`Cannot read properties of null (reading 'ce')`).
- **Sitemap empty response**: Tambah `Accept-Encoding: identity` header pada fetch plugin — fix Node.js native fetch menerima gzip tanpa dekompresi.
- **Deployment path**: `seoPlugin` dipindah ke `src/seoPlugin.js` agar dapat ditulis di server deployment (permission `www` user).

### 🏷️ Changed

- **Discussion model test**: Update assertion `updated_at` — `BaseModel.$beforeInsert()` memang meng-set `updated_at`.
- **ProductionFeed test**: Mock `insertAndFetch` (bukan `insert`) — sesuai service implementation.
- **Auth controller test**: Tambah mock `database/index.js` — cegah knex init tanpa DB config di test environment.

---

## [Unreleased] — 2026-04-18

### ✅ Added

- **Film Scenes**: Endpoint & controller `filmScene` untuk struktur adegan/breakdown film.
- **Study Notes**: Endpoint & controller `studyNote` untuk catatan pribadi dalam Study Mode.
- **Learning Materials**: Endpoint & controller `learningMaterial` untuk materi belajar yang dikelola kurator.
- **Content Reports**: Endpoint & controller `report` untuk pelaporan konten dan antrian moderasi admin.
- **Settings Management**: Endpoint & controller `setting` untuk konfigurasi aplikasi oleh admin.
- **Community Forum**: Endpoint & controller `community` untuk diskusi topik aktif dengan sistem balasan.
- **Notifications**: Endpoint & controller `notification` untuk sistem notifikasi event-driven.
- **X-Request-ID Header**: Tracing ID pada setiap response untuk memudahkan debugging di production.
- **Content Security Policy (CSP)**: Header CSP restriktif diaktifkan kembali untuk API server.

### ⚡ Optimized (Backend Performance)

- **N+1 Query Fix**: Penghapusan komentar bersarang di `DiscussionService.delete` menggunakan **Recursive CTE** (satu round-trip) menggantikan rekursi N+1.
- **DB-level Pagination**: `DiscussionService.getByFilm` menggunakan paginasi di level database (3 parallel queries) menggantikan in-memory loading.
- **Fisher-Yates Shuffle**: `FilmService.getRandom` menggantikan `ORDER BY RAND()` (full table scan) dengan shuffle di level aplikasi.
- **Static Imports**: Semua `await import()` dinamis di hot path controller dipindahkan menjadi static import di atas file.
- **Promise.all Parallelization**: Penghapusan file di `FilmService.delete` menggunakan `Promise.all` menggantikan sequential loop.
- **Non-blocking Exec**: `getDiskSpaceForPath` di `upload.js` menggunakan `promisify(exec)` menggantikan `execSync` yang memblokir event loop.
- **Reply Limit Guard**: `CommunityService.getReplies` diberi `.limit(100)` untuk mencegah pembebanan memori.

### 🔒 Security

- **Per-Route Rate Limiting**: Panduan & implementasi rate limit menggunakan `config.rateLimit` pada endpoint sensitif (auth, discussion, votes).
- **CSP Header**: Content Security Policy dengan konfigurasi `default-src 'none'` untuk API server.

### 🏷️ Refactored (Naming Consistency)

Semua fungsi controller distandarisasi mengikuti konvensi REST CRUD:

| Controller     | Lama                   | Baru         |
| -------------- | ---------------------- | ------------ |
| `discussion`   | `getOne`               | `getById`    |
| `community`    | `getOne`               | `getById`    |
| `community`    | `getAllDiscussions`    | `getAll`     |
| `community`    | `createDiscussion`     | `create`     |
| `community`    | `updateDiscussion`     | `update`     |
| `community`    | `deleteDiscussion`     | `delete`     |
| `community`    | `getDiscussionReplies` | `getReplies` |
| `notification` | `getNotifications`     | `getAll`     |
| `notification` | `createNotification`   | `create`     |

Route files diperbarui mengikuti rename di atas.

### 🌐 Language Consistency (Bahasa Indonesia)

Semua pesan user-facing (error, notFound, success) di seluruh 15 controller distandarisasi ke **Bahasa Indonesia**:

- `film`, `discussion`, `community`, `vote`, `auth`, `notification`
- `category`, `collection`, `evaluation`, `learningMaterial`
- `chat`, `report`, `setting`, `user`, `filmScene`

Contoh: `'Film not found'` → `'Film tidak ditemukan'`, `'You can only edit your own comments'` → `'Anda hanya dapat mengedit komentar Anda sendiri'`

### 🐛 Fixed

- **Double Import**: `vote.controller` memiliki 2 baris import terpisah untuk `voteService` dan `filmService`, digabung menjadi 1.
- **Dynamic Import in Hot Path**: `discussion.controller.create` dan `community.controller.addReply` masih menggunakan `await import()` untuk `notificationService` di dalam handler — dipindahkan ke static import.
- **Orphaned Brace**: `community.controller.addReply` kehilangan `if`-guard kondisi notifikasi akibat refactor sebelumnya — dipulihkan.

---

## [1.1.0] — 2026-04-02

### Added

- **Centralized Validation**: Implementasi Zod schema untuk validasi request secara terpusat.
  - Middleware `validateRequest` untuk body, params, dan query.
  - Transformasi data otomatis (misal: ID dari string ke number).
  - Penanganan error validasi yang konsisten.
- **Unit Testing**: Suite pengetesan komprehensif untuk backend.
  - Tests untuk `FilmService.normalizeData` (crew cleaning & sanitization).
  - Tests untuk Validation Middleware (Zod integration).
  - Tests untuk Sanitization Utility (XSS prevention).
- **Draft System**: Auto-save form data ke localStorage (composable `useFilmDraft`).
- **Resumable Upload**: Implementasi Tus.io protocol (support hingga 1 GB, resume setelah disconnect).

### Changed

- **Refactoring Controller**: Business logic dipindahkan dari controller ke service layer.
  - `FilmController` menjadi Thin Controller.
  - Pembersihan data `crew` dipindahkan ke `FilmService.normalizeData`.
  - Sanitasi HTML dipindahkan ke service layer untuk konsistensi.
- **FilmScene Management**: Refactor menggunakan centralized Zod validation.
- **Frontend → npm**: Migrasi dari `pnpm` ke `npm` untuk konsistensi package manager.

### Fixed

- **Data Consistency**: Penanganan field `crew` yang lebih aman dari input yang tidak valid.
- **Security**: Sanitasi HTML yang lebih merata di seluruh operasi create/update film.
- **Error Handling**: Standardisasi pesan error untuk kegagalan validasi dan otorisasi.
- Pool database `knexfile` untuk production dengan limit koneksi lebih banyak (max 20).
- Migrasi deprecated library `mysqldump` dengan native CLI via `child_process`.

### Optimized

- **N+1 Query** pada `getCommentDepth` dengan Recursive CTE.
- `getTrending` menggunakan `ORDER BY FIELD` native di database.
- Memory leak prevention pada Semantic Search dengan `scan limit`.
- Frontend initial load dikurangi dari 100 → 30 film (Time-to-Interactive lebih cepat).

### Removed

- `DashboardHero.vue`, `DashboardSection.vue`, `CuratedFilmCard.vue`, `UserProfileCard.vue` (tidak digunakan).
- Variabel `API_BASE` dead code pada module authentication.
- Library deprecated `mysqldump` dari dependencies.

---

## [1.0.0] — 2024-12-30

### Initial Release

- Backend API dengan Fastify + Objection.js + MySQL.
- Frontend dengan Vue 3 + Tailwind CSS (Brutal Design).
- Authentication dengan Better Auth (Email/Password + Google OAuth).
- Film management system (upload, approve/reject workflow).
- Discussion system (threaded nested comments, Adjacency List).
- Voting system (trending per periode).
- Collections / bookmark fitur.
- AI chat integration (Groq/OpenAI/Gemini, pluggable).
- Admin dashboard.
- Role-based access control (User, Creator, Moderator, Admin).

---

## Format Versi

Format: `[MAJOR.MINOR.PATCH]`

- **MAJOR**: Breaking changes
- **MINOR**: Fitur baru (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Kategori Perubahan

- **Added**: Fitur baru
- **Changed**: Perubahan pada fitur yang ada
- **Deprecated**: Fitur yang akan segera dihapus
- **Removed**: Fitur yang dihapus
- **Fixed**: Bug fixes
- **Security**: Perbaikan keamanan
- **Optimized**: Peningkatan performa
