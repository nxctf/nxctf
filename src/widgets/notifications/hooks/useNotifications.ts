'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import APP from '@/config'
import { ChallengeService } from '@/shared/lib/challenges'
import {
  getSolveSoundEnabledSetting,
  setSolveSoundEnabledSetting,
} from '@/shared/lib/settings'
import {
  getNotifSeenIds,
  addNotifSeenIds,
} from '@/lib/storage/user-state'
import { useAuth } from '@/shared/contexts/AuthContext'

export function useNotifications() {
  const { user } = useAuth()

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifUnreadCount, setNotifUnreadCount] = useState(0)
  const [notifItems, setNotifItems] = useState<Array<{ id: string; title: string; message: string; level: string; created_at: string }>>([])

  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifLevel, setNotifLevel] = useState<'info' | 'info_platform' | 'info_challenges'>('info')

  const [solveNotif, setSolveNotif] = useState<{ username: string; challenge: string } | null>(null)
  const [notifToast, setNotifToast] = useState<{ title: string; message: string } | null>(null)

  const notifTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notifToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const notifButtonRef = useRef<HTMLButtonElement>(null)

  const [solveSoundEnabled, setSolveSoundEnabled] = useState(true)

  const mergeNotifications = useCallback((
    existing: Array<{ id: string; title: string; message: string; level: string; created_at: string }>,
    incoming: Array<{ id: string; title: string; message: string; level: string; created_at: string }>
  ) => {
    const byId = new Map<string, { id: string; title: string; message: string; level: string; created_at: string }>()
    for (const n of existing || []) byId.set(String(n.id), n)
    for (const n of incoming || []) byId.set(String(n.id), n)
    const merged = Array.from(byId.values())
    merged.sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0
      const tb = b.created_at ? Date.parse(b.created_at) : 0
      return tb - ta
    })
    return merged
  }, [])

  const getSeenNotifIds = useCallback(() => new Set<string>(getNotifSeenIds(user?.id || 'anon')), [user?.id])

  const markNotificationsSeen = useCallback((ids: string[]) => {
    addNotifSeenIds(user?.id || 'anon', ids)
  }, [user?.id])

  const markAllNotificationsRead = useCallback(async () => {
    const items = await ChallengeService.getNotifications(50, 0)
    if (items && items.length > 0) {
      markNotificationsSeen(items.map((n: any) => n.id))
    }
    setNotifUnreadCount(0)
  }, [markNotificationsSeen])

  const openNotifPanel = useCallback(async () => {
    setNotifOpen((v) => !v)
    if (!notifOpen && user) {
      setNotifLoading(true)
      const items = await ChallengeService.getNotifications(30, 0)
      setNotifItems((prev) => mergeNotifications(prev, (items || []) as any))
      setNotifLoading(false)
    }
  }, [notifOpen, user, mergeNotifications])

  const handleSendNotif = useCallback(async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return
    try {
      await ChallengeService.createNotification(notifTitle.trim(), notifMessage.trim(), notifLevel)
      setNotifTitle('')
      setNotifMessage('')
    } catch (err) {
      console.warn('Failed to create notification', err)
    }
  }, [notifTitle, notifMessage, notifLevel])

  const handleDeleteNotif = useCallback(async (id: string) => {
    try {
      await ChallengeService.deleteNotification(id)
      setNotifItems(prev => prev.filter(n => n.id !== id))
      const seen = getSeenNotifIds()
      if (!seen.has(id)) {
        setNotifUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.warn('Failed to delete notification', err)
    }
  }, [getSeenNotifIds])

  const dismissSolveNotif = useCallback(() => {
    setSolveNotif(null)
    if (notifTimeout.current) {
      clearTimeout(notifTimeout.current)
      notifTimeout.current = null
    }
  }, [])

  const dismissNotifToast = useCallback(() => {
    setNotifToast(null)
    if (notifToastTimeout.current) {
      clearTimeout(notifToastTimeout.current)
      notifToastTimeout.current = null
    }
  }, [])

  const isNotifRead = useCallback((id: string) => {
    const seen = getSeenNotifIds()
    return seen.has(id)
  }, [getSeenNotifIds])

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'info_platform':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
      case 'info_challenges':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    }
  }

  // Load notification sound setting
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setSolveSoundEnabled(getSolveSoundEnabledSetting())
    } catch { }
  }, [])

  // Persist notification sound setting
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setSolveSoundEnabledSetting(solveSoundEnabled)
    } catch { }
  }, [solveSoundEnabled])

  // Real-time notifications subscription
  useEffect(() => {
    if (!user) return
    const unsubscribe = ChallengeService.subscribeToNotifications((payload) => {
      const id = payload.id || `realtime-${payload.created_at}-${payload.title}`
      setNotifItems(prev => ([
        {
          id,
          title: payload.title,
          message: payload.message,
          level: payload.level,
          created_at: payload.created_at,
        },
        ...prev,
      ]))

      setNotifToast({ title: payload.title, message: payload.message })
      if (notifToastTimeout.current) clearTimeout(notifToastTimeout.current)
      notifToastTimeout.current = setTimeout(() => setNotifToast(null), 8000)

      try {
        const audio = new Audio('/sounds/notif.mp3')
        audio.volume = 0.5
        audio.play()
      } catch { }

      const seen = getSeenNotifIds()
      if (!seen.has(id)) {
        setNotifUnreadCount(prev => prev + 1)
      }
    })
    return () => {
      unsubscribe()
    }
  }, [user, getSeenNotifIds])

  // Initial unread count fetch
  useEffect(() => {
    if (!user) {
      setNotifUnreadCount(0)
      return
    }
    ; (async () => {
      const items = await ChallengeService.getNotifications(50, 0)
      const seen = getSeenNotifIds()
      const unread = (items || []).filter((n: any) => !seen.has(n.id)).length
      setNotifUnreadCount(unread)
    })()
  }, [user, getSeenNotifIds])

  // Real-time solves subscription
  useEffect(() => {
    if (!user || !APP.notifSolves) return;
    const unsubscribe = ChallengeService.subscribeToSolves(({ username, challenge }) => {
      setSolveNotif({ username, challenge })
      if (solveSoundEnabled && username !== user.username) {
        try {
          const audio = new Audio('/sounds/notif_solves.mp3')
          audio.volume = 0.5
          audio.play()
        } catch { }
      }
      if (notifTimeout.current) clearTimeout(notifTimeout.current)
      notifTimeout.current = setTimeout(() => setSolveNotif(null), 12000)
    })
    return () => {
      unsubscribe()
      if (notifTimeout.current) clearTimeout(notifTimeout.current)
    }
  }, [user, solveSoundEnabled])

  return {
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
  }
}
