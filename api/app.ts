/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import session from 'express-session'
import authRoutes from './routes/auth.js'
import releasesRoutes from './routes/releases.js'
import projectsRoutes from './routes/projects.js'
import settingsRoutes from './routes/settings.js'
import previewRoutes from './routes/preview.js'
import { getSessionSecret } from './config.js'
import { requirePreviewAccess } from './middleware/auth.js'
import {
  findProjectById,
  getCurrentRelease,
  getDefaultProject,
  loadState,
} from './state.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.set('trust proxy', 1)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : true,
    credentials: true,
  }),
)

app.use(
  session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.SESSION_COOKIE_SECURE === 'true' ? true : 'auto',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/releases', releasesRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/preview', previewRoutes)

async function sendProjectPreview(projectId: string | undefined, res: Response) {
  const state = await loadState()
  const project = projectId ? findProjectById(state, projectId) : getDefaultProject(state)
  if (!project) {
    res.status(404).send('No project found.')
    return
  }
  const current = getCurrentRelease(project)
  if (!current) {
    res.status(404).send('No HTML has been published yet.')
    return
  }
  try {
    await fs.promises.access(current.storagePath)
    res.type('html')
    res.sendFile(current.storagePath)
  } catch {
    res.status(404).send('Preview file not found.')
  }
}

app.get('/preview', requirePreviewAccess, async (req: Request, res: Response) => {
  await sendProjectPreview(undefined, res)
})

app.get('/preview/:projectId', requirePreviewAccess, async (req: Request, res: Response) => {
  await sendProjectPreview(req.params.projectId, res)
})

const distDir = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || req.path === '/preview') {
      next()
      return
    }
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
