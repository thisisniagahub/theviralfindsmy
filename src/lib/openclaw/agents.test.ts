import { describe, expect, it } from 'vitest'

import { extractSessionReplyFromHistory } from './agents'

describe('extractSessionReplyFromHistory', () => {
  it('prefers the latest assistant reply from session history', () => {
    const reply = extractSessionReplyFromHistory({
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'toolResult', content: 'Intermediate tool output' },
        { role: 'assistant', content: 'Final synthesized answer' },
      ],
    })

    expect(reply).toBe('Final synthesized answer')
  })

  it('falls back to tool results when assistant text is unavailable', () => {
    const reply = extractSessionReplyFromHistory({
      messages: [
        { role: 'user', content: 'Run analysis' },
        { role: 'toolResult', output: 'Computed output payload' },
      ],
    })

    expect(reply).toBe('Computed output payload')
  })
})
