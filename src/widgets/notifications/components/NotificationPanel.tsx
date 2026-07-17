'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Bell, Check, Plus, Loader2, X, Megaphone, Settings2, Trash2, Calendar, Clock, CalendarClock } from 'lucide-react'
import { Switch, Button, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'
import { cn, formatRelativeDate } from '@/shared/lib/utils'
import { createScheduledJob, getScheduledJobs, deleteScheduledJob } from '@/shared/lib'
import { formatJakartaDate } from '@/features/admin/audit-logs/lib/audit-log-utils'
import NotificationItem from './NotificationItem'

function formatNotificationText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, (match) => match.slice(3, -3))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

type NotificationPanelProps = {
  theme: string
  notifPanelRef: React.RefObject<HTMLDivElement>
  setNotifOpen: (open: boolean) => void
  markAllNotificationsRead: () => void
  markNotificationRead: (id: string) => void
  solveSoundEnabled: boolean
  setSolveSoundEnabled: (enabled: boolean) => void
  globalAdminStatus: boolean
  notifTitle: string
  setNotifTitle: (title: string) => void
  notifMessage: string
  setNotifMessage: (message: string) => void
  notifLevel: 'info' | 'info_platform' | 'info_challenges'
  setNotifLevel: (level: 'info' | 'info_platform' | 'info_challenges') => void
  handleSendNotif: () => void
  notifLoading: boolean
  notifItems: Array<{ id: string; title: string; message: string; level: string; created_at: string }>
  isNotifRead: (id: string) => boolean
  getLevelBadgeClass: (level: string) => string
  handleDeleteNotif: (id: string) => void
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

export default function NotificationPanel({
  theme,
  notifPanelRef,
  setNotifOpen,
  markAllNotificationsRead,
  markNotificationRead,
  solveSoundEnabled,
  setSolveSoundEnabled,
  globalAdminStatus,
  notifTitle,
  setNotifTitle,
  notifMessage,
  setNotifMessage,
  notifLevel,
  setNotifLevel,
  handleSendNotif,
  notifLoading,
  notifItems,
  isNotifRead,
  getLevelBadgeClass,
  handleDeleteNotif,
}: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'admin'>(
    globalAdminStatus ? 'notifications' : 'notifications'
  )

  const [explicitExpanded, setExplicitExpanded] = useState<Record<string, boolean>>({})
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAt, setScheduledAt] = useState(oneHourLater())
  const [scheduledItems, setScheduledItems] = useState<Array<{ id: string; scheduled_at: string; title: string; message: string; level: string; payload: any }>>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (activeTab !== 'admin' || !globalAdminStatus) return
    const loadScheduled = async () => {
      const all = await getScheduledJobs('pending', 100)
      const notifJobs = (all || []).filter((j: any) => j.job_type === 'notification')
      setScheduledItems(notifJobs.map((j: any) => ({
        id: j.id,
        scheduled_at: j.scheduled_at,
        title: j.payload?.title || '',
        message: j.payload?.message || '',
        level: j.payload?.level || 'info',
        payload: j.payload,
      })))
    }
    loadScheduled()
  }, [activeTab, globalAdminStatus])

  const isItemExpanded = (id: string, isRead: boolean) => {
    if (explicitExpanded[id] !== undefined) {
      return explicitExpanded[id]
    }
    return !isRead
  }

  const handleNotifClick = (id: string, isRead: boolean) => {
    markNotificationRead(id)
    const currentlyExpanded = isItemExpanded(id, isRead)
    setExplicitExpanded((prev) => ({
      ...prev,
      [id]: !currentlyExpanded,
    }))
  }

  const handleScheduleNotif = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return
    if (!scheduledAt) return
    setSending(true)
    try {
      const title = notifTitle.trim()
      const message = notifMessage.trim()
      const level = notifLevel
      const jobId = await createScheduledJob(
        'notification',
        new Date(scheduledAt).toISOString(),
        null,
        { title, message, level }
      )
      if (jobId) {
        toast.success(`Notification scheduled for ${formatJakartaDate(scheduledAt)}`)
        setNotifTitle('')
        setNotifMessage('')
        setScheduleMode(false)
        // Refresh scheduled list
        const all = await getScheduledJobs('pending', 100)
        const notifJobs = (all || []).filter((j: any) => j.job_type === 'notification')
        setScheduledItems(notifJobs.map((j: any) => ({
          id: j.id,
          scheduled_at: j.scheduled_at,
          title: j.payload?.title || '',
          message: j.payload?.message || '',
          level: j.payload?.level || 'info',
          payload: j.payload,
        })))
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to schedule notification')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteScheduled = async (jobId: string) => {
    setScheduleLoading(true)
    try {
      const ok = await deleteScheduledJob(jobId)
      if (ok) {
        toast.success('Scheduled notification cancelled')
        setScheduledItems(prev => prev.filter(s => s.id !== jobId))
      }
    } catch {
      toast.error('Failed to delete scheduled notification')
    } finally {
      setScheduleLoading(false)
    }
  }

  const groupedNotifs = React.useMemo(() => {
    const now = new Date()
    const todayStr = now.toDateString()
    const yesterdayDate = new Date(now)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = yesterdayDate.toDateString()

    const groups: Record<string, typeof notifItems> = {
      Today: [],
      Yesterday: [],
      Earlier: []
    }

    notifItems.forEach(n => {
      const d = new Date(n.created_at).toDateString()
      if (d === todayStr) groups.Today.push(n)
      else if (d === yesterdayStr) groups.Yesterday.push(n)
      else groups.Earlier.push(n)
    })

    return groups
  }, [notifItems])

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={() => setNotifOpen(false)}
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[50]"
      />

      {/* Drawer */}
      <motion.div
        ref={notifPanelRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ willChange: 'transform' }}
        className={`fixed right-0 top-0 h-full w-full sm:w-[420px] shadow-2xl border-l flex flex-col z-[51]
          ${theme === 'dark' ? 'bg-[#0d1117] border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}
        `}
      >
        {/* Header Section */}
        <div className="pt-6 px-5 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Bell size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">Notifications</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllNotificationsRead}
                className="text-[10px] font-bold uppercase tracking-wider text-blue-500 hover:bg-blue-500/10 px-2.5 py-1.5 rounded-md transition-all"
                title="Mark all as read"
              >
                Mark all read
              </button>
              <button
                onClick={() => setNotifOpen(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Admin Tabs */}
          {globalAdminStatus && (
            <div className="flex items-center gap-6 px-1 border-b border-transparent">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`pb-2 text-xs font-semibold transition-all relative
                  ${activeTab === 'notifications'
                    ? 'text-blue-500'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
                `}
              >
                Penonton
                {activeTab === 'notifications' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`pb-2 text-xs font-semibold transition-all relative
                  ${activeTab === 'admin'
                    ? 'text-blue-500'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
                `}
              >
                Admin Panel
                {activeTab === 'admin' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            </div>
          )}

          {!globalAdminStatus && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Recent Activity</span>
            </div>
          )}
        </div>

        {/* Global Settings */}
        <div className="px-5 py-2.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/10">
          <div className="flex items-center gap-2">
            <Megaphone size={13} className="text-orange-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Solve Sounds</span>
          </div>
          <Switch
            checked={solveSoundEnabled}
            onCheckedChange={setSolveSoundEnabled}
            className="scale-75 origin-right"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {activeTab === 'notifications' ? (
            <div key="notifs" className="p-3 flex flex-col gap-1">
              {notifLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="text-xs font-medium opacity-70">Loading...</span>
                </div>
              ) : notifItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-30">
                  <Bell size={40} strokeWidth={1} />
                  <p className="text-xs font-medium">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(['Today', 'Yesterday', 'Earlier'] as const).map(group => {
                    if (groupedNotifs[group].length === 0) return null
                    return (
                      <div key={group} className="flex flex-col gap-1.5">
                        <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-500/70">
                          {group}
                        </h3>
                        {groupedNotifs[group].map((n) => {
                          const isRead = isNotifRead(n.id)
                          return (
                            <NotificationItem
                              key={n.id}
                              notification={n}
                              isRead={isRead}
                              theme={theme}
                              globalAdminStatus={globalAdminStatus}
                              getLevelBadgeClass={getLevelBadgeClass}
                              isExpanded={isItemExpanded(n.id, isRead)}
                              onClick={() => handleNotifClick(n.id, isRead)}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div key="admin" className="p-5 space-y-6">
              {/* Broadcast Form */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Plus size={14} className="text-blue-500" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">New Broadcast</h3>
                </div>
                <div className="space-y-2">
                  <Input
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Title"
                    className="h-10 text-sm"
                  />
                  <Textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Message..."
                    className="min-h-[80px] resize-y text-sm"
                    rows={2}
                  />
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Select
                      value={notifLevel}
                      onValueChange={(value) => setNotifLevel(value as any)}
                    >
                      <SelectTrigger className="h-9 w-36 text-xs px-3">
                        <SelectValue placeholder="Broadcast Type" />
                      </SelectTrigger>
                      <SelectContent className="!z-[999]">
                        <SelectItem value="info">Broadcast</SelectItem>
                        <SelectItem value="info_platform">System</SelectItem>
                        <SelectItem value="info_challenges">Challenges</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={scheduleMode ? handleScheduleNotif : handleSendNotif}
                      size="sm"
                      className="px-5 font-bold uppercase tracking-wider text-[10px]"
                      disabled={sending || (!notifTitle.trim() || !notifMessage.trim())}
                    >
                      {sending ? 'Scheduling...' : scheduleMode ? 'Schedule' : 'Send'}
                    </Button>
                  </div>

                  {/* Schedule Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="size-3" />
                      Send later
                    </span>
                    <Switch
                      checked={scheduleMode}
                      onCheckedChange={setScheduleMode}
                      className="scale-75 origin-right"
                    />
                  </div>

                  {scheduleMode && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3 text-gray-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Schedule At</span>
                      </div>
                      <Input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Scheduled Section */}
              {scheduledItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock size={14} className="text-amber-500" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Scheduled</h3>
                    </div>
                    <span className="text-[9px] font-bold text-amber-500 opacity-60 uppercase">
                      {scheduledItems.length} Pending
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {scheduledItems.map((s) => (
                      <div
                        key={s.id}
                        className={`p-3 rounded-lg border text-xs space-y-1
                          ${theme === 'dark' ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200'}
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{s.title}</p>
                            <p className="text-gray-400 line-clamp-1">{s.message}</p>
                            <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatJakartaDate(s.scheduled_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteScheduled(s.id)}
                            disabled={scheduleLoading}
                            className="p-1 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent History List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">History</h3>
                  </div>
                  <span className="text-[9px] font-bold text-blue-500 opacity-60 uppercase">
                    {notifItems.length} Sent
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {notifItems.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      isRead={true}
                      theme={theme}
                      globalAdminStatus={globalAdminStatus}
                      getLevelBadgeClass={getLevelBadgeClass}
                      onDelete={handleDeleteNotif}
                      isExpanded={explicitExpanded[n.id] === true}
                      onClick={() => setExplicitExpanded(prev => ({
                        ...prev,
                        [n.id]: !prev[n.id],
                      }))}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Detail Modal removed in favor of inline accordion UX */}
    </>
  )
}
