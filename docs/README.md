# 📚 PF Space Documentation

Dokumentasi teknis untuk pengembangan dan pengelolaan PF Space.

---

## 📂 Core Documentation

| File | Deskripsi |
| --- | --- |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Panduan setup, arsitektur MSC, konvensi penamaan, dan troubleshooting. |
| [API_REFERENCE.md](./API_REFERENCE.md) | Daftar lengkap seluruh endpoint API (21 route groups) beserta contoh request/response. |
| [API_STANDARDS.md](./API_STANDARDS.md) | Standar format response JSON, kode error, dan konvensi Bahasa Indonesia. |
| [DATABASE.md](./DATABASE.md) | Schema database, relasi antar tabel, dan daftar migration. |
| [UPLOAD_SYSTEM.md](./UPLOAD_SYSTEM.md) | Penjelasan sistem upload Tus.io resumable dan mekanisme draft. |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Panduan menjalankan pengujian (Unit & Integration). |
| [CHANGELOG.md](./CHANGELOG.md) | Riwayat perubahan versi (Added, Changed, Fixed, Optimized). |
| [ROADMAP.md](./ROADMAP.md) | Status pengembangan fitur dan rencana mendatang. |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Panduan kontribusi untuk pengembang baru. |

---

## 🚀 Deployment

| File | Deskripsi |
| --- | --- |
| [DEPLOYMENT_GUIDE.md](../deploy/DEPLOYMENT_GUIDE.md) | Panduan lengkap deploy ke self-hosted server (Nginx + PM2 + MySQL). |

---

## 🛠️ Project Guidelines

- **Commit Message**: Ikuti standar [Conventional Commits](https://www.conventionalcommits.org/).
- **API Response**: Format wajib mengikuti [API_STANDARDS.md](./API_STANDARDS.md) — semua pesan dalam **Bahasa Indonesia**.
- **Controller Naming**: Fungsi mengikuti standar REST CRUD (`getAll`, `getById`, `create`, `update`, `delete`) — lihat [DEVELOPMENT.md](./DEVELOPMENT.md).
- **Validation**: Gunakan Zod + middleware `validateRequest` — lihat [API_STANDARDS.md](./API_STANDARDS.md).
- **Contributing**: Lihat [CONTRIBUTING.md](./CONTRIBUTING.md) bagi pengembang baru.

---

Untuk panduan instalasi cepat, silakan merujuk ke [README.md utama](../README.md).
