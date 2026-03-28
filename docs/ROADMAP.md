# 🗺️ Development Roadmap

Daftar fitur dan perbaikan yang akan dikembangkan untuk SI Film Archive.

---

## ✅ Sudah Selesai

- [x] **Backend API** - Terintegrasi (Fastify + MySQL)
- [x] **Frontend UI** - Terimplementasi (Vue 3 + Brutal Design)
- [x] **Authentication** - Better Auth (Email/Password + Google OAuth)
- [x] **Media Handling** - Upload & Streaming (YouTube/Local)
- [x] **Database** - Migrations & Seeding ready
- [x] **Voting System** - Trending films berdasarkan periode
- [x] **Discussion System** - Nested comments (Adjacency List)
- [x] **AI Chat** - Integrasi dengan Groq/OpenAI/Gemini
- [x] **Collections** - Fitur bookmark/simpan film
- [x] **Film Evaluation** - Penilaian kurator & feedback mendetail
- [x] **Study Mode Refactor** - Split screen document viewer
- [x] **Learning Materials List** - Improved UX for resources

---

## 🚧 Dalam Pengembangan

### 1. Alur & Fitur untuk Kreator

- [x] **Dashboard kreator yang "hidup"**
  - Menggunakan `Profile.vue` dan `MyArchive.vue` yang sudah terhubung dengan data asli (statistik, status review, dsb).

- [x] **Alasan penolakan film**
  - Ditambahkan tooltip dan modal detail alasan penolakan di `MyArchive.vue`.

- [x] **Panduan kualitas & kriteria kurasi**
  - Halaman/panel yang menjelaskan standar kurasi (konten, format file, resolusi, hak cipta)
  - Muncul di sekitar form Upload/Edit

---

### 2. Pengalaman Pengguna Umum

- [x] **Profil pengguna & pengaturan akun**
  - Halaman "Profil saya" sudah lengkap dengan ganti foto, ubah kata sandi, dsb.

- [ ] **Notifikasi yang lebih jelas**
  - Pusat notifikasi di navbar atau halaman khusus
  - Contoh: "Film X disetujui", "Film Y ditolak", "Ada balasan di komentar Anda"

- [ ] **Pencarian & filter lanjutan di katalog**
  - Sudah ada: live search, filter kategori
  - Ditambah: filter tahun, durasi, status arsip, tag tema

- [x] **Halaman 404 khusus**
  - Telah diimplementasikan dengan `NotFound.vue` dengan gaya brutalist penuh.

---

### 3. Admin & Moderasi

- [ ] **Pelaporan konten oleh user**
  - Mekanisme "Laporkan komentar/film ini" dari sisi user
  - Admin mendapat queue laporan

- [ ] **Audit log / riwayat tindakan admin**
  - Catatan kapan film di-approve/reject oleh admin mana
  - Penting untuk jejak kurasi

- [ ] **Ekspor data**
  - Export CSV/JSON daftar film dengan jumlah vote/komentar
  - Untuk research/kurasi

---

### 4. AI Chat & Fitur Pintar

- [ ] **Integrasi AI Chat yang lebih dalam konteks**
  - CTA kontekstual: tombol "Diskusikan film ini dengan AI" di halaman film
  - Mode "asisten kurasi": bantu admin memilih film untuk diarsipkan

- [ ] **Batasan & proteksi spam**
  - Rate limiting khusus endpoint `/api/chat`
  - Limit per user / per menit

---

### 5. Aspek Teknis & Kualitas Kode

- [ ] **Testing**
  - Unit test untuk: `useVoting`, `useToast`, `useAuth`
  - Integration test untuk alur upload/edit film
  - E2E testing

- [ ] **CI/CD**
  - Setup GitHub Actions / GitLab CI
  - Pipeline: lint, build frontend, migration, test backend

- [ ] **Validasi & error handling global**
  - Interceptor API di `api.js` untuk:
    - Auto-handle 401 (redirect ke login)
    - Pesan error fallback yang konsisten

- [ ] **Aksesibilitas & SEO**
  - Alt text poster yang lebih deskriptif
  - Fokus state tombol/link untuk keyboard user
  - Meta tags tambahan per halaman

---

## 📅 Prioritas

### Phase 1 (High Priority) ✅ SELESAI

1. ~~Dashboard kreator dengan data real~~
2. ~~Profil pengguna & pengaturan akun~~
3. ~~Alasan penolakan film~~
4. ~~Halaman 404~~

### Phase 2 (Medium Priority)

1. Mode Festival (Sedang Dikerjakan)
2. Notifikasi sistem
3. Pelaporan konten
4. Filter lanjutan katalog
5. Rate limiting AI Chat

### Phase 3 (Low Priority)

1. Audit log admin
2. Ekspor data
3. Testing & CI/CD
4. Aksesibilitas

---

## 💡 Ide Fitur Masa Depan

- **Film Series/Playlist** - Grup film berdasarkan seri atau tema
- **Review System** - Rating dan review detail dari pengguna
- **Analytics Dashboard** - Dashboard analitik untuk admin
- **Multi-language** - Dukungan bahasa Indonesia & English
- **Dark Mode Toggle** - Pilihan tema gelap/terang
- **PWA Support** - Progressive Web App untuk akses offline
