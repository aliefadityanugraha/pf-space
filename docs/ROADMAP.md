# 🗺️ Development Roadmap

Daftar fitur dan perbaikan yang akan dikembangkan untuk PF Space.

---

## ✅ Sudah Selesai

### Core Features

- [x] **Backend API** — Fastify + MySQL + Objection.js
- [x] **Frontend UI** — Vue 3 + Brutal Design System (Tailwind CSS)
- [x] **Authentication** — Better Auth (Email/Password + Google OAuth)
- [x] **RBAC** — Role-based access (User, Creator, Moderator, Admin)
- [x] **Media Handling** — Hybrid (YouTube embed + Local upload via Tus.io)
- [x] **Database** — Migrations & Seeding ready

### Film System

- [x] **Film Management** — Upload, edit, delete, approve/reject workflow
- [x] **Film Evaluation** — Penilaian kurator (Naskah, Sinematografi, Editing, Produksi)
- [x] **Film Scenes** — Struktur adegan/breakdown film
- [x] **Study Mode** — Split-screen video player + document viewer
- [x] **Study Notes** — Catatan pribadi dalam Study Mode
- [x] **Production Feed** — Pemantauan alur produksi dan aktivitas karya film

### Social & Community

- [x] **Voting System** — Trending films berdasarkan periode (minggu/bulan/all)
- [x] **Discussion System** — Nested comments, Adjacency List (maks. 5 level)
- [x] **Collections** — Bookmark/simpan film per pengguna
- [x] **Community Forum** — Diskusi topik aktif dengan balasan
- [x] **Notification System** — Notifikasi event-driven (komentar, evaluasi, dll.)

### Admin & Moderation

- [x] **Content Reports** — Pelaporan konten + antrian moderasi admin
- [x] **Settings Management** — Konfigurasi aplikasi oleh admin
- [x] **Admin Dashboard** — Backup/restore database, statistik sistem
- [x] **Audit Log** — Riwayat tindakan admin (approve/reject)

### Learning

- [x] **Learning Materials** — Materi belajar yang dikelola kurator/moderator

### AI

- [x] **AI Chat** — Integrasi AI asisten (Groq/OpenAI/Gemini, pluggable)

### UX & Frontend

- [x] **Dashboard kreator** — Statistik, status review, dan riwayat karya
- [x] **Alasan penolakan film** — Modal detail di MyArchive.vue
- [x] **Panduan kurasi** — Panel standar kurasi di form upload
- [x] **Profil pengguna & pengaturan akun** — Ganti foto, ubah password
- [x] **Halaman 404** — NotFound.vue dengan gaya brutalist

### Performance & Security (2026-04 → 2026-08)

- [x] **N+1 Query Fix** — Recursive CTE untuk penghapusan komentar bersarang
- [x] **DB-level Pagination** — Paginasi komentar di level database
- [x] **Fisher-Yates Shuffle** — Menggantikan `ORDER BY RAND()`
- [x] **Static Imports** — Semua dynamic import di hot path → static
- [x] **Promise.all** — Penghapusan file paralel menggantikan sequential loop
- [x] **Non-blocking Exec** — `execSync` → `promisify(exec)` untuk disk check
- [x] **CSP Header** — Content Security Policy aktif di API server
- [x] **X-Request-ID** — Tracing header pada setiap response
- [x] **Bahasa Indonesia** — Semua pesan error & sukses konsisten B.Indo
- [x] **Security Audit S1–S12, R1–R8** — 18 fixes: auth singleton reset, RBAC self-edit prevention, ErrorBoundary slot fix, format date guard, OAuth redirect safety, toast timer cleanup, discussion owner-only delete
- [x] **SEO / Sitemap** — Vite plugin untuk sitemap.xml & robots.txt dinamis

### Testing & CI/CD

- [x] **Unit Test Backend** — 185 tests across 21 files (vi.mock, no DB required)
- [x] **Unit Test Frontend** — 84 tests across 16 files (useAuth, useToast, useFilmDraft, format, ArchiveCard, dll.)
- [x] **CI/CD Pipeline** — GitHub Actions: backend tests + frontend tests & build (Node 22, push/PR to main)

---

## 🚧 Dalam Pengembangan

### Notifikasi & UX

- [ ] **Pusat Notifikasi** — Halaman khusus atau dropdown di navbar untuk melihat semua notifikasi
- [ ] **Real-time Notifikasi** — WebSocket/SSE agar notifikasi muncul tanpa refresh

### Pencarian & Filter

- [ ] **Filter Lanjutan Katalog** — Filter tahun, tag tema, status arsip (saat ini: live search + filter kategori saja)
- [ ] **Full-text Search** — Pencarian berdasarkan sinopsis, nama kru

### AI

- [ ] **Kontekstual AI Chat** — Tombol "Diskusikan film ini dengan AI" di halaman film
- [ ] **Rate Limiting AI Chat** — Limit per user/per menit untuk endpoint `/api/chat`

### Security & Monitoring

- [ ] **Redis Rate Limiting** — Migrasi `viewStore` in-memory ke Redis untuk rate limiting terdistribusi
- [ ] **Per-route Rate Limit** — Implementasi menyeluruh pada endpoint spam-prone (discussion, vote, chat)

### Aksesibilitas & SEO

- [ ] **Alt text poster** — Lebih deskriptif dan kontekstual
- [ ] **Keyboard navigation** — Fokus state tombol/link untuk keyboard user
- [ ] **Meta tags per halaman** — OGP dan Twitter Card yang lengkap

### Advanced Testing

- [ ] **Integration Test** — Alur upload/edit film end-to-end
- [ ] **E2E Testing** — Cypress atau Playwright

---

## 📅 Prioritas

### Phase 1 ✅ SELESAI

1. ~~Dashboard kreator dengan data real~~
2. ~~Profil pengguna & pengaturan akun~~
3. ~~Alasan penolakan film~~
4. ~~Halaman 404~~
5. ~~Evaluasi film~~
6. ~~Study Mode~~
7. ~~Notifications~~
8. ~~Content reports~~
9. ~~Backend optimization (N+1, static imports, CSP, dll.)~~

### Phase 2 (Medium Priority) — Aktif

1. Pusat Notifikasi (UI)
2. Filter lanjutan katalog
3. Per-route Rate Limiting (Redis)
4. Rate Limiting AI Chat

### Phase 3 (Low Priority) — Backlog

1. Real-time Notifikasi (WebSocket)
2. Kontekstual AI Chat
3. Integration & E2E Testing
4. Aksesibilitas & SEO

---

## 💡 Ide Fitur Masa Depan

- **Film Series/Playlist** — Grup film berdasarkan seri atau tema
- **Review System** — Rating dan review detail dari pengguna
- **Analytics Dashboard** — Dashboard analitik untuk admin (grafik, tren)
- **Multi-language** — Dukungan i18n Bahasa Indonesia & English
- **Dark Mode Toggle** — Pilihan tema gelap/terang
- **PWA Support** — Progressive Web App untuk akses offline
- **Ekspor Data** — Export CSV/JSON daftar film dengan statistik
- **Festival Mode** — Mode khusus untuk event pemutaran/festival film
