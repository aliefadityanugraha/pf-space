# PF SPACE — TRANSCODING RELEASE CHECKLIST

> **Target Version**: Release Candidate v1.7.0  
> **Environment**: Windows Development  
> **Status**: ✅ APPROVED FOR RELEASE

---

## 📋 Release Candidate Validation Items

- [x] **Sprint 1 — Transcoding Foundation**: Database schema, BullMQ queue, Redis producer, static MIME `.m3u8`/`.ts` delivery.
- [x] **Sprint 1.5 — Cross-Platform Runtime**: Environment abstraction, `cli.js` health checker.
- [x] **Sprint 2 — Real HLS Transcoding Pipeline**: FFprobe metadata inspector, adaptive renditions selector (1080p, 720p, 360p), atomic directory promotion (`.tmp-*` -> `hls/{filmId}/`).
- [x] **Sprint 2.5 — HLS Verification & Hardening**: Backup-and-restore fallback on Windows, startup stale temp directory cleanup.
- [x] **Sprint 3.5 — Browser Playback Verification**: `VideoPlayer.vue` HLS.js integration, Plyr quality selector, fatal error MP4 fallback.
- [x] **Sprint 4 — Development Environment Hardening**: Input video matrix testing (360p, 720p, portrait, no-audio `-an`), zombie job recovery.
- [x] **Sprint 5 — HLS Reliability & Product Integration**: `FilmService.retranscode()`, `POST /api/films/:id/retranscode`.
- [x] **Sprint 6 — Queue Reliability & Operations**: BullMQ retry backoff, PID tracking & cancellation (`POST /api/films/:id/transcode/cancel`), monotonic progress guarantee (`0..100%`).
- [x] **Sprint 7 — Transcoding Management UI**: `TranscodeStatus.vue`, real-time 3s polling, cancel/retry action buttons.
- [x] **Sprint 8 — Observability & E2E Control**: Structured logging logger (`[Queue]`, `[Worker]`, `[FFmpeg]`, `[HLS]`), `GET /api/films/:id/transcode/status`, `TranscodingMonitor.vue` dashboard.
- [x] **Sprint 9 — Performance & Resource Control**: Adaptive concurrency (`TRANSCODER_CONCURRENCY`), RAM Resource Guard (`MIN_FREE_RAM_MB`), FFmpeg preset/threads config, queue metrics API `GET /api/films/transcode/queue`.
- [x] **Sprint 10 — Data Consistency & Recovery**: `reconcile.js`, `hlsScanner.js`, safe `recoveryService.js`, CLI `node src/runtime/reconcile.js`.
- [x] **Sprint 11 — Audit Trail & Lifecycle Governance**: Persistent `transcode_operations` DB table, `TranscodeAuditService`, stale job protection, `retentionPolicy.js`, CLI `node src/runtime/cleanup.js`, `GET /api/films/:id/transcode/history`.
- [x] **Sprint 12 — Security & Access Control**: Ownership check (`verifyFilmOwnershipOrStaff`), protected endpoints, rate limiting (5 req/min), path traversal protection, audit logging of blocked requests.
- [x] **Sprint 13 — Playback Intelligence**: Adaptive level detection, Auto quality, 9 standardized states, timestamp preservation on quality switch / MP4 fallback, overlay badge status UI.
- [x] **Sprint 14 — Final End-to-End QA**: Full E2E QA regression, 446 test cases passed (100%).
- [x] **Sprint 15 — Release Candidate Gate**: Code freeze, runtime CLI validation, baseline performance recorded, complete documentation.

---

## 🎯 Verification Sign-Off

| Domain | Required Pass Rate | Actual Result | Sign-Off |
| :--- | :---: | :---: | :---: |
| **Backend Test Suite** | 100% | 213 / 213 Passed | ✅ APPROVED |
| **Frontend Test Suite** | 100% | 174 / 174 Passed | ✅ APPROVED |
| **Transcoder Test Suite** | 100% | 59 / 59 Passed | ✅ APPROVED |
| **Runtime CLI (`cli.js`)** | READY | 🟢 READY | ✅ APPROVED |
| **Reconciliation CLI (`reconcile.js`)** | READ-ONLY (0 Problems) | 0 Problems | ✅ APPROVED |
| **Cleanup CLI (`cleanup.js`)** | READ-ONLY PREVIEW | Safe Preview | ✅ APPROVED |
