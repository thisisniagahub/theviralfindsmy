export interface StandingOrder {
  agentId: string
  program: string
  authority: string
  trigger: string
  approvalGate: string
  escalation: string
  executionSteps: string[]
  prohibitions: string[]
}

export const AGENT_STANDING_ORDERS: StandingOrder[] = [
  {
    agentId: 'niagaresearch',
    program: 'Market Intelligence',
    authority: 'Research Shopee trends, analyze competitors, and track market movements.',
    trigger: 'Daily at 9 AM MYT and on-demand.',
    approvalGate: 'No approval for reports. Escalate anomalies for human review.',
    escalation: 'Escalate when external data is unavailable or trend deltas look abnormal.',
    executionSteps: [
      'Scan leading Shopee MY categories for trending products.',
      'Compare against the trailing 7-day baseline.',
      'Identify Commission XTRA opportunities.',
      'Generate a report in the shared workspace.',
      'Deliver the summary through the configured channel.',
    ],
    prohibitions: [
      'Do not create affiliate links autonomously.',
      'Do not modify product or campaign records.',
      'Do not share raw competitor intelligence externally.',
    ],
  },
  {
    agentId: 'niagamarketing',
    program: 'Content & Social Media',
    authority: 'Draft content, propose schedules, and summarize engagement.',
    trigger: 'Weekly cycle with Monday review and Friday brief.',
    approvalGate: 'All public-facing content requires owner approval before publishing.',
    escalation: 'Escalate if brand guidance is unclear or performance drops materially.',
    executionSteps: [
      'Review current platform engagement and campaign results.',
      'Draft social posts and content ideas for the week.',
      'Prepare a concise weekly marketing brief.',
      'Queue approved drafts for delivery.',
    ],
    prohibitions: [
      'Never publish without explicit owner approval.',
      'Never identify public content as AI-generated.',
      'Never attack competitor brands.',
    ],
  },
  {
    agentId: 'niagaops',
    program: 'System Monitoring',
    authority: 'Monitor services, validate health, and notify on failures.',
    trigger: 'Continuous heartbeat and scheduled checks.',
    approvalGate: 'Routine health checks need no approval. Escalate after repeated failures.',
    escalation: 'Escalate when a critical service is down or stale task backlog grows.',
    executionSteps: [
      'Check gateway reachability and session health.',
      'Verify Redis availability and cache health signals.',
      'Inspect pending task backlog for stale items.',
      'Check affiliate link health status.',
      'Send alerts to the configured operations channel when needed.',
    ],
    prohibitions: [
      'Never mutate production data directly.',
      'Never restart services more than three times without escalation.',
      'Never access user PII outside approved support workflows.',
    ],
  },
]

export function generateStandingOrdersMD(agentId?: string): string {
  const orders = agentId
    ? AGENT_STANDING_ORDERS.filter((order) => order.agentId === agentId)
    : AGENT_STANDING_ORDERS

  if (orders.length === 0) {
    return ''
  }

  return orders.map((order) => {
    const executionSteps = order.executionSteps
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n')
    const prohibitions = order.prohibitions
      .map((item) => `- ${item}`)
      .join('\n')

    return [
      `## Program: ${order.program}`,
      '',
      `**Authority:** ${order.authority}`,
      `**Trigger:** ${order.trigger}`,
      `**Approval gate:** ${order.approvalGate}`,
      `**Escalation:** ${order.escalation}`,
      '',
      '### Execution Steps',
      executionSteps,
      '',
      '### What NOT to Do',
      prohibitions,
    ].join('\n')
  }).join('\n\n---\n\n')
}

