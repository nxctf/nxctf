import type { ChallengeWithSolve, Event } from '@/shared/types'

export type ChallengesMainTab = 'challenges' | 'events'
export type ChallengeDialogTab = 'challenge' | 'question' | 'solvers'
export type EventSelectorValue = string | null | 'all'
export type ChallengeSortMode = 'default' | 'newest'
export type ChallengeFeatureFilter = 'T' | 'S' | 'F' | 'N'
export type SubChallengeMode = 'none' | 'non_sequential' | 'sequential'

export type SubChallengeQuestion = {
  order_number: number
  question: string
}

export type ChallengeFilterState = {
  status?: 'all' | 'solved' | 'unsolved' | string
  category: string
  difficulty: string
  search: string
  feature?: ChallengeFeatureFilter
}

export type ChallengeEventFilterItem = Pick<
  Event,
  'id' | 'name' | 'start_time' | 'end_time' | 'always_show_challenges' | 'join_mode'
> & {
  isLocked?: boolean
}
export type EnrichedChallengeEvent = Event & { isLocked?: boolean }

export type Solver = {
  username: string
  solvedAt: string
}

export type ChallengeFilterSettings = {
  hideMaintenance: boolean
  highlightTeamSolves: boolean
  hideSolvedIntro: boolean
}

export type FlagFeedback = {
  success: boolean
  message: string
}

export type HintModalState = {
  challenge: ChallengeWithSolve | null
  hintIdx?: number
}

export type KeyedStringMap = Record<string, string>
export type KeyedBooleanMap = Record<string, boolean>
export type KeyedFlagFeedbackMap = Record<string, FlagFeedback | null>
