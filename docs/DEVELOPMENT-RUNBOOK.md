# PF SPACE — DEVELOPMENT TRANSCODING RUNBOOK

> **Scope**: Windows Development Environment  
> **Target Audience**: Developers, QA Engineers, DevOps Engineers  
> **Status**: APPROVED RELEASE CANDIDATE (v1.7.0)

---

## 1. 🚀 Quick Start Guide

### Prerequisites
- OS: Windows 11 (x64)
- Node.js: `v25.8.1` or higher
- Redis: Local instance running on `127.0.0.1:6379`
- MySQL: Running local database `pf_space`
- FFmpeg & FFprobe: Installed and accessible in PATH or configured via `FFMPEG_PATH` & `FFPROBE_PATH`

### Starting Services locally

#### 1. Backend Server (Fastify API)
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

#### 2. Frontend Development Server (Vue 3 / Vite)
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

#### 3. Standalone Transcoder Worker
```bash
cd transcoder
node src/worker.js
```

---

## 2. 🛠️ CLI Operations & Health Checks

### Runtime Environment Health Check
To verify that Node.js, Redis, FFmpeg, FFprobe, and filesystem directories are fully operational:
```bash
cd transcoder
node src/runtime/cli.js
```

### Data Consistency & Reconciliation Audit (Read-Only)
To audit consistency between MySQL database records, BullMQ queue jobs, running FFmpeg processes, and HLS filesystem outputs:
```bash
cd transcoder
node src/runtime/reconcile.js
```

### Safe HLS Cleanup & Retention Preview (Read-Only)
To inspect temporary `.tmp-*` directories eligible for cleanup without deleting files:
```bash
cd transcoder
node src/runtime/cleanup.js
```

To execute non-destructive cleanup of eligible temporary directories (Source MP4s are NEVER deleted):
```bash
cd transcoder
node src/runtime/cleanup.js --apply
```

---

## 3. 🛡️ Troubleshooting & Recovery Procedures

### Scenario A: Stranded Processing / Zombie Job
If the transcoder worker or system crashes while a video is in `processing` status:
1. Start the transcoder worker (`node src/worker.js`).
2. Automatic zombie job recovery (`recoverZombieJobs()`) runs on startup and updates stranded jobs to `failed`.
3. Alternatively, run `node src/runtime/reconcile.js` to inspect zombie status.

### Scenario B: Missing Queue Job
If a film status is `pending` in the DB but the Redis queue job was lost:
1. Pumping a re-transcode request via UI or API:
   `POST /api/films/:id/retranscode`
2. The system checks idempotency and enqueues a fresh BullMQ job.

### Scenario C: Corrupt Video Upload
If a user uploads a corrupted video file:
1. FFprobe inspects the metadata and fails fast without executing FFmpeg.
2. The worker marks status as `failed` and cleans up temporary `.tmp-*` directories.
3. The original source file is preserved intact.

---

## 4. 📊 Test Suite Execution

Run all test suites across the workspace:

```bash
# Transcoder Tests
cd transcoder
npm test

# Backend Tests
cd ../backend
npm test

# Frontend Tests
cd ../frontend
npm test
```
