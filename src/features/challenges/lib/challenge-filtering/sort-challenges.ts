import type { ChallengeWithSolve } from '@/shared/types'
import type { ChallengeSortMode } from '../../types'
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
}: {
  challenges: ChallengeWithSolve[]
  sortMode: ChallengeSortMode
  difficultyOrder: string[]
  preferredCategoryOrder: string[]
}) {
  const sortedFilteredChallenges =
    sortMode === 'newest'
      ? sortChallengesByNewest(challenges)
      : sortChallengesByDisplayPriority(challenges, difficultyOrder)
  const grouped = groupChallengesByCategory(sortedFilteredChallenges)
  const orderedKeys = buildFuzzyOrderedList(preferredCategoryOrder, Object.keys(grouped))

  return {
    sortedFilteredChallenges,
    grouped,
    orderedKeys,
  }
}
