/** localStorage flag: local data was uploaded to Supabase for this browser profile. */
export const DEVICE_MIGRATION_FLAG_KEY = "baby-monitor-supabase-migrated-v1";

/** localStorage flag: a remote write failed and the next load should push local data. */
export const LOCAL_DIRTY_KEY = "baby-monitor-supabase-dirty-v1";

/** localStorage flag: a child-mode write failed and the next load should push child data. */
export const CHILD_DIRTY_KEY = "baby-monitor-child-dirty-v1";
