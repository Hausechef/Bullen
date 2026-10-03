import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getAdminClient() {
  const url = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] || "";
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireCrmAdmin(req: any, res: any): Promise<string | null> {
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

function mapCode(c: any) {
  return {
    id: c.id,
    code: c.code,
    advertiserId: c.advertiser_id,
    campaignName: c.campaign_name,
    createdAt: c.created_at,
  };
}

// ── GET /api/v1/advertisers ───────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const callerId = await requireCrmAdmin(req, res);
    if (!callerId) return;

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("advertisers")
      .select(`
        id, name, description, is_active, created_at,
        codes:referral_codes(id, code, campaign_name, advertiser_id, created_at)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const advertisers = (data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      isActive: a.is_active,
      createdAt: a.created_at,
      codes: (a.codes || []).map(mapCode),
    }));

    res.json({ data: advertisers });
  } catch (err: any) {
    req.log.error({ err }, "GET /v1/advertisers error");
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/v1/advertisers ──────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const callerId = await requireCrmAdmin(req, res);
    if (!callerId) return;

    const { name, description } = req.body as { name?: string; description?: string };
    if (!name || name.trim().length < 2) {
      res.status(400).json({ message: "Name must be at least 2 characters" });
      return;
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("advertisers")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select()
      .single();

    if (error) throw error;

    req.log.info({ id: data.id, name: data.name }, "Advertiser created");
    res.status(201).json({ data });
  } catch (err: any) {
    req.log.error({ err }, "POST /v1/advertisers error");
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/v1/advertisers/:id ─────────────────────────────────────────────
router.patch("/:id", async (req, res) => {
  try {
    const callerId = await requireCrmAdmin(req, res);
    if (!callerId) return;

    const { id } = req.params as { id: string };
    const { name, description, isActive } = req.body as {
      name?: string;
      description?: string;
      isActive?: boolean;
    };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates["name"] = name.trim();
    if (description !== undefined) updates["description"] = description.trim() || null;
    if (isActive !== undefined) updates["is_active"] = isActive;

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("advertisers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    req.log.info({ id }, "Advertiser updated");
    res.json({ data });
  } catch (err: any) {
    req.log.error({ err }, "PATCH /v1/advertisers/:id error");
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/v1/advertisers/:id/stats ────────────────────────────────────────
router.get("/:id/stats", async (req, res) => {
  try {
    const callerId = await requireCrmAdmin(req, res);
    if (!callerId) return;

    const { id } = req.params as { id: string };
    const supabase = getAdminClient();

    const { data: advertiser, error: advErr } = await supabase
      .from("advertisers")
      .select(`
        id, name, is_active, description,
        codes:referral_codes(id, code, campaign_name, advertiser_id, created_at)
      `)
      .eq("id", id)
      .single();

    if (advErr || !advertiser) {
      res.status(404).json({ error: "Advertiser not found" });
      return;
    }

    const codeCodes: string[] = (advertiser.codes || []).map((c: any) => c.code);

    let clients = 0;
    let totalDeposits = 0;
    let depositVolume = 0;
    let activeTraders = 0;

    if (codeCodes.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .in("referral_code", codeCodes);

      const userIds = (users || []).map((u: any) => u.id);
      clients = userIds.length;

      if (userIds.length > 0) {
        const { data: deposits } = await supabase
          .from("transactions")
          .select("amount")
          .in("user_id", userIds)
          .eq("type", "deposit")
          .eq("status", "approved");

        totalDeposits = (deposits || []).length;
        depositVolume = (deposits || []).reduce(
          (sum: number, d: any) => sum + (Number(d.amount) || 0),
          0,
        );

        const { data: activeTx } = await supabase
          .from("transactions")
          .select("user_id")
          .in("user_id", userIds);

        const uniqueActive = new Set((activeTx || []).map((t: any) => t.user_id));
        activeTraders = uniqueActive.size;
      }
    }

    res.json({
      data: {
        advertiser: {
          id: advertiser.id,
          name: advertiser.name,
          isActive: advertiser.is_active,
          description: advertiser.description,
        },
        codes: (advertiser.codes || []).map(mapCode),
        clients,
        totalDeposits,
        totalVolume: depositVolume,
        activeTraders,
      },
    });
  } catch (err: any) {
    req.log.error({ err }, "GET /v1/advertisers/:id/stats error");
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/v1/advertisers/:id/codes ───────────────────────────────────────
router.post("/:id/codes", async (req, res) => {
  try {
    const callerId = await requireCrmAdmin(req, res);
    if (!callerId) return;

    const { id } = req.params as { id: string };
    const { code, campaignName } = req.body as { code?: string; campaignName?: string };

    if (!code || code.trim().length < 3) {
      res.status(400).json({ message: "Code must be at least 3 characters" });
      return;
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({
        code: code.trim().toUpperCase(),
        advertiser_id: id,
        campaign_name: campaignName?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        res.status(409).json({ message: "This referral code already exists" });
        return;
      }
      throw error;
    }

    req.log.info({ advertiserId: id, code: data.code }, "Referral code created");
    res.status(201).json({ data: mapCode(data) });
  } catch (err: any) {
    req.log.error({ err }, "POST /v1/advertisers/:id/codes error");
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/v1/advertisers/:id/codes/:codeId ─────────────────────────────
router.delete("/:id/codes/:codeId", async (req, res) => {
  try {
    const callerId = await requireCrmAdmin(req, res);
    if (!callerId) return;

    const { codeId } = req.params as { codeId: string };
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("referral_codes")
      .delete()
      .eq("id", codeId);

    if (error) throw error;

    req.log.info({ codeId }, "Referral code deleted");
    res.json({ deleted: true });
  } catch (err: any) {
    req.log.error({ err }, "DELETE /v1/advertisers/:id/codes/:codeId error");
    res.status(500).json({ error: err.message });
  }
});

export default router;
