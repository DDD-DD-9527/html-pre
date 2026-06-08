import 'express-session'

declare module 'express-session' {
  interface SessionData {
    admin?: {
      username: string
    }
    preview?: boolean
  }
}

