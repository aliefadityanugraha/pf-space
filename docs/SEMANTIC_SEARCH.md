# Semantic Search Implementation

## Overview

Sistem ini menggunakan **semantic search** dengan embeddings untuk meningkatkan relevansi rekomendasi film dalam chat AI. Semantic search memungkinkan AI menemukan film berdasarkan makna pertanyaan, bukan hanya kata kunci.

## Cara Kerja

### 1. Generate Embeddings
Setiap film dikonversi menjadi vector embedding (array angka) yang merepresentasikan makna dari:
- Judul film
- Sinopsis
- Deskripsi lengkap
- Genre/kategori
- Tahun karya

### 2. Semantic Search
Ketika user bertanya, sistem:
1. Mengkonversi pertanyaan menjadi embedding
2. Menghitung similarity dengan semua film
3. Mengembalikan 10 film paling relevan (threshold: 0.3)
4. Mengirim hasil ke AI untuk dijawab

### 3. Auto-Generate
Embeddings otomatis di-generate saat:
- Film baru dibuat (status: published)
- Film di-update (judul/sinopsis/deskripsi berubah)
- Film di-publish oleh admin

## Setup

### 1. Jalankan Migration

```bash
cd backend
npm run migrate
```

### 2. Set Environment Variable

Tambahkan ke file `.env`:

```env
# Enable semantic search
USE_SEMANTIC_SEARCH=true

# AI Provider (gunakan Gemini untuk embedding gratis)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_EMBEDDING_MODEL=text-embedding-004
```

### 3. Generate Embeddings untuk Film yang Sudah Ada

```bash
node scripts/generate-embeddings.js
```

Output:
```
🚀 Starting embedding generation...

✓ Generated embedding for: Laskar Pelangi
✓ Generated embedding for: Ada Apa Dengan Cinta
✓ Generated embedding for: Petualangan Sherina
...

📊 Summary:
✓ Successful: 30
✗ Failed: 0
📝 Total: 30

✅ Embedding generation complete!
```

## Penggunaan

### Mode Semantic Search (Direkomendasikan)

Set `USE_SEMANTIC_SEARCH=true` di `.env`

**Contoh:**
- User: "film tentang persahabatan yang menyentuh"
- Sistem: Mencari film dengan tema persahabatan berdasarkan makna
- AI: Merekomendasikan film yang benar-benar relevan

### Mode Traditional (Fallback)

Set `USE_SEMANTIC_SEARCH=false` atau hapus variable

**Contoh:**
- User: "film tentang persahabatan"
- Sistem: Mengambil 30 film terbaru
- AI: Mencari dari 30 film tersebut

## Biaya

### Gemini (Direkomendasikan)
- **Embedding**: GRATIS sampai 1500 request/hari
- **Chat**: GRATIS sampai 1500 request/hari
- **Total untuk 30 film**: $0

### OpenAI
- **Embedding**: $0.02 per 1 juta token
- **30 film**: ~$0.0002 (Rp 3)
- **1000 film**: ~$0.006 (Rp 100)

## Monitoring

### Check Embedding Status

```javascript
// Di Node.js console atau script
import { Film } from './src/models/index.js';

const withEmbedding = await Film.query()
  .whereNotNull('embedding')
  .count('* as total');

const withoutEmbedding = await Film.query()
  .whereNull('embedding')
  .where('status', 'published')
  .count('* as total');

console.log('Films with embedding:', withEmbedding[0].total);
console.log('Films without embedding:', withoutEmbedding[0].total);
```

### Regenerate Specific Film

```javascript
import { embeddingService } from './src/services/index.js';

await embeddingService.updateFilmEmbedding(filmId);
```

## Troubleshooting

### Error: "Current AI provider does not support embedding"

**Solusi**: Pastikan menggunakan Gemini atau OpenAI
```env
AI_PROVIDER=gemini  # atau openai
```

### Semantic search tidak bekerja

**Check:**
1. `USE_SEMANTIC_SEARCH=true` di `.env`
2. Film sudah punya embedding (jalankan `generate-embeddings.js`)
3. API key valid

### Embedding generation gagal

**Solusi:**
1. Check API key di `.env`
2. Check quota API (Gemini: 1500/hari)
3. Check koneksi internet

## Performance

### Untuk 30 Film
- Generate embeddings: ~10 detik (sekali saja)
- Semantic search: ~200ms per query
- Memory: ~5MB untuk semua embeddings

### Untuk 1000 Film
- Generate embeddings: ~5 menit (sekali saja)
- Semantic search: ~500ms per query
- Memory: ~150MB untuk semua embeddings

### Untuk 10,000+ Film
- Pertimbangkan vector database (Pinecone, Weaviate)
- Atau gunakan PostgreSQL dengan pgvector extension

## API Endpoints

Tidak ada perubahan pada API endpoints. Semantic search bekerja secara transparan di backend.

## Testing

```bash
# Test chat dengan semantic search
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "film tentang persahabatan yang menyentuh hati"}'
```

Response akan menunjukkan film dengan relevance score jika semantic search aktif.

## Migration Path

### Dari Traditional ke Semantic Search

1. Set `USE_SEMANTIC_SEARCH=true`
2. Jalankan `node scripts/generate-embeddings.js`
3. Test dengan beberapa query
4. Monitor performa

### Rollback ke Traditional

1. Set `USE_SEMANTIC_SEARCH=false`
2. Sistem otomatis fallback ke mode traditional
3. Embeddings tetap tersimpan untuk future use

## Best Practices

1. **Generate embeddings saat off-peak hours** untuk film dalam jumlah besar
2. **Monitor API quota** jika menggunakan free tier
3. **Backup database** sebelum migration
4. **Test dengan sample queries** sebelum production
5. **Set threshold yang tepat** (default: 0.3, range: 0-1)

## Future Improvements

1. **Caching**: Cache embeddings di memory untuk performa lebih baik
2. **Batch processing**: Generate embeddings secara batch
3. **Vector database**: Migrate ke Pinecone/Weaviate untuk skala besar
4. **Hybrid search**: Kombinasi semantic + keyword search
5. **User preferences**: Personalisasi berdasarkan riwayat user
