import crypto from 'crypto'

export function createSalt(): string {
  return crypto.randomBytes(16).toString('base64')
}

export function hashSecret(secret: string, salt: string): string {
  return crypto.scryptSync(secret, salt, 32).toString('base64')
}

export function timingSafeEqualBase64(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'base64')
  const bb = Buffer.from(b, 'base64')
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}
