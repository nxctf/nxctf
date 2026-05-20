// LocalStorage keys for persisting challenge state
const SELECTED_CHALLENGE_KEY = 'nxctf:selectedChallengeId'

/**
 * Persist selected challenge ID to localStorage
 * Pass null to remove the stored value
 */
export const persistSelectedChallenge = (challengeId: string | null) => {
  try {
    if (challengeId === null) {
      localStorage.removeItem(SELECTED_CHALLENGE_KEY)
    } else {
      localStorage.setItem(SELECTED_CHALLENGE_KEY, challengeId)
    }
  } catch {
    // Silently ignore storage errors
  }
}

/**
 * Retrieve stored challenge ID from localStorage
 * Returns null if no challenge is stored or on error
 */
export const getStoredSelectedChallengeId = (): string | null => {
  try {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(SELECTED_CHALLENGE_KEY)
  } catch {
    return null
  }
}
