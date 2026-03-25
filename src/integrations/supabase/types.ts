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
          created_at: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      bem_extras: {
        Row: {
          ano_fabricacao: string
          ano_modelo: string
          bem_id: string
          chassi: string
          created_at: string
          id: string
          km: string
          modelo: string
          numero_serie: string
          placa: string
          renavam: string
        }
        Insert: {
          ano_fabricacao?: string
          ano_modelo?: string
          bem_id: string
          chassi?: string
          created_at?: string
          id?: string
          km?: string
          modelo?: string
          numero_serie?: string
          placa?: string
          renavam?: string
        }
        Update: {
          ano_fabricacao?: string
          ano_modelo?: string
          bem_id?: string
          chassi?: string
          created_at?: string
          id?: string
          km?: string
          modelo?: string
          numero_serie?: string
          placa?: string
          renavam?: string
        }
        Relationships: [
          {
            foreignKeyName: "bem_extras_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: true
            referencedRelation: "bens"
            referencedColumns: ["id"]
          },
        ]
      }
      bens: {
        Row: {
          categoria_id: string
          created_at: string
          data_baixa: string | null
          data_compra: string
          depreciacao_anual: number
          descricao: string
          id: string
          motivo_baixa: string
          nfe: string
          numero_aprovacao: string
          setor_id: string
          status: Database["public"]["Enums"]["status_bem"]
          usuario: string
          valor_compra: number
        }
        Insert: {
          categoria_id: string
          created_at?: string
          data_baixa?: string | null
          data_compra: string
          depreciacao_anual?: number
          descricao: string
          id: string
          motivo_baixa?: string
          nfe?: string
          numero_aprovacao?: string
          setor_id: string
          status?: Database["public"]["Enums"]["status_bem"]
          usuario?: string
          valor_compra?: number
        }
        Update: {
          categoria_id?: string
          created_at?: string
          data_baixa?: string | null
          data_compra?: string
          depreciacao_anual?: number
          descricao?: string
          id?: string
          motivo_baixa?: string
          nfe?: string
          numero_aprovacao?: string
          setor_id?: string
          status?: Database["public"]["Enums"]["status_bem"]
          usuario?: string
          valor_compra?: number
        }
        Relationships: [
          {
            foreignKeyName: "bens_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bens_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      entregas: {
        Row: {
          bem_id: string
          created_at: string
          data_devolucao: string | null
          data_entrega: string
          gerente_nome: string
          id: string
        }
        Insert: {
          bem_id: string
          created_at?: string
          data_devolucao?: string | null
          data_entrega: string
          gerente_nome?: string
          id?: string
        }
        Update: {
          bem_id?: string
          created_at?: string
          data_devolucao?: string | null
          data_entrega?: string
          gerente_nome?: string
          id?: string
        }
        Relationships: []
      }
      gerentes: {
        Row: {
          cpf: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cpf?: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cpf?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      manutencao_agenda: {
        Row: {
          bem_id: string
          created_at: string
          descricao: string
          frequencia: Database["public"]["Enums"]["frequencia_manutencao"]
          id: string
          primeira_data: string
        }
        Insert: {
          bem_id: string
          created_at?: string
          descricao?: string
          frequencia?: Database["public"]["Enums"]["frequencia_manutencao"]
          id?: string
          primeira_data: string
        }
        Update: {
          bem_id?: string
          created_at?: string
          descricao?: string
          frequencia?: Database["public"]["Enums"]["frequencia_manutencao"]
          id?: string
          primeira_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencao_agenda_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencao_itens: {
        Row: {
          custo: number
          descricao: string
          id: string
          manutencao_id: string
        }
        Insert: {
          custo?: number
          descricao?: string
          id?: string
          manutencao_id: string
        }
        Update: {
          custo?: number
          descricao?: string
          id?: string
          manutencao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencao_itens_manutencao_id_fkey"
            columns: ["manutencao_id"]
            isOneToOne: false
            referencedRelation: "manutencoes"
            referencedColumns: ["id"]
          },
        ]
      }
      manutencoes: {
        Row: {
          bem_id: string
          created_at: string
          custo: number
          data: string
          descricao: string
          fornecedor: string
          id: string
          nfe_pedido: string
          numero: string
          numero_aprovacao: string
          observacoes: string
          tipo: Database["public"]["Enums"]["tipo_manutencao"]
        }
        Insert: {
          bem_id: string
          created_at?: string
          custo?: number
          data: string
          descricao?: string
          fornecedor?: string
          id?: string
          nfe_pedido?: string
          numero: string
          numero_aprovacao?: string
          observacoes?: string
          tipo?: Database["public"]["Enums"]["tipo_manutencao"]
        }
        Update: {
          bem_id?: string
          created_at?: string
          custo?: number
          data?: string
          descricao?: string
          fornecedor?: string
          id?: string
          nfe_pedido?: string
          numero?: string
          numero_aprovacao?: string
          observacoes?: string
          tipo?: Database["public"]["Enums"]["tipo_manutencao"]
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_bem_id_fkey"
            columns: ["bem_id"]
            isOneToOne: false
            referencedRelation: "bens"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_categorias: {
        Row: {
          categoria_id: string
          id: string
          profile_id: string
        }
        Insert: {
          categoria_id: string
          id?: string
          profile_id: string
        }
        Update: {
          categoria_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_categorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_categorias_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_setores: {
        Row: {
          id: string
          profile_id: string
          setor_id: string
        }
        Insert: {
          id?: string
          profile_id: string
          setor_id: string
        }
        Update: {
          id?: string
          profile_id?: string
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_setores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_setores_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"]
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      setor_gerentes: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          gerente_id: string
          id: string
          setor_id: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          gerente_id: string
          id?: string
          setor_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          gerente_id?: string
          id?: string
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setor_gerentes_gerente_id_fkey"
            columns: ["gerente_id"]
            isOneToOne: false
            referencedRelation: "gerentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setor_gerentes_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_diretor: { Args: never; Returns: boolean }
    }
    Enums: {
      frequencia_manutencao: "Semanal" | "Quinzenal" | "Mensal" | "Trimestral"
      perfil_usuario: "Diretor" | "Gestor" | "Manutenção"
      status_bem: "Ativo" | "Baixado"
      tipo_manutencao: "Preventiva" | "Corretiva"
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
      frequencia_manutencao: ["Semanal", "Quinzenal", "Mensal", "Trimestral"],
      perfil_usuario: ["Diretor", "Gestor", "Manutenção"],
      status_bem: ["Ativo", "Baixado"],
      tipo_manutencao: ["Preventiva", "Corretiva"],
    },
  },
} as const
