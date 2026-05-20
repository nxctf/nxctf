"use client"
import React from 'react'
import {
  CHALLENGE_LAYOUT_MODES,
  type ChallengeLayoutMode,
  isChallengeLayoutMode,
} from '../lib/challenge-layout-modes'

export type ChallengeFilters = {
  status: 'all' | 'solved' | 'unsolved'
  category: string
  difficulty: string
  search: string
  feature: 'T' | 'S' | 'F' | 'N'

}

const STORAGE_KEY = 'nxctf:challengeFilters'

const defaultFilters: ChallengeFilters = {
  status: 'all',
  category: 'all',
  difficulty: 'all',
  search: '',
  feature: 'N'
}

type SortMode = 'default' | 'newest'

type FilterContextValue = {
  filters: ChallengeFilters
  setFilters: (v: ChallengeFilters | ((prev: ChallengeFilters) => ChallengeFilters)) => void
  resetFilters: () => void
  layoutMode: ChallengeLayoutMode
  setLayoutMode: (m: ChallengeLayoutMode | ((prev: ChallengeLayoutMode) => ChallengeLayoutMode)) => void
  sortMode: SortMode
  setSortMode: (m: SortMode | ((prev: SortMode) => SortMode)) => void
}

const FilterContext = React.createContext<FilterContextValue | null>(null)

function readStored(): { filters: ChallengeFilters; layoutMode: ChallengeLayoutMode; sortMode: SortMode } {
  try {
    if (typeof window === 'undefined') return { filters: defaultFilters, layoutMode: CHALLENGE_LAYOUT_MODES.GROUPED, sortMode: 'default' }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { filters: defaultFilters, layoutMode: CHALLENGE_LAYOUT_MODES.GROUPED, sortMode: 'default' }
    const parsed = JSON.parse(raw)
    const storedFeature = parsed?.filters?.feature ?? parsed?.feature
    const normalizedFeature = storedFeature === 'T' || storedFeature === 'S' || storedFeature === 'F' || storedFeature === 'N' ? storedFeature : 'N'
    const normalizedSortMode = parsed.sortMode === 'newest' ? 'newest' : 'default'
    return {
      filters: { ...defaultFilters, ...(parsed.filters || parsed), feature: normalizedFeature },
      layoutMode: isChallengeLayoutMode(parsed.layoutMode)
        ? parsed.layoutMode
        : CHALLENGE_LAYOUT_MODES.GROUPED,
      sortMode: normalizedSortMode
    }
  } catch {
    return { filters: defaultFilters, layoutMode: CHALLENGE_LAYOUT_MODES.GROUPED, sortMode: 'default' }
  }
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const stored = React.useMemo(() => readStored(), [])
  const [filters, setFiltersState] = React.useState<ChallengeFilters>(() => stored.filters)
  const [layoutMode, setLayoutModeState] = React.useState<ChallengeLayoutMode>(() => stored.layoutMode)
  const [sortMode, setSortModeState] = React.useState<SortMode>(() => stored.sortMode)

  const setFilters = React.useCallback((v: any) => {
    setFiltersState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      try {
        const raw = JSON.stringify({ filters: next, layoutMode, sortMode })
        localStorage.setItem(STORAGE_KEY, raw)
      } catch { }
      return next
    })
  }, [layoutMode, sortMode])

  const setLayoutMode = React.useCallback((v: any) => {
    setLayoutModeState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      try {
        const raw = JSON.stringify({ filters, layoutMode: next, sortMode })
        localStorage.setItem(STORAGE_KEY, raw)
      } catch { }
      return next
    })
  }, [filters, sortMode])

  const setSortMode = React.useCallback((v: any) => {
    setSortModeState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      try {
        const raw = JSON.stringify({ filters, layoutMode, sortMode: next })
        localStorage.setItem(STORAGE_KEY, raw)
      } catch { }
      return next
    })
  }, [filters, layoutMode])

  const resetFilters = React.useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { }
    setFiltersState(defaultFilters)
  }, [])

  const value: FilterContextValue = React.useMemo(() => ({ filters, setFilters, resetFilters, layoutMode, setLayoutMode, sortMode, setSortMode }), [filters, setFilters, resetFilters, layoutMode, setLayoutMode, sortMode, setSortMode])

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilterContext() {
  const ctx = React.useContext(FilterContext)
  if (!ctx) throw new Error('useFilterContext must be used within <FilterProvider>')
  return ctx
}

export default FilterProvider
