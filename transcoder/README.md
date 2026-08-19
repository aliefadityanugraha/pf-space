# PF Space — Transcoder Worker Service

Standalone background process worker for handling video HLS transcoding jobs across Windows Development and Linux Production environments.

---

## 🏗️ Cross-Platform Architecture

- **Consumer**: BullMQ Worker process connected to Redis queue `video-transcoding`.
- **Process Manager**: Managed via PM2 (`ecosystem.config.cjs`) in Production (Linux aaPanel/Ubuntu) and Development (Windows).
- **Concurrency**: Default `1` job per worker (configurable via `TRANSCODER_CONCURRENCY`).
- **Security**: Validates source path filesystem boundary (`backend/uploads/videos/`) to prevent path traversal attacks.

---

## 🚀 Environment Configuration (`.env`)

Salin `.env.example` ke `.env` di dalam folder `/transcoder`:

| Variabel | Deskripsi | Default |
| :--- | :--- | :--- |
| `REDIS_HOST` | Host/IP server Redis | `127.0.0.1` |
| `REDIS_PORT` | Port server Redis | `6379` |
| `REDIS_PASSWORD` | Password Redis (opsional) | `undefined` |
| `FFMPEG_PATH` | Path biner FFmpeg (opsional jika ada di PATH) | `null` |
| `FFPROBE_PATH` | Path biner FFprobe (opsional jika ada di PATH) | `null` |
| `TRANSCODER_CONCURRENCY` | Batas maksimum job simultan | `1` |
| `UPLOAD_DIR` | Path direktori unggahan (opsional) | `../backend/uploads` |

---

## 🔍 Runtime Health Check CLI

Jalankan perintah berikut untuk mengecek kesiapan environment (Node.js, OS, Memory, Redis, FFmpeg, FFprobe, & Akses Filesystem):

```bash
node src/runtime/cli.js
```

Contoh output:
```text
[Status]       : 🔴 NOT_READY
[OS / Node]    : win32 (x64) | Node v25.8.1
[CPU / Memory] : 16 Cores | Free RAM: 8.50 GB / 16.00 GB
[Redis]        : ❌ connect ECONNREFUSED 127.0.0.1:6379
[FFmpeg]       : ❌ Executable unavailable
[FFprobe]      : ❌ Executable unavailable
```

---

## 💻 Running the Worker

### Development Mode (Windows / Linux):
```bash
cd transcoder
npm install
npm start
```

### Production Mode (Linux aaPanel / PM2):
```bash
# Dari root project PF Space:
pm2 start ecosystem.config.cjs --only pfspace-transcoder
```
