export const CHALLENGE_LAYOUT_MODES = {
  GROUPED: 'grouped',
  CATEGORY_COMPACT: 'category-compact',
  COMPACT: 'compact',
} as const

export type ChallengeLayoutMode =
  (typeof CHALLENGE_LAYOUT_MODES)[keyof typeof CHALLENGE_LAYOUT_MODES]

export function isChallengeLayoutMode(value: unknown): value is ChallengeLayoutMode {
  return Object.values(CHALLENGE_LAYOUT_MODES).includes(value as ChallengeLayoutMode)
}

export function getNextChallengeLayoutMode(layoutMode: ChallengeLayoutMode): ChallengeLayoutMode {
  if (layoutMode === CHALLENGE_LAYOUT_MODES.GROUPED) {
    return CHALLENGE_LAYOUT_MODES.CATEGORY_COMPACT
  }

  if (layoutMode === CHALLENGE_LAYOUT_MODES.CATEGORY_COMPACT) {
    return CHALLENGE_LAYOUT_MODES.COMPACT
  }

  return CHALLENGE_LAYOUT_MODES.GROUPED
}
