import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import About from '../pages/About.vue'
import Detail from '../pages/Detail.vue'
import DashboardUser from '../pages/DashboardUser.vue'
import Upload from '../pages/Upload.vue'
import Profile from '../pages/Profile.vue'
import Login from '../pages/auth/Login.vue'
import Register from '../pages/auth/Register.vue'
import Forgot from '../pages/auth/Forgot.vue'
import DashboardAdmin from '../pages/admin/DashboardAdmin.vue'
import RBAC from '../pages/admin/RBAC.vue'
import NotFound from '../pages/NotFound.vue'
import Voting from '../pages/Voting.vue'

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
    path: '/detail/:id?',
    name: 'Detail',
    component: Detail
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardUser
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/voting',
    name: 'Voting',
    component: Voting
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/auth/forgot',
    name: 'Forgot',
    component: Forgot
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: DashboardAdmin
  },
  {
    path: '/admin/rbac',
    name: 'RBAC',
    component: RBAC
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
