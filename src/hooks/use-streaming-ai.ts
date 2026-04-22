'use client'

import { useState, useCallback, useRef } from 'react'

interface UseStreamingAIOptions {
  model?: string
  temperature?: number
}

export function useStreamingAI(options: UseStreamingAIOptions = {}) {
  const [response, setResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const send = useCallback(async (messages: Array<{ role: string; content: string }>) => {
    setResponse('')
    setError(null)
    setIsStreaming(true)
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/openclaw/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: options.model, messages, temperature: options.temperature }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) setResponse(prev => prev + parsed.content)
            if (parsed.error) setError(parsed.error)
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(String(err))
      }
    } finally {
      setIsStreaming(false)
    }
  }, [options.model, options.temperature])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    setResponse('')
    setError(null)
  }, [])

  return { response, isStreaming, error, send, stop, reset }
}
