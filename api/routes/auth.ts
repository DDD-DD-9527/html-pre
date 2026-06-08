import { Router, type Request, type Response } from 'express'
import { getAdminConfig, safeEqual } from '../utils/auth.js'

const router = Router()

router.get('/status', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    loggedIn: Boolean(req.session.admin?.username),
    username: req.session.admin?.username,
  })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {}
  const admin = getAdminConfig()

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !safeEqual(username, admin.username) ||
    !safeEqual(password, admin.password)
  ) {
    res.status(401).json({ success: false })
    return
  }

  req.session.admin = { username }
  res.status(200).json({ success: true })
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false })
      return
    }
    res.status(200).json({ success: true })
  })
})

export default router
