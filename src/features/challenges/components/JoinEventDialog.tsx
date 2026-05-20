"use client"

import { useState } from 'react'

import { Event, type EventMembershipStatus } from "@/shared/types"
import { EventService } from "@/features/events/services/event.service"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui'
import { toast } from "sonner"

type JoinEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  joinMode: 'open' | 'key' | 'request'
  membershipData: EventMembershipStatus | null
  onSuccess: () => void
}

export default function JoinEventDialog({
  open,
  onOpenChange,
  event,
  joinMode,
  membershipData,
  onSuccess,
}: JoinEventDialogProps) {
  const [loading, setLoading] = useState(false)
  const [joinKey, setJoinKey] = useState("")
  const [joinNote, setJoinNote] = useState("")

  const handleJoin = async () => {
    if (!event) return

    if (joinMode === 'key' && !joinKey.trim()) {
      toast.error('Join key is required')
      return
    }

    setLoading(true)
    try {
      const result = await EventService.joinEvent(
        event.id,
        joinMode === 'key' ? joinKey.trim() : null,
        joinMode === 'request' ? joinNote.trim() : null
      )
      if (result?.success) {
        toast.success(result.message || 'Join request submitted')
        onSuccess()
      } else {
        toast.error(result?.message || 'Failed to join event')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to join event')
    } finally {
      setLoading(false)
    }
  }

  const isPending = membershipData?.request_status === 'pending'
  const isRejected = membershipData?.request_status === 'rejected'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={'w-[calc(100vw-32px)] sm:w-full fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md rounded-2xl bg-card border border-border text-card-foreground p-6'}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            Join Event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 my-4">
          <div className="p-4 bg-blue-500/[0.03] border border-blue-500/10 rounded-xl">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {event?.name || 'Unknown Event'}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              You need to join this event to access its challenges. Follow the requirements below to proceed.
            </p>
          </div>

          {joinMode === 'key' && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Event Access Key
              </label>
              <input
                type="text"
                value={joinKey}
                onChange={(e) => setJoinKey(e.target.value)}
                placeholder="Enter access key..."
                className={'h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'}
                autoFocus
              />
            </div>
          )}

          {joinMode === 'request' && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Join Request Note
              </label>
              <textarea
                value={joinNote}
                onChange={(e) => setJoinNote(e.target.value)}
                placeholder="Tell us why you'd like to join..."
                rows={3}
                className={`${'w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground caret-primary outline-none transition-all placeholder:text-muted-foreground hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'} resize-none`}
                autoFocus
              />
            </div>
          )}

          {isPending ? (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl flex items-center justify-center">
              Your request is currently pending admin approval.
            </div>
          ) : isRejected ? (
            <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center justify-center">
              Your previous request was declined. You can try again.
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            disabled={loading || isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all"
          >
            {loading ? "Processing..." : joinMode === 'request' ? 'Submit Request' : joinMode === 'key' ? 'Verify & Join' : 'Join Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
