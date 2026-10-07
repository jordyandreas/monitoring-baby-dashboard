import type { Database } from "@/lib/supabase/database.types";
import { throwOnError, withAccount } from "@/services/account";

type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];

export type FeedbackInput = {
  name: string;
  email: string;
  whatsapp: string;
  message: string;
};

export type FeedbackEntry = FeedbackInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

function rowToFeedback(row: FeedbackRow): FeedbackEntry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFeedback(): Promise<FeedbackEntry[]> {
  return withAccount(async (supabase, userId) => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToFeedback);
  });
}

export async function insertFeedback(input: FeedbackInput): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(
      supabase.from("feedback").insert({
        user_id: userId,
        name: input.name.trim(),
        email: input.email.trim(),
        whatsapp: input.whatsapp.trim(),
        message: input.message.trim(),
      }),
    );
  });
}

export async function updateFeedback(id: string, patch: Partial<FeedbackInput>): Promise<void> {
  await withAccount(async (supabase, userId) => {
    const row: Database["public"]["Tables"]["feedback"]["Update"] = {};
    if (patch.name !== undefined) row.name = patch.name.trim();
    if (patch.email !== undefined) row.email = patch.email.trim();
    if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp.trim();
    if (patch.message !== undefined) row.message = patch.message.trim();
    await throwOnError(supabase.from("feedback").update(row).eq("user_id", userId).eq("id", id));
  });
}

export async function deleteFeedback(id: string): Promise<void> {
  await withAccount(async (supabase, userId) => {
    await throwOnError(supabase.from("feedback").delete().eq("user_id", userId).eq("id", id));
  });
}
