import { Router, type Request, type Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const router = Router();

const DEFAULT_WSS_URL = "wss://pbx.bullenhaus.st/ws";
const DEFAULT_SIP_DOMAIN = "bullenhaus.st";
const AGENT_EXTENSION = "101";

function getAdminClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  if (!/^https:\/\/[\w-]+\.supabase\.co$/.test(url)) {
    throw new Error("Supabase URL rejected by allowlist");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function bearerToken(req: Request): string | null {
  const value = req.headers.authorization;
  return value?.startsWith("Bearer ") ? value.slice(7).trim() || null : null;
}

/**
 * Return the SIP credentials only to a currently authenticated CRM agent.
 * The password is deliberately server-only and is never logged or included
 * in a public Vite build.
 */
router.get("/config", async (req: Request, res: Response) => {
  // This response contains a short-lived browser SIP credential boundary.
  // Prevent browsers, reverse proxies, and shared caches from retaining it.
  res.set({
    "Cache-Control": "private, no-store, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Authorization",
  });

  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  try {
    const supabase = getAdminClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // public.users is authoritative. Editable auth metadata cannot grant SIP access.
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "agent") {
      res.status(403).json({ error: "Telephony is available to agents only" });
      return;
    }

    const sipPassword = process.env["BULLENHAUS_SIP_101_PASSWORD"] || process.env["SIP_101_PASSWORD"];
    if (!sipPassword?.trim()) {
      // Fail closed rather than returning the old client-side placeholder.
      res.status(503).json({ error: "Telephony is not configured" });
      return;
    }

    res.json({
      sipUser: process.env["BULLENHAUS_SIP_101_USER"] || AGENT_EXTENSION,
      sipPassword: sipPassword.trim(),
      sipDomain: process.env["BULLENHAUS_PBX_SIP_DOMAIN"] || DEFAULT_SIP_DOMAIN,
      wssUrl: process.env["BULLENHAUS_PBX_WSS_URL"] || DEFAULT_WSS_URL,
    });
  } catch (error) {
    req.log?.error({ err: error }, "GET /telephony/config error");
    res.status(503).json({ error: "Telephony configuration is unavailable" });
  }
});

export default router;
