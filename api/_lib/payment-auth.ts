import { getAdminClient } from "./supabase.js";

// Strict bearer-token authentication for the payment endpoints.
// Unlike the generic CRM guards, the role is read ONLY from the users table —
// never from auth.users.user_metadata, which must not determine authorization.

export interface Caller {
  id: string;
  email: string | null;
  role: string | null;
}

async function resolveCaller(req: any, res: any): Promise<Caller | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }
  const supabase = getAdminClient();
  const { data: userData, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !userData?.user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const user = userData.user;
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, role, kyc_status")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    res.status(403).json({ error: "Profile not found" });
    return null;
  }
  return { id: profile.id, email: profile.email ?? null, role: profile.role ?? null };
}

export async function requireUser(req: any, res: any): Promise<Caller | null> {
  return resolveCaller(req, res);
}

const STAFF_VIEW_ROLES = ["admin", "director", "trade_admin", "crm_admin"] as const;

export async function requirePaymentStaff(req: any, res: any): Promise<Caller | null> {
  const caller = await resolveCaller(req, res);
  if (!caller) return null;
  if (!STAFF_VIEW_ROLES.includes(caller.role as (typeof STAFF_VIEW_ROLES)[number])) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return caller;
}

// Payment configuration changes (credentials, gateways, environment) are
// restricted to the platform's top tier — the 'admin' role.
export async function requirePaymentAdmin(req: any, res: any): Promise<Caller | null> {
  const caller = await resolveCaller(req, res);
  if (!caller) return null;
  if (caller.role !== "admin") {
    res.status(403).json({ error: "Only platform administrators may change payment configuration" });
    return null;
  }
  return caller;
}
