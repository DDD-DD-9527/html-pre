<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

const redirectTo = computed(() => {
  const raw = route.query.redirect
  return typeof raw === 'string' && raw.length > 0 ? raw : '/admin'
})

async function onSubmit() {
  error.value = null
  submitting.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    await router.replace(redirectTo.value)
  } catch {
    error.value = '账号或密码错误'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh bg-zinc-950 text-zinc-100">
    <div class="mx-auto flex min-h-dvh max-w-md items-center px-6">
      <div class="w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div class="mb-6">
          <div class="text-sm text-zinc-400">HTML 预览后台</div>
          <h1 class="mt-1 text-xl font-semibold tracking-tight">登录</h1>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-2">
            <label class="text-sm text-zinc-300">账号</label>
            <input
              v-model="username"
              class="w-full rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-600"
              autocomplete="username"
              placeholder="请输入账号"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm text-zinc-300">密码</label>
            <input
              v-model="password"
              type="password"
              class="w-full rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm outline-none ring-0 transition focus:border-zinc-600"
              autocomplete="current-password"
              placeholder="请输入密码"
            />
          </div>

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
            {{ submitting ? '登录中…' : '登录' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

