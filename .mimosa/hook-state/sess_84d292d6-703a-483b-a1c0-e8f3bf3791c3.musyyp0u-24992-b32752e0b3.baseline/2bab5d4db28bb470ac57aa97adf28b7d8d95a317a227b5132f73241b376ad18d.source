import { getAdminClient, requireAdmin, canAssignRole } from "../../_lib/supabase.js";

const CRM_ROLES = ["agent", "manager", "director", "admin"] as const;
type CrmRole = (typeof CRM_ROLES)[number];

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const caller = await requireAdmin(req, res);
    if (!caller) return;

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, display_name, role, kyc_status, created_at, updated_at")
      .in("role", CRM_ROLES)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ workers: data || [] });
    return;
  }

  if (req.method === "POST") {
    const caller = await requireAdmin(req, res);
    if (!caller) return;

    const { email, password, full_name, role } = req.body ?? {};

    if (!email || !password || !role) {
      res.status(400).json({ error: "email, password and role are required" });
      return;
    }
    if (!CRM_ROLES.includes(role as CrmRole)) {
      res.status(400).json({ error: `role must be one of: ${CRM_ROLES.join(", ")}` });
      return;
    }
    if (!canAssignRole(caller.role, role)) {
      res.status(403).json({ error: "Cannot create a user with a role at or above your own" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const supabase = getAdminClient();
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "", role },
    });
    if (authErr) {
      res.status(500).json({ error: authErr.message });
      return;
    }

    const userId = authData.user.id;
    const displayName = full_name || email.split("@")[0];

    await supabase.from("users").upsert({
      id: userId,
      email,
      full_name: full_name || "",
      display_name: displayName,
      role,
      kyc_status: "VERIFIED",
    });

    res.status(201).json({ id: userId, email, role, full_name: full_name || "" });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
