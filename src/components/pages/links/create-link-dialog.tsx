'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface CreateLinkDialogProps {
  open: boolean
  onClose: () => void
  isEditing: boolean
  formData: { name: string; productUrl: string; affiliateUrl: string; shortCode: string; status: string; campaignId: string }
  onFormChange: (data: { name: string; productUrl: string; affiliateUrl: string; shortCode: string; status: string; campaignId: string }) => void
  onSubmit: () => void
  isPending: boolean
}

export function CreateLinkDialog({ open, onClose, isEditing, formData, onFormChange, onSubmit, isPending }: CreateLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Link' : 'Create New Link'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Update your affiliate link details' : 'Add a new affiliate link to track'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Link Name</Label><Input value={formData.name} onChange={(e) => onFormChange({ ...formData, name: e.target.value })} placeholder="e.g. My Product Link" /></div>
          <div><Label>Product URL</Label><Input value={formData.productUrl} onChange={(e) => onFormChange({ ...formData, productUrl: e.target.value })} placeholder="https://shopee.com.my/product/..." /></div>
          <div><Label>Affiliate URL</Label><Input value={formData.affiliateUrl} onChange={(e) => onFormChange({ ...formData, affiliateUrl: e.target.value })} placeholder="https://shopee.com.my/..." /></div>
          <div><Label>Short Code</Label><Input value={formData.shortCode} onChange={(e) => onFormChange({ ...formData, shortCode: e.target.value })} placeholder="my-short-code" /></div>
          {!isEditing && (
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => onFormChange({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-shopee hover:bg-shopee-dark text-white" onClick={onSubmit} disabled={isPending}>
            {isEditing ? 'Save Changes' : 'Create Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
