-- Keep each gram. numeric(5,2) stored kilograms to 0.01 kg, so 3975 g became 3.98 kg.
alter table public.growth_logs
  alter column weight_kg type numeric(6,3);
