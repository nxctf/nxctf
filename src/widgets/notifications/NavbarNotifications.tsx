'use client'

import React, { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

import NotificationBell from './components/NotificationBell'
import NotificationToast from './components/NotificationToast'
import { useNotifications } from './hooks'

const NotificationPanel = dynamic(
  () => import('./components/NotificationPanel'),
  { ssr: false }
)

type NavbarNotificationsProps = {
  globalAdminStatus: boolean
}

export default function NavbarNotifications({
  globalAdminStatus,
}: NavbarNotificationsProps) {
  const pathname = usePathname()
  const previousPathnameRef = useRef(pathname)
  const [mounted, setMounted] = React.useState(false)

  const {
    notifOpen,
    setNotifOpen,
    notifLoading,
    notifUnreadCount,
    notifItems,
    notifTitle,
    setNotifTitle,
    notifMessage,
    setNotifMessage,
    notifLevel,
    setNotifLevel,
    solveNotif,
    notifToast,
    solveSoundEnabled,
    setSolveSoundEnabled,
    notifPanelRef,
    notifButtonRef,
    markAllNotificationsRead,
    openNotifPanel,
    handleSendNotif,
    handleDeleteNotif,
    dismissSolveNotif,
    dismissNotifToast,
    isNotifRead,
    getLevelBadgeClass,
  } = useNotifications()

  useEffect(() => {
    setMounted(true)
    if (previousPathnameRef.current !== pathname) {
      setNotifOpen(false)
    }

    previousPathnameRef.current = pathname
  }, [pathname, setNotifOpen])

  return (
    <>
      <NotificationBell
        notifButtonRef={notifButtonRef}
        notifOpen={notifOpen}
        unreadCount={notifUnreadCount}
        onToggle={openNotifPanel}
      />

      {mounted && createPortal(
        <>
          <NotificationToast
            solveNotif={solveNotif}
            notifToast={notifToast}
            onDismissSolve={dismissSolveNotif}
            onDismissToast={dismissNotifToast}
          />

          <AnimatePresence>
            {notifOpen && (
              <NotificationPanel
                notifPanelRef={notifPanelRef}
                setNotifOpen={setNotifOpen}
                markAllNotificationsRead={markAllNotificationsRead}
                solveSoundEnabled={solveSoundEnabled}
                setSolveSoundEnabled={setSolveSoundEnabled}
                globalAdminStatus={globalAdminStatus}
                notifTitle={notifTitle}
                setNotifTitle={setNotifTitle}
                notifMessage={notifMessage}
                setNotifMessage={setNotifMessage}
                notifLevel={notifLevel}
                setNotifLevel={setNotifLevel}
                handleSendNotif={handleSendNotif}
                notifLoading={notifLoading}
                notifItems={notifItems}
                isNotifRead={isNotifRead}
                getLevelBadgeClass={getLevelBadgeClass}
                handleDeleteNotif={handleDeleteNotif}
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  )
}
