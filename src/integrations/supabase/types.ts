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
      audit_step3_pta_yearly: {
        Row: {
          ano: number | null
          farm_id: string | null
          n_animais: number | null
          pta_media: number | null
          tipo_pta: string | null
        }
        Insert: {
          ano?: number | null
          farm_id?: string | null
          n_animais?: number | null
          pta_media?: number | null
          tipo_pta?: string | null
        }
        Update: {
          ano?: number | null
          farm_id?: string | null
          n_animais?: number | null
          pta_media?: number | null
          tipo_pta?: string | null
        }
        Relationships: []
      }
      bulls: {
        Row: {
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          ccr: number | null
          cfp: number | null
          cm_dollar: number | null
          code: string
          code_normalized: string | null
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
          gl: number | null
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
          code_normalized?: string | null
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
          gl?: number | null
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
          code_normalized?: string | null
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
          gl?: number | null
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
      bulls_import_log: {
        Row: {
          committed_at: string | null
          id: number
          import_batch_id: string
          inserted: number | null
          invalid_rows: number
          meta: Json | null
          skipped: number | null
          started_at: string | null
          total_rows: number
          updated: number | null
          uploader_user_id: string
          valid_rows: number
        }
        Insert: {
          committed_at?: string | null
          id?: number
          import_batch_id: string
          inserted?: number | null
          invalid_rows: number
          meta?: Json | null
          skipped?: number | null
          started_at?: string | null
          total_rows: number
          updated?: number | null
          uploader_user_id: string
          valid_rows: number
        }
        Update: {
          committed_at?: string | null
          id?: number
          import_batch_id?: string
          inserted?: number | null
          invalid_rows?: number
          meta?: Json | null
          skipped?: number | null
          started_at?: string | null
          total_rows?: number
          updated?: number | null
          uploader_user_id?: string
          valid_rows?: number
        }
        Relationships: []
      }
      bulls_import_staging: {
        Row: {
          created_at: string | null
          errors: Json | null
          id: number
          import_batch_id: string
          is_valid: boolean | null
          mapped_row: Json | null
          processed_at: string | null
          raw_row: Json
          row_number: number
          uploader_user_id: string
        }
        Insert: {
          created_at?: string | null
          errors?: Json | null
          id?: number
          import_batch_id: string
          is_valid?: boolean | null
          mapped_row?: Json | null
          processed_at?: string | null
          raw_row: Json
          row_number: number
          uploader_user_id: string
        }
        Update: {
          created_at?: string | null
          errors?: Json | null
          id?: number
          import_batch_id?: string
          is_valid?: boolean | null
          mapped_row?: Json | null
          processed_at?: string | null
          raw_row?: Json
          row_number?: number
          uploader_user_id?: string
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
      error_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          status: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          status?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          status?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
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
            foreignKeyName: "farm_bull_picks_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls_denorm_member"
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
          staging_raw_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          metadata?: Json | null
          name: string
          owner_name: string
          staging_raw_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          metadata?: Json | null
          name?: string
          owner_name?: string
          staging_raw_id?: string | null
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
          {
            foreignKeyName: "female_segmentations_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females_public_by_farm_view"
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
          fonte: string | null
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
          fonte?: string | null
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
          fonte?: string | null
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
          {
            foreignKeyName: "genetic_predictions_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females_public_by_farm_view"
            referencedColumns: ["id"]
          },
        ]
      }
      genetic_records: {
        Row: {
          animal_id: string
          beta_casein: string | null
          bull_name: string | null
          bwc: number | null
          ccr: number | null
          cdcb_id: string
          cfp: number | null
          cm$: number | null
          created_at: string | null
          da: number | null
          dce: number | null
          dfm: number | null
          dob: string | null
          dpr: number | null
          dsb: number | null
          efc: number | null
          f_sav: number | null
          fi: number | null
          flc: number | null
          fls: number | null
          fm$: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gl: number | null
          gm$: number | null
          h_liv: number | null
          hcr: number | null
          herd_id: string
          hhp$: number | null
          kappa_casein: string | null
          ket: number | null
          liv: number | null
          mast: number | null
          met: number | null
          mf: number | null
          naab: string | null
          nm$: number | null
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
          ptat: number | null
          reg: string | null
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
          animal_id: string
          beta_casein?: string | null
          bull_name?: string | null
          bwc?: number | null
          ccr?: number | null
          cdcb_id: string
          cfp?: number | null
          cm$?: number | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dob?: string | null
          dpr?: number | null
          dsb?: number | null
          efc?: number | null
          f_sav?: number | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm$?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gl?: number | null
          gm$?: number | null
          h_liv?: number | null
          hcr?: number | null
          herd_id: string
          hhp$?: number | null
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          mf?: number | null
          naab?: string | null
          nm$?: number | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptat?: number | null
          reg?: string | null
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
          animal_id?: string
          beta_casein?: string | null
          bull_name?: string | null
          bwc?: number | null
          ccr?: number | null
          cdcb_id?: string
          cfp?: number | null
          cm$?: number | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dob?: string | null
          dpr?: number | null
          dsb?: number | null
          efc?: number | null
          f_sav?: number | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm$?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gl?: number | null
          gm$?: number | null
          h_liv?: number | null
          hcr?: number | null
          herd_id?: string
          hhp$?: number | null
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          mf?: number | null
          naab?: string | null
          nm$?: number | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptat?: number | null
          reg?: string | null
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
            foreignKeyName: "genetic_records_herd_id_fkey"
            columns: ["herd_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
          {
            foreignKeyName: "genetic_records_herd_id_fkey"
            columns: ["herd_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      header_aliases_bulls: {
        Row: {
          alias_pattern: string
          canonical: string
          created_at: string | null
          example: string | null
          id: number
        }
        Insert: {
          alias_pattern: string
          canonical: string
          created_at?: string | null
          example?: string | null
          id?: number
        }
        Update: {
          alias_pattern?: string
          canonical?: string
          created_at?: string | null
          example?: string | null
          id?: number
        }
        Relationships: []
      }
      import_staging_females: {
        Row: {
          birth_date: string | null
          category: string | null
          cdcb_id: string | null
          cm_dollar: number | null
          created_at: string | null
          farm_id: string | null
          farm_name: string | null
          fm_dollar: number | null
          fonte: string | null
          gm_dollar: number | null
          hhp_dollar: number | null
          identifier: string | null
          imported_at: string | null
          metadata: Json | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string | null
          nm_dollar: number | null
          numero_registro: string | null
          parity_order: string | null
          ptas: Json | null
          raw_id: string | null
          raw_row_number: number | null
          sire_naab: string | null
          technician_email: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          category?: string | null
          cdcb_id?: string | null
          cm_dollar?: number | null
          created_at?: string | null
          farm_id?: string | null
          farm_name?: string | null
          fm_dollar?: number | null
          fonte?: string | null
          gm_dollar?: number | null
          hhp_dollar?: number | null
          identifier?: string | null
          imported_at?: string | null
          metadata?: Json | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: number | null
          numero_registro?: string | null
          parity_order?: string | null
          ptas?: Json | null
          raw_id?: string | null
          raw_row_number?: number | null
          sire_naab?: string | null
          technician_email?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          category?: string | null
          cdcb_id?: string | null
          cm_dollar?: number | null
          created_at?: string | null
          farm_id?: string | null
          farm_name?: string | null
          fm_dollar?: number | null
          fonte?: string | null
          gm_dollar?: number | null
          hhp_dollar?: number | null
          identifier?: string | null
          imported_at?: string | null
          metadata?: Json | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: number | null
          numero_registro?: string | null
          parity_order?: string | null
          ptas?: Json | null
          raw_id?: string | null
          raw_row_number?: number | null
          sire_naab?: string | null
          technician_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
            foreignKeyName: "matings_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls_denorm_member"
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
          {
            foreignKeyName: "matings_female_id_fkey"
            columns: ["female_id"]
            isOneToOne: false
            referencedRelation: "females_public_by_farm_view"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_log: {
        Row: {
          email: string
          id: string
          notes: string | null
          reset_at: string | null
          reset_by: string | null
          user_id: string | null
        }
        Insert: {
          email: string
          id?: string
          notes?: string | null
          reset_at?: string | null
          reset_by?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          notes?: string | null
          reset_at?: string | null
          reset_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          default_farm_id: string | null
          email: string | null
          full_name: string
          id: string
          is_admin: boolean | null
          temporary_password: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_farm_id?: string | null
          email?: string | null
          full_name: string
          id: string
          is_admin?: boolean | null
          temporary_password?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_farm_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean | null
          temporary_password?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      satisfaction_surveys: {
        Row: {
          appearance_rating: number
          charts_rating: number
          clarity_rating: number
          created_at: string
          feedback: string | null
          id: string
          overall_rating: number
          user_id: string | null
        }
        Insert: {
          appearance_rating: number
          charts_rating: number
          clarity_rating: number
          created_at?: string
          feedback?: string | null
          id?: string
          overall_rating: number
          user_id?: string | null
        }
        Update: {
          appearance_rating?: number
          charts_rating?: number
          clarity_rating?: number
          created_at?: string
          feedback?: string | null
          id?: string
          overall_rating?: number
          user_id?: string | null
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
            foreignKeyName: "semen_movements_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls_denorm_member"
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
      staging_bulls: {
        Row: {
          beta_casein: string | null
          birth_date: string | null
          bwc: string | null
          ccr: string | null
          cfp: string | null
          cm_dollar: string | null
          code: string | null
          company: string | null
          created_at: string | null
          da: string | null
          dce: string | null
          dfm: string | null
          dpr: string | null
          dsb: string | null
          f_sav: string | null
          fi: string | null
          flc: string | null
          fls: string | null
          fm_dollar: string | null
          fta: string | null
          ftl: string | null
          ftp: string | null
          fua: string | null
          gfi: string | null
          gm_dollar: string | null
          h_liv: string | null
          hcr: string | null
          hhp_dollar: string | null
          id: string | null
          kappa_casein: string | null
          ket: string | null
          liv: string | null
          mast: string | null
          met: string | null
          mf: string | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string | null
          nm_dollar: string | null
          pedigree: string | null
          pl: string | null
          ptaf: string | null
          ptaf_pct: string | null
          ptam: string | null
          ptap: string | null
          ptap_pct: string | null
          ptas: string | null
          ptat: string | null
          registration: string | null
          rfi: string | null
          rlr: string | null
          rls: string | null
          rp: string | null
          rtp: string | null
          rua: string | null
          ruh: string | null
          ruw: string | null
          rw: string | null
          sce: string | null
          scs: string | null
          sire_naab: string | null
          ssb: string | null
          sta: string | null
          str: string | null
          tpi: string | null
          ucl: string | null
          udc: string | null
          udp: string | null
          updated_at: string | null
        }
        Insert: {
          beta_casein?: string | null
          birth_date?: string | null
          bwc?: string | null
          ccr?: string | null
          cfp?: string | null
          cm_dollar?: string | null
          code?: string | null
          company?: string | null
          created_at?: string | null
          da?: string | null
          dce?: string | null
          dfm?: string | null
          dpr?: string | null
          dsb?: string | null
          f_sav?: string | null
          fi?: string | null
          flc?: string | null
          fls?: string | null
          fm_dollar?: string | null
          fta?: string | null
          ftl?: string | null
          ftp?: string | null
          fua?: string | null
          gfi?: string | null
          gm_dollar?: string | null
          h_liv?: string | null
          hcr?: string | null
          hhp_dollar?: string | null
          id?: string | null
          kappa_casein?: string | null
          ket?: string | null
          liv?: string | null
          mast?: string | null
          met?: string | null
          mf?: string | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: string | null
          pedigree?: string | null
          pl?: string | null
          ptaf?: string | null
          ptaf_pct?: string | null
          ptam?: string | null
          ptap?: string | null
          ptap_pct?: string | null
          ptas?: string | null
          ptat?: string | null
          registration?: string | null
          rfi?: string | null
          rlr?: string | null
          rls?: string | null
          rp?: string | null
          rtp?: string | null
          rua?: string | null
          ruh?: string | null
          ruw?: string | null
          rw?: string | null
          sce?: string | null
          scs?: string | null
          sire_naab?: string | null
          ssb?: string | null
          sta?: string | null
          str?: string | null
          tpi?: string | null
          ucl?: string | null
          udc?: string | null
          udp?: string | null
          updated_at?: string | null
        }
        Update: {
          beta_casein?: string | null
          birth_date?: string | null
          bwc?: string | null
          ccr?: string | null
          cfp?: string | null
          cm_dollar?: string | null
          code?: string | null
          company?: string | null
          created_at?: string | null
          da?: string | null
          dce?: string | null
          dfm?: string | null
          dpr?: string | null
          dsb?: string | null
          f_sav?: string | null
          fi?: string | null
          flc?: string | null
          fls?: string | null
          fm_dollar?: string | null
          fta?: string | null
          ftl?: string | null
          ftp?: string | null
          fua?: string | null
          gfi?: string | null
          gm_dollar?: string | null
          h_liv?: string | null
          hcr?: string | null
          hhp_dollar?: string | null
          id?: string | null
          kappa_casein?: string | null
          ket?: string | null
          liv?: string | null
          mast?: string | null
          met?: string | null
          mf?: string | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: string | null
          pedigree?: string | null
          pl?: string | null
          ptaf?: string | null
          ptaf_pct?: string | null
          ptam?: string | null
          ptap?: string | null
          ptap_pct?: string | null
          ptas?: string | null
          ptat?: string | null
          registration?: string | null
          rfi?: string | null
          rlr?: string | null
          rls?: string | null
          rp?: string | null
          rtp?: string | null
          rua?: string | null
          ruh?: string | null
          ruw?: string | null
          rw?: string | null
          sce?: string | null
          scs?: string | null
          sire_naab?: string | null
          ssb?: string | null
          sta?: string | null
          str?: string | null
          tpi?: string | null
          ucl?: string | null
          udc?: string | null
          udp?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staging_farms: {
        Row: {
          created_by_email: string | null
          imported_at: string | null
          metadata: Json | null
          name: string | null
          owner_name: string | null
          raw_id: string | null
          raw_row_number: number | null
        }
        Insert: {
          created_by_email?: string | null
          imported_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner_name?: string | null
          raw_id?: string | null
          raw_row_number?: number | null
        }
        Update: {
          created_by_email?: string | null
          imported_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner_name?: string | null
          raw_id?: string | null
          raw_row_number?: number | null
        }
        Relationships: []
      }
      staging_females: {
        Row: {
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          category: string | null
          ccr: number | null
          cdcb_id: string | null
          cfp: number | null
          cm_dollar: number | null
          code_normalized: string | null
          created_at: string | null
          da: number | null
          dce: number | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          farm_id: string | null
          farm_name: string | null
          fi: number | null
          flc: number | null
          fls: number | null
          fm_dollar: number | null
          fonte: string | null
          fsav: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          hcr: number | null
          hhp_dollar: number | null
          hliv: number | null
          identifier: string | null
          imported_at: string | null
          kappa_casein: string | null
          ket: number | null
          liv: number | null
          mast: number | null
          met: number | null
          metadata: Json | null
          mf: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string | null
          nm_dollar: number | null
          numero_registro: string | null
          parity_order: string | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
          ptas: Json | null
          ptat: number | null
          raw_id: string | null
          raw_row_number: number | null
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
          technician_email: string | null
          tpi: number | null
          ucl: number | null
          udc: number | null
          udp: number | null
          updated_at: string | null
          vp: number | null
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
          code_normalized?: string | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          farm_id?: string | null
          farm_name?: string | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm_dollar?: number | null
          fonte?: string | null
          fsav?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          hliv?: number | null
          identifier?: string | null
          imported_at?: string | null
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          metadata?: Json | null
          mf?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: number | null
          numero_registro?: string | null
          parity_order?: string | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptas?: Json | null
          ptat?: number | null
          raw_id?: string | null
          raw_row_number?: number | null
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
          technician_email?: string | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
          updated_at?: string | null
          vp?: number | null
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
          code_normalized?: string | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          farm_id?: string | null
          farm_name?: string | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fm_dollar?: number | null
          fonte?: string | null
          fsav?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          hliv?: number | null
          identifier?: string | null
          imported_at?: string | null
          kappa_casein?: string | null
          ket?: number | null
          liv?: number | null
          mast?: number | null
          met?: number | null
          metadata?: Json | null
          mf?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: number | null
          numero_registro?: string | null
          parity_order?: string | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
          ptas?: Json | null
          ptat?: number | null
          raw_id?: string | null
          raw_row_number?: number | null
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
          technician_email?: string | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
          updated_at?: string | null
          vp?: number | null
        }
        Relationships: []
      }
      staging_import_log: {
        Row: {
          completed_at: string | null
          error_details: Json | null
          executed_by: string | null
          farms_errors: number | null
          farms_inserted: number | null
          farms_updated: number | null
          females_errors: number | null
          females_inserted: number | null
          females_updated: number | null
          id: string
          profiles_errors: number | null
          profiles_inserted: number | null
          profiles_updated: number | null
          started_at: string | null
          status: string | null
          strategy_used: string | null
          summary: Json | null
        }
        Insert: {
          completed_at?: string | null
          error_details?: Json | null
          executed_by?: string | null
          farms_errors?: number | null
          farms_inserted?: number | null
          farms_updated?: number | null
          females_errors?: number | null
          females_inserted?: number | null
          females_updated?: number | null
          id?: string
          profiles_errors?: number | null
          profiles_inserted?: number | null
          profiles_updated?: number | null
          started_at?: string | null
          status?: string | null
          strategy_used?: string | null
          summary?: Json | null
        }
        Update: {
          completed_at?: string | null
          error_details?: Json | null
          executed_by?: string | null
          farms_errors?: number | null
          farms_inserted?: number | null
          farms_updated?: number | null
          females_errors?: number | null
          females_inserted?: number | null
          females_updated?: number | null
          id?: string
          profiles_errors?: number | null
          profiles_inserted?: number | null
          profiles_updated?: number | null
          started_at?: string | null
          status?: string | null
          strategy_used?: string | null
          summary?: Json | null
        }
        Relationships: []
      }
      staging_matches: {
        Row: {
          created_at: string | null
          id: string
          match_method: string | null
          match_score: number | null
          source_row_raw_id: string | null
          source_table: string
          target_row_id: string | null
          target_table: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_method?: string | null
          match_score?: number | null
          source_row_raw_id?: string | null
          source_table: string
          target_row_id?: string | null
          target_table: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_method?: string | null
          match_score?: number | null
          source_row_raw_id?: string | null
          source_table?: string
          target_row_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      staging_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          imported_at: string | null
          raw_data: Json | null
          raw_id: string | null
          technician_email: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          imported_at?: string | null
          raw_data?: Json | null
          raw_id?: string | null
          technician_email?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          imported_at?: string | null
          raw_data?: Json | null
          raw_id?: string | null
          technician_email?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tenant_feature_flags: {
        Row: {
          tenant_id: string
          tutorials_enabled: boolean
          updated_at: string
        }
        Insert: {
          tenant_id: string
          tutorials_enabled?: boolean
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          tutorials_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      tutorial_defs: {
        Row: {
          created_at: string | null
          is_enabled: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          is_enabled?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          is_enabled?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tutorial_defs_backup_20251013_154446: {
        Row: {
          created_at: string | null
          id: string | null
          is_enabled: boolean | null
          slug: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_enabled?: boolean | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_enabled?: boolean | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
      }
      tutorial_steps: {
        Row: {
          anchor: string
          body: string
          created_at: string | null
          done_label: string | null
          headline: string
          id: string
          next_label: string | null
          prev_label: string | null
          step_order: number
          tutorial_slug: string
        }
        Insert: {
          anchor: string
          body: string
          created_at?: string | null
          done_label?: string | null
          headline: string
          id?: string
          next_label?: string | null
          prev_label?: string | null
          step_order: number
          tutorial_slug: string
        }
        Update: {
          anchor?: string
          body?: string
          created_at?: string | null
          done_label?: string | null
          headline?: string
          id?: string
          next_label?: string | null
          prev_label?: string | null
          step_order?: number
          tutorial_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_steps_tutorial_slug_fkey"
            columns: ["tutorial_slug"]
            isOneToOne: false
            referencedRelation: "tutorial_defs"
            referencedColumns: ["slug"]
          },
        ]
      }
      tutorial_steps_backup_20251013_154446: {
        Row: {
          anchor: string | null
          body: string | null
          created_at: string | null
          done_label: string | null
          enabled: boolean | null
          headline: string | null
          id: string | null
          next_label: string | null
          prev_label: string | null
          slug: string | null
          step_order: number | null
          tutorial_slug: string | null
        }
        Insert: {
          anchor?: string | null
          body?: string | null
          created_at?: string | null
          done_label?: string | null
          enabled?: boolean | null
          headline?: string | null
          id?: string | null
          next_label?: string | null
          prev_label?: string | null
          slug?: string | null
          step_order?: number | null
          tutorial_slug?: string | null
        }
        Update: {
          anchor?: string | null
          body?: string | null
          created_at?: string | null
          done_label?: string | null
          enabled?: boolean | null
          headline?: string | null
          id?: string | null
          next_label?: string | null
          prev_label?: string | null
          slug?: string | null
          step_order?: number | null
          tutorial_slug?: string | null
        }
        Relationships: []
      }
      tutorial_user_progress: {
        Row: {
          created_at: string | null
          current_step: number | null
          id: string
          is_completed: boolean | null
          tenant_id: string
          tutorial_slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_completed?: boolean | null
          tenant_id: string
          tutorial_slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_step?: number | null
          id?: string
          is_completed?: boolean | null
          tenant_id?: string
          tutorial_slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_user_progress_tutorial_slug_fkey"
            columns: ["tutorial_slug"]
            isOneToOne: false
            referencedRelation: "tutorial_defs"
            referencedColumns: ["slug"]
          },
        ]
      }
      tutorial_user_progress_backup_20251013_154446: {
        Row: {
          current_step: number | null
          id: string | null
          is_completed: boolean | null
          tenant_id: string | null
          tutorial_slug: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_step?: number | null
          id?: string | null
          is_completed?: boolean | null
          tenant_id?: string | null
          tutorial_slug?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_step?: number | null
          id?: string | null
          is_completed?: boolean | null
          tenant_id?: string | null
          tutorial_slug?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      upload_audit: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          name: string | null
          object_id: string | null
          owner_id: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          object_id?: string | null
          owner_id?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          object_id?: string | null
          owner_id?: string | null
        }
        Relationships: []
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
      admin_temp_passwords: {
        Row: {
          auth_email: string | null
          email: string | null
          full_name: string | null
          id: string | null
          temporary_password: string | null
        }
        Relationships: []
      }
      ag_pta_media_anual: {
        Row: {
          ano: number | null
          farm_id: string | null
          media_anual: number | null
          tipo_pta: string | null
        }
        Relationships: []
      }
      ag_pta_ponderada_anual: {
        Row: {
          ano: number | null
          farm_id: string | null
          media_ponderada_ano: number | null
          n_total_ano: number | null
          tipo_pta: string | null
        }
        Relationships: []
      }
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
      bulls_denorm_member: {
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
      farm_technicians: {
        Row: {
          assigned_at: string | null
          farm_id: string | null
          farm_name: string | null
          technician_email: string | null
          technician_id: string | null
          technician_name: string | null
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
          fonte: string | null
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
      females_public_by_farm_view: {
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
          fonte: string | null
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
            foreignKeyName: "semen_movements_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "bulls_denorm_member"
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
      ag_age_group:
        | { Args: { p_birth_ts: string; p_parity: number }; Returns: string }
        | { Args: { p_birth_date: string; p_parity: number }; Returns: string }
        | { Args: { p_birth_tstz: string; p_parity: number }; Returns: string }
      ag_boxplot_stats: {
        Args: { p_farm: string; p_trait: string }
        Returns: {
          n: number
          p0: number
          p100: number
          p25: number
          p50: number
          p75: number
          trait_key: string
        }[]
      }
      ag_col_exists: { Args: { p_col: string }; Returns: boolean }
      ag_farm_trait_coverage: {
        Args: { p_farm: string; p_traits: string[] }
        Returns: {
          coverage_pct: number
          n_total: number
          n_with_value: number
          trait_key: string
        }[]
      }
      ag_genetic_benchmark: {
        Args: {
          p_farm: string
          p_region?: string
          p_top?: number
          p_traits: string[]
        }
        Returns: {
          benchmark_avg: number
          benchmark_top: number
          farm_value: number
          trait_key: string
        }[]
      }
      ag_get_pta_media_anual: {
        Args: { p_farm_id: string; p_tipo_pta: string }
        Returns: {
          ano: number
          intercept: number
          media_anual: number
          media_geral: number
          r2: number
          slope: number
        }[]
      }
      ag_get_pta_series: {
        Args: { p_farm_id: string; p_tipo_pta: string }
        Returns: {
          ano: number
          intercept: number
          media_geral: number
          media_ponderada_ano: number
          n_total_ano: number
          r2: number
          slope: number
        }[]
      }
      ag_is_numeric: { Args: { p: string }; Returns: boolean }
      ag_linear_means: {
        Args: {
          p_farm: string
          p_mode: string
          p_normalize: boolean
          p_scope: string
          p_scope_id: string
          p_traits: string[]
        }
        Returns: {
          group_label: string
          mean_value: number
          n: number
          trait_key: string
        }[]
      }
      ag_mean_generic: {
        Args: { p_col: string; p_farm: string; p_year?: number }
        Returns: number
      }
      ag_parentage_overview: {
        Args: { p_farm: string }
        Returns: {
          n: number
          pct: number
          role: string
          status: string
        }[]
      }
      ag_parentesco_relacao_ano: {
        Args: {
          p_farm: string
          p_relacao: string
          p_year_from?: number
          p_year_to?: number
        }
        Returns: {
          birth_year: number
          pct: number
          status: string
          total: number
        }[]
      }
      ag_parentesco_triad: {
        Args: { p_farm: string; p_year_from?: number; p_year_to?: number }
        Returns: {
          pct: number
          status: string
          total: number
        }[]
      }
      ag_percentile_disc: {
        Args: { p: number; p_farm: string; p_index: string; p_scope: string }
        Returns: number
      }
      ag_pick_col: { Args: { p_candidates: string[] }; Returns: string }
      ag_progress_compare: {
        Args: { p_farm: string; p_grouping: string; p_traits: string[] }
        Returns: {
          group_label: string
          n_years: number
          slope_per_year: number
          trait_key: string
        }[]
      }
      ag_quartis_indices_compare: {
        Args: {
          p_farm: string
          p_index_a: string
          p_index_b: string
          p_traits: string[]
        }
        Returns: {
          group_label: string
          index_label: string
          mean_value: number
          n: number
          trait_key: string
        }[]
      }
      ag_quartis_overview: {
        Args: { p_farm: string; p_index: string; p_traits: string[] }
        Returns: {
          group_label: string
          mean_value: number
          n: number
          trait_key: string
        }[]
      }
      ag_top_parents: {
        Args: {
          p_age_filter: string
          p_farm: string
          p_limit: number
          p_order_trait: string
          p_parent_type: string
          p_year_from: number
          p_year_to: number
        }
        Returns: {
          daughters_count: number
          parent_label: string
          trait_mean: number
        }[]
      }
      ag_trait_histogram: {
        Args: { p_bins?: number; p_farm: string; p_trait: string }
        Returns: {
          bin_count: number
          bin_from: number
          bin_to: number
        }[]
      }
      can_access_farm: { Args: { farm_uuid: string }; Returns: boolean }
      can_edit_farm: { Args: { farm_uuid: string }; Returns: boolean }
      create_farm_basic: {
        Args: { farm_metadata?: Json; farm_name: string; owner_name: string }
        Returns: {
          farm_id: string
          message: string
          success: boolean
        }[]
      }
      daitch_mokotoff: { Args: { "": string }; Returns: string[] }
      delete_farm: {
        Args: { farm_uuid: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      dmetaphone: { Args: { "": string }; Returns: string }
      dmetaphone_alt: { Args: { "": string }; Returns: string }
      females_public_by_farm: {
        Args: { farm_uuid: string }
        Returns: {
          like: Database["public"]["Views"]["females_denorm"]["Row"]
        }[]
        SetofOptions: {
          from: "*"
          to: "females_denorm"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_temp_password: {
        Args: { profile_index: number }
        Returns: string
      }
      get_bull_by_naab: {
        Args: { naab: string }
        Returns: {
          bull_id: string
          bwc: number
          ccr: number
          cfp: number
          cm_dollar: number
          code: string
          company: string
          da: number
          dce: number
          dfm: number
          dpr: number
          dsb: number
          f_sav: number
          fi: number
          flc: number
          fls: number
          fm_dollar: number
          found: boolean
          fta: number
          ftl: number
          ftp: number
          fua: number
          gfi: number
          gm_dollar: number
          h_liv: number
          hcr: number
          hhp_dollar: number
          ket: number
          liv: number
          mast: number
          met: number
          mf: number
          name: string
          nm_dollar: number
          pl: number
          ptaf: number
          ptaf_pct: number
          ptam: number
          ptap: number
          ptap_pct: number
          ptat: number
          rfi: number
          rlr: number
          rls: number
          rp: number
          rtp: number
          rua: number
          ruh: number
          ruw: number
          rw: number
          sce: number
          scs: number
          ssb: number
          sta: number
          str: number
          tpi: number
          ucl: number
          udc: number
          udp: number
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
        Args: never
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
        SetofOptions: {
          from: "*"
          to: "bulls_denorm"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "*"
          to: "farm_dashboard_kpis"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_females_denorm: {
        Args: { p_limit?: number; p_offset?: number; target_farm_id: string }
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
          fonte: string | null
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
        SetofOptions: {
          from: "*"
          to: "females_denorm"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_females_denorm_debug: {
        Args: {
          debug_user_id: string
          p_limit?: number
          p_offset?: number
          target_farm_id: string
        }
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
          fonte: string | null
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
        SetofOptions: {
          from: "*"
          to: "females_denorm"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "*"
          to: "semen_inventory"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_farm_membership: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_farm_editor: { Args: { farm_uuid: string }; Returns: boolean }
      is_farm_member:
        | { Args: { p_farm: string; p_user: string }; Returns: boolean }
        | { Args: { farm_uuid: string }; Returns: boolean }
      is_farm_owner: { Args: { farm_uuid: string }; Returns: boolean }
      is_farm_technician: { Args: { farm_uuid: string }; Returns: boolean }
      is_jsonb: { Args: { "": string }; Returns: boolean }
      is_member_of_farm: { Args: { _farm_id: string }; Returns: boolean }
      my_farms: {
        Args: never
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
      normalize_naab: { Args: { input_naab: string }; Returns: string }
      normalize_text: { Args: { txt: string }; Returns: string }
      nx3_bulls_by_ids: {
        Args: { p_ids: string[]; p_trait: string }
        Returns: {
          id: string
          trait_value: number
        }[]
      }
      nx3_bulls_by_ids_text: {
        Args: { p_ids: string[]; p_trait: string }
        Returns: {
          id: string
          trait_value: number
        }[]
      }
      nx3_bulls_lookup: {
        Args: { p_limit?: number; p_query: string; p_trait: string }
        Returns: {
          code: string
          id: string
          name: string
          trait_value: number
        }[]
      }
      nx3_list_pta_traits: {
        Args: never
        Returns: {
          trait: string
        }[]
      }
      nx3_mothers_yearly_avg: {
        Args: { p_farm: string; p_trait: string }
        Returns: {
          avg_value: number
          birth_year: number
        }[]
      }
      nx3_normalize_trait: { Args: { p_trait: string }; Returns: string }
      parse_flexible_date: { Args: { date_str: string }; Returns: string }
      parse_staging_date: { Args: { date_str: string }; Returns: string }
      remove_bull_from_farm: {
        Args: { bull_uuid: string; farm_uuid: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      safe_females_public_by_farm: {
        Args: { farm_uuid: string }
        Returns: {
          beta_casein: string
          birth_date: string
          bwc: number
          category: string
          ccr: number
          cdcb_id: string
          cfp: number
          cm_dollar: number
          created_at: string
          da: number
          dce: number
          dfm: number
          dpr: number
          dsb: number
          efc: number
          f_sav: number
          farm_id: string
          fi: number
          flc: number
          fls: number
          fm_dollar: number
          fonte: string
          fta: number
          ftl: number
          ftp: number
          fua: number
          gfi: number
          gl: number
          gm_dollar: number
          h_liv: number
          hcr: number
          hhp_dollar: number
          id: string
          identifier: string
          kappa_casein: string
          ket: number
          last_prediction_confidence: number
          last_prediction_date: string
          last_prediction_method: string
          last_prediction_value: number
          liv: number
          mast: number
          met: number
          mf: number
          mgs_naab: string
          mmgs_naab: string
          name: string
          nm_dollar: number
          parity_order: number
          pl: number
          ptaf: number
          ptaf_pct: number
          ptam: number
          ptap: number
          ptap_pct: number
          ptat: number
          rfi: number
          rlr: number
          rls: number
          rp: number
          rtp: number
          rua: number
          ruh: number
          ruw: number
          rw: number
          sce: number
          scs: number
          segmentation_class: string
          segmentation_score: number
          sire_naab: string
          ssb: number
          sta: number
          str: number
          tpi: number
          ucl: number
          udc: number
          udp: number
          updated_at: string
        }[]
      }
      search_bulls: {
        Args: { limit_count?: number; q: string }
        Returns: {
          bull_id: string
          bwc: number
          ccr: number
          cfp: number
          cm_dollar: number
          code: string
          company: string
          da: number
          dce: number
          dfm: number
          dpr: number
          dsb: number
          f_sav: number
          fi: number
          flc: number
          fls: number
          fm_dollar: number
          fta: number
          ftl: number
          ftp: number
          fua: number
          gfi: number
          gm_dollar: number
          h_liv: number
          hcr: number
          hhp_dollar: number
          ket: number
          liv: number
          mast: number
          met: number
          mf: number
          name: string
          nm_dollar: number
          pl: number
          ptaf: number
          ptaf_pct: number
          ptam: number
          ptap: number
          ptap_pct: number
          ptat: number
          rfi: number
          rlr: number
          rls: number
          rp: number
          rtp: number
          rua: number
          ruh: number
          ruw: number
          rw: number
          sce: number
          scs: number
          ssb: number
          sta: number
          str: number
          tpi: number
          ucl: number
          udc: number
          udp: number
        }[]
      }
      set_default_farm: {
        Args: { farm_uuid: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      soundex: { Args: { "": string }; Returns: string }
      storage_can_insert_object: {
        Args: { p_bucket_id: string; p_metadata: Json; p_owner_id: string }
        Returns: boolean
      }
      text_soundex: { Args: { "": string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
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
      farm_role: "owner" | "editor" | "viewer" | "technician"
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
      farm_role: ["owner", "editor", "viewer", "technician"],
      movement_type: ["entrada", "saida"],
      prediction_method: ["genomic", "pedigree", "blup"],
      segmentation_class: ["donor", "inter", "recipient"],
      semen_type: ["convencional", "sexado"],
    },
  },
} as const
