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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: string
          rol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rol?: string
          user_id?: string
        }
        Relationships: []
      }
      cites: {
        Row: {
          created_at: string
          dia_visita_id: string
          email: string | null
          estat_assistencia: string | null
          id: string
          nom_complet: string
          numero_tanda: number
          pin_cancelacio: string | null
          telefon: string
          tipus: string
        }
        Insert: {
          created_at?: string
          dia_visita_id: string
          email?: string | null
          estat_assistencia?: string | null
          id?: string
          nom_complet: string
          numero_tanda: number
          pin_cancelacio?: string | null
          telefon: string
          tipus: string
        }
        Update: {
          created_at?: string
          dia_visita_id?: string
          email?: string | null
          estat_assistencia?: string | null
          id?: string
          nom_complet?: string
          numero_tanda?: number
          pin_cancelacio?: string | null
          telefon?: string
          tipus?: string
        }
        Relationships: [
          {
            foreignKeyName: "cites_dia_visita_id_fkey"
            columns: ["dia_visita_id"]
            isOneToOne: false
            referencedRelation: "dies_visita"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracio: {
        Row: {
          clau: string
          created_at: string
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          clau: string
          created_at?: string
          id?: string
          updated_at?: string
          valor: Json
        }
        Update: {
          clau?: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      consultes_telefoniques: {
        Row: {
          atesa: boolean
          created_at: string
          email: string | null
          id: string
          motiu: string
          nom_complet: string
          telefon: string
          tipus: string
          urgencia: string
        }
        Insert: {
          atesa?: boolean
          created_at?: string
          email?: string | null
          id?: string
          motiu: string
          nom_complet: string
          telefon: string
          tipus: string
          urgencia: string
        }
        Update: {
          atesa?: boolean
          created_at?: string
          email?: string | null
          id?: string
          motiu?: string
          nom_complet?: string
          telefon?: string
          tipus?: string
          urgencia?: string
        }
        Relationships: []
      }
      dies_visita: {
        Row: {
          created_at: string
          data: string
          id: string
          infermera_activa: boolean
          max_tandes_covid: number
          max_tandes_grip: number
          max_tandes_infermera: number
          max_tandes_metge: number
          metge_actiu: boolean
          updated_at: string
          vacunes_covid_actiu: boolean
          vacunes_grip_actiu: boolean
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          infermera_activa?: boolean
          max_tandes_covid?: number
          max_tandes_grip?: number
          max_tandes_infermera?: number
          max_tandes_metge?: number
          metge_actiu?: boolean
          updated_at?: string
          vacunes_covid_actiu?: boolean
          vacunes_grip_actiu?: boolean
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          infermera_activa?: boolean
          max_tandes_covid?: number
          max_tandes_grip?: number
          max_tandes_infermera?: number
          max_tandes_metge?: number
          metge_actiu?: boolean
          updated_at?: string
          vacunes_covid_actiu?: boolean
          vacunes_grip_actiu?: boolean
        }
        Relationships: []
      }
      numero_actual: {
        Row: {
          dia_visita_id: string | null
          estat_visita: string | null
          id: string
          nom_professional: string | null
          numero: number
          tipus: string
          updated_at: string
        }
        Insert: {
          dia_visita_id?: string | null
          estat_visita?: string | null
          id?: string
          nom_professional?: string | null
          numero?: number
          tipus: string
          updated_at?: string
        }
        Update: {
          dia_visita_id?: string | null
          estat_visita?: string | null
          id?: string
          nom_professional?: string | null
          numero?: number
          tipus?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "numero_actual_dia_visita_id_fkey"
            columns: ["dia_visita_id"]
            isOneToOne: false
            referencedRelation: "dies_visita"
            referencedColumns: ["id"]
          },
        ]
      }
      receptes: {
        Row: {
          atesa: boolean
          created_at: string
          email: string | null
          id: string
          medicament: string
          nom_complet: string
          notes: string | null
          telefon: string
        }
        Insert: {
          atesa?: boolean
          created_at?: string
          email?: string | null
          id?: string
          medicament: string
          nom_complet: string
          notes?: string | null
          telefon: string
        }
        Update: {
          atesa?: boolean
          created_at?: string
          email?: string | null
          id?: string
          medicament?: string
          nom_complet?: string
          notes?: string | null
          telefon?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
