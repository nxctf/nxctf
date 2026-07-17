"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, KeyRound, Flag, CalendarClock } from 'lucide-react'
import { useAuth } from '@/shared/contexts'
import { AuthService } from '@/features/auth'
import { AdminContentLoading, AdminPageShell, AdminTabs, useTabState } from '../../ui'
import AuthAuditLogList from './AuthAuditLogList'
import AuditLogList from './AuditLogList'
import FlagSubmissionStatsList from './FlagSubmissionStatsList'
import CronJobsList from './CronJobsList'

type AuditLogTab = 'admin' | 'auth' | 'submissions' | 'cron'

export default function AdminAuditLogsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [accessReady, setAccessReady] = useState(true)
  const [isAllowed, setIsAllowed] = useState(true)
  const [activeTab, setActiveTab] = useTabState<AuditLogTab>('tab', 'auth')

  useEffect(() => {
    let mounted = true
    const checkAccess = async () => {
      if (authLoading) return
      if (!user) {
        setAccessReady(true)
        router.push('/challenges')
        return
      }

      const adminCheck = await AuthService.isGlobalAdmin()
      if (!mounted) return
      setIsAllowed(adminCheck)
      setAccessReady(true)
      if (!adminCheck) {
        router.push('/challenges')
      }
    }
    checkAccess()
    return () => { mounted = false }
  }, [authLoading, user, router])

  if (authLoading || !accessReady) return <AdminContentLoading variant="challenges" />
  if (!user || !isAllowed) return null

  const tabsElement = (
    <AdminTabs<AuditLogTab>
      stretch
      className="w-full sm:w-fit"
      value={activeTab}
      onChange={setActiveTab}
      items={[
        { value: 'auth', label: 'Auth Logs', icon: KeyRound },
        { value: 'admin', label: 'Admin Logs', icon: ClipboardList },
        { value: 'submissions', label: 'Flag Submissions', icon: Flag },
        { value: 'cron', label: 'Schedule', icon: CalendarClock },
      ]}
    />
  )

  return (
    <AdminPageShell>
      {activeTab === 'admin' && <AuditLogList tabs={tabsElement} />}
      {activeTab === 'auth' && <AuthAuditLogList tabs={tabsElement} />}
      {activeTab === 'submissions' && <FlagSubmissionStatsList tabs={tabsElement} />}
      {activeTab === 'cron' && <CronJobsList tabs={tabsElement} />}
    </AdminPageShell>
  )
}
