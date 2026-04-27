import { db } from './db'

export async function getAgentHistory(agentId: string, limit = 20) {
  return db.agentMemory.findMany({
    where: { agentId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function saveAgentMessage(
  agentId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sessionId?: string,
  metadata?: Record<string, unknown>
) {
  return db.agentMemory.create({
    data: {
      agentId,
      role,
      content,
      sessionId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })
}

export async function getConversationContext(agentId: string, limit = 10) {
  const history = await getAgentHistory(agentId, limit)
  return history.reverse().map(m => ({
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
  }))
}

export async function clearAgentMemory(agentId: string) {
  return db.agentMemory.deleteMany({ where: { agentId } })
}
