'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Search, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface VoiceSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}

type SpeechRecognitionEvent = {
  resultIndex: number
  results: {
    [index: number]: {
      isFinal: boolean
      [index: number]: { transcript: string; confidence: number }
    }
  }
}

type SpeechRecognitionErrorEvent = {
  error: string
  message: string
}

export function VoiceSearch({ onSearch, placeholder = 'Search products...' }: VoiceSearchProps) {
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice search not supported in this browser. Try Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'ms-MY' // Malay language

    recognition.onstart = () => {
      setListening(true)
      setError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setQuery(transcript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions.')
      } else {
        setError(`Speech error: ${event.error}`)
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
    }
  }, [])

  const handleSearch = useCallback(() => {
    if (!query.trim()) return
    setProcessing(true)
    onSearch(query.trim())
    setProcessing(false)
  }, [query, onSearch])

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={listening ? '🎤 Listening...' : placeholder}
            className={`h-10 pr-10 ${listening ? 'border-shopee ring-1 ring-shopee' : ''}`}
            disabled={listening}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Voice Button */}
        <Button
          variant={listening ? 'default' : 'outline'}
          size="icon"
          className={`h-10 w-10 ${listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
          onClick={listening ? stopListening : startListening}
        >
          {listening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={processing || !query.trim()}
          className="h-10 bg-shopee hover:bg-shopee-dark"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-1 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 text-xs"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listening Indicator */}
      {listening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-8 left-0 flex items-center gap-2"
        >
          <div className="flex gap-0.5">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-shopee rounded-full"
                animate={{ height: [8, 16, 8] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </div>
          <span className="text-xs text-shopee">Listening...</span>
        </motion.div>
      )}
    </div>
  )
}
