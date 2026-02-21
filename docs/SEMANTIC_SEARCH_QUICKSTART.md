# Semantic Search - Quick Start Guide

## 🚀 Setup dalam 3 Langkah

### 1. Update Environment Variables

Edit file `backend/.env`:

```env
# Gunakan Gemini (gratis untuk embedding)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Aktifkan semantic search
USE_SEMANTIC_SEARCH=true
```

**Cara dapat Gemini API Key:**
1. Buka https://aistudio.google.com/app/apikey
2. Login dengan Google account
3. Klik "Create API Key"
4. Copy dan paste ke `.env`

### 2. Jalankan Migration

```bash
cd backend
npm run migrate
```

Output yang diharapkan:
```
Batch 1 run: 1 migrations
✔ Migration completed
```

### 3. Generate Embeddings

```bash
node scripts/generate-embeddings.js
```

Output:
```
🚀 Starting embedding generation...

✓ Generated embedding for: Film 1
✓ Generated embedding for: Film 2
...

📊 Summary:
✓ Successful: 30
✗ Failed: 0
📝 Total: 30

✅ Embedding generation complete!
```

## ✅ Selesai!

Semantic search sudah aktif. Test dengan:

```bash
# Start server
npm run dev

# Test chat (di terminal lain)
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "film tentang persahabatan"}'
```

## 🔍 Perbedaan Sebelum vs Sesudah

### Sebelum (Traditional)
```
User: "film tentang persahabatan yang menyentuh"
System: Ambil 30 film terbaru (random)
AI: Coba cari dari 30 film tersebut
```

### Sesudah (Semantic Search)
```
User: "film tentang persahabatan yang menyentuh"
System: Cari film dengan tema persahabatan (berdasarkan makna)
AI: Rekomendasi 10 film paling relevan dengan score
```

## 📊 Monitoring

Check berapa film yang sudah punya embedding:

```bash
# Di MySQL console
USE si_film_archive;

SELECT 
  COUNT(*) as total_films,
  SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embedding,
  SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as without_embedding
FROM films
WHERE status = 'published';
```

## 🐛 Troubleshooting

### "Current AI provider does not support embedding"
**Fix:** Set `AI_PROVIDER=gemini` di `.env`

### Script gagal generate embeddings
**Fix:** 
1. Check `GEMINI_API_KEY` valid
2. Check internet connection
3. Check quota API (max 1500/hari untuk free tier)

### Semantic search tidak bekerja
**Fix:**
1. Pastikan `USE_SEMANTIC_SEARCH=true`
2. Jalankan `node scripts/generate-embeddings.js`
3. Restart server

## 💡 Tips

1. **Gratis**: Gemini embedding gratis sampai 1500 request/hari
2. **Sekali saja**: Embeddings di-generate sekali, disimpan di database
3. **Auto-update**: Film baru otomatis dapat embedding
4. **Fallback**: Jika gagal, otomatis pakai mode traditional

## 📚 Dokumentasi Lengkap

Lihat `SEMANTIC_SEARCH.md` untuk dokumentasi detail.
