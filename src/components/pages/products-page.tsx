'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Star, ShoppingCart, Link2, SlidersHorizontal } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string; name: string; price: number; originalPrice: number; image: string
  rating: number; sold: number; category: string; shop: string
}

interface SearchResponse {
  products: Product[]
  categories: string[]
  pagination: { page: number; total: number; totalPages: number }
}

function formatPrice(price: number) {
  return `RM ${price.toFixed(2)}`
}

// Product image with loading skeleton
function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)

  const handleLoad = useCallback(() => setLoaded(true), [])

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleLoad}
      />
    </>
  )
}

export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('popular')
  const [page, setPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [linkName, setLinkName] = useState('')
  const [shortCode, setShortCode] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<SearchResponse>({
    queryKey: ['products', searchQuery, category, sort, page],
    queryFn: () =>
      fetch(`/api/products/search?q=${searchQuery}&category=${category}&sort=${sort}&page=${page}&limit=12`).then((r) => r.json()),
  })

  const createLinkMutation = useMutation({
    mutationFn: (body: { name: string; shortCode: string; productName: string; productImage: string; productPrice: number; productUrl: string }) =>
      fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      toast({ title: 'Affiliate link created!', description: 'Your new link is ready to share.' })
      setSelectedProduct(null)
      setLinkName('')
      setShortCode('')
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create link', variant: 'destructive' })
    },
  })

  const handleGenerateLink = (product: Product) => {
    setSelectedProduct(product)
    setLinkName(product.name)
    setShortCode(product.name.toLowerCase().replace(/\s+/g, '-').slice(0, 15))
  }

  const handleSubmitLink = () => {
    if (!selectedProduct || !linkName) return
    createLinkMutation.mutate({
      name: linkName,
      shortCode: shortCode,
      productName: selectedProduct.name,
      productImage: selectedProduct.image,
      productPrice: selectedProduct.price,
      productUrl: `https://shopee.com.my/product/${selectedProduct.id}`,
    })
  }

  const discount = (product: Product) =>
    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products on Shopee..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
                <SelectTrigger className="w-[150px]">
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {data?.categories?.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low</SelectItem>
                  <SelectItem value="price-high">Price: High</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl skeleton-shimmer" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.products?.map((product) => (
              <Card key={product.id} className="group card-elevated card-hover-ripple card-shine border-border/50 shadow-sm overflow-hidden">
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <ProductImage src={product.image} alt={product.name} />
                  {discount(product) > 0 && (
                    <Badge className="absolute top-2 left-2 bg-shopee text-white text-[10px]">
                      -{discount(product)}%
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-2.5">
                  <h3 className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5rem]">{product.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-shopee">{formatPrice(product.price)}</span>
                    {discount(product) > 0 && (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating}</span>
                    </div>
                    <span>{product.sold.toLocaleString()} sold</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{product.shop}</p>
                  <Button
                    size="sm"
                    className="w-full btn-shopee text-xs"
                    onClick={() => handleGenerateLink(product)}
                  >
                    <Link2 className="w-3 h-3 mr-1" />
                    Generate Affiliate Link
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Generate Link Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Affiliate Link</DialogTitle>
            <DialogDescription>Create an affiliate link for this product.</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Image src={selectedProduct.image} alt={selectedProduct.name} width={56} height={56} className="rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedProduct.name}</p>
                  <p className="text-sm text-shopee font-bold">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="linkName">Link Name</Label>
                  <Input id="linkName" value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="My affiliate link" />
                </div>
                <div>
                  <Label htmlFor="shortCode">Short Code</Label>
                  <Input id="shortCode" value={shortCode} onChange={(e) => setShortCode(e.target.value)} placeholder="my-link-code" />
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                <p className="font-medium text-foreground">Commission Info</p>
                <p className="text-muted-foreground">Estimated commission: <span className="text-green-600 font-medium">{formatPrice(selectedProduct.price * 0.1)}</span> (10%)</p>
                <p className="text-muted-foreground">Category: <span className="text-foreground">{selectedProduct.category}</span></p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
            <Button
              className="btn-shopee"
              onClick={handleSubmitLink}
              disabled={createLinkMutation.isPending}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
