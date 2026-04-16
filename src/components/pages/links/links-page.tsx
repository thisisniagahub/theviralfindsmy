'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/store/app-store'

import { type Link, type LinksResponse, type LinkStats, ShareDialog, QRCodeDialog } from './links-shared'
import { LinkTable } from './link-table'
import { BulkActionBar } from './bulk-action-bar'
import { CreateLinkDialog } from './create-link-dialog'
import { LinkDetailModal } from './link-detail-modal'

export function LinksPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const storeSearchQuery = useAppStore((s) => s.searchQuery)
  const [search, setSearch] = useState(() => {
    const q = useAppStore.getState().searchQuery
    if (q) useAppStore.getState().setSearchQuery('')
    return q || ''
  })

  const [showCreate, setShowCreate] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [detailLink, setDetailLink] = useState<Link | null>(null)
  const [shareLink, setShareLink] = useState<Link | null>(null)
  const [qrLink, setQrLink] = useState<Link | null>(null)
  const [formData, setFormData] = useState({ name: '', productUrl: '', affiliateUrl: '', shortCode: '', status: 'active', campaignId: '' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Sync header search query → local search state (T4.1)
  useEffect(() => {
    if (storeSearchQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: syncs Zustand store to local state
      setSearch(storeSearchQuery)
      setPage(1)
      setSelectedIds(new Set())
      useAppStore.getState().setSearchQuery('')
    }
  }, [storeSearchQuery])

  const { data: linksData, isLoading } = useQuery<LinksResponse>({
    queryKey: ['links', page, statusFilter, campaignFilter, search],
    queryFn: () => fetch(`/api/links?page=${page}&limit=10&status=${statusFilter}&campaignId=${campaignFilter}&search=${search}`).then(r => r.json()),
  })

  const { data: linkStats } = useQuery<LinkStats>({
    queryKey: ['link-stats', detailLink?.id],
    queryFn: () => fetch(`/api/links/${detailLink?.id}/stats`).then(r => r.json()),
    enabled: !!detailLink,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/links/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Delete failed (${r.status})`)
      return r.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['links'] }); toast({ title: 'Link deleted' }) },
    onError: (err: Error) => { toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }) },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const r = await fetch(`/api/links/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Update failed (${r.status})`)
      return r.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['links'] }); toast({ title: 'Link updated' }); setEditingLink(null); setDetailLink(null) },
    onError: (err: Error) => { toast({ title: 'Update failed', description: err.message, variant: 'destructive' }) },
  })

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const r = await fetch('/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Create failed (${r.status})`)
      return r.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['links'] }); toast({ title: 'Link created!' }); setShowCreate(false); resetForm() },
    onError: (err: Error) => { toast({ title: 'Create failed', description: err.message, variant: 'destructive' }) },
  })

  const bulkActivateMutation = useMutation({
    mutationFn: (ids: string[]) =>
      fetch('/api/links/bulk', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activate', ids }) }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setSelectedIds(new Set())
      toast({ title: 'Links activated', description: `${data.affected} link(s) activated.` })
    },
  })

  const bulkPauseMutation = useMutation({
    mutationFn: (ids: string[]) =>
      fetch('/api/links/bulk', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pause', ids }) }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setSelectedIds(new Set())
      toast({ title: 'Links paused', description: `${data.affected} link(s) paused.` })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      fetch('/api/links/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['links'] })
      setSelectedIds(new Set())
      setShowBulkDeleteDialog(false)
      toast({ title: 'Links deleted', description: `${data.affected} link(s) deleted.` })
    },
  })

  const resetForm = () => setFormData({ name: '', productUrl: '', affiliateUrl: '', shortCode: '', status: 'active', campaignId: '' })

  const openEdit = (link: Link) => {
    setFormData({ name: link.name, productUrl: link.productUrl, affiliateUrl: link.affiliateUrl, shortCode: link.shortCode, status: link.status, campaignId: link.campaign?.id || '' })
    setEditingLink(link)
  }

  const toggleStatus = (link: Link) => {
    const newStatus = link.status === 'active' ? 'paused' : 'active'
    updateMutation.mutate({ id: link.id, data: { status: newStatus } })
  }

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: 'Link copied to clipboard!' })
  }

  // Handlers that clear selection
  const handleSearchChange = (val: string) => { setSearch(val); setPage(1); setSelectedIds(new Set()) }
  const handleStatusChange = (val: string) => { setStatusFilter(val); setPage(1); setSelectedIds(new Set()) }
  const handleCampaignChange = (val: string) => { setCampaignFilter(val); setPage(1); setSelectedIds(new Set()) }
  const handlePrevPage = () => { setPage((p) => p - 1); setSelectedIds(new Set()) }
  const handleNextPage = () => { setPage((p) => p + 1); setSelectedIds(new Set()) }

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    const links = linksData?.links || []
    if (links.length === 0) return
    const allIds = links.map(l => l.id)
    setSelectedIds(prev => {
      if (allIds.every(id => prev.has(id))) return new Set()
      return new Set(allIds)
    })
  }, [linksData?.links])

  const isAllSelected = useMemo(() => {
    const links = linksData?.links || []
    return links.length > 0 && links.every(l => selectedIds.has(l.id))
  }, [linksData?.links, selectedIds])

  const isSomeSelected = useMemo(() => {
    const links = linksData?.links || []
    return links.some(l => selectedIds.has(l.id))
  }, [linksData?.links, selectedIds])

  const convRate = detailLink ? (detailLink.clicks > 0 ? ((detailLink.conversions / detailLink.clicks) * 100).toFixed(1) : '0.0') : '0.0'

  return (
    <div className="space-y-4">
      {/* Table + Toolbar */}
      <LinkTable
        links={linksData?.links || []}
        isLoading={isLoading}
        selectedIds={selectedIds}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        campaigns={linksData?.campaigns || []}
        search={search}
        statusFilter={statusFilter}
        campaignFilter={campaignFilter}
        page={page}
        totalPages={linksData?.pagination?.totalPages || 1}
        total={linksData?.pagination?.total || 0}
        limit={linksData?.pagination?.limit || 10}
        onSelectToggle={toggleSelect}
        onSelectAll={toggleSelectAll}
        onRowClick={setDetailLink}
        onCopyLink={copyLink}
        onQrCode={setQrLink}
        onShare={setShareLink}
        onEdit={openEdit}
        onToggleStatus={toggleStatus}
        onDelete={(id) => deleteMutation.mutate(id)}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onCampaignChange={handleCampaignChange}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onAddLink={() => { resetForm(); setShowCreate(true) }}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onActivate={() => bulkActivateMutation.mutate(Array.from(selectedIds))}
        onPause={() => bulkPauseMutation.mutate(Array.from(selectedIds))}
        onDelete={() => setShowBulkDeleteDialog(true)}
        onClear={() => setSelectedIds(new Set())}
        isActivatingPending={bulkActivateMutation.isPending}
        isPausingPending={bulkPauseMutation.isPending}
        isDeletingPending={bulkDeleteMutation.isPending}
      />

      {/* Create/Edit Dialog */}
      <CreateLinkDialog
        open={showCreate || !!editingLink}
        onClose={() => { setShowCreate(false); setEditingLink(null) }}
        isEditing={!!editingLink}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={() => {
          if (editingLink) {
            updateMutation.mutate({ id: editingLink.id, data: { name: formData.name, productUrl: formData.productUrl, affiliateUrl: formData.affiliateUrl, shortCode: formData.shortCode } })
          } else {
            createMutation.mutate(formData)
          }
        }}
        isPending={updateMutation.isPending || createMutation.isPending}
      />

      {/* Link Detail Modal */}
      {detailLink && (
        <LinkDetailModal
          link={detailLink}
          linkStats={linkStats}
          convRate={convRate}
          onClose={() => setDetailLink(null)}
          onCopyLink={copyLink}
          onQrCode={setQrLink}
          onShare={setShareLink}
          onEdit={openEdit}
          onToggleStatus={toggleStatus}
        />
      )}

      {/* Share Dialog */}
      <Dialog open={!!shareLink} onOpenChange={(open) => { if (!open) setShareLink(null) }}>
        {shareLink && <ShareDialog link={shareLink} />}
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrLink} onOpenChange={(open) => { if (!open) setQrLink(null) }}>
        {qrLink && <QRCodeDialog link={qrLink} />}
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} link{selectedIds.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedIds.size} selected link{selectedIds.size > 1 ? 's' : ''} and all associated data including click records and conversions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedIds.size} link${selectedIds.size > 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
