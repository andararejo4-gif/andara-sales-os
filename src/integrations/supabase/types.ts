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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_tl_assignments: {
        Row: {
          admin_id: string
          id: string
          tl_id: string
        }
        Insert: {
          admin_id: string
          id?: string
          tl_id: string
        }
        Update: {
          admin_id?: string
          id?: string
          tl_id?: string
        }
        Relationships: []
      }
      ai_videos: {
        Row: {
          asset_url: string | null
          created_at: string
          id: string
          owner_id: string
          project_id: string | null
          published_at: string | null
          publisher_id: string | null
          status: string
          team_id: string | null
          title: string
          tl_id: string | null
        }
        Insert: {
          asset_url?: string | null
          created_at?: string
          id?: string
          owner_id: string
          project_id?: string | null
          published_at?: string | null
          publisher_id?: string | null
          status?: string
          team_id?: string | null
          title: string
          tl_id?: string | null
        }
        Update: {
          asset_url?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          project_id?: string | null
          published_at?: string | null
          publisher_id?: string | null
          status?: string
          team_id?: string | null
          title?: string
          tl_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sales_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          record_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          location: string
          owner_id: string
          project_id: string | null
          starts_at: string
          status: string
          team_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          location?: string
          owner_id?: string
          project_id?: string | null
          starts_at: string
          status?: string
          team_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          location?: string
          owner_id?: string
          project_id?: string | null
          starts_at?: string
          status?: string
          team_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sales_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          lead_id: string | null
          milestone: string
          owner_id: string
          project_id: string | null
          status: string
          team_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          lead_id?: string | null
          milestone: string
          owner_id: string
          project_id?: string | null
          status?: string
          team_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lead_id?: string | null
          milestone?: string
          owner_id?: string
          project_id?: string | null
          status?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sales_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string
          event_id: string
          id: string
          kind: string
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          kind: string
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          kind?: string
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_logs: {
        Row: {
          created_at: string
          id: string
          logged_on: string
          metric: string
          owner_id: string
          project_id: string | null
          team_id: string | null
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_on?: string
          metric: string
          owner_id: string
          project_id?: string | null
          team_id?: string | null
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_on?: string
          metric?: string
          owner_id?: string
          project_id?: string | null
          team_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sales_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_change_requests: {
        Row: {
          applied_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          lead_id: string
          proposed: Json
          reason: string
          requested_by: string
          status: string
        }
        Insert: {
          applied_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          lead_id: string
          proposed: Json
          reason: string
          requested_by?: string
          status?: string
        }
        Update: {
          applied_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          proposed?: Json
          reason?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_change_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_activities: {
        Row: {
          id: string
          kind: string
          lead_id: string | null
          note: string
          occurred_at: string
          owner_id: string
          project_id: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          kind: string
          lead_id?: string | null
          note?: string
          occurred_at?: string
          owner_id: string
          project_id?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          kind?: string
          lead_id?: string | null
          note?: string
          occurred_at?: string
          owner_id?: string
          project_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sales_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leads: {
        Row: {
          address: string
          created_at: string
          id: string
          lead_value: number
          nickname: string
          owner_id: string
          phone: string
          project_id: string | null
          prospect_name: string
          source: string
          status: string
          team_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          lead_value?: number
          nickname: string
          owner_id: string
          phone?: string
          project_id?: string | null
          prospect_name?: string
          source?: string
          status?: string
          team_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          lead_value?: number
          nickname?: string
          owner_id?: string
          phone?: string
          project_id?: string | null
          prospect_name?: string
          source?: string
          status?: string
          team_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sales_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_projects: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          target_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          name: string
          target_amount?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          target_amount?: number
        }
        Relationships: []
      }
      sales_transactions: {
        Row: {
          amount: number
          closed_on: string
          created_at: string
          id: string
          lead_id: string | null
          owner_id: string
          project_id: string
          status: string
          team_id: string | null
        }
        Insert: {
          amount: number
          closed_on?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          owner_id: string
          project_id: string
          status: string
          team_id?: string | null
        }
        Update: {
          amount?: number
          closed_on?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          owner_id?: string
          project_id?: string
          status?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "sales_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      social_analytics_links: {
        Row: {
          created_by: string
          id: string
          label: string
          url: string
        }
        Insert: {
          created_by?: string
          id?: string
          label: string
          url: string
        }
        Update: {
          created_by?: string
          id?: string
          label?: string
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          project_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          staff_code: string
          staff_name: string
          team_id: string | null
          tl_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          staff_code?: string
          staff_name?: string
          team_id?: string | null
          tl_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          project_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          staff_code?: string
          staff_name?: string
          team_id?: string | null
          tl_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_items: {
        Row: {
          created_at: string
          feature: string
          id: string
          note: string
          owner_id: string
          project_id: string | null
          status: string
          team_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          note?: string
          owner_id?: string
          project_id?: string | null
          status?: string
          team_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          note?: string
          owner_id?: string
          project_id?: string | null
          status?: string
          team_id?: string | null
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_lead_change: { Args: { _request: string }; Returns: undefined }
      can_read_scope: {
        Args: { _owner: string; _project: string; _team: string }
        Returns: boolean
      }
      feature_access: {
        Args: { _feature: string; _write?: boolean }
        Returns: boolean
      }
      generate_event_reminders: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_lead_change: {
        Args: { _lead: string; _proposed: Json; _reason: string }
        Returns: string
      }
      review_lead_change: {
        Args: { _approve: boolean; _request: string }
        Returns: undefined
      }
      save_sales_lead: {
        Args: {
          _address: string
          _id: string
          _name: string
          _note?: string
          _phone: string
          _source: string
          _status: string
        }
        Returns: string
      }
      staff_directory: {
        Args: never
        Returns: {
          project_id: string
          role: Database["public"]["Enums"]["app_role"]
          staff_code: string
          staff_name: string
          team_id: string
          tl_id: string
          user_id: string
        }[]
      }
      valid_owner_scope: {
        Args: { _owner: string; _project: string; _team: string }
        Returns: boolean
      }
      verify_sales_lead: {
        Args: { _id: string; _value: number }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "se" | "tl" | "adm" | "dm" | "sm" | "dir" | "it"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["se", "tl", "adm", "dm", "sm", "dir", "it"],
    },
  },
} as const
