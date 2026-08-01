# Supabase migration guide

Gradual path from **localStorage-only** to **Supabase** without rewriting the app at once.

## Current architecture (unchanged by default)

```
UI components
  → useAppStorage()
    → AppStorageProvider
      → lib/storage.ts (localStorage + useSyncExternalStore)
```

With `NEXT_PUBLIC_SUPABASE_ENABLED=false` (default), behavior is identical to before.

## Target architecture (phased)

```
UI components
  → useAppStorage()          ← keep this API stable
    → persist layer
        ├─ localStorage (cache / offline)
        └─ Supabase repositories (when domain flag is on)
  → useSupabase()            ← auth + migration status only (for now)
```

## Database schema

| Table | Purpose |
|-------|---------|
| `profiles` | 1:1 with `auth.users`, locale |
| `baby_profiles` | Baby name, gender, LMP, due date |
| `baby_plus_programs` | Start date, daily time, completions JSON |
| `vitamin_items` | Named vitamins |
| `vitamin_day_logs` | Per-day completion map (`completions` jsonb) |
| `kick_logs` | Individual kick events |
| `water_logs` | Individual water entries |
| `user_settings` | `glass_size_ml` |
| `notification_preferences` | Full `RemindersState` as jsonb |
| `reminder_fired_events` | Dedupe keys (for future server scheduler) |
| `sync_metadata` | Migration / last sync timestamps |
| `scheduled_notifications` | **Future** — cron/interval jobs |

### Why jsonb in places?

- `baby_plus_programs.completions` — matches existing `Record<string, boolean>` keys (`"0-0"`).
- `notification_preferences.preferences` — matches `RemindersState` exactly; avoids 4+ tables for MVP.
- `vitamin_day_logs.completions` — matches `VitaminDayRecord.completed`.

You can normalize reminders into `scheduled_notifications` when you add server-side push.

## Supabase project setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL**: Run `supabase/migrations/20260526000000_initial_schema.sql` in the SQL editor (or use Supabase CLI `supabase db push`).
3. **Auth → Providers**: Enable **Anonymous sign-ins** (MVP, no login UI yet).
4. **API keys**: Copy project URL + anon key into `.env.local` (see `.env.example`).

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Environment flags

| Variable | Default | Meaning |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_ENABLED` | `false` | Master switch |
| `NEXT_PUBLIC_SUPABASE_SYNC_BABY` | `false` | Read/write baby profile via Supabase |
| `NEXT_PUBLIC_SUPABASE_SYNC_KICKS` | … | Per-domain rollout |
| `NEXT_PUBLIC_SUPABASE_SYNC_WATER` | … | |
| `NEXT_PUBLIC_SUPABASE_SYNC_VITAMINS` | … | |
| `NEXT_PUBLIC_SUPABASE_SYNC_BABY_PLUS` | … | |
| `NEXT_PUBLIC_SUPABASE_SYNC_REMINDERS` | … | |

Flip **one domain at a time** after the one-time migration succeeds.

## Folder structure

```
lib/supabase/
  client.ts              # Browser client (singleton)
  server.ts              # Server client (future SSR/API)
  env.ts                 # Config + feature flags
  auth.ts                # Anonymous session helper
  database.types.ts      # DB types (hand-written; replace with CLI later)
  mappers.ts             # AppStorage ↔ rows
  migrate-local.ts       # One-time localStorage sync
  sync-constants.ts
  repositories/
    app-data.ts          # fetch + upsert helpers
components/providers/
  supabase-provider.tsx  # Auth bootstrap + migration on load
supabase/migrations/
  20260526000000_initial_schema.sql
```

## Migration phases (recommended)

### Phase 0 — Infrastructure (you are here)

- [x] SQL schema + RLS
- [x] Supabase client + env flags
- [x] `SupabaseProvider` (disabled by default)
- [x] One-time `runLocalStorageMigration()`
- [ ] Apply SQL in your Supabase project
- [ ] Set `.env.local` keys

**No user-visible change** until `SUPABASE_ENABLED=true`.

### Phase 1 — Upload existing data

1. Set `NEXT_PUBLIC_SUPABASE_ENABLED=true` (keep all `SYNC_*` false).
2. Deploy / run locally — app signs in anonymously and uploads localStorage once.
3. Verify rows in Supabase Table Editor.
4. Device flag `baby-monitor-supabase-migrated-v1` prevents duplicate uploads.

**Conflict rule (MVP):** local data wins on first sync if both sides have data.

### Phase 2 — Read-through per domain

For each feature (start with **kicks** or **water** — append-only logs):

1. Enable `NEXT_PUBLIC_SUPABASE_SYNC_KICKS=true`.
2. In `AppStorageProvider` methods (`addKick`, `removeKick`):
   - Update local state immediately (optimistic).
   - `await supabase.from('kick_logs').insert/delete` in background.
   - On error: revert local state + toast.
3. On app load (after migration): `fetchRemoteAppSlice` → merge into `updateAppStorage`.

Keep localStorage writes during Phase 2 so offline still works.

### Phase 3 — Supabase primary

- Load from Supabase on startup; localStorage becomes cache only.
- Optional: Supabase Realtime subscriptions per table (not required for MVP).

### Phase 4 — Auth upgrade

- Replace anonymous auth with magic link / Google when you need multi-device.
- `auth.users` id stays stable if you link anonymous → permanent account (Supabase supports this).

### Phase 5 — Remove localStorage blob

- Drop `baby-monitor-v1` once all domains use Supabase + you accept offline limits.
- Keep `baby-monitor-locale` or move locale to `profiles.locale`.

## When to sync

| Event | Action |
|-------|--------|
| First visit with Supabase enabled | `runLocalStorageMigration()` (upload or download) |
| User mutation (Phase 2+) | Write local immediately → async Supabase |
| Tab focus (optional later) | Pull remote changes if `last_synced_at` stale |
| Before logout / account link | Final upsert |

Avoid syncing on every reminder poll (15s) — reminders stay client-side until Phase 6.

## Avoiding regressions

1. **Never remove** `updateAppStorage` until Phase 5.
2. **Feature flags** per domain — easy rollback on Vercel.
3. **Same types** — `lib/types.ts` remains source of truth; mappers translate.
4. **Test checklist** per domain: add → refresh → second device (later) → offline add → reconnect.

## Future notifications

Current flow stays in the browser:

`useReminderScheduler` → `getDueReminders` → `Notification` / service worker

**Later**, use `scheduled_notifications`:

| `schedule_type` | Use case |
|-----------------|----------|
| `daily` | Vitamins / kicks at `HH:mm` |
| `interval` | Hydration every N hours |
| `cron` | Complex rules |
| `once` | One-off nudge |

**Suggested backend layout:**

```
scheduled_notifications (what to send, when)
        ↓
Supabase Edge Function or pg_cron (every minute)
        ↓
Query due rows (next_run_at <= now())
        ↓
Web Push / FCM / email
        ↓
Insert reminder_fired_events + update next_run_at
```

`notification_preferences` remains user-facing settings; `scheduled_notifications` is the operational queue derived from those settings (sync via trigger or app code when prefs change).

**Do not** move the 15s client poll to the server until you need push when the app is closed.

## Incremental repository API (Phase 2 example)

```typescript
// lib/supabase/repositories/kicks.ts (add when enabling SYNC_KICKS)
export async function insertKick(supabase, userId, kick: KickEntry) {
  const { error } = await supabase.from("kick_logs").insert(kickToRow(userId, kick));
  if (error) throw error;
}
```

Wire inside `addKick` in `app-storage-provider.tsx` — pattern repeats for water, vitamins, etc.

## Vercel deployment

Add env vars in Project → Settings → Environment Variables (same names as `.env.local`).

## Type generation (optional)

```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase gen types typescript --linked > lib/supabase/database.types.ts
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Anonymous sign-ins are disabled` | Enable in Supabase Auth settings |
| RLS permission denied | Ensure user is signed in; policies use `auth.uid()` |
| Empty tables after “success” | Check `migration` in React DevTools; verify localStorage had data |
| Duplicate kicks after migration | Phase 1 uses full replace; Phase 2 should switch to insert-only |
