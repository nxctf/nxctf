'use client'

import { type ElementType, useMemo } from 'react'
import {
  CheckCircle2,
  EyeOff,
  Flag,
  Gauge,
  Layers,
  LayoutGrid,
  ListChecks,
  ListFilter,
  Search,
  ServerCog,
  Sparkles,
} from 'lucide-react'

import APP from '@/config'
import { Badge, Button, Card, CardContent, Input, Switch } from '@/shared/ui'
import { SidebarItem, SidebarSection } from '@/shared/components/sidebar'
import {
  getCategoryDetails,
  getCategoryIcon,
  getFeatureFilterLabel,
  getFeatureFilterTitle,
  getNextFeatureFilterMode,
  getSortedFilterValues,
} from '../../lib'
import type { ChallengeFilters } from '../../contexts/FilterContext'
import type { ChallengeFeatureFilter } from '../../types'
import ChallengePageTabs from '../challenges-page/ChallengePageTabs'

type DesktopChallengeFilterSidebarProps = {
  currentTab: 'challenges' | 'events'
  onTabChange: (value: 'challenges' | 'events') => void
  filters: ChallengeFilters
  categories: string[]
  difficulties: string[]
  onFilterChange: (filters: ChallengeFilters) => void
}

function CategoryButton({
  active,
  icon: Icon,
  iconClassName,
  label,
  onClick,
}: {
  active: boolean
  icon: ElementType
  iconClassName: string
  label: string
  onClick: () => void
}) {
  return (
    <SidebarItem
      onClick={onClick}
      title={`Filter by ${label}`}
      active={active}
      iconNode={<Icon className={`h-4 w-4 shrink-0 ${active ? '' : iconClassName}`} />}
      label={label}
    />
  )
}

export default function DesktopChallengeFilterSidebar({
  currentTab,
  onTabChange,
  filters,
  categories,
  difficulties,
  onFilterChange,
}: DesktopChallengeFilterSidebarProps) {
  const selectedCategory = filters.category || 'all'
  const selectedDifficulty = filters.difficulty || 'all'
  const selectedFeatureMode = (filters.feature || 'N') as ChallengeFeatureFilter
  const searchValue = String(filters.search || '')

  const showUnsolvedOnly = filters.status === 'unsolved'
  const showSolvedOnly = filters.status === 'solved'
  const statusLabel = showSolvedOnly ? 'Solved' : showUnsolvedOnly ? 'Unsolved' : 'All Status'
  const statusTitle = showSolvedOnly
    ? 'Showing solved only. Click to show all statuses.'
    : showUnsolvedOnly
      ? 'Showing unsolved only. Click to show solved only.'
      : 'Showing all statuses. Click to show unsolved only.'

  const StatusIcon = showSolvedOnly ? CheckCircle2 : showUnsolvedOnly ? EyeOff : ListFilter
  const nextFeatureMode = getNextFeatureFilterMode(selectedFeatureMode)
  const featureLabel = getFeatureFilterLabel(selectedFeatureMode)
  const featureTitle = getFeatureFilterTitle(selectedFeatureMode)
  const FeatureIcon = selectedFeatureMode === 'T'
    ? ListChecks
    : selectedFeatureMode === 'S'
      ? ServerCog
      : selectedFeatureMode === 'F'
        ? Flag
        : Layers

  const { sortedCategories, sortedDifficulties } = useMemo(() => {
    const categoryOrder = APP.challengeCategories || []
    const difficultyOrder = Object.keys(APP.difficultyStyles || {})
    return getSortedFilterValues({
      categories,
      difficulties,
      categoryOrder,
      difficultyOrder,
    })
  }, [categories, difficulties])

  return (
    <div data-tour="challenge-sidebar-filters" className="p-3">
      <div className="space-y-3">
        <ChallengePageTabs
          currentTab={currentTab}
          onTabChange={onTabChange}
          showSummary={false}
          className="[&_button]:w-full"
        />

        <div className="space-y-3">
          <Input
            id="challenge-filter-search"
            icon={Search}
            value={searchValue}
            onChange={(event) => onFilterChange({ ...filters, search: event.target.value })}
            placeholder="Search challenges..."
            className="h-10 rounded-xl"
          />

          <SidebarSection title="Filters">
            <SidebarItem
              active={showUnsolvedOnly || showSolvedOnly}
              title={statusTitle}
              onClick={() =>
                onFilterChange({
                  ...filters,
                  status: showSolvedOnly ? 'all' : showUnsolvedOnly ? 'solved' : 'unsolved',
                })
              }
              icon={StatusIcon as ElementType}
              label={statusLabel}
            />

            <SidebarItem
              active={selectedFeatureMode !== 'N'}
              title={featureTitle}
              onClick={() => onFilterChange({ ...filters, feature: nextFeatureMode })}
              icon={FeatureIcon as ElementType}
              label={featureLabel}
            />

            <label htmlFor="desktop-sidebar-difficulty" className="sr-only">Difficulty</label>
            <div className="relative">
              <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="desktop-sidebar-difficulty"
                value={selectedDifficulty}
                onChange={(event) => onFilterChange({ ...filters, difficulty: event.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition hover:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <option value="all">All Difficulties</option>
                {sortedDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>
          </SidebarSection>

          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <span className="text-sm font-medium">Show Solved</span>
            <Switch
              checked={filters.status === 'solved'}
              onCheckedChange={(checked) => onFilterChange({ ...filters, status: checked ? 'solved' : 'all' })}
              aria-label="Toggle solved filter"
            />
          </div>

          <SidebarSection
            title="Categories"
            action={<Badge variant="outline">{sortedCategories.length}</Badge>}
          >

            <CategoryButton
              active={selectedCategory === 'all'}
              icon={LayoutGrid}
              iconClassName="text-current"
              label="All Categories"
              onClick={() => onFilterChange({ ...filters, category: 'all' })}
            />

            {sortedCategories.map((category) => {
              const CategoryIcon = getCategoryIcon(category)
              const { color } = getCategoryDetails(category)

              return (
                <CategoryButton
                  key={category}
                  active={selectedCategory === category}
                  icon={CategoryIcon}
                  iconClassName={color}
                  label={category}
                  onClick={() => onFilterChange({ ...filters, category })}
                />
              )
            })}
          </SidebarSection>

          <Card className="border border-border bg-muted/30 py-2">
            <CardContent className="space-y-2">
              <p className="text-sm font-semibold">Need help?</p>
              <p className="text-xs text-muted-foreground">
                Check challenge rules and onboarding guide before submitting flags.
              </p>
              <Button type="button" size="sm" className="w-full justify-between rounded-lg">
                <span>View Documentation</span>
                <Sparkles className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
