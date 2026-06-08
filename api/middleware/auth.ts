import type { NextFunction, Request, Response } from 'express'
import { loadState } from '../state.js'

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.session.admin?.username) {
    next()
    return
  }
  res.status(401).json({ success: false })
}

export async function requirePreviewAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const state = await loadState()
  if (!state.preview.enabled) {
    next()
    return
  }
  if (req.session.admin?.username || req.session.preview) {
    next()
    return
  }
  const redirect = encodeURIComponent(req.originalUrl || '/preview')
  res.redirect(302, `/preview-login?redirect=${redirect}`)
}
