"use client"

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/shared/ui/dialog'
import { Button, Label, Input, Switch } from '@/shared/ui'
import { createScheduledJob, getChallengeFirstBlood } from '@/shared/lib'
import { formatDate } from '@/shared/components/DateBadge'
import type { Challenge } from '../types'

interface ScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: Challenge | null
  existingScheduledAt?: string
  onSuccess?: () => void
}

function toDatetimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function oneHourLater(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1)
  return toDatetimeLocalValue(d)
}

export default function ScheduleModal({ open, onOpenChange, challenge, existingScheduledAt, onSuccess }: ScheduleModalProps) {
  const [scheduledAt, setScheduledAt] = useState(oneHourLater())
  const [repostOnActivate, setRepostOnActivate] = useState(false)
  const [firstBlood, setFirstBlood] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fbLoaded, setFbLoaded] = useState(false)

  useEffect(() => {
    if (open && challenge) {
      setScheduledAt(existingScheduledAt ? toDatetimeLocalValue(new Date(existingScheduledAt)) : oneHourLater())
      setRepostOnActivate(false)
      setFirstBlood(null)
      setFbLoaded(false)
      getChallengeFirstBlood(challenge.id).then((fb) => {
        setFirstBlood(fb)
        setFbLoaded(true)
      })
    }
  }, [open, challenge, existingScheduledAt])

  const firstBloodDate = firstBlood ? new Date(firstBlood) : null
  const selectedDate = new Date(scheduledAt)
  const isDateValid = !isNaN(selectedDate.getTime())
  const isRepostInvalid = !!(repostOnActivate && firstBloodDate && isDateValid && selectedDate > firstBloodDate)
  const isFbPending = repostOnActivate && !fbLoaded

  const handleConfirm = async () => {
    if (!challenge || isRepostInvalid) return
    setLoading(true)
    try {
      const payload = repostOnActivate ? { repost: true } : {}
      const jobId = await createScheduledJob(
        'challenge_activate',
        new Date(scheduledAt).toISOString(),
        challenge.id,
        payload
      )
      if (jobId) {
        toast.success(`Scheduled activation for ${formatDate(scheduledAt)}${repostOnActivate ? ' with repost' : ''}`)
        onSuccess?.()
        onOpenChange(false)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to schedule activation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 gap-3" aria-describedby={undefined}>
        <DialogTitle className="text-sm font-semibold">Schedule Challenge Activation</DialogTitle>
        <p className="text-xs text-muted-foreground">
          {existingScheduledAt ? 'Update existing' : 'Set a'} schedule to auto-activate <strong>{challenge?.title}</strong>.
        </p>

        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label>Activation Date & Time</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-9 text-sm"
            />
            {isDateValid && (
              <p className="text-xs text-muted-foreground">
                {formatDate(scheduledAt)}
                {firstBloodDate && fbLoaded && <>, max {formatDate(firstBlood)}</>}
              </p>
            )}
            {!fbLoaded && repostOnActivate && <p className="text-xs text-gray-400">Verifying first blood...</p>}
            {fbLoaded && firstBloodDate && (
              <p className="text-xs text-amber-600 dark:text-amber-400">⚠ First blood: {formatDate(firstBlood)}</p>
            )}
            {fbLoaded && !firstBloodDate && (
              <p className="text-xs text-green-600 dark:text-green-400">No first blood — safe to repost</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-muted-foreground">Recreate post date on activation</span>
            <Switch
              checked={repostOnActivate}
              onCheckedChange={setRepostOnActivate}
            />
          </div>

          {isRepostInvalid && (
            <p className="text-xs text-red-500">
              Cannot repost: activation date is after first blood ({formatDate(firstBlood)})
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !scheduledAt || !!isRepostInvalid || isFbPending}>
            {loading ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
