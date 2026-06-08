import crypto from 'crypto'

type TicketRecord = {
  projectId: string
  expiresAt: number
}

const tickets = new Map<string, TicketRecord>()

function cleanup(now: number) {
  for (const [key, value] of tickets.entries()) {
    if (value.expiresAt <= now) tickets.delete(key)
  }
}

export function createPreviewTicket(projectId: string): string {
  const now = Date.now()
  cleanup(now)
  const ticket = crypto.randomUUID()
  tickets.set(ticket, { projectId, expiresAt: now + 60_000 })
  return ticket
}

export function consumePreviewTicket(projectId: string, ticket: string): boolean {
  const now = Date.now()
  const record = tickets.get(ticket)
  if (!record) return false
  if (record.expiresAt <= now) {
    tickets.delete(ticket)
    return false
  }
  if (record.projectId !== projectId) return false
  tickets.delete(ticket)
  return true
}

