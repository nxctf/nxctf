export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      challenge_flags: {
        Row: {
          challenge_id: string;
          flag: string;
          flag_hash: string;
        };
        Insert: {
          challenge_id: string;
          flag: string;
          flag_hash: string;
        };
        Update: {
          challenge_id?: string;
          flag?: string;
          flag_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_flags_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: true;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      challenges: {
        Row: {
          attachments: Json | null;
          category: string;
          created_at: string | null;
          decay_per_solve: number | null;
          description: string;
          difficulty: string;
          event_id: string | null;
          flag_placeholder: boolean | null;
          hint: Json | null;
          id: string;
          is_active: boolean | null;
          is_dynamic: boolean | null;
          is_maintenance: boolean | null;
          max_points: number | null;
          min_points: number | null;
          points: number;
          services: string[] | null;
          title: string;
          total_solves: number | null;
          updated_at: string | null;
        };
        Insert: {
          attachments?: Json | null;
          category: string;
          created_at?: string | null;
          decay_per_solve?: number | null;
          description: string;
          difficulty: string;
          event_id?: string | null;
          flag_placeholder?: boolean | null;
          hint?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_dynamic?: boolean | null;
          is_maintenance?: boolean | null;
          max_points?: number | null;
          min_points?: number | null;
          points: number;
          services?: string[] | null;
          title: string;
          total_solves?: number | null;
          updated_at?: string | null;
        };
        Update: {
          attachments?: Json | null;
          category?: string;
          created_at?: string | null;
          decay_per_solve?: number | null;
          description?: string;
          difficulty?: string;
          event_id?: string | null;
          flag_placeholder?: boolean | null;
          hint?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_dynamic?: boolean | null;
          is_maintenance?: boolean | null;
          max_points?: number | null;
          min_points?: number | null;
          points?: number;
          services?: string[] | null;
          title?: string;
          total_solves?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "challenges_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_admins: {
        Row: {
          created_at: string | null;
          event_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          event_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          event_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_admins_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      event_join_requests: {
        Row: {
          event_id: string;
          id: string;
          note: string | null;
          requested_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          event_id: string;
          id?: string;
          note?: string | null;
          requested_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          event_id?: string;
          id?: string;
          note?: string | null;
          requested_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_join_requests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_join_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_join_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      event_participants: {
        Row: {
          event_id: string;
          joined_at: string | null;
          joined_by: string | null;
          user_id: string;
        };
        Insert: {
          event_id: string;
          joined_at?: string | null;
          joined_by?: string | null;
          user_id: string;
        };
        Update: {
          event_id?: string;
          joined_at?: string | null;
          joined_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_joined_by_fkey";
            columns: ["joined_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          always_show_challenges: boolean | null;
          created_at: string | null;
          description: string | null;
          end_time: string | null;
          id: string;
          image_url: string | null;
          join_key: string | null;
          join_mode: string;
          name: string;
          start_time: string | null;
          updated_at: string | null;
        };
        Insert: {
          always_show_challenges?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          image_url?: string | null;
          join_key?: string | null;
          join_mode?: string;
          name: string;
          start_time?: string | null;
          updated_at?: string | null;
        };
        Update: {
          always_show_challenges?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          image_url?: string | null;
          join_key?: string | null;
          join_mode?: string;
          name?: string;
          start_time?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      "keep-alive": {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          level: string | null;
          message: string;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          level?: string | null;
          message: string;
          title: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          level?: string | null;
          message?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      solves: {
        Row: {
          challenge_id: string | null;
          created_at: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          challenge_id?: string | null;
          created_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          challenge_id?: string | null;
          created_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "solves_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      solves_nonactive: {
        Row: {
          challenge_id: string;
          created_at: string | null;
          id: string;
          moved_at: string | null;
          user_id: string;
        };
        Insert: {
          challenge_id: string;
          created_at?: string | null;
          id?: string;
          moved_at?: string | null;
          user_id: string;
        };
        Update: {
          challenge_id?: string;
          created_at?: string | null;
          id?: string;
          moved_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      sub_challenges: {
        Row: {
          answer: string;
          challenge_id: string;
          id: string;
          is_sequential: boolean;
          order_number: number;
          question: string;
        };
        Insert: {
          answer: string;
          challenge_id: string;
          id?: string;
          is_sequential?: boolean;
          order_number: number;
          question: string;
        };
        Update: {
          answer?: string;
          challenge_id?: string;
          id?: string;
          is_sequential?: boolean;
          order_number?: number;
          question?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sub_challenges_challenge_id_fkey";
            columns: ["challenge_id"];
            isOneToOne: false;
            referencedRelation: "challenges";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          joined_at: string | null;
          team_id: string;
          user_id: string;
        };
        Insert: {
          joined_at?: string | null;
          team_id: string;
          user_id: string;
        };
        Update: {
          joined_at?: string | null;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          captain_user_id: string;
          created_at: string | null;
          id: string;
          invite_code: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          captain_user_id: string;
          created_at?: string | null;
          id?: string;
          invite_code: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          captain_user_id?: string;
          created_at?: string | null;
          id?: string;
          invite_code?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_captain_user_id_fkey";
            columns: ["captain_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          bio: string | null;
          created_at: string | null;
          id: string;
          is_admin: boolean;
          profile_picture_url: string | null;
          sosmed: Json | null;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string | null;
          id: string;
          is_admin?: boolean;
          profile_picture_url?: string | null;
          sosmed?: Json | null;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          is_admin?: boolean;
          profile_picture_url?: string | null;
          sosmed?: Json | null;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_challenge: {
        Args: {
          p_attachments?: Json;
          p_category: string;
          p_decay_per_solve?: number;
          p_description: string;
          p_difficulty: string;
          p_event_id?: string;
          p_flag: string;
          p_flag_placeholder?: boolean;
          p_hint?: Json;
          p_is_dynamic?: boolean;
          p_is_maintenance?: boolean;
          p_max_points?: number;
          p_min_points?: number;
          p_points: number;
          p_services?: string[];
          p_title: string;
        };
        Returns: string;
      };
      add_event: {
        Args: {
          p_always_show_challenges?: boolean;
          p_description?: string;
          p_end_time?: string;
          p_image_url?: string;
          p_name: string;
          p_start_time?: string;
        };
        Returns: string;
      };
      add_sub_challenge: {
        Args: {
          p_answer: string;
          p_challenge_id: string;
          p_is_sequential?: boolean;
          p_order_number: number;
          p_question: string;
        };
        Returns: string;
      };
      admin_add_event_member: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: boolean;
      };
      admin_remove_event_member: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: boolean;
      };
      can_manage_challenge: {
        Args: { p_challenge_id: string };
        Returns: boolean;
      };
      can_manage_event: { Args: { p_event_id: string }; Returns: boolean };
      cleanup_orphaned_users_and_solves: { Args: Record<PropertyKey, never>; Returns: undefined };
      create_notification: {
        Args: { p_level?: string; p_message: string; p_title: string };
        Returns: string;
      };
      create_profile: {
        Args: { p_id: string; p_username: string };
        Returns: undefined;
      };
      create_team: { Args: { p_name: string }; Returns: string };
      delete_challenge: { Args: { p_challenge_id: string }; Returns: boolean };
      delete_event: { Args: { p_event_id: string }; Returns: boolean };
      delete_notification: { Args: { p_id: string }; Returns: boolean };
      delete_solver: { Args: { p_solve_id: string }; Returns: boolean };
      delete_sub_challenge: { Args: { p_id: string }; Returns: boolean };
      delete_team: { Args: { p_team_id: string }; Returns: boolean };
      detail_user: {
        Args: { p_event_id?: string; p_event_mode?: string; p_id: string };
        Returns: Json;
      };
      generate_flag_hash: { Args: { flag_text: string }; Returns: string };
      generate_team_invite_code: { Args: Record<PropertyKey, never>; Returns: string };
      get_activity_stats: {
        Args: { p_end: string; p_start: string };
        Returns: {
          active_users: number;
          date: string;
          solves: number;
        }[];
      };
      get_admin_scope: { Args: Record<PropertyKey, never>; Returns: Json };
      get_admin_sub_challenges: {
        Args: { p_challenge_id: string };
        Returns: {
          answer: string;
          challenge_id: string;
          id: string;
          is_sequential: boolean;
          order_number: number;
          question: string;
        }[];
      };
      get_all_my_event_memberships: { Args: Record<PropertyKey, never>; Returns: Json };
      get_auth_audit_logs: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          created_at: string;
          id: string;
          ip_address: string;
          payload: Json;
        }[];
      };
      get_category_totals: {
        Args: { p_event_id?: string; p_event_mode?: string };
        Returns: {
          category: string;
          total_challenges: number;
        }[];
      };
      get_challenge_placeholder: {
        Args: { p_challenge_id: string };
        Returns: string;
      };
      get_challenges_with_sub_challenges: {
        Args: { p_challenge_ids: string[] };
        Returns: {
          challenge_id: string;
        }[];
      };
      get_difficulty_totals: {
        Args: { p_event_id?: string; p_event_mode?: string };
        Returns: {
          difficulty: string;
          total_challenges: number;
        }[];
      };
      get_email_by_username: { Args: { p_username: string }; Returns: string };
      get_event_admins: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          event_id: string;
          event_name: string;
          user_id: string;
          username: string;
        }[];
      };
      get_event_join_settings: { Args: { p_event_id: string }; Returns: Json };
      get_flag: { Args: { p_challenge_id: string }; Returns: string };
      get_flag_placeholder: { Args: { p_flag: string }; Returns: string };
      get_info: { Args: Record<PropertyKey, never>; Returns: Json };
      get_leaderboard: {
        Args: {
          limit_rows?: number;
          offset_rows?: number;
          p_event_id?: string;
          p_event_mode?: string;
        };
        Returns: {
          id: string;
          last_solve: string;
          rank: number;
          score: number;
          username: string;
        }[];
      };
      get_logs: {
        Args: {
          p_event_id?: string;
          p_event_mode?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          log_category: string;
          log_challenge_id: string;
          log_challenge_title: string;
          log_created_at: string;
          log_type: string;
          log_user_id: string;
          log_username: string;
        }[];
      };
      get_my_event_membership: { Args: { p_event_id: string }; Returns: Json };
      get_my_team: {
        Args: { p_event_id?: string; p_event_mode?: string };
        Returns: Json;
      };
      get_my_team_challenges: {
        Args: { p_event_id?: string; p_event_mode?: string };
        Returns: {
          category: string;
          challenge_id: string;
          first_solved_at: string;
          first_solver_username: string;
          points: number;
          title: string;
        }[];
      };
      get_my_team_summary: {
        Args: { p_event_id?: string; p_event_mode?: string };
        Returns: Json;
      };
      get_notifications: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          created_at: string;
          created_by: string;
          id: string;
          level: string;
          message: string;
          title: string;
        }[];
      };
      get_recent_solves: {
        Args: {
          p_event_id?: string;
          p_event_mode?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          log_category: string;
          log_challenge_id: string;
          log_challenge_title: string;
          log_created_at: string;
          log_type: string;
          log_user_id: string;
          log_username: string;
        }[];
      };
      get_solve_info: {
        Args: { p_challenge_id: string; p_user_id: string };
        Returns: {
          challenge: string;
          username: string;
        }[];
      };
      get_solvers_all: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          challenge_id: string;
          challenge_title: string;
          solve_id: string;
          solved_at: string;
          user_id: string;
          username: string;
        }[];
      };
      get_solves_by_challenge: {
        Args: { p_challenge_title: string };
        Returns: {
          challenge_category: string;
          challenge_id: string;
          challenge_title: string;
          points: number;
          solve_id: string;
          solved_at: string;
          user_id: string;
          username: string;
        }[];
      };
      get_solves_by_name: {
        Args: { p_username: string };
        Returns: {
          challenge_category: string;
          challenge_id: string;
          challenge_title: string;
          points: number;
          solve_id: string;
          solved_at: string;
          user_id: string;
          username: string;
        }[];
      };
      get_sub_challenges: {
        Args: { p_answers?: Json; p_challenge_id: string };
        Returns: Json;
      };
      get_team_by_name: {
        Args: { p_event_id?: string; p_event_mode?: string; p_name: string };
        Returns: Json;
      };
      get_team_by_user_id: { Args: { p_user_id: string }; Returns: Json };
      get_team_challenges_by_name: {
        Args: { p_event_id?: string; p_event_mode?: string; p_name: string };
        Returns: {
          category: string;
          challenge_id: string;
          first_solved_at: string;
          first_solver_username: string;
          points: number;
          title: string;
        }[];
      };
      get_team_scoreboard: {
        Args: {
          limit_rows?: number;
          offset_rows?: number;
          p_event_id?: string;
          p_event_mode?: string;
        };
        Returns: {
          member_count: number;
          rank: number;
          team_id: string;
          team_name: string;
          total_score: number;
          total_solves: number;
          unique_challenges: number;
          unique_score: number;
        }[];
      };
      get_team_solves: {
        Args: { p_event_id?: string; p_event_mode?: string };
        Returns: {
          created_at: string;
          points: number;
          team_name: string;
        }[];
      };
      get_team_solves_by_names: {
        Args: { p_event_id?: string; p_event_mode?: string; p_names: string[] };
        Returns: {
          created_at: string;
          points: number;
          team_name: string;
        }[];
      };
      get_team_unique_solves: {
        Args: { p_event_id?: string; p_event_mode?: string };
        Returns: {
          created_at: string;
          points: number;
          team_name: string;
        }[];
      };
      get_team_unique_solves_by_names: {
        Args: {
          p_event_id?: string;
          p_event_mode?: string;
          p_names: string[];
          p_show_name_chall?: boolean;
        };
        Returns: {
          challenge_category: string;
          challenge_id: string;
          challenge_title: string;
          created_at: string;
          points: number;
          team_name: string;
        }[];
      };
      get_top_progress: {
        Args: {
          p_event_id?: string;
          p_event_mode?: string;
          p_limit?: number;
          p_offset?: number;
          p_user_ids: string[];
        };
        Returns: {
          created_at: string;
          points: number;
          user_id: string;
          username: string;
        }[];
      };
      get_user_first_bloods: {
        Args: { p_user_id: string };
        Returns: {
          challenge_id: string;
        }[];
      };
      get_user_profile: {
        Args: { p_id: string };
        Returns: {
          has_main_solved: boolean;
          id: string;
          picture: string;
          profile_picture_url: string;
          solved_event_ids: string[];
          username: string;
        }[];
      };
      get_username_by_email: { Args: { p_email: string }; Returns: string };
      grant_event_admin: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: Json;
      };
      has_admin_access: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_sub_answer_correct: {
        Args: { p_expected: string; p_submitted: string };
        Returns: boolean;
      };
      is_team_captain: { Args: { p_team_id: string }; Returns: boolean };
      join_event: {
        Args: { p_event_id: string; p_join_key?: string; p_note?: string };
        Returns: Json;
      };
      join_team: { Args: { p_invite_code: string }; Returns: string };
      kick_team_member: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: boolean;
      };
      leave_team: { Args: Record<PropertyKey, never>; Returns: boolean };
      list_event_join_requests: {
        Args: { p_event_id: string; p_status?: string };
        Returns: {
          event_id: string;
          note: string;
          request_id: string;
          requested_at: string;
          reviewed_at: string;
          reviewed_by: string;
          status: string;
          user_id: string;
          username: string;
        }[];
      };
      list_event_members: {
        Args: { p_event_id: string };
        Returns: {
          event_id: string;
          joined_at: string;
          joined_by: string;
          user_id: string;
          username: string;
        }[];
      };
      normalize_sub_answer: { Args: { p_answer: string }; Returns: string };
      normalize_sub_challenge_order: {
        Args: { p_challenge_id: string };
        Returns: undefined;
      };
      regenerate_event_join_key: {
        Args: { p_event_id: string };
        Returns: string;
      };
      regenerate_team_invite_code: {
        Args: { p_team_id: string };
        Returns: string;
      };
      rename_team: {
        Args: { p_new_name: string; p_team_id: string };
        Returns: boolean;
      };
      review_event_join_request: {
        Args: { p_approve?: boolean; p_request_id: string };
        Returns: Json;
      };
      revoke_event_admin: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: Json;
      };
      set_challenge_active: {
        Args: { p_active: boolean; p_challenge_id: string };
        Returns: Json;
      };
      set_challenge_maintenance: {
        Args: { p_challenge_id: string; p_maintenance: boolean };
        Returns: Json;
      };
      set_challenges_event: {
        Args: { p_challenge_ids: string[]; p_event_id: string };
        Returns: number;
      };
      set_event_join_settings: {
        Args: { p_event_id: string; p_join_key?: string; p_join_mode: string };
        Returns: Json;
      };
      submit_flag: {
        Args: { p_challenge_id: string; p_flag: string };
        Returns: Json;
      };
      submit_sub_challenges: {
        Args: { p_answers: Json; p_challenge_id: string };
        Returns: Json;
      };
      transfer_team_captain: {
        Args: { p_new_captain_user_id: string; p_team_id: string };
        Returns: boolean;
      };
      update_bio: { Args: { p_bio: string; p_id: string }; Returns: Json };
      update_challenge: {
        Args: {
          p_attachments?: Json;
          p_category: string;
          p_challenge_id: string;
          p_decay_per_solve?: number;
          p_description: string;
          p_difficulty: string;
          p_event_id?: string;
          p_flag?: string;
          p_flag_placeholder?: boolean;
          p_hint?: Json;
          p_is_active?: boolean;
          p_is_dynamic?: boolean;
          p_is_maintenance?: boolean;
          p_max_points?: number;
          p_min_points?: number;
          p_points: number;
          p_services?: string[];
          p_title: string;
        };
        Returns: boolean;
      };
      update_event: {
        Args: {
          p_always_show_challenges?: boolean;
          p_description?: string;
          p_end_time?: string;
          p_event_id: string;
          p_image_url?: string;
          p_name?: string;
          p_start_time?: string;
        };
        Returns: boolean;
      };
      update_profile_picture: {
        Args: { p_id: string; p_profile_picture_url: string };
        Returns: Json;
      };
      update_sosmed: { Args: { p_id: string; p_sosmed: Json }; Returns: Json };
      update_sub_challenge: {
        Args: {
          p_answer: string;
          p_id: string;
          p_is_sequential?: boolean;
          p_order_number: number;
          p_question: string;
        };
        Returns: boolean;
      };
      update_username: {
        Args: { p_id: string; p_username: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
