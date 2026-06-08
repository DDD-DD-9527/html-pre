import type { NextFunction, Request, Response } from 'express'
import { findProjectById, getDefaultProject, loadState } from '../state.js'
import { consumePreviewTicket } from '../preview-ticket.js'

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
  const paramProjectId = typeof req.params?.projectId === 'string' ? req.params.projectId : undefined
  const project = paramProjectId ? findProjectById(state, paramProjectId) : getDefaultProject(state)
  const preview = project?.preview
  const enabled = Boolean(preview?.enabled)

  if (!enabled) {
    next()
    return
  }

  if (req.session.admin?.username) {
    next()
    return
  }
  const rawTicket = req.query?.ticket
  const ticket = typeof rawTicket === 'string' && rawTicket.trim().length > 0 ? rawTicket.trim() : ''
  if (project?.id && ticket && consumePreviewTicket(project.id, ticket)) {
    next()
    return
  }
  const redirect = encodeURIComponent(req.originalUrl || '/preview')
  const projectId = project?.id ? encodeURIComponent(project.id) : ''
  const query = projectId.length > 0 ? `projectId=${projectId}&redirect=${redirect}` : `redirect=${redirect}`
  res.redirect(302, `/preview-login?${query}`)
}
