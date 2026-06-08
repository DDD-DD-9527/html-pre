import { defineStore } from 'pinia'
import { apiFetch } from '@/lib/http'

export type CurrentRelease = {
  id: string
  versionLabel?: string
  fileName: string
  size: number
  uploadedAt: string
  previewUrl: string
}

export type ProjectSummary = {
  id: string
  name: string
  updatedAt: string
  currentRelease: Omit<CurrentRelease, 'previewUrl'> | null
  previewUrl: string
}

export type ReleaseSummary = {
  id: string
  version: number
  versionLabel: string
  fileName: string
  size: number
  uploadedAt: string
  isCurrent: boolean
  note?: string
  downloadUrl: string
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    projects: [] as ProjectSummary[],
    previewEnabled: false,
    loading: false,
  }),
  actions: {
    async refresh() {
      this.loading = true
      try {
        const [projectsRes, preview] = await Promise.all([
          apiFetch<{ projects: ProjectSummary[] }>('/api/projects'),
          apiFetch<{ enabled: boolean }>('/api/settings/preview'),
        ])
        this.projects = projectsRes.projects
        this.previewEnabled = Boolean(preview.enabled)
      } finally {
        this.loading = false
      }
    },
    async setPreviewConfig(enabled: boolean, accessCode?: string) {
      await apiFetch<{ success: boolean }>('/api/settings/preview', {
        method: 'PUT',
        body: JSON.stringify({ enabled, accessCode }),
      })
      await this.refresh()
    },
    async uploadHtml(file: File, projectName?: string, releaseNote?: string) {
      const form = new FormData()
      form.append('file', file)
      if (projectName && projectName.trim().length > 0) {
        form.append('projectName', projectName.trim())
      }
      if (releaseNote && releaseNote.trim().length > 0) {
        form.append('releaseNote', releaseNote.trim())
      }
      const res = await fetch('/api/releases/upload', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || String(res.status))
      }
      const data = (await res.json()) as {
        release: CurrentRelease
        project?: { id: string; name: string }
      }
      await this.refresh()
      return data
    },

    async renameProject(projectId: string, name: string) {
      const res = await apiFetch<{ success: boolean; project?: { id: string; name: string } }>(
        `/api/projects/${projectId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ name }),
        },
      )
      if (!res.success) throw new Error('Rename failed')
      await this.refresh()
      return res
    },

    async getProjectReleases(projectId: string) {
      const res = await apiFetch<{
        success: boolean
        project: { id: string; name: string }
        releases: ReleaseSummary[]
      }>(`/api/projects/${projectId}/releases`)
      return res
    },
  },
})
