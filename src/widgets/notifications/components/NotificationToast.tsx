'use client'

import { Bell } from 'lucide-react'

type NotificationToastProps = {
  solveNotif: { username: string; challenge: string } | null
  notifToast: { title: string; message: string } | null
  onDismissSolve: () => void
  onDismissToast: () => void
}

export default function NotificationToast({
  solveNotif,
  notifToast,
  onDismissSolve,
  onDismissToast,
}: NotificationToastProps) {
  const notifVisible = !!solveNotif
  const notifToastVisible = !!notifToast

  return (
    <>
      {notifVisible && solveNotif && (
        <div className="fixed top-16 right-2 z-[5000] flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in-left" style={{ minWidth: 220, maxWidth: 350 }}>
          <svg className="mr-2" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          <span className="flex-1 min-w-0" aria-label={`${solveNotif.username} just solved ${solveNotif.challenge}`}>
            <div
              className="font-semibold truncate"
              title={solveNotif.username}
            >
              {solveNotif.username}
            </div>
            <div
              className="text-sm opacity-95 break-words truncate"
              title={`just solved ${solveNotif.challenge}`}
            >
              just solved <b className="font-semibold">{solveNotif.challenge}</b>!
            </div>
          </span>
          <button
            onClick={onDismissSolve}
            className="ml-1 rounded-full p-1 hover:bg-blue-500/60 transition-colors"
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      {notifToastVisible && notifToast && (
        <div className="fixed top-16 right-2 z-[5000] flex items-start gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg border border-gray-700 animate-slide-in-left max-w-[92vw]" style={{ minWidth: 240, maxWidth: 420 }}>
          <div className="mt-0.5">
            <Bell size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{notifToast.title}</div>
            <div className="text-xs text-gray-300 line-clamp-2 break-words">{notifToast.message}</div>
          </div>
          <button
            onClick={onDismissToast}
            className="ml-1 rounded-full p-1 hover:bg-white/10 transition-colors"
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
