import React from 'react'
import ConfirmDialog from '@/shared/components/ConfirmDialog'
import type { Challenge } from '../types'

interface DeleteChallengeConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingDelete: Challenge | null
  confirmInput: string
  onConfirmInputChange: (value: string) => void
  onConfirm: () => void | Promise<void>
}

const DeleteChallengeConfirmDialog: React.FC<DeleteChallengeConfirmDialogProps> = ({
  open,
  onOpenChange,
  pendingDelete,
  confirmInput,
  onConfirmInputChange,
  onConfirm,
}) => {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Challenge"
      description={
        <div className="space-y-4">
          <p>Are you sure you want to delete this challenge? This action cannot be undone.</p>
          {pendingDelete && (
            <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-sm">
              <p><b>Title:</b> {pendingDelete.title}</p>
              <p>Type <b>{pendingDelete.title}</b> to confirm:</p>
              <input
                type="text"
                className="w-full mt-2 px-3 py-2 border rounded bg-white dark:bg-gray-800"
                value={confirmInput}
                onChange={event => onConfirmInputChange(event.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
      }
      confirmLabel="Delete"
      onConfirm={onConfirm}
    />
  )
}

export default DeleteChallengeConfirmDialog
