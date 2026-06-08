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
  previewEnabled: boolean
  previewHasAccessCode: boolean
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
    loading: false,
  }),
  actions: {
    async refresh() {
      this.loading = true
      try {
        const projectsRes = await apiFetch<{ projects: ProjectSummary[] }>('/api/projects')
        this.projects = projectsRes.projects
      } finally {
        this.loading = false
      }
    },
    async getProjectAccessCode(projectId: string) {
      const res = await apiFetch<{ success: boolean; accessCode: string | null }>(
        `/api/projects/${projectId}/preview/access-code`,
      )
      if (!res.success) throw new Error('Load access code failed')
      return res.accessCode
    },
    async setProjectPreviewConfig(projectId: string, enabled: boolean, accessCode?: string) {
      await apiFetch<{ success: boolean }>(`/api/projects/${projectId}/preview`, {
        method: 'PUT',
        body: JSON.stringify({ enabled, accessCode }),
      })
      await this.refresh()
    },
    async uploadHtml(
      file: File,
      opts?: { projectId?: string; projectName?: string; releaseNote?: string },
    ) {
      const form = new FormData()
      form.append('file', file)
      if (opts?.projectId && opts.projectId.trim().length > 0) {
        form.append('projectId', opts.projectId.trim())
      }
      if (opts?.projectName && opts.projectName.trim().length > 0) {
        form.append('projectName', opts.projectName.trim())
      }
      if (opts?.releaseNote && opts.releaseNote.trim().length > 0) {
        form.append('releaseNote', opts.releaseNote.trim())
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
