<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-dvh bg-zinc-950 text-zinc-100">
    <div class="mx-auto flex min-h-dvh max-w-xl items-center px-6">
      <div class="w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div class="text-sm text-zinc-400">404</div>
        <div class="mt-1 text-xl font-semibold tracking-tight">页面不存在</div>
        <button
          class="mt-6 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white"
          @click="router.replace('/admin')"
        >
          返回后台
        </button>
      </div>
    </div>
  </div>
</template>

