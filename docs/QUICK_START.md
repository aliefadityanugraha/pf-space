# ⚡ Quick Start Guide

Panduan cepat untuk menjalankan CineArchive dalam 5 menit.

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- pnpm (install: `npm install -g pnpm`)

## 🚀 Setup (5 Menit)

### 1. Clone & Install (2 menit)

```bash
# Clone repository
git clone <repository-url>
cd si-film-archive

# Install backend
cd backend
npm install

# Install frontend (terminal baru)
cd frontend
pnpm install
```

### 2. Database Setup (1 menit)

```bash
# Buat database
mysql -u root -p -e "CREATE DATABASE si_film_archive"

# Setup environment
cd backend
cp .env.example .env
# Edit .env: DB_NAME, DB_USER, DB_PASS, BETTER_AUTH_SECRET

# Run migrations
npm run migrate
npm run seed
```

### 3. Run Development (1 menit)

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Running on http://localhost:3000

# Terminal 2: Frontend
cd frontend
pnpm dev
# Running on http://localhost:5173
```

### 4. Create Admin User (1 menit)

```bash
# Register via UI: http://localhost:5173/register
# Then make admin:
cd backend
node scripts/make-admin.js your-email@example.com
```

## ✅ Verify Installation

1. Open http://localhost:5173
2. Register new account
3. Login
4. Try upload film (akan pending review)
5. Login as admin, approve film

## 🎯 Key URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/api/health

## 📝 Environment Variables

### Backend (.env)

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=si_film_archive
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check MySQL running
mysql -u root -p -e "SELECT 1"

# Verify database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'si_film_archive'"
```

### Port Already in Use
```bash
# Backend (port 3000)
# Windows: netstat -ano | findstr :3000
# Linux/Mac: lsof -i :3000

# Frontend (port 5173)
# Change in vite.config.js: server: { port: 5174 }
```

### Upload Not Working
```bash
# Check uploads folder exists
ls backend/uploads

# Check permissions
chmod 755 backend/uploads
```

## 📚 Next Steps

- Read [Documentation](./docs/)
- Check [API Reference](./docs/API_REFERENCE.md)
- Learn [Upload System](./docs/UPLOAD_SYSTEM.md)
- Review [Database Schema](./docs/DATABASE.md)

## 💡 Tips

- Use `npm run dev` untuk auto-reload backend
- Frontend hot-reload otomatis aktif
- Check browser console untuk errors
- Check terminal untuk backend logs

## 🆘 Need Help?

- Check [docs/](./docs/) folder
- Open an issue
- Read error messages carefully
