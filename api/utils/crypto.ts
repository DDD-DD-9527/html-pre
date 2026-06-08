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

function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptString(plain: string, secret: string): string {
  const key = deriveKey(secret)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptString(payload: string, secret: string): string {
  const raw = Buffer.from(payload, 'base64')
  if (raw.length < 12 + 16) throw new Error('Invalid payload')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const encrypted = raw.subarray(28)
  const key = deriveKey(secret)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return plain.toString('utf8')
}
