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
      const projects = (parsed as AppState).projects.map((p) => ({
        ...p,
        releases: Array.isArray(p.releases)
          ? p.releases.map((r) => ({ ...r, fileName: normalizeFileName(r.fileName) }))
          : [],
      }))
      return {
        projects,
        preview,
      }
    }

    const legacyReleases = Array.isArray(parsed.releases) ? parsed.releases : []
    if (legacyReleases.length > 0) {
      const hasCurrent = legacyReleases.some((r) => r.isCurrent)
      const migrated = hasCurrent
        ? legacyReleases
        : legacyReleases.map((r, i) => ({ ...r, isCurrent: i === 0 }))
      const now = new Date().toISOString()
      const migratedState: AppState = {
        projects: [
          {
            id: 'default',
            name: '默认项目',
            createdAt: now,
            updatedAt: now,
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
