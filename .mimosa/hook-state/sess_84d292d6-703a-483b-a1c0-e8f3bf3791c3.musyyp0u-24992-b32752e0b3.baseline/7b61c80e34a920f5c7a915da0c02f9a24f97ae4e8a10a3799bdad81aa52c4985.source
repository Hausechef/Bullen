import { getAdminClient } from "../_lib/supabase";

const PROVIDER = "openrouter";
const BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.AI_KYC_MODEL || process.env.AI_FALLBACK_MODEL || "openai/gpt-4o-mini";
const TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || "30000");
const MAX_DOCS = 6;
const MAX_DATA_URI_LENGTH = 14_000_000;

type KycDocPayload = {
  docType?: string;
  fileName?: string;
  fileData?: string;
};

type BotResult = {
  decision: "approve" | "reject" | "escalate";
  confidence: number;
  risk_tier: "low" | "medium" | "high";
  summary: string;
  reasoning: string[];
  flags: string[];
  required_followup: string[];
  document_analyses: Array<{
    docType: string;
    status: "pass" | "fail" | "unclear";
    observations: string[];
  }>;
};

async function requireKycReviewer(req: any, res: any): Promise<string | null> {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return null;
  }

  const supabase = getAdminClient();
  const token = auth.slice(7);
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
  if (!["admin", "trade_admin", "crm_admin", "manager", "director"].includes(role)) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }

  return user.id;
}

function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(TIMEOUT_MS) ? TIMEOUT_MS : 30000);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function normalizeResult(raw: unknown, fallbackDocs: KycDocPayload[]): BotResult {
  const value = raw && typeof raw === "object" ? raw as Partial<BotResult> : {};
  const decision = value.decision === "approve" || value.decision === "reject" || value.decision === "escalate"
    ? value.decision
    : "escalate";
  const riskTier = value.risk_tier === "low" || value.risk_tier === "medium" || value.risk_tier === "high"
    ? value.risk_tier
    : "medium";
  const confidence = Math.max(0, Math.min(100, Number(value.confidence) || 0));

  return {
    decision,
    confidence,
    risk_tier: riskTier,
    summary: typeof value.summary === "string" ? value.summary.slice(0, 1000) : "KYC analysis completed. Human review is required.",
    reasoning: Array.isArray(value.reasoning) ? value.reasoning.map(String).slice(0, 8) : [],
    flags: Array.isArray(value.flags) ? value.flags.map(String).slice(0, 12) : [],
    required_followup: Array.isArray(value.required_followup) ? value.required_followup.map(String).slice(0, 8) : [],
    document_analyses: Array.isArray(value.document_analyses)
      ? value.document_analyses.slice(0, MAX_DOCS).map((doc: any) => ({
          docType: String(doc?.docType || "unknown").slice(0, 80),
          status: doc?.status === "pass" || doc?.status === "fail" || doc?.status === "unclear" ? doc.status : "unclear",
          observations: Array.isArray(doc?.observations) ? doc.observations.map(String).slice(0, 8) : [],
        }))
      : fallbackDocs.map((doc) => ({
          docType: String(doc.docType || "unknown").slice(0, 80),
          status: "unclear" as const,
          observations: ["No structured per-document analysis returned."],
        })),
  };
}

export function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const reviewerId = await requireKycReviewer(req, res);
  if (!reviewerId) return;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || (process.env.AI_PROVIDER || PROVIDER).toLowerCase() !== PROVIDER) {
    res.status(503).json({ error: "AI service not configured on this server." });
    return;
  }

  const body = req.body ?? {};
  const documents = Array.isArray(body.documents) ? body.documents as KycDocPayload[] : [];
  if (documents.length === 0 || documents.length > MAX_DOCS) {
    res.status(400).json({ error: `documents array must contain 1-${MAX_DOCS} items.` });
    return;
  }

  for (const doc of documents) {
    if (!doc?.fileData || typeof doc.fileData !== "string" || !doc.fileData.startsWith("data:")) {
      res.status(400).json({ error: "Each document requires a data URI fileData value." });
      return;
    }
    if (doc.fileData.length > MAX_DATA_URI_LENGTH) {
      res.status(413).json({ error: "Document payload is too large." });
      return;
    }
  }

  const content: any[] = [
    {
      type: "text",
      text: [
        "You are a KYC document triage assistant for a trading platform.",
        "Return JSON only. Do not approve users automatically; provide an advisory decision for human reviewers.",
        "Check document authenticity signals, selfie/document match if visible, expiry, legibility, name mismatches, and missing required documents.",
        "Use this exact schema: {\"decision\":\"approve|reject|escalate\",\"confidence\":0,\"risk_tier\":\"low|medium|high\",\"summary\":\"\",\"reasoning\":[],\"flags\":[],\"required_followup\":[],\"document_analyses\":[{\"docType\":\"\",\"status\":\"pass|fail|unclear\",\"observations\":[]}]}",
        `Client name: ${String(body.clientName || "Unknown").slice(0, 160)}`,
        `Client email present: ${Boolean(body.clientEmail)}`,
        `Client country: ${String(body.clientCountry || "Unknown").slice(0, 80)}`,
      ].join("\n"),
    },
    ...documents.flatMap((doc) => [
      { type: "text", text: `Document type: ${String(doc.docType || "unknown").slice(0, 80)}; file: ${String(doc.fileName || "unknown").slice(0, 120)}` },
      { type: "image_url", image_url: { url: doc.fileData } },
    ]),
  ];

  try {
    const upstream = await fetchWithTimeout(`${BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://bullenhaus.app",
        "X-Title": "Bullenhaus KYC Bot",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content }],
        temperature: 0,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        provider: {
          allow_fallbacks: process.env.AI_OPENROUTER_ALLOW_FALLBACKS !== "false",
          sort: process.env.AI_OPENROUTER_SORT || "price",
          data_collection: process.env.AI_OPENROUTER_DATA_COLLECTION || "deny",
          ...(process.env.AI_OPENROUTER_ZDR === "true" ? { zdr: true } : {}),
        },
      }),
    });

    if (!upstream.ok) {
      console.error("[api/kyc/analyze-external] provider failure", { status: upstream.status, reviewerId });
      res.status(502).json({ error: "KYC bot provider is temporarily unavailable." });
      return;
    }

    const data = await upstream.json() as any;
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      res.status(502).json({ error: "KYC bot returned an empty response." });
      return;
    }

    res.json(normalizeResult(parseJsonObject(text), documents));
  } catch (err: unknown) {
    console.error("[api/kyc/analyze-external] request failure", { error: err instanceof Error ? err.name : "unknown", reviewerId });
    res.status(502).json({ error: "KYC bot request failed." });
  }
}
