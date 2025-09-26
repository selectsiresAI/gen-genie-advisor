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
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          ccr: number | null
          cfp: number | null
          cm_dollar: number | null
          code: string
          company: string | null
          created_at: string | null
          da: number | null
          dce: number | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          f_sav: number | null
          fi: number | null
          flc: number | null
          fls: number | null
          fm_dollar: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gm_dollar: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string
          kappa_casein: string | null
          ket: number | null
          liv: number | null
          mast: number | null
          met: number | null
          mf: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string
          nm_dollar: number | null
          pedigree: string | null
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
          ptas: Json | null
          ptat: number | null
          registration: string | null
          rfi: number | null
          rlr: number | null
          rls: number | null
          rp: number | null
          rtp: number | null
          rua: number | null
          ruh: number | null
          ruw: number | null
          rw: number | null
          sce: number | null
          scs: number | null
          sire_naab: string | null
          ssb: number | null
          sta: number | null
          str: number | null
          tpi: number | null
          ucl: number | null
          udc: number | null
          udp: number | null
          updated_at: string | null
        }
        Insert: {
          beta_casein?: string | null
          birth_date?: string | null
          bwc?: number | null
          ccr?: number | null
          cfp?: number | null
          cm_dollar?: number | null
          code: string
          company?: string | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          f_sav?: number | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm_dollar?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gm_dollar?: number | null
          h_liv?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          id?: string
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          mf?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name: string
          nm_dollar?: number | null
          pedigree?: string | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptas?: Json | null
          ptat?: number | null
          registration?: string | null
          rfi?: number | null
          rlr?: number | null
          rls?: number | null
          rp?: number | null
          rtp?: number | null
          rua?: number | null
          ruh?: number | null
          ruw?: number | null
          rw?: number | null
          sce?: number | null
          scs?: number | null
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          str?: number | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
          updated_at?: string | null
        }
        Update: {
          beta_casein?: string | null
          birth_date?: string | null
          bwc?: number | null
          ccr?: number | null
          cfp?: number | null
          cm_dollar?: number | null
          code?: string
          company?: string | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          f_sav?: number | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm_dollar?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gm_dollar?: number | null
          h_liv?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          id?: string
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          mf?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string
          nm_dollar?: number | null
          pedigree?: string | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptas?: Json | null
          ptat?: number | null
          registration?: string | null
          rfi?: number | null
          rlr?: number | null
          rls?: number | null
          rp?: number | null
          rtp?: number | null
          rua?: number | null
          ruh?: number | null
          ruw?: number | null
          rw?: number | null
          sce?: number | null
          scs?: number | null
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          str?: number | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
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
            foreignKeyName: "farm_bull_picks_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls_denorm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_bull_picks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
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
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
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
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
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
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
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
          {
            foreignKeyName: "female_segmentations_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females_denorm"
            referencedColumns: ["id"]
          },
        ]
      }
      females: {
        Row: {
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          category: string | null
          ccr: number | null
          cdcb_id: string | null
          cfp: number | null
          cm_dollar: number | null
          created_at: string | null
          da: number | null
          dce: number | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          efc: number | null
          f_sav: number | null
          farm_id: string
          fi: number | null
          flc: number | null
          fls: number | null
          fm_dollar: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string
          identifier: string | null
          kappa_casein: string | null
          ket: number | null
          liv: number | null
          mast: number | null
          met: number | null
          mf: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string
          nm_dollar: number | null
          parity_order: number | null
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
          ptas: Json | null
          ptat: number | null
          rfi: number | null
          rlr: number | null
          rls: number | null
          rp: number | null
          rtp: number | null
          rua: number | null
          ruh: number | null
          ruw: number | null
          rw: number | null
          sce: number | null
          scs: number | null
          sire_naab: string | null
          ssb: number | null
          sta: number | null
          str: number | null
          tpi: number | null
          ucl: number | null
          udc: number | null
          udp: number | null
          updated_at: string | null
        }
        Insert: {
          beta_casein?: string | null
          birth_date?: string | null
          bwc?: number | null
          category?: string | null
          ccr?: number | null
          cdcb_id?: string | null
          cfp?: number | null
          cm_dollar?: number | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          efc?: number | null
          f_sav?: number | null
          farm_id: string
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm_dollar?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          h_liv?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          id?: string
          identifier?: string | null
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          mf?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name: string
          nm_dollar?: number | null
          parity_order?: number | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptas?: Json | null
          ptat?: number | null
          rfi?: number | null
          rlr?: number | null
          rls?: number | null
          rp?: number | null
          rtp?: number | null
          rua?: number | null
          ruh?: number | null
          ruw?: number | null
          rw?: number | null
          sce?: number | null
          scs?: number | null
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          str?: number | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
          updated_at?: string | null
        }
        Update: {
          beta_casein?: string | null
          birth_date?: string | null
          bwc?: number | null
          category?: string | null
          ccr?: number | null
          cdcb_id?: string | null
          cfp?: number | null
          cm_dollar?: number | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          efc?: number | null
          f_sav?: number | null
          farm_id?: string
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm_dollar?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          h_liv?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          id?: string
          identifier?: string | null
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          mf?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string
          nm_dollar?: number | null
          parity_order?: number | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptas?: Json | null
          ptat?: number | null
          rfi?: number | null
          rlr?: number | null
          rls?: number | null
          rp?: number | null
          rtp?: number | null
          rua?: number | null
          ruh?: number | null
          ruw?: number | null
          rw?: number | null
          sce?: number | null
          scs?: number | null
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          str?: number | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "females_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
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
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
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
          {
            foreignKeyName: "genetic_predictions_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females_denorm"
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
            foreignKeyName: "matings_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls_denorm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
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
          {
            foreignKeyName: "matings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females_denorm"
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
            foreignKeyName: "semen_movements_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls_denorm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semen_movements_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
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
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
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
      bulls_denorm: {
        Row: {
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          ccr: number | null
          cfp: number | null
          cm_dollar: number | null
          code: string | null
          company: string | null
          created_at: string | null
          da: number | null
          dce: number | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          f_sav: number | null
          fi: number | null
          flc: number | null
          fls: number | null
          fm_dollar: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gm_dollar: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string | null
          kappa_casein: string | null
          ket: number | null
          liv: number | null
          mast: number | null
          met: number | null
          mf: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string | null
          nm_dollar: number | null
          pedigree: string | null
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
          ptas: Json | null
          ptat: number | null
          registration: string | null
          rfi: number | null
          rlr: number | null
          rls: number | null
          rp: number | null
          rtp: number | null
          rua: number | null
          ruh: number | null
          ruw: number | null
          rw: number | null
          sce: number | null
          scs: number | null
          sire_naab: string | null
          ssb: number | null
          sta: number | null
          str: number | null
          tpi: number | null
          ucl: number | null
          udc: number | null
          udp: number | null
          updated_at: string | null
        }
        Insert: {
          beta_casein?: string | null
          birth_date?: string | null
          bwc?: number | null
          ccr?: number | null
          cfp?: number | null
          cm_dollar?: number | null
          code?: string | null
          company?: string | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          f_sav?: number | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm_dollar?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gm_dollar?: number | null
          h_liv?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          id?: string | null
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          mf?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: number | null
          pedigree?: string | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptas?: Json | null
          ptat?: number | null
          registration?: string | null
          rfi?: number | null
          rlr?: number | null
          rls?: number | null
          rp?: number | null
          rtp?: number | null
          rua?: number | null
          ruh?: number | null
          ruw?: number | null
          rw?: number | null
          sce?: number | null
          scs?: number | null
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          str?: number | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
          updated_at?: string | null
        }
        Update: {
          beta_casein?: string | null
          birth_date?: string | null
          bwc?: number | null
          ccr?: number | null
          cfp?: number | null
          cm_dollar?: number | null
          code?: string | null
          company?: string | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          f_sav?: number | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm_dollar?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gm_dollar?: number | null
          h_liv?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          id?: string | null
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          mf?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: number | null
          pedigree?: string | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptas?: Json | null
          ptat?: number | null
          registration?: string | null
          rfi?: number | null
          rlr?: number | null
          rls?: number | null
          rp?: number | null
          rtp?: number | null
          rua?: number | null
          ruh?: number | null
          ruw?: number | null
          rw?: number | null
          sce?: number | null
          scs?: number | null
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          str?: number | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      farm_dashboard_kpis: {
        Row: {
          avg_hhp_dollar: number | null
          avg_nm_dollar: number | null
          avg_tpi: number | null
          donor_females: number | null
          donor_percentage: number | null
          farm_created_at: string | null
          farm_id: string | null
          farm_name: string | null
          farm_updated_at: string | null
          inter_females: number | null
          inter_percentage: number | null
          last_female_added: string | null
          last_mating_date: string | null
          last_movement_date: string | null
          last_prediction_date: string | null
          owner_name: string | null
          recipient_females: number | null
          recipient_percentage: number | null
          selected_bulls: number | null
          total_females: number | null
          total_matings: number | null
          total_predictions: number | null
          total_semen_doses: number | null
        }
        Relationships: []
      }
      females_denorm: {
        Row: {
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          category: string | null
          ccr: number | null
          cdcb_id: string | null
          cfp: number | null
          cm_dollar: number | null
          created_at: string | null
          da: number | null
          dce: number | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          efc: number | null
          f_sav: number | null
          farm_id: string | null
          fi: number | null
          flc: number | null
          fls: number | null
          fm_dollar: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string | null
          identifier: string | null
          kappa_casein: string | null
          ket: number | null
          last_prediction_confidence: number | null
          last_prediction_date: string | null
          last_prediction_method:
            | Database["public"]["Enums"]["prediction_method"]
            | null
          last_prediction_value: number | null
          liv: number | null
          mast: number | null
          met: number | null
          mf: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string | null
          nm_dollar: number | null
          parity_order: number | null
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
          ptat: number | null
          rfi: number | null
          rlr: number | null
          rls: number | null
          rp: number | null
          rtp: number | null
          rua: number | null
          ruh: number | null
          ruw: number | null
          rw: number | null
          sce: number | null
          scs: number | null
          segmentation_class:
            | Database["public"]["Enums"]["segmentation_class"]
            | null
          segmentation_score: number | null
          sire_naab: string | null
          ssb: number | null
          sta: number | null
          str: number | null
          tpi: number | null
          ucl: number | null
          udc: number | null
          udp: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "females_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
          {
            foreignKeyName: "females_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      semen_inventory: {
        Row: {
          balance: number | null
          bull_id: string | null
          bull_naab: string | null
          bull_name: string | null
          farm_id: string | null
          last_movement_date: string | null
          semen_type: Database["public"]["Enums"]["semen_type"] | null
          total_movements: number | null
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
            foreignKeyName: "semen_movements_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls_denorm"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semen_movements_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
          {
            foreignKeyName: "semen_movements_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_bull_to_farm: {
        Args: { bull_uuid: string; farm_uuid: string; notes_text?: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      can_edit_farm: {
        Args: { farm_uuid: string }
        Returns: boolean
      }
      create_farm_basic: {
        Args: { farm_metadata?: Json; farm_name: string; owner_name: string }
        Returns: {
          farm_id: string
          message: string
          success: boolean
        }[]
      }
      daitch_mokotoff: {
        Args: { "": string }
        Returns: string[]
      }
      delete_farm: {
        Args: { farm_uuid: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      dmetaphone: {
        Args: { "": string }
        Returns: string
      }
      dmetaphone_alt: {
        Args: { "": string }
        Returns: string
      }
      get_bull_by_naab: {
        Args: { naab: string }
        Returns: {
          bull_id: string
          code: string
          found: boolean
          name: string
          ptas: Json
          suggestions: string[]
        }[]
      }
      get_bulls_by_naab_list: {
        Args: { naabs: string[] }
        Returns: {
          bull_id: string
          input_naab: string
          name: string
          normalized_naab: string
          ptas: Json
          status: string
          suggestions: string[]
        }[]
      }
      get_bulls_denorm: {
        Args: Record<PropertyKey, never>
        Returns: {
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          ccr: number | null
          cfp: number | null
          cm_dollar: number | null
          code: string | null
          company: string | null
          created_at: string | null
          da: number | null
          dce: number | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          f_sav: number | null
          fi: number | null
          flc: number | null
          fls: number | null
          fm_dollar: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gm_dollar: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string | null
          kappa_casein: string | null
          ket: number | null
          liv: number | null
          mast: number | null
          met: number | null
          mf: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string | null
          nm_dollar: number | null
          pedigree: string | null
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
          ptas: Json | null
          ptat: number | null
          registration: string | null
          rfi: number | null
          rlr: number | null
          rls: number | null
          rp: number | null
          rtp: number | null
          rua: number | null
          ruh: number | null
          ruw: number | null
          rw: number | null
          sce: number | null
          scs: number | null
          sire_naab: string | null
          ssb: number | null
          sta: number | null
          str: number | null
          tpi: number | null
          ucl: number | null
          udc: number | null
          udp: number | null
          updated_at: string | null
        }[]
      }
      get_farm_dashboard: {
        Args: { farm_uuid: string }
        Returns: {
          avg_hhp_dollar: number
          avg_nm_dollar: number
          avg_tpi: number
          donor_females: number
          donor_percentage: number
          farm_id: string
          farm_name: string
          inter_females: number
          inter_percentage: number
          owner_name: string
          recipient_females: number
          recipient_percentage: number
          selected_bulls: number
          total_females: number
          total_matings: number
          total_predictions: number
          total_semen_doses: number
        }[]
      }
      get_farm_dashboard_kpis: {
        Args: { target_farm_id?: string }
        Returns: {
          avg_hhp_dollar: number | null
          avg_nm_dollar: number | null
          avg_tpi: number | null
          donor_females: number | null
          donor_percentage: number | null
          farm_created_at: string | null
          farm_id: string | null
          farm_name: string | null
          farm_updated_at: string | null
          inter_females: number | null
          inter_percentage: number | null
          last_female_added: string | null
          last_mating_date: string | null
          last_movement_date: string | null
          last_prediction_date: string | null
          owner_name: string | null
          recipient_females: number | null
          recipient_percentage: number | null
          selected_bulls: number | null
          total_females: number | null
          total_matings: number | null
          total_predictions: number | null
          total_semen_doses: number | null
        }[]
      }
      get_females_denorm: {
        Args: { target_farm_id?: string }
        Returns: {
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          category: string | null
          ccr: number | null
          cdcb_id: string | null
          cfp: number | null
          cm_dollar: number | null
          created_at: string | null
          da: number | null
          dce: number | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          efc: number | null
          f_sav: number | null
          farm_id: string | null
          fi: number | null
          flc: number | null
          fls: number | null
          fm_dollar: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string | null
          identifier: string | null
          kappa_casein: string | null
          ket: number | null
          last_prediction_confidence: number | null
          last_prediction_date: string | null
          last_prediction_method:
            | Database["public"]["Enums"]["prediction_method"]
            | null
          last_prediction_value: number | null
          liv: number | null
          mast: number | null
          met: number | null
          mf: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string | null
          nm_dollar: number | null
          parity_order: number | null
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
          ptat: number | null
          rfi: number | null
          rlr: number | null
          rls: number | null
          rp: number | null
          rtp: number | null
          rua: number | null
          ruh: number | null
          ruw: number | null
          rw: number | null
          sce: number | null
          scs: number | null
          segmentation_class:
            | Database["public"]["Enums"]["segmentation_class"]
            | null
          segmentation_score: number | null
          sire_naab: string | null
          ssb: number | null
          sta: number | null
          str: number | null
          tpi: number | null
          ucl: number | null
          udc: number | null
          udp: number | null
          updated_at: string | null
        }[]
      }
      get_pta_trend_and_stats: {
        Args: {
          farm_id: string
          trait_keys: string[]
        }
        Returns: {
          trait: string | null
          column_name: string | null
          yearly:
            | {
                year: number | null
                mean: number | null
                n: number | null
              }[]
            | null
          stats:
            | {
                mean: number | null
                median: number | null
                min: number | null
                max: number | null
                sd: number | null
                n: number | null
              }
            | null
        }[]
      }
      get_semen_inventory: {
        Args: { target_farm_id?: string }
        Returns: {
          balance: number | null
          bull_id: string | null
          bull_naab: string | null
          bull_name: string | null
          farm_id: string | null
          last_movement_date: string | null
          semen_type: Database["public"]["Enums"]["semen_type"] | null
          total_movements: number | null
        }[]
      }
      is_farm_member: {
        Args: { farm_uuid: string }
        Returns: boolean
      }
      is_farm_owner: {
        Args: { farm_uuid: string }
        Returns: boolean
      }
      my_farms: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          farm_id: string
          farm_name: string
          is_default: boolean
          my_role: string
          owner_name: string
          selected_bulls: number
          total_females: number
        }[]
      }
      normalize_naab: {
        Args: { input_naab: string }
        Returns: string
      }
      remove_bull_from_farm: {
        Args: { bull_uuid: string; farm_uuid: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      search_bulls: {
        Args: { limit_count?: number; q: string }
        Returns: {
          bull_id: string
          code: string
          name: string
          ptas: Json
        }[]
      }
      set_default_farm: {
        Args: { farm_uuid: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      soundex: {
        Args: { "": string }
        Returns: string
      }
      text_soundex: {
        Args: { "": string }
        Returns: string
      }
      validate_naab: {
        Args: { naab: string }
        Returns: {
          bull_id: string
          code: string
          is_valid: boolean
          message: string
        }[]
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
