# 🐛 Bugfix: Profile Image Kadang Muncul Kadang Tidak

## 📋 Deskripsi Masalah

User melaporkan bahwa foto profile kadang muncul, kadang tidak muncul di navbar dan halaman lainnya. Masalah ini terjadi secara intermittent dan tidak konsisten.

## 🔍 Root Cause Analysis

Setelah investigasi, ditemukan beberapa masalah:

### 1. **Normalisasi URL Tidak Lengkap** (Frontend)
File: `frontend/src/composables/useAuth.js`

Fungsi `normalizeUser()` hanya menangani 2 kasus:
- Path yang dimulai dengan `/uploads`
- URL localhost yang perlu diganti

**Masalah:**
- Tidak menangani URL eksternal (Google OAuth)
- Tidak menangani relative path tanpa leading slash
- Tidak menangani URL localhost dengan format berbeda

### 2. **Penyimpanan URL Tidak Konsisten** (Backend)
File: `backend/src/controllers/auth.controller.js`

Saat upload foto profile, backend menyimpan full URL:
```javascript
updateData.image = `${baseUrl}${imagePath}`;
```

**Masalah:**
- `baseUrl` bisa berubah (development vs production)
- Jika `baseUrl` tidak konsisten, URL foto jadi broken
- Hard to migrate antar environment

### 3. **Delete File Eksternal** (Backend)
File: `backend/src/services/auth.service.js`

Saat update foto, backend mencoba delete foto lama tanpa check apakah itu file lokal atau URL eksternal:
```javascript
await deleteFile(currentUser.image);
```

**Masalah:**
- Mencoba delete URL Google OAuth (akan error)
- Error bisa menyebabkan update gagal
- Foto profile hilang

### 4. **Error Handling Refresh User** (Frontend)
File: `frontend/src/composables/useAuth.js`

Fungsi `refreshUser()` tidak menangani error dengan baik:
```javascript
if (res.success) {
  user.value = normalizeUser(res.data);
}
```

**Masalah:**
- Jika `res.data` null/undefined, foto bisa hilang
- Network error bisa menyebabkan foto hilang sementara

### 5. **Image Load Error Tidak Ditangani** (Frontend)
File: `frontend/src/components/Navbar.vue`

Tag `<img>` tidak punya error handler:
```html
<img v-if="user?.image" :src="user.image" :alt="user.name" />
```

**Masalah:**
- Jika URL broken, image tetap ditampilkan (broken image icon)
- Tidak fallback ke icon default

---

## ✅ Solusi yang Diimplementasikan

### 1. **Perbaiki Normalisasi URL** (Frontend)

**File:** `frontend/src/composables/useAuth.js`

**Perubahan:**
```javascript
function normalizeUser(u) {
  if (!u) return u;
  const copy = { ...u };
  const img = copy.image;
  
  // Handle image URL normalization
  if (typeof img === 'string' && img.length > 0) {
    // Case 1: Relative path starting with /uploads
    if (img.startsWith('/uploads')) {
      const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      copy.image = `${base}${img}`;
    } 
    // Case 2: Localhost URL that needs to be replaced
    else if (img.includes('localhost') && img.includes('/uploads')) {
      const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      copy.image = img.replace(/^https?:\/\/[^/]+/, base);
    }
    // Case 3: External URL (Google OAuth, etc.) - keep as is
    else if (img.startsWith('http://') || img.startsWith('https://')) {
      copy.image = img;
    }
    // Case 4: Relative path without leading slash
    else if (!img.startsWith('http')) {
      const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      copy.image = `${base}/${img}`;
    }
  }
  
  return copy;
}
```

**Benefit:**
- ✅ Menangani semua format URL
- ✅ Support Google OAuth
- ✅ Support relative path
- ✅ Konsisten di semua environment

### 2. **Simpan Relative Path** (Backend)

**File:** `backend/src/controllers/auth.controller.js`

**Perubahan:**
```javascript
if (imagePath) {
  // Store relative path only, frontend will handle full URL construction
  updateData.image = imagePath;
}
```

**Benefit:**
- ✅ URL tidak tergantung environment
- ✅ Mudah migrate antar server
- ✅ Frontend yang handle full URL

### 3. **Smart Delete File** (Backend)

**File:** `backend/src/services/auth.service.js`

**Perubahan:**
```javascript
async updateUser(userId, data) {
  // If updating image, delete old one (only if it's a local file)
  if (data.image) {
    const currentUser = await this.getUserById(userId);
    if (currentUser && currentUser.image) {
      // Only delete if it's a local file path (starts with /uploads)
      // Don't delete external URLs (Google OAuth, etc.)
      if (currentUser.image.startsWith('/uploads')) {
        try {
          await deleteFile(currentUser.image);
        } catch (error) {
          console.warn('Failed to delete old profile image:', error.message);
          // Continue with update even if delete fails
        }
      }
    }
  }
  return User.query()
    .patchAndFetchById(userId, data)
    .withGraphFetched('role');
}
```

**Benefit:**
- ✅ Tidak mencoba delete URL eksternal
- ✅ Error handling yang baik
- ✅ Update tetap jalan meski delete gagal

### 4. **Better Error Handling** (Frontend)

**File:** `frontend/src/composables/useAuth.js`

**Perubahan:**
```javascript
async function refreshUser() {
  try {
    const res = await authApi.getProfile();
    if (res.success && res.data) {
      user.value = normalizeUser(res.data);
    }
  } catch (err) {
    // Only clear user if it's a 401 unauthorized error
    if (err.status === 401) {
      user.value = null;
    }
    // For other errors (network, 500, etc.), keep current user data
    // This prevents profile image from disappearing on temporary network issues
    console.warn('Failed to refresh user data:', err.message);
  }
}
```

**Benefit:**
- ✅ Check `res.data` sebelum assign
- ✅ Keep user data saat network error
- ✅ Foto tidak hilang saat temporary issue

### 5. **Image Error Handler** (Frontend)

**File:** `frontend/src/components/Navbar.vue`

**Perubahan:**
```html
<img 
  v-if="user?.image" 
  :src="user.image" 
  :alt="user.name" 
  class="w-full h-full object-cover"
  @error="(e) => e.target.style.display = 'none'"
/>
```

**Benefit:**
- ✅ Fallback ke icon jika image gagal load
- ✅ Tidak tampilkan broken image icon
- ✅ User experience lebih baik

---

## 🧪 Testing

### Test Case 1: User dengan Foto Upload Lokal
```bash
# 1. Login user
# 2. Upload foto profile
# 3. Refresh halaman beberapa kali
# 4. Check foto tetap muncul
```

**Expected:** ✅ Foto muncul konsisten

### Test Case 2: User dengan Google OAuth
```bash
# 1. Login dengan Google
# 2. Check foto dari Google muncul
# 3. Refresh halaman
# 4. Check foto tetap muncul
```

**Expected:** ✅ Foto Google muncul konsisten

### Test Case 3: Update Foto Profile
```bash
# 1. Login user dengan foto lama
# 2. Upload foto baru
# 3. Check foto lama terhapus
# 4. Check foto baru muncul
```

**Expected:** ✅ Foto baru muncul, foto lama terhapus

### Test Case 4: Network Error
```bash
# 1. Login user
# 2. Disconnect internet
# 3. Refresh halaman
# 4. Check foto tetap muncul (dari cache)
```

**Expected:** ✅ Foto tidak hilang saat network error

### Test Case 5: Broken Image URL
```bash
# 1. Manual set broken URL di database
# 2. Login user
# 3. Check fallback ke icon default
```

**Expected:** ✅ Icon default muncul, bukan broken image

---

## 📊 Impact Analysis

### Before Fix
- ❌ Foto hilang saat refresh (intermittent)
- ❌ Foto Google OAuth tidak muncul
- ❌ Error saat update foto
- ❌ Broken image icon muncul
- ❌ Network error menyebabkan foto hilang

### After Fix
- ✅ Foto muncul konsisten
- ✅ Support Google OAuth
- ✅ Update foto lancar
- ✅ Fallback ke icon default
- ✅ Resilient terhadap network error

---

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy ke production
```

### Backend
```bash
cd backend
# Restart server
npm run dev  # atau pm2 restart
```

**Note:** Tidak perlu migration database, hanya code changes.

---

## 🔄 Migration Path

### Untuk User dengan Foto Existing

**Scenario 1: Foto dengan Full URL**
```
Before: http://localhost:3000/uploads/image.jpg
After:  /uploads/image.jpg (auto-normalized di frontend)
```

**Scenario 2: Foto Google OAuth**
```
Before: https://lh3.googleusercontent.com/...
After:  https://lh3.googleusercontent.com/... (tetap sama)
```

**Action Required:** 
- ❌ Tidak perlu action
- ✅ Frontend auto-normalize semua format

---

## 📝 Lessons Learned

### 1. **Store Relative Paths**
Selalu simpan relative path di database, bukan full URL. Frontend yang handle base URL.

### 2. **Handle External URLs**
Bedakan antara file lokal vs URL eksternal (OAuth, CDN, etc.)

### 3. **Error Handling**
Jangan clear user data saat temporary error (network, 500, etc.)

### 4. **Image Fallback**
Selalu provide fallback untuk image yang gagal load

### 5. **Consistent Normalization**
Normalize data di satu tempat (composable/service) untuk konsistensi

---

## 🔮 Future Improvements

### 1. **CDN Integration**
Upload foto ke CDN (Cloudinary, S3) untuk performa lebih baik:
```javascript
// Upload to CDN
const cdnUrl = await uploadToCDN(file);
updateData.image = cdnUrl;
```

### 2. **Image Optimization**
Resize dan compress foto sebelum save:
```javascript
// Optimize image
const optimized = await sharp(file)
  .resize(200, 200)
  .jpeg({ quality: 80 })
  .toBuffer();
```

### 3. **Lazy Loading**
Lazy load foto profile untuk performa:
```html
<img loading="lazy" :src="user.image" />
```

### 4. **Cache Strategy**
Cache foto di browser untuk load lebih cepat:
```javascript
// Service worker cache
cache.put(imageUrl, response);
```

### 5. **Avatar Placeholder**
Generate avatar dari initial nama jika tidak ada foto:
```javascript
function getAvatarInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}
```

---

## ✅ Checklist

- [x] Fix normalisasi URL di frontend
- [x] Simpan relative path di backend
- [x] Smart delete file (skip external URL)
- [x] Better error handling
- [x] Image error handler
- [x] Testing semua scenario
- [x] Dokumentasi lengkap
- [ ] Deploy ke production
- [ ] Monitor error logs
- [ ] User feedback

---

## 📞 Support

Jika masih ada issue dengan foto profile:

1. **Check browser console** untuk error
2. **Check network tab** untuk failed requests
3. **Check database** untuk format URL yang disimpan
4. **Check server logs** untuk error backend

**Common Issues:**

**Issue:** Foto tidak muncul setelah upload
**Fix:** Check permission folder `backend/uploads/`

**Issue:** Foto Google tidak muncul
**Fix:** Check CORS settings di backend

**Issue:** Foto hilang setelah deploy
**Fix:** Check `VITE_API_URL` di frontend `.env`
