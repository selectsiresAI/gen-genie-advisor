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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bulls: {
        Row: {
          birth_date: string | null
          code: string
          created_at: string | null
          id: string
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string
          ptas: Json | null
          registration: string | null
          sire_naab: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          code: string
          created_at?: string | null
          id?: string
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name: string
          ptas?: Json | null
          registration?: string | null
          sire_naab?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          code?: string
          created_at?: string | null
          id?: string
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string
          ptas?: Json | null
          registration?: string | null
          sire_naab?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      economic_indices: {
        Row: {
          created_at: string | null
          default_weights: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          key: string
          name: string
        }
        Insert: {
          created_at?: string | null
          default_weights?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name: string
        }
        Update: {
          created_at?: string | null
          default_weights?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
        }
        Relationships: []
      }
      farm_bull_picks: {
        Row: {
          added_by: string
          bull_id: string
          created_at: string | null
          farm_id: string
          id: string
          is_active: boolean | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          added_by: string
          bull_id: string
          created_at?: string | null
          farm_id: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          added_by?: string
          bull_id?: string
          created_at?: string | null
          farm_id?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_bull_picks_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_bull_picks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_index_settings: {
        Row: {
          active_index_key: string
          created_at: string | null
          custom_weights: Json | null
          farm_id: string
          id: string
          quantiles: Json | null
          updated_at: string | null
        }
        Insert: {
          active_index_key: string
          created_at?: string | null
          custom_weights?: Json | null
          farm_id: string
          id?: string
          quantiles?: Json | null
          updated_at?: string | null
        }
        Update: {
          active_index_key?: string
          created_at?: string | null
          custom_weights?: Json | null
          farm_id?: string
          id?: string
          quantiles?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_index_settings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: true
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_tanks: {
        Row: {
          capacity: number | null
          created_at: string | null
          farm_id: string
          id: string
          location: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          farm_id: string
          id?: string
          location?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          farm_id?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_tanks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          metadata: Json | null
          name: string
          owner_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          metadata?: Json | null
          name: string
          owner_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          metadata?: Json | null
          name?: string
          owner_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      female_segmentations: {
        Row: {
          class: Database["public"]["Enums"]["segmentation_class"]
          created_at: string | null
          farm_id: string
          female_id: string
          id: string
          parameters: Json | null
          score: number | null
        }
        Insert: {
          class: Database["public"]["Enums"]["segmentation_class"]
          created_at?: string | null
          farm_id: string
          female_id: string
          id?: string
          parameters?: Json | null
          score?: number | null
        }
        Update: {
          class?: Database["public"]["Enums"]["segmentation_class"]
          created_at?: string | null
          farm_id?: string
          female_id?: string
          id?: string
          parameters?: Json | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "female_segmentations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "female_segmentations_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females"
            referencedColumns: ["id"]
          },
        ]
      }
      females: {
        Row: {
          birth_date: string | null
          cdcb_id: string | null
          created_at: string | null
          farm_id: string
          id: string
          identifier: string | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string
          ptas: Json | null
          sire_naab: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          cdcb_id?: string | null
          created_at?: string | null
          farm_id: string
          id?: string
          identifier?: string | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name: string
          ptas?: Json | null
          sire_naab?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          cdcb_id?: string | null
          created_at?: string | null
          farm_id?: string
          id?: string
          identifier?: string | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string
          ptas?: Json | null
          sire_naab?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "females_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      genetic_predictions: {
        Row: {
          confidence: number | null
          created_at: string | null
          farm_id: string
          female_id: string
          id: string
          method: Database["public"]["Enums"]["prediction_method"]
          parameters: Json | null
          predicted_value: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          farm_id: string
          female_id: string
          id?: string
          method: Database["public"]["Enums"]["prediction_method"]
          parameters?: Json | null
          predicted_value: number
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          farm_id?: string
          female_id?: string
          id?: string
          method?: Database["public"]["Enums"]["prediction_method"]
          parameters?: Json | null
          predicted_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "genetic_predictions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genetic_predictions_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females"
            referencedColumns: ["id"]
          },
        ]
      }
      matings: {
        Row: {
          bull_id: string
          created_at: string | null
          farm_id: string
          female_id: string
          id: string
          method: string
          parameters: Json | null
          rank: number
        }
        Insert: {
          bull_id: string
          created_at?: string | null
          farm_id: string
          female_id: string
          id?: string
          method: string
          parameters?: Json | null
          rank: number
        }
        Update: {
          bull_id?: string
          created_at?: string | null
          farm_id?: string
          female_id?: string
          id?: string
          method?: string
          parameters?: Json | null
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "matings_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          default_farm_id: string | null
          full_name: string
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_farm_id?: string | null
          full_name: string
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_farm_id?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      semen_movements: {
        Row: {
          batch_number: string | null
          bull_id: string
          created_at: string | null
          created_by: string
          farm_id: string
          id: string
          movement_date: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes: string | null
          price_per_dose: number | null
          quantity: number
          semen_type: Database["public"]["Enums"]["semen_type"]
          tank_id: string | null
        }
        Insert: {
          batch_number?: string | null
          bull_id: string
          created_at?: string | null
          created_by: string
          farm_id: string
          id?: string
          movement_date?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          price_per_dose?: number | null
          quantity: number
          semen_type?: Database["public"]["Enums"]["semen_type"]
          tank_id?: string | null
        }
        Update: {
          batch_number?: string | null
          bull_id?: string
          created_at?: string | null
          created_by?: string
          farm_id?: string
          id?: string
          movement_date?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          notes?: string | null
          price_per_dose?: number | null
          quantity?: number
          semen_type?: Database["public"]["Enums"]["semen_type"]
          tank_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "semen_movements_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semen_movements_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semen_movements_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "farm_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_farms: {
        Row: {
          created_at: string | null
          farm_id: string
          id: string
          role: Database["public"]["Enums"]["farm_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          farm_id: string
          id?: string
          role?: Database["public"]["Enums"]["farm_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          farm_id?: string
          id?: string
          role?: Database["public"]["Enums"]["farm_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_farms_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_farm: {
        Args: { farm_uuid: string }
        Returns: boolean
      }
      is_farm_member: {
        Args: { farm_uuid: string }
        Returns: boolean
      }
      is_farm_owner: {
        Args: { farm_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      farm_role: "owner" | "editor" | "viewer"
      movement_type: "entrada" | "saida"
      prediction_method: "genomic" | "pedigree" | "blup"
      segmentation_class: "donor" | "inter" | "recipient"
      semen_type: "convencional" | "sexado"
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
      farm_role: ["owner", "editor", "viewer"],
      movement_type: ["entrada", "saida"],
      prediction_method: ["genomic", "pedigree", "blup"],
      segmentation_class: ["donor", "inter", "recipient"],
      semen_type: ["convencional", "sexado"],
    },
  },
} as const
