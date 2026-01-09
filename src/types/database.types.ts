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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      creator_payouts: {
        Row: {
          admin_notes: string | null
          amount: number
          completed_at: string | null
          currency: string
          failed_reason: string | null
          id: string
          processed_at: string | null
          requested_at: string | null
          status: string
          stripe_account_id: string
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          completed_at?: string | null
          currency?: string
          failed_reason?: string | null
          id?: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string
          stripe_account_id: string
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          completed_at?: string | null
          currency?: string
          failed_reason?: string | null
          id?: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string
          stripe_account_id?: string
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_payouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          clicked_at: string | null
          clicker_id: string | null
          clicker_ip: unknown
          clicker_user_agent: string | null
          id: string
          link_id: string
          list_id: string
          referrer: string | null
        }
        Insert: {
          clicked_at?: string | null
          clicker_id?: string | null
          clicker_ip?: unknown
          clicker_user_agent?: string | null
          id?: string
          link_id: string
          list_id: string
          referrer?: string | null
        }
        Update: {
          clicked_at?: string | null
          clicker_id?: string | null
          clicker_ip?: unknown
          clicker_user_agent?: string | null
          id?: string
          link_id?: string
          list_id?: string
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "creator_earnings_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "link_clicks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "list_analytics_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "link_clicks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_clicks_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists_with_price_display"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string | null
          description: string | null
          favicon_url: string | null
          id: string
          image_url: string | null
          list_id: string
          position: number
          title: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          image_url?: string | null
          list_id: string
          position?: number
          title?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          image_url?: string | null
          list_id?: string
          position?: number
          title?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "creator_earnings_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "links_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "list_analytics_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "links_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists_with_price_display"
            referencedColumns: ["id"]
          },
        ]
      }
      list_purchases: {
        Row: {
          amount_paid: number
          creator_earnings: number
          currency: string
          id: string
          list_id: string
          platform_fee: number
          purchased_at: string | null
          refund_reason: string | null
          refunded_at: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string
          stripe_receipt_url: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          creator_earnings: number
          currency?: string
          id?: string
          list_id: string
          platform_fee: number
          purchased_at?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id: string
          stripe_receipt_url?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          creator_earnings?: number
          currency?: string
          id?: string
          list_id?: string
          platform_fee?: number
          purchased_at?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string
          stripe_receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_purchases_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "creator_earnings_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "list_purchases_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "list_analytics_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "list_purchases_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_purchases_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists_with_price_display"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      list_views: {
        Row: {
          id: string
          list_id: string
          referrer: string | null
          viewed_at: string | null
          viewer_id: string | null
          viewer_ip: unknown
          viewer_user_agent: string | null
        }
        Insert: {
          id?: string
          list_id: string
          referrer?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
          viewer_ip?: unknown
          viewer_user_agent?: string | null
        }
        Update: {
          id?: string
          list_id?: string
          referrer?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
          viewer_ip?: unknown
          viewer_user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_views_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "creator_earnings_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "list_views_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "list_analytics_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "list_views_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_views_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists_with_price_display"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          ai_generated_at: string | null
          ai_summary: string | null
          ai_themes: string[] | null
          created_at: string | null
          currency: string | null
          description: string | null
          emoji: string | null
          id: string
          is_public: boolean | null
          price_cents: number | null
          public_id: string
          save_count: number | null
          title: string
          updated_at: string | null
          user_id: string
          view_count: number | null
          view_mode: string | null
        }
        Insert: {
          ai_generated_at?: string | null
          ai_summary?: string | null
          ai_themes?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_public?: boolean | null
          price_cents?: number | null
          public_id: string
          save_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
          view_mode?: string | null
        }
        Update: {
          ai_generated_at?: string | null
          ai_summary?: string | null
          ai_themes?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_public?: boolean | null
          price_cents?: number | null
          public_id?: string
          save_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
          view_mode?: string | null
        }
        Relationships: []
      }
      saved_lists: {
        Row: {
          id: string
          list_id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          list_id: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          list_id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "creator_earnings_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "saved_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "list_analytics_summary"
            referencedColumns: ["list_id"]
          },
          {
            foreignKeyName: "saved_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists_with_price_display"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          profile_is_public: boolean
          profile_picture_url: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_connected_at: string | null
          stripe_customer_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          profile_is_public?: boolean
          profile_picture_url?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_connected_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          profile_is_public?: boolean
          profile_picture_url?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_connected_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      creator_earnings_summary: {
        Row: {
          creator_id: string | null
          currency: string | null
          first_purchase: string | null
          latest_purchase: string | null
          list_id: string | null
          list_title: string | null
          total_earnings: number | null
          total_platform_fees: number | null
          total_purchases: number | null
        }
        Relationships: []
      }
      list_analytics_summary: {
        Row: {
          is_public: boolean | null
          last_clicked_at: string | null
          last_viewed_at: string | null
          list_id: string | null
          save_count: number | null
          title: string | null
          total_clicks: number | null
          total_views: number | null
          unique_ips: number | null
          unique_viewers: number | null
          user_id: string | null
        }
        Relationships: []
      }
      lists_with_price_display: {
        Row: {
          ai_generated_at: string | null
          ai_summary: string | null
          ai_themes: string[] | null
          created_at: string | null
          currency: string | null
          description: string | null
          emoji: string | null
          id: string | null
          is_public: boolean | null
          price_cents: number | null
          price_dollars: number | null
          public_id: string | null
          save_count: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
          view_mode: string | null
        }
        Insert: {
          ai_generated_at?: string | null
          ai_summary?: string | null
          ai_themes?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          emoji?: string | null
          id?: string | null
          is_public?: boolean | null
          price_cents?: number | null
          price_dollars?: never
          public_id?: string | null
          save_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
          view_mode?: string | null
        }
        Update: {
          ai_generated_at?: string | null
          ai_summary?: string | null
          ai_themes?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          emoji?: string | null
          id?: string | null
          is_public?: boolean | null
          price_cents?: number | null
          price_dollars?: never
          public_id?: string | null
          save_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
          view_mode?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_short_id: { Args: { length?: number }; Returns: string }
      get_creator_available_balance: {
        Args: { p_user_id: string }
        Returns: {
          available_balance: number
          pending_payouts: number
          total_earned: number
        }[]
      }
      get_creator_total_earnings: {
        Args: { p_user_id: string }
        Returns: {
          currency: string
          total_earnings: number
          total_purchases: number
        }[]
      }
      increment_link_positions: {
        Args: { target_list_id: string }
        Returns: undefined
      }
      refresh_analytics_summary: { Args: never; Returns: undefined }
      user_has_purchased_list: {
        Args: { p_list_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      ViewMode: "LIST" | "GALLERY"
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
    Enums: {
      ViewMode: ["LIST", "GALLERY"],
    },
  },
} as const
