import { invokeGatewayTool } from './tools'

export interface LobsterRunOptions {
  pipeline: string
  cwd?: string
  timeoutMs?: number
  maxStdoutBytes?: number
  argsJson?: string
}

export interface LobsterApprovalRequest {
  type: 'approval_request'
  prompt: string
  items: unknown[]
  resumeToken: string
}

export interface LobsterResult {
  ok: boolean
  status: 'ok' | 'needs_approval' | 'cancelled'
  output: unknown[]
  requiresApproval?: LobsterApprovalRequest
}

export async function runLobsterPipeline(options: LobsterRunOptions): Promise<LobsterResult> {
  return invokeGatewayTool('lobster', {
    action: 'run',
    pipeline: options.pipeline,
    ...(options.cwd ? { cwd: options.cwd } : {}),
    ...(typeof options.timeoutMs === 'number' ? { timeoutMs: options.timeoutMs } : {}),
    ...(typeof options.maxStdoutBytes === 'number' ? { maxStdoutBytes: options.maxStdoutBytes } : {}),
    ...(options.argsJson ? { argsJson: options.argsJson } : {}),
  }, 'main') as Promise<LobsterResult>
}

export async function resumeLobsterWorkflow(
  resumeToken: string,
  approve: boolean
): Promise<LobsterResult> {
  return invokeGatewayTool('lobster', {
    action: 'resume',
    token: resumeToken,
    approve,
  }, 'main') as Promise<LobsterResult>
}

