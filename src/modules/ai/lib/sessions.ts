export interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

let sessionCounter = 0

export function createSession(title?: string): Session {
  sessionCounter++
  return {
    id: `session-${Date.now()}-${sessionCounter}`,
    title: title || `Session ${sessionCounter}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function deleteSession(_id: string): void {}

export function getSession(_id: string): Session | null {
  return null
}
