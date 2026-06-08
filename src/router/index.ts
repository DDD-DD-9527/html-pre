import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LoginPage from '@/pages/LoginPage.vue'
import AdminPage from '@/pages/AdminPage.vue'
import PreviewLoginPage from '@/pages/PreviewLoginPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/admin',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPage,
    meta: { requiresAdmin: true },
  },
  {
    path: '/preview-login',
    name: 'preview-login',
    component: PreviewLoginPage,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

async function getAuthStatus(): Promise<{ loggedIn: boolean }> {
  const res = await fetch('/api/auth/status', { credentials: 'include' })
  if (!res.ok) return { loggedIn: false }
  const data = (await res.json()) as { loggedIn: boolean }
  return { loggedIn: Boolean(data.loggedIn) }
}

router.beforeEach(async (to) => {
  const requiresAdmin = Boolean(to.meta.requiresAdmin)
  if (!requiresAdmin && to.path !== '/login') return true

  const { loggedIn } = await getAuthStatus()

  if (to.path === '/login') {
    if (loggedIn) return { path: '/admin' }
    return true
  }

  if (!loggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
