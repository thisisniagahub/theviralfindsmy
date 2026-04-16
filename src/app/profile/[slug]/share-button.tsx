'use client'

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { useState } from 'react'

export function ShareProfileButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button variant="outline" onClick={handleCopy}>
      <Share2 className="w-4 h-4 mr-2" />
      {copied ? 'Copied!' : 'Share Profile'}
    </Button>
  )
}
