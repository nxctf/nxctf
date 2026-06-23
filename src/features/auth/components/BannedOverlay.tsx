'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, Clock, LogOut } from 'lucide-react'
import { Button } from '@/shared/ui'
import { AuthService } from '../services/auth.service'
import type { User } from '@/shared/types'

type BannedOverlayProps = {
  user: User
  variant?: 'fullscreen' | 'card'
}

export default function BannedOverlay({ user, variant = 'fullscreen' }: BannedOverlayProps) {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null)
  const [isIndefinite, setIsIndefinite] = useState(false)

  useEffect(() => {
    if (!user.banned_until) return

    const bannedUntilDate = new Date(user.banned_until)
    const farFutureThreshold = new Date('9999-01-01T00:00:00.000Z')

    if (bannedUntilDate > farFutureThreshold) {
      setIsIndefinite(true)
      return
    }

    const calculateTimeLeft = () => {
      const diff = bannedUntilDate.getTime() - Date.now()
      return Math.max(0, Math.floor(diff / 1000))
    }

    const initialTimeLeft = calculateTimeLeft()
    setTimeLeftSeconds(initialTimeLeft)

    if (initialTimeLeft <= 0) {
      window.location.reload()
      return
    }

    const intervalId = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeftSeconds(remaining)

      if (remaining <= 0) {
        clearInterval(intervalId)
        window.location.reload()
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [user.banned_until])

  const formatTimeLeft = (secondsCount: number) => {
    const days = Math.floor(secondsCount / (24 * 3600))
    const hours = Math.floor((secondsCount % (24 * 3600)) / 3600)
    const minutes = Math.floor((secondsCount % 3600) / 60)
    const seconds = secondsCount % 60

    const pad = (num: number) => String(num).padStart(2, '0')

    if (days > 0) {
      return `${days}d ${pad(hours)}h ${pad(minutes)}m`
    }
    if (hours > 0) {
      return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`
    }
    return `${pad(minutes)}m ${pad(seconds)}s`
  }

  const handleLogout = async () => {
    try {
      await AuthService.signOut()
      window.location.href = '/login'
    } catch (err) {
      console.error('Failed to log out banned user:', err)
      window.location.reload()
    }
  }

  const renderContent = (isCard: boolean) => (
    <div className={`relative w-full ${isCard ? 'max-w-md' : 'max-w-sm'} overflow-hidden rounded-2xl border border-gray-200/10 dark:border-gray-800 bg-[#0d111a] p-4 text-center animate-in fade-in-0 zoom-in-95 duration-300 shadow-xl`}>
      {/* Top red accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500/40" />

      {/* Red Alert Icon */}
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
        <ShieldAlert className="h-6 w-6 text-red-500" />
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold tracking-tight text-red-500 mb-2">
        Account Suspended
      </h1>
      <p className="text-gray-400 text-xs mb-5 leading-relaxed">
        Your access to the platform has been restricted by an administrator.
      </p>

      {/* Info Panel */}
      <div className="rounded-xl bg-[#07090e] border border-gray-800/80 p-4 text-left space-y-3 mb-6">
        <div>
          <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-0.5">
            Reason
          </span>
          <p className="text-xs text-gray-300 font-medium leading-relaxed">
            {user.ban_reason || 'Violation of platform rules.'}
          </p>
        </div>

        <div className="border-t border-gray-800/50 pt-2.5">
          <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
            Time Remaining
          </span>
          <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold font-mono">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>
              {isIndefinite ? (
                'Indefinite / Permanent Ban'
              ) : timeLeftSeconds !== null ? (
                formatTimeLeft(timeLeftSeconds)
              ) : (
                'Loading...'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Button */}
      <Button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold h-10 border border-red-500/20 transition-colors text-xs"
      >
        <LogOut className="h-4 w-4" />
        Log Out of Account
      </Button>

      {/* Footer Text */}
      <p className="text-[10px] text-gray-500 mt-5 leading-relaxed">
        If you believe this is an error, please reach out to the organizers on the Discord server.
      </p>
    </div>
  )

  if (variant === 'card') {
    return (
      <div className="w-full flex items-center justify-center py-6 select-none caret-transparent">
        {renderContent(true)}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07090e]/95 p-4 backdrop-blur-sm select-none caret-transparent">
      {renderContent(false)}
    </div>
  )
}
