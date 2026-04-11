'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image as ImageIcon, Loader2, X, Link2, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface AnalysisResult {
  productName: string
  category: string
  estimatedPrice: number
  competitionLevel: 'Low' | 'Medium' | 'High'
  suggestedPrice: number
  marketingAngles: string[]
  recommendedHashtags: string[]
  confidence: number
}

export function ImageAnalyzer() {
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target?.result as string)
    reader.readAsDataURL(file)
    setResult(null)
    setError(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) return
    setAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('prompt', 'Analyze this Shopee product image. Identify the product, estimate competition level, suggest pricing strategy, and recommend marketing angles for Malaysian affiliate marketers.')

      const res = await fetch('/api/openclaw/analyze-image', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        // Parse the analysis text into structured data
        const analysisText = data.analysis || ''
        setResult({
          productName: extractField(analysisText, 'Product') || 'Unknown Product',
          category: extractField(analysisText, 'Category') || 'General',
          estimatedPrice: parseFloat(extractField(analysisText, 'Price') || '0') || 0,
          competitionLevel: (extractField(analysisText, 'Competition') as 'Low' | 'Medium' | 'High') || 'Medium',
          suggestedPrice: parseFloat(extractField(analysisText, 'Suggested Price') || '0') || 0,
          marketingAngles: extractList(analysisText, 'Marketing'),
          recommendedHashtags: extractHashtags(analysisText),
          confidence: data.confidence || 0.7,
        })
        toast.success('Image analyzed successfully!')
      } else {
        const err = await res.json().catch(() => null)
        setError(err?.error || 'Analysis failed. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setAnalyzing(false)
    }
  }, [imageFile])

  const reset = useCallback(() => {
    setImage(null)
    setImageFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  return (
    <Card className="glass-card card-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Product Image Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        {!image ? (
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-shopee/50 hover:bg-shopee/5 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-foreground font-medium mb-1">
              Drop product image here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse • PNG, JPG up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="relative">
            <img
              src={image}
              alt="Product to analyze"
              className="w-full h-48 object-cover rounded-xl border border-border"
            />
            <button
              onClick={reset}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Analyze Button */}
        {image && !result && (
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full bg-shopee hover:bg-shopee-dark"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with NiagaBot...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Product
              </>
            )}
          </Button>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Product Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{result.productName}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">{result.category}</Badge>
                </div>
                <Badge className={
                  result.competitionLevel === 'Low' ? 'bg-green-500/10 text-green-600' :
                  result.competitionLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-600' :
                  'bg-red-500/10 text-red-600'
                }>
                  {result.competitionLevel} Competition
                </Badge>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Est. Market Price</p>
                  <p className="text-lg font-bold text-foreground">RM {result.estimatedPrice.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-shopee/10">
                  <p className="text-xs text-shopee">Suggested Sell Price</p>
                  <p className="text-lg font-bold text-shopee">RM {result.suggestedPrice.toFixed(2)}</p>
                </div>
              </div>

              {/* Marketing Angles */}
              {result.marketingAngles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Marketing Angles</p>
                  <ul className="space-y-1">
                    {result.marketingAngles.map((angle, idx) => (
                      <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-shopee mt-0.5">•</span>
                        {angle}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hashtags */}
              {result.recommendedHashtags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Recommended Hashtags</p>
                  <div className="flex flex-wrap gap-1">
                    {result.recommendedHashtags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={reset}>
                  <Upload className="w-3 h-3 mr-1" />
                  New Image
                </Button>
                <Button size="sm" className="flex-1 bg-shopee hover:bg-shopee-dark">
                  <Link2 className="w-3 h-3 mr-1" />
                  Create Link
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// Helper functions to parse analysis text
function extractField(text: string, fieldName: string): string {
  const patterns = [
    new RegExp(`${fieldName}[s:]*(?:\\*\\*)?[:\\s]*(.+?)(?:\\n|$)`, 'i'),
    new RegExp(`\\*\\*${fieldName}\\*\\*[:\\s]*(.+?)(?:\\n|$)`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) return match[1].trim().replace(/\*+/g, '')
  }
  return ''
}

function extractList(text: string, sectionName: string): string[] {
  const match = text.match(new RegExp(`${sectionName}[s:]*[:\\s]*\\n([\\s\\S]*?)(?:\\n\\n|\\n[A-Z]|$)`, 'i'))
  if (!match) return []
  return match[1]
    .split('\n')
    .map(line => line.replace(/^[\s\-*•\d.]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g)
  return matches ? matches.slice(0, 6) : []
}
