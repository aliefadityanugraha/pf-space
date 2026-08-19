# 📤 Upload System & Draft Management

Dokumentasi lengkap sistem upload resumable dan draft management untuk PF Space.

## 🎯 Overview

PF Space menggunakan **Tus.io protocol** untuk resumable file upload yang memungkinkan:

- Upload file besar (hingga 4GB untuk video)
- Resume upload jika koneksi terputus
- Auto-save form data ke draft
- Restore draft setelah koneksi kembali

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    UPLOAD FLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Vue 3)                Backend (Fastify)           │
│  ┌──────────────┐              ┌──────────────┐             │
│  │ FilmForm.vue │              │ Tus Server   │             │
│  │              │              │              │             │
│  │ 1. User      │              │ 3. Store     │             │
│  │    pilih file│──────────────►│    chunks    │             │
│  │              │  tus-js-     │              │             │
│  │ 2. Upload    │  client      │ 4. Resume    │             │
│  │    via Tus   │              │    support   │             │
│  └──────┬───────┘              └──────┬───────┘             │
│         │                             │                     │
│         │                             ▼                     │
│         │                      ┌──────────────┐             │
│         │                      │ /uploads/    │             │
│         │                      │ (File Store) │             │
│         │                      └──────────────┘             │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │ localStorage │  (Draft Auto-save)                        │
│  │              │                                           │
│  │ - form data  │                                           │
│  │ - timestamp  │                                           │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Tech Stack

### Backend

- **@tus/server**: Tus protocol server implementation
- **@tus/file-store**: File storage handler
- **@fastify/multipart**: Multipart form data handling

### Frontend

- **tus-js-client**: Tus protocol client
- **localStorage**: Draft persistence
- **Vue 3 Composables**: Draft management logic

## 🔧 Backend Setup

### 1. Tus Server Configuration

File: `backend/src/index.js`

```javascript
import { Server as TusServer } from "@tus/server";
import { FileStore } from "@tus/file-store";

const tusServer = new TusServer({
  path: "/api/files",
  datastore: new FileStore({ directory: "./uploads" }),
  namingFunction: (req) => {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${timestamp}-${random}`;
  },
  onUploadFinish: async (req, res, upload) => {
    console.log("Upload finished:", upload.id);
  },
});

// Register Tus routes
fastify.all("/api/files", (req, reply) => {
  tusServer.handle(req.raw, reply.raw);
});

fastify.all("/api/files/*", (req, reply) => {
  tusServer.handle(req.raw, reply.raw);
});
```

### 2. File Serving

```javascript
import fastifyStatic from "@fastify/static";

fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), "uploads"),
  prefix: "/uploads/",
});
```

## 🎨 Frontend Implementation

### 1. Composable: useFilmDraft

File: `frontend/src/composables/useFilmDraft.js`

```javascript
export function useFilmDraft() {
  const DRAFT_KEY = "film_draft";
  const DRAFT_EXPIRY_DAYS = 7;

  // Save draft to localStorage
  const saveDraft = (formData) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    localStorage.setItem("film_draft_timestamp", new Date().toISOString());
  };

  // Load draft from localStorage
  const loadDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) return null;

    // Check expiry
    const timestamp = localStorage.getItem("film_draft_timestamp");
    const daysDiff = (new Date() - new Date(timestamp)) / (1000 * 60 * 60 * 24);

    if (daysDiff > DRAFT_EXPIRY_DAYS) {
      clearDraft();
      return null;
    }

    return JSON.parse(draft);
  };

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem("film_draft_timestamp");
  };

  // Auto-save with debounce
  const createAutoSave = (formRef, delay = 3000) => {
    return watch(
      formRef,
      (newValue) => {
        // Debounce logic
        saveDraft(newValue);
      },
      { deep: true },
    );
  };

  return { saveDraft, loadDraft, clearDraft, createAutoSave };
}
```

### 2. Component: FilmForm.vue

```vue
<script setup>
import { useFilmDraft } from "@/composables/useFilmDraft";
import * as tus from "tus-js-client";

const { saveDraft, loadDraft, clearDraft, createAutoSave } = useFilmDraft();

// Upload file using Tus
const uploadFileTus = (file, onProgress, fieldName) => {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${import.meta.env.VITE_API_URL}/api/files/`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(0);
        onProgress(+percentage);
      },
      onSuccess: () => {
        const filename = upload.url.split("/").pop();
        resolve(`/uploads/${filename}`);
      },
    });

    // Resume previous upload if exists
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
};

// Setup auto-save
onMounted(() => {
  // Check for existing draft
  if (checkDraft()) {
    showDraftBanner.value = true;
  }

  // Enable auto-save
  stopAutoSave = createAutoSave(form, 3000);
});

// Clear draft on successful submit
const handleSubmit = () => {
  emit("submit", form.value);
  clearDraft();
};
</script>
```

## 🎯 Features

### 1. Resumable Upload

Upload dapat dilanjutkan jika:

- Koneksi internet terputus
- Browser di-refresh
- Tab ditutup dan dibuka kembali

Tus client akan otomatis mencari upload sebelumnya dan melanjutkan dari posisi terakhir.

### 2. Auto-save Draft

Form data disimpan otomatis setiap 3 detik ke localStorage jika:

- Ada perubahan pada form
- Minimal ada satu field yang terisi

Draft akan expired setelah 7 hari.

### 3. Draft Recovery

Saat user membuka form upload:

- System check apakah ada draft tersimpan
- Tampilkan banner notifikasi jika ada draft
- User dapat memilih untuk restore atau discard draft

### 4. Progress Tracking

Upload progress ditampilkan dengan:

- Progress bar visual
- Persentase upload
- Estimasi waktu (opsional)

## 📝 File Type & Size Limits

| File Type | Max Size | Format                |
| --------- | -------- | --------------------- |
| Video     | 1 GB     | MP4, WebM             |
| Poster    | 10 MB    | JPG, PNG              |
| Banner    | 10 MB    | JPG, PNG              |
| Dokumen   | 10 MB    | PDF (Naskah, RAB, SB) |

## 🔒 Security

### Backend

- Validasi file type di server
- Sanitize filename
- Rate limiting untuk upload endpoint
- File size validation

### Frontend

- Client-side validation sebelum upload
- MIME type checking
- File extension validation

## 🐛 Error Handling

### Upload Errors

```javascript
try {
  const url = await uploadFileTus(file, onProgress, fieldName);
  form.value[fieldName] = url;
} catch (err) {
  if (err.message.includes("network")) {
    // Network error - upload akan auto-retry
    showToast("warning", "Koneksi terputus, mencoba ulang...");
  } else {
    // Other errors
    showToast("error", "Gagal upload: " + err.message);
  }
}
```

### Draft Errors

```javascript
try {
  saveDraft(formData);
} catch (error) {
  // localStorage full atau disabled
  console.error("Failed to save draft:", error);
  // Continue without draft
}
```

## 🧪 Testing

### Test Upload Resume

1. Mulai upload file besar (>100MB)
2. Saat progress 50%, matikan WiFi
3. Tunggu beberapa detik
4. Nyalakan WiFi kembali
5. Upload akan otomatis resume dari 50%

### Test Draft Recovery

1. Isi form upload dengan data lengkap
2. Tutup tab browser
3. Buka kembali halaman upload
4. Banner draft akan muncul
5. Klik "Pulihkan Draft"
6. Form akan terisi dengan data sebelumnya

## 📊 Monitoring

### Backend Logs

```javascript
onUploadFinish: async (req, res, upload) => {
  console.log("Upload finished:", {
    id: upload.id,
    size: upload.size,
    metadata: upload.metadata,
  });
};
```

### Frontend Logs

```javascript
console.log("[Draft] Saved:", timestamp);
console.log("[Upload] Progress:", percentage + "%");
console.log("[Upload] Completed:", fileUrl);
```

## 🚀 Future Improvements

- [ ] Multiple file upload parallel
- [ ] Drag & drop upload
- [ ] Image compression sebelum upload
- [ ] Video thumbnail generation
- [ ] Upload queue management
- [ ] Cloud storage integration (S3, GCS)
- [ ] CDN integration untuk serving files

## 📚 References

- [Tus.io Protocol](https://tus.io/)
- [tus-js-client Documentation](https://github.com/tus/tus-js-client)
- [@tus/server Documentation](https://github.com/tus/tus-node-server)
