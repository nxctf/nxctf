"use client"

import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import APP from '@/config'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import { getCategoryParent, isCategoryMatch } from '@/features/challenges/lib/challenge-utils'
import {
  DEFAULT_EVENT_FILTERS,
  getChallengesLite,
  setChallengesEvent,
} from '../lib'
import type { ChallengeLite, FilterState } from '../types'

export function useAdminEventBulkChallenges() {
  const { categories: dbCategories } = useCategories()
  const [challenges, setChallenges] = useState<ChallengeLite[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkEventId, setBulkEventId] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_EVENT_FILTERS)

  const loadChallenges = useCallback(async () => {
    const data = await getChallengesLite(true)
    setChallenges(data)
  }, [])

  const filteredChallenges = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return challenges.filter((c) => {
      const searchableText = `${c.title || ''} ${c.description || ''}`.toLowerCase()
      if (q && !searchableText.includes(q)) return false
      if (!isCategoryMatch(c.category, filters.category)) return false
      if (filters.difficulty !== 'all' && c.difficulty !== filters.difficulty) return false

      if (filters.sourceEventId === 'main' && c.event_id) return false
      if (filters.sourceEventId !== 'all' && filters.sourceEventId !== 'main' && c.event_id !== filters.sourceEventId) return false

      if (filters.visibility === 'active' && !c.is_active) return false
      if (filters.visibility === 'inactive' && c.is_active) return false
      if (filters.visibility === 'maintenance' && !c.is_maintenance) return false

      const hasQuestions = !!c.has_questions
      const hasServices = Array.isArray(c.services) && c.services.length > 0
      if (filters.service === 'services' && !hasServices) return false
      if (filters.service === 'tasks' && !hasQuestions) return false
      if (filters.service === 'placeholder' && (hasServices || hasQuestions)) return false

      return true
    }).sort((a, b) => {
      const sortBy = filters.sortBy || 'points_desc'
      if (sortBy === 'points_asc') return (a.points || 0) - (b.points || 0)
      if (sortBy === 'difficulty_asc') return String(a.difficulty || '').localeCompare(String(b.difficulty || ''))
      if (sortBy === 'difficulty_desc') return String(b.difficulty || '').localeCompare(String(a.difficulty || ''))
      if (sortBy === 'title_asc') return String(a.title || '').localeCompare(String(b.title || ''))
      if (sortBy === 'title_desc') return String(b.title || '').localeCompare(String(a.title || ''))
      return (b.points || 0) - (a.points || 0)
    })
  }, [filters, challenges])

  const allCategories = useMemo(
    () => Array.from(new Set(challenges.map((c) => getCategoryParent(c.category)))).filter((c): c is string => Boolean(c)),
    [challenges],
  )
  const categories = useMemo(() => {
    const preferredOrder = dbCategories.map((c) => c.name)
    const matchedCategorySet = new Set<string>()
    return [
      ...preferredOrder.flatMap((p) => {
        const pLower = p.toLowerCase()
        const found = allCategories.find((c) => c.toLowerCase().includes(pLower) || pLower.includes(c.toLowerCase()))
        if (found && !matchedCategorySet.has(found)) {
          matchedCategorySet.add(found)
          return found
        }
        return [] as string[]
      }),
      ...allCategories.filter((c) => !matchedCategorySet.has(c)).sort(),
    ]
  }, [allCategories, dbCategories])
  const difficulties = useMemo(
    () => Array.from(new Set(challenges.map((c) => c.difficulty))).filter((d): d is string => Boolean(d)).sort(),
    [challenges],
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])
  const selectAllFiltered = useCallback(() => {
    setSelectedIds(filteredChallenges.map((c) => c.id))
  }, [filteredChallenges])
  const clearSelection = useCallback(() => setSelectedIds([]), [])

  const handleBulkAssign = useCallback(async () => {
    if (!bulkEventId) {
      toast.error('Select an event first')
      return
    }
    if (selectedIds.length === 0) {
      toast.error('No challenges selected')
      return
    }
    setBulkSubmitting(true)
    try {
      await setChallengesEvent(bulkEventId, selectedIds)
      await loadChallenges()
      clearSelection()
      toast.success('Challenges assigned to event')
    } catch (err) {
      console.error(err)
      toast.error('Failed to assign challenges')
    } finally {
      setBulkSubmitting(false)
    }
  }, [bulkEventId, selectedIds, loadChallenges, clearSelection])

  const handleBulkRemove = useCallback(async () => {
    if (selectedIds.length === 0) {
      toast.error('No challenges selected')
      return
    }
    setBulkSubmitting(true)
    try {
      await setChallengesEvent(null, selectedIds)
      await loadChallenges()
      clearSelection()
      toast.success('Challenges moved to Main Event')
    } catch (err) {
      console.error(err)
      toast.error('Failed to remove event from challenges')
    } finally {
      setBulkSubmitting(false)
    }
  }, [selectedIds, loadChallenges, clearSelection])

  return {
    loadChallenges,
    filters,
    setFilters,
    categories,
    difficulties,
    selectAllFiltered,
    clearSelection,
    bulkEventId,
    setBulkEventId,
    handleBulkAssign,
    handleBulkRemove,
    bulkSubmitting,
    filteredChallenges,
    selectedIds,
    toggleSelect,
  }
}
