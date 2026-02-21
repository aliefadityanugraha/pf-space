# 🎯 Feature: Community Discussions (Diskusi Komunitas)

## 📋 Overview

Fitur **Community Discussions** memungkinkan moderator/admin untuk membuat topik diskusi umum yang ditampilkan di halaman utama. Hanya satu diskusi yang bisa aktif dalam satu waktu, dan semua user yang login bisa memberikan balasan.

## ✨ Fitur Utama

### 1. **Event-Based Discussion**
- Hanya satu diskusi aktif dalam satu waktu
- Moderator/admin bisa mengaktifkan/nonaktifkan diskusi
- Diskusi muncul di homepage saat aktif
- Tidak ada diskusi = section tidak muncul

### 2. **User Interaction**
- Semua user yang login bisa memberikan balasan
- User bisa menghapus balasan mereka sendiri
- Moderator bisa menghapus balasan siapa saja
- Real-time reply count

### 3. **Admin Management**
- CRUD diskusi (Create, Read, Update, Delete)
- Toggle aktif/nonaktif
- Lihat jumlah balasan per diskusi
- Moderator juga punya akses

---

## 🗄️ Database Schema

### Table: `community_discussions`
```sql
CREATE TABLE community_discussions (
  discussion_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (is_active)
);
```

### Table: `community_replies`
```sql
CREATE TABLE community_replies (
  reply_id INT PRIMARY KEY AUTO_INCREMENT,
  discussion_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (discussion_id) REFERENCES community_discussions(discussion_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (discussion_id)
);
```

---

## 🔌 API Endpoints

### Public Endpoints

#### GET `/api/community/active`
Get active discussion with all replies

**Response:**
```json
{
  "success": true,
  "data": {
    "discussion_id": 1,
    "title": "Film favorit kalian tahun ini?",
    "description": "Share film favorit kalian dan alasannya!",
    "is_active": true,
    "created_at": "2026-02-14T10:00:00Z",
    "creator": {
      "id": "user123",
      "name": "Admin",
      "image": "/uploads/avatar.jpg"
    },
    "replies": [
      {
        "reply_id": 1,
        "content": "Film X sangat bagus!",
        "created_at": "2026-02-14T11:00:00Z",
        "user": {
          "id": "user456",
          "name": "John Doe",
          "image": "/uploads/john.jpg"
        }
      }
    ]
  }
}
```

### User Endpoints (Requires Auth)

#### POST `/api/community/:id/replies`
Add reply to discussion

**Request:**
```json
{
  "content": "Saya setuju! Film itu memang bagus."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply_id": 2,
    "discussion_id": 1,
    "content": "Saya setuju! Film itu memang bagus.",
    "created_at": "2026-02-14T12:00:00Z",
    "user": {
      "id": "user789",
      "name": "Jane Smith",
      "image": "/uploads/jane.jpg"
    }
  }
}
```

#### DELETE `/api/community/replies/:replyId`
Delete own reply

**Response:**
```json
{
  "success": true,
  "message": "Reply deleted successfully"
}
```

### Admin/Moderator Endpoints

#### GET `/api/community`
Get all discussions (with pagination)

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "discussion_id": 1,
      "title": "Film favorit kalian tahun ini?",
      "description": "Share film favorit kalian!",
      "is_active": true,
      "reply_count": 15,
      "created_at": "2026-02-14T10:00:00Z",
      "creator": {
        "id": "admin1",
        "name": "Admin",
        "image": "/uploads/admin.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### POST `/api/community`
Create new discussion (deactivates others)

**Request:**
```json
{
  "title": "Apa film favorit kalian tahun ini?",
  "description": "Share film favorit kalian dan alasannya!"
}
```

#### PUT `/api/community/:id`
Update discussion

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

#### PATCH `/api/community/:id/toggle`
Toggle discussion active status

**Request:**
```json
{
  "is_active": true
}
```

#### DELETE `/api/community/:id`
Delete discussion (and all replies)

#### DELETE `/api/community/replies/:replyId/moderate`
Delete any reply (moderator power)

---

## 📁 File Structure

### Backend

```
backend/
├── src/
│   ├── database/
│   │   └── migrations/
│   │       └── 20260214100000_create_community_discussions_table.js
│   ├── models/
│   │   ├── CommunityDiscussion.js
│   │   ├── CommunityReply.js
│   │   └── index.js (updated)
│   ├── services/
│   │   ├── community.service.js
│   │   └── index.js (updated)
│   ├── controllers/
│   │   ├── community.controller.js
│   │   └── index.js (updated)
│   └── routes/
│       ├── community.routes.js
│       └── index.js (updated)
```

### Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── CommunityDiscussion.vue (new)
│   │   └── AdminSidebar.vue (updated)
│   ├── pages/
│   │   ├── Home.vue (updated)
│   │   └── admin/
│   │       └── CommunityDiscussions.vue (new)
│   └── router/
│       └── index.js (updated)
```

---

## 🚀 Setup & Installation

### 1. Run Migration

```bash
cd backend
npm run migrate
```

Expected output:
```
Batch 1 run: 1 migrations
✔ 20260214100000_create_community_discussions_table.js
```

### 2. Restart Backend

```bash
npm run dev
```

### 3. Rebuild Frontend

```bash
cd frontend
npm run build
```

---

## 🎨 UI/UX Design

### Homepage Section

**Tampilan saat ada diskusi aktif:**
- Card besar dengan gradient header (orange to red)
- Icon MessageCircle di kiri
- Judul diskusi bold & besar
- Deskripsi (jika ada)
- Info creator & timestamp
- List balasan dengan avatar
- Form reply untuk user yang login
- Login prompt untuk guest

**Tampilan saat tidak ada diskusi:**
- Section tidak muncul sama sekali

### Admin Page

**Features:**
- List semua diskusi dengan badge status (Aktif/Nonaktif)
- Form create/edit diskusi
- Toggle aktif/nonaktif
- Delete diskusi
- Reply count per diskusi
- Info creator & timestamp

**Access:**
- Admin: Full access
- Moderator: Full access
- User: No access

---

## 🔐 Permissions

### Public
- ✅ View active discussion
- ✅ View all replies

### Authenticated User
- ✅ Add reply
- ✅ Delete own reply

### Moderator
- ✅ All user permissions
- ✅ Create discussion
- ✅ Update discussion
- ✅ Toggle discussion
- ✅ Delete discussion
- ✅ Delete any reply

### Admin
- ✅ All moderator permissions

---

## 💡 Use Cases

### Use Case 1: Admin Membuat Diskusi Baru

1. Admin login ke panel admin
2. Navigasi ke "Diskusi Komunitas"
3. Klik "Buat Diskusi Baru"
4. Isi judul: "Film favorit kalian tahun ini?"
5. Isi deskripsi (opsional)
6. Klik "Buat Diskusi"
7. Diskusi otomatis aktif, diskusi lain otomatis nonaktif
8. Diskusi muncul di homepage

### Use Case 2: User Memberikan Balasan

1. User login
2. Buka homepage
3. Scroll ke section "Diskusi Komunitas"
4. Baca topik diskusi
5. Tulis balasan di form
6. Klik "Kirim Balasan"
7. Balasan muncul di list

### Use Case 3: Moderator Menonaktifkan Diskusi

1. Moderator login ke panel admin
2. Navigasi ke "Diskusi Komunitas"
3. Klik icon "Eye" pada diskusi aktif
4. Diskusi berubah status jadi nonaktif
5. Diskusi hilang dari homepage

### Use Case 4: User Menghapus Balasan Sendiri

1. User login
2. Buka homepage
3. Lihat balasan yang sudah dibuat
4. Klik icon "Trash" pada balasan sendiri
5. Konfirmasi hapus
6. Balasan terhapus

---

## 🧪 Testing

### Manual Testing Checklist

**Public Access:**
- [ ] Homepage tidak menampilkan section jika tidak ada diskusi aktif
- [ ] Homepage menampilkan diskusi aktif dengan benar
- [ ] Guest user melihat prompt login
- [ ] Balasan ditampilkan dengan urutan yang benar

**User Actions:**
- [ ] User bisa menambah balasan
- [ ] User bisa menghapus balasan sendiri
- [ ] User tidak bisa menghapus balasan orang lain
- [ ] Form reply di-clear setelah submit

**Moderator Actions:**
- [ ] Moderator bisa create diskusi
- [ ] Moderator bisa update diskusi
- [ ] Moderator bisa toggle diskusi
- [ ] Moderator bisa delete diskusi
- [ ] Moderator bisa delete balasan siapa saja
- [ ] Hanya satu diskusi aktif dalam satu waktu

**Admin Actions:**
- [ ] Admin punya semua akses moderator
- [ ] Admin bisa lihat semua diskusi
- [ ] Admin bisa manage diskusi dari panel

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Single Active Discussion**
   - Hanya satu diskusi bisa aktif
   - Tidak ada queue atau schedule

2. **No Rich Text**
   - Balasan hanya plain text
   - Tidak support markdown atau formatting

3. **No Notifications**
   - User tidak dapat notifikasi saat ada balasan baru
   - Perlu refresh manual untuk lihat balasan baru

4. **No Pagination on Replies**
   - Semua balasan di-load sekaligus
   - Bisa lambat jika balasan sangat banyak

### Future Improvements

1. **Rich Text Editor**
   - Support markdown
   - Support emoji
   - Support mentions (@username)

2. **Real-time Updates**
   - WebSocket untuk real-time replies
   - Live reply count

3. **Notifications**
   - Notif saat ada balasan baru
   - Notif saat diskusi baru aktif

4. **Reply Pagination**
   - Load more button
   - Infinite scroll

5. **Reactions**
   - Like/love reactions pada balasan
   - Emoji reactions

6. **Nested Replies**
   - Reply to reply
   - Thread conversations

---

## 📊 Analytics Ideas

Metrics yang bisa di-track:

1. **Engagement Metrics**
   - Total replies per discussion
   - Average replies per user
   - Most active users

2. **Discussion Performance**
   - Views per discussion
   - Reply rate
   - Time to first reply

3. **User Behavior**
   - Peak reply times
   - Average reply length
   - User retention

---

## 🔄 Migration Path

### From No Community Discussions

1. Run migration
2. Restart backend
3. Rebuild frontend
4. Create first discussion from admin panel
5. Announce to users

### Rollback

If needed to rollback:

```bash
# Backend
npm run migrate:rollback

# Frontend
# Remove CommunityDiscussion component from Home.vue
# Remove route from router
# Remove menu from AdminSidebar
```

---

## 📝 Best Practices

### For Moderators

1. **Create Engaging Topics**
   - Ask open-ended questions
   - Be specific but not too narrow
   - Relate to current events or trends

2. **Moderate Actively**
   - Remove spam or inappropriate replies
   - Respond to user replies
   - Keep discussion on-topic

3. **Timing**
   - Activate discussion during peak hours
   - Change topics regularly (weekly/monthly)
   - Don't leave same discussion active too long

### For Developers

1. **Performance**
   - Monitor reply count per discussion
   - Add pagination if replies > 100
   - Consider caching active discussion

2. **Security**
   - Sanitize user input
   - Rate limit reply submissions
   - Validate permissions on every action

3. **UX**
   - Show loading states
   - Handle errors gracefully
   - Provide clear feedback

---

## 🎉 Success Metrics

Track these to measure feature success:

1. **Adoption Rate**
   - % of users who reply
   - % of active users who engage

2. **Engagement**
   - Average replies per discussion
   - Average time spent on discussion

3. **Retention**
   - Users who return to reply again
   - Discussion completion rate

---

## 📞 Support

For issues or questions:

1. Check backend logs for API errors
2. Check browser console for frontend errors
3. Verify permissions in database
4. Test with different user roles

Common issues:
- **Discussion not showing**: Check `is_active` status
- **Can't reply**: Check user authentication
- **Can't delete**: Check user permissions
- **Slow loading**: Check reply count, consider pagination

---

## ✅ Checklist

- [x] Database migration created
- [x] Models created (CommunityDiscussion, CommunityReply)
- [x] Service layer implemented
- [x] Controller implemented
- [x] Routes configured
- [x] Frontend component created
- [x] Admin page created
- [x] Router updated
- [x] Admin sidebar updated
- [x] Documentation created
- [ ] Migration run on production
- [ ] Feature tested end-to-end
- [ ] Users notified about new feature

---

Selamat menggunakan fitur Community Discussions! 🚀
