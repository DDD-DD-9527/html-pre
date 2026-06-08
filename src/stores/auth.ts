import { defineStore } from 'pinia'
import { apiFetch } from '@/lib/http'

type AuthStatus = {
  loggedIn: boolean
  username?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    status: 'unknown' as 'unknown' | 'loggedIn' | 'loggedOut',
    username: undefined as string | undefined,
    loading: false,
  }),
  actions: {
    async refresh() {
      this.loading = true
      try {
        const data = await apiFetch<AuthStatus>('/api/auth/status')
        this.status = data.loggedIn ? 'loggedIn' : 'loggedOut'
        this.username = data.username
      } finally {
        this.loading = false
      }
    },
    async login(username: string, password: string) {
      await apiFetch<{ success: boolean }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      await this.refresh()
    },
    async logout() {
      await apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' })
      this.status = 'loggedOut'
      this.username = undefined
    },
  },
})

