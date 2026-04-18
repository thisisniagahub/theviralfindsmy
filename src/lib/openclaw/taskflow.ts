import { invokeWebhookRoute } from './webhooks'

export interface TaskFlow {
  flowId: string
  goal: string
  status: string
  revision: number
  createdAt?: string
  updatedAt?: string
  currentStep?: string
  waitJson?: unknown
  steps?: Array<{
    id: string
    status: 'pending' | 'running' | 'succeeded' | 'failed' | 'waiting'
    output?: unknown
  }>
}

export interface TaskFlowOptions {
  goal: string
  status?: 'queued' | 'running'
  notifyPolicy?: 'done_only' | 'all' | 'silent'
}

function extractFlowList(result: unknown): TaskFlow[] {
  if (Array.isArray(result)) {
    return result as TaskFlow[]
  }

  if (result && typeof result === 'object' && Array.isArray((result as { flows?: unknown[] }).flows)) {
    return (result as { flows: TaskFlow[] }).flows
  }

  return []
}

export async function createTaskFlow(routeId: string, options: TaskFlowOptions): Promise<TaskFlow> {
  const response = await invokeWebhookRoute<TaskFlow>(routeId, {
    action: 'create_flow',
    goal: options.goal,
    status: options.status || 'queued',
    notifyPolicy: options.notifyPolicy || 'done_only',
  })

  return response.result
}

export async function listTaskFlows(routeId: string): Promise<TaskFlow[]> {
  const response = await invokeWebhookRoute(routeId, {
    action: 'list_flows',
  })

  return extractFlowList(response.result)
}

export async function getTaskFlow(routeId: string, flowId: string): Promise<TaskFlow> {
  const response = await invokeWebhookRoute<TaskFlow>(routeId, {
    action: 'get_flow',
    flowId,
  })

  return response.result
}

export async function findLatestTaskFlow(routeId: string, controllerId?: string): Promise<TaskFlow | null> {
  const response = await invokeWebhookRoute<TaskFlow | null>(routeId, {
    action: 'find_latest_flow',
    ...(controllerId ? { controllerId } : {}),
  })

  return response.result ?? null
}

export async function cancelTaskFlow(routeId: string, flowId: string): Promise<unknown> {
  const response = await invokeWebhookRoute(routeId, {
    action: 'cancel_flow',
    flowId,
  })

  return response.result
}

export async function runFlowTask(
  routeId: string,
  flowId: string,
  task: string,
  runtime: 'subagent' | 'acp' = 'subagent',
  childSessionKey?: string
): Promise<unknown> {
  const response = await invokeWebhookRoute(routeId, {
    action: 'run_task',
    flowId,
    runtime,
    task,
    ...(childSessionKey ? { childSessionKey } : {}),
  })

  return response.result
}
