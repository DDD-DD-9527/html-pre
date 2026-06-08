<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <div class="mx-auto flex min-h-dvh max-w-xl items-center px-6">
      <div class="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-3">
          <img alt="html-pre" class="h-9 w-9 rounded-lg border border-slate-200 bg-white object-contain" src="/favicon.png" />
          <div>
            <div class="text-sm text-slate-600">404</div>
            <div class="mt-1 text-xl font-semibold tracking-tight text-slate-900">页面不存在</div>
          </div>
        </div>
        <button
          class="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          @click="router.replace('/admin')"
        >
          返回后台
        </button>
      </div>
    </div>
  </div>
</template>
