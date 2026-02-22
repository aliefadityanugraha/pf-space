# 📦 API Response Standards

Dokumen ini menjelaskan **standar best practice response JSON API** agar:

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

| Field     | Tipe           | Wajib | Keterangan                      |
| --------- | -------------- | ----- | ------------------------------- |
| `success` | boolean        | ✅    | Status operasi (`true`/`false`) |
| `message` | string         | ✅    | Pesan untuk user                |
| `data`    | object / array | ❌    | Data utama (hanya saat sukses)  |
| `errors`  | object         | ❌    | Detail error validasi           |
| `meta`    | object         | ❌    | Informasi tambahan (pagination) |
| `code`    | string         | ❌    | Kode error internal             |

---

## 🌐 HTTP Status Code

| Kondisi              | Status Code                 |
| -------------------- | --------------------------- |
| GET sukses           | `200 OK`                    |
| CREATE sukses        | `201 Created`               |
| Validasi gagal       | `400 Bad Request`           |
| Tidak login          | `401 Unauthorized`          |
| Tidak punya akses    | `403 Forbidden`             |
| Data tidak ditemukan | `404 Not Found`             |
| Error server         | `500 Internal Server Error` |

> 📌 Jangan selalu return `200 OK`. Gunakan status code yang sesuai.

---

## 🧪 Contoh Kasus

### GET Data (Single)

```json
{
  "success": true,
  "message": "Data user berhasil diambil",
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
  "message": "List film berhasil diambil",
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
  "message": "Film berhasil dibuat",
  "data": {
    "film_id": 10,
    "judul": "Film Baru",
    "status": "pending"
  }
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "judul", "message": "Required" },
    {
      "field": "tahun_karya",
      "message": "Number must be greater than or equal to 1900"
    }
  ]
}
```

> 📌 **Catatan**: Sejak penerapan **Zod**, field `errors` sekarang bertipe **Array of Objects** untuk mendukung multiple error pada satu field atau struktur data nested.

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

## ✍️ Konvensi Penamaan

- Gunakan **snake_case** untuk field name
- Konsisten di seluruh API

```json
{
  "film_id": 1,
  "created_at": "2025-12-29T08:00:00Z",
  "nama_kategori": "Film Pendek"
}
```

---

## 🔒 Keamanan

❌ **Jangan pernah return:**

- Password (termasuk hash)
- Token rahasia
- Internal field yang tidak diperlukan
- Stack trace pada production

---

## 🧠 Error Code Internal

Gunakan error code untuk memudahkan debugging:

| Code               | Deskripsi              |
| ------------------ | ---------------------- |
| `UNAUTHORIZED`     | User belum login       |
| `FORBIDDEN`        | User tidak punya akses |
| `DATA_NOT_FOUND`   | Data tidak ditemukan   |
| `VALIDATION_ERROR` | Validasi input gagal   |
| `DUPLICATE_ENTRY`  | Data duplikat          |
| `INTERNAL_ERROR`   | Error internal server  |

---

## 🧩 Template Response Final

```json
{
  "success": true | false,
  "message": "Pesan untuk user",
  "data": {} | [],
  "errors": {},
  "pagination": {},
  "code": "ERROR_CODE"
}
```

---

## 📌 Implementasi di Backend

Gunakan helper function untuk konsistensi:

```javascript
// lib/response.js
export const successResponse = (data, message = "Success", meta = {}) => ({
  success: true,
  message,
  data,
  ...meta,
});

export const errorResponse = (message, code = null, errors = null) => ({
  success: false,
  message,
  ...(code && { code }),
  ...(errors && { errors }),
});

// Usage di controller
reply.send(ApiResponse.success(reply, film, "Film berhasil dibuat"));
reply.status(404).send(ApiResponse.error(reply, "Film tidak ditemukan", 404));

// Centralized Validation dengan Zod
// Route:
fastify.post(
  "/films",
  {
    preHandler: validateRequest(createFilmSchema),
  },
  filmController.create,
);
```
