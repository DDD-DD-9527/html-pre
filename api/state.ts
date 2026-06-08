import fs from 'fs/promises'
import path from 'path'
import { getStateFilePath } from './config.js'
import { atomicWriteFile, ensureDir } from './utils/fs.js'

function normalizeFileName(name: string): string {
  const decoded = Buffer.from(name, 'latin1').toString('utf8')
  if (decoded === name) return name
  if (decoded.includes('�')) return name
  if (/[\u4e00-\u9fff]/.test(decoded)) return decoded
  return name
}

export type Release = {
  id: string
  version: number
  fileName: string
  size: number
  uploadedAt: string
  storagePath: string
  isCurrent: boolean
}

export type Project = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  nextVersion: number
  releases: Release[]
}

export type PreviewSettings = {
  enabled: boolean
  accessCodeSalt?: string
  accessCodeHash?: string
}

export type AppState = {
  projects: Project[]
  preview: PreviewSettings
}

const DEFAULT_STATE: AppState = {
  projects: [],
  preview: { enabled: false },
}

export async function loadState(): Promise<AppState> {
  const stateFilePath = getStateFilePath()
  try {
    const raw = await fs.readFile(stateFilePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppState> & { releases?: Release[] }

    const preview =
      parsed.preview && typeof parsed.preview === 'object'
        ? (parsed.preview as PreviewSettings)
        : { enabled: false }

    if (Array.isArray((parsed as AppState).projects)) {
      let migrated = false
      const projects = (parsed as AppState).projects.map((p) => {
        const releases = Array.isArray(p.releases)
          ? p.releases.map((r) => ({
              ...r,
              fileName: normalizeFileName(r.fileName),
              version: typeof (r as Release).version === 'number' ? (r as Release).version : 0,
            }))
          : []

        let nextVersion = typeof (p as Project).nextVersion === 'number' ? (p as Project).nextVersion : 1
        if (!Number.isFinite(nextVersion) || nextVersion <= 0) nextVersion = 1

        if (releases.some((r) => r.version === 0)) {
          const sorted = releases
            .slice()
            .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
          sorted.forEach((r, i) => {
            if (!r.version || r.version <= 0) r.version = i + 1
          })
          const max = sorted.reduce((acc, r) => Math.max(acc, r.version || 0), 0)
          nextVersion = Math.max(nextVersion, max + 1)
          migrated = true
        } else {
          const max = releases.reduce((acc, r) => Math.max(acc, r.version || 0), 0)
          nextVersion = Math.max(nextVersion, max + 1)
          if (typeof (p as Project).nextVersion !== 'number') migrated = true
        }

        if (typeof (p as Project).nextVersion !== 'number') migrated = true

        return {
          ...p,
          nextVersion,
          releases,
        }
      })

      const state = { projects, preview }
      if (migrated) {
        await saveState(state)
      }

      return state
    }

    const legacyReleases = Array.isArray(parsed.releases) ? parsed.releases : []
    if (legacyReleases.length > 0) {
      const hasCurrent = legacyReleases.some((r) => r.isCurrent)
      const withCurrent = hasCurrent
        ? legacyReleases
        : legacyReleases.map((r, i) => ({ ...r, isCurrent: i === 0 }))
      const migrated = withCurrent
        .slice()
        .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt))
        .map((r, i) => ({ ...r, version: i + 1 }))
      const now = new Date().toISOString()
      const migratedState: AppState = {
        projects: [
          {
            id: 'default',
            name: '默认项目',
            createdAt: now,
            updatedAt: now,
            nextVersion: Math.max(1, migrated.length + 1),
            releases: migrated,
          },
        ],
        preview,
      }
      await saveState(migratedState)
      return migratedState
    }

    return {
      projects: [],
      preview,
    }
  } catch {
    await ensureDir(path.dirname(stateFilePath))
    await atomicWriteFile(stateFilePath, JSON.stringify(DEFAULT_STATE, null, 2))
    return DEFAULT_STATE
  }
}

export async function saveState(next: AppState): Promise<void> {
  const stateFilePath = getStateFilePath()
  await atomicWriteFile(stateFilePath, JSON.stringify(next, null, 2))
}

export function findProjectById(state: AppState, projectId: string): Project | undefined {
  return state.projects.find((p) => p.id === projectId)
}

export function getDefaultProject(state: AppState): Project | undefined {
  return findProjectById(state, 'default') || state.projects[0]
}

export function getCurrentRelease(project: Project): Release | undefined {
  return project.releases.find((r) => r.isCurrent)
}
