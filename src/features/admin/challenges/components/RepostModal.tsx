"use client"

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Button, Label, Input } from '@/shared/ui'
import { repostChallenge, getChallengeFirstBlood } from '@/shared/lib'
import { formatDate } from '@/shared/components/DateBadge'
import type { Challenge } from '../types'

interface RepostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: Challenge | null
  onSuccess?: () => void
}

function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function RepostModal({ open, onOpenChange, challenge, onSuccess }: RepostModalProps) {
  const [newDate, setNewDate] = useState(() => toDatetimeLocalValue(new Date()))
  const [firstBlood, setFirstBlood] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fbLoaded, setFbLoaded] = useState(false)

  useEffect(() => {
    if (open && challenge) {
      const defaultDate = challenge.created_at
        ? toDatetimeLocalValue(new Date(challenge.created_at))
        : toDatetimeLocalValue(new Date())
      setNewDate(defaultDate)
      setFirstBlood(null)
      setFbLoaded(false)
      getChallengeFirstBlood(challenge.id).then((fb) => {
        setFirstBlood(fb)
        setFbLoaded(true)
      })
    }
  }, [open, challenge])

  const firstBloodDate = firstBlood ? new Date(firstBlood) : null
  const selectedDate = new Date(newDate)
  const isInvalid = !!(firstBloodDate && !isNaN(selectedDate.getTime()) && selectedDate > firstBloodDate)

  const handleConfirm = async () => {
    if (!challenge || isInvalid) return
    setLoading(true)
    try {
      const result = await repostChallenge(challenge.id, new Date(newDate).toISOString())
      if (result.success) {
        toast.success(`Post date updated to ${formatDate(result.created_at)}`)
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast.error(result.message || 'Failed to repost')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to repost challenge')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 gap-3" aria-describedby={undefined}>
        <DialogTitle className="text-sm font-semibold">Repost Challenge</DialogTitle>
        <p className="text-xs text-muted-foreground">
          Set a new post date for <strong>{challenge?.title}</strong>.
          {challenge?.created_at && (
            <> Current: <span className="font-medium">{formatDate(challenge.created_at)}</span></>
          )}
        </p>

        <div className="space-y-1.5">
          <Label>New Post Date & Time</Label>
          <Input
            type="datetime-local"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="h-9 text-sm"
          />
          {!isNaN(new Date(newDate).getTime()) && (
            <p className="text-xs text-muted-foreground">
              {formatDate(newDate)}
              {firstBloodDate && fbLoaded && <>, max {formatDate(firstBlood)}</>}
            </p>
          )}
          {!fbLoaded && <p className="text-xs text-gray-400">Verifying first blood...</p>}
          {fbLoaded && firstBloodDate && (
            <p className="text-xs text-amber-600 dark:text-amber-400">⚠ First blood: {formatDate(firstBlood)}</p>
          )}
          {fbLoaded && !firstBloodDate && (
            <p className="text-xs text-green-600 dark:text-green-400">No first blood — safe to repost</p>
          )}
          {isInvalid && (
            <p className="text-xs text-red-500">Date cannot be after first blood ({formatDate(firstBlood)})</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !newDate || !!isInvalid}>
            {loading ? 'Reposting...' : 'Repost'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
