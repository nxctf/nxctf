import { ChallengeService } from '@/shared/lib'
export const getChallengesLite = ChallengeService.getChallengesLite.bind(ChallengeService)
import { EventService } from '@/features/events/services/event.service'
import { AdminService } from '@/features/admin/services/admin.service'

export const adminAddEventMember = EventService.adminAddEventMember
export const adminRemoveEventMember = EventService.adminRemoveEventMember
export const addEvent = EventService.addEvent
export const deleteEvent = EventService.deleteEvent
export const getEvents = EventService.getEvents
export const listEventJoinRequests = EventService.listEventJoinRequests
export const listEventMembers = EventService.listEventMembers
export const regenerateEventJoinKey = EventService.regenerateEventJoinKey
export const reviewEventJoinRequest = EventService.reviewEventJoinRequest
export const setChallengesEvent = EventService.setChallengesEvent
export const setEventJoinSettings = EventService.setEventJoinSettings
export const updateEvent = EventService.updateEvent
export const isGlobalAdmin = AdminService.isGlobalAdmin
export const searchUsersByUsername = AdminService.searchUsersByUsername

export type { UserLite } from '@/features/admin/services/admin.service'
export * from './event-form-utils'
