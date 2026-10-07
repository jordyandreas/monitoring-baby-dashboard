/**
 * Hand-maintained types matching supabase/migrations.
 * Regenerate later with: supabase gen types typescript --local > lib/supabase/database.types.ts
 */

type TableShape<T extends { user_id: string }> = {
  Row: T & { created_at: string };
  Insert: Partial<T & { created_at: string }> & Pick<T, "user_id">;
  Update: Partial<T & { created_at: string }>;
  Relationships: [];
};
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          locale: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          locale?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          locale?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      baby_profiles: {
        Row: {
          user_id: string;
          name: string;
          gender: string;
          lmp_date: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name?: string;
          gender?: string;
          lmp_date?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          name?: string;
          gender?: string;
          lmp_date?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      baby_plus_programs: {
        Row: {
          user_id: string;
          start_date: string | null;
          daily_time: string | null;
          completions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          start_date?: string | null;
          daily_time?: string | null;
          completions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          start_date?: string | null;
          daily_time?: string | null;
          completions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vitamin_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vitamin_day_logs: {
        Row: {
          user_id: string;
          log_date: string;
          completions: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          log_date: string;
          completions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          log_date?: string;
          completions?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kick_logs: {
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          logged_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          logged_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          logged_time?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      water_logs: {
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          logged_time: string;
          amount_ml: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_date: string;
          logged_time: string;
          amount_ml: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_date?: string;
          logged_time?: string;
          amount_ml?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          glass_size_ml: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          glass_size_ml?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          glass_size_ml?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_reminder_preferences: {
        Row: {
          user_id: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      sync_metadata: {
        Row: {
          user_id: string;
          local_storage_version: number;
          migrated_at: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          local_storage_version?: number;
          migrated_at?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          local_storage_version?: number;
          migrated_at?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheduled_notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          enabled: boolean;
          schedule_type: string;
          schedule_config: Json;
          next_run_at: string | null;
          last_run_at: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          enabled?: boolean;
          schedule_type?: string;
          schedule_config?: Json;
          next_run_at?: string | null;
          last_run_at?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          enabled?: boolean;
          schedule_type?: string;
          schedule_config?: Json;
          next_run_at?: string | null;
          last_run_at?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      child_profiles: TableShape<{
        user_id: string;
        name: string;
        gender: string;
        birth_date: string | null;
        updated_at: string;
      }>;
      feed_logs: TableShape<{
        user_id: string;
        id: string;
        logged_date: string;
        logged_time: string;
        kind: string;
        side: string | null;
        duration_min: number | null;
        amount_ml: number | null;
      }>;
      pump_logs: TableShape<{
        user_id: string;
        id: string;
        logged_date: string;
        logged_time: string;
        amount_ml: number;
      }>;
      diaper_logs: TableShape<{
        user_id: string;
        id: string;
        logged_date: string;
        logged_time: string;
        kind: string;
        poop_color: string | null;
        poop_texture: string | null;
      }>;
      sleep_logs: TableShape<{
        user_id: string;
        id: string;
        logged_date: string;
        start_time: string;
        end_time: string;
        period: string;
      }>;
      growth_logs: TableShape<{
        user_id: string;
        id: string;
        measured_on: string;
        weight_kg: number | null;
        length_cm: number | null;
        head_cm: number | null;
      }>;
      solid_logs: TableShape<{
        user_id: string;
        id: string;
        logged_date: string;
        logged_time: string;
        name: string;
        allergy_note: string | null;
      }>;
      health_logs: TableShape<{
        user_id: string;
        id: string;
        logged_date: string;
        logged_time: string;
        name: string;
        dose: string;
        temperature_c: number | null;
      }>;
      potty_logs: TableShape<{
        user_id: string;
        id: string;
        logged_date: string;
        logged_time: string;
        kind: string;
      }>;
      meal_logs: TableShape<{
        user_id: string;
        id: string;
        logged_date: string;
        logged_time: string;
        slot: string;
        note: string;
      }>;
      milestone_logs: TableShape<{
        user_id: string;
        milestone_key: string;
        achieved_on: string;
      }>;
      feedback: TableShape<{
        user_id: string;
        id: string;
        name: string;
        email: string;
        whatsapp: string;
        message: string;
        updated_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
