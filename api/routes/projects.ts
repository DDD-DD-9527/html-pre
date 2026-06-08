import { Router, type Request, type Response } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { getCurrentRelease, loadState } from '../state.js'

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

export default router

