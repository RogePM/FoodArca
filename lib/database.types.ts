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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          item_snapshot: Json
          location_id: string | null
          organization_id: string
          quantity_changed: number
          reason: string | null
          total_weight_lbs_changed: number | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          item_snapshot: Json
          location_id?: string | null
          organization_id: string
          quantity_changed: number
          reason?: string | null
          total_weight_lbs_changed?: number | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          item_snapshot?: Json
          location_id?: string | null
          organization_id?: string
          quantity_changed?: number
          reason?: string | null
          total_weight_lbs_changed?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          barcode: string | null
          category_id: number | null
          created_at: string
          id: string
          input_unit_value: number
          name: string
          organization_id: string
          pack_size: number | null
          photo_url: string | null
          unit_of_measure: string
          weight_per_unit_lbs: number | null
        }
        Insert: {
          barcode?: string | null
          category_id?: number | null
          created_at?: string
          id?: string
          input_unit_value: number
          name: string
          organization_id: string
          pack_size?: number | null
          photo_url?: string | null
          unit_of_measure: string
          weight_per_unit_lbs?: number | null
        }
        Update: {
          barcode?: string | null
          category_id?: number | null
          created_at?: string
          id?: string
          input_unit_value?: number
          name?: string
          organization_id?: string
          pack_size?: number | null
          photo_url?: string | null
          unit_of_measure?: string
          weight_per_unit_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: number
          is_food: boolean
          name: string
        }
        Insert: {
          id?: number
          is_food?: boolean
          name: string
        }
        Update: {
          id?: number
          is_food?: boolean
          name?: string
        }
        Relationships: []
      }
      daily_org_stats: {
        Row: {
          distinct_categories: number | null
          distinct_volunteers: number | null
          lbs_in: number | null
          lbs_out: number | null
          lbs_wasted: number | null
          location_id: string
          organization_id: string
          stat_date: string
        }
        Insert: {
          distinct_categories?: number | null
          distinct_volunteers?: number | null
          lbs_in?: number | null
          lbs_out?: number | null
          lbs_wasted?: number | null
          location_id: string
          organization_id: string
          stat_date: string
        }
        Update: {
          distinct_categories?: number | null
          distinct_volunteers?: number | null
          lbs_in?: number | null
          lbs_out?: number | null
          lbs_wasted?: number | null
          location_id?: string
          organization_id?: string
          stat_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_org_stats_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_org_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          catalog_item_id: string
          created_at: string
          donor_name: string | null
          expiration_date: string | null
          expiration_precision: string | null
          id: string
          location_id: string
          quantity: number
          received_date: string
          source_type: string | null
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          donor_name?: string | null
          expiration_date?: string | null
          expiration_precision?: string | null
          id?: string
          location_id: string
          quantity: number
          received_date?: string
          source_type?: string | null
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          donor_name?: string | null
          expiration_date?: string | null
          expiration_precision?: string | null
          id?: string
          location_id?: string
          quantity?: number
          received_date?: string
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          id: string
          last_physical_count_at: string | null
          name: string
          organization_id: string
          state: string
          timezone: string
          zip: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          id?: string
          last_physical_count_at?: string | null
          name: string
          organization_id: string
          state: string
          timezone: string
          zip: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          last_physical_count_at?: string | null
          name?: string
          organization_id?: string
          state?: string
          timezone?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_programs: {
        Row: {
          enabled: boolean
          organization_id: string
          program_code: string
        }
        Insert: {
          enabled?: boolean
          organization_id: string
          program_code: string
        }
        Update: {
          enabled?: boolean
          organization_id?: string
          program_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_color: string | null
          created_at: string
          current_item_count: number
          current_location_count: number
          current_user_count: number
          ein_tax_id: string | null
          id: string
          logo_url: string | null
          name: string
          parent_organization_id: string | null
          plan_type: string
          timezone: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          current_item_count?: number
          current_location_count?: number
          current_user_count?: number
          ein_tax_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
          parent_organization_id?: string | null
          plan_type?: string
          timezone?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          current_item_count?: number
          current_location_count?: number
          current_user_count?: number
          ein_tax_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          parent_organization_id?: string | null
          plan_type?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_organization_id_fkey"
            columns: ["parent_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_plan_type_fkey"
            columns: ["plan_type"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["plan_type"]
          },
        ]
      }
      plans: {
        Row: {
          export_enabled: boolean
          history_retention_days: number | null
          max_catalog_items: number | null
          max_locations: number | null
          max_users: number | null
          plan_type: string
          price_monthly: number | null
          rollup_reporting_enabled: boolean
        }
        Insert: {
          export_enabled?: boolean
          history_retention_days?: number | null
          max_catalog_items?: number | null
          max_locations?: number | null
          max_users?: number | null
          plan_type: string
          price_monthly?: number | null
          rollup_reporting_enabled?: boolean
        }
        Update: {
          export_enabled?: boolean
          history_retention_days?: number | null
          max_catalog_items?: number | null
          max_locations?: number | null
          max_users?: number | null
          plan_type?: string
          price_monthly?: number | null
          rollup_reporting_enabled?: boolean
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { p_token: string }; Returns: undefined }
      create_organization: {
        Args: {
          location_address_line1?: string
          location_city?: string
          location_name?: string
          location_state?: string
          location_timezone?: string
          location_zip?: string
          org_name: string
          org_timezone?: string
          user_full_name?: string
        }
        Returns: Json
      }
      delete_catalog_item_safe: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      get_managed_org_ids: { Args: { p_user_id: string }; Returns: string[] }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      scan_out_item: {
        Args: {
          p_catalog_item_id: string
          p_location_id: string
          p_quantity: number
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
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
