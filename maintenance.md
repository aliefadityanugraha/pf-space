1. Alur & fitur untuk Kreator

- Dashboard kreator yang “hidup”
  
  - DashboardUser.vue masih dummy; belum terhubung ke data film/vote/komentar asli.
  - Potensi: ringkasan performa film (views/vote/komentar per film, status review terbaru).
- Alasan penolakan film
  
  - Status sudah ada ( pending/published/rejected ), tapi belum ada field “alasan ditolak” yang tampil ke kreator.
  - Ini penting supaya kreator tahu apa yang perlu diperbaiki (misalnya durasi, konten, kualitas teknis).
- Panduan kualitas & kriteria kurasi
  
  - Belum ada halaman/panel yang menjelaskan standar kurasi PF Space (konten, format file, resolusi, hak cipta, dsb) yang muncul di sekitar form Upload/Edit.
  - Ini bisa mengurangi film yang harus ditolak admin.
2. Pengalaman Pengguna Umum

- Profil pengguna & pengaturan akun
  
  - Belum terlihat halaman “Profil saya” untuk ganti nama, foto, preferensi, dsb.
  - Sekarang user ada di backend (Better Auth), tapi di frontend belum diekspos sebagai halaman utama.
- Notifikasi yang lebih jelas
  
  - Saat ini kreator hanya “tahu” status lewat halaman Film Saya dan toast di Upload/Edit.
  - Belum ada pusat notifikasi (misal: “Film X disetujui”, “Film Y ditolak”) di navbar atau halaman khusus.
- Pencarian & filter lanjutan di katalog
  
  - Ada live search di navbar dan halaman Voting dengan filter kategori.
  - Yang bisa ditambah: filter tahun, durasi, status arsip, tag tema, dsb, di halaman katalog utama.
- 404 / fallback state halaman
  
  - Dari kode, error saat film tidak ketemu biasanya langsung redirect ke / .
  - Lebih ramah kalau ada halaman 404 khusus (film tidak ditemukan, atau halaman tidak ditemukan) dengan CTA balik ke arsip.
3. Admin & Moderasi

- Pelaporan konten oleh user
  
  - Admin sudah punya halaman Comments dan Films buat moderasi.
  - Belum ada mekanisme “Laporkan komentar/film ini” dari sisi user → admin mendapat queue laporan, bukan hanya daftar semua komentar.
- Audit log / riwayat tindakan admin
  
  - Belum ada catatan kapan film di-approve/reject oleh admin mana.
  - Untuk sistem arsip, jejak kurasi biasanya penting (siapa memutuskan apa, kapan).
- Ekspor data
  
  - Untuk research/kurasi, sering dibutuhkan export CSV/JSON (misalnya daftar film dengan jumlah vote/komentar).
  - Belum terlihat endpoint atau UI untuk ini.
4. AI Chat & Fitur Pintar

- Integrasi AI Chat yang lebih dalam konteks
  
  - Sudah ada AIChatSidebar.vue yang terhubung ke /api/chat dan history.
  - Langkah lanjut:
    - CTA kontekstual: misalnya di halaman film ada tombol “Diskusikan film ini dengan AI” yang mengisi prompt awal.
    - Mode “asisten kurasi”: bantu admin memilih film untuk diarsipkan.
- Batasan & proteksi spam
  
  - Untuk chat AI, belum terlihat limit rate (per user / per menit) di frontend.
  - Backend kemungkinan juga belum ada rate limiting khusus endpoint /api/chat .
5. Aspek Teknis & Kualitas Kode

- Testing
  
  - README menyebut testing “partial”; di repo belum terlihat setup unit test/frontend E2E.
  - Idealnya: minimal test untuk:
    - logika useVoting , useToast , useAuth ,
    - alur upload/edit film (happy path + error).
- CI/CD
  
  - Belum ada config CI (GitHub Actions / GitLab CI) di repo.
  - Pipeline sederhana bisa: lint (kalau nanti ditambah), build frontend, jalankan npm run migrate + skrip test backend.
- Validasi & error handling global
  
  - Banyak halaman sudah pakai useToast , tapi error API masih ditangani per halaman.
  - Hal baik berikutnya: interceptor API di api.js untuk:
    - auto-handle 401 (redirect ke login),
    - pesan error fallback yang konsisten.
- Aksesibilitas & SEO
  
  - Desain sudah kuat, tapi bisa ditingkatkan:
    - Alt text poster yang lebih deskriptif.
    - Fokus state tombol/link yang jelas untuk keyboard user.
    - Meta tags tambahan per halaman (beberapa sudah pakai useHead , bisa diperluas).