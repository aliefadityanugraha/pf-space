# CineArchive (Frontend)

Frontend aplikasi arsip film dengan Vue 3 dan brutal design system. Belum terintegrasi dengan backend.

## Tech Stack

- **Vue 3** - Composition API dengan `<script setup>`
- **Vite** - Build tool
- **Tailwind CSS** - Styling dengan custom brutal design tokens
- **shadcn/ui Vue** - UI components
- **Vue Router** - Client-side routing
- **Lucide Vue** - Icons

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── ui/          # shadcn/ui components
│   └── ...
├── pages/           # Route pages
│   ├── admin/       # Admin pages
│   └── auth/        # Auth pages
├── router/          # Vue Router config
├── lib/             # Utilities
└── assets/          # Static assets
```

## Pages

| Route | Halaman |
|-------|---------|
| `/` | Home |
| `/about` | About |
| `/detail/:id` | Detail Film |
| `/dashboard` | User Dashboard |
| `/upload` | Upload Film |
| `/profile` | User Profile |
| `/voting` | Voting Film Populer |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/auth/forgot` | Forgot Password |
| `/admin/dashboard` | Admin Dashboard |
| `/admin/rbac` | Role Based Access Control |
| `/*` | 404 Not Found |

## Design System

Brutal/neo-brutalist design:
- No border radius
- Bold shadows (`shadow-brutal`)
- High contrast borders
- Brand colors: Red (`#ef4444`), Teal (`#265C5C`), Orange (`#fdba74`), Cream (`#e7e5e4`)

## TODO

- [ ] Integrasi backend API
- [ ] State management (Pinia)
- [ ] Authentication flow
- [ ] Form validation
