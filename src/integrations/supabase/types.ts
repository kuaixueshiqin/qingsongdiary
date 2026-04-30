export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          check_date: string
          created_at: string
          id: string
          reward: number
          streak: number
          user_id: string
        }
        Insert: {
          check_date: string
          created_at?: string
          id?: string
          reward: number
          streak: number
          user_id: string
        }
        Update: {
          check_date?: string
          created_at?: string
          id?: string
          reward?: number
          streak?: number
          user_id?: string
        }
        Relationships: []
      }
      comment_replies: {
        Row: {
          comment_id: string
          companion_id: string | null
          created_at: string
          id: string
          role: string
          text: string
          user_id: string
        }
        Insert: {
          comment_id: string
          companion_id?: string | null
          created_at?: string
          id?: string
          role: string
          text: string
          user_id: string
        }
        Update: {
          comment_id?: string
          companion_id?: string | null
          created_at?: string
          id?: string
          role?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_replies_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "diary_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_boards: {
        Row: {
          config: Json
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          position?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_companions: {
        Row: {
          avatar: string | null
          bio: string | null
          color_class: string | null
          created_at: string
          id: string
          intimacy: number
          level: number
          name: string
          role: string | null
          text_color_class: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          color_class?: string | null
          created_at?: string
          id?: string
          intimacy?: number
          level?: number
          name: string
          role?: string | null
          text_color_class?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          color_class?: string | null
          created_at?: string
          id?: string
          intimacy?: number
          level?: number
          name?: string
          role?: string | null
          text_color_class?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diary_comments: {
        Row: {
          companion_id: string
          created_at: string
          diary_id: string
          highlight_text: string | null
          id: string
          line_index: number
          text: string
          user_id: string
        }
        Insert: {
          companion_id: string
          created_at?: string
          diary_id: string
          highlight_text?: string | null
          id?: string
          line_index?: number
          text: string
          user_id: string
        }
        Update: {
          companion_id?: string
          created_at?: string
          diary_id?: string
          highlight_text?: string | null
          id?: string
          line_index?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_comments_diary_id_fkey"
            columns: ["diary_id"]
            isOneToOne: false
            referencedRelation: "diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          billing_amount: number | null
          billing_category: string | null
          billing_verified: boolean | null
          content: string
          created_at: string
          display_date: string | null
          entry_time: string | null
          id: string
          mood: string | null
          mood_label: string | null
          mood_score: number | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_amount?: number | null
          billing_category?: string | null
          billing_verified?: boolean | null
          content?: string
          created_at?: string
          display_date?: string | null
          entry_time?: string | null
          id?: string
          mood?: string | null
          mood_label?: string | null
          mood_score?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_amount?: number | null
          billing_category?: string | null
          billing_verified?: boolean | null
          content?: string
          created_at?: string
          display_date?: string | null
          entry_time?: string | null
          id?: string
          mood?: string | null
          mood_label?: string | null
          mood_score?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mail_conversations: {
        Row: {
          companion_id: string
          created_at: string
          id: string
          last_message_at: string | null
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          companion_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          companion_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mail_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          role: string
          text: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          text: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "mail_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      pinecone_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_data_consent: boolean
          avatar_url: string | null
          created_at: string
          id: string
          nickname: string | null
          pinecones: number
          updated_at: string
        }
        Insert: {
          ai_data_consent?: boolean
          avatar_url?: string | null
          created_at?: string
          id: string
          nickname?: string | null
          pinecones?: number
          updated_at?: string
        }
        Update: {
          ai_data_consent?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          nickname?: string | null
          pinecones?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_pinecones: {
        Args: { _amount: number; _note?: string; _source: string }
        Returns: number
      }
      claim_daily_checkin: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
