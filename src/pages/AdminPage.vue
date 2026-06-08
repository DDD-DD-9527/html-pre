<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ExternalLink,
  Link as LinkIcon,
  LogOut,
  Shield,
  Upload,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const auth = useAuthStore()
const admin = useAdminStore()

const fileRef = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const busy = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

const accessCode = ref('')
const selectedProjectId = ref<string>('')
const newProjectName = ref('')

const origin = window.location.origin

const selectedProject = computed(() => {
  if (selectedProjectId.value) {
    return admin.projects.find((p) => p.id === selectedProjectId.value)
  }
  return admin.projects[0]
})

const selectedRelease = computed(() => selectedProject.value?.currentRelease || null)
const previewUrl = computed(() => selectedProject.value?.previewUrl || '/preview')

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

async function refreshAll() {
  await Promise.all([auth.refresh(), admin.refresh()])
}

async function onLogout() {
  await auth.logout()
  await router.replace('/login')
}

async function onPickFile() {
  fileRef.value?.click()
}

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await upload(file)
  input.value = ''
}

async function upload(file: File) {
  message.value = null
  error.value = null
  busy.value = true
  try {
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      throw new Error('仅支持 .html/.htm 文件')
    }
    const projectName =
      newProjectName.value.trim().length > 0
        ? newProjectName.value.trim()
        : selectedProject.value?.name || '默认项目'
    const result = await admin.uploadHtml(file, projectName)
    if (result.project?.id) {
      selectedProjectId.value = result.project.id
    }
    newProjectName.value = ''
    message.value = '上传成功，已发布为当前预览版本'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '上传失败'
  } finally {
    busy.value = false
  }
}

async function copyPreviewLink() {
  const url = `${window.location.origin}${previewUrl.value}`
  await navigator.clipboard.writeText(url)
  message.value = '已复制预览链接'
}

async function openPreview() {
  window.open(previewUrl.value, '_blank', 'noopener,noreferrer')
}

async function applyPreviewSetting(nextEnabled: boolean) {
  message.value = null
  error.value = null
  busy.value = true
  try {
    if (nextEnabled) {
      const code = accessCode.value.trim()
      if (!code) throw new Error('开启访问码模式需要先设置访问码')
      await admin.setPreviewConfig(true, code)
      message.value = '已开启访问码模式'
    } else {
      await admin.setPreviewConfig(false)
      message.value = '已切换为公开预览'
    }
    accessCode.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : '设置失败'
  } finally {
    busy.value = false
  }
}

async function updateAccessCode() {
  message.value = null
  error.value = null
  busy.value = true
  try {
    const code = accessCode.value.trim()
    if (!code) throw new Error('请输入新的访问码')
    await admin.setPreviewConfig(true, code)
    accessCode.value = ''
    message.value = '访问码已更新'
  } catch (e) {
    error.value = e instanceof Error ? e.message : '设置失败'
  } finally {
    busy.value = false
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  await upload(file)
}

onMounted(async () => {
  await refreshAll()
  if (!selectedProjectId.value && admin.projects[0]?.id) {
    selectedProjectId.value = admin.projects[0].id
  }
})
</script>

<template>
  <div class="min-h-dvh bg-slate-50 text-slate-900">
    <div class="mx-auto max-w-5xl px-6 py-8">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <img alt="html-pre" class="h-9 w-9 rounded-lg border border-slate-200 bg-white object-contain" src="/favicon.png" />
            <div>
              <div class="text-sm text-slate-600">html-pre</div>
              <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">发布与预览</h1>
            </div>
          </div>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          :disabled="busy"
          @click="onLogout"
        >
          <LogOut class="h-4 w-4" />
          退出
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <div class="text-sm font-medium text-slate-900">上传 HTML</div>
            <button
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="busy"
              @click="onPickFile"
            >
              <Upload class="h-4 w-4" />
              选择文件
            </button>
            <input
              ref="fileRef"
              class="hidden"
              type="file"
              accept=".html,.htm,text/html"
              @change="onFileSelected"
            />
          </div>

          <div
            class="group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition"
            :class="dragging ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'"
            @click="onPickFile"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
          >
            <div class="text-sm text-slate-900">拖拽 HTML 到这里发布</div>
            <div class="mt-1 text-xs text-slate-500">仅支持 .html/.htm，上传后立即生效</div>
          </div>

          <div class="mt-4 space-y-2">
            <div class="text-xs text-slate-500">项目名（可新建）</div>
            <input
              v-model="newProjectName"
              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="输入新项目名（留空则上传到当前选择项目）"
            />
            <div class="text-xs text-slate-500">当前选择</div>
            <select
              v-model="selectedProjectId"
              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option v-for="p in admin.projects" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-3 text-sm font-medium text-slate-900">当前发布</div>
          <div v-if="admin.loading" class="text-sm text-slate-600">加载中…</div>
          <div v-else-if="!selectedRelease" class="text-sm text-slate-600">暂无已发布 HTML</div>
          <div v-else class="space-y-2">
            <div class="text-sm text-slate-900">{{ selectedRelease.fileName }}</div>
            <div class="text-xs text-slate-500">
              {{ formatBytes(selectedRelease.size) }} · {{ new Date(selectedRelease.uploadedAt).toLocaleString() }}
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                :disabled="busy"
                @click="copyPreviewLink"
              >
                <LinkIcon class="h-4 w-4" />
                复制链接
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                :disabled="busy"
                @click="openPreview"
              >
                <ExternalLink class="h-4 w-4" />
                打开预览
              </button>
            </div>

            <div class="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {{ origin }}{{ previewUrl }}
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <div class="mb-3 text-sm font-medium text-slate-900">项目列表</div>
          <div v-if="admin.loading" class="text-sm text-slate-600">加载中…</div>
          <div v-else-if="admin.projects.length === 0" class="text-sm text-slate-600">暂无项目</div>
          <div v-else class="overflow-hidden rounded-xl border border-slate-200">
            <div class="grid grid-cols-12 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <div class="col-span-4">项目名</div>
              <div class="col-span-5">当前文件</div>
              <div class="col-span-3 text-right">操作</div>
            </div>
            <button
              v-for="p in admin.projects"
              :key="p.id"
              class="grid w-full grid-cols-12 items-center px-3 py-2 text-left text-sm transition"
              :class="p.id === selectedProjectId ? 'bg-blue-50' : 'hover:bg-slate-50'"
              @click="selectedProjectId = p.id"
            >
              <div class="col-span-4 truncate text-slate-900">{{ p.name }}</div>
              <div class="col-span-5 truncate text-slate-600">
                {{ p.currentRelease ? p.currentRelease.fileName : '未发布' }}
              </div>
              <div class="col-span-3 flex justify-end gap-2">
                <span class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                  {{ p.previewUrl }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <div class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
            <Shield class="h-4 w-4 text-slate-600" />
            预览访问控制
          </div>

          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div class="text-sm text-slate-900">
                当前：{{ admin.previewEnabled ? '需访问码' : '公开预览' }}
              </div>
              <div class="mt-1 text-xs text-slate-500">
                开启后，客户访问预览链接会先输入访问码；关闭后可直接预览。
              </div>
            </div>

            <button
              class="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              :class="admin.previewEnabled ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-blue-600 text-white hover:bg-blue-700'"
              :disabled="busy"
              @click="applyPreviewSetting(!admin.previewEnabled)"
            >
              {{ admin.previewEnabled ? '切换为公开预览' : '开启访问码' }}
            </button>
          </div>

          <div class="mt-4 grid gap-2 md:grid-cols-3">
            <input
              v-model="accessCode"
              class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 md:col-span-2"
              placeholder="设置/更新访问码（开启访问码时必填）"
            />
            <button
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="busy || !admin.previewEnabled"
              @click="updateAccessCode"
            >
              更新访问码
            </button>
          </div>
        </div>
      </div>

      <div v-if="message" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {{ message }}
      </div>
      <div v-if="error" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ error }}
      </div>
    </div>
  </div>
</template>
