import { supabase } from '@/lib/supabase/client'

export type SubChallengeAnswerMap = Record<string, string>

export type SubChallengeQuestion = {
  order_number: number
  question: string
}

export type GetSubChallengesResult = {
  mode?: 'none' | 'non_sequential' | 'sequential'
  completed?: boolean
  questions?: SubChallengeQuestion[]
  question?: SubChallengeQuestion | null
  results?: Record<string, boolean>
  flag?: string | null
  message?: string
}

export type SubmitSubChallengesResult = {
  results: Record<string, boolean>
  completed: boolean
  flag?: string
  message?: string
}

export type AdminSubChallengeRow = {
  id: string
  challenge_id: string
  question: string
  answer: string
  order_number: number
  is_sequential: boolean
}

export type AdminSubChallengeInput = {
  question: string
  answer: string
  order_number: number
  is_sequential: boolean
}

export class SubChallengesService {
  private static sanitizeAnswers(answers: SubChallengeAnswerMap): SubChallengeAnswerMap {
    const sanitized: SubChallengeAnswerMap = {}
    Object.entries(answers || {}).forEach(([key, value]) => {
      const normalizedKey = String(key || '').trim()
      if (!normalizedKey) return
      sanitized[normalizedKey] = String(value ?? '')
    })
    return sanitized
  }

  static async getSubChallenges(
    challengeId: string,
    answers: SubChallengeAnswerMap = {}
  ): Promise<GetSubChallengesResult> {
    const payload = SubChallengesService.sanitizeAnswers(answers)
    const { data, error } = await supabase.rpc('get_sub_challenges', {
      p_challenge_id: challengeId,
      p_answers: payload,
    })
    if (error) {
      console.error('RPC get_sub_challenges error:', error)
      return { mode: 'none', completed: false, questions: [], message: 'Failed to load questions' }
    }
    return (data || { mode: 'none', completed: false, questions: [] }) as GetSubChallengesResult
  }

  static async submitSubChallenges(
    challengeId: string,
    answers: SubChallengeAnswerMap
  ): Promise<SubmitSubChallengesResult> {
    const payload = SubChallengesService.sanitizeAnswers(answers)
    const { data, error } = await supabase.rpc('submit_sub_challenges', {
      p_challenge_id: challengeId,
      p_answers: payload,
    })
    if (error) {
      console.error('RPC submit_sub_challenges error:', error)
      return { results: {}, completed: false, message: 'Failed to submit answers' }
    }
    return (data || { results: {}, completed: false }) as SubmitSubChallengesResult
  }

  static async getAdminSubChallenges(challengeId: string): Promise<AdminSubChallengeRow[]> {
    const { data, error } = await supabase.rpc('get_admin_sub_challenges', {
      p_challenge_id: challengeId,
    })
    if (error) {
      console.error('RPC get_admin_sub_challenges error:', error)
      return []
    }
    return (data || []) as AdminSubChallengeRow[]
  }

  static async addAdminSubChallenge(challengeId: string, input: AdminSubChallengeInput): Promise<string | null> {
    const { data, error } = await supabase.rpc('add_sub_challenge', {
      p_challenge_id: challengeId,
      p_question: input.question,
      p_answer: input.answer,
      p_order_number: input.order_number,
      p_is_sequential: input.is_sequential,
    })
    if (error) {
      console.error('RPC add_sub_challenge error:', error)
      return null
    }
    return data ? String(data) : null
  }

  static async updateAdminSubChallenge(subChallengeId: string, input: AdminSubChallengeInput): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_sub_challenge', {
      p_id: subChallengeId,
      p_question: input.question,
      p_answer: input.answer,
      p_order_number: input.order_number,
      p_is_sequential: input.is_sequential,
    })
    if (error) {
      console.error('RPC update_sub_challenge error:', error)
      return false
    }
    return data === true
  }

  static async deleteAdminSubChallenge(subChallengeId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('delete_sub_challenge', {
      p_id: subChallengeId,
    })
    if (error) {
      console.error('RPC delete_sub_challenge error:', error)
      return false
    }
    return data === true
  }
}
