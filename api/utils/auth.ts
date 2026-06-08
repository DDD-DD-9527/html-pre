import crypto from 'crypto'

export function getAdminConfig(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error('ADMIN_PASSWORD is required')
  return { username, password }
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

