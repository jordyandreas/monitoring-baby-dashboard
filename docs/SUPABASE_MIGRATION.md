# Nurtory and Supabase

Each screen calls the service for that feature. The service reads and writes Supabase. There is no shared local note blob and no upload queue.

```
Screen
  → src/services/<feature>.service.ts
    → Supabase table (RLS: auth.uid())
```

Sign-in uses an email account. The session is stored in cookies so `src/proxy.ts` can see it. A visitor without a session who opens a feature route is sent back to `/`, where the login dialog lives. Home stays public.

A failed save shows the error toast and leaves the list on screen unchanged. Nothing is written to the device when the network is down.

## Browser keys that remain

These are device preferences, copied once from the old names:

| Current key | Previous key |
|-------------|--------------|
| `nurtory-locale` | `baby-monitor-locale` |
| `nurtory-mode` | `baby-monitor-mode` |
| `nurtory-age-celebration-dismissed` | `baby-age-celebration-dismissed` |

`baby-monitor-v1` and `baby-monitor-child-v1` are deleted on startup and are not uploaded. The notes already live in the account.

In-memory events: `nurtory-data-refresh`.

Reminders are Web Push. Settings live in the account menu. The sender is the `send-due-reminders` Edge Function.

## Database schema

| Table | Purpose |
|-------|---------|
| `profiles` | 1:1 with `auth.users` |
| `baby_profiles` | Baby name, gender, LMP, due date |
| `baby_plus_programs` | Start date, daily time, completions JSON |
| `vitamin_items` | Named vitamins |
| `vitamin_day_logs` | Per-day completion map |
| `kick_logs` | Individual kick events |
| `water_logs` | Individual water entries |
| `user_settings` | `glass_size_ml` |
| `push_reminder_preferences` | Web Push reminder choices |
| `push_subscriptions` | Browser push endpoints |
| `scheduled_notifications` | Next send time for each reminder |
| `child_profiles` | Child name, gender, birth date |
| `feed_logs` | Milk |
| `diaper_logs` | Diapers |
| `sleep_logs` | Sleep |
| `growth_logs` | Weight, length, head |
| `solid_logs` | Solid food |
| `health_logs` | Medicine and temperature |
| `potty_logs` | Toilet |
| `meal_logs` | Family meals |
| `milestone_logs` | Milestones |

Apply `supabase/migrations/` in the SQL editor or with `supabase db push`.

## Environment

```bash
cp .env.example .env.local
```

| Variable | Meaning |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `NEXT_PUBLIC_SUPABASE_ENABLED` | `true` turns on sign-in, proxy, and saves |

Auth uses email sign-in. A browser that signed in before cookies were used needs to sign in once more.

## Services

Pregnancy: `baby`, `baby-plus`, `vitamins`, `kicks`, `water`.

Push reminders: `push-reminders`.

Child: `child`, `feed`, `diapers`, `sleep`, `growth`, `solids`, `health`, `potty`, `meals`, `milestones`.

Mappers stay in `src/lib/supabase/mappers.ts` and `src/lib/supabase/child-mappers.ts`. The browser client is `src/lib/supabase/client.ts`.
