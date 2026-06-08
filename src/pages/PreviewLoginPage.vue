<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '@/lib/http'

const router = useRouter()
const route = useRoute()

const accessCode = ref('')
const enabled = ref<boolean | null>(null)
const submitting = ref(false)
const error = ref<string | null>(null)

function getRedirectTarget() {
  const raw = route.query.redirect
  if (typeof raw === 'string') {
    if (raw.startsWith('/preview')) return raw
    try {
      const decoded = decodeURIComponent(raw)
      if (decoded.startsWith('/preview')) return decoded
    } catch {
      return '/preview'
    }
  }
  return '/preview'
}

function getProjectId() {
  const raw = route.query.projectId
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
  return null
}

async function refresh() {
  const projectId = getProjectId()
  const url = projectId ? `/api/preview/config?projectId=${encodeURIComponent(projectId)}` : '/api/preview/config'
  const cfg = await apiFetch<{ enabled: boolean }>(url, {
    headers: {},
  })
  enabled.value = Boolean(cfg.enabled)
  if (!enabled.value) {
    window.location.href = getRedirectTarget()
  }
}

async function onSubmit() {
  error.value = null
  submitting.value = true
  try {
    const projectId = getProjectId()
    const url = projectId ? `/api/preview/login?projectId=${encodeURIComponent(projectId)}` : '/api/preview/login'
    const result = await apiFetch<{ success: boolean; ticket: string | null }>(url, {
      method: 'POST',
      body: JSON.stringify({ accessCode: accessCode.value }),
    })
    const target = getRedirectTarget()
    if (result.ticket) {
      const next = new URL(target, window.location.origin)
      next.searchParams.set('ticket', result.ticket)
      window.location.href = `${next.pathname}${next.search}${next.hash}`
      return
    }
    window.location.href = target
  } catch {
    error.value = '访问码不正确'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    await refresh()
  } catch {
    router.replace(getRedirectTarget())
  }
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <div class="mx-auto flex min-h-dvh max-w-md items-center px-6">
      <div class="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-6">
          <div class="flex items-center gap-3">
            <img alt="html-pre" class="h-9 w-9 rounded-lg border border-slate-200 bg-white object-contain" src="/favicon.png" />
            <div>
              <div class="text-sm text-slate-600">预览访问</div>
              <h1 class="mt-1 text-xl font-semibold tracking-tight text-slate-900">请输入访问码</h1>
            </div>
          </div>
        </div>

        <div v-if="enabled === null" class="text-sm text-slate-600">加载中…</div>
        <form v-else class="space-y-4" @submit.prevent="onSubmit">
          <input
            v-model="accessCode"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            placeholder="访问码"
            autocomplete="one-time-code"
          />

          <div
            v-if="error"
            class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ error }}
          </div>

          <button
            class="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submitting"
            type="submit"
          >
            {{ submitting ? '验证中…' : '进入预览' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
