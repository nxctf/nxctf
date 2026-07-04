'use client'

import APP from '@/config'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import {
  SURFACE_FILTER_ITEM_CLASS,
  SURFACE_FILTER_ITEM_ACTIVE_CLASS,
} from '@/shared/styles'
import { FilterInput } from '@/shared/ui'
import {
  getFeatureFilterLabel,
  getFeatureFilterTitle,
  getNextFeatureFilterMode,
  getSortedFilterValues,
  type ChallengeFilterDirtyState,
} from '../../lib'
import type {
  ChallengeFeatureFilter,
  ChallengeFilterSettings,
  ChallengeFilterState,
  ChallengeSortMode,
} from '../../types'
import FilterSelect from './FilterSelect'
import FilterSettingsMenu from './FilterSettingsMenu'
import LayoutToggle from './LayoutToggle'
import SortToggle from './SortToggle'

type ChallengeFilterControlsProps = {
  filters: ChallengeFilterState
  settings?: ChallengeFilterSettings
  categories: string[]
  difficulties: string[]
  dirtyState: ChallengeFilterDirtyState
  settingsOpen: boolean
  showStatusFilter: boolean
  hideSidebarFiltersOnDesktop?: boolean
  sortMode: ChallengeSortMode
  showSearch?: boolean
  onFilterChange: (filters: any) => void
  onSettingsOpenChange: (open: boolean) => void
  onSettingsChange?: (settings: ChallengeFilterSettings) => void
  onClear: () => void
  onSortModeChange?: () => void
}

export default function ChallengeFilterControls({
  filters,
  settings,
  categories,
  difficulties,
  dirtyState,
  settingsOpen,
  showStatusFilter,
  hideSidebarFiltersOnDesktop = false,
  sortMode,
  showSearch = true,
  onFilterChange,
  onSettingsOpenChange,
  onSettingsChange,
  onClear,
  onSortModeChange,
}: ChallengeFilterControlsProps) {
  const resolvedSettings = {
    hideMaintenance: settings?.hideMaintenance ?? false,
    highlightTeamSolves: settings?.highlightTeamSolves ?? true,
    hideSolvedIntro: settings?.hideSolvedIntro ?? true,
    splitSubCategories: settings?.splitSubCategories ?? true,
  }
  const { categories: dbCategories } = useCategories()
  const categoryOrder = dbCategories.map((c) => c.name)
  const difficultyOrder = Object.keys(APP.difficultyStyles)
  const { sortedCategories, sortedDifficulties } = getSortedFilterValues({
    categories,
    difficulties,
    categoryOrder,
    difficultyOrder,
  })
  const featureMode = filters.feature || 'N'
  const nextFeatureMode = getNextFeatureFilterMode(featureMode as ChallengeFeatureFilter)
  const featureButtonLabel = getFeatureFilterLabel(featureMode as ChallengeFeatureFilter)
  const featureButtonTitle = getFeatureFilterTitle(featureMode as ChallengeFeatureFilter)
  const sidebarFilterClassName = hideSidebarFiltersOnDesktop ? 'xl:hidden' : ''

  return (
    <form
      className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap"
      onSubmit={(event) => event.preventDefault()}
    >
      {showSearch && (
        <>
          <label htmlFor="challenge-filter-search" className="sr-only">Search challenges</label>
          <div data-tour="challenge-search-control" className={`flex-1 min-w-[180px] ${hideSidebarFiltersOnDesktop ? 'xl:hidden' : ''}`}>
            {hideSidebarFiltersOnDesktop ? (
              <FilterInput
                id="challenge-filter-search"
                value={filters.search}
                defaultValue=""
                onChange={(value) => onFilterChange({ ...filters, search: value })}
                placeholder="Search challenge..."
                active={dirtyState.isSearchDirty}
                clearable
                wrapperClassName="xl:hidden"
              />
            ) : (
              <FilterInput
                id="challenge-filter-search"
                value={filters.search}
                defaultValue=""
                onChange={(value) => onFilterChange({ ...filters, search: value })}
                placeholder="Search challenge..."
                active={dirtyState.isSearchDirty}
                clearable
              />
            )}
          </div>
        </>
      )}

      {showStatusFilter && (
        <FilterSelect
          id="status"
          label="Status"
          value={filters.status || 'all'}
          onChange={(value) => onFilterChange({ ...filters, status: value })}
          isDirty={dirtyState.isStatusDirty}
          isActive={Boolean(filters.status && filters.status !== 'all')}
          wrapperClassName={sidebarFilterClassName}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'unsolved', label: 'Unsolved' },
            { value: 'solved', label: 'Solved' },
          ]}
        />
      )}

      <FilterSelect
        id="category"
        label="Category"
        value={filters.category}
        onChange={(value) => onFilterChange({ ...filters, category: value })}
        isDirty={dirtyState.isCategoryDirty}
        isActive={Boolean(filters.category && filters.category !== 'all')}
        wrapperClassName={sidebarFilterClassName}
        options={[
          { value: 'all', label: 'All Categories' },
          ...sortedCategories.map((category) => ({ value: category, label: category })),
        ]}
      />

      <FilterSelect
        id="difficulty"
        label="Difficulty"
        value={filters.difficulty}
        onChange={(value) => onFilterChange({ ...filters, difficulty: value })}
        isDirty={dirtyState.isDifficultyDirty}
        isActive={Boolean(filters.difficulty && filters.difficulty !== 'all')}
        wrapperClassName={sidebarFilterClassName}
        options={[
          { value: 'all', label: 'All Difficulties' },
          ...sortedDifficulties.map((difficulty) => ({ value: difficulty, label: difficulty })),
        ]}
      />

      <div className="flex-none xl:hidden">
        <button
          type="button"
          data-tour="challenge-feature-filter"
          onClick={() => onFilterChange({ ...filters, feature: nextFeatureMode })}
          title={featureButtonTitle}
          aria-label={featureButtonTitle}
          className={`inline-flex h-[38px] min-w-[112px] items-center justify-center rounded-xl px-3 text-xs font-bold transition ${featureMode === 'N'
            ? SURFACE_FILTER_ITEM_CLASS
            : featureMode === 'T'
              ? SURFACE_FILTER_ITEM_ACTIVE_CLASS
              : 'bg-indigo-600 border border-indigo-600 text-white shadow-inner'
            }`}
        >
          <span className="truncate">{featureButtonLabel}</span>
        </button>
      </div>

      <div className="flex-none">
        <button
          type="button"
          onClick={onClear}
          className={`h-8 rounded-lg px-3 text-xs transition ${dirtyState.anyFilterDirty ? `${SURFACE_FILTER_ITEM_ACTIVE_CLASS} font-bold` : `${SURFACE_FILTER_ITEM_CLASS} opacity-80`}`}
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>

      {onSettingsChange && (
        <div className="relative flex-none ml-auto flex items-center gap-2">
          {onSortModeChange && <SortToggle sortMode={sortMode} onToggle={onSortModeChange} />}

          <LayoutToggle />

          <FilterSettingsMenu
            open={settingsOpen}
            settings={resolvedSettings}
            onOpenChange={onSettingsOpenChange}
            onSettingsChange={onSettingsChange}
          />
        </div>
      )}
    </form>
  )
}
