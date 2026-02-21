# 🚀 Upgrade: Semantic Search Implementation

## 📋 Ringkasan Upgrade

Sistem AI chat telah di-upgrade dengan **Semantic Search** menggunakan embeddings untuk meningkatkan relevansi rekomendasi film. Upgrade ini memungkinkan AI memahami makna pertanyaan user, bukan hanya mencocokkan kata kunci.

---

## 🎯 Apa yang Berubah?

### Sebelum Upgrade (Traditional RAG)
```
User: "film tentang persahabatan yang menyentuh hati"
     ↓
System: Ambil 30 film terbaru dari database
     ↓
AI: Coba cari film relevan dari 30 film tersebut
     ↓
Result: Mungkin tidak relevan karena film terbaru ≠ film tentang persahabatan
```

### Setelah Upgrade (Semantic Search RAG)
```
User: "film tentang persahabatan yang menyentuh hati"
     ↓
System: Convert pertanyaan → embedding vector
     ↓
System: Hitung similarity dengan semua film
     ↓
System: Ambil 10 film paling relevan (score > 0.3)
     ↓
AI: Rekomendasi film yang benar-benar tentang persahabatan
     ↓
Result: Relevansi tinggi, user puas!
```

---

## ✨ Fitur Baru

### 1. **Semantic Search**
- Pencarian berdasarkan makna, bukan kata kunci
- Mendukung multi-bahasa (Indonesia ↔ Inggris)
- Similarity score untuk setiap hasil

### 2. **Auto-Generate Embeddings**
- Film baru otomatis dapat embedding saat dibuat
- Update embedding saat konten film berubah
- Generate embedding saat film di-publish admin

### 3. **Fallback Mechanism**
- Jika semantic search gagal → fallback ke traditional
- Jika embedding belum ada → gunakan film terbaru
- Zero downtime, sistem tetap jalan

### 4. **Configuration Toggle**
- Aktifkan/nonaktifkan via environment variable
- Tidak perlu ubah code
- Mudah rollback jika ada masalah

---

## 📦 File yang Ditambahkan

### 1. Migration
```
backend/src/database/migrations/20260214000000_add_embedding_to_films.js
```
- Menambah kolom `embedding` (TEXT) di tabel `films`
- Nullable, tidak wajib diisi

### 2. Embedding Service
```
backend/src/services/embedding.service.js
```
**Fungsi utama:**
- `generateFilmEmbedding(film)` - Generate embedding untuk 1 film
- `updateFilmEmbedding(filmId)` - Update embedding film tertentu
- `generateMissingEmbeddings()` - Generate untuk semua film tanpa embedding
- `findSimilarFilms(query, options)` - Semantic search
- `cosineSimilarity(vecA, vecB)` - Hitung similarity score

### 3. Generate Script
```
backend/scripts/generate-embeddings.js
```
Script untuk generate embeddings untuk film yang sudah ada di database.

### 4. Dokumentasi
```
backend/SEMANTIC_SEARCH.md                 # Dokumentasi lengkap
backend/SEMANTIC_SEARCH_QUICKSTART.md      # Quick start guide
backend/UPGRADE_SEMANTIC_SEARCH.md         # File ini
```

---

## 🔧 File yang Dimodifikasi

### 1. `backend/src/lib/ai/gemini.provider.js`
**Perubahan:**
- ✅ Fix bug: Tambah destructuring `options` parameter
- ✅ Tambah property `embeddingModel`
- ✅ Tambah method `generateEmbedding(text)`

**Code baru:**
```javascript
async generateEmbedding(text) {
  const response = await fetch(
    `${this.baseUrl}/models/${this.embeddingModel}:embedContent?key=${this.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${this.embeddingModel}`,
        content: { parts: [{ text }] }
      })
    }
  );
  const data = await response.json();
  return data.embedding.values;
}
```

### 2. `backend/src/services/chat.service.js`
**Perubahan:**
- ✅ Import `embeddingService`
- ✅ Update `getFilmContext()` untuk support semantic search
- ✅ Tambah parameter `userPrompt` ke `getFilmContext()`
- ✅ Conditional logic: semantic search vs traditional

**Logic baru:**
```javascript
async getFilmContext(userPrompt = null) {
  const useSemanticSearch = process.env.USE_SEMANTIC_SEARCH === 'true';
  
  if (useSemanticSearch && userPrompt) {
    // Semantic search: cari film relevan
    films = await embeddingService.findSimilarFilms(userPrompt, {
      limit: 10,
      threshold: 0.3
    });
  } else {
    // Traditional: ambil film terbaru
    films = await Film.query()
      .where('status', 'published')
      .orderBy('created_at', 'desc')
      .limit(30);
  }
}
```

### 3. `backend/src/services/film.service.js`
**Perubahan:**
- ✅ Import `embeddingService`
- ✅ Auto-generate embedding di `create()`
- ✅ Auto-update embedding di `update()`
- ✅ Auto-generate embedding di `updateStatus()` saat publish

**Trigger embedding:**
```javascript
// Saat create film baru (status: published)
if (process.env.USE_SEMANTIC_SEARCH === 'true' && data.status === FILM_STATUS.PUBLISHED) {
  const embedding = await embeddingService.generateFilmEmbedding(film);
  await Film.query().patch({ embedding: JSON.stringify(embedding) });
}

// Saat update film (jika konten berubah)
if (contentChanged) {
  await embeddingService.updateFilmEmbedding(id);
}

// Saat admin publish film
if (status === FILM_STATUS.PUBLISHED) {
  await embeddingService.updateFilmEmbedding(id);
}
```

### 4. `backend/src/services/index.js`
**Perubahan:**
- ✅ Export `embeddingService`

### 5. `backend/.env.example`
**Perubahan:**
- ✅ Update `AI_PROVIDER` default ke `gemini`
- ✅ Update `GEMINI_MODEL` ke `gemini-2.0-flash-exp`
- ✅ Tambah `GEMINI_EMBEDDING_MODEL=text-embedding-004`
- ✅ Tambah `USE_SEMANTIC_SEARCH=true`

---

## 🗄️ Perubahan Database

### Tabel: `films`
**Kolom baru:**
```sql
ALTER TABLE films ADD COLUMN embedding TEXT NULL AFTER views;
```

**Struktur data:**
- Type: `TEXT`
- Nullable: `YES`
- Format: JSON string array `[0.123, -0.456, 0.789, ...]`
- Dimensi: 768 (untuk text-embedding-004)
- Size: ~15KB per film

**Contoh data:**
```json
"[0.0234, -0.0156, 0.0789, ..., 0.0123]"
```

---

## 🔐 Environment Variables Baru

Tambahkan ke `backend/.env`:

```env
# AI Provider (wajib: gemini atau openai untuk embedding)
AI_PROVIDER=gemini

# Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Semantic Search Toggle
USE_SEMANTIC_SEARCH=true
```

**Cara dapat Gemini API Key:**
1. Buka: https://aistudio.google.com/app/apikey
2. Login dengan Google account
3. Klik "Create API Key"
4. Copy dan paste ke `.env`

---

## 📊 Performa & Biaya

### Biaya Embedding (Gemini)
| Jumlah Film | Request | Biaya |
|-------------|---------|-------|
| 30 film | 30 | **GRATIS** |
| 100 film | 100 | **GRATIS** |
| 1000 film | 1000 | **GRATIS** |
| 1500 film | 1500 | **GRATIS** (limit harian) |

**Note:** Gemini free tier = 1500 request/hari

### Performa
| Operasi | Waktu | Frekuensi |
|---------|-------|-----------|
| Generate 1 embedding | ~200ms | Sekali per film |
| Generate 30 embeddings | ~10 detik | Sekali saja (setup) |
| Semantic search | ~200ms | Setiap chat |
| Traditional search | ~50ms | Setiap chat |

### Storage
| Jumlah Film | Storage |
|-------------|---------|
| 30 film | ~450 KB |
| 100 film | ~1.5 MB |
| 1000 film | ~15 MB |
| 10,000 film | ~150 MB |

---

## 🚀 Cara Upgrade

### Step 1: Backup Database
```bash
mysqldump -u root -p si_film_archive > backup_before_upgrade.sql
```

### Step 2: Pull Code Terbaru
```bash
git pull origin main
cd backend
npm install  # Jika ada dependency baru
```

### Step 3: Update Environment
Edit `backend/.env`:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_EMBEDDING_MODEL=text-embedding-004
USE_SEMANTIC_SEARCH=true
```

### Step 4: Jalankan Migration
```bash
npm run migrate
```

Expected output:
```
Batch 1 run: 1 migrations
✔ 20260214000000_add_embedding_to_films.js
```

### Step 5: Generate Embeddings
```bash
node scripts/generate-embeddings.js
```

Expected output:
```
🚀 Starting embedding generation...

✓ Generated embedding for: Film 1
✓ Generated embedding for: Film 2
✓ Generated embedding for: Film 3
...

📊 Summary:
✓ Successful: 30
✗ Failed: 0
📝 Total: 30

✅ Embedding generation complete!
```

### Step 6: Restart Server
```bash
npm run dev
```

### Step 7: Test
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "film tentang persahabatan yang menyentuh hati"}'
```

---

## ✅ Verifikasi Upgrade

### 1. Check Database
```sql
-- Check kolom embedding sudah ada
DESCRIBE films;

-- Check berapa film yang sudah punya embedding
SELECT 
  COUNT(*) as total_films,
  SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embedding,
  SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as without_embedding
FROM films
WHERE status = 'published';
```

Expected:
```
total_films: 30
with_embedding: 30
without_embedding: 0
```

### 2. Check Logs
Saat chat, cek console log:
```
Found 10 relevant films using semantic search
```

### 3. Check Response
Response chat akan include relevance score:
```
- Judul: "Film ABC" (2023) (Relevance: 85.3%)
  Genre: Drama
  Sinopsis: ...
```

---

## 🔄 Rollback Plan

Jika ada masalah, rollback mudah:

### Option 1: Disable Semantic Search (Recommended)
Edit `.env`:
```env
USE_SEMANTIC_SEARCH=false
```
Restart server. Sistem kembali ke traditional mode.

### Option 2: Rollback Migration
```bash
npm run migrate:rollback
```
Ini akan drop kolom `embedding`.

### Option 3: Restore Database
```bash
mysql -u root -p si_film_archive < backup_before_upgrade.sql
```

---

## 🐛 Troubleshooting

### Error: "Current AI provider does not support embedding"
**Penyebab:** Provider selain Gemini/OpenAI tidak support embedding

**Solusi:**
```env
AI_PROVIDER=gemini  # atau openai
```

### Error: "Gemini API error"
**Penyebab:** API key invalid atau quota habis

**Solusi:**
1. Check API key valid
2. Check quota: https://aistudio.google.com/app/apikey
3. Tunggu 24 jam jika quota habis (reset otomatis)

### Semantic search tidak bekerja
**Penyebab:** Embeddings belum di-generate

**Solusi:**
```bash
node scripts/generate-embeddings.js
```

### Film baru tidak dapat embedding
**Penyebab:** `USE_SEMANTIC_SEARCH=false` atau error saat generate

**Solusi:**
1. Set `USE_SEMANTIC_SEARCH=true`
2. Check logs untuk error
3. Manual generate: `await embeddingService.updateFilmEmbedding(filmId)`

---

## 📈 Monitoring

### Check Embedding Coverage
```javascript
// Di Node.js console
import { Film } from './src/models/index.js';

const stats = await Film.query()
  .select(
    Film.raw('COUNT(*) as total'),
    Film.raw('SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embedding')
  )
  .where('status', 'published')
  .first();

console.log(`Coverage: ${stats.with_embedding}/${stats.total} (${(stats.with_embedding/stats.total*100).toFixed(1)}%)`);
```

### Monitor API Usage
Check di Google AI Studio:
https://aistudio.google.com/app/apikey

### Performance Monitoring
```javascript
// Di chat.service.js, tambah timing
const start = Date.now();
const films = await embeddingService.findSimilarFilms(userPrompt);
console.log(`Semantic search took ${Date.now() - start}ms`);
```

---

## 🎓 Best Practices

### 1. Generate Embeddings Off-Peak
Untuk film dalam jumlah besar, generate saat traffic rendah:
```bash
# Jalankan malam hari atau weekend
node scripts/generate-embeddings.js
```

### 2. Monitor API Quota
Set alert jika mendekati limit 1500/hari:
```javascript
// Tambah counter di embedding.service.js
let dailyCount = 0;
if (dailyCount > 1400) {
  console.warn('⚠️ Approaching API quota limit!');
}
```

### 3. Batch Processing
Untuk 1000+ film, process dalam batch:
```javascript
// Modify generate-embeddings.js
const batchSize = 50;
for (let i = 0; i < films.length; i += batchSize) {
  const batch = films.slice(i, i + batchSize);
  await Promise.all(batch.map(f => generateEmbedding(f)));
  await sleep(1000); // Rate limiting
}
```

### 4. Cache Embeddings
Untuk performa lebih baik, cache di memory:
```javascript
const embeddingCache = new Map();
// Cache embeddings yang sering diakses
```

---

## 🔮 Future Improvements

### 1. Vector Database
Untuk 10,000+ film, migrate ke vector database:
- **Pinecone** (managed, mudah)
- **Weaviate** (open source, powerful)
- **Qdrant** (fast, Rust-based)
- **PostgreSQL + pgvector** (jika sudah pakai PostgreSQL)

### 2. Hybrid Search
Kombinasi semantic + keyword search:
```javascript
const semanticResults = await embeddingService.findSimilarFilms(query);
const keywordResults = await Film.query().where('judul', 'like', `%${query}%`);
const combined = mergeAndRank(semanticResults, keywordResults);
```

### 3. User Personalization
Embedding berdasarkan preferensi user:
```javascript
const userProfile = await getUserEmbedding(userId);
const personalizedResults = await findSimilarToUser(userProfile);
```

### 4. Multi-modal Embeddings
Embedding dari poster film (image + text):
```javascript
const imageEmbedding = await generateImageEmbedding(posterUrl);
const textEmbedding = await generateTextEmbedding(synopsis);
const combined = combineEmbeddings(imageEmbedding, textEmbedding);
```

---

## 📞 Support

Jika ada pertanyaan atau masalah:

1. **Check dokumentasi:**
   - `SEMANTIC_SEARCH.md` - Dokumentasi lengkap
   - `SEMANTIC_SEARCH_QUICKSTART.md` - Quick start

2. **Check logs:**
   ```bash
   # Server logs
   npm run dev
   
   # Database logs
   tail -f /var/log/mysql/error.log
   ```

3. **Debug mode:**
   ```env
   NODE_ENV=development
   DEBUG=true
   ```

---

## 📝 Changelog

### Version 2.0.0 - Semantic Search Release

**Added:**
- ✅ Semantic search dengan embeddings
- ✅ Auto-generate embeddings untuk film baru
- ✅ Gemini embedding integration
- ✅ Fallback mechanism
- ✅ Configuration toggle
- ✅ Generate embeddings script
- ✅ Comprehensive documentation

**Changed:**
- ✅ Chat service: semantic search di getFilmContext()
- ✅ Film service: auto-generate embeddings
- ✅ Gemini provider: tambah generateEmbedding()

**Fixed:**
- ✅ Bug di gemini.provider.js (missing options destructuring)

**Database:**
- ✅ Migration: add embedding column to films table

---

## 🎉 Kesimpulan

Upgrade semantic search ini memberikan:

✅ **Relevansi lebih tinggi** - AI menemukan film yang benar-benar sesuai  
✅ **Pengalaman user lebih baik** - Rekomendasi lebih akurat  
✅ **Efisiensi token** - Kirim 10 film relevan vs 30 film random  
✅ **Gratis** - Gemini embedding gratis untuk use case Anda  
✅ **Mudah rollback** - Toggle on/off via environment variable  
✅ **Future-proof** - Siap scale ke ribuan film  

Selamat menggunakan semantic search! 🚀
