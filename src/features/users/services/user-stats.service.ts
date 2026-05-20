import { supabase } from "@/lib/supabase/client";

export type CategoryTotal = {
  category: string
  total_challenges: number
}

export type DifficultyTotal = {
  difficulty: string
  total_challenges: number
}

export class UserStatsService {
  static async getCategoryTotals(eventId?: string | null, eventMode?: string) {
    try {
      const { data, error } = await supabase.rpc("get_category_totals", {
        p_event_id: eventId ?? undefined,
        p_event_mode: eventMode ?? (eventId ? "equals" : "any"),
      });
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  static async getDifficultyTotals(
    eventId?: string | null,
    eventMode?: string,
  ) {
    try {
      const { data, error } = await supabase.rpc("get_difficulty_totals", {
        p_event_id: eventId ?? undefined,
        p_event_mode: eventMode ?? (eventId ? "equals" : "any"),
      });
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }
}
