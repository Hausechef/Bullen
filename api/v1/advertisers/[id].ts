import { getAdminClient, requireCrmAdmin } from "../../_lib/supabase.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "PATCH") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const callerId = await requireCrmAdmin(req, res);
  if (!callerId) return;

  const { id } = req.query as { id: string };
  const { name, description, isActive } = req.body ?? {};

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

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data });
}
