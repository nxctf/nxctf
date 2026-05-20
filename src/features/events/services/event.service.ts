import { supabase } from '@/lib/supabase/client'
import { Event, EventJoinRequestRow, EventJoinSettings, EventMembershipStatus, EventMemberRow } from '@/shared/types'

type EventMutationPayload = {
  name: string
  description?: string | null
  start_time?: string | null
  end_time?: string | null
  always_show_challenges?: boolean | null
  image_url?: string | null
}

type JoinEventResult = { success: boolean; status?: string; message?: string }
type ReviewJoinRequestResult = { success: boolean; status?: 'approved' | 'rejected'; message?: string }

export class EventService {
  static async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Error fetching events:', error)
      return []
    }
    return (data || []) as unknown as Event[]
  }

  static async addEvent(payload: EventMutationPayload): Promise<unknown> {
    const { data, error } = await supabase.rpc('add_event', {
      p_name: payload.name,
      p_description: payload.description ?? '',
      p_start_time: payload.start_time ?? undefined,
      p_end_time: payload.end_time ?? undefined,
      p_always_show_challenges: payload.always_show_challenges ?? false,
      p_image_url: payload.image_url ?? undefined,
    })
    if (error) {
      console.error('Error adding event:', error)
      throw error
    }
    return data
  }

  static async updateEvent(eventId: string, payload: Partial<EventMutationPayload>): Promise<unknown> {
    const { data, error } = await supabase.rpc('update_event', {
      p_event_id: eventId,
      p_name: payload.name ?? undefined,
      p_description: payload.description ?? undefined,
      p_start_time: payload.start_time ?? undefined,
      p_end_time: payload.end_time ?? undefined,
      p_always_show_challenges: payload.always_show_challenges ?? undefined,
      p_image_url: payload.image_url ?? undefined,
    })
    if (error) {
      console.error('Error updating event:', error)
      throw error
    }
    return data
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('delete_event', {
      p_event_id: eventId,
    })
    if (error) {
      console.error('Error deleting event:', error)
      throw error
    }
    return Boolean(data)
  }

  static async setChallengesEvent(eventId: string | null, challengeIds: string[]): Promise<boolean> {
    const { data, error } = await supabase.rpc('set_challenges_event', {
      p_event_id: eventId as string,
      p_challenge_ids: challengeIds,
    })
    if (error) {
      console.error('Error setting challenges event:', error)
      throw error
    }
    return Boolean(data)
  }

  static async getActiveEvents(now: string = new Date().toISOString()): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`start_time.is.null,start_time.lte.${now}`)
      .or(`end_time.is.null,end_time.gte.${now}`)
      .order('start_time', { ascending: true, nullsFirst: true })
    if (error) {
      console.error('Error fetching active events:', error)
      return []
    }
    return (data || []) as unknown as Event[]
  }

  private static eventHasStarted(event: Event, referenceTimeMs: number): boolean {
    if (event.always_show_challenges) return true
    if (!event.start_time) return true
    const startMs = Date.parse(event.start_time)
    if (Number.isNaN(startMs)) return true
    return startMs <= referenceTimeMs
  }

  static filterStartedEvents(events: Event[], referenceTimeMs = Date.now()): Event[] {
    return events.filter((event) => EventService.eventHasStarted(event, referenceTimeMs))
  }

  static async getEventJoinSettings(eventId: string): Promise<EventJoinSettings | null> {
    const { data, error } = await supabase.rpc('get_event_join_settings', {
      p_event_id: eventId,
    })
    if (error) {
      console.error('Error fetching event join settings:', error)
      return null
    }
    return (data as unknown as EventJoinSettings) || null
  }

  static async getMyEventMembership(eventId: string): Promise<EventMembershipStatus | null> {
    const { data, error } = await supabase.rpc('get_my_event_membership', {
      p_event_id: eventId,
    })
    if (error) {
      console.error('Error fetching my event membership:', error)
      return null
    }
    return (data as unknown as EventMembershipStatus) || null
  }

  static async getAllMyEventMemberships(): Promise<EventMembershipStatus[]> {
    const { data, error } = await supabase.rpc('get_all_my_event_memberships')
    if (error) {
      console.error('Error fetching all event memberships:', error)
      return []
    }
    return (data as unknown as EventMembershipStatus[]) || []
  }

  static async joinEvent(
    eventId: string,
    joinKey?: string | null,
    note?: string | null
  ): Promise<JoinEventResult> {
    const { data, error } = await supabase.rpc('join_event', {
      p_event_id: eventId,
      p_join_key: joinKey ?? undefined,
      p_note: note ?? undefined,
    })
    if (error) {
      console.error('Error joining event:', error)
      throw error
    }
    return (data as unknown as JoinEventResult) ?? { success: false, message: 'No response from join_event RPC' }
  }

  static async setEventJoinSettings(
    eventId: string,
    joinMode: 'open' | 'request' | 'key',
    joinKey?: string | null
  ): Promise<EventJoinSettings> {
    const { data, error } = await supabase.rpc('set_event_join_settings', {
      p_event_id: eventId,
      p_join_mode: joinMode,
      p_join_key: joinKey ?? undefined,
    })
    if (error) {
      console.error('Error setting event join settings:', error)
      throw error
    }
    return (data as unknown as EventJoinSettings) ?? { success: false, event_id: eventId, join_mode: joinMode, has_join_key: false }
  }

  static async regenerateEventJoinKey(eventId: string): Promise<string> {
    const { data, error } = await supabase.rpc('regenerate_event_join_key', {
      p_event_id: eventId,
    })
    if (error) {
      console.error('Error regenerating event join key:', error)
      throw error
    }
    return String(data || '')
  }

  static async listEventJoinRequests(
    eventId: string,
    status: 'pending' | 'approved' | 'rejected' | 'any' = 'pending'
  ): Promise<EventJoinRequestRow[]> {
    const { data, error } = await supabase.rpc('list_event_join_requests', {
      p_event_id: eventId,
      p_status: status,
    })
    if (error) {
      console.error('Error listing event join requests:', error)
      return []
    }
    return (data || []) as EventJoinRequestRow[]
  }

  static async reviewEventJoinRequest(
    requestId: string,
    approve: boolean
  ): Promise<ReviewJoinRequestResult> {
    const { data, error } = await supabase.rpc('review_event_join_request', {
      p_request_id: requestId,
      p_approve: approve,
    })
    if (error) {
      console.error('Error reviewing event join request:', error)
      throw error
    }
    return (data as unknown as ReviewJoinRequestResult) ?? { success: false, message: 'No response from review_event_join_request RPC' }
  }

  static async listEventMembers(eventId: string): Promise<EventMemberRow[]> {
    const { data, error } = await supabase.rpc('list_event_members', {
      p_event_id: eventId,
    })
    if (error) {
      console.error('Error listing event members:', error)
      return []
    }
    return (data || []) as EventMemberRow[]
  }

  static async adminAddEventMember(eventId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('admin_add_event_member', {
      p_event_id: eventId,
      p_user_id: userId,
    })
    if (error) {
      console.error('Error adding event member:', error)
      throw error
    }
    return Boolean(data)
  }

  static async adminRemoveEventMember(eventId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('admin_remove_event_member', {
      p_event_id: eventId,
      p_user_id: userId,
    })
    if (error) {
      console.error('Error removing event member:', error)
      throw error
    }
    return Boolean(data)
  }
}
