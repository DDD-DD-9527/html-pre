import path from 'path'

export function getServerPort(): number {
  const raw = process.env.PORT
  const parsed = raw ? Number(raw) : 3001
  if (!Number.isFinite(parsed) || parsed <= 0) return 3001
  return parsed
}

export function getDataDir(): string {
  return process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(process.cwd(), 'data')
}

export function getUploadsDir(): string {
  return process.env.UPLOADS_DIR
    ? path.resolve(process.env.UPLOADS_DIR)
    : path.resolve(getDataDir(), 'uploads')
}

export function getStateFilePath(): string {
  return process.env.STATE_FILE
    ? path.resolve(process.env.STATE_FILE)
    : path.resolve(getDataDir(), 'state.json')
}

export function getMaxUploadBytes(): number {
  const raw = process.env.MAX_UPLOAD_BYTES
  const parsed = raw ? Number(raw) : 5 * 1024 * 1024
  if (!Number.isFinite(parsed) || parsed <= 0) return 5 * 1024 * 1024
  return parsed
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is required')
  return secret
}
