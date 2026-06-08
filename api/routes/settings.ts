import { Router, type Request, type Response } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { loadState, saveState } from '../state.js'
import { createSalt, hashSecret } from '../utils/crypto.js'

const router = Router()

router.get('/preview', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const state = await loadState()
  res.status(200).json({ enabled: Boolean(state.preview.enabled) })
})

router.put('/preview', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { enabled, accessCode } = req.body ?? {}
  if (typeof enabled !== 'boolean') {
    res.status(400).json({ success: false })
    return
  }

  const state = await loadState()
  const next = { ...state, preview: { ...state.preview, enabled } }

  if (typeof accessCode === 'string' && accessCode.length > 0) {
    const salt = createSalt()
    next.preview.accessCodeSalt = salt
    next.preview.accessCodeHash = hashSecret(accessCode, salt)
  }

  if (
    next.preview.enabled &&
    (!next.preview.accessCodeSalt || !next.preview.accessCodeHash)
  ) {
    res.status(400).json({ success: false })
    return
  }

  await saveState(next)
  req.session.previewProjects = {}
  res.status(200).json({ success: true })
})

export default router
