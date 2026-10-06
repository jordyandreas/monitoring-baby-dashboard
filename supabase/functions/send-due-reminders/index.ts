import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.49.8";
import webpushImport from "npm:web-push@3.6.7";
import {
  computeSchedules,
  parsePushPreferences,
  zonedDateString,
  type PushKind,
  type PushLocale,
  type ScheduleDraft,
  type ScheduleSource,
} from "../_shared/schedule.ts";

type WebPush = {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
  ) => Promise<unknown>;
};

const imported = webpushImport as WebPush & { default?: WebPush };
const webpush: WebPush =
  typeof imported.setVapidDetails === "function" ? imported : (imported.default as WebPush);

type Admin = SupabaseClient;

type DueRow = {
  id: string;
  user_id: string;
  kind: string;
  payload: Record<string, unknown> | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isLocale(value: string | null | undefined): value is PushLocale {
  return value === "en" || value === "id";
}

function sentKey(payload: Record<string, unknown> | null): string | null {
  const value = payload?.sentKey;
  return typeof value === "string" ? value : null;
}

function jwtRole(token: string): string | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function isVerifiedServiceRole(message: string): boolean {
  return message.toLowerCase().includes("missing sub");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") return json({ error: "POST only" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:nurtory@localhost";
  if (!supabaseUrl || !anonKey || !serviceKey || !vapidPublic || !vapidPrivate) {
    return json({ error: "Push is not configured" }, 500);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const admin = createClient(supabaseUrl, serviceKey);
  const body = await request.json().catch(() => ({}));

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  const serviceRole =
    token === serviceKey.trim() ||
    (jwtRole(token) === "service_role" &&
      !userData.user &&
      isVerifiedServiceRole(userError?.message ?? ""));
  if (serviceRole) {
    const sent = await processDue(admin);
    return json({ sent });
  }
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
  if (body?.test !== true) return json({ error: "Unsupported" }, 400);

  const delivered = await sendToUser(admin, userData.user.id, {
    title: typeof body.title === "string" ? body.title : "Nurtory",
    body: typeof body.body === "string" ? body.body : "",
    url: "/",
    tag: `test:${Date.now()}`,
  });
  if (delivered === 0) return json({ error: "No subscription" }, 409);
  return json({ delivered });
});

async function processDue(admin: Admin): Promise<number> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("scheduled_notifications")
    .select("id, user_id, kind, payload")
    .eq("enabled", true)
    .lte("next_run_at", now);
  if (error) throw new Error(error.message);

  const due = (data ?? []) as DueRow[];
  const byUser = new Map<string, DueRow[]>();
  for (const row of due) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row);
    byUser.set(row.user_id, list);
  }

  let sent = 0;
  for (const [userId, rows] of byUser) {
    sent += await deliverUser(admin, userId, rows);
  }
  return sent;
}

async function deliverUser(admin: Admin, userId: string, dueRows: DueRow[]): Promise<number> {
  const source = await loadSource(admin, userId);
  const drafts = computeSchedules(source);
  await saveDrafts(admin, userId, drafts);

  let sent = 0;
  for (const row of dueRows) {
    const draft = drafts.find((item) => item.kind === row.kind);
    if (!draft?.payload.due || !draft.payload.pendingKey) continue;
    const { data: claimed, error } = await admin.rpc("claim_push_slot", {
      row_id: row.id,
      pending: draft.payload.pendingKey,
    });
    if (error || claimed !== true) continue;

    const result = await sendToUser(admin, userId, {
      title: draft.payload.title,
      body: draft.payload.body,
      url: draft.payload.url,
      tag: draft.payload.tag,
    });
    if (result.failed > 0 && result.delivered === 0 && result.gone === 0) {
      await admin
        .from("scheduled_notifications")
        .update({
          payload: { ...draft.payload, sentKey: source.sentKeys[draft.kind] ?? null },
        })
        .eq("id", row.id);
      continue;
    }

    source.sentKeys[draft.kind] = draft.payload.pendingKey;
    sent += result.delivered;
  }

  await saveDrafts(admin, userId, computeSchedules(source));
  return sent;
}

async function loadSource(admin: Admin, userId: string): Promise<ScheduleSource> {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("timezone, locale")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  const timeZone = profile?.timezone || "Asia/Jakarta";
  const locale: PushLocale = isLocale(profile?.locale) ? profile.locale : "id";
  const today = zonedDateString(new Date(), timeZone);

  const [prefsRes, feedRes, itemsRes, daysRes, kickRes, waterRes, babyRes, scheduleRes] =
    await Promise.all([
      admin.from("push_reminder_preferences").select("preferences").eq("user_id", userId).maybeSingle(),
      admin
        .from("feed_logs")
        .select("logged_date, logged_time")
        .eq("user_id", userId)
        .order("logged_date", { ascending: false })
        .order("logged_time", { ascending: false })
        .limit(1),
      admin.from("vitamin_items").select("id, name").eq("user_id", userId),
      admin.from("vitamin_day_logs").select("log_date, completions").eq("user_id", userId).eq("log_date", today),
      admin.from("kick_logs").select("logged_date").eq("user_id", userId).eq("logged_date", today),
      admin
        .from("water_logs")
        .select("logged_date, logged_time")
        .eq("user_id", userId)
        .eq("logged_date", today),
      admin.from("baby_plus_programs").select("start_date, daily_time, completions").eq("user_id", userId).maybeSingle(),
      admin.from("scheduled_notifications").select("kind, payload").eq("user_id", userId),
    ]);

  for (const result of [prefsRes, feedRes, itemsRes, daysRes, kickRes, waterRes, babyRes, scheduleRes]) {
    if (result.error) throw new Error(result.error.message);
  }

  const named = (itemsRes.data ?? []).filter((item) => item.name.trim().length > 0);
  const completions = asRecord(daysRes.data?.[0]?.completions);
  const done = named.filter((item) => completions[item.id] === true).length;
  const baby = babyRes.data;
  const sentKeys: ScheduleSource["sentKeys"] = {};
  for (const row of scheduleRes.data ?? []) {
    if (isKind(row.kind)) sentKeys[row.kind] = sentKey(asRecord(row.payload));
  }
  const latest = feedRes.data?.[0];

  return {
    now: new Date(),
    timeZone,
    locale,
    preferences: parsePushPreferences(prefsRes.data?.preferences),
    sentKeys,
    latestFeed: latest ? { date: latest.logged_date, time: latest.logged_time } : null,
    vitaminNamedCount: named.length,
    vitaminDoneCount: done,
    vitaminLogDate: daysRes.data?.[0]?.log_date ?? "",
    kickDates: (kickRes.data ?? []).map((row) => row.logged_date),
    waterLogs: (waterRes.data ?? []).map((row) => ({
      date: row.logged_date,
      time: row.logged_time,
    })),
    babyPlus: baby
      ? {
          startDate: baby.start_date ?? "",
          dailyTime: baby.daily_time ?? "",
          completions: asRecord(baby.completions) as Record<string, boolean>,
        }
      : null,
  };
}

async function saveDrafts(admin: Admin, userId: string, drafts: ScheduleDraft[]): Promise<void> {
  for (const draft of drafts) {
    const { error } = await admin.from("scheduled_notifications").upsert(
      {
        user_id: userId,
        kind: draft.kind,
        enabled: draft.enabled,
        schedule_type: draft.scheduleType,
        next_run_at: draft.nextRunAt,
        payload: draft.payload,
      },
      { onConflict: "user_id,kind" },
    );
    if (error) throw new Error(error.message);
  }
}

async function sendToUser(
  admin: Admin,
  userId: string,
  message: { title: string; body: string; url: string; tag: string },
): Promise<{ delivered: number; gone: number; failed: number }> {
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  let delivered = 0;
  let gone = 0;
  let failed = 0;
  for (const sub of data ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(message),
      );
      delivered += 1;
    } catch (error) {
      const status = statusCode(error);
      if (status === 404 || status === 410) {
        gone += 1;
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        failed += 1;
      }
    }
  }
  return { delivered, gone, failed };
}

function statusCode(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return null;
  const status = (error as { statusCode?: unknown }).statusCode;
  return typeof status === "number" ? status : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function isKind(value: string): value is PushKind {
  return (
    value === "feed" ||
    value === "vitamins" ||
    value === "babyPlus" ||
    value === "kicks" ||
    value === "hydration"
  );
}
