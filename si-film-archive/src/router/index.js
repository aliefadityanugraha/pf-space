import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Home from '../pages/Home.vue'
import About from '../pages/About.vue'
import Contact from '../pages/Contact.vue'
import Detail from '../pages/Detail.vue'
import LearningAsset from '../pages/LearningAsset.vue'
import DashboardUser from '../pages/DashboardUser.vue'
import Upload from '../pages/Upload.vue'
import MyFilms from '../pages/MyFilms.vue'
import EditFilm from '../pages/EditFilm.vue'
import Profile from '../pages/Profile.vue'
import Collections from '../pages/Collections.vue'
import Login from '../pages/auth/Login.vue'
import Register from '../pages/auth/Register.vue'
import Forgot from '../pages/auth/Forgot.vue'
import NotFound from '../pages/NotFound.vue'
import Voting from '../pages/Voting.vue'
import Watch from '../pages/Watch.vue'
import Privacy from '../pages/Privacy.vue'
import Terms from '../pages/Terms.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact
  },
  {
    path: '/film/:slug',
    name: 'Detail',
    component: Detail,
    alias: ['/detail/:slug']
  },
  {
    path: '/film/:filmSlug/asset/:assetSlug',
    name: 'LearningAsset',
    component: LearningAsset
  },
  {
    path: '/watch/:slug',
    name: 'Watch',
    component: Watch
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardUser,
    meta: { requiresAuth: true }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload,
    meta: { requiresAuth: true, requiresCreator: true }
  },
  {
    path: '/my-films',
    name: 'MyFilms',
    component: MyFilms,
    meta: { requiresAuth: true, requiresCreator: true }
  },
  {
    path: '/edit-film/:slug',
    name: 'EditFilm',
    component: EditFilm,
    meta: { requiresAuth: true, requiresCreator: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/collections',
    name: 'Collections',
    component: Collections,
    meta: { requiresAuth: true }
  },
  {
    path: '/voting',
    name: 'Voting',
    component: Voting
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: Privacy
  },
  {
    path: '/terms',
    name: 'Terms',
    component: Terms
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: Register,
    meta: { guestOnly: true }
  },
  {
    path: '/auth/forgot',
    name: 'Forgot',
    component: Forgot,
    meta: { guestOnly: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../pages/admin/DashboardAdmin.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/rbac',
    name: 'RBAC',
    component: () => import('../pages/admin/RBAC.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/categories',
    name: 'AdminCategories',
    component: () => import('../pages/admin/Categories.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../pages/admin/Users.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/films',
    name: 'AdminFilms',
    component: () => import('../pages/admin/Films.vue'),
    meta: { requiresAuth: true, requiresModerator: true }
  },
  {
    path: '/admin/uploads',
    name: 'AdminUploads',
    component: () => import('../pages/admin/Uploads.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: () => import('../pages/admin/Reports.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/analytics',
    name: 'AdminAnalytics',
    component: () => import('../pages/admin/Analytics.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/notifications',
    name: 'AdminNotifications',
    component: () => import('../pages/admin/Notifications.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: () => import('../pages/admin/Settings.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/help',
    name: 'AdminHelp',
    component: () => import('../pages/admin/Help.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/carousel',
    name: 'AdminCarousel',
    component: () => import('../pages/admin/CarouselManager.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { left: 0, top: 0, behavior: 'smooth' }
  }
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const { isLoggedIn, isAdmin, isModerator, isCreator, initialized, init } = useAuth()
  
  // Wait for auth to initialize
  if (!initialized.value) {
    await init()
  }
  
  // Check auth requirements
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return next({ name: 'Home' })
  }
  
  if (to.meta.requiresCreator && !isCreator.value) {
    return next({ name: 'Home' })
  }
  
  if (to.meta.requiresModerator && !isModerator.value) {
    return next({ name: 'Home' })
  }
  
  // Redirect logged in users away from guest-only pages
  if (to.meta.guestOnly && isLoggedIn.value) {
    return next({ name: 'Home' })
  }
  
  next()
})

export default router
