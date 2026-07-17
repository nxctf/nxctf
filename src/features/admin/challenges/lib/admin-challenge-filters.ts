import { isCategoryMatch } from '@/features/challenges/lib/challenge-utils'
import type {
  AdminChallengeEventId,
  AdminChallengeFilterState,
  AdminScope,
  Challenge,
} from '../types'

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
}: GetFilteredAdminChallengesParams): Challenge[] {
  const allowedEventSet = new Set(adminScope?.event_ids ?? [])
  const manageable = isGlobalAdmin
    ? challenges
    : challenges.filter(challenge => challenge.event_id && allowedEventSet.has(String(challenge.event_id)))

  return manageable.filter(challenge => {
    // 1. Event filter
    if (eventId !== 'all') {
      const matchMain = eventId === null && !challenge.event_id
      const matchEvent = challenge.event_id === eventId
      if (!matchMain && !matchEvent) return false
    }

    // 2. Search filter (title and description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const titleMatch = challenge.title.toLowerCase().includes(searchLower)
      const descMatch = challenge.description?.toLowerCase().includes(searchLower)
      if (!titleMatch && !descMatch) return false
    }

    // 3. Category filter
    if (!isCategoryMatch(challenge.category, filters.category)) return false

    // 4. Difficulty filter
    if (filters.difficulty !== "all" && challenge.difficulty !== filters.difficulty) return false

    // 5. Scope filter ('all' | 'main' | 'private' | 'service')
    if (filters.scope !== 'all') {
      const hasEvent = challenge.event_id !== null && challenge.event_id !== undefined
      const hasServices = Array.isArray(challenge.services) && challenge.services.length > 0
      
      if (filters.scope === 'main' && hasEvent) return false
      if (filters.scope === 'private' && !hasEvent) return false
      if (filters.scope === 'service' && !hasServices) return false
    }

    // 6. Visibility filter ('all' | 'active' | 'inactive' | 'maintenance')
    if (filters.visibility !== 'all') {
      if (filters.visibility === 'active' && !challenge.is_active) return false
      if (filters.visibility === 'inactive' && challenge.is_active) return false
      if (filters.visibility === 'maintenance' && !challenge.is_maintenance) return false
    }

    // 7. Service filter ('all' | 'services' | 'placeholder' | 'tasks' | 'geo')
    if (filters.service !== 'all') {
      const hasServices = Array.isArray(challenge.services) && challenge.services.length > 0
      const isPlaceholder = !!challenge.flag_placeholder
      const hasQuestions = !!challenge.has_questions
      const hasGeoFlag = !!(challenge as any).has_geo_flag
      if (filters.service === 'services' && !hasServices) return false
      if (filters.service === 'placeholder' && !isPlaceholder) return false
      if (filters.service === 'tasks' && !hasQuestions) return false
      if (filters.service === 'geo' && !hasGeoFlag) return false
    }

    return true
  }).sort((a, b) => {
    const sortBy = filters.sortBy || 'points_desc'
    
    if (sortBy === 'points_desc') {
      return (b.points || 0) - (a.points || 0)
    }
    if (sortBy === 'points_asc') {
      return (a.points || 0) - (b.points || 0)
    }
    
    if (sortBy === 'difficulty_asc' || sortBy === 'difficulty_desc') {
      const diffOrder: Record<string, number> = { easy: 1, medium: 2, hard: 3, insane: 4 }
      const aVal = diffOrder[(a.difficulty || '').toLowerCase()] || 99
      const bVal = diffOrder[(b.difficulty || '').toLowerCase()] || 99
      return sortBy === 'difficulty_asc' ? aVal - bVal : bVal - aVal
    }
    
    if (sortBy === 'title_asc') {
      return (a.title || '').localeCompare(b.title || '')
    }
    if (sortBy === 'title_desc') {
      return (b.title || '').localeCompare(a.title || '')
    }

    if (sortBy === 'created_at_desc') {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    }
    if (sortBy === 'created_at_asc') {
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    }

    // Default fallback sorting
    if (b.points !== a.points) return (b.points || 0) - (a.points || 0)
    return (a.title || '').localeCompare(b.title || '')
  })
}
