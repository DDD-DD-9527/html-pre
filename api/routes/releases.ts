import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { requireAdmin } from '../middleware/auth.js'
import { getMaxReleasesPerProject, getMaxUploadBytes, getUploadsDir } from '../config.js'
import { ensureDir } from '../utils/fs.js'
import {
  getCurrentRelease,
  getDefaultProject,
  loadState,
  saveState,
  type Project,
  type Release,
} from '../state.js'

const router = Router()

function formatDateLabel(date: Date): string {
  const y = String(date.getFullYear())
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

function parseVersionLabel(label: string): { date: string; seq: number } | null {
  const m = /^(\d{4}\.\d{2}\.\d{2})-(\d{2,})$/.exec(label)
  if (!m) return null
  const seq = Number(m[2])
  if (!Number.isFinite(seq) || seq <= 0) return null
  return { date: m[1], seq }
}

function buildVersionLabel(dateLabel: string, seq: number): string {
  return `${dateLabel}-${String(seq).padStart(2, '0')}`
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getMaxUploadBytes() },
})

router.get('/current', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const state = await loadState()
  const project = getDefaultProject(state)
  if (!project) {
    res.status(200).json(null)
    return
  }
  const current = getCurrentRelease(project)
  if (!current) {
    res.status(200).json(null)
    return
  }
  res.status(200).json({
    id: current.id,
    fileName: current.fileName,
    size: current.size,
    uploadedAt: current.uploadedAt,
    previewUrl: `/preview/${project.id}`,
  })
})

router.post(
  '/upload',
  requireAdmin,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    const file = req.file
    if (!file) {
      res.status(400).json({ success: false })
      return
    }

    const ext = path.extname(file.originalname).toLowerCase()
    if (ext !== '.html' && ext !== '.htm') {
      res.status(400).json({ success: false })
      return
    }

    const incomingProjectNameRaw = req.body?.projectName
    const incomingProjectName =
      typeof incomingProjectNameRaw === 'string' && incomingProjectNameRaw.trim().length > 0
        ? incomingProjectNameRaw.trim()
        : '默认项目'

    const id = crypto.randomUUID()
    const uploadsDir = getUploadsDir()
    await ensureDir(uploadsDir)

    const decodedOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const storagePath = path.resolve(uploadsDir, `${id}.html`)
    await fs.writeFile(storagePath, file.buffer)

    const now = new Date().toISOString()
    const state = await loadState()
    const existing = state.projects.find((p) => p.name === incomingProjectName)
    const maxReleases = getMaxReleasesPerProject()

    const rawNote = req.body?.releaseNote
    const note = typeof rawNote === 'string' && rawNote.trim().length > 0 ? rawNote.trim() : undefined

    const project: Project = existing
      ? {
          ...existing,
          name: incomingProjectName,
        }
      : {
          id: crypto.randomUUID(),
          name: incomingProjectName,
          createdAt: now,
          updatedAt: now,
          nextVersion: 1,
          releases: [],
        }

    const version = Number.isFinite(project.nextVersion) && project.nextVersion > 0 ? project.nextVersion : 1
    const dateLabel = formatDateLabel(new Date(now))
    const maxSeqForDate = project.releases.reduce((acc, r) => {
      const parsed = typeof r.versionLabel === 'string' ? parseVersionLabel(r.versionLabel) : null
      if (!parsed || parsed.date !== dateLabel) return acc
      return Math.max(acc, parsed.seq)
    }, 0)
    const versionLabel = buildVersionLabel(dateLabel, maxSeqForDate + 1)
    const nextRelease: Release = {
      id,
      version,
      versionLabel,
      fileName: path.basename(decodedOriginalName),
      size: file.size,
      uploadedAt: now,
      storagePath,
      isCurrent: true,
      note,
    }

    const nextProject: Project = {
      ...project,
      updatedAt: now,
      nextVersion: version + 1,
      releases: [
        { ...nextRelease, isCurrent: true },
        ...project.releases.map((r) => ({ ...r, isCurrent: false })),
      ].slice(0, maxReleases),
    }

    const toRemove = project.releases.slice(Math.max(0, maxReleases - 1))
    const nextProjects = state.projects
      .filter((p) => p.id !== project.id)
      .concat(nextProject)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    const nextState = { ...state, projects: nextProjects }
    await saveState(nextState)

    await Promise.all(toRemove.map((r) => fs.unlink(r.storagePath).catch(() => undefined)))

    res.status(200).json({
      release: {
        id: nextRelease.id,
        fileName: nextRelease.fileName,
        size: nextRelease.size,
        uploadedAt: nextRelease.uploadedAt,
        previewUrl: `/preview/${nextProject.id}`,
      },
      project: { id: nextProject.id, name: nextProject.name },
    })
  },
)

export default router
