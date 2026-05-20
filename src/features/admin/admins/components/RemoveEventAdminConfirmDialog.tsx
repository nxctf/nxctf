import React from 'react'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import type { EventAdminRow } from '../types'

interface RemoveEventAdminConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingRemove: EventAdminRow | null
  onConfirm: () => void
}

const RemoveEventAdminConfirmDialog: React.FC<RemoveEventAdminConfirmDialogProps> = ({
  open,
  onOpenChange,
  pendingRemove,
  onConfirm,
}) => {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove Event Admin"
      description={
        pendingRemove ? (
          <div className="space-y-1">
            <div>
              Remove <b>{pendingRemove.username}</b> from event <b>{pendingRemove.event_name}</b>?
            </div>
            <div className="text-xs text-muted-foreground">This user will lose access to manage challenges for this event.</div>
          </div>
        ) : (
          'Are you sure?'
        )
      }
      confirmLabel="Remove"
      onConfirm={onConfirm}
    />
  )
}

export default RemoveEventAdminConfirmDialog
