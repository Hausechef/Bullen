import { getAdminClient, requireCrmAdmin } from "../../_lib/supabase.js";

function mapCode(c: any) {
  return {
    id: c.id,
    code: c.code,
    advertiserId: c.advertiser_id,
    campaignName: c.campaign_name,
    createdAt: c.created_at,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
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

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const advertisers = (data || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      isActive: a.is_active,
      createdAt: a.created_at,
      codes: (a.codes || []).map(mapCode),
    }));

    res.json({ data: advertisers });
    return;
  }

  if (req.method === "POST") {
    const callerId = await requireCrmAdmin(req, res);
    if (!callerId) return;

    const { name, description } = req.body ?? {};
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

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ data });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
