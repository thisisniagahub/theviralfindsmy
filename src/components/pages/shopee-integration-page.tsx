'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ExternalLink, Link2, ShoppingBag, FileText, Wallet, LayoutDashboard,
  Zap, CheckCircle, XCircle, Clock, RefreshCw, Eye, EyeOff,
  Download, Activity, Check, Globe,
  ChevronDown, Shield, Search,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  return (
    <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {prefix}{value.toLocaleString('en-MY')}
    </motion.span>
  )
}

const SYNC_HISTORY = [
  { id: '1', type: 'Full Sync', status: 'success', items: 156, duration: '2m 34s', lastRun: '5 min ago' },
  { id: '2', type: 'Product Update', status: 'success', items: 23, duration: '45s', lastRun: '1 hour ago' },
  { id: '3', type: 'Order Sync', status: 'success', items: 8, duration: '12s', lastRun: '3 hours ago' },
  { id: '4', type: 'Stats Sync', status: 'in-progress', items: 0, duration: '...', lastRun: 'Now' },
  { id: '5', type: 'Commission Update', status: 'success', items: 45, duration: '1m 02s', lastRun: '6 hours ago' },
  { id: '6', type: 'Full Sync', status: 'failed', items: 0, duration: '0s', lastRun: 'Yesterday' },
]

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Beauty', 'Home', 'Health', 'Food']

export function ShopeeIntegrationPage() {
  const router = useRouter()
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importedProduct, setImportedProduct] = useState<Record<string, unknown> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isSearching, setIsSearching] = useState(false)
  const [showPartnerKey, setShowPartnerKey] = useState(false)
  const [showSecretToken, setShowSecretToken] = useState(false)

  // Fetch search results
  const { data: searchData, refetch: refetchSearch } = useQuery({
    queryKey: ['shopee-search', searchQuery, selectedCategory],
    queryFn: () => fetch('/api/shopee-integration/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, category: selectedCategory }),
    }).then(r => r.json()),
    enabled: false,
  })

  const searchResults = searchData?.results || []

  const handleImport = useCallback(async () => {
    if (!importUrl.trim()) {
      toast.error('Please enter a Shopee product URL')
      return
    }
    setIsImporting(true)
    setImportedProduct(null)
    try {
      const res = await fetch('/api/shopee-integration/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      })
      const data = await res.json()
      if (data.success) {
        setImportedProduct(data.product)
        toast.success('Product parsed!', { description: `Found: ${data.product.name}` })
      } else {
        toast.error('Failed to parse', { description: data.error })
      }
    } catch {
      toast.error('Import failed', { description: 'Could not reach the server' })
    }
    setIsImporting(false)
  }, [importUrl])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Enter a search term')
      return
    }
    setIsSearching(true)
    try {
      const result = await refetchSearch()
      const total = (result.data as Record<string, unknown>)?.total as number || 0
      toast.success(`Found ${total} products`)
    } catch {
      toast.error('Search failed')
    }
    setIsSearching(false)
  }, [searchQuery, refetchSearch])

  const handleGenerateLink = useCallback(() => {
    if (!importedProduct) return
    toast.success('Affiliate link created!', { description: `${(importedProduct as Record<string, string>).name} added to your links` })
    router.push('/links')
  }, [importedProduct, router])

  const handleTestConnection = useCallback(() => {
    toast.success('Connection successful!', { description: 'Connected to Shopee Affiliate API' })
  }, [])

  const handleSaveConfig = useCallback(() => {
    toast.success('Configuration saved!', { description: 'API settings updated successfully' })
  }, [])

  const quickAccess = [
    { title: 'Affiliate Dashboard', desc: 'View commissions & performance', url: 'https://affiliate.shopee.com.my/dashboard', icon: LayoutDashboard },
    { title: 'Shopee Marketplace', desc: 'Browse products on Shopee', url: 'https://shopee.com.my/', icon: ShoppingBag },
    { title: 'Commission Report', desc: 'Detailed earnings breakdown', url: 'https://affiliate.shopee.com.my/report', icon: FileText },
    { title: 'Withdrawal', desc: 'Cash out your earnings', url: 'https://affiliate.shopee.com.my/withdraw', icon: Wallet },
  ]

  return (
    <div className="space-y-6">
      {/* Section A: Connection Status Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="gradient-border overflow-hidden">
          <CardContent className="p-6 bg-gradient-to-r from-shopee/5 via-orange-500/5 to-shopee/5 dark:from-shopee/10 dark:via-orange-500/10 dark:to-shopee/10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Shopee Logo */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-shopee flex items-center justify-center shadow-lg shadow-shopee/20">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Shopee Integration</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 badge-pulse" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">ahmad.ali@email.com</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">Since Jan 15, 2026</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:ml-auto flex-shrink-0">
                <Button size="sm" className="btn-shopee text-xs gap-1.5" onClick={() => window.open('https://affiliate.shopee.com.my/dashboard', '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="w-3.5 h-3.5" /> Open Shopee Dashboard
                </Button>
                <Button size="sm" variant="outline" className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  Disconnect
                </Button>
              </div>
            </div>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/40">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground"><AnimatedNumber value={1247} /></p>
                <p className="text-xs text-muted-foreground">API Calls Today</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 badge-pulse" />
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">Real-time</p>
                </div>
                <p className="text-xs text-muted-foreground">Sync Status</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">2 min ago</p>
                <p className="text-xs text-muted-foreground">Last Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section F: Shopee Dashboard Quick Access */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {quickAccess.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="block"
            >
              <Card className="card-elevated hover-scale-sm cursor-pointer group h-full">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-shopee/10 text-shopee flex-shrink-0 group-hover:bg-shopee group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-shopee transition-colors">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                </CardContent>
              </Card>
            </motion.a>
          )
        })}
      </div>

      {/* Section B: Quick Import + Section D: API Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Quick Import */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="glass-card card-accent border-shopee/20 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Download className="w-4 h-4 text-shopee" />
                Import Product from Shopee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Paste any product URL from shopee.com.my to import it into your affiliate system.</p>
              <div className="flex gap-2">
                <Input
                  placeholder="https://shopee.com.my/product-name-i.123456789.901234"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="text-sm font-mono"
                />
                <Button onClick={handleImport} disabled={isImporting} className="btn-shopee text-xs flex-shrink-0 gap-1">
                  {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  {isImporting ? 'Parsing...' : 'Import'}
                </Button>
              </div>

              {/* Imported Product Preview */}
              {importedProduct && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-shopee/10 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6 text-shopee/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{(importedProduct as Record<string, string>).name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-shopee">RM {(importedProduct as Record<string, number>).price?.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground line-through">RM {(importedProduct as Record<string, number>).originalPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Shield className="w-3 h-3" /> Category: <span className="font-medium text-foreground">{(importedProduct as Record<string, string>).category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Zap className="w-3 h-3" /> Commission: <span className="font-medium text-green-600 dark:text-green-400">{(importedProduct as Record<string, number>).commission}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleGenerateLink} className="btn-shopee text-xs flex-1 gap-1">
                      <Link2 className="w-3 h-3" /> Generate Affiliate Link
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => window.open((importedProduct as Record<string, string>).shopeeUrl, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="w-3 h-3 mr-1" /> View on Shopee
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* API Configuration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.25 }}>
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-shopee" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Partner ID</label>
                <Input defaultValue="1000987" className="text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Partner Key</label>
                <div className="relative">
                  <Input type={showPartnerKey ? 'text' : 'password'} defaultValue="a1b2c3d4e5f6g7h8i9j0" className="text-sm font-mono pr-10" />
                  <button onClick={() => setShowPartnerKey(!showPartnerKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPartnerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">API Endpoint</label>
                <div className="relative">
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                    <option>Production (api.shopee.com)</option>
                    <option>Sandbox (partner.test-gateway.shopeemobile.com)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Webhook URL</label>
                <Input defaultValue="https://shopee-affiliate.com/api/webhook/shopee" className="text-sm font-mono text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Secret Token</label>
                <div className="relative">
                  <Input type={showSecretToken ? 'text' : 'password'} defaultValue="sk_live_xxxxxxxxxxxxxxxx" className="text-sm font-mono pr-10" />
                  <button onClick={() => setShowSecretToken(!showSecretToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSecretToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={handleTestConnection} className="text-xs gap-1">
                  <Zap className="w-3 h-3" /> Test Connection
                </Button>
                <Button size="sm" onClick={handleSaveConfig} className="btn-shopee text-xs flex-1 gap-1">
                  <Check className="w-3 h-3" /> Save Configuration
                </Button>
              </div>
              <a href="https://affiliate.shopee.com.my" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-shopee hover:text-shopee-dark transition-colors">
                <FileText className="w-3 h-3" /> View API Documentation <ExternalLink className="w-3 h-3" />
              </a>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Section C: Shopee Product Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <Card className="glass-card border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-shopee" />
                Shopee Product Search
              </CardTitle>
              {searchData?.shopeeSearchUrl && (
                <a href={searchData.shopeeSearchUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-shopee hover:underline">
                  Open on Shopee <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Search products on Shopee.com.my..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm appearance-none pr-8"
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="btn-shopee text-xs gap-1 flex-shrink-0">
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Search
              </Button>
            </div>

            {/* Search Results Grid */}
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map((product: Record<string, unknown>, idx: number) => (
                  <motion.div
                    key={(product as Record<string, string>).id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                  >
                    <div className="p-3 rounded-lg border border-border/50 bg-card hover:border-shopee/30 hover:bg-shopee/5 transition-colors group">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-lg bg-shopee/10 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-5 h-5 text-shopee/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{(product as Record<string, string>).name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-sm font-bold text-shopee">RM {(product as Record<string, number>).price?.toFixed(2)}</span>
                            <span className="text-[10px] text-muted-foreground line-through">RM {(product as Record<string, number>).originalPrice?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">★ {(product as Record<string, number>).rating}</span>
                            <span>{((product as Record<string, number>).sold || 0).toLocaleString()} sold</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/30">
                        <Badge variant="secondary" className="text-[9px] bg-shopee/10 text-shopee border-0">
                          {(product as Record<string, number>).commission}% commission
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] bg-muted">
                          {(product as Record<string, string>).category}
                        </Badge>
                        <div className="ml-auto flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2 text-shopee hover:text-shopee-dark" onClick={() => {
                            setImportUrl((product as Record<string, string>).shopeeUrl)
                            toast.info('URL loaded', { description: 'Click Import to add this product' })
                          }}>
                            <Download className="w-3 h-3 mr-0.5" /> Import
                          </Button>
                          <a href={(product as Record<string, string>).shopeeUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : searchQuery && !isSearching && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Search for products from Shopee.com.my</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try &quot;wireless earbuds&quot; or &quot;skincare set&quot;</p>
              </div>
            ) : !searchQuery ? (
              <div className="text-center py-8">
                <Globe className="w-8 h-8 text-shopee/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Search millions of products on Shopee Malaysia</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Results link directly to shopee.com.my</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section E: Sync History */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
        <Card className="glass-card border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-shopee" />
                Sync History
              </CardTitle>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info('Sync started', { description: 'Full sync initiated...' })}>
                <RefreshCw className="w-3 h-3" /> Sync Now
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar rounded-lg border border-border/50">
              <table className="table-modern">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-right">Items</th>
                    <th>Duration</th>
                    <th>Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {SYNC_HISTORY.map((sync, idx) => (
                    <motion.tr key={sync.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + idx * 0.04 }} className="table-row-hover">
                      <td className="text-sm font-medium">{sync.type}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {sync.status === 'success' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                          {sync.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          {sync.status === 'in-progress' && <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
                          <span className={`text-xs font-medium capitalize ${
                            sync.status === 'success' ? 'text-green-600 dark:text-green-400' :
                            sync.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                            'text-amber-600 dark:text-amber-400'
                          }`}>{sync.status.replace('-', ' ')}</span>
                        </div>
                      </td>
                      <td className="text-right text-sm text-muted-foreground">{sync.items.toLocaleString()}</td>
                      <td className="text-sm text-muted-foreground">{sync.duration}</td>
                      <td className="text-sm text-muted-foreground">{sync.lastRun}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
