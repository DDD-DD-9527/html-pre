import { Router, type Request, type Response } from 'express'
import { loadState } from '../state.js'
import { hashSecret, timingSafeEqualBase64 } from '../utils/crypto.js'

const router = Router()

router.get('/config', async (req: Request, res: Response): Promise<void> => {
  const state = await loadState()
  res.status(200).json({ enabled: Boolean(state.preview.enabled) })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { accessCode } = req.body ?? {}
  if (typeof accessCode !== 'string') {
    res.status(400).json({ success: false })
    return
  }

  const state = await loadState()
  if (!state.preview.enabled) {
    req.session.preview = true
    res.status(200).json({ success: true })
    return
  }

  if (!state.preview.accessCodeSalt || !state.preview.accessCodeHash) {
    res.status(500).json({ success: false })
    return
  }

  const nextHash = hashSecret(accessCode, state.preview.accessCodeSalt)
  if (!timingSafeEqualBase64(nextHash, state.preview.accessCodeHash)) {
    res.status(401).json({ success: false })
    return
  }

  req.session.preview = true
  res.status(200).json({ success: true })
})

export default router

