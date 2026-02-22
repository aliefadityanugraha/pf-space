import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import Home from '../pages/Home.vue'
import Login from '../pages/auth/Login.vue'
import Register from '../pages/auth/Register.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../pages/About.vue')
  },
  {
    path: '/changelog',
    name: 'Changelog',
    component: () => import('../pages/Changelog.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../pages/Contact.vue')
  },
  {
    path: '/materi',
    name: 'Materi',
    component: () => import('../pages/Materi.vue')
  },
  {
    path: '/archive/:slug',
    name: 'ArchiveDetail',
    component: () => import('../pages/ArchiveDetail.vue'),
    alias: ['/film/:slug', '/detail/:slug']
  },
  {
    path: '/archive/:slug/study',
    name: 'StudyMode',
    component: () => import('../pages/StudyMode.vue'),
    alias: ['/film/:slug/study']
  },
  {
    path: '/archive/:archiveSlug/asset/:assetSlug',
    name: 'AssetDetail',
    component: () => import('../pages/LearningAsset.vue'),
    alias: ['/film/:archiveSlug/asset/:assetSlug']
  },
  {
    path: '/watch/:slug',
    redirect: to => ({ path: `/archive/${to.params.slug}` })
  },

  {
    path: '/upload',
    name: 'CreateArchive',
    component: () => import('../pages/CreateArchive.vue'),
    meta: { requiresAuth: true, requiresCreator: true }
  },
  {
    path: '/my-archive',
    name: 'MyArchive',
    component: () => import('../pages/MyArchive.vue'),
    meta: { requiresAuth: true, requiresCreator: true }
  },
  {
    path: '/edit-archive/:slug',
    name: 'EditArchive',
    component: () => import('../pages/EditArchive.vue'),
    meta: { requiresAuth: true, requiresCreator: true }
  },
  {
    path: '/p/:id',
    name: 'PublicProfile',
    component: () => import('../pages/PublicProfile.vue'),
    alias: ['/creator/:id']
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('../pages/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import('../pages/Collections.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/trending',
    name: 'Trending',
    component: () => import('../pages/Trending.vue')
  },
  {
    path: '/voting',
    redirect: '/trending'
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../pages/Privacy.vue')
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('../pages/Terms.vue')
  },
  {
    path: '/guidelines',
    name: 'Guidelines',
    component: () => import('../pages/Pedoman.vue'),
    alias: ['/pedoman']
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
    component: () => import('../pages/auth/Forgot.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/auth/reset-password',
    name: 'ResetPassword',
    component: () => import('../pages/auth/ResetPassword.vue'),
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
    path: '/admin/archives',
    name: 'AdminArchives',
    component: () => import('../pages/admin/Archives.vue'),
    meta: { requiresAuth: true, requiresModerator: true }
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: () => import('../pages/admin/Reports.vue'),
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
    path: '/admin/trending',
    name: 'TrendingManager',
    component: () => import('../pages/admin/TrendingManager.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/community',
    name: 'CommunityDiscussions',
    component: () => import('../pages/admin/CommunityDiscussions.vue'),
    meta: { requiresAuth: true, requiresModerator: true }
  },
  {
    path: '/manage-materi',
    name: 'MaterialManager',
    component: () => import('@/pages/MaterialManager.vue'),
    meta: { requiresAuth: true, requiresModerator: true }
  },
  {
    path: '/admin/help',
    name: 'AdminHelp',
    component: () => import('../pages/admin/Help.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/comments',
    name: 'AdminComments',
    component: () => import('../pages/admin/Comments.vue'),
    meta: { requiresAuth: true, requiresModerator: true }
  },
  {
    path: '/admin/storage',
    name: 'AdminStorage',
    component: () => import('../pages/admin/StorageManager.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { left: 0, top: 0 }
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
