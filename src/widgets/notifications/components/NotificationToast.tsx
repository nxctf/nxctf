import React from 'react'
import { X, Bell, Megaphone, Server, Flag, Skull } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

function getToastIcon(level: string) {
  switch (level) {
    case 'info_challenges':
      return { Icon: Flag, bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', text: 'text-emerald-400', progressColor: 'bg-emerald-500' }
    case 'info_platform':
      return { Icon: Server, bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/20', text: 'text-indigo-400', progressColor: 'bg-indigo-500' }
    case 'info':
      return { Icon: Megaphone, bg: 'bg-orange-500/10', ring: 'ring-orange-500/20', text: 'text-orange-400', progressColor: 'bg-orange-500' }
    default:
      return { Icon: Bell, bg: 'bg-blue-500/10', ring: 'ring-blue-500/20', text: 'text-blue-400', progressColor: 'bg-blue-500' }
  }
}

type NotificationToastProps = {
  solveToasts: Array<{ id: string; username: string; challenge: string; isFirstBlood?: boolean }>
  notifToasts: Array<{ id: string; title: string; message: string; level: string }>
  onDismissSolve: (id: string) => void
  onDismissToast: (id: string) => void
}

export default function NotificationToast({
  solveToasts,
  notifToasts,
  onDismissSolve,
  onDismissToast,
}: NotificationToastProps) {
  // Limit total visible toasts to 3
  const MAX_VISIBLE_TOASTS = 3
  const totalToasts = solveToasts.length + notifToasts.length
  const hasOverflow = totalToasts > MAX_VISIBLE_TOASTS

  // Prioritize showing newest toasts: solve toasts first, then notif toasts
  let remaining = MAX_VISIBLE_TOASTS
  const visibleSolveToasts = solveToasts.slice(0, remaining)
  remaining -= visibleSolveToasts.length
  const visibleNotifToasts = notifToasts.slice(0, Math.max(0, remaining))

  return (
    <div className="fixed top-4 right-4 z-[5000] flex flex-col gap-3 pointer-events-none" style={{ width: '100%', maxWidth: 380 }}>
      {/* Solve notifications */}
      {visibleSolveToasts.map((toast) => (
        toast.isFirstBlood ? (
          <div
            key={toast.id}
            className="pointer-events-auto relative overflow-hidden flex flex-col gap-2 rounded-xl border border-red-500/20 bg-[#0d0e12]/95 px-4 py-3.5 shadow-[0_4px_20px_rgba(220,38,38,0.12)] animate-toast-in animate-blood-shake"
          >
            {/* Top Row: Icon, Badges, Username, Close */}
            <div className="flex items-center gap-2 relative z-10">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/5 border border-red-500/20 text-red-400">
                <Skull size={14} />
              </div>
              <span className="shrink-0 bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded text-[9px] tracking-wider font-mono">FIRST BLOOD</span>
              <span className="truncate text-[13px] text-gray-100 font-semibold">{toast.username}</span>

              <button
                onClick={() => onDismissSolve(toast.id)}
                className="ml-auto shrink-0 rounded p-1 text-gray-500 transition-all hover:bg-white/5 hover:text-gray-300"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>

            {/* Bottom Row: Solve Description (Left Aligned) */}
            <div className="text-[12px] text-gray-400 relative z-10">
              secured first blood on <span className="font-semibold text-red-400">{toast.challenge}</span>
            </div>

            {/* Animated progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-950/40">
              <div className="h-full bg-gradient-to-r from-red-500 to-rose-600 animate-toast-progress-12s" />
            </div>
          </div>
        ) : (
          <div
            key={toast.id}
            className="pointer-events-auto relative overflow-hidden flex flex-col gap-2 rounded-xl border border-blue-500/20 bg-[#090d16]/90 backdrop-blur-md px-4 py-3.5 shadow-[0_0_25px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/10 transition-all hover:border-blue-500/40 animate-toast-in"
          >
            {/* Top Row: Icon, Username, Close */}
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                <Bell size={14} className="text-blue-400" />
              </div>
              <span className="truncate text-[13px] font-bold text-gray-100">{toast.username}</span>

              <button
                onClick={() => onDismissSolve(toast.id)}
                className="ml-auto shrink-0 rounded p-1 text-gray-400 transition-all hover:bg-white/10 hover:text-gray-300"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>

            {/* Bottom Row: Solve Description (Left Aligned) */}
            <div className="text-[12px] text-gray-300 font-medium relative z-10">
              just solved <span className="font-extrabold text-blue-400">{toast.challenge}</span>
            </div>

            {/* Animated progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-950">
              <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-toast-progress-12s" />
            </div>
          </div>
        )
      ))}

      {/* Stacked notification toasts */}
      {visibleNotifToasts.map((toast) => {
        const { Icon, bg, ring, text, progressColor } = getToastIcon(toast.level)
        return (
          <div
            key={toast.id}
            className="pointer-events-auto relative overflow-hidden flex flex-col gap-2 rounded-xl border border-gray-800/80 bg-[#0d1117]/90 backdrop-blur-md px-4 py-3.5 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all hover:border-gray-700 animate-toast-in"
          >
            {/* Top Row: Icon, Title, Close */}
            <div className="flex items-center gap-2.5 relative z-10">
              <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1", bg, ring)}>
                <Icon size={14} className={text} />
              </div>
              <span className="truncate text-[13px] font-bold text-gray-100">{toast.title}</span>

              <button
                onClick={() => onDismissToast(toast.id)}
                className="ml-auto shrink-0 rounded p-1 text-gray-400 transition-all hover:bg-white/10 hover:text-gray-300"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>

            {/* Bottom Row: Description - max 3 lines */}
            {toast.message && (
              <div className="text-[11px] leading-normal text-gray-400 line-clamp-3 whitespace-pre-line break-words relative z-10">
                {toast.message}
              </div>
            )}

            {/* Animated progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-950">
              <div className={cn("h-full", progressColor, "animate-toast-progress-15s")} />
            </div>
          </div>
        )
      })}

      {/* Overflow indicator */}
      {hasOverflow && (
        <div className="pointer-events-none text-center text-[10px] text-gray-500 font-medium tracking-wide">
          +{totalToasts - MAX_VISIBLE_TOASTS} more
        </div>
      )}
    </div>
  )
}
