-- Customizable ml chip presets for bottle feed + pump (null = app defaults).
alter table public.user_settings
  add column bottle_ml_presets int[] null;

alter table public.user_settings
  add constraint user_settings_bottle_ml_presets_len
  check (
    bottle_ml_presets is null
    or cardinality(bottle_ml_presets) between 1 and 20
  );
