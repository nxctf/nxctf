"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/shared/contexts/AuthContext'
import {
  deleteSolver,
  getSolversAll,
  getSolversByChallengeTitle,
  getSolversByUsername,
  isAdmin,
} from '../lib'
import type { PendingDeleteDetail, SolverRow } from '../types'

export function useAdminSolversData() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [isAdminUser, setIsAdminUser] = useState(false)
  const [solvers, setSolvers] = useState<SolverRow[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [pendingDeleteDetail, setPendingDeleteDetail] = useState<PendingDeleteDetail>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSolvers = useCallback(async (startOffset = 0) => {
    try {
      if (startOffset > 0) setLoadingMore(true)
      const data = await getSolversAll(100, startOffset)
      setSolvers((prev) => (startOffset === 0 ? data : [...prev, ...data]))
      setOffset(startOffset + 100)
      setHasMore(data.length === 100)
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch solvers')
    } finally {
      setLoadingMore(false)
    }
  }, [])

  const searchSolvers = useCallback(async () => {
    const keyword = searchQuery.trim()
    if (!keyword) {
      await fetchSolvers(0)
      return
    }

    setSearching(true)
    try {
      const [userResults, challengeResults] = await Promise.all([
        getSolversByUsername(keyword),
        getSolversByChallengeTitle(keyword),
      ])
      const combined = [...userResults, ...challengeResults]
      const unique = combined.filter(
        (item, index, self) => index === self.findIndex((t) => t.solve_id === item.solve_id),
      )
      setSolvers(unique)
      setHasMore(false)
    } catch (err) {
      toast.error('Failed to search solvers')
      console.error(err)
    } finally {
      setSearching(false)
    }
  }, [fetchSolvers, searchQuery])

  const resetSearch = useCallback(async () => {
    setSearchQuery('')
    await fetchSolvers(0)
  }, [fetchSolvers])

  const askDelete = useCallback((id: string) => {
    const solver = solvers.find((s) => s.solve_id === id)
    setPendingDelete(id)
    if (solver) {
      setPendingDeleteDetail({ username: solver.username, challenge_title: solver.challenge_title })
    } else {
      setPendingDeleteDetail(null)
    }
    setConfirmOpen(true)
  }, [solvers])

  const doDelete = useCallback(async (id: string) => {
    try {
      await deleteSolver(id)
      setSolvers((prev) => prev.filter((s) => s.solve_id !== id))
      toast.success('Solver deleted successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete solver')
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initSolversData = async () => {
      if (authLoading) return

      if (!user) {
        router.push('/challenges')
        return
      }

      const adminCheck = await isAdmin()
      if (!mounted) return
      setIsAdminUser(adminCheck)
      if (!adminCheck) {
        router.push('/challenges')
        return
      }

      await fetchSolvers(0)
      if (!mounted) return
      setIsLoading(false)
    }

    initSolversData()
    return () => {
      mounted = false
    }
  }, [authLoading, user, router, fetchSolvers])

  return {
    user,
    authLoading,
    isLoading,
    isAdminUser,
    solvers,
    offset,
    hasMore,
    loadingMore,
    searchQuery,
    setSearchQuery,
    searching,
    confirmOpen,
    setConfirmOpen,
    pendingDelete,
    setPendingDelete,
    pendingDeleteDetail,
    setPendingDeleteDetail,
    fetchSolvers,
    searchSolvers,
    resetSearch,
    askDelete,
    doDelete,
  }
}

