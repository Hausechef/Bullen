import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const JSON_HEADERS = { ...CORS, "Content-Type": "application/json" };

const ALLOWED_MODULES = ["clients", "leads", "users", "transactions"] as const;
type Module = typeof ALLOWED_MODULES[number];

// Column allowlists — never export sensitive internal fields
const MODULE_COLUMNS: Record<Module, string> = {
  users:
    "id,email,full_name,display_name,role,kyc_status,balance,realized_pnl,created_at",
  transactions:
    "id,user_id,user_email,user_name,type,status,amount,currency,method,created_at",
  clients: "*",
  leads: "*",
};

// Supabase table name for each module
const MODULE_TABLE: Record<Module, string> = {
  users: "users",
  transactions: "transactions",
  clients: "clients",
  leads: "leads",
};

function jsonError(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: JSON_HEADERS,
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const header = keys.join(",");
  const body = rows.map((row) => keys.map((k) => escape(row[k])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "GET") {
      return jsonError("Method not allowed — use GET", 405);
    }

    // ── 1. Auth: verify caller identity ───────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonError("Unauthorized", 401);
    }
    const token = authHeader.slice(7);

    // Verify JWT with anon client
    const anonClient = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_ANON_KEY"),
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) return jsonError("Invalid token", 401);

    // ── 2. Role check (admin or manager only) ─────────────────────────────────
    const adminClient = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: profile } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile?.role || !["admin", "director"].includes(profile.role)) {
      return jsonError("Forbidden — requires admin or director role", 403);
    }

    // ── 3. Parse and validate query params ────────────────────────────────────
    const url = new URL(req.url);
    const module = (url.searchParams.get("module") ?? "users") as Module;
    const format = url.searchParams.get("format") ?? "csv";

    if (!(ALLOWED_MODULES as readonly string[]).includes(module)) {
      return jsonError(
        `Invalid module. Allowed: ${ALLOWED_MODULES.join(", ")}`,
        400,
      );
    }
    if (format !== "csv") {
      return jsonError("Only CSV format is currently supported", 400);
    }

    // ── 4. Fetch data with service_role (bypass RLS intentionally for admin export) ──
    const { data: rows, error: dbErr } = await adminClient
      .from(MODULE_TABLE[module])
      .select(MODULE_COLUMNS[module])
      .order("created_at", { ascending: false })
      .limit(50000); // safety cap

    if (dbErr) {
      // Table may not exist yet (e.g., clients/leads not created)
      if (dbErr.code === "42P01") {
        return jsonError(
          `Table "${MODULE_TABLE[module]}" does not exist yet`,
          404,
        );
      }
      console.error("[data-export] DB error:", dbErr);
      return jsonError("Failed to fetch data", 500);
    }

    const csv = toCSV((rows ?? []) as unknown as Record<string, unknown>[]);
    const filename = `bullenhaus-${module}-${
      new Date().toISOString().slice(0, 10)
    }.csv`;

    return new Response(csv, {
      headers: {
        ...CORS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error
      ? err.message
      : "Unexpected export error";
    return jsonError(message, 500);
  }
});
