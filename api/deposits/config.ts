import { getAdminClient } from "../_lib/supabase.js";
import { requireUser } from "../_lib/payment-auth.js";
import { loadCompanyContext } from "../_lib/trapay/config.js";

// User-facing deposit configuration: only what the deposit form needs —
// enabled methods, currencies and limits. No credentials, URLs or provider
// internals are exposed here.

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const caller = await requireUser(req, res);
  if (!caller) return;

  const supabase = getAdminClient();
  const context = await loadCompanyContext(supabase);
  if (!context || !context.settings || !context.settings.enabled) {
    res.json({ enabled: false, methods: { card: false, bankTransfer: false }, currencies: [], defaultCurrency: null, minimumDeposit: null, maximumDeposit: null });
    return;
  }
  const s = context.settings;
  res.json({
    enabled: true,
    companyName: context.company.name,
    methods: { card: s.card_enabled, bankTransfer: s.bank_transfer_enabled },
    currencies: s.supported_currencies,
    defaultCurrency: s.default_currency,
    minimumDeposit: Number(s.minimum_deposit),
    maximumDeposit: Number(s.maximum_deposit),
  });
}
