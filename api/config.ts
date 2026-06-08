import path from 'path'

export function getServerPort(): number {
  const candidates = [process.env.PORT, process.env.WEB_PORT].filter(Boolean) as string[]

  for (const raw of candidates) {
    const value = raw.trim()
    if (/^\$\{.+\}$/.test(value)) continue
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  return 3001
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

export function getMaxReleasesPerProject(): number {
  const raw = process.env.MAX_RELEASES_PER_PROJECT
  const parsed = raw ? Number(raw) : 20
  if (!Number.isFinite(parsed) || parsed <= 0) return 20
  return Math.floor(parsed)
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is required')
  return secret
}
