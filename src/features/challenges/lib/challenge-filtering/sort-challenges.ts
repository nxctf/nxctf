import type { ChallengeWithSolve } from '@/shared/types'
import type { ChallengeSortMode } from '../../types'
import APP from '@/config'
import {
  buildFuzzyOrderedList,
  groupChallengesByCategory,
  sortChallengesByDisplayPriority,
  sortChallengesByNewest,
} from '../challenge-utils'

export function sortAndGroupChallenges({
  challenges,
  sortMode,
  difficultyOrder,
  preferredCategoryOrder,
  splitSubCategories = true,
}: {
  challenges: ChallengeWithSolve[]
  sortMode: ChallengeSortMode
  difficultyOrder: string[]
  preferredCategoryOrder: string[]
  splitSubCategories?: boolean
}) {
  const sortedFilteredChallenges =
    sortMode === 'newest'
      ? sortChallengesByNewest(challenges)
      : sortChallengesByDisplayPriority(challenges, difficultyOrder)
  const grouped = groupChallengesByCategory(sortedFilteredChallenges, splitSubCategories)
  const orderedKeys = buildFuzzyOrderedList(preferredCategoryOrder, Object.keys(grouped), APP.challengeSubCategories)

  return {
    sortedFilteredChallenges,
    grouped,
    orderedKeys,
  }
}
