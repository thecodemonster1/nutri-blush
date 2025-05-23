import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance and export it
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Type definitions for your database
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sku: string | null;
          category: string;
          price: number;
          cost_price: number | null;
          quantity: number;
          min_stock_level: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          category: string;
          price: number;
          cost_price?: number | null;
          quantity: number;
          min_stock_level?: number;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sku?: string | null;
          category?: string;
          price?: number;
          cost_price?: number | null;
          quantity?: number;
          min_stock_level?: number;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          product_id: string;
          customer_name: string | null;
          customer_email: string | null;
          customer_phone: string | null;
          quantity_sold: number;
          unit_price: number;
          total_amount: number;
          discount_amount: number;
          final_amount: number;
          payment_method: string;
          payment_status: string;
          sale_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          quantity_sold: number;
          unit_price: number;
          total_amount: number;
          discount_amount?: number;
          final_amount: number;
          payment_method: string;
          payment_status: string;
          sale_date?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          quantity_sold?: number;
          unit_price?: number;
          total_amount?: number;
          discount_amount?: number;
          final_amount?: number;
          payment_method?: string;
          payment_status?: string;
          sale_date?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
