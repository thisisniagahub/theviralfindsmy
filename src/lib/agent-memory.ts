import { dbFetch } from './db-safe'

export async function getAgentHistory(agentId: string, limit = 20) {
  return dbFetch(`/agent-memory?agentId=${agentId}&limit=${limit}&order=desc`)
}

export async function saveAgentMessage(
  agentId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sessionId?: string,
  metadata?: Record<string, unknown>
) {
  return dbFetch('/agent-memory', {
    method: 'POST',
    body: JSON.stringify({
      agentId,
      role,
      content,
      sessionId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    }),
  })
}

export async function getConversationContext(agentId: string, limit = 10) {
  const history = await getAgentHistory(agentId, limit)
  return (history as any[]).reverse().map((m: any) => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }))
}

export async function clearAgentMemory(agentId: string) {
  return dbFetch(`/agent-memory?agentId=${agentId}`, { method: 'DELETE' })
}
