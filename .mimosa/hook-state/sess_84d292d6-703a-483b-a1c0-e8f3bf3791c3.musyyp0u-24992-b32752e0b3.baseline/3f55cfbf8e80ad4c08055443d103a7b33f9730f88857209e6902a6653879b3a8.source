import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger";

const router = Router();

function getAdminClient() {
  const url = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const CRM_ROLES = ["agent", "manager", "director", "admin"] as const;
type CrmRole = (typeof CRM_ROLES)[number];

// ── Verify caller is admin (via Bearer token) ─────────────────────────────────
async function requireAdmin(req: any, res: any): Promise<string | null> {
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
  // Check role in public.users
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role || user.user_metadata?.role;
  if (role !== "admin" && role !== "director") {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }
  return user.id;
}

// ── GET /api/crm/workers — list all CRM workers ───────────────────────────────
router.get("/workers", async (req, res) => {
  try {
    const callerId = await requireAdmin(req, res);
    if (!callerId) return;

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, display_name, role, kyc_status, created_at, updated_at")
      .in("role", CRM_ROLES)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ workers: data || [] });
  } catch (err: any) {
    req.log.error({ err }, "GET /crm/workers error");
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/crm/workers — create new worker ─────────────────────────────────
router.post("/workers", async (req, res) => {
  try {
    const callerId = await requireAdmin(req, res);
    if (!callerId) return;

    const { email, password, full_name, role } = req.body as {
      email?: string;
      password?: string;
      full_name?: string;
      role?: string;
    };

    if (!email || !password || !role) {
      res.status(400).json({ error: "email, password and role are required" });
      return;
    }
    if (!CRM_ROLES.includes(role as CrmRole)) {
      res.status(400).json({ error: `role must be one of: ${CRM_ROLES.join(", ")}` });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const supabase = getAdminClient();

    // Create auth user (email already confirmed)
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || "", role },
    });
    if (authErr) throw authErr;

    const userId = authData.user.id;
    const displayName = full_name || email.split("@")[0];

    // Upsert public.users row
    const { error: profileErr } = await supabase.from("users").upsert({
      id: userId,
      email,
      full_name: full_name || "",
      display_name: displayName,
      role,
      kyc_status: "VERIFIED",
    });
    if (profileErr) {
      logger.warn({ profileErr }, "Worker created in auth but public.users upsert failed");
    }

    req.log.info({ userId, email, role }, "CRM worker created");
    res.status(201).json({ id: userId, email, role, full_name: full_name || "" });
  } catch (err: any) {
    req.log.error({ err }, "POST /crm/workers error");
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/crm/workers/:id — update role / name ──────────────────────────
router.patch("/workers/:id", async (req, res) => {
  try {
    const callerId = await requireAdmin(req, res);
    if (!callerId) return;

    const { id } = req.params as { id: string };
    const { role, full_name } = req.body as { role?: string; full_name?: string };

    if (role && !CRM_ROLES.includes(role as CrmRole)) {
      res.status(400).json({ error: `role must be one of: ${CRM_ROLES.join(", ")}` });
      return;
    }

    const supabase = getAdminClient();
    const updates: Record<string, string> = {};
    if (role) updates["role"] = role;
    if (full_name !== undefined) {
      updates["full_name"] = full_name;
      updates["display_name"] = full_name;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("users").update(updates).eq("id", id);
      if (error) throw error;
    }

    // Sync role to auth user_metadata
    if (role) {
      await supabase.auth.admin.updateUserById(id, {
        user_metadata: { role },
      });
    }

    req.log.info({ id, updates }, "CRM worker updated");
    res.json({ id, ...updates });
  } catch (err: any) {
    req.log.error({ err }, "PATCH /crm/workers/:id error");
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/crm/workers/:id — delete worker ───────────────────────────────
router.delete("/workers/:id", async (req, res) => {
  try {
    const callerId = await requireAdmin(req, res);
    if (!callerId) return;

    const { id } = req.params as { id: string };

    // Prevent self-deletion
    if (id === callerId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    req.log.info({ id }, "CRM worker deleted");
    res.json({ deleted: true });
  } catch (err: any) {
    req.log.error({ err }, "DELETE /crm/workers/:id error");
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/crm/workers/:id/reset-password ─────────────────────────────────
router.post("/workers/:id/reset-password", async (req, res) => {
  try {
    const callerId = await requireAdmin(req, res);
    if (!callerId) return;

    const { id } = req.params as { id: string };
    const { password } = req.body as { password?: string };

    if (!password || password.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }

    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.updateUserById(id, { password });
    if (error) throw error;

    req.log.info({ id }, "CRM worker password reset");
    res.json({ success: true });
  } catch (err: any) {
    req.log.error({ err }, "POST /crm/workers/:id/reset-password error");
    res.status(500).json({ error: err.message });
  }
});

export default router;
