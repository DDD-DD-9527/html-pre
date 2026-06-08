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
  if (typeof raw === 'string' && raw.startsWith('/preview')) return raw
  return '/preview'
}

async function refresh() {
  const cfg = await apiFetch<{ enabled: boolean }>('/api/preview/config', {
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
    await apiFetch<{ success: boolean }>('/api/preview/login', {
      method: 'POST',
      body: JSON.stringify({ accessCode: accessCode.value }),
    })
    window.location.href = getRedirectTarget()
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
  <div class="min-h-dvh bg-zinc-950 text-zinc-100">
    <div class="mx-auto flex min-h-dvh max-w-md items-center px-6">
      <div class="w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div class="mb-6">
          <div class="text-sm text-zinc-400">预览访问</div>
          <h1 class="mt-1 text-xl font-semibold tracking-tight">请输入访问码</h1>
        </div>

        <div v-if="enabled === null" class="text-sm text-zinc-400">加载中…</div>
        <form v-else class="space-y-4" @submit.prevent="onSubmit">
          <input
            v-model="accessCode"
            class="w-full rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm outline-none transition focus:border-zinc-600"
            placeholder="访问码"
            autocomplete="one-time-code"
          />

          <div
            v-if="error"
            class="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200"
          >
            {{ error }}
          </div>

          <button
            class="w-full rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
