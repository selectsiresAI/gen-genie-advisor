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
      admin_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          key: string
          platform: Database["public"]["Enums"]["platform_type"] | null
          value: string | null
        }
        Insert: {
          key: string
          platform?: Database["public"]["Enums"]["platform_type"] | null
          value?: string | null
        }
        Update: {
          key?: string
          platform?: Database["public"]["Enums"]["platform_type"] | null
          value?: string | null
        }
        Relationships: []
      }
      bulls: {
        Row: {
          ativo: boolean
          beta_casein: string | null
          birth_date: string | null
          blad: string | null
          breed: string | null
          bvh: string | null
          bwc: number | null
          ccr_num: number | null
          cfp: number | null
          cheese_merit: number | null
          cm_dollar: number | null
          code_normalized: string | null
          company: string | null
          created_at: string
          cvm: string | null
          da: number | null
          dfm: number | null
          dsb: number | null
          dumps: string | null
          f_sav: number | null
          fi: number | null
          fls: number | null
          fluid_merit: number | null
          fm_dollar: number | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          grazing_merit: number | null
          h_liv: number | null
          hcr_num: number | null
          hhp_dollar: number | null
          id: string
          kappa_casein: string | null
          ket: number | null
          mast: number | null
          met: number | null
          mf: string | null
          mf_num: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          naab_code: string | null
          naab_code_alt: string | null
          name: string
          nm_dollar: number | null
          nmpf: number | null
          pedigree: string | null
          pta_bdc: number | null
          pta_ccr: number | null
          pta_dpr: number | null
          pta_fat: number | null
          pta_fat_pct: number | null
          pta_feet_legs: number | null
          pta_flc: number | null
          pta_hcr: number | null
          pta_livability: number | null
          pta_milk: number | null
          pta_pl: number | null
          pta_protein: number | null
          pta_protein_pct: number | null
          pta_ptat: number | null
          pta_sce: number | null
          pta_scs: number | null
          pta_sire_sce: number | null
          pta_type: number | null
          pta_udc: number | null
          pta_udder: number | null
          ptas: Json | null
          registration: string | null
          rel_fat: number | null
          rel_milk: number | null
          rel_protein: number | null
          rfi: number | null
          rlr: number | null
          rls: number | null
          rp: number | null
          rtp: number | null
          rua: number | null
          ruh: number | null
          ruw: number | null
          rw: number | null
          short_name: string | null
          sire_naab: string | null
          ssb: number | null
          sta: number | null
          str_num: number | null
          tpi: number | null
          ucl: number | null
          udp: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          beta_casein?: string | null
          birth_date?: string | null
          blad?: string | null
          breed?: string | null
          bvh?: string | null
          bwc?: number | null
          ccr_num?: number | null
          cfp?: number | null
          cheese_merit?: number | null
          cm_dollar?: number | null
          code_normalized?: string | null
          company?: string | null
          created_at?: string
          cvm?: string | null
          da?: number | null
          dfm?: number | null
          dsb?: number | null
          dumps?: string | null
          f_sav?: number | null
          fi?: number | null
          fls?: number | null
          fluid_merit?: number | null
          fm_dollar?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          grazing_merit?: number | null
          h_liv?: number | null
          hcr_num?: number | null
          hhp_dollar?: number | null
          id?: string
          kappa_casein?: string | null
          ket?: number | null
          mast?: number | null
          met?: number | null
          mf?: string | null
          mf_num?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          naab_code?: string | null
          naab_code_alt?: string | null
          name: string
          nm_dollar?: number | null
          nmpf?: number | null
          pedigree?: string | null
          pta_bdc?: number | null
          pta_ccr?: number | null
          pta_dpr?: number | null
          pta_fat?: number | null
          pta_fat_pct?: number | null
          pta_feet_legs?: number | null
          pta_flc?: number | null
          pta_hcr?: number | null
          pta_livability?: number | null
          pta_milk?: number | null
          pta_pl?: number | null
          pta_protein?: number | null
          pta_protein_pct?: number | null
          pta_ptat?: number | null
          pta_sce?: number | null
          pta_scs?: number | null
          pta_sire_sce?: number | null
          pta_type?: number | null
          pta_udc?: number | null
          pta_udder?: number | null
          ptas?: Json | null
          registration?: string | null
          rel_fat?: number | null
          rel_milk?: number | null
          rel_protein?: number | null
          rfi?: number | null
          rlr?: number | null
          rls?: number | null
          rp?: number | null
          rtp?: number | null
          rua?: number | null
          ruh?: number | null
          ruw?: number | null
          rw?: number | null
          short_name?: string | null
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          str_num?: number | null
          tpi?: number | null
          ucl?: number | null
          udp?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          beta_casein?: string | null
          birth_date?: string | null
          blad?: string | null
          breed?: string | null
          bvh?: string | null
          bwc?: number | null
          ccr_num?: number | null
          cfp?: number | null
          cheese_merit?: number | null
          cm_dollar?: number | null
          code_normalized?: string | null
          company?: string | null
          created_at?: string
          cvm?: string | null
          da?: number | null
          dfm?: number | null
          dsb?: number | null
          dumps?: string | null
          f_sav?: number | null
          fi?: number | null
          fls?: number | null
          fluid_merit?: number | null
          fm_dollar?: number | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          grazing_merit?: number | null
          h_liv?: number | null
          hcr_num?: number | null
          hhp_dollar?: number | null
          id?: string
          kappa_casein?: string | null
          ket?: number | null
          mast?: number | null
          met?: number | null
          mf?: string | null
          mf_num?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          naab_code?: string | null
          naab_code_alt?: string | null
          name?: string
          nm_dollar?: number | null
          nmpf?: number | null
          pedigree?: string | null
          pta_bdc?: number | null
          pta_ccr?: number | null
          pta_dpr?: number | null
          pta_fat?: number | null
          pta_fat_pct?: number | null
          pta_feet_legs?: number | null
          pta_flc?: number | null
          pta_hcr?: number | null
          pta_livability?: number | null
          pta_milk?: number | null
          pta_pl?: number | null
          pta_protein?: number | null
          pta_protein_pct?: number | null
          pta_ptat?: number | null
          pta_sce?: number | null
          pta_scs?: number | null
          pta_sire_sce?: number | null
          pta_type?: number | null
          pta_udc?: number | null
          pta_udder?: number | null
          ptas?: Json | null
          registration?: string | null
          rel_fat?: number | null
          rel_milk?: number | null
          rel_protein?: number | null
          rfi?: number | null
          rlr?: number | null
          rls?: number | null
          rp?: number | null
          rtp?: number | null
          rua?: number | null
          ruh?: number | null
          ruw?: number | null
          rw?: number | null
          short_name?: string | null
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          str_num?: number | null
          tpi?: number | null
          ucl?: number | null
          udp?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      bulls_import_log: {
        Row: {
          committed_at: string | null
          id: number
          import_batch_id: string | null
          inserted: number | null
          invalid_rows: number | null
          meta: Json | null
          skipped: number | null
          started_at: string | null
          total_rows: number | null
          updated: number | null
          uploader_user_id: string | null
          valid_rows: number | null
        }
        Insert: {
          committed_at?: string | null
          id?: never
          import_batch_id?: string | null
          inserted?: number | null
          invalid_rows?: number | null
          meta?: Json | null
          skipped?: number | null
          started_at?: string | null
          total_rows?: number | null
          updated?: number | null
          uploader_user_id?: string | null
          valid_rows?: number | null
        }
        Update: {
          committed_at?: string | null
          id?: never
          import_batch_id?: string | null
          inserted?: number | null
          invalid_rows?: number | null
          meta?: Json | null
          skipped?: number | null
          started_at?: string | null
          total_rows?: number | null
          updated?: number | null
          uploader_user_id?: string | null
          valid_rows?: number | null
        }
        Relationships: []
      }
      bulls_import_staging: {
        Row: {
          created_at: string | null
          errors: Json | null
          id: number
          import_batch_id: string | null
          is_valid: boolean | null
          mapped_row: Json | null
          processed_at: string | null
          raw_row: Json | null
          row_number: number | null
          uploader_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          errors?: Json | null
          id?: never
          import_batch_id?: string | null
          is_valid?: boolean | null
          mapped_row?: Json | null
          processed_at?: string | null
          raw_row?: Json | null
          row_number?: number | null
          uploader_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          errors?: Json | null
          id?: never
          import_batch_id?: string | null
          is_valid?: boolean | null
          mapped_row?: Json | null
          processed_at?: string | null
          raw_row?: Json | null
          row_number?: number | null
          uploader_user_id?: string | null
        }
        Relationships: []
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      clients: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          cod_ssb: string | null
          cod_ssgen: string | null
          coordenador_id: string | null
          cpf_cnpj: string | null
          created_at: string
          deleted_at: string | null
          endereco: string | null
          estado: string | null
          farm_name: string | null
          id: string
          ie_rg: string | null
          lat: number | null
          lon: number | null
          metadata: Json | null
          nome: string
          numero: string | null
          owner_name: string | null
          plataformas: Database["public"]["Enums"]["platform_type"][] | null
          representante_id: string | null
          status: string | null
          toolss_farm_id: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cod_ssb?: string | null
          cod_ssgen?: string | null
          coordenador_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          endereco?: string | null
          estado?: string | null
          farm_name?: string | null
          id?: string
          ie_rg?: string | null
          lat?: number | null
          lon?: number | null
          metadata?: Json | null
          nome: string
          numero?: string | null
          owner_name?: string | null
          plataformas?: Database["public"]["Enums"]["platform_type"][] | null
          representante_id?: string | null
          status?: string | null
          toolss_farm_id?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cod_ssb?: string | null
          cod_ssgen?: string | null
          coordenador_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          endereco?: string | null
          estado?: string | null
          farm_name?: string | null
          id?: string
          ie_rg?: string | null
          lat?: number | null
          lon?: number | null
          metadata?: Json | null
          nome?: string
          numero?: string | null
          owner_name?: string | null
          plataformas?: Database["public"]["Enums"]["platform_type"][] | null
          representante_id?: string | null
          status?: string | null
          toolss_farm_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_coordenador_id_fkey"
            columns: ["coordenador_id"]
            isOneToOne: false
            referencedRelation: "coordenadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "representantes"
            referencedColumns: ["id"]
          },
        ]
      }
      coordenador_representante: {
        Row: {
          coordenador_id: string
          created_at: string | null
          id: string
          representante_id: string
        }
        Insert: {
          coordenador_id: string
          created_at?: string | null
          id?: string
          representante_id: string
        }
        Update: {
          coordenador_id?: string
          created_at?: string | null
          id?: string
          representante_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordenador_representante_coordenador_id_fkey"
            columns: ["coordenador_id"]
            isOneToOne: false
            referencedRelation: "coordenadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordenador_representante_representante_id_fkey"
            columns: ["representante_id"]
            isOneToOne: false
            referencedRelation: "representantes"
            referencedColumns: ["id"]
          },
        ]
      }
      coordenadores: {
        Row: {
          ativo: boolean
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      error_reports: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_stack: string | null
          error_type: string | null
          id: string
          metadata: Json | null
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          error_stack?: string | null
          error_type?: string | null
          id?: string
          metadata?: Json | null
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          error_stack?: string | null
          error_type?: string | null
          id?: string
          metadata?: Json | null
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      farm_bull_picks: {
        Row: {
          added_by: string | null
          bull_id: string
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          bull_id: string
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          bull_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string
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
            foreignKeyName: "farm_bull_picks_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "plan_bulls_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_bull_picks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_bull_picks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      farm_index_settings: {
        Row: {
          active_index_key: string
          client_id: string
          created_at: string
          custom_weights: Json | null
          id: string
          quantiles: Json | null
          updated_at: string
        }
        Insert: {
          active_index_key: string
          client_id: string
          created_at?: string
          custom_weights?: Json | null
          id?: string
          quantiles?: Json | null
          updated_at?: string
        }
        Update: {
          active_index_key?: string
          client_id?: string
          created_at?: string
          custom_weights?: Json | null
          id?: string
          quantiles?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_index_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_index_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      farm_invites: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          created_at: string | null
          id: string
          invited_by: string | null
          invited_email: string
          role: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email: string
          role?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string
          role?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_invites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_invites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      farm_tanks: {
        Row: {
          capacity: number | null
          client_id: string
          created_at: string
          id: string
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          client_id: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          client_id?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_tanks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_tanks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      female_segmentations: {
        Row: {
          class: Database["public"]["Enums"]["segmentation_class"]
          client_id: string
          created_at: string
          female_id: string
          id: string
          parameters: Json | null
          score: number | null
        }
        Insert: {
          class: Database["public"]["Enums"]["segmentation_class"]
          client_id: string
          created_at?: string
          female_id: string
          id?: string
          parameters?: Json | null
          score?: number | null
        }
        Update: {
          class?: Database["public"]["Enums"]["segmentation_class"]
          client_id?: string
          created_at?: string
          female_id?: string
          id?: string
          parameters?: Json | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "female_segmentations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "female_segmentations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
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
          breed: string | null
          bwc: number | null
          category: string | null
          cdcb_id: string | null
          cfp: number | null
          cheese_merit: number | null
          client_id: string
          cm_dollar: number | null
          created_at: string
          da: number | null
          deleted_at: string | null
          dfm: number | null
          dsb: number | null
          ear_tag: string | null
          efc: number | null
          f_sav: number | null
          fi: number | null
          fls: number | null
          fluid_merit: number | null
          fm_dollar: number | null
          fonte: string | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          genomic_result_id: string | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          grazing_merit: number | null
          h_liv: number | null
          hhp_dollar: number | null
          id: string
          identifier: string | null
          kappa_casein: string | null
          ket: number | null
          mast: number | null
          met: number | null
          mf_num: number | null
          mgs_naab: string | null
          mmgs_naab: string | null
          name: string | null
          nm_dollar: number | null
          nmpf: number | null
          parity_order: number | null
          pta_bdc: number | null
          pta_ccr: number | null
          pta_dpr: number | null
          pta_fat: number | null
          pta_fat_pct: number | null
          pta_feet_legs: number | null
          pta_flc: number | null
          pta_hcr: number | null
          pta_livability: number | null
          pta_milk: number | null
          pta_pl: number | null
          pta_protein: number | null
          pta_protein_pct: number | null
          pta_ptat: number | null
          pta_sce: number | null
          pta_scs: number | null
          pta_sire_sce: number | null
          pta_type: number | null
          pta_udc: number | null
          pta_udder: number | null
          ptas: Json | null
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
          sire_naab: string | null
          ssb: number | null
          sta: number | null
          status: string | null
          str_num: number | null
          tpi: number | null
          ucl: number | null
          udp: number | null
          updated_at: string
        }
        Insert: {
          beta_casein?: string | null
          birth_date?: string | null
          breed?: string | null
          bwc?: number | null
          category?: string | null
          cdcb_id?: string | null
          cfp?: number | null
          cheese_merit?: number | null
          client_id: string
          cm_dollar?: number | null
          created_at?: string
          da?: number | null
          deleted_at?: string | null
          dfm?: number | null
          dsb?: number | null
          ear_tag?: string | null
          efc?: number | null
          f_sav?: number | null
          fi?: number | null
          fls?: number | null
          fluid_merit?: number | null
          fm_dollar?: number | null
          fonte?: string | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          genomic_result_id?: string | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          grazing_merit?: number | null
          h_liv?: number | null
          hhp_dollar?: number | null
          id?: string
          identifier?: string | null
          kappa_casein?: string | null
          ket?: number | null
          mast?: number | null
          met?: number | null
          mf_num?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: number | null
          nmpf?: number | null
          parity_order?: number | null
          pta_bdc?: number | null
          pta_ccr?: number | null
          pta_dpr?: number | null
          pta_fat?: number | null
          pta_fat_pct?: number | null
          pta_feet_legs?: number | null
          pta_flc?: number | null
          pta_hcr?: number | null
          pta_livability?: number | null
          pta_milk?: number | null
          pta_pl?: number | null
          pta_protein?: number | null
          pta_protein_pct?: number | null
          pta_ptat?: number | null
          pta_sce?: number | null
          pta_scs?: number | null
          pta_sire_sce?: number | null
          pta_type?: number | null
          pta_udc?: number | null
          pta_udder?: number | null
          ptas?: Json | null
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
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          status?: string | null
          str_num?: number | null
          tpi?: number | null
          ucl?: number | null
          udp?: number | null
          updated_at?: string
        }
        Update: {
          beta_casein?: string | null
          birth_date?: string | null
          breed?: string | null
          bwc?: number | null
          category?: string | null
          cdcb_id?: string | null
          cfp?: number | null
          cheese_merit?: number | null
          client_id?: string
          cm_dollar?: number | null
          created_at?: string
          da?: number | null
          deleted_at?: string | null
          dfm?: number | null
          dsb?: number | null
          ear_tag?: string | null
          efc?: number | null
          f_sav?: number | null
          fi?: number | null
          fls?: number | null
          fluid_merit?: number | null
          fm_dollar?: number | null
          fonte?: string | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          genomic_result_id?: string | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          grazing_merit?: number | null
          h_liv?: number | null
          hhp_dollar?: number | null
          id?: string
          identifier?: string | null
          kappa_casein?: string | null
          ket?: number | null
          mast?: number | null
          met?: number | null
          mf_num?: number | null
          mgs_naab?: string | null
          mmgs_naab?: string | null
          name?: string | null
          nm_dollar?: number | null
          nmpf?: number | null
          parity_order?: number | null
          pta_bdc?: number | null
          pta_ccr?: number | null
          pta_dpr?: number | null
          pta_fat?: number | null
          pta_fat_pct?: number | null
          pta_feet_legs?: number | null
          pta_flc?: number | null
          pta_hcr?: number | null
          pta_livability?: number | null
          pta_milk?: number | null
          pta_pl?: number | null
          pta_protein?: number | null
          pta_protein_pct?: number | null
          pta_ptat?: number | null
          pta_sce?: number | null
          pta_scs?: number | null
          pta_sire_sce?: number | null
          pta_type?: number | null
          pta_udc?: number | null
          pta_udder?: number | null
          ptas?: Json | null
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
          sire_naab?: string | null
          ssb?: number | null
          sta?: number | null
          status?: string | null
          str_num?: number | null
          tpi?: number | null
          ucl?: number | null
          udp?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "females_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "females_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
          {
            foreignKeyName: "females_genomic_result_id_fkey"
            columns: ["genomic_result_id"]
            isOneToOne: false
            referencedRelation: "genomic_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "females_genomic_result_id_fkey"
            columns: ["genomic_result_id"]
            isOneToOne: false
            referencedRelation: "ssgen_client_results"
            referencedColumns: ["id"]
          },
        ]
      }
      genomic_results: {
        Row: {
          animal_id: string | null
          blad: string | null
          bvh: string | null
          cheese_merit: number | null
          client_id: string
          created_at: string
          cvm: string | null
          data_nascimento: string | null
          dumps: string | null
          file_name: string | null
          file_path: string | null
          fluid_merit: number | null
          grazing_merit: number | null
          hhp_dollar: number | null
          id: string
          mf: string | null
          nmpf: number | null
          nome_animal: string | null
          pta_ccr: number | null
          pta_dpr: number | null
          pta_fat: number | null
          pta_fat_pct: number | null
          pta_feet_legs: number | null
          pta_hcr: number | null
          pta_livability: number | null
          pta_milk: number | null
          pta_pl: number | null
          pta_protein: number | null
          pta_protein_pct: number | null
          pta_sce: number | null
          pta_scs: number | null
          pta_sire_sce: number | null
          pta_type: number | null
          pta_udder: number | null
          raca: string | null
          registro: string | null
          rel_fat: number | null
          rel_milk: number | null
          rel_protein: number | null
          service_order_id: string | null
          sexo: string | null
          tpi: number | null
          updated_at: string
          uploaded_at: string | null
          uploaded_by: string | null
          visivel_ssgen: boolean
          visivel_toolss: boolean
        }
        Insert: {
          animal_id?: string | null
          blad?: string | null
          bvh?: string | null
          cheese_merit?: number | null
          client_id: string
          created_at?: string
          cvm?: string | null
          data_nascimento?: string | null
          dumps?: string | null
          file_name?: string | null
          file_path?: string | null
          fluid_merit?: number | null
          grazing_merit?: number | null
          hhp_dollar?: number | null
          id?: string
          mf?: string | null
          nmpf?: number | null
          nome_animal?: string | null
          pta_ccr?: number | null
          pta_dpr?: number | null
          pta_fat?: number | null
          pta_fat_pct?: number | null
          pta_feet_legs?: number | null
          pta_hcr?: number | null
          pta_livability?: number | null
          pta_milk?: number | null
          pta_pl?: number | null
          pta_protein?: number | null
          pta_protein_pct?: number | null
          pta_sce?: number | null
          pta_scs?: number | null
          pta_sire_sce?: number | null
          pta_type?: number | null
          pta_udder?: number | null
          raca?: string | null
          registro?: string | null
          rel_fat?: number | null
          rel_milk?: number | null
          rel_protein?: number | null
          service_order_id?: string | null
          sexo?: string | null
          tpi?: number | null
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          visivel_ssgen?: boolean
          visivel_toolss?: boolean
        }
        Update: {
          animal_id?: string | null
          blad?: string | null
          bvh?: string | null
          cheese_merit?: number | null
          client_id?: string
          created_at?: string
          cvm?: string | null
          data_nascimento?: string | null
          dumps?: string | null
          file_name?: string | null
          file_path?: string | null
          fluid_merit?: number | null
          grazing_merit?: number | null
          hhp_dollar?: number | null
          id?: string
          mf?: string | null
          nmpf?: number | null
          nome_animal?: string | null
          pta_ccr?: number | null
          pta_dpr?: number | null
          pta_fat?: number | null
          pta_fat_pct?: number | null
          pta_feet_legs?: number | null
          pta_hcr?: number | null
          pta_livability?: number | null
          pta_milk?: number | null
          pta_pl?: number | null
          pta_protein?: number | null
          pta_protein_pct?: number | null
          pta_sce?: number | null
          pta_scs?: number | null
          pta_sire_sce?: number | null
          pta_type?: number | null
          pta_udder?: number | null
          raca?: string | null
          registro?: string | null
          rel_fat?: number | null
          rel_milk?: number | null
          rel_protein?: number | null
          service_order_id?: string | null
          sexo?: string | null
          tpi?: number | null
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          visivel_ssgen?: boolean
          visivel_toolss?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "genomic_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genomic_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
          {
            foreignKeyName: "genomic_results_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      header_aliases_bulls: {
        Row: {
          alias: string
          canonical: string
          created_at: string | null
          id: number
        }
        Insert: {
          alias: string
          canonical: string
          created_at?: string | null
          id?: never
        }
        Update: {
          alias?: string
          canonical?: string
          created_at?: string | null
          id?: never
        }
        Relationships: []
      }
      import_staging_females: {
        Row: {
          client_id: string | null
          created_at: string | null
          errors: Json | null
          id: number
          import_batch_id: string | null
          is_valid: boolean | null
          mapped_row: Json | null
          processed_at: string | null
          raw_row: Json | null
          row_number: number | null
          uploader_user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          errors?: Json | null
          id?: never
          import_batch_id?: string | null
          is_valid?: boolean | null
          mapped_row?: Json | null
          processed_at?: string | null
          raw_row?: Json | null
          row_number?: number | null
          uploader_user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          errors?: Json | null
          id?: never
          import_batch_id?: string | null
          is_valid?: boolean | null
          mapped_row?: Json | null
          processed_at?: string | null
          raw_row?: Json | null
          row_number?: number | null
          uploader_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_staging_females_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_staging_females_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          deleted_at: string | null
          id: string
          issued_on: string
          service_order_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          issued_on: string
          service_order_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          issued_on?: string
          service_order_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      matings: {
        Row: {
          bull_id: string
          client_id: string
          created_at: string
          female_id: string
          id: string
          method: string | null
          parameters: Json | null
          rank: number | null
        }
        Insert: {
          bull_id: string
          client_id: string
          created_at?: string
          female_id: string
          id?: string
          method?: string | null
          parameters?: Json | null
          rank?: number | null
        }
        Update: {
          bull_id?: string
          client_id?: string
          created_at?: string
          female_id?: string
          id?: string
          method?: string | null
          parameters?: Json | null
          rank?: number | null
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
            foreignKeyName: "matings_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "plan_bulls_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
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
      pending_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          toolss_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          toolss_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          toolss_id?: string | null
        }
        Relationships: []
      }
      pending_user_farms: {
        Row: {
          client_id: string
          created_at: string | null
          email: string
          id: number
          role: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          email: string
          id?: number
          role?: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          email?: string
          id?: number
          role?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_farm_id: string | null
          email: string
          full_name: string | null
          id: string
          manager_id: string | null
          platform: Database["public"]["Enums"]["platform_type"][] | null
          temporary_password: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_farm_id?: string | null
          email: string
          full_name?: string | null
          id: string
          manager_id?: string | null
          platform?: Database["public"]["Enums"]["platform_type"][] | null
          temporary_password?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_farm_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          manager_id?: string | null
          platform?: Database["public"]["Enums"]["platform_type"][] | null
          temporary_password?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_farm_id_fkey"
            columns: ["default_farm_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_farm_id_fkey"
            columns: ["default_farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "farm_technicians"
            referencedColumns: ["technician_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      representantes: {
        Row: {
          ativo: boolean
          coordenador_id: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          coordenador_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          coordenador_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representantes_coordenador_id_fkey"
            columns: ["coordenador_id"]
            isOneToOne: false
            referencedRelation: "coordenadores"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_surveys: {
        Row: {
          appearance_rating: number | null
          charts_rating: number | null
          clarity_rating: number | null
          created_at: string | null
          feedback: string | null
          id: string
          overall_rating: number | null
          user_id: string | null
        }
        Insert: {
          appearance_rating?: number | null
          charts_rating?: number | null
          clarity_rating?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          overall_rating?: number | null
          user_id?: string | null
        }
        Update: {
          appearance_rating?: number | null
          charts_rating?: number | null
          clarity_rating?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          overall_rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      semen_movements: {
        Row: {
          batch_number: string | null
          bull_id: string
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          movement_date: string
          movement_type: Database["public"]["Enums"]["semen_movement_type"]
          notes: string | null
          price_per_dose: number | null
          quantity: number
          semen_type: Database["public"]["Enums"]["semen_type_enum"]
          tank_id: string | null
        }
        Insert: {
          batch_number?: string | null
          bull_id: string
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_date?: string
          movement_type: Database["public"]["Enums"]["semen_movement_type"]
          notes?: string | null
          price_per_dose?: number | null
          quantity: number
          semen_type?: Database["public"]["Enums"]["semen_type_enum"]
          tank_id?: string | null
        }
        Update: {
          batch_number?: string | null
          bull_id?: string
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          movement_date?: string
          movement_type?: Database["public"]["Enums"]["semen_movement_type"]
          notes?: string | null
          price_per_dose?: number | null
          quantity?: number
          semen_type?: Database["public"]["Enums"]["semen_type_enum"]
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
            foreignKeyName: "semen_movements_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "plan_bulls_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semen_movements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semen_movements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
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
      service_order_audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          ordem_servico_ssgen: string | null
          service_order_id: string | null
          user_email: string | null
          user_role: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ordem_servico_ssgen?: string | null
          service_order_id?: string | null
          user_email?: string | null
          user_role?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ordem_servico_ssgen?: string | null
          service_order_id?: string | null
          user_email?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_audit_log_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_samples: {
        Row: {
          created_at: string | null
          id: number
          liberacao_n_amostras: number | null
          sample_code: string | null
          service_order_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          liberacao_n_amostras?: number | null
          sample_code?: string | null
          service_order_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          liberacao_n_amostras?: number | null
          sample_code?: string | null
          service_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_samples_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          etapa: string
          id: number
          liberacao_n_amostras: number | null
          notes: string | null
          service_order_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          etapa: string
          id?: number
          liberacao_n_amostras?: number | null
          notes?: string | null
          service_order_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          etapa?: string
          id?: number
          liberacao_n_amostras?: number | null
          notes?: string | null
          service_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_stage_history_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          client_id: string | null
          cliente_lat: number | null
          cliente_lon: number | null
          completed_at: string | null
          cra_data: string | null
          cra_status: string | null
          created_at: string
          deleted_at: string | null
          dt_faturamento: string | null
          dt_receb_resultados: string | null
          envio_planilha_data: string | null
          envio_planilha_status: string | null
          envio_planilha_status_sla: string | null
          envio_resultados_data: string | null
          envio_resultados_data_prova: string | null
          envio_resultados_ordem_id: number | null
          envio_resultados_previsao: string | null
          envio_resultados_status: string | null
          envio_resultados_status_sla: string | null
          etapa_atual: string | null
          flag_reagendamento: boolean | null
          id: string
          issue_text: string | null
          liberacao_data: string | null
          liberacao_n_amostras: number | null
          lpr_data: string | null
          lpr_n_amostras: number | null
          lpr_status_sla: string | null
          nome_produto: string | null
          numero_amostras: number | null
          numero_nf_neogen: number | null
          ordem_servico_neogen: number | null
          ordem_servico_ssgen: number
          prioridade: string | null
          received_at: string | null
          result_file_path: string | null
          sla_days: number | null
          updated_at: string
          vri_data: string | null
          vri_n_amostras: number | null
          vri_resolvido_data: string | null
          vri_status_sla: string | null
        }
        Insert: {
          client_id?: string | null
          cliente_lat?: number | null
          cliente_lon?: number | null
          completed_at?: string | null
          cra_data?: string | null
          cra_status?: string | null
          created_at?: string
          deleted_at?: string | null
          dt_faturamento?: string | null
          dt_receb_resultados?: string | null
          envio_planilha_data?: string | null
          envio_planilha_status?: string | null
          envio_planilha_status_sla?: string | null
          envio_resultados_data?: string | null
          envio_resultados_data_prova?: string | null
          envio_resultados_ordem_id?: number | null
          envio_resultados_previsao?: string | null
          envio_resultados_status?: string | null
          envio_resultados_status_sla?: string | null
          etapa_atual?: string | null
          flag_reagendamento?: boolean | null
          id?: string
          issue_text?: string | null
          liberacao_data?: string | null
          liberacao_n_amostras?: number | null
          lpr_data?: string | null
          lpr_n_amostras?: number | null
          lpr_status_sla?: string | null
          nome_produto?: string | null
          numero_amostras?: number | null
          numero_nf_neogen?: number | null
          ordem_servico_neogen?: number | null
          ordem_servico_ssgen: number
          prioridade?: string | null
          received_at?: string | null
          result_file_path?: string | null
          sla_days?: number | null
          updated_at?: string
          vri_data?: string | null
          vri_n_amostras?: number | null
          vri_resolvido_data?: string | null
          vri_status_sla?: string | null
        }
        Update: {
          client_id?: string | null
          cliente_lat?: number | null
          cliente_lon?: number | null
          completed_at?: string | null
          cra_data?: string | null
          cra_status?: string | null
          created_at?: string
          deleted_at?: string | null
          dt_faturamento?: string | null
          dt_receb_resultados?: string | null
          envio_planilha_data?: string | null
          envio_planilha_status?: string | null
          envio_planilha_status_sla?: string | null
          envio_resultados_data?: string | null
          envio_resultados_data_prova?: string | null
          envio_resultados_ordem_id?: number | null
          envio_resultados_previsao?: string | null
          envio_resultados_status?: string | null
          envio_resultados_status_sla?: string | null
          etapa_atual?: string | null
          flag_reagendamento?: boolean | null
          id?: string
          issue_text?: string | null
          liberacao_data?: string | null
          liberacao_n_amostras?: number | null
          lpr_data?: string | null
          lpr_n_amostras?: number | null
          lpr_status_sla?: string | null
          nome_produto?: string | null
          numero_amostras?: number | null
          numero_nf_neogen?: number | null
          ordem_servico_neogen?: number | null
          ordem_servico_ssgen?: number
          prioridade?: string | null
          received_at?: string | null
          result_file_path?: string | null
          sla_days?: number | null
          updated_at?: string
          vri_data?: string | null
          vri_n_amostras?: number | null
          vri_resolvido_data?: string | null
          vri_status_sla?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      sla_config: {
        Row: {
          ativo: boolean
          cor_dentro_prazo: string
          cor_dia_zero: string
          cor_fora_prazo: string
          created_at: string
          dias_alvo: number
          etapa: string
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor_dentro_prazo?: string
          cor_dia_zero?: string
          cor_fora_prazo?: string
          created_at?: string
          dias_alvo?: number
          etapa: string
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor_dentro_prazo?: string
          cor_dia_zero?: string
          cor_fora_prazo?: string
          created_at?: string
          dias_alvo?: number
          etapa?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      survey_dismissals: {
        Row: {
          created_at: string | null
          dismissal_count: number | null
          dismissed_at: string | null
          id: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dismissal_count?: number | null
          dismissed_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dismissal_count?: number | null
          dismissed_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      team_locations: {
        Row: {
          created_at: string | null
          id: string
          lat: number
          lon: number
          nome: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lat: number
          lon: number
          nome: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lat?: number
          lon?: number
          nome?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      upload_audit: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: number
          metadata: Json | null
          name: string | null
          object_id: string | null
          owner_id: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: never
          metadata?: Json | null
          name?: string | null
          object_id?: string | null
          owner_id?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: never
          metadata?: Json | null
          name?: string | null
          object_id?: string | null
          owner_id?: string | null
        }
        Relationships: []
      }
      user_clients: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      user_farms: {
        Row: {
          client_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_farms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_farms_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
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
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
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
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
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
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
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
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
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
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
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
            foreignKeyName: "user_farms_client_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_farms_client_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      females_denorm: {
        Row: {
          beta_casein: string | null
          birth_date: string | null
          breed: string | null
          bwc: number | null
          category: string | null
          ccr: number | null
          cdcb_id: string | null
          cfp: number | null
          cheese_merit: number | null
          client_id: string | null
          cm_dollar: number | null
          created_at: string | null
          da: number | null
          dce: number | null
          deleted_at: string | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          ear_tag: string | null
          efc: number | null
          f_sav: number | null
          farm_id: string | null
          fi: number | null
          flc: number | null
          fls: number | null
          fluid_merit: number | null
          fm_dollar: number | null
          fonte: string | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          genomic_result_id: string | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          grazing_merit: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string | null
          identifier: string | null
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
          nmpf: number | null
          parity_order: number | null
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
          status: string | null
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
          breed?: string | null
          bwc?: number | null
          category?: string | null
          ccr?: number | null
          cdcb_id?: string | null
          cfp?: number | null
          cheese_merit?: number | null
          client_id?: string | null
          cm_dollar?: number | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          deleted_at?: string | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          ear_tag?: string | null
          efc?: number | null
          f_sav?: number | null
          farm_id?: string | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fluid_merit?: number | null
          fm_dollar?: number | null
          fonte?: string | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          genomic_result_id?: string | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          grazing_merit?: number | null
          h_liv?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          id?: string | null
          identifier?: string | null
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
          nmpf?: number | null
          parity_order?: number | null
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
          status?: string | null
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
          breed?: string | null
          bwc?: number | null
          category?: string | null
          ccr?: number | null
          cdcb_id?: string | null
          cfp?: number | null
          cheese_merit?: number | null
          client_id?: string | null
          cm_dollar?: number | null
          created_at?: string | null
          da?: number | null
          dce?: number | null
          deleted_at?: string | null
          dfm?: number | null
          dpr?: number | null
          dsb?: number | null
          ear_tag?: string | null
          efc?: number | null
          f_sav?: number | null
          farm_id?: string | null
          fi?: number | null
          flc?: number | null
          fls?: number | null
          fluid_merit?: number | null
          fm_dollar?: number | null
          fonte?: string | null
          fta?: number | null
          ftl?: number | null
          ftp?: number | null
          fua?: number | null
          genomic_result_id?: string | null
          gfi?: number | null
          gl?: number | null
          gm_dollar?: number | null
          grazing_merit?: number | null
          h_liv?: number | null
          hcr?: number | null
          hhp_dollar?: number | null
          id?: string | null
          identifier?: string | null
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
          nmpf?: number | null
          parity_order?: number | null
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
          status?: string | null
          str?: number | null
          tpi?: number | null
          ucl?: number | null
          udc?: number | null
          udp?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "females_client_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "females_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "females_client_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
          {
            foreignKeyName: "females_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
          {
            foreignKeyName: "females_genomic_result_id_fkey"
            columns: ["genomic_result_id"]
            isOneToOne: false
            referencedRelation: "genomic_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "females_genomic_result_id_fkey"
            columns: ["genomic_result_id"]
            isOneToOne: false
            referencedRelation: "ssgen_client_results"
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
          farm_id?: string | null
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
          id?: string | null
          identifier?: string | null
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
          parity_order?: number | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
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
          farm_id?: string | null
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
          id?: string | null
          identifier?: string | null
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
          parity_order?: number | null
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
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
            foreignKeyName: "females_client_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "females_client_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      plan_bulls_view: {
        Row: {
          beta_casein: string | null
          birth_date: string | null
          bwc: number | null
          ccr: number | null
          cfp: number | null
          cm_dollar: number | null
          code: string | null
          company: string | null
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
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
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
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
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
          pl?: number | null
          ptaf?: number | null
          ptaf_pct?: number | null
          ptam?: number | null
          ptap?: number | null
          ptap_pct?: number | null
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
        }
        Relationships: []
      }
      semen_inventory: {
        Row: {
          balance: number | null
          bull_id: string | null
          bull_naab: string | null
          bull_name: string | null
          farm_id: string | null
          last_movement_date: string | null
          semen_type: Database["public"]["Enums"]["semen_type_enum"] | null
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
            foreignKeyName: "semen_movements_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "plan_bulls_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semen_movements_client_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semen_movements_client_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
      ssgen_client_results: {
        Row: {
          animal_id: string | null
          blad: string | null
          bvh: string | null
          client_id: string | null
          cvm: string | null
          data_nascimento: string | null
          dumps: string | null
          fazenda: string | null
          file_name: string | null
          hhp_dollar: number | null
          id: string | null
          mf: string | null
          nmpf: number | null
          nome_animal: string | null
          ordem_servico_ssgen: number | null
          pta_ccr: number | null
          pta_dpr: number | null
          pta_fat: number | null
          pta_fat_pct: number | null
          pta_feet_legs: number | null
          pta_hcr: number | null
          pta_livability: number | null
          pta_milk: number | null
          pta_pl: number | null
          pta_protein: number | null
          pta_protein_pct: number | null
          pta_scs: number | null
          pta_type: number | null
          pta_udder: number | null
          raca: string | null
          registro: string | null
          sexo: string | null
          tpi: number | null
          uploaded_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "genomic_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "genomic_results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "farm_dashboard_kpis"
            referencedColumns: ["farm_id"]
          },
        ]
      }
    }
    Functions: {
      accept_pending_invites: {
        Args: { p_email: string; p_user_id: string }
        Returns: number
      }
      add_bull_to_farm: {
        Args: { bull_uuid: string; farm_uuid: string; notes_text?: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      ag_age_group:
        | { Args: { p_birth_date: string; p_parity: number }; Returns: string }
        | { Args: { p_birth_ts: string; p_parity: number }; Returns: string }
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
      calculate_hhp_dollar: {
        Args: {
          p_ccr: number
          p_dfm: number
          p_dpr: number
          p_ftl: number
          p_liv: number
          p_mast: number
          p_pl: number
          p_ptaf: number
          p_ptap: number
          p_rfi: number
          p_rtp: number
          p_ruw: number
          p_scs: number
          p_sta: number
          p_udp: number
        }
        Returns: number
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
          beta_casein: string | null
          birth_date: string | null
          breed: string | null
          bwc: number | null
          category: string | null
          ccr: number | null
          cdcb_id: string | null
          cfp: number | null
          cheese_merit: number | null
          client_id: string | null
          cm_dollar: number | null
          created_at: string | null
          da: number | null
          dce: number | null
          deleted_at: string | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          ear_tag: string | null
          efc: number | null
          f_sav: number | null
          farm_id: string | null
          fi: number | null
          flc: number | null
          fls: number | null
          fluid_merit: number | null
          fm_dollar: number | null
          fonte: string | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          genomic_result_id: string | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          grazing_merit: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string | null
          identifier: string | null
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
          nmpf: number | null
          parity_order: number | null
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
          status: string | null
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
      generate_temp_password: {
        Args: { profile_index: number }
        Returns: string
      }
      get_bull_by_naab: { Args: { naab: string }; Returns: Json }
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
          pl: number | null
          ptaf: number | null
          ptaf_pct: number | null
          ptam: number | null
          ptap: number | null
          ptap_pct: number | null
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
          breed: string | null
          bwc: number | null
          category: string | null
          ccr: number | null
          cdcb_id: string | null
          cfp: number | null
          cheese_merit: number | null
          client_id: string | null
          cm_dollar: number | null
          created_at: string | null
          da: number | null
          dce: number | null
          deleted_at: string | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          ear_tag: string | null
          efc: number | null
          f_sav: number | null
          farm_id: string | null
          fi: number | null
          flc: number | null
          fls: number | null
          fluid_merit: number | null
          fm_dollar: number | null
          fonte: string | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          genomic_result_id: string | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          grazing_merit: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string | null
          identifier: string | null
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
          nmpf: number | null
          parity_order: number | null
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
          status: string | null
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
          semen_type: Database["public"]["Enums"]["semen_type_enum"] | null
          total_movements: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "semen_inventory"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_role: { Args: never; Returns: string }
      has_farm_membership: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_v2: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_bulls_json: { Args: { p_data: Json }; Returns: number }
      import_females_json: {
        Args: { p_client_id: string; p_data: Json }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_farm_editor: { Args: { farm_uuid: string }; Returns: boolean }
      is_farm_member:
        | { Args: { farm_uuid: string }; Returns: boolean }
        | { Args: { p_farm: string; p_user: string }; Returns: boolean }
      is_farm_owner: { Args: { farm_uuid: string }; Returns: boolean }
      is_farm_technician: { Args: { farm_uuid: string }; Returns: boolean }
      is_jsonb: { Args: { "": string }; Returns: boolean }
      is_member_of_farm: { Args: { _farm_id: string }; Returns: boolean }
      is_rep_of_manager: {
        Args: { manager: string; rep: string }
        Returns: boolean
      }
      link_order_to_client: {
        Args: { p_client_name: string; p_order_id: string }
        Returns: {
          client_id: string
          client_name: string
          order_id: string
        }[]
      }
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
      nx3_bulls_lookup:
        | {
            Args: { p_limit?: number; p_query: string; p_trait: string }
            Returns: {
              code: string
              id: string
              name: string
              trait_value: number
            }[]
          }
        | {
            Args: { p_query: string; p_trait: string }
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
          beta_casein: string | null
          birth_date: string | null
          breed: string | null
          bwc: number | null
          category: string | null
          ccr: number | null
          cdcb_id: string | null
          cfp: number | null
          cheese_merit: number | null
          client_id: string | null
          cm_dollar: number | null
          created_at: string | null
          da: number | null
          dce: number | null
          deleted_at: string | null
          dfm: number | null
          dpr: number | null
          dsb: number | null
          ear_tag: string | null
          efc: number | null
          f_sav: number | null
          farm_id: string | null
          fi: number | null
          flc: number | null
          fls: number | null
          fluid_merit: number | null
          fm_dollar: number | null
          fonte: string | null
          fta: number | null
          ftl: number | null
          ftp: number | null
          fua: number | null
          genomic_result_id: string | null
          gfi: number | null
          gl: number | null
          gm_dollar: number | null
          grazing_merit: number | null
          h_liv: number | null
          hcr: number | null
          hhp_dollar: number | null
          id: string | null
          identifier: string | null
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
          nmpf: number | null
          parity_order: number | null
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
          status: string | null
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
      search_bulls: {
        Args: { limit_count?: number; q: string }
        Returns: Json[]
      }
      set_default_farm: {
        Args: { farm_uuid: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      soundex: { Args: { "": string }; Returns: string }
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
      app_role:
        | "superadmin"
        | "admin"
        | "tecnico"
        | "representante"
        | "coordenador"
        | "cliente"
      platform_type: "toolss" | "tracker" | "ssgen"
      segmentation_class: "donor" | "inter" | "recipient"
      semen_movement_type: "entrada" | "saida"
      semen_type_enum: "convencional" | "sexado"
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
      app_role: [
        "superadmin",
        "admin",
        "tecnico",
        "representante",
        "coordenador",
        "cliente",
      ],
      platform_type: ["toolss", "tracker", "ssgen"],
      segmentation_class: ["donor", "inter", "recipient"],
      semen_movement_type: ["entrada", "saida"],
      semen_type_enum: ["convencional", "sexado"],
    },
  },
} as const
