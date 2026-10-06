import { getAdminClient, requireCrmAdmin } from "../../../../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const callerId = await requireCrmAdmin(req, res);
  if (!callerId) return;

  const { id } = req.query as { id: string };
  const { code, campaignName } = req.body ?? {};

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
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json({
    data: {
      id: data.id,
      code: data.code,
      advertiserId: data.advertiser_id,
      campaignName: data.campaign_name,
      createdAt: data.created_at,
    },
  });
}
