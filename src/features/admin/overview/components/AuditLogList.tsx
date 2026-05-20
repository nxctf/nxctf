"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader } from '@/shared/components'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { formatRelativeDate } from '@/shared/lib'
import { getAuditLogs } from '@/features/logs/lib/audit-service'
import type { AuditLogEntry } from '@/features/logs/lib/audit-service'
import type { ActionType } from '../types'
import { EmailWithUsernameTooltip } from './AuditLog/EmailWithUsernameTooltip'

interface AuditLogListProps {
  logs?: AuditLogEntry[]
  isLoading?: boolean
}

const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'user_signedup', label: 'Sign Up' },
  { value: 'user_deleted', label: 'Deleted' },
  { value: 'token_refreshed', label: 'Session Renewed' },
]

const getActionStyle = (action: string) => {
  switch (action) {
    case 'login': return { color: 'text-green-500', icon: '→' }
    case 'logout': return { color: 'text-yellow-500', icon: '←' }
    case 'user_signedup': return { color: 'text-blue-500', icon: '+' }
    case 'user_deleted': return { color: 'text-red-500', icon: '×' }
    case 'token_refreshed': return { color: 'text-purple-500', icon: '⟲' }
    default: return { color: 'text-gray-500', icon: '•' }
  }
}

const formatActionLabel = (action: string) => {
  if (action === 'token_refreshed') return 'Session Renewed'

  return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

const AuditLogList: React.FC<AuditLogListProps> = ({ logs: propLogs, isLoading: propLoading }) => {
  const [internalLogs, setInternalLogs] = useState<AuditLogEntry[]>([])
  const [internalLoading, setInternalLoading] = useState(false)
  const [limit, setLimit] = useState(50)
  const [selectedActions, setSelectedActions] = useState<ActionType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [usernameCache, setUsernameCache] = useState<Map<string, string | null>>(new Map())

  const logs = propLogs || internalLogs
  const isLoading = propLoading ?? internalLoading

  useEffect(() => {
    if (propLogs) return
    const fetchLogs = async () => {
      setInternalLoading(true)
      try {
        const data = await getAuditLogs(limit)
        setInternalLogs(data || [])
      } finally {
        setInternalLoading(false)
      }
    }
    fetchLogs()
  }, [limit, propLogs])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (log.payload.action === 'token_revoked') return false
      const matchesAction = selectedActions.length === 0 || selectedActions.includes(log.payload.action as ActionType)
      const email = log.payload.action === 'user_deleted' ? log.payload.traits?.user_email : log.payload.actor_username
      const matchesSearch = !searchQuery || email?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesAction && matchesSearch
    })
  }, [logs, selectedActions, searchQuery])

  const handleUsernameLoaded = useCallback((email: string, username: string | null) => {
    setUsernameCache(prev => new Map(prev).set(email, username))
  }, [])

  if (isLoading) return (
    <Card className="bg-white dark:bg-gray-800 pt-5">
      <CardHeader><CardTitle className="text-lg font-semibold">Audit Logs</CardTitle></CardHeader>
      <CardContent className="flex justify-center py-8"><Loader /></CardContent>
    </Card>
  )

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Audit Logs</CardTitle>
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="text-xs bg-transparent border rounded-md px-2 py-1 outline-none"
          >
            {[50, 100, 250, 500, 1000].map(v => <option key={v} value={v}>Last {v}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {ACTION_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={selectedActions.includes(opt.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedActions(prev => prev.includes(opt.value) ? prev.filter(a => a !== opt.value) : [...prev, opt.value])}
                className="h-8 text-[10px] uppercase font-black tracking-widest"
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter by email..."
            className="text-sm px-3 py-2 rounded-lg border bg-transparent outline-none focus:ring-1 ring-orange-500/50"
          />
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredLogs.map((log, idx) => {
            const isUserDeleted = log.payload.action === 'user_deleted'
            const userEmail = isUserDeleted ? log.payload.traits?.user_email : log.payload.actor_username
            const style = getActionStyle(log.payload.action)

            return (
              <motion.div key={log.id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className={cn(style.color, "font-black text-lg")}>{style.icon}</span>
                    <span className={cn(style.color, "text-[10px] font-black uppercase tracking-widest")}>
                      {formatActionLabel(log.payload.action)}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    {userEmail ? (
                      <EmailWithUsernameTooltip
                        email={userEmail}
                        cachedUsername={usernameCache.get(userEmail)}
                        onUsernameLoaded={handleUsernameLoaded}
                      />
                    ) : <span className="text-gray-500 italic text-sm">Unknown</span>}
                  </div>

                  <span className="text-[10px] text-gray-500 font-mono">
                    {formatRelativeDate(log.created_at)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default AuditLogList
