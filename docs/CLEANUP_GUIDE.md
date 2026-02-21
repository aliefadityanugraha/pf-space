# 🧹 Cleanup & Maintenance Guide

Panduan untuk membersihkan dan maintain project CineArchive.

## 📋 Checklist Cleanup

### 1. Dependencies Cleanup

```bash
# Backend
cd backend
npm prune
npm audit fix

# Frontend
cd frontend
pnpm prune
pnpm audit
```

### 2. Database Cleanup

```bash
# Hapus data test/dummy
cd backend
node scripts/cleanup-test-data.js

# Reset database (HATI-HATI: Menghapus semua data!)
npm run migrate:rollback
npm run migrate
npm run seed
```

### 3. File Uploads Cleanup

```bash
# Hapus file yang tidak terpakai (orphaned files)
cd backend
node scripts/cleanup-orphaned-files.js

# Hapus file temporary
rm -rf uploads/*.tmp
```

### 4. Logs Cleanup

```bash
# Hapus log files
rm -rf *.log
rm -rf logs/*.log

# Clear console logs di production
# Set NODE_ENV=production untuk disable verbose logging
```

## 🗑️ File yang Aman Dihapus

### Development Files
- `node_modules/` - Bisa di-install ulang dengan `npm install`
- `dist/` atau `build/` - Generated files
- `.cache/` - Cache files
- `*.log` - Log files

### Temporary Files
- `uploads/*.tmp` - Temporary upload files
- `.DS_Store` - macOS system files
- `Thumbs.db` - Windows thumbnail cache

## ⚠️ File yang TIDAK Boleh Dihapus

### Critical Files
- `.env` - Environment configuration (backup dulu!)
- `package.json` - Dependencies definition
- `knexfile.js` - Database configuration
- `migrations/` - Database schema history
- `uploads/.gitkeep` - Placeholder untuk folder uploads

### Source Code
- `src/` - Application source code
- `public/` - Static assets
- `components/` - UI components

## 🔄 Maintenance Tasks

### Daily
- Monitor error logs
- Check disk space untuk uploads
- Review failed uploads

### Weekly
- Cleanup orphaned files
- Database backup
- Check for security updates

### Monthly
- Update dependencies
- Review and optimize database
- Clean old draft data dari localStorage

## 📊 Monitoring

### Disk Usage

```bash
# Check uploads folder size
du -sh backend/uploads

# Check database size
mysql -u root -p -e "SELECT table_schema AS 'Database', 
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
  FROM information_schema.TABLES 
  WHERE table_schema = 'si_film_archive' 
  GROUP BY table_schema;"
```

### Database Stats

```bash
# Count records
cd backend
node scripts/db-stats.js
```

## 🛠️ Utility Scripts

### Create Cleanup Scripts

File: `backend/scripts/cleanup-orphaned-files.js`

```javascript
import fs from 'fs'
import path from 'path'
import { Film } from '../src/models/Film.js'

async function cleanupOrphanedFiles() {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const files = fs.readdirSync(uploadsDir)
  
  const films = await Film.query()
  const usedFiles = new Set()
  
  films.forEach(film => {
    if (film.gambar_poster) usedFiles.add(path.basename(film.gambar_poster))
    if (film.banner_url) usedFiles.add(path.basename(film.banner_url))
    if (film.link_video_utama) usedFiles.add(path.basename(film.link_video_utama))
    if (film.link_trailer) usedFiles.add(path.basename(film.link_trailer))
    if (film.file_naskah) usedFiles.add(path.basename(film.file_naskah))
    if (film.file_storyboard) usedFiles.add(path.basename(film.file_storyboard))
    if (film.file_rab) usedFiles.add(path.basename(film.file_rab))
  })
  
  let deletedCount = 0
  files.forEach(file => {
    if (file === '.gitkeep') return
    if (!usedFiles.has(file)) {
      fs.unlinkSync(path.join(uploadsDir, file))
      deletedCount++
      console.log('Deleted:', file)
    }
  })
  
  console.log(`Cleanup complete. Deleted ${deletedCount} orphaned files.`)
}

cleanupOrphanedFiles()
```

### Database Stats Script

File: `backend/scripts/db-stats.js`

```javascript
import { knex } from '../src/database/connection.js'

async function getStats() {
  const stats = {
    users: await knex('users').count('* as count').first(),
    films: await knex('films').count('* as count').first(),
    discussions: await knex('discussions').count('* as count').first(),
    votes: await knex('votes').count('* as count').first(),
    collections: await knex('collections').count('* as count').first()
  }
  
  console.log('Database Statistics:')
  console.log('-------------------')
  Object.entries(stats).forEach(([table, data]) => {
    console.log(`${table}: ${data.count}`)
  })
  
  await knex.destroy()
}

getStats()
```

## 🔐 Security Cleanup

### Remove Sensitive Data

```bash
# Remove .env from git history (if accidentally committed)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (HATI-HATI!)
git push origin --force --all
```

### Clear Session Data

```bash
# Clear all sessions (force re-login)
mysql -u root -p si_film_archive -e "TRUNCATE TABLE sessions;"
```

## 📝 Backup Before Cleanup

```bash
# Backup database
mysqldump -u root -p si_film_archive > backup_$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Backup .env
cp backend/.env backend/.env.backup
cp frontend/.env frontend/.env.backup
```

## 🚀 Production Cleanup

### Before Deploy

1. Remove development dependencies
2. Minify assets
3. Remove source maps
4. Clear test data
5. Optimize images

### After Deploy

1. Monitor error logs
2. Check performance metrics
3. Verify all features working
4. Test upload functionality

## 📞 Support

Jika ada masalah saat cleanup:
1. Check logs untuk error messages
2. Restore dari backup jika perlu
3. Konsultasi dengan team lead
