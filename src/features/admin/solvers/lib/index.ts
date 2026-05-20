import { ChallengeService } from '@/shared/lib'
import { AdminService } from '@/features/admin/services/admin.service'
import { formatRelativeDate } from '@/shared/lib'

export const deleteSolver = ChallengeService.deleteSolver.bind(ChallengeService)
export const getSolversAll = ChallengeService.getSolversAll.bind(ChallengeService)
export const getSolversByChallengeTitle = ChallengeService.getSolversByChallengeTitle.bind(ChallengeService)
export const getSolversByUsername = ChallengeService.getSolversByUsername.bind(ChallengeService)
export const isAdmin = AdminService.isAdmin
export { formatRelativeDate }
