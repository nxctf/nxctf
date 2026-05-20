'use client'

import React, { useState } from 'react'
import { Pencil } from 'lucide-react'

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Input } from '@/shared/ui'

interface EditTeamModalProps {
  currentName: string
  onSave: (newName: string) => Promise<{ success: boolean; error?: string }>
  disabled?: boolean
  trigger?: React.ReactElement
}

export default function EditTeamModal({
  currentName,
  onSave,
  disabled,
  trigger,
}: EditTeamModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (val: boolean) => {
    setOpen(val)
    if (val) {
      setName(currentName)
      setError(null)
    }
  }

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === currentName) {
      setOpen(false)
      return
    }

    setLoading(true)
    setError(null)

    const res = await onSave(trimmed)
    setLoading(false)

    if (res.success) {
      setOpen(false)
    } else {
      setError(res.error || 'Failed to update team name')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          trigger || (
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white font-semibold border-none"
            >
              <Pencil size={14} />
              Edit Team
            </Button>
          )
        }
      />

      <DialogContent className={'w-[calc(100vw-32px)] sm:w-full fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md rounded-2xl bg-card border border-border text-card-foreground p-6'}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            Edit Team
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Update your team information below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Team Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              maxLength={50}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Max 50 characters. Must be unique.
            </p>
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm text-center font-semibold">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              loading ||
              !name.trim() ||
              name.trim() === currentName
            }
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
