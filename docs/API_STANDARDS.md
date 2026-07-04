# 📦 API Response Standards

Dokumen ini menjelaskan **standar format response JSON API** agar:

- Konsisten di seluruh endpoint
- Mudah dikonsumsi frontend (Vue)
- Mudah di-maintain
- Scalable untuk pengembangan jangka panjang

---

## 🎯 Tujuan

- Menyamakan format response di semua endpoint
- Mempermudah handling data & error di frontend
- Menghindari breaking change
- Meningkatkan readability dan debugging

---

## 🧱 Struktur Response Standar

### ✅ Success Response

```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": {}
}
```

### ❌ Error Response

```json
{
  "success": false,
  "message": "Terjadi kesalahan",
  "errors": {}
}
```

---

## 🧩 Field Penjelasan

| Field | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `success` | boolean | ✅ | Status operasi (`true`/`false`) |
| `message` | string | ✅ | Pesan untuk user — **selalu Bahasa Indonesia** |
| `data` | object / array | ❌ | Data utama (hanya saat sukses) |
| `errors` | array of objects | ❌ | Detail error validasi (Zod) |
| `pagination` | object | ❌ | Informasi paginasi (list endpoint) |
| `code` | string | ❌ | Kode error internal |

---

## 🌐 HTTP Status Code

| Kondisi | Status Code |
| --- | --- |
| GET sukses | `200 OK` |
| CREATE sukses | `201 Created` |
| Validasi gagal | `400 Bad Request` |
| Tidak login | `401 Unauthorized` |
| Tidak punya akses | `403 Forbidden` |
| Data tidak ditemukan | `404 Not Found` |
| Rate limit tercapai | `429 Too Many Requests` |
| Error server | `500 Internal Server Error` |

> 📌 Jangan selalu return `200 OK`. Gunakan status code yang sesuai.

---

## 🧪 Contoh Kasus

### GET Data (Single)

```json
{
  "success": true,
  "message": "Data pengguna berhasil diambil",
  "data": {
    "id": 1,
    "name": "Alief",
    "email": "alief@mail.com"
  }
}
```

### GET Data (List dengan Pagination)

```json
{
  "success": true,
  "message": "Film berhasil diambil",
  "data": [
    { "film_id": 1, "judul": "Film A" },
    { "film_id": 2, "judul": "Film B" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 57,
    "totalPages": 6
  }
}
```

### CREATE Data

```json
{
  "success": true,
  "message": "Film berhasil dibuat. Menunggu persetujuan admin.",
  "data": {
    "film_id": 10,
    "judul": "Film Baru",
    "status": "pending"
  }
}
```

### Validasi Gagal (Zod)

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validasi input gagal",
  "errors": [
    { "field": "judul", "message": "Judul wajib diisi" },
    { "field": "tahun_karya", "message": "Angka minimal 1900" }
  ]
}
```

> 📌 **Catatan**: Sejak penerapan **Zod**, field `errors` bertipe **Array of Objects** untuk mendukung multiple error per field atau nested data.

### Data Tidak Ditemukan

```json
{
  "success": false,
  "code": "DATA_NOT_FOUND",
  "message": "Film tidak ditemukan"
}
```

### Unauthorized

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Silakan login terlebih dahulu"
}
```

### Forbidden

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Anda tidak memiliki akses untuk melakukan ini"
}
```

---

## 🌐 Bahasa Pesan

**Semua pesan user-facing (success & error) wajib dalam Bahasa Indonesia.** Ini sudah diimplementasikan di seluruh 15 controller.

Contoh konsistensi:

| Lama (Inggris) | Sekarang (Bahasa Indonesia) |
| --- | --- |
| `Film not found` | `Film tidak ditemukan` |
| `You can only edit your own comments` | `Anda hanya dapat mengedit komentar Anda sendiri` |
| `Vote recorded successfully` | `Suara berhasil dicatat` |
| `Film approved and published` | `Film disetujui dan dipublikasikan` |
| `Materials retrieved successfully` | `Materi berhasil diambil` |

---

## ✍️ Konvensi Penamaan Field

- Gunakan **snake_case** untuk semua field name
- Konsisten di seluruh API

```json
{
  "film_id": 1,
  "created_at": "2026-04-18T08:00:00Z",
  "nama_kategori": "Film Pendek",
  "is_in_collection": true
}
```

---

## 🔒 Keamanan

❌ **Jangan pernah return:**

- Password (termasuk hash)
- Token rahasia / API key
- Internal field yang tidak diperlukan
- Stack trace pada production

✅ **Selalu:**

- Sanitasi input teks dengan `sanitizePlainText()` sebelum simpan ke DB
- Exclude field sensitif (email, password) dari profil publik
- Gunakan `NotFoundError` daripada expose apakah resource ada/tidak ada untuk endpoint sensitif

---

## 🧠 Error Code Internal

| Code | Deskripsi |
| --- | --- |
| `UNAUTHORIZED` | User belum login |
| `FORBIDDEN` | User tidak punya akses |
| `DATA_NOT_FOUND` | Data tidak ditemukan |
| `VALIDATION_ERROR` | Validasi input gagal (Zod) |
| `DUPLICATE_ENTRY` | Data duplikat |
| `INTERNAL_ERROR` | Error internal server |

---

## 📌 Implementasi di Backend

### ApiResponse Helper (`lib/response.js`)

```javascript
import { ApiResponse } from '../lib/response.js';

// Success
return ApiResponse.success(reply, data, 'Film berhasil diambil');

// Success dengan pagination
return ApiResponse.success(reply, films, 'Film berhasil diambil', 200, pagination);

// Created
return ApiResponse.success(reply, film, 'Film berhasil dibuat.', 201);

// Not Found
return ApiResponse.notFound(reply, 'Film tidak ditemukan');

// Forbidden
return ApiResponse.error(reply, 'Anda tidak memiliki izin', 403);

// Bad Request
return ApiResponse.badRequest(reply, 'Komentar induk tidak valid');
```

### Custom Error Classes (`lib/errors.js`)

```javascript
import { NotFoundError, AuthorizationError } from '../lib/errors.js';

// Di service layer — akan ditangkap oleh Fastify error handler
throw new NotFoundError('Film tidak ditemukan');
throw new AuthorizationError('Anda tidak memiliki izin untuk melihat evaluasi ini');
```

### Centralized Validation dengan Zod

```javascript
// middlewares/schemas/film.schema.js
import { z } from 'zod';

export const createFilmSchema = z.object({
  body: z.object({
    judul: z.string().min(1, 'Judul wajib diisi'),
    category_id: z.number().int().positive(),
    tahun_karya: z.number().int().min(1900)
  })
});

// Route dengan validation:
fastify.post('/films', {
  preHandler: [authenticate, validateRequest(createFilmSchema)]
}, filmController.create.bind(filmController));
```
