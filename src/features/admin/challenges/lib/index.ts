import { SubChallengesService } from '@/features/challenges/services/sub-challenges.service'
import { SiteInfoService } from '@/features/admin/overview/services/site-info.service'
import { EventService } from '@/features/events/services/event.service'
import { AdminService } from '@/features/admin/services/admin.service'
import { ChallengeService } from '@/shared/lib'

export const addChallenge = ChallengeService.addChallenge.bind(ChallengeService)
export const deleteChallenge = ChallengeService.deleteChallenge.bind(ChallengeService)
export const getChallengeById = ChallengeService.getChallengeById.bind(ChallengeService)
export const getChallengesList = ChallengeService.getChallengesList.bind(ChallengeService)
export const getFlag = ChallengeService.getFlag.bind(ChallengeService)
export const getSolversAll = ChallengeService.getSolversAll.bind(ChallengeService)
export const setChallengeActive = ChallengeService.setChallengeActive.bind(ChallengeService)
export const setChallengeMaintenance = ChallengeService.setChallengeMaintenance.bind(ChallengeService)
export const updateChallenge = ChallengeService.updateChallenge.bind(ChallengeService)

export const addAdminSubChallenge = SubChallengesService.addAdminSubChallenge.bind(SubChallengesService)
export const deleteAdminSubChallenge = SubChallengesService.deleteAdminSubChallenge.bind(SubChallengesService)
export const getAdminSubChallenges = SubChallengesService.getAdminSubChallenges.bind(SubChallengesService)
export const getInfo = SiteInfoService.getInfo.bind(SiteInfoService)
export const getEvents = EventService.getEvents.bind(EventService)
export const getAdminScope = AdminService.getAdminScope.bind(AdminService)

export * from './admin-challenge-filters'
export { formatRelativeDate } from '@/shared/lib'
