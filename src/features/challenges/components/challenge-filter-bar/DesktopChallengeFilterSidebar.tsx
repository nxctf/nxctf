'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, EyeOff, Flag, Gauge, Layers, LayoutGrid, ListChecks, ListFilter, MapPin, Search, ServerCog, X, Shield } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { createPortal } from 'react-dom'
import type { ElementType } from 'react'
import APP from '@/config'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import { cn } from '@/shared/lib/utils'
import { FilterSelect } from '@/shared/ui'
import {
  SURFACE_FILTER_ITEM_ACTIVE_CLASS,
  SURFACE_FILTER_ITEM_CLASS,
} from '@/shared/styles'
import {
  getCategoryDetails,
  getCategoryIcon,
  getSortedFilterValues,
} from '../../lib'
import type { ChallengeFilterState } from '../../types'
import type { ChallengeStats } from '../../hooks/useChallengeStats'
type DesktopChallengeFilterSidebarProps = {
  filters: ChallengeFilterState
  categories: string[]
  difficulties: string[]
  onFilterChange: (filters: any) => void
  stats?: ChallengeStats | null
}

export default function DesktopChallengeFilterSidebar({
  filters,
  categories,
  difficulties,
  onFilterChange,
  stats,
}: DesktopChallengeFilterSidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const { categories: dbCategories } = useCategories()
  const categoryOrder = dbCategories.map((c) => c.name)
  const difficultyOrder = Object.keys(APP.difficultyStyles)
  const selectedCategory = filters.category || 'all'
  const selectedDifficulty = filters.difficulty || 'all'
  const difficultyActive = selectedDifficulty !== 'all'
  const searchQuery = String(filters.search || '').trim()
  const searchTitle = searchQuery
    ? `Search: ${searchQuery}. Click to edit search.`
    : 'Search challenges'

  const selectedStatus = filters.status || 'all'
  const statusActive = selectedStatus !== 'all'
  const StatusIcon = selectedStatus === 'solved' ? CheckCircle2 : selectedStatus === 'unsolved' ? EyeOff : ListFilter

  const selectedFeature = filters.feature || 'N'
  const featureActive = selectedFeature !== 'N'
  const FeatureIcon = selectedFeature === 'T' ? ListChecks : selectedFeature === 'S' ? ServerCog : selectedFeature === 'F' ? Flag : selectedFeature === 'G' ? MapPin : Layers

  const { sortedCategories, sortedDifficulties } = getSortedFilterValues({
    categories,
    difficulties,
    categoryOrder,
    difficultyOrder,
  })

  useEffect(() => {
    const handleSearchOpen = () => setSearchOpen(true)

    document.addEventListener('challenge-search-open', handleSearchOpen)
    return () => document.removeEventListener('challenge-search-open', handleSearchOpen)
  }, [])

  const scrollToChallengeFilter = () => {
    const anchor = document.querySelector<HTMLElement>('[data-tour="challenge-filter-bar"]')
    if (!anchor) return

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const top = anchor.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
      })
    })
  }

  const handleCategoryChange = (category: string) => {
    onFilterChange({ ...filters, category })
    scrollToChallengeFilter()
  }

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status })
    scrollToChallengeFilter()
  }

  const handleDifficultyChange = (difficulty: string) => {
    onFilterChange({ ...filters, difficulty })
    scrollToChallengeFilter()
  }

  const handleFeatureChange = (feature: string) => {
    onFilterChange({ ...filters, feature })
    scrollToChallengeFilter()
  }

  return (
    <>
      <aside
        data-tour="challenge-sidebar-filters"
        className="relative z-20 hidden max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden xl:block scroll-hidden pr-1 rounded-2xl"
      >
        <div className="flex w-[176px] flex-col gap-1.5 rounded-2xl border border-blue-500/20 bg-white/60 p-2 shadow-sm shadow-blue-500/5 backdrop-blur-md dark:border-blue-500/10 dark:bg-gray-900/60">
          <div className="flex h-9 w-full items-center justify-between rounded-xl border border-gray-200/80 bg-white/70 px-3 text-xs font-semibold shadow-sm backdrop-blur-md transition-all dark:border-gray-700/80 dark:bg-[#111622]/80">
            {stats == null || stats.total === 0 ? (
              <span className="w-full text-center tabular-nums text-gray-400 dark:text-gray-500">N/A</span>
            ) : (
              <>
                {stats.solved > 0 && stats.rank ? (
                  <span className="tabular-nums text-gray-700 dark:text-gray-200">#{stats.rank}</span>
                ) : (
                  <span className="tabular-nums text-gray-400 dark:text-gray-500">N/A</span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                    {stats.solved}/{stats.total}
                  </span>
                  <Flag size={13} strokeWidth={2.5} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            data-tour="challenge-sidebar-search-filter"
            onClick={() => setSearchOpen(true)}
            title={searchTitle}
            aria-label={searchTitle}
            className={iconButtonClass(Boolean(searchQuery))}
          >
            <Search size={19} />
            <span className={searchQuery ? 'truncate normal-case' : 'truncate'}>
              {searchQuery || 'Search'}
            </span>
          </button>

          <div data-tour="challenge-sidebar-status-filter" className="w-full">
            <FilterSelect
              value={selectedStatus}
              onChange={handleStatusChange}
              placeholder="Status"
              active={statusActive}
              clearable={false}
              className="w-full sm:w-full"
              triggerClassName={cn(
                "px-3 text-xs font-semibold h-9 rounded-xl border transition focus:ring-2 focus:ring-blue-500/30",
                statusActive ? SURFACE_FILTER_ITEM_ACTIVE_CLASS : SURFACE_FILTER_ITEM_CLASS
              )}
              icon={
                <StatusIcon
                  size={14}
                  className={statusActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}
                />
              }
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'unsolved', label: 'Unsolved' },
                { value: 'solved', label: 'Solved' },
              ]}
            />
          </div>

          <div data-tour="challenge-sidebar-feature-filter" className="w-full">
            <FilterSelect
              value={selectedFeature}
              onChange={handleFeatureChange}
              placeholder="Feature"
              active={featureActive}
              clearable={false}
              className="w-full sm:w-full"
              triggerClassName={cn(
                "px-3 text-xs font-semibold h-9 rounded-xl border transition focus:ring-2 focus:ring-blue-500/30",
                featureActive ? SURFACE_FILTER_ITEM_ACTIVE_CLASS : SURFACE_FILTER_ITEM_CLASS
              )}
              icon={
                <FeatureIcon
                  size={14}
                  className={featureActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}
                />
              }
              options={[
                { value: 'N', label: 'All Features' },
                { value: 'T', label: 'Tasks' },
                { value: 'S', label: 'Services' },
                { value: 'F', label: 'Placeholder' },
                { value: 'G', label: 'Location' },
              ]}
            />
          </div>

          <div data-tour="challenge-sidebar-difficulty-filter" className="w-full">
            <FilterSelect
              value={selectedDifficulty}
              onChange={handleDifficultyChange}
              placeholder="Difficulty"
              active={difficultyActive}
              clearable={false}
              className="w-full sm:w-full"
              triggerClassName={cn(
                "px-3 text-xs font-semibold h-9 rounded-xl border transition focus:ring-2 focus:ring-blue-500/30",
                difficultyActive ? SURFACE_FILTER_ITEM_ACTIVE_CLASS : SURFACE_FILTER_ITEM_CLASS
              )}
              icon={
                <Gauge
                  size={14}
                  className={difficultyActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}
                />
              }
              options={[
                { value: 'all', label: 'All Difficulties' },
                ...sortedDifficulties.map((difficulty) => ({
                  value: difficulty,
                  label: difficulty,
                })),
              ]}
            />
          </div>

          <div className="h-px w-full bg-gray-200 dark:bg-gray-800" />

          <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Categories
          </div>

          <div className="flex flex-col gap-2">
            <CategoryButton
              label="All Categories"
              active={selectedCategory === 'all'}
              icon={LayoutGrid}
              iconClassName="text-current"
              onClick={() => handleCategoryChange('all')}
            />

            {sortedCategories.map((category) => {
              const dbCat = dbCategories.find((c) => c.name === category)
              const CategoryIcon = dbCat ? ((LucideIcons as any)[dbCat.icon] || Shield) : getCategoryIcon(category)
              const color = dbCat ? `text-${dbCat.color}-500` : getCategoryDetails(category).color

              return (
                <CategoryButton
                  key={category}
                  label={category}
                  active={selectedCategory === category}
                  icon={CategoryIcon}
                  iconClassName={color}
                  onClick={() => handleCategoryChange(category)}
                />
              )
            })}
          </div>
        </div>
      </aside>

      {searchOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[999] hidden items-start justify-center bg-gray-950/40 px-4 pt-28 backdrop-blur-sm xl:flex"
          onClick={() => setSearchOpen(false)}
        >
          <form
            className="relative w-full max-w-xl rounded-2xl border border-blue-500/20 bg-white/95 p-3 shadow-2xl shadow-blue-500/10 dark:border-blue-500/10 dark:bg-gray-950/95"
            onSubmit={(event) => {
              event.preventDefault()
              setSearchOpen(false)
              scrollToChallengeFilter()
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Search
              size={18}
              className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <label htmlFor="desktop-sidebar-search" className="sr-only">
              Search challenges
            </label>
            <input
              id="desktop-sidebar-search"
              type="text"
              value={filters.search}
              onChange={(event) => onFilterChange({ ...filters, search: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setSearchOpen(false)
              }}
              placeholder="Search challenge..."
              autoFocus
              className="h-12 w-full rounded-xl border border-gray-200 bg-white/80 pl-11 pr-12 text-base font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-800 dark:bg-gray-900/80 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              title="Close search"
              aria-label="Close search"
              className="absolute right-5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <X size={17} />
            </button>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}

function iconButtonClass(active: boolean) {
  return `relative inline-flex h-9 w-full items-center gap-2 rounded-xl border px-3 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${active
    ? SURFACE_FILTER_ITEM_ACTIVE_CLASS
    : SURFACE_FILTER_ITEM_CLASS
    }`
}

type CategoryButtonProps = {
  label: string
  active: boolean
  icon: ElementType
  iconClassName: string
  onClick: () => void
}

function CategoryButton({
  label,
  active,
  icon: Icon,
  iconClassName,
  onClick,
}: CategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={iconButtonClass(active)}
      title={`Filter by ${label}`}
      aria-label={`Filter by ${label}`}
    >
      <Icon size={19} className={`shrink-0 ${active ? 'text-white' : iconClassName}`} />
      <span className="truncate">{label}</span>
    </button>
  )
}
