# 🎬 CineArchive - Project Overview

Platform kearsipan film siswa untuk apresiasi, dokumentasi, dan pembelajaran karya sinematik.

## 🎯 Vision & Mission

**Vision**: Menjadi platform terdepan untuk dokumentasi dan apresiasi karya film siswa di Indonesia.

**Mission**:
- Menyediakan platform yang mudah untuk upload dan share karya film
- Memfasilitasi pembelajaran melalui akses ke aset produksi (naskah, storyboard, RAB)
- Membangun komunitas filmmaker muda yang saling support
- Mengarsipkan karya film siswa untuk generasi mendatang

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CINEARCHIVE                               │
│                     Monorepo Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │      FRONTEND        │         │      BACKEND         │      │
│  │                      │         │                      │      │
│  │  Vue 3 + Vite        │◄───────►│  Fastify + MySQL     │      │
│  │  Tailwind CSS        │  HTTP   │  Objection.js        │      │
│  │  Tus-js-client       │  REST   │  Tus Server          │      │
│  │                      │   API   │  Better Auth         │      │
│  └──────────────────────┘         └──────────────────────┘      │
│           │                                 │                    │
│           │                                 │                    │
│           ▼                                 ▼                    │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │   localStorage       │         │   MySQL Database     │      │
│  │   (Draft Storage)    │         │   (Persistent Data)  │      │
│  └──────────────────────┘         └──────────────────────┘      │
│                                             │                    │
│                                             ▼                    │
│                                    ┌──────────────────────┐      │
│                                    │   File Storage       │      │
│                                    │   /uploads/          │      │
│                                    └──────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Tech Stack

### Frontend
```
Vue 3 (Composition API)
├── Vite (Build Tool)
├── Vue Router (Routing)
├── Tailwind CSS v4 (Styling)
├── shadcn/ui Vue (UI Components)
├── Tiptap (Rich Text Editor)
├── Tus-js-client (Resumable Upload)
├── Swiper (Carousel)
└── Unhead (SEO)
```

### Backend
```
Fastify (Web Framework)
├── Objection.js (ORM)
├── Knex (Query Builder)
├── MySQL (Database)
├── Better Auth (Authentication)
├── Tus Server (Upload Handler)
├── Zod (Validation)
└── Groq/OpenAI/Gemini (AI)
```

## 🎨 Design System

**Neo-Brutalism Style**:
- Bold borders (2px black)
- Hard shadows (no blur)
- High contrast colors
- Sharp corners or minimal radius
- Playful yet professional

**Color Palette**:
```
Primary:   #265C5C (Teal)
Accent:    #ef4444 (Red)
Highlight: #f97316 (Orange)
Background:#F2EEE3 (Cream)
Text:      #1c1917 (Stone 900)
```

## 🔐 Security

### Authentication
- Email/Password with Better Auth
- Google OAuth (optional)
- Session-based authentication
- Secure cookie handling

### Authorization
- Role-Based Access Control (RBAC)
- 4 Roles: User, Creator, Moderator, Admin
- Middleware protection for routes
- Owner-based permissions

### File Upload
- File type validation
- Size limits enforcement
- Sanitized filenames
- Secure file serving

## 📊 Database Schema

```
roles (1) ──────< users (many)
users (1) ──────< films (many)
users (1) ──────< discussions (many)
users (1) ──────< votes (many)
users (1) ──────< collections (many)
categories (1) ─< films (many)
films (1) ──────< discussions (many)
films (1) ──────< votes (many)
discussions (1) < discussions (many) [self-referencing]
```

## 🚀 Key Features

### 1. Resumable Upload (Tus.io)
- Upload file hingga 1GB
- Auto-resume jika koneksi terputus
- Progress tracking real-time
- Retry mechanism dengan exponential backoff

### 2. Draft System
- Auto-save form data setiap 3 detik
- Persist ke localStorage
- Recovery setelah browser crash
- Draft expiry 7 hari

### 3. Hybrid Streaming
- YouTube embed support
- Direct video upload (MP4/WebM)
- Adaptive player
- Fallback mechanism

### 4. Discussion System
- Nested comments (max 5 levels)
- Real-time updates
- Markdown support
- Moderation tools

### 5. Voting & Trending
- One vote per user per film
- Trending by period (week/month/all)
- Vote count display
- Toggle vote functionality

### 6. Collections
- Bookmark favorite films
- Personal collection management
- Quick access
- Share collections (future)

### 7. Learning Assets
- PDF viewer untuk naskah
- Storyboard access
- RAB (Budget) documents
- Download capability

### 8. Admin Dashboard
- User management
- Film approval workflow
- Content moderation
- Analytics (future)

## 📈 Performance

### Frontend
- Code splitting dengan Vite
- Lazy loading components
- Image optimization
- Minimal bundle size

### Backend
- Connection pooling
- Query optimization
- Caching strategy (future)
- Rate limiting

### Upload
- Chunked upload (Tus)
- Resume capability
- Progress tracking
- Error recovery

## 🧪 Testing Strategy

```
E2E Tests (Critical Paths)
├── Upload flow
├── Authentication
└── Film approval

Integration Tests
├── API endpoints
├── Database operations
└── File handling

Unit Tests
├── Composables
├── Controllers
├── Services
└── Utilities
```

## 📱 Responsive Design

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile-First Approach**:
- Touch-friendly UI
- Optimized images
- Simplified navigation
- Performance optimized

## 🌐 Browser Support

- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 🔄 Development Workflow

```
1. Feature Branch
   ├── Create branch from develop
   ├── Implement feature
   ├── Write tests
   └── Update docs

2. Code Review
   ├── Create Pull Request
   ├── CI/CD checks
   ├── Peer review
   └── Address feedback

3. Merge & Deploy
   ├── Merge to develop
   ├── Test on staging
   ├── Merge to main
   └── Deploy to production
```

## 📚 Documentation Structure

```
docs/
├── PROJECT_STRUCTURE.md    # Architecture & folder structure
├── API_REFERENCE.md        # Complete API documentation
├── DATABASE.md             # Database schema & relations
├── API_STANDARDS.md        # Response format standards
├── UPLOAD_SYSTEM.md        # Upload & draft system
├── TESTING_GUIDE.md        # Testing strategies
├── DEVELOPMENT.md          # Development guide
├── CLEANUP_GUIDE.md        # Maintenance guide
└── ROADMAP.md              # Future features

Root:
├── README.md               # Main documentation
├── QUICK_START.md          # 5-minute setup guide
├── CONTRIBUTING.md         # Contribution guidelines
├── CHANGELOG.md            # Version history
└── PROJECT_OVERVIEW.md     # This file
```

## 🎯 Success Metrics

### User Engagement
- Monthly active users
- Films uploaded per month
- Comments per film
- Vote participation rate

### Performance
- Page load time < 2s
- Upload success rate > 95%
- API response time < 200ms
- Uptime > 99.5%

### Quality
- Test coverage > 80%
- Zero critical bugs
- Accessibility score > 95
- SEO score > 90

## 🚧 Roadmap

### Phase 1 (Current) ✅
- [x] Core features
- [x] Upload system
- [x] Draft management
- [x] Documentation

### Phase 2 (Q1 2025)
- [ ] Advanced search & filters
- [ ] User profiles enhancement
- [ ] Notification system
- [ ] Email notifications

### Phase 3 (Q2 2025)
- [ ] Analytics dashboard
- [ ] Export/import features
- [ ] API rate limiting
- [ ] CDN integration

### Phase 4 (Q3 2025)
- [ ] Mobile app (React Native)
- [ ] Advanced moderation tools
- [ ] Community features
- [ ] Monetization options

## 🤝 Contributing

We welcome contributions! Please read:
- [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for setup
- [TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) for testing

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: GitHub Issues
- **Email**: support@cinearchive.com (if available)
- **Discord**: Join our community (if available)

## 📄 License

[Add license information here]

## 🙏 Acknowledgments

- Vue.js team for amazing framework
- Fastify team for fast web framework
- Tus.io for resumable upload protocol
- shadcn/ui for beautiful components
- All contributors and supporters

---

**Built with ❤️ by the CineArchive Team**

Last Updated: 2025-02-13
