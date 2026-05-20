import React from 'react'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import type { PendingDeleteDetail } from '../types'

interface DeleteSolverConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingDelete: string | null
  pendingDeleteDetail: PendingDeleteDetail
  onConfirmDelete: (solverId: string) => Promise<void>
  onClearPendingDelete: () => void
}

const DeleteSolverConfirmDialog: React.FC<DeleteSolverConfirmDialogProps> = ({
  open,
  onOpenChange,
  pendingDelete,
  pendingDeleteDetail,
  onConfirmDelete,
  onClearPendingDelete,
}) => {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Solver"
      variant="destructive"
      description={
        <div className="space-y-3">
          <div>Are you sure you want to delete this solver record? This action cannot be undone.</div>
          {pendingDeleteDetail && (
            <div className="rounded-lg border border-red-200/80 bg-red-50/80 p-3 text-sm dark:border-red-900/70 dark:bg-red-950/30">
              <p className="truncate"><span className="font-semibold">User:</span> <span className="font-mono">{pendingDeleteDetail.username}</span></p>
              <p className="truncate"><span className="font-semibold">Challenge:</span> <span className="font-mono">{pendingDeleteDetail.challenge_title}</span></p>
            </div>
          )}
        </div>
      }
      confirmLabel="Delete"
      onConfirm={async () => {
        if (!pendingDelete) return
        await onConfirmDelete(pendingDelete)
        onClearPendingDelete()
        onOpenChange(false)
      }}
    />
  )
}

export default DeleteSolverConfirmDialog
