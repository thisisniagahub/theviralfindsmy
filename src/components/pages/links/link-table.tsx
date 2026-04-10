'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, Copy, Pencil, Trash2, MoreHorizontal, QrCode, Share2, Pause, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { type Link, statusColors, SparklineChart, ProductImageThumb } from './links-shared'

interface LinkTableProps {
  links: Link[]
  isLoading: boolean
  selectedIds: Set<string>
  isAllSelected: boolean
  isSomeSelected: boolean
  campaigns: { id: string; name: string }[]
  search: string
  statusFilter: string
  campaignFilter: string
  page: number
  totalPages: number
  total: number
  limit: number
  onSelectToggle: (id: string) => void
  onSelectAll: () => void
  onRowClick: (link: Link) => void
  onCopyLink: (url: string) => void
  onQrCode: (link: Link) => void
  onShare: (link: Link) => void
  onEdit: (link: Link) => void
  onToggleStatus: (link: Link) => void
  onDelete: (id: string) => void
  onSearchChange: (val: string) => void
  onStatusChange: (val: string) => void
  onCampaignChange: (val: string) => void
  onPrevPage: () => void
  onNextPage: () => void
  onAddLink: () => void
}

export function LinkTable({
  links, isLoading, selectedIds, isAllSelected, isSomeSelected,
  campaigns, search, statusFilter, campaignFilter, page, totalPages, total, limit,
  onSelectToggle, onSelectAll, onRowClick, onCopyLink, onQrCode, onShare, onEdit,
  onToggleStatus, onDelete, onSearchChange, onStatusChange, onCampaignChange,
  onPrevPage, onNextPage, onAddLink,
}: LinkTableProps) {
  return (
    <>
      {/* Toolbar */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search links..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={campaignFilter} onValueChange={onCampaignChange}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Campaigns" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="bg-shopee/10 text-shopee border-shopee/20 text-xs whitespace-nowrap">
                  {selectedIds.size} selected
                </Badge>
              )}
              <Button className="btn-shopee" onClick={onAddLink}>
                <Plus className="w-4 h-4 mr-2" /> Add Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 shadow-sm card-hover-ripple">
        <CardContent className="p-0">
          <div className="max-h-[520px] overflow-y-auto custom-scrollbar table-scroll-mobile">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40px] pl-4">
                      <Checkbox
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) {
                            (el as unknown as HTMLInputElement & { indeterminate: boolean }).indeterminate = isSomeSelected && !isAllSelected
                          }
                        }}
                        onCheckedChange={onSelectAll}
                        aria-label="Select all"
                        className="data-[state=checked]:bg-shopee data-[state=checked]:border-shopee"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Link Name</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">Short Code</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">Trend</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Clicks</TableHead>
                    <TableHead className="text-right hidden sm:table-cell font-semibold text-xs uppercase tracking-wider text-muted-foreground">Conv.</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Earnings</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="w-[80px] font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links?.map((link, idx) => (
                    <TableRow
                      key={link.id}
                      className={`group table-row-hover cursor-pointer ${idx % 2 === 1 ? 'even:bg-muted/30' : ''} ${selectedIds.has(link.id) ? 'bg-shopee/5' : ''} ${link.isExpired ? 'opacity-60' : ''}`}
                      style={link.isExpired ? { borderLeft: '3px solid #EF4444' } : link.expiryStatus === 'expiring_soon' && link.expiresIn !== null && link.expiresIn <= 3 ? { borderLeft: '3px solid #F59E0B' } : undefined}
                      onClick={() => onRowClick(link)}
                    >
                      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(link.id)}
                          onCheckedChange={() => onSelectToggle(link.id)}
                          aria-label={`Select ${link.name}`}
                          className="data-[state=checked]:bg-shopee data-[state=checked]:border-shopee"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {link.productImage && (
                            <ProductImageThumb src={link.productImage} size={36} className="w-9 h-9" />
                          )}
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium truncate max-w-[180px]">{link.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{link.productName || link.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{link.shortCode}</code>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <SparklineChart data={link.dailyClicks || [0]} total={link.clicks} />
                      </TableCell>
                      <TableCell className="text-right text-[13px] font-medium">{link.clicks.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-[13px] font-medium hidden sm:table-cell">{link.conversions}</TableCell>
                      <TableCell className="text-right text-[13px] font-medium metric-money">RM {link.earnings.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className={`text-[10px] px-2.5 py-0.5 ${statusColors[link.status] || ''}`}>
                            {link.status}
                          </Badge>
                          {link.expiryStatus === 'expired' && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-red-500/10 text-red-600 border-red-500/20">
                              ⚠ Expired
                            </Badge>
                          )}
                          {link.expiryStatus === 'expiring_soon' && link.expiresIn !== null && link.expiresIn <= 3 && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse">
                              ⏰ {link.expiresIn}d left
                            </Badge>
                          )}
                          {link.expiryStatus === 'expiring_soon' && link.expiresIn !== null && link.expiresIn > 3 && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-orange-500/10 text-orange-600 border-orange-500/20">
                              {link.expiresIn}d left
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyLink(link.affiliateUrl) }}>
                              <Copy className="w-4 h-4 mr-2" /> Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQrCode(link) }}>
                              <QrCode className="w-4 h-4 mr-2" /> QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(link) }}>
                              <Share2 className="w-4 h-4 mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(link) }}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStatus(link) }}>
                              {link.status === 'active' ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(link.id) }}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrevPage}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={onNextPage}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
