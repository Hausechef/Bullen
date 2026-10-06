// Supabase Edge Function: crm-workers
// Privileged CRM worker operations (create / delete / reset-password) using
// the service_role key. Caller must be authenticated and hold an admin-tier
// role. Role/name updates are handled client-side via RLS, not here.
//
// Deploy:  supabase functions deploy crm-workers --project-ref <ref>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CRM_ROLES = ["agent", "manager", "director", "admin"];
const ADMIN_ROLES = [
  "admin",
  "crm_admin",
  "director",
  "super-admin",
  "superadmin",
];

// Privilege ranking: a caller may not create, promote to, or act on a role at
// or above its own tier. Unknown roles rank 0. Mirrors api/_lib/supabase.ts.
const ROLE_RANK: Record<string, number> = {
  agent: 1,
  manager: 2,
  director: 3,
  crm_admin: 3,
  trade_admin: 3,
  admin: 4,
  "super-admin": 5,
  superadmin: 5,
};
const rankOf = (
  role: string | null | undefined,
): number => (role ? ROLE_RANK[role] ?? 0 : 0);

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, obj: unknown) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const url = requiredEnv("SUPABASE_URL");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authenticate the caller and check role.
    const token = (req.headers.get("Authorization") || "").replace(
      "Bearer ",
      "",
    );
    const { data: { user }, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !user) return json(401, { error: "Invalid token" });
    const { data: profile } = await admin.from("users").select("role").eq(
      "id",
      user.id,
    ).single();
    const role = (profile?.role || (user.user_metadata as any)?.role) as
      | string
      | undefined;
    if (!role || !ADMIN_ROLES.includes(role)) {
      return json(403, { error: "Insufficient permissions" });
    }

    const body = await req.json().catch(() => ({} as any));
    const action = body.action as string;

    if (action === "create") {
      const { email, password, full_name, role: newRole } = body;
      if (!email || !password || !newRole) {
        return json(400, { error: "email, password and role are required" });
      }
      if (!CRM_ROLES.includes(newRole)) {
        return json(400, {
          error: `role must be one of: ${CRM_ROLES.join(", ")}`,
        });
      }
      if (rankOf(newRole) > rankOf(role)) {
        return json(403, {
          error: "Cannot create a user with a role at or above your own",
        });
      }
      if (String(password).length < 8) {
        return json(400, { error: "Password must be at least 8 characters" });
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "", role: newRole },
      });
      if (error) return json(500, { error: error.message });
      const id = created.user.id;
      const { error: profileError } = await admin.from("users").upsert({
        id,
        email,
        full_name: full_name || "",
        display_name: full_name || email.split("@")[0],
        role: newRole,
        kyc_status: "VERIFIED",
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(id).catch(() => undefined);
        return json(500, { error: profileError.message });
      }
      return json(201, {
        id,
        email,
        role: newRole,
        full_name: full_name || "",
      });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return json(400, { error: "id required" });
      if (id === user.id) {
        return json(400, { error: "Cannot delete your own account" });
      }
      const { data: target } = await admin.from("users").select("role").eq(
        "id",
        id,
      ).single();
      if (rankOf(target?.role) > rankOf(role)) {
        return json(403, {
          error: "Cannot delete a user at or above your own role",
        });
      }
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json(500, { error: error.message });
      return json(200, { deleted: true });
    }

    if (action === "reset-password") {
      const { id, password } = body;
      if (!id || !password) {
        return json(400, { error: "id and password are required" });
      }
      if (String(password).length < 8) {
        return json(400, { error: "Password must be at least 8 characters" });
      }
      const { data: target } = await admin.from("users").select("role").eq(
        "id",
        id,
      ).single();
      if (rankOf(target?.role) > rankOf(role)) {
        return json(403, {
          error:
            "Cannot reset the password of a user at or above your own role",
        });
      }
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) return json(500, { error: error.message });
      return json(200, { reset: true });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(500, { error: String((e as Error)?.message || e) });
  }
});
