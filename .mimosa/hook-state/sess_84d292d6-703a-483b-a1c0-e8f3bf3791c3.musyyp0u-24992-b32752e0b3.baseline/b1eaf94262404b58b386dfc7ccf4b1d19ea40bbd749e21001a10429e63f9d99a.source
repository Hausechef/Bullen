import { getAdminClient, requireCrmAdmin } from "../../../_lib/supabase.js";

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
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const callerId = await requireCrmAdmin(req, res);
  if (!callerId) return;

  const { id } = req.query as { id: string };
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
  let clients = 0, totalDeposits = 0, depositVolume = 0, activeTraders = 0;

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

      activeTraders = new Set((activeTx || []).map((t: any) => t.user_id)).size;
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
}
