'use client'

import { FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { LogsProvider, useLogs } from '@/features/logs/contexts/LogsContext'
import type { Theme } from '@/shared/contexts/ThemeContext'

type NavbarLogsButtonProps = {
  pathname: string
  theme: Theme
}

function NavbarLogsButtonContent({ pathname, theme }: NavbarLogsButtonProps) {
  const router = useRouter()
  const { unreadCount } = useLogs()

  return (
    <div className="relative mr-2" data-tour="navbar-logs">
      <button
        className={`rounded-full p-1 transition-colors duration-150 ${pathname === '/logs' ? (theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100') : ''}`}
        title="Logs"
        aria-label="Logs"
        onClick={() => {
          if (pathname === '/logs') {
            if (window.history.length > 1) {
              router.back()
            } else {
              router.push('/')
            }
          } else {
            router.push('/logs')
          }
        }}
      >
        <FileText size={22} className="text-blue-500" />
      </button>

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold bg-red-600 text-white">
          {unreadCount > 99 ? '99+' : String(unreadCount)}
        </span>
      )}
    </div>
  )
}

export default function NavbarLogsButton(props: NavbarLogsButtonProps) {
  return (
    <LogsProvider>
      <NavbarLogsButtonContent {...props} />
    </LogsProvider>
  )
}
