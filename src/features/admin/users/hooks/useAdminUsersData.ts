"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/features/auth'
import { useAuth } from '@/shared/contexts/AuthContext'
import { getAdminUsers } from '../services/admin-users.service'
import type { AdminUserRow } from '../types'

export function useAdminUsersData() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [accessReady, setAccessReady] = useState(true)
  const [isAllowed, setIsAllowed] = useState(true)

  // Filters state
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // committed search query
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [sortMode, setSortMode] = useState<'newest' | 'oldest' | 'username_asc' | 'updated_desc' | 'role'>('newest')
  const [pageSize, setPageSize] = useState(100)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'all' | 'banned' | 'active'>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const onRefresh = () => setRefreshTrigger((prev) => prev + 1)

  useEffect(() => {
    let mounted = true

    const checkAccess = async () => {
      if (authLoading) return

      if (!user) {
        setAccessReady(true)
        router.push('/challenges')
        return
      }

      const allowed = await AuthService.isGlobalAdmin()
      if (!mounted) return

      setIsAllowed(allowed)
      setAccessReady(true)
      if (!allowed) {
        router.push('/challenges')
        return
      }
    }

    void checkAccess()

    return () => {
      mounted = false
    }
  }, [authLoading, router, user])

  // Fetch data reactively when query/pagination changes
  useEffect(() => {
    if (!isAllowed) return
    let mounted = true

    const fetchData = async () => {
      setIsDataLoading(true)
      const offset = (page - 1) * pageSize
      const result = await getAdminUsers({
        search: searchQuery,
        role: roleFilter,
        sortBy: sortMode,
        limit: pageSize,
        offset: offset,
        status: statusFilter,
      })

      if (!mounted) return
      setUsers(result.users)
      setTotalCount(result.totalCount)
      setIsLoading(false)
      setIsDataLoading(false)
    }

    void fetchData()

    return () => {
      mounted = false
    }
  }, [isAllowed, searchQuery, roleFilter, sortMode, pageSize, page, statusFilter, refreshTrigger])

  return {
    user,
    authLoading,
    accessReady,
    isAllowed,
    isLoading,
    isDataLoading,
    users,
    totalCount,
    query,
    setQuery,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    sortMode,
    setSortMode,
    pageSize,
    setPageSize,
    page,
    setPage,
    statusFilter,
    setStatusFilter,
    onRefresh,
  }
}
