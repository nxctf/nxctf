import type {
  AdminChallengeEventId,
  AdminChallengeFilterState,
  AdminScope,
  Challenge,
} from '../types'

type ChallengeFeatureFields = {
  has_questions?: boolean
  services?: unknown[]
}

interface GetFilteredAdminChallengesParams {
  challenges: Challenge[]
  adminScope: AdminScope | null
  isGlobalAdmin: boolean
  eventId: AdminChallengeEventId
  filters: AdminChallengeFilterState
  categoryOrder: string[]
}

export function getFilteredAdminChallenges({
  challenges,
  adminScope,
  isGlobalAdmin,
  eventId,
  filters,
  categoryOrder,
}: GetFilteredAdminChallengesParams) {
  const allowedEventSet = new Set(adminScope?.event_ids ?? [])
  const manageable = isGlobalAdmin
    ? challenges
    : challenges.filter(challenge => challenge.event_id && allowedEventSet.has(String(challenge.event_id)))

  return manageable.filter(challenge => {
    if (eventId !== 'all') {
      const matchMain = eventId === null && !challenge.event_id
      const matchEvent = challenge.event_id === eventId
      if (!matchMain && !matchEvent) return false
    }
    if (filters.search && !challenge.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.category !== "all" && challenge.category !== filters.category) return false
    if (filters.difficulty !== "all" && challenge.difficulty !== filters.difficulty) return false

    const featureFields = challenge as Challenge & ChallengeFeatureFields
    const hasQuestions = !!featureFields.has_questions
    const hasServices = Array.isArray(featureFields.services) && featureFields.services.length > 0
    const featureType = hasQuestions && hasServices ? 'TS' : hasQuestions ? 'T' : hasServices ? 'S' : 'N'
    if (filters.feature === 'T' && !(featureType === 'T' || featureType === 'TS')) return false
    if (filters.feature === 'S' && !(featureType === 'S' || featureType === 'TS')) return false
    return true
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const aIdx = categoryOrder.findIndex(category => category.toLowerCase() === (a.category || '').toLowerCase())
    const bIdx = categoryOrder.findIndex(category => category.toLowerCase() === (b.category || '').toLowerCase())
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    return (a.category || '').localeCompare(b.category || '')
  })
}
