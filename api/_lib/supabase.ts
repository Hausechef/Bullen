import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  const url = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Privilege ranking used to stop a staff account from creating, promoting to,
// or acting on a role at or above its own tier (horizontal/vertical escalation).
// Unknown roles rank 0 (lowest). 'admin' is the top staff tier.
export const ROLE_RANK: Readonly<Record<string, number>> = {
  agent: 1,
  manager: 2,
  director: 3,
  crm_admin: 3,
  trade_admin: 3,
  admin: 4,
  superadmin: 5,
};

export function rankOf(role: string | null | undefined): number {
  return (role && ROLE_RANK[role]) || 0;
}

/** True if a caller of `callerRole` may assign/create the role `targetRole`. */
export function canAssignRole(callerRole: string | undefined, targetRole: string): boolean {
  return rankOf(targetRole) <= rankOf(callerRole);
}

/** True if a caller of `callerRole` may mutate an existing user of `targetRole`. */
export function canManageTarget(callerRole: string | undefined, targetRole: string | null | undefined): boolean {
  return rankOf(targetRole) <= rankOf(callerRole);
}

export async function requireAdmin(req: any, res: any): Promise<{ id: string; role: string } | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }
  const token = auth.slice(7);
  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role || user.user_metadata?.role) as string | undefined;
  if (role !== "admin" && role !== "director") {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return { id: user.id, role };
}

export async function requireCrmAdmin(req: any, res: any): Promise<string | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }
  const token = auth.slice(7);
  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role || user.user_metadata?.role;
  if (!["admin", "director", "trade_admin"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return user.id;
}

// Roles allowed to manage client file attachments.
// 'superadmin' is forward-compatible only; the current users_role_check does not allow it.
export const CLIENT_FILE_ROLES = ["superadmin", "admin", "director", "manager"] as const;
type ClientFileRole = (typeof CLIENT_FILE_ROLES)[number];

export async function requireCrmStaff(
  req: any,
  res: any,
): Promise<{ id: string; role: string } | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }
  const token = auth.slice(7);
  const supabase = getAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role || user.user_metadata?.role) as string | undefined;
  if (!role || !CLIENT_FILE_ROLES.includes(role as ClientFileRole)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return { id: user.id, role };
}
