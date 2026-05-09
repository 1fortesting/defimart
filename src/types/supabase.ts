export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          vendor_product_id: string | null
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          vendor_product_id?: string | null
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          vendor_product_id?: string | null
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_vendor_product_id_fkey"
            columns: ["vendor_product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_products: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          price: number
          category: string | null
          image_urls: string[] | null
          seller_id: string
          is_approved: boolean | null
          quantity: number | null
          tags: string[] | null
          offers_delivery: boolean | null
          delivery_price_type: string | null
          delivery_price: number | null
          discount_percentage: number | null
          discount_end_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          price: number
          category?: string | null
          image_urls?: string[] | null
          seller_id: string
          is_approved?: boolean | null
          quantity?: number | null
          tags?: string[] | null
          offers_delivery?: boolean | null
          delivery_price_type?: string | null
          delivery_price?: number | null
          discount_percentage?: number | null
          discount_end_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          price?: number
          category?: string | null
          image_urls?: string[] | null
          seller_id?: string
          is_approved?: boolean | null
          quantity?: number | null
          tags?: string[] | null
          offers_delivery?: boolean | null
          delivery_price_type?: string | null
          delivery_price?: number | null
          discount_percentage?: number | null
          discount_end_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          cost_price_per_item: number | null
          created_at: string
          id: string
          notes: string | null
          original_price_per_item: number
          price_per_item: number
          product_id: string | null
          vendor_product_id: string | null
          quantity: number
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          delivery_location: string | null
        }
        Insert: {
          buyer_id: string
          cost_price_per_item?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          original_price_per_item: number
          price_per_item: number
          product_id?: string | null
          vendor_product_id?: string | null
          quantity: number
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"]
          delivery_location?: string | null
        }
        Update: {
          buyer_id?: string
          cost_price_per_item?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          original_price_per_item?: number
          price_per_item?: number
          product_id?: string | null
          vendor_product_id?: string | null
          quantity?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          delivery_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_product_id_fkey"
            columns: ["vendor_product_id"]
            isOneToOne: false
            referencedRelation: "vendor_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          discount_end_date: string | null
          discount_percentage: number | null
          id: string
          image_urls: string[] | null
          is_featured: boolean | null
          is_outstanding: boolean | null
          name: string
          price: number
          quantity: number | null
          seller_id: string
          tags: string[] | null
          offers_delivery: boolean | null
          delivery_price_type: string | null
          delivery_price: number | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          discount_end_date?: string | null
          discount_percentage?: number | null
          id?: string
          image_urls?: string[] | null
          is_featured?: boolean | null
          is_outstanding?: boolean | null
          name: string
          price: number
          quantity?: number | null
          seller_id: string
          tags?: string[] | null
          offers_delivery?: boolean | null
          delivery_price_type?: string | null
          delivery_price?: number | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          discount_end_date?: string | null
          discount_percentage?: number | null
          id?: string
          image_urls?: string[] | null
          is_featured?: boolean | null
          is_outstanding?: boolean | null
          name?: string
          price?: number
          quantity?: number | null
          seller_id?: string
          tags?: string[] | null
          offers_delivery?: boolean | null
          delivery_price_type?: string | null
          delivery_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string
          phone_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id: string
          phone_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
          phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: "pending" | "ready" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
