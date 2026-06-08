import { Router, type Request, type Response } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { findProjectById, getCurrentRelease, loadState, saveState } from '../state.js'

const router = Router()

router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const state = await loadState()
  const projects = state.projects
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((p) => {
      const current = getCurrentRelease(p)
      return {
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        currentRelease: current
          ? {
              id: current.id,
              versionLabel: current.versionLabel,
              fileName: current.fileName,
              size: current.size,
              uploadedAt: current.uploadedAt,
            }
          : null,
        previewUrl: `/preview/${p.id}`,
      }
    })

  res.status(200).json({ projects })
})

router.get('/:projectId/download', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const state = await loadState()
  const project = findProjectById(state, req.params.projectId)
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }

  const current = getCurrentRelease(project)
  if (!current) {
    res.status(404).json({ success: false, error: 'No release found' })
    return
  }

  const safeName = current.fileName.replace(/\.(html|htm)$/i, '')
  const filename = `${safeName}-${current.versionLabel}.html`
  const encoded = encodeURIComponent(filename)
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encoded}`)
  res.type('html')
  res.status(200).sendFile(current.storagePath)
})

router.get(
  '/:projectId/releases',
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const state = await loadState()
    const project = findProjectById(state, req.params.projectId)
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' })
      return
    }

    const releases = project.releases
      .slice()
      .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
      .map((r) => ({
        id: r.id,
        version: r.version,
        versionLabel: r.versionLabel,
        fileName: r.fileName,
        size: r.size,
        uploadedAt: r.uploadedAt,
        isCurrent: r.isCurrent,
        note: r.note,
        downloadUrl: `/api/projects/${project.id}/releases/${r.id}/download`,
      }))

    res.status(200).json({
      success: true,
      project: { id: project.id, name: project.name },
      releases,
    })
  },
)

router.get(
  '/:projectId/releases/:releaseId/download',
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const state = await loadState()
    const project = findProjectById(state, req.params.projectId)
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' })
      return
    }

    const release = project.releases.find((r) => r.id === req.params.releaseId)
    if (!release) {
      res.status(404).json({ success: false, error: 'Release not found' })
      return
    }

    const safeName = release.fileName.replace(/\.(html|htm)$/i, '')
    const filename = `${safeName}-${release.versionLabel}.html`
    const encoded = encodeURIComponent(filename)
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encoded}`)
    res.type('html')
    res.status(200).sendFile(release.storagePath)
  },
)

router.put('/:projectId', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const rawName = req.body?.name
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  if (!name) {
    res.status(400).json({ success: false, error: 'Name is required' })
    return
  }

  const state = await loadState()
  const project = findProjectById(state, req.params.projectId)
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }

  const exists = state.projects.some((p) => p.id !== project.id && p.name === name)
  if (exists) {
    res.status(409).json({ success: false, error: 'Project name already exists' })
    return
  }

  const now = new Date().toISOString()
  const nextProjects = state.projects.map((p) =>
    p.id === project.id ? { ...p, name, updatedAt: now } : p,
  )
  await saveState({ ...state, projects: nextProjects })

  res.status(200).json({ success: true, project: { id: project.id, name } })
})

export default router
