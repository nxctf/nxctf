"use client"

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import APP from '@/config'
import {
  DEFAULT_EVENT_FILTERS,
  getChallengesLite,
  setChallengesEvent,
} from '../lib'
import type { ChallengeLite, FilterState } from '../types'

export function useAdminEventBulkChallenges() {
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
    const q = filters.search.toLowerCase()
    return challenges.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q)) return false
      if (filters.category !== 'all' && c.category !== filters.category) return false
      if (filters.difficulty !== 'all' && c.difficulty !== filters.difficulty) return false
      const hasQuestions = !!(c as any).has_questions
      const hasServices = Array.isArray((c as any).services) && (c as any).services.length > 0
      const featureType = hasQuestions && hasServices ? 'TS' : hasQuestions ? 'T' : hasServices ? 'S' : 'N'
      if (filters.feature === 'T' && !(featureType === 'T' || featureType === 'TS')) return false
      if (filters.feature === 'S' && !(featureType === 'S' || featureType === 'TS')) return false
      return true
    })
  }, [filters, challenges])

  const allCategories = useMemo(
    () => Array.from(new Set(challenges.map((c) => c.category))).filter((c): c is string => Boolean(c)),
    [challenges],
  )
  const categories = useMemo(() => {
    const preferredOrder = APP.challengeCategories || []
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
  }, [allCategories])
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

