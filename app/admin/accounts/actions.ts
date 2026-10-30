"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MEMBER_STATUSES } from "@/lib/accounts/kinds";
import { uuidSchema } from "@/lib/admin/filters";
import { logAdminError } from "@/lib/admin/server";
import { requireStaff } from "@/lib/auth/admin";

export type ReviewState = { error?: string; notice?: string } | null;

const input = z.object({ profile: uuidSchema, status: z.enum(MEMBER_STATUSES) });

/**
 * Approve, suspend or reopen a member account. Staff only (checked before any input is read); the database function
 * checks the role again, records who reviewed and when, and writes the audit row.
 */
export async function reviewMemberAccount(_prev: ReviewState, data: FormData): Promise<ReviewState> {
  const { supabase } = await requireStaff();
  const parsed = input.safeParse({ profile: data.get("profile"), status: data.get("status") });
  if (!parsed.success) return { error: "That request was not understood." };
  const { error } = await supabase.rpc("review_member_account", { p_profile: parsed.data.profile, p_status: parsed.data.status });
  if (error) {
    logAdminError("admin.member_review_failed", error);
    return { error: error.code === "42501" ? "Your account cannot change this." : error.code === "P0002" ? "That account no longer exists." : "The change was not saved. Please try again." };
  }
  revalidatePath("/admin/accounts");
  return { notice: parsed.data.status === "active" ? "Approved." : parsed.data.status === "suspended" ? "Put on hold." : "Moved back to review." };
}
