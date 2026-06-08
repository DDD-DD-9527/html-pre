import fs from 'fs/promises'
import path from 'path'

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function atomicWriteFile(
  filePath: string,
  data: string | Buffer,
): Promise<void> {
  const dir = path.dirname(filePath)
  await ensureDir(dir)
  const tmpPath = `${filePath}.tmp-${Date.now()}`
  await fs.writeFile(tmpPath, data)
  await fs.rename(tmpPath, filePath)
}
