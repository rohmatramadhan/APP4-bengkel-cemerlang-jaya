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
      audit_logs: {
        Row: {
          id: number
          waktu: string
          pelaku_id: string | null
          pelaku_peran: string | null
          aksi: string
          tabel: string
          data_id: string | null
          sebelum: Json | null
          sesudah: Json | null
          alasan: string | null
        }
        Insert: {
          id?: never
          waktu?: string
          pelaku_id?: string | null
          pelaku_peran?: string | null
          aksi: string
          tabel: string
          data_id?: string | null
          sebelum?: Json | null
          sesudah?: Json | null
          alasan?: string | null
        }
        Update: {
          id?: never
          waktu?: string
          pelaku_id?: string | null
          pelaku_peran?: string | null
          aksi?: string
          tabel?: string
          data_id?: string | null
          sebelum?: Json | null
          sesudah?: Json | null
          alasan?: string | null
        }
        Relationships: []
      }
      billing_item_costs: {
        Row: {
          billing_item_id: string
          harga_modal: number
        }
        Insert: {
          billing_item_id: string
          harga_modal?: number
        }
        Update: {
          billing_item_id?: string
          harga_modal?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_item_costs_billing_item_id_fkey"
            columns: ["billing_item_id"]
            isOneToOne: true
            referencedRelation: "billing_items"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_items: {
        Row: {
          id: string
          work_order_id: string
          item_id: string
          nama_item: string
          jenis: string
          jumlah: number
          harga_master: number
          harga_dipakai: number
          alasan_penyesuaian: string | null
          disesuaikan_oleh: string | null
          disesuaikan_at: string | null
          ditambah_oleh: string | null
          created_at: string
        }
        Insert: {
          id?: string
          work_order_id: string
          item_id: string
          nama_item: string
          jenis: string
          jumlah: number
          harga_master: number
          harga_dipakai: number
          alasan_penyesuaian?: string | null
          disesuaikan_oleh?: string | null
          disesuaikan_at?: string | null
          ditambah_oleh?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          work_order_id?: string
          item_id?: string
          nama_item?: string
          jenis?: string
          jumlah?: number
          harga_master?: number
          harga_dipakai?: number
          alasan_penyesuaian?: string | null
          disesuaikan_oleh?: string | null
          disesuaikan_at?: string | null
          ditambah_oleh?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_items_disesuaikan_oleh_fkey"
            columns: ["disesuaikan_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_ditambah_oleh_fkey"
            columns: ["ditambah_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          tipe: string
          nama: string
          telepon: string
          email: string | null
          alamat: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tipe?: string
          nama: string
          telepon: string
          email?: string | null
          alamat?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tipe?: string
          nama?: string
          telepon?: string
          email?: string | null
          alamat?: string | null
          created_at?: string
        }
        Relationships: []
      }
      inventory_costs: {
        Row: {
          item_id: string
          harga_modal: number
          updated_at: string
        }
        Insert: {
          item_id: string
          harga_modal: number
          updated_at?: string
        }
        Update: {
          item_id?: string
          harga_modal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_costs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          id: string
          kode: string
          jenis: string
          nama: string
          harga_jual: number
          stok: number
          stok_minimum: number
          aktif: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kode: string
          jenis: string
          nama: string
          harga_jual: number
          stok?: number
          stok_minimum?: number
          aktif?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kode?: string
          jenis?: string
          nama?: string
          harga_jual?: number
          stok?: number
          stok_minimum?: number
          aktif?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          work_order_id: string
          nomor: string
          subtotal: number
          diskon: number
          total: number
          terbayar: number
          status_bayar: string
          diterbitkan_oleh: string | null
          diterbitkan_at: string
        }
        Insert: {
          id?: string
          work_order_id: string
          nomor: string
          subtotal: number
          diskon?: number
          total: number
          terbayar?: number
          status_bayar?: string
          diterbitkan_oleh?: string | null
          diterbitkan_at?: string
        }
        Update: {
          id?: string
          work_order_id?: string
          nomor?: string
          subtotal?: number
          diskon?: number
          total?: number
          terbayar?: number
          status_bayar?: string
          diterbitkan_oleh?: string | null
          diterbitkan_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_diterbitkan_oleh_fkey"
            columns: ["diterbitkan_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: true
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mekanik: {
        Row: {
          id: string
          nama: string
          kepala_mekanik_id: string
          aktif: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nama: string
          kepala_mekanik_id: string
          aktif?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nama?: string
          kepala_mekanik_id?: string
          aktif?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mekanik_kepala_mekanik_id_fkey"
            columns: ["kepala_mekanik_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      number_counters: {
        Row: {
          jenis: string
          periode: string
          terakhir: number
        }
        Insert: {
          jenis: string
          periode: string
          terakhir?: number
        }
        Update: {
          jenis?: string
          periode?: string
          terakhir?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          metode: string
          jumlah: number
          dicatat_oleh: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          metode: string
          jumlah: number
          dicatat_oleh?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          metode?: string
          jumlah?: number
          dicatat_oleh?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_dicatat_oleh_fkey"
            columns: ["dicatat_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          nama: string
          email: string
          role: string
          aktif: boolean
          created_at: string
        }
        Insert: {
          id: string
          nama: string
          email: string
          role?: string
          aktif?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nama?: string
          email?: string
          role?: string
          aktif?: boolean
          created_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: number
          item_id: string
          jenis: string
          jumlah: number
          stok_sesudah: number
          keterangan: string | null
          work_order_id: string | null
          dicatat_oleh: string | null
          created_at: string
        }
        Insert: {
          id?: never
          item_id: string
          jenis: string
          jumlah: number
          stok_sesudah: number
          keterangan?: string | null
          work_order_id?: string | null
          dicatat_oleh?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          item_id?: string
          jenis?: string
          jumlah?: number
          stok_sesudah?: number
          keterangan?: string | null
          work_order_id?: string | null
          dicatat_oleh?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_dicatat_oleh_fkey"
            columns: ["dicatat_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          id: string
          customer_id: string
          plat: string
          merek_model: string
          tahun: number | null
          warna: string | null
          transmisi: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          plat: string
          merek_model: string
          tahun?: number | null
          warna?: string | null
          transmisi?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          plat?: string
          merek_model?: string
          tahun?: number | null
          warna?: string | null
          transmisi?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      wo_status_history: {
        Row: {
          id: number
          work_order_id: string
          dari_status: string | null
          ke_status: string
          catatan: string | null
          oleh: string | null
          created_at: string
        }
        Insert: {
          id?: never
          work_order_id: string
          dari_status?: string | null
          ke_status: string
          catatan?: string | null
          oleh?: string | null
          created_at?: string
        }
        Update: {
          id?: never
          work_order_id?: string
          dari_status?: string | null
          ke_status?: string
          catatan?: string | null
          oleh?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wo_status_history_oleh_fkey"
            columns: ["oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wo_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_mekanik: {
        Row: {
          work_order_id: string
          mekanik_id: string
        }
        Insert: {
          work_order_id: string
          mekanik_id: string
        }
        Update: {
          work_order_id?: string
          mekanik_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_mekanik_mekanik_id_fkey"
            columns: ["mekanik_id"]
            isOneToOne: false
            referencedRelation: "mekanik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_mekanik_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_photos: {
        Row: {
          id: string
          work_order_id: string
          jenis: string
          path: string
          diunggah_oleh: string | null
          created_at: string
        }
        Insert: {
          id?: string
          work_order_id: string
          jenis: string
          path: string
          diunggah_oleh?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          work_order_id?: string
          jenis?: string
          path?: string
          diunggah_oleh?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_photos_diunggah_oleh_fkey"
            columns: ["diunggah_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_photos_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          id: string
          nomor: string
          vehicle_id: string
          customer_id: string
          kepala_mekanik_id: string
          odometer: number
          keluhan: string
          diagnosis: string | null
          status: string
          estimasi_selesai: string | null
          catatan_status: string | null
          diskon: number
          alasan_diskon: string | null
          selesai_at: string | null
          diambil_at: string | null
          dibuat_oleh: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nomor: string
          vehicle_id: string
          customer_id: string
          kepala_mekanik_id: string
          odometer: number
          keluhan: string
          diagnosis?: string | null
          status?: string
          estimasi_selesai?: string | null
          catatan_status?: string | null
          diskon?: number
          alasan_diskon?: string | null
          selesai_at?: string | null
          diambil_at?: string | null
          dibuat_oleh?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nomor?: string
          vehicle_id?: string
          customer_id?: string
          kepala_mekanik_id?: string
          odometer?: number
          keluhan?: string
          diagnosis?: string | null
          status?: string
          estimasi_selesai?: string | null
          catatan_status?: string | null
          diskon?: number
          alasan_diskon?: string | null
          selesai_at?: string | null
          diambil_at?: string | null
          dibuat_oleh?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_kepala_mekanik_id_fkey"
            columns: ["kepala_mekanik_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_settings: {
        Row: {
          id: number
          nama: string
          alamat: string
          telepon: string
          jam_buka: string | null
          logo_path: string | null
          galeri_paths: string[]
          updated_at: string
        }
        Insert: {
          id?: number
          nama?: string
          alamat?: string
          telepon?: string
          jam_buka?: string | null
          logo_path?: string | null
          galeri_paths?: string[]
          updated_at?: string
        }
        Update: {
          id?: number
          nama?: string
          alamat?: string
          telepon?: string
          jam_buka?: string | null
          logo_path?: string | null
          galeri_paths?: string[]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
