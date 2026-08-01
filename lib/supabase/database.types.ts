/**
 * Hand-maintained types matching supabase/migrations/20260526000000_initial_schema.sql
 * Regenerate later with: supabase gen types typescript --local > lib/supabase/database.types.ts
 */
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          locale?: string;
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
      notification_preferences: {
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
      reminder_fired_events: {
        Row: {
          user_id: string;
          dedupe_key: string;
          fired_on: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          dedupe_key: string;
          fired_on?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          dedupe_key?: string;
          fired_on?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
