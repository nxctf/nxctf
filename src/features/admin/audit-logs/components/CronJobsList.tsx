"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Clock, CheckCircle2, XCircle, Trash2, CalendarClock, Bell, RotateCcw, ExternalLink, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { Loader } from '@/shared/components'
import { getScheduledJobs, deleteScheduledJob } from '@/shared/lib'
import { formatJakartaDate } from '../lib/audit-log-utils'
import {
  ADMIN_ROW_CLASS,
  AdminDataSurface,
  AdminEmptyState,
  AdminFilterSelect,
  AdminFilterToolbar,
  AdminStickyToolbar,
  AdminTableSurface,
} from '../../ui'

interface ScheduledJob {
  id: string
  job_type: string
  status: string
  target_id: string
  target_title: string
  payload: any
  scheduled_at: string
  executed_at: string | null
  error_message: string | null
  created_by: string
  created_at: string
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'challenge_activate', label: 'Activate' },
  { value: 'notification', label: 'Notification' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'destructive' | 'secondary'; icon: typeof CheckCircle2 }> = {
    completed: { variant: 'default', icon: CheckCircle2 },
    failed: { variant: 'destructive', icon: XCircle },
    pending: { variant: 'secondary', icon: Clock },
  }
  const c = config[status] || { variant: 'destructive' as const, icon: XCircle }
  const Icon = c.icon
  return (
    <Badge variant={c.variant} className="inline-flex items-center gap-1 capitalize">
      <Icon className="size-3" />
      {status}
    </Badge>
  )
}

function ScheduleDetailDialog({
  job,
  open,
  onOpenChange,
}: {
  job: ScheduledJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!job) return null
  const isActivate = job.job_type === 'challenge_activate'
  const isNotif = job.job_type === 'notification'
  const hasRepost = job.payload?.repost === true

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 gap-4" aria-describedby={undefined}>
        <DialogTitle className="text-sm font-semibold">Schedule Details</DialogTitle>
        <div className="space-y-3 text-xs">
          {/* Type */}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Type</span>
            <span className="col-span-2 font-medium capitalize">
              {isActivate ? 'Challenge Activate' : isNotif ? 'Notification' : job.job_type}
            </span>
          </div>

          {/* Notification payload */}
          {isNotif && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Title</span>
                <span className="col-span-2 font-medium break-words">{job.payload?.title || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Message</span>
                <span className="col-span-2 text-gray-600 dark:text-gray-300 break-words whitespace-pre-wrap">{job.payload?.message || '-'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Level</span>
                <span className="col-span-2 font-medium capitalize">{job.payload?.level || 'info'}</span>
              </div>
            </>
          )}

          {/* Challenge target */}
          {isActivate && (
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Target</span>
              <span className="col-span-2 font-medium">
                <Link
                  href={`/admin/challenges?edit=${job.target_id}`}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                >
                  {job.target_title || job.target_id.slice(0, 8)}
                  <ExternalLink className="size-3" />
                </Link>
              </span>
            </div>
          )}

          {/* Schedule times */}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Scheduled</span>
            <span className="col-span-2 font-medium">{formatJakartaDate(job.scheduled_at)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Executed</span>
            <span className="col-span-2 font-medium">{job.executed_at ? formatJakartaDate(job.executed_at) : '-'}</span>
          </div>

          {/* Status */}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Status</span>
            <span className="col-span-2"><StatusBadge status={job.status} /></span>
          </div>

          {/* Repost flag */}
          {isActivate && (
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Repost</span>
              <span className="col-span-2 font-medium">{hasRepost ? 'Yes, recreate post date on activation' : 'No'}</span>
            </div>
          )}

          {/* Error */}
          {job.error_message && (
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Error</span>
              <span className="col-span-2 text-red-500 break-words">{job.error_message}</span>
            </div>
          )}

          {/* Full payload */}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Payload</span>
            <span className="col-span-2 font-mono text-[10px] break-all">{JSON.stringify(job.payload)}</span>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Job ID</span>
            <span className="col-span-2 font-mono text-[10px]">{job.id}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="text-muted-foreground">Created</span>
            <span className="col-span-2 font-medium">{formatJakartaDate(job.created_at)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ScheduledJobsList({ tabs }: { tabs?: React.ReactNode }) {
  const [allJobs, setAllJobs] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null)

  const load = async () => {
    const data = await getScheduledJobs(null, 100)
    setAllJobs(data)
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true
    load().then(() => { /* noop */ })
    return () => { mounted = false }
  }, [])

  const filteredJobs = useMemo(() => {
    return allJobs.filter((j) => {
      if (typeFilter !== 'all' && j.job_type !== typeFilter) return false
      if (statusFilter !== 'all' && j.status !== statusFilter) return false
      return true
    })
  }, [allJobs, typeFilter, statusFilter])

  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(jobId)
    try {
      const ok = await deleteScheduledJob(jobId)
      if (ok) {
        toast.success('Scheduled job deleted')
        setAllJobs((prev) => prev.filter((j) => j.id !== jobId))
      } else {
        toast.error('Failed to delete scheduled job')
      }
    } catch {
      toast.error('Failed to delete scheduled job')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <AdminDataSurface toolbar={tabs ? <AdminStickyToolbar tabs={tabs} /> : undefined}>
        <Loader />
      </AdminDataSurface>
    )
  }

  const filtersEl = (
    <AdminFilterToolbar>
      <AdminFilterSelect
        value={typeFilter}
        onValueChange={setTypeFilter}
        className="w-full sm:w-[150px]"
        options={TYPE_OPTIONS}
      />
      <AdminFilterSelect
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="w-full sm:w-[150px]"
        options={STATUS_OPTIONS}
      />
    </AdminFilterToolbar>
  )

  return (
    <AdminDataSurface
      toolbar={tabs ? <AdminStickyToolbar tabs={tabs} filters={filtersEl} /> : (
        <AdminStickyToolbar filters={filtersEl} />
      )}
      empty={filteredJobs.length === 0 ? (
        <AdminEmptyState title="No scheduled jobs" description="No jobs match your filters." />
      ) : undefined}
    >
      <AdminTableSurface>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Repost</TableHead>
              <TableHead>Scheduled At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((sj) => {
              const isActivate = sj.job_type === 'challenge_activate'
              const hasRepost = sj.payload?.repost === true
              return (
                <TableRow
                  key={sj.id}
                  className={cn(ADMIN_ROW_CLASS, "border-b border-gray-100 dark:border-gray-800 cursor-pointer")}
                  onClick={() => setSelectedJob(sj)}
                >
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-medium">
                      {isActivate
                        ? <CalendarClock className="size-3.5 text-blue-500" />
                        : <Bell className="size-3.5 text-amber-500" />
                      }
                      {isActivate ? 'Activate' : 'Notification'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px]">
                    {isActivate && sj.target_id ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        {sj.target_title || sj.target_id.slice(0, 8)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isActivate ? (
                      hasRepost
                        ? <RotateCcw className="size-3.5 text-green-500" />
                        : <span className="text-muted-foreground text-xs">-</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatJakartaDate(sj.scheduled_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sj.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setSelectedJob(sj)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      {sj.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={deleting === sj.id}
                          onClick={(e) => handleDelete(sj.id, e)}
                        >
                          <Trash2 className="size-3.5 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </AdminTableSurface>

      <ScheduleDetailDialog
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={(v) => { if (!v) setSelectedJob(null) }}
      />
    </AdminDataSurface>
  )
}
