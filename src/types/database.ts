export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lists: {
        Row: {
          id: string
          user_id: string
          title: string
          emoji: string | null
          is_public: boolean
          price_cents: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          emoji?: string | null
          is_public?: boolean
          price_cents?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          emoji?: string | null
          is_public?: boolean
          price_cents?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      links: {
        Row: {
          id: string
          list_id: string
          url: string
          title: string | null
          image_url: string | null
          favicon_url: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          url: string
          title?: string | null
          image_url?: string | null
          favicon_url?: string | null
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          url?: string
          title?: string | null
          image_url?: string | null
          favicon_url?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}