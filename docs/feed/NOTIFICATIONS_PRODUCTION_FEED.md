# 🔔 Event Notifikasi Production Feed — Reuse `notificationService`

> Dokumentasi **3 event notifikasi** pada bounded context **Production Feed**:
> **Feed Published**, **Feed Comment**, dan **Feed Mention**.
>
> - **Reuse**: ketiga event memakai service notifikasi existing (`notificationService.create`) — **tanpa modifikasi** di module Notification dan **tanpa service baru**.
> - **Tanpa duplikasi**: tidak ada query insert notifikasi selain lewat `notificationService.create`.
> - **Scope minimal**: 2 event sudah ada sejak implementasi awal (`production_post`, `production_comment`); implementasi baru hanya **Feed Mention** (`production_mention`) di adapter komentar.

---

## 1. Latar Belakang & Prinsip

Feed melakukan interaksi keluar (outbound) ke Notification hanya melalui public API existing:

```js
notificationService.create({ user_id, type, title, message, data })
```

Aturan yang dipegang (lihat `ARCHITECTURE_PRODUCTION_FEED.md` §5.2):

1. **Arah ketergantungan satu arah**: feed → Notification. Feed tidak pernah membaca/menyaring tabel `notifications`.
2. **Side-effect tidak menggagalkan request**: setiap panggilan notifikasi dibungkus `try/catch` (pola `vote.service.js`, `discussion.service.js`, `community.controller.js`).
3. `title`/`message` berbahasa Indonesia; `data` berisi id untuk deep-link.
4. Tidak ada modifikasi schema `notifications`; `type` hanyalah string.

---

## 2. Ringkasan 3 Event

| Event | `type` | Pemicu | Penerima | Payload `data` | Status |
|---|---|---|---|---|---|
| **Feed Published** | `production_post` | Post dipublish (`publish()`) dan terhubung ke film | Pemilik film (jika `film_id` diisi & bukan penulis post) | `{ post_id, film_id, slug }` | ✅ Sudah ada |
| **Feed Comment** | `production_comment` | Komentar baru di post | Penulis post (jika bukan komentator) | `{ post_id, discussion_id }` | ✅ Sudah ada |
| **Feed Mention** | `production_mention` | Komentar menyebut `@Nama` user lain | Setiap user yang namanya disebut (kecuali komentator) | `{ post_id, discussion_id }` | 🆕 Baru (adapter komentar) |

> Ketiga event disimpan di tabel `notifications` yang sama dan ditampilkan via `notificationService.getUserNotifications` — tidak ada duplikasi mekanisme.

---

## 3. Detail per Event

### 3.1 Feed Published (`production_post`)

- **Lokasi**: `backend/src/services/productionFeed.service.js` → `publish()`.
- **Logika**: setelah transaksi publish berhasil, bila `updated.film_id` diisi → ambil film; bila ada pemilik (`film.user_id`) dan bukan penulis post → kirim notifikasi.
- **Payload**: `data: { post_id, film_id, slug }` (slug untuk deep-link detail post).
- **Catatan**: tidak ada sistem *follow* di project → tidak ada notifikasi ke follower. Non-goal v1.

### 3.2 Feed Comment (`production_comment`)

- **Lokasi**: `backend/src/services/productionFeed.commentAdapter.js` → `addComment()`.
- **Logika**: setelah insert `discussions.post_id` berhasil, bila penulis post (`post.user_id`) bukan komentator → kirim notifikasi.
- **Payload**: `data: { post_id, discussion_id }`.

### 3.3 Feed Mention (`production_mention`) — baru

- **Lokasi**: `backend/src/services/productionFeed.commentAdapter.js` → `addComment()` → `_notifyMentionedUsers()`.
- **Logika**:
  1. Teks komentar (sudah `sanitizePlainText`) diekstrak calon nama via `_extractMentionCandidates()`.
  2. Calon dicocokkan **persis** ke `users.name` (`WHERE name IN (...) AND id != <komentator>`).
  3. Setiap user yang cocok mendapat notifikasi `production_mention` (per-recipient `try/catch`).
- **Sintaks mention**: `@Nama` atau `@Nama Belakang` (maks. 2 kata).
- **Pembanding**: `users` tidak punya kolom `username` (schema Better Auth: `name` = nama tampilan). Karena itu mention memakai nama tampilan; pencocokan case-insensitive mengikuti collation default MySQL.
- **Payload**: `data: { post_id, discussion_id }` (identik dengan Feed Comment, deep-link ke post).

---

## 4. Implementasi Feed Mention

### 4.1 Ekstraksi calon (helper privat adapter)

```js
_extractMentionCandidates(text) {
  const candidates = [];
  for (const match of text.matchAll(/@([\p{L}\p{N}_.'-]+)(?:\s+([\p{L}\p{N}_.'-]+))?/gu)) {
    const first = match[1];
    const second = match[2];
    if (second) candidates.push(`${first} ${second}`);
    candidates.push(first);
  }
  return [...new Set(candidates)];
}
```

- Regex Unicode-aware (`u` flag), mendukung aksara beraksen/`_`/`.`/`'`/`-`.
- Calon 2-kata dibuat untuk nama tampilan berspasi. **Trade-off yang disengaja**: di teks seperti `@Doni dan @Sinta` muncul calon tambahan `"Doni dan"` — aman karena `WHERE name IN (...)` tidak akan cocok dengan nama user yang tidak ada → tidak ada notifikasi palsu.

### 4.2 Pengiriman (per-recipient side-effect)

```js
async _notifyMentionedUsers(text, { actorId, post, discussionId }) {
  const candidates = this._extractMentionCandidates(text);
  if (!candidates.length) return;

  const mentionedUsers = await User.query()
    .select('id', 'name')
    .whereIn('name', candidates)
    .where('id', '!=', actorId);

  for (const user of mentionedUsers) {
    try {
      await notificationService.create({
        user_id: user.id,
        type: 'production_mention',
        title: 'Anda disebut dalam komentar',
        message: `Seseorang menyebut Anda dalam komentar di post "${post.judul}".`,
        data: { post_id: post.post_id, discussion_id: discussionId }
      });
    } catch (err) {
      console.error('Failed to send production_mention notification:', err.message);
    }
  }
}
```

- Komentator dikecualikan di level query (`id != actorId`).
- Dipanggil dari `addComment()` dengan `try/catch` pembungkus — kegagalan **tidak pernah** menggagalkan request komentar.

### 4.3 Non-goal (dokumentasi, bukan implementasi)

- **Mention pada `isi_konten` post**: `isi_konten` berupa rich text tersanitasi (HTML) → parsing `@` tidak deterministik. Diusulkan non-goal v1 agar feed tetap ringan; bila dibutuhkan, ekstraksi harus dilakukan pada sumber teks sebelum `sanitizeRichText`.
- **Kolom `username`**: menambah kolum adalah perubahan schema lintas module (Better Auth) — di luar aturan "jangan ubah arsitektur". Mention v1 memakai `name` tampilan.
- **Real-time / WebSocket**: masih ROADMAP global (non-goal).

---

## 5. Reuse yang Diterapkan (tanpa duplikasi)

| Kebutuhan | Reuse | Titik pemakaian |
|---|---|---|
| Membuat notifikasi | `notificationService.create` (`backend/src/services/notification.service.js`) | `productionFeed.service.js` (`publish`), `productionFeed.commentAdapter.js` (`addComment`) |
| Sanitasi teks komentar sebelum ekstraksi mention | `sanitizePlainText` (`lib/sanitize.js`) | adapter `addComment` |
| Error handling side-effect | pola `try/catch` (`vote.service.js`, `discussion.service.js`) | semua titik notifikasi feed |
| Lookup user | `User` model existing (`users.name`) | `_notifyMentionedUsers` (tidak ada utility/lookup baru) |

---

## 6. Perubahan File

| File | Perubahan |
|---|---|
| `backend/src/services/productionFeed.commentAdapter.js` | + import `User`; + `_extractMentionCandidates`; + `_notifyMentionedUsers`; panggil mention di `addComment`; docstring header diperbarui |
| `backend/src/__tests__/productionFeed.commentAdapter.test.js` | **Baru** — 9 test: ekstraksi mention, list, count, addComment (+notifikasi `production_comment`, `production_mention`, skip diri-sendiri, draft → `ValidationError`, tidak ada → `NotFoundError`) |

> Feed Published & Feed Comment **tidak berubah** kode-nya — hanya didokumentasikan secara eksplisit sebagai event.

---

## 7. Testing

- **Unit (Vitest, mock model)**: `productionFeed.commentAdapter.test.js` — mock `models`, `notificationService`, `sanitize`, `constants`, `upload`, `audit` (pola `film.service.test.js`).
- Jalankan: `cd backend && npx vitest run src/__tests__/productionFeed.commentAdapter.test.js`.

| Case | Ekspektasi |
|---|---|
| Komentar tanpa `@` | hanya `production_comment` ke penulis post (jika bukan diri sendiri) |
| Komentar berisi `@Nama` | `production_mention` per user yang cocok; komentator dikecualikan |
| Komentator = penulis post, tanpa mention | tidak ada notifikasi |
| Post draft/private | `ValidationError` sebelum insert |
| Post tidak ada | `NotFoundError` |

**Checklist manual (perlu DB + auth):**
- [ ] User A publish post terhubung ke film milik User B → B dapat `production_post`.
- [ ] User A berkomentar di post User B → B dapat `production_comment`.
- [ ] User A menulis `@Nama` User C di komentar → C dapat `production_mention`; A tidak.
- [ ] Kegagalan `notificationService.create` (mis. salah user_id) tidak menggagalkan insert komentar.

---

## 8. Ringkasan

- Tiga event feed memakai **satu** mekanisme notifikasi existing — tidak ada service baru, tidak ada tabel baru, tidak ada perubahan di module Notification.
- **Feed Mention** adalah satu-satunya event baru; diimplementasikan di adapter komentar dengan pendekatan *exact match* ke `users.name` sehingga bebas notifikasi palsu.
- Perubahan kode **terbatas di context feed**; module lain tidak tersentuh.
