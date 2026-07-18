'use client'

import { useDeferredValue, useMemo } from 'react'
import { useCategories } from '@/shared/contexts/CategoriesContext'
import APP from '@/config'
import type { ChallengeWithSolve } from '@/shared/types'
import {
  buildChallengeFilterOptions,
  filterChallengesByState,
  getDifficultyOrder,
  sortAndGroupChallenges,
} from '../lib'
import type {
  ChallengeEventFilterItem,
  ChallengeFilterSettings,
  ChallengeFilterState,
  ChallengeSortMode,
  EventSelectorValue,
} from '../types'

type UseFilteredChallengesOptions = {
  challenges: ChallengeWithSolve[]
  events: ChallengeEventFilterItem[]
  eventId: EventSelectorValue
  filters: ChallengeFilterState
  filterSettings: ChallengeFilterSettings
  sortMode: ChallengeSortMode
}

export function useFilteredChallenges({
  challenges,
  events,
  eventId,
  filters,
  filterSettings,
  sortMode,
}: UseFilteredChallengesOptions) {
  const { categories: dbCategories, subCategories: dbSubCategories } = useCategories()
  const deferredFilters = useDeferredValue(filters)
  const deferredFilterSettings = useDeferredValue(filterSettings)
  const difficultyOrder = useMemo(() => getDifficultyOrder(APP.difficultyStyles), [])
  const preferredOrder = useMemo(() => dbCategories.map(c => c.name), [dbCategories])
  const preferredSubOrder = useMemo(() => dbSubCategories.map(s => s.name), [dbSubCategories])

  const filteredChallenges = useMemo(() => {
    return filterChallengesByState({
      challenges,
      events,
      eventId,
      filters: deferredFilters,
      settings: deferredFilterSettings,
    })
  }, [challenges, deferredFilterSettings, deferredFilters, eventId, events])

  const challengesForFilterOptions = useMemo(() => {
    return filterChallengesByState({
      challenges,
      events,
      eventId,
      filters: {
        status: 'all',
        category: 'all',
        difficulty: 'all',
        search: '',
        feature: 'N',
        excludedEventIds: deferredFilters.excludedEventIds,
      },
      settings: deferredFilterSettings,
    })
  }, [challenges, deferredFilterSettings, eventId, events, deferredFilters.excludedEventIds])

  const { categories, difficulties } = useMemo(() => {
    const options = buildChallengeFilterOptions(challengesForFilterOptions, preferredOrder)
    const selectedCategory = deferredFilters.category
    const selectedDifficulty = deferredFilters.difficulty

    return {
      categories:
        selectedCategory !== 'all' && !options.categories.includes(selectedCategory)
          ? [...options.categories, selectedCategory]
          : options.categories,
      difficulties:
        selectedDifficulty !== 'all' && !options.difficulties.includes(selectedDifficulty)
          ? [...options.difficulties, selectedDifficulty]
          : options.difficulties,
    }
  }, [
    challengesForFilterOptions,
    deferredFilters.category,
    deferredFilters.difficulty,
    preferredOrder,
  ])

  const { sortedFilteredChallenges, grouped, orderedKeys } = useMemo(() => {
    return sortAndGroupChallenges({
      challenges: filteredChallenges,
      sortMode,
      difficultyOrder,
      preferredCategoryOrder: preferredOrder,
      preferredSubCategoryOrder: preferredSubOrder,
      splitSubCategories: deferredFilterSettings.splitSubCategories,
    })
  }, [difficultyOrder, filteredChallenges, preferredOrder, preferredSubOrder, sortMode, deferredFilterSettings.splitSubCategories])

  return {
    filteredChallenges,
    categories,
    difficulties,
    sortedFilteredChallenges,
    grouped,
    orderedKeys,
  }
}
