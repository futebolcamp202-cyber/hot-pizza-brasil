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
      borders: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          change_for: number | null
          created_at: string
          customer_name: string
          delivery_fee: number
          distance_km: number
          house_number: string
          id: string
          items: Json
          order_type: string
          payment_method: string
          residence_type: string
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          address: string
          change_for?: number | null
          created_at?: string
          customer_name: string
          delivery_fee?: number
          distance_km?: number
          house_number: string
          id?: string
          items?: Json
          order_type?: string
          payment_method: string
          residence_type?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Update: {
          address?: string
          change_for?: number | null
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          distance_km?: number
          house_number?: string
          id?: string
          items?: Json
          order_type?: string
          payment_method?: string
          residence_type?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: []
      }
      pizza_flavors: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          allow_two_flavors: boolean
          available: boolean
          category: string
          combo_flavors_step: boolean
          created_at: string
          description: string
          extras: string[]
          id: string
          image_url: string | null
          ingredients: string[]
          is_combo: boolean
          name: string
          price: number
          requires_border: boolean
          sort_order: number
        }
        Insert: {
          allow_two_flavors?: boolean
          available?: boolean
          category?: string
          combo_flavors_step?: boolean
          created_at?: string
          description?: string
          extras?: string[]
          id?: string
          image_url?: string | null
          ingredients?: string[]
          is_combo?: boolean
          name: string
          price?: number
          requires_border?: boolean
          sort_order?: number
        }
        Update: {
          allow_two_flavors?: boolean
          available?: boolean
          category?: string
          combo_flavors_step?: boolean
          created_at?: string
          description?: string
          extras?: string[]
          id?: string
          image_url?: string | null
          ingredients?: string[]
          is_combo?: boolean
          name?: string
          price?: number
          requires_border?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          background_color: string
          button_color: string
          cover_image_url: string | null
          favicon_url: string | null
          id: string
          primary_color: string
          profile_image_url: string | null
          receipt_header: string
          store_name: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          button_color?: string
          cover_image_url?: string | null
          favicon_url?: string | null
          id?: string
          primary_color?: string
          profile_image_url?: string | null
          receipt_header?: string
          store_name?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          button_color?: string
          cover_image_url?: string | null
          favicon_url?: string | null
          id?: string
          primary_color?: string
          profile_image_url?: string | null
          receipt_header?: string
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
