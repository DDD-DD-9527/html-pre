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
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <div class="mx-auto flex min-h-dvh max-w-md items-center px-6">
      <div class="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-6">
          <div class="flex items-center gap-3">
            <img alt="html-pre" class="h-9 w-9 rounded-lg border border-slate-200 bg-white object-contain" src="/favicon.png" />
            <div>
              <div class="text-sm text-slate-600">html-pre</div>
              <h1 class="mt-1 text-xl font-semibold tracking-tight text-slate-900">登录</h1>
            </div>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-2">
            <label class="text-sm text-slate-700">账号</label>
            <input
              v-model="username"
              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autocomplete="username"
              placeholder="请输入账号"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm text-slate-700">密码</label>
            <input
              v-model="password"
              type="password"
              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autocomplete="current-password"
              placeholder="请输入密码"
            />
          </div>

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
            {{ submitting ? '登录中…' : '登录' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
