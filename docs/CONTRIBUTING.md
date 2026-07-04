# 🤝 Contributing to PF Space

Terima kasih atas minat Anda untuk berkontribusi pada project PF Space! Dokumen ini berisi panduan untuk berkontribusi.

## 📋 Daftar Isi

- [Prasyarat](#prasyarat)
- [Setup Development](#setup-development)
- [Workflow Branching](#workflow-branching)
- [Standar Kode](#standar-kode)
- [Proses Pull Request](#proses-pull-request)

## 🚀 Prasyarat

- Node.js >= 18.x
- MySQL >= 8.0
- pnpm (untuk frontend)
- Git

## 🛠️ Setup Development

1. Fork repository ini
2. Clone ke lokal mesin Anda:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pf-space.git
   cd pf-space
   ```

### Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database
npm run migrate
npm run seed
npm run dev
```

### Setup Frontend

```bash
cd frontend
pnpm install
cp .env.example .env
pnpm run dev
```

## 🔄 Workflow Branching

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Fitur baru
- `bugfix/*` - Perbaikan bug kecil
- `hotfix/*` - Perbaikan kritis production

### Membuat Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nama-fitur
```

## 📝 Standar Kode

- Gunakan ESLint/Prettier yang sudah dikonfigurasi.
- Gunakan Composition API untuk file Vue.
- Penamaan file `PascalCase` untuk Vue components dan `camelCase` untuk composables/utils.
- Semua pesan error & sukses API menggunakan **Bahasa Indonesia**.

## 📦 Panduan Commit

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: Fitur baru
- `fix`: Perbaikan bug
- `docs`: Perubahan dokumentasi
- `style`: Perubahan format/style (tidak mengubah logika)
- `refactor`: Refactoring kode
- `test`: Penambahan testing
- `chore`: Maintenance tugas, dependencies

Contoh: `feat(film): tambahkan fitur upload naskah`

## 🔍 Proses Pull Request

1. Pastikan semua command lint dan test berhasil.
2. Push branch ke fork Anda: `git push origin feature/nama-fitur`
3. Buka Pull Request ke branch `develop`.
4. Buka Pull Request detail dengan deskripsi yang memadai. Tambahkan screenshot jika mengubah UI/Frontend.
5. Reviewer akan mengecek dan me-merge Pull Request Anda jika memenuhi syarat.

## 💬 Pertanyaan?

Silakan buka sebuah issue di repository untuk hal-hal terkait pertanyaan.
Happy coding! 🚀
