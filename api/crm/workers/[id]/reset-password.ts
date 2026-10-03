import { getAdminClient, requireAdmin, canManageTarget } from "../../../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const caller = await requireAdmin(req, res);
  if (!caller) return;

  const { id } = req.query as { id: string };
  const { password } = req.body ?? {};

  if (!password || password.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  const supabase = getAdminClient();

  // Cannot reset the password of a user who outranks you (blocks superior-account takeover).
  const { data: targetUser } = await supabase.from("users").select("role").eq("id", id).single();
  if (!canManageTarget(caller.role, targetUser?.role)) {
    res.status(403).json({ error: "Cannot reset the password of a user at or above your own role" });
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ success: true });
}
