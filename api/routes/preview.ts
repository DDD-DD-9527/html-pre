import { Router, type Request, type Response } from 'express'
import { findProjectById, getDefaultProject, loadState } from '../state.js'
import { hashSecret, timingSafeEqualBase64 } from '../utils/crypto.js'
import { createPreviewTicket } from '../preview-ticket.js'

const router = Router()

router.get('/config', async (req: Request, res: Response): Promise<void> => {
  const state = await loadState()
  const raw = req.query?.projectId
  const projectId = typeof raw === 'string' && raw.length > 0 ? raw : undefined
  const project = projectId ? findProjectById(state, projectId) : getDefaultProject(state)
  res.status(200).json({ enabled: Boolean(project?.preview?.enabled) })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { accessCode } = req.body ?? {}
  if (typeof accessCode !== 'string') {
    res.status(400).json({ success: false })
    return
  }

  const state = await loadState()
  const rawProjectId = req.query?.projectId
  const projectId = typeof rawProjectId === 'string' && rawProjectId.length > 0 ? rawProjectId : undefined
  const project = projectId ? findProjectById(state, projectId) : getDefaultProject(state)

  if (!project) {
    res.status(404).json({ success: false })
    return
  }

  const enabled = Boolean(project.preview?.enabled)
  if (!enabled) {
    res.status(200).json({ success: true, ticket: null })
    return
  }

  if (!project.preview?.accessCodeSalt || !project.preview?.accessCodeHash) {
    res.status(500).json({ success: false })
    return
  }

  const nextHash = hashSecret(accessCode, project.preview.accessCodeSalt)
  if (!timingSafeEqualBase64(nextHash, project.preview.accessCodeHash)) {
    res.status(401).json({ success: false })
    return
  }

  const ticket = createPreviewTicket(project.id)
  res.status(200).json({ success: true, ticket })
})

export default router
