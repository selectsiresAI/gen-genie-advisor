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
            foreignKeyName: "farm_bull_picks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
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
            foreignKeyName: "genomic_results_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
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
            foreignKeyName: "matings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
          email: string
          full_name: string | null
          id: string
          platform: Database["public"]["Enums"]["platform_type"][] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          platform?: Database["public"]["Enums"]["platform_type"][] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["platform_type"][] | null
          updated_at?: string
        }
        Relationships: []
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
            foreignKeyName: "semen_movements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
        ]
      }
    }
    Functions: {
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
      get_bull_by_naab: { Args: { naab: string }; Returns: Json }
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
      search_bulls: {
        Args: { limit_count?: number; q: string }
        Returns: Json[]
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
