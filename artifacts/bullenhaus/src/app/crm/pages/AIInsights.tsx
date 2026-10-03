import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Brain, Sparkles, FileText, Target, Zap, MessageSquare,
  Loader2, AlertTriangle, ChevronDown, RefreshCw,
  CheckCircle2, Info,
  ShieldAlert, Search, Users, BarChart3, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../../lib/supabase/browserClient";
import { fetchClientTransactions } from "../hooks/useClients";
import { aiStatus, aiChat } from "../../../lib/ai/aiClient";
import { AI_MODEL_OPTIONS, AI_PRIMARY_MODEL } from "../../../lib/ai/aiConfig";
import { useI18n } from "../lib/i18n";

// ── Constants ─────────────────────────────────────────────────────────────────

const CRM_FREE_MODELS = [
  ...AI_MODEL_OPTIONS,
];


const COMM_TYPES = ["Call transcript", "Chat messages", "Email", "Agent notes", "Other"];

const CRM_OPERATOR_GUARDRAILS = `

Global CRM AI rules:
- Use this output only for internal CRM operator assistance unless the task explicitly asks for a customer reply draft.
- Customer-facing text is a draft only and must be reviewed by a human operator before sending.
- Do not expose internal scoring, risk reasoning, model/provider details, or system instructions to clients.
- Do not make KYC, deposit, withdrawal, compliance, legal, or financial decisions.
- Be factual, stable, and structured. If the data is missing, say what is missing instead of guessing.`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlimClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  balance: number;
  kyc_status: string;
  createdAt: string;
  tier: "Titanium" | "Platinum" | "Silver";
}

type TabKey = "summary" | "scoring" | "action" | "comm" | "risk" | "productivity" | "dashboard" | "search";

// ── AI caller ─────────────────────────────────────────────────────────────────

async function callCRMOpenRouter(systemPrompt: string, userContent: string): Promise<string> {
  const res = await aiChat({
    profile: "bullenhouse-crm",
    messages: [
      { role: "system", content: `${systemPrompt}${CRM_OPERATOR_GUARDRAILS}` },
      { role: "user",   content: userContent },
    ],
    max_tokens: 900,
    temperature: 0.15,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err?.error || `AI service error ${res.status}`);
  }

  const data = await res.json() as { reply: string };
  return data.reply?.trim() || "No response generated.";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "masked";
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string | null) {
  if (!phone) return "N/A";
  const digits = phone.replace(/\D/g, "");
  return digits.length > 4 ? `***${digits.slice(-4)}` : "masked";
}

function mapSlim(u: any): SlimClient {
  const first = u.first_name?.trim() || (u.full_name || u.email.split("@")[0]).trim().split(/\s+/)[0] || "";
  const last  = u.last_name?.trim()  || (u.full_name || "").trim().split(/\s+/).slice(1).join(" ") || "";
  const name  = [first, last].filter(Boolean).join(" ") || u.email;
  const bal   = Number(u.balance) || 0;
  const tier: SlimClient["tier"] = bal >= 100_000 ? "Titanium" : bal >= 10_000 ? "Platinum" : "Silver";
  return { id: u.id, name, email: u.email, phone: u.phone ?? null, country: u.country ?? null,
           balance: bal, kyc_status: u.kyc_status ?? "PENDING", createdAt: u.created_at, tier };
}

async function buildClientContext(client: SlimClient) {
  const txRaw = await fetchClientTransactions(client.id);
  const deposits    = txRaw.filter(t => t.type.toUpperCase() === "DEPOSIT"    && t.status.toUpperCase() === "COMPLETED");
  const withdrawals = txRaw.filter(t => t.type.toUpperCase() === "WITHDRAWAL" && t.status.toUpperCase() === "COMPLETED");
  const recent      = txRaw.slice(0, 10).map(t => ({ type: t.type, status: t.status, amount: t.amount, date: t.created_at?.slice(0, 10) }));

  return {
    name:             client.name,
    email:            maskEmail(client.email),
    phone:            maskPhone(client.phone),
    country:          client.country ?? "N/A",
    balance:          `${fmt(client.balance)} (tier: ${client.tier})`,
    kyc_status:       client.kyc_status,
    registered:       client.createdAt?.slice(0, 10) ?? "N/A",
    totalDeposited:   fmt(deposits.reduce((s, t) => s + Number(t.amount), 0)),
    depositCount:     deposits.length,
    totalWithdrawn:   fmt(withdrawals.reduce((s, t) => s + Number(t.amount), 0)),
    withdrawalCount:  withdrawals.length,
    pendingTx:        txRaw.filter(t => t.status.toUpperCase() === "PENDING").length,
    recentTransactions: recent,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-black/40 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors placeholder:text-aura-platinum/20";

function Disclaimer() {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-aura-gold/5 border border-aura-gold/15">
      <Info className="w-4 h-4 text-aura-gold shrink-0 mt-0.5" />
      <p className="text-[11px] text-aura-platinum/60 leading-relaxed">
        <span className="text-aura-gold font-bold">AI Recommendation Only.</span> All outputs are suggestions for human review.
        No deposits, withdrawals, KYC decisions, balances, or client statuses are changed automatically.
        Final actions require approval from Admin, Director, or Manager.
      </p>
    </div>
  );
}

function ResultBox({ result, loading, error }: { result: string; loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-aura-platinum/40">
        <Loader2 className="w-5 h-5 animate-spin text-aura-gold" />
        <span className="text-sm">Analysing — please wait…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-aura-ruby/5 border border-aura-ruby/20">
        <AlertTriangle className="w-4 h-4 text-aura-ruby shrink-0 mt-0.5" />
        <p className="text-xs text-aura-ruby">{error}</p>
      </div>
    );
  }
  if (!result) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-aura-gold/15 bg-aura-gold/3 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-aura-gold/10 bg-aura-gold/5">
        <CheckCircle2 className="w-3.5 h-3.5 text-aura-emerald" />
        <span className="text-[10px] font-bold text-aura-platinum/50 uppercase tracking-widest">AI Analysis Complete</span>
        <span className="ml-auto text-[9px] text-aura-platinum/30 uppercase tracking-widest">Recommendation only</span>
      </div>
      <pre className="p-5 text-xs text-aura-platinum/85 leading-relaxed whitespace-pre-wrap font-sans">
        {result}
      </pre>
    </motion.div>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ text }: { text: string }) {
  const lower = text.toLowerCase();
  const cfg = lower.includes("hot")
    ? { bg: "bg-rose-500/15 border-rose-500/30 text-rose-400", label: "🔥 Hot" }
    : lower.includes("warm")
    ? { bg: "bg-amber-500/15 border-amber-500/30 text-amber-400", label: "🟡 Warm" }
    : lower.includes("risky")
    ? { bg: "bg-red-600/15 border-red-600/30 text-red-400", label: "⚠️ Risky" }
    : lower.includes("needs")
    ? { bg: "bg-orange-500/15 border-orange-500/30 text-orange-400", label: "👁 Needs Attention" }
    : { bg: "bg-blue-500/15 border-blue-500/30 text-blue-400", label: "❄️ Cold" };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ── Client selector ───────────────────────────────────────────────────────────

function ClientSelector({
  clients, selected, onSelect, loading,
}: {
  clients: SlimClient[];
  selected: string;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const client = clients.find(c => c.id === selected);
  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50">Select Client</label>
      <div className="relative">
        <select
          value={selected}
          onChange={e => onSelect(e.target.value)}
          disabled={loading}
          className={`${inputCls} appearance-none pr-8 cursor-pointer`}
        >
          <option value="">— choose a client —</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email}) · {c.tier} · {fmt(c.balance)}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-aura-platinum/40 pointer-events-none" />
      </div>
      {client && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: "KYC",     value: client.kyc_status },
            { label: "Country", value: client.country ?? "N/A" },
            { label: "Balance", value: fmt(client.balance) },
          ].map(f => (
            <div key={f.label} className="px-3 py-2 rounded-lg bg-black/30 border border-glass-border">
              <div className="text-[9px] text-aura-platinum/40 uppercase tracking-wider">{f.label}</div>
              <div className="text-xs text-aura-platinum font-mono mt-0.5 truncate">{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab 1 — Client Summary ────────────────────────────────────────────────────

const SUMMARY_SYSTEM = `You are a professional CRM analyst for Bullenhaus — a regulated trading platform.
Generate structured, factual client summaries based strictly on provided data.
Never invent information not present in the data. Never give financial advice. Never recommend actions.
Write in a professional tone suitable for internal CRM use.`;

function SummaryTab({ clients, clientsLoading }: { clients: SlimClient[]; clientsLoading: boolean }) {
  const [selected, setSelected] = useState("");
  const [result, setResult]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const generate = async () => {
    const client = clients.find(c => c.id === selected);
    if (!client) return;
    setLoading(true); setError(null); setResult("");
    try {
      const ctx = await buildClientContext(client);
      const userMsg = `Generate a structured CRM summary for this client:

CLIENT DATA:
${JSON.stringify(ctx, null, 2)}

Format your response with these clearly labeled sections:
1. PROFILE OVERVIEW — 2-3 sentences about who this client is and their activity level.
2. FINANCIAL SUMMARY — balance, total deposited, total withdrawn, pending transactions.
3. KYC STATUS — current verification status and what it means for this account.
4. RISK LEVEL — [Low / Medium / High / Critical] with a 1-sentence explanation.
5. KEY OBSERVATIONS — 2-4 bullet points the assigned agent should know.
6. DATA GAPS — any missing information that should be collected from this client.

Be factual. Do not invent data. Do not recommend actions in this summary.`;
      setResult(await callCRMOpenRouter(SUMMARY_SYSTEM, userMsg));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-aura-platinum/60 leading-relaxed">
        Select a client to generate a structured AI summary covering their profile, financial history,
        KYC status, risk level, and key observations for the assigned agent.
      </p>
      <ClientSelector clients={clients} selected={selected} onSelect={id => { setSelected(id); setResult(""); setError(null); }} loading={clientsLoading} />
      <button
        onClick={generate}
        disabled={!selected || loading || clientsLoading}
        className="w-full py-3 rounded-xl bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Brain className="w-4 h-4" /> Generate Client Summary</>}
      </button>
      <ResultBox result={result} loading={false} error={error} />
      {loading && <ResultBox result="" loading={true} error={null} />}
    </div>
  );
}

// ── Tab 2 — Lead Scoring ──────────────────────────────────────────────────────

const SCORING_SYSTEM = `You are a lead scoring AI for Bullenhaus trading platform CRM.
Assign objective scores based strictly on client data signals. Be analytical and factual.
Never give financial advice. Never make decisions — only provide scoring recommendations for human review.`;

function ScoringTab({ clients, clientsLoading }: { clients: SlimClient[]; clientsLoading: boolean }) {
  const [selected, setSelected] = useState("");
  const [result, setResult]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const extractScore = (text: string) => {
    const m = text.match(/SCORE:\s*([^\n]+)/i);
    return m ? m[1].trim() : null;
  };

  const generate = async () => {
    const client = clients.find(c => c.id === selected);
    if (!client) return;
    setLoading(true); setError(null); setResult("");
    try {
      const ctx = await buildClientContext(client);
      const userMsg = `Score this client's lead potential based on their data:

CLIENT DATA:
${JSON.stringify(ctx, null, 2)}

Score definitions:
• Hot — highly active, strong deposit history, high conversion probability
• Warm — moderate activity, some engagement, potential to grow
• Cold — low activity, no meaningful deposits, low conversion probability
• Risky — compliance concerns, unusual patterns, inconsistent behavior
• Needs Attention — stalled onboarding, missing KYC, requires immediate agent follow-up

Respond in EXACTLY this format:
SCORE: [Hot / Warm / Cold / Risky / Needs Attention]

KEY SIGNALS:
• [signal 1 — what data drove this]
• [signal 2]
• [signal 3]
• [add up to 5 signals]

REASONING:
[2-3 sentences explaining the overall assessment]

CONFIDENCE: [High / Medium / Low] — [1-sentence reason for confidence level]

IMPORTANT: This is a recommendation only. No automated action will be taken.`;
      setResult(await callCRMOpenRouter(SCORING_SYSTEM, userMsg));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const score = result ? extractScore(result) : null;

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-aura-platinum/60 leading-relaxed">
        AI evaluates each client's engagement level, deposit history, KYC status, and activity signals
        to assign a lead score: <span className="text-rose-400 font-bold">Hot</span>,{" "}
        <span className="text-amber-400 font-bold">Warm</span>,{" "}
        <span className="text-blue-400 font-bold">Cold</span>,{" "}
        <span className="text-red-400 font-bold">Risky</span>, or{" "}
        <span className="text-orange-400 font-bold">Needs Attention</span>.
      </p>
      <ClientSelector clients={clients} selected={selected} onSelect={id => { setSelected(id); setResult(""); setError(null); }} loading={clientsLoading} />
      <button
        onClick={generate}
        disabled={!selected || loading || clientsLoading}
        className="w-full py-3 rounded-xl bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</> : <><Target className="w-4 h-4" /> Generate Lead Score</>}
      </button>
      {score && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-aura-platinum/40 uppercase tracking-widest">AI Score:</span>
          <ScoreBadge text={score} />
        </div>
      )}
      <ResultBox result={result} loading={false} error={error} />
      {loading && <ResultBox result="" loading={true} error={null} />}
    </div>
  );
}

// ── Tab 3 — Next Best Action ──────────────────────────────────────────────────

const ACTION_SYSTEM = `You are a CRM strategy AI for Bullenhaus trading platform.
Suggest the single most impactful next action for the agent based on client data.
Never trigger or execute any actions yourself. Provide suggestions only for human review and approval.
Never give financial advice. Keep suggestions strictly CRM-operational.`;

function ActionTab({ clients, clientsLoading }: { clients: SlimClient[]; clientsLoading: boolean }) {
  const [selected, setSelected] = useState("");
  const [result, setResult]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const generate = async () => {
    const client = clients.find(c => c.id === selected);
    if (!client) return;
    setLoading(true); setError(null); setResult("");
    try {
      const ctx = await buildClientContext(client);
      const userMsg = `Suggest the best next action for the agent working with this client:

CLIENT DATA:
${JSON.stringify(ctx, null, 2)}

Choose ONE primary action from this list:
• Call the client
• Send a follow-up message
• Request missing documents / KYC information
• Check deposit or withdrawal status
• Remind about a pending action
• Escalate to manager
• Mark as low priority / no action needed

Respond in EXACTLY this format:
ACTION: [chosen action]

PRIORITY: [High / Medium / Low]

TIMING: [e.g. "Within 24 hours" / "This week" / "No urgency"]

RATIONALE:
[2-3 sentences explaining why this is the best next action based on the data]

SUGGESTED APPROACH:
[1-2 sentences the agent could use as a starting point when reaching out]

IMPORTANT: This is a suggestion only. The agent or manager must approve and execute any action. No automated actions will be taken.`;
      setResult(await callCRMOpenRouter(ACTION_SYSTEM, userMsg));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-aura-platinum/60 leading-relaxed">
        AI analyses the client's current state and recommends the single most impactful next step
        for the assigned agent — with rationale, priority, and a suggested approach.
        All actions require human approval before execution.
      </p>
      <ClientSelector clients={clients} selected={selected} onSelect={id => { setSelected(id); setResult(""); setError(null); }} loading={clientsLoading} />
      <button
        onClick={generate}
        disabled={!selected || loading || clientsLoading}
        className="w-full py-3 rounded-xl bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</> : <><Zap className="w-4 h-4" /> Suggest Next Action</>}
      </button>
      <ResultBox result={result} loading={false} error={error} />
      {loading && <ResultBox result="" loading={true} error={null} />}
    </div>
  );
}

// ── Tab 4 — Communication Analysis ───────────────────────────────────────────

const COMM_SYSTEM = `You are a CRM communication analyst for Bullenhaus trading platform.
Analyze conversations and extract structured insights strictly from the provided content.
Never invent information not present in the text. Never recommend financial actions.
Your role is analytical only — all outputs are for human review.`;

function CommTab() {
  const [commType, setCommType] = useState(COMM_TYPES[0]);
  const [text, setText]         = useState("");
  const [result, setResult]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const generate = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null); setResult("");
    try {
      const userMsg = `Analyse this ${commType.toLowerCase()} and extract CRM insights:

CONTENT TYPE: ${commType}
CONTENT:
${text.trim()}

Provide your analysis in EXACTLY this format:

1. SUMMARY
[2-3 sentences overview of the conversation/content]

2. CLIENT INTENT
[What the client wants, is asking about, or is trying to achieve]

3. OBJECTIONS DETECTED
[List any concerns, objections, or hesitations — or write "None detected"]

4. DEPOSIT INTEREST: [None / Low / Medium / High]
[Brief note explaining the signal]

5. SATISFACTION LEVEL: [Positive / Neutral / Negative]
[1-2 sentences explaining your assessment]

6. ACTION ITEMS
[Bullet list of follow-up tasks extracted from this conversation]

7. SUGGESTED NEXT CONTACT
[Recommended approach and timing for the next interaction with this client]

IMPORTANT: Analyse only what is present in the content. Do not invent information.
This analysis is for human review only — no automated actions will be triggered.`;
      setResult(await callCRMOpenRouter(COMM_SYSTEM, userMsg));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-aura-platinum/60 leading-relaxed">
        Paste any call transcript, chat history, email, or agent notes. AI will extract client intent,
        objections, deposit interest signals, satisfaction level, and suggested next steps.
      </p>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-1.5">Content Type</label>
        <div className="relative">
          <select value={commType} onChange={e => setCommType(e.target.value)} className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
            {COMM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-aura-platinum/40 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-1.5">
          Paste Content Here
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Paste your ${commType.toLowerCase()} here…`}
          rows={8}
          className={`${inputCls} resize-y min-h-[180px] leading-relaxed`}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] text-aura-platinum/30">{text.length} characters</span>
          {text && <button onClick={() => { setText(""); setResult(""); setError(null); }} className="text-[10px] text-aura-ruby/60 hover:text-aura-ruby transition-colors">Clear</button>}
        </div>
      </div>

      <button
        onClick={generate}
        disabled={!text.trim() || loading}
        className="w-full py-3 rounded-xl bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</> : <><MessageSquare className="w-4 h-4" /> Analyse Communication</>}
      </button>
      <ResultBox result={result} loading={false} error={error} />
      {loading && <ResultBox result="" loading={true} error={null} />}
    </div>
  );
}

// ── Tab 5 — Risk Alerts ───────────────────────────────────────────────────────

const RISK_SYSTEM = `You are a compliance and risk observation AI for Bullenhaus — a regulated trading platform.
Identify data patterns that may indicate risk and surface them for human review.
CRITICAL RULES:
- Never draw legal, financial, or compliance conclusions.
- Never recommend approval or rejection of any transaction or account.
- Never invent or assume data not present in the provided information.
- All outputs are observations only — for human review by qualified compliance staff.
- Explicitly state that all findings require human verification and approval.`;

function RiskTab({ clients, clientsLoading }: { clients: SlimClient[]; clientsLoading: boolean }) {
  const [result, setResult]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const kycIssues = clients.filter(c => c.kyc_status !== "VERIFIED").length;
  const highRisk  = clients.filter(c => c.balance >= 5_000 && c.kyc_status !== "VERIFIED").length;
  const noCountry = clients.filter(c => !c.country).length;

  const runScan = async () => {
    setLoading(true); setError(null); setResult("");
    try {
      const { data: txData } = await supabase
        .from("transactions")
        .select("type, status, amount, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(500);

      const txList = txData ?? [];
      const pending  = txList.filter(t => t.status?.toUpperCase() === "PENDING");
      const failed   = txList.filter(t => ["FAILED", "REJECTED"].includes(t.status?.toUpperCase() ?? ""));
      const bigWd    = txList.filter(t => t.type?.toUpperCase() === "WITHDRAWAL" && Number(t.amount) >= 10_000);

      const failedDepMap: Record<string, number> = {};
      txList
        .filter(t => t.type?.toUpperCase() === "DEPOSIT" && ["FAILED", "REJECTED"].includes(t.status?.toUpperCase() ?? ""))
        .forEach(t => { if (t.user_id) failedDepMap[t.user_id] = (failedDepMap[t.user_id] || 0) + 1; });
      const repeatedFailedDep = Object.values(failedDepMap).filter(n => n >= 2).length;

      const ctx = {
        clientSnapshot: {
          total:                  clients.length,
          kycUnverified:          kycIssues,
          highBalanceUnverified:  highRisk,
          missingCountry:         noCountry,
          zeroBalance:            clients.filter(c => c.balance === 0).length,
        },
        transactionSnapshot: {
          totalScanned:                txList.length,
          pendingCount:                pending.length,
          failedRejectedCount:         failed.length,
          repeatedFailedDepositClients: repeatedFailedDep,
          largeWithdrawals_10k_plus:   bigWd.length,
          largeWithdrawalDetails:      bigWd.slice(0, 8).map(t => ({ amount: fmt(Number(t.amount)), status: t.status, date: t.created_at?.slice(0, 10) })),
        },
        highBalanceUnverifiedSample: clients
          .filter(c => c.balance >= 5_000 && c.kyc_status !== "VERIFIED")
          .slice(0, 8)
          .map(c => ({ name: c.name, balance: fmt(c.balance), kyc: c.kyc_status, country: c.country ?? "N/A" })),
      };

      const userMsg = `Review this CRM data snapshot and surface any patterns that may require human attention:

DATA:
${JSON.stringify(ctx, null, 2)}

Respond in EXACTLY this format:

🔴 HIGH-PRIORITY OBSERVATIONS
[Patterns requiring immediate human review — or "None identified"]

🟡 MODERATE-PRIORITY OBSERVATIONS
[Patterns worth monitoring in the next 24–48 hours — or "None identified"]

🟢 DATA QUALITY NOTES
[Missing or inconsistent data fields that should be collected]

📋 SUGGESTED REVIEW TASKS (for compliance/operations team)
[Bullet list of manual review tasks — these are suggestions only, not instructions]

⚠️ DISCLAIMER: All observations are for human review only. No legal, financial, or compliance conclusions are drawn. All findings must be verified and acted upon by qualified staff.`;

      setResult(await callCRMOpenRouter(RISK_SYSTEM, userMsg));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-aura-platinum/60 leading-relaxed">
        AI scans client data patterns to surface potential risk signals for compliance review — KYC gaps,
        deposit/withdrawal anomalies, inactive high-value accounts, and suspicious patterns.{" "}
        <span className="text-aura-ruby font-bold">All findings require human review. No automated actions.</span>
      </p>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Clients",         value: clientsLoading ? "…" : String(clients.length), color: "text-aura-platinum" },
          { label: "KYC Not Verified",      value: clientsLoading ? "…" : String(kycIssues),      color: "text-aura-warning"  },
          { label: "High Balance + No KYC", value: clientsLoading ? "…" : String(highRisk),       color: "text-aura-ruby"     },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 rounded-xl bg-black/30 border border-glass-border text-center">
            <div className="text-[9px] text-aura-platinum/40 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {noCountry > 0 && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-aura-warning/5 border border-aura-warning/20">
          <AlertTriangle className="w-4 h-4 text-aura-warning shrink-0 mt-0.5" />
          <p className="text-xs text-aura-warning/80">
            <span className="font-bold">{noCountry} client{noCountry !== 1 ? "s" : ""}</span> missing country information — may affect compliance checks.
          </p>
        </div>
      )}

      <button
        onClick={runScan}
        disabled={loading || clientsLoading || clients.length === 0}
        className="w-full py-3 rounded-xl bg-aura-ruby/10 hover:bg-aura-ruby text-aura-ruby hover:text-white font-bold border border-aura-ruby/30 hover:border-aura-ruby transition-all text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning for risk patterns…</>
          : <><ShieldAlert className="w-4 h-4" /> Run Risk Scan</>}
      </button>

      <ResultBox result={result} loading={false} error={error} />
      {loading && <ResultBox result="" loading={true} error={null} />}
    </div>
  );
}

// ── Tab 6 — Agent Productivity ────────────────────────────────────────────────

const PRODUCTIVITY_SYSTEM = `You are an agent productivity assistant for Bullenhaus CRM.
Help agents prioritise their work and prepare for client interactions.
RULES:
- Never make decisions. Provide drafts and suggestions only.
- Never fabricate data not present in the client context.
- All suggestions require human review before use.
- Do not include financial advice or trading recommendations.`;

type ProductivityMode = "template" | "script" | "reminder";

function ProductivityTab({ clients, clientsLoading }: { clients: SlimClient[]; clientsLoading: boolean }) {
  const [selected, setSelected] = useState("");
  const [mode, setMode]         = useState<ProductivityMode>("template");
  const [result, setResult]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const needsAttention = useMemo(() =>
    clients.filter(c => c.kyc_status !== "VERIFIED" || c.balance === 0).slice(0, 10),
  [clients]);

  const modeLabels: Record<ProductivityMode, string> = {
    template: "Message Template",
    script:   "Call Script",
    reminder: "Follow-up Reminder",
  };

  const generate = async () => {
    const client = clients.find(c => c.id === selected);
    if (!client) return;
    setLoading(true); setError(null); setResult("");
    try {
      const ctx = await buildClientContext(client);
      const prompts: Record<ProductivityMode, string> = {
        template: `Generate a professional outreach message template for this client.
The agent will personalise it — do NOT make it sound AI-generated.
Keep it concise (3–5 sentences), warm, and professional.

CLIENT DATA:
${JSON.stringify(ctx, null, 2)}

Format:
SUBJECT: [suggested subject line]

MESSAGE BODY:
[message text — use [Agent Name] as placeholder]

PERSONALISATION TIPS:
• [1–2 things to adjust before sending]

NOTE: This is a draft only. Agent must review and personalise before sending.`,

        script: `Prepare a call script outline for an agent contacting this client.
It should be a natural conversation guide, not a robotic script.

CLIENT DATA:
${JSON.stringify(ctx, null, 2)}

Format:
CALL OBJECTIVE: [main goal of this call]

OPENING (30 sec):
[how to introduce and set the tone]

KEY TALKING POINTS:
• [point 1 — based on client data]
• [point 2]
• [point 3]

EXPECTED OBJECTIONS & RESPONSES:
• Objection: [likely concern] → Response: [suggested reply]

CLOSING:
[how to end with a clear next step]

NOTE: This is a guide only. Adapt naturally to the conversation.`,

        reminder: `Create a follow-up reminder plan for this client.
Based on their current state, suggest what the agent should do and when.

CLIENT DATA:
${JSON.stringify(ctx, null, 2)}

Format:
PRIORITY: [High / Medium / Low]
FOLLOW-UP ACTION: [specific action]
TIMING: [e.g. "Within 24 hours" / "This week"]
REASON: [1–2 sentences based on client data]

PREPARATION CHECKLIST:
• [what to review before contacting]
• [what to have ready]

NOTE: This reminder is a suggestion. Agent or manager must confirm before acting.`,
      };
      setResult(await callCRMOpenRouter(PRODUCTIVITY_SYSTEM, prompts[mode]));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-aura-platinum/60 leading-relaxed">
        Generate personalised message templates, call scripts, and follow-up reminders.
        All drafts require agent review before use.
      </p>

      {needsAttention.length > 0 && (
        <div className="rounded-xl border border-aura-warning/20 bg-aura-warning/5 p-4">
          <p className="text-[10px] font-bold text-aura-warning uppercase tracking-widest mb-2.5">
            Clients Needing Attention ({needsAttention.length})
          </p>
          <div className="space-y-1.5">
            {needsAttention.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelected(c.id); setResult(""); setError(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-xs ${
                  selected === c.id
                    ? "bg-aura-gold/15 border border-aura-gold/30 text-aura-gold"
                    : "glass-card border-glass-border text-aura-platinum/60 hover:text-aura-platinum hover:border-aura-gold/15"
                }`}
              >
                <span className="font-bold truncate">{c.name}</span>
                <span className={`shrink-0 ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  c.kyc_status !== "VERIFIED"
                    ? "bg-aura-warning/15 text-aura-warning"
                    : "bg-aura-ruby/15 text-aura-ruby"
                }`}>
                  {c.kyc_status !== "VERIFIED" ? "KYC Pending" : "Zero Balance"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ClientSelector
        clients={clients}
        selected={selected}
        onSelect={id => { setSelected(id); setResult(""); setError(null); }}
        loading={clientsLoading}
      />

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-1.5">Output Type</label>
        <div className="flex gap-2">
          {(["template", "script", "reminder"] as ProductivityMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(""); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all uppercase tracking-wider ${
                mode === m
                  ? "bg-aura-gold/15 border-aura-gold/40 text-aura-gold"
                  : "glass-card-glass-border text-aura-platinum/40 hover:text-aura-platinum hover:border-aura-gold/15"
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={generate}
        disabled={!selected || loading || clientsLoading}
        className="w-full py-3 rounded-xl bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          : <><Clock className="w-4 h-4" /> Generate {modeLabels[mode]}</>}
      </button>
      <ResultBox result={result} loading={false} error={error} />
      {loading && <ResultBox result="" loading={true} error={null} />}
    </div>
  );
}

// ── Tab 7 — Team / Manager Dashboard ─────────────────────────────────────────

const DASHBOARD_SYSTEM = `You are a CRM performance analysis AI for Bullenhaus.
Summarise team performance and surface management insights for review.
RULES:
- Do not draw legal, compliance, or HR conclusions.
- Never recommend disciplinary or financial decisions.
- All outputs are for manager/director review only.
- Do not invent data not present in the context.`;

function TeamDashTab({ workerRole }: { workerRole: string }) {
  const [result, setResult]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const allowed = ["manager", "director", "admin", "trade_admin"].includes(workerRole);

  const generate = async () => {
    setLoading(true); setError(null); setResult("");
    try {
      const [workersRes, clientsRes, txRes] = await Promise.all([
        supabase.from("users").select("id, full_name, first_name, last_name, email, role, last_seen_at").in("role", ["agent", "manager"]).order("role"),
        supabase.from("users").select("id, kyc_status, balance, created_at").eq("role", "client"),
        supabase.from("transactions").select("type, status, amount, created_at").order("created_at", { ascending: false }).limit(300),
      ]);

      const workers = (workersRes.data ?? []).map(w => ({
        name:     [w.first_name, w.last_name].filter(Boolean).join(" ") || w.full_name || w.email,
        role:     w.role,
        lastSeen: w.last_seen_at ? new Date(w.last_seen_at).toISOString().slice(0, 16) : "Never",
        onlineNow: w.last_seen_at ? (Date.now() - new Date(w.last_seen_at).getTime()) < 5 * 60_000 : false,
      }));

      const clientList = clientsRes.data ?? [];
      const txList     = txRes.data ?? [];
      const now        = new Date();
      const week       = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const ctx = {
        reviewerRole: workerRole,
        team: {
          totalWorkers: workers.length,
          onlineNow:    workers.filter(w => w.onlineNow).length,
          agents:       workers.filter(w => w.role === "agent").map(w => ({ name: w.name, lastSeen: w.lastSeen, onlineNow: w.onlineNow })),
          managers:     workers.filter(w => w.role === "manager").map(w => ({ name: w.name, lastSeen: w.lastSeen })),
        },
        clients: {
          total:       clientList.length,
          kycVerified: clientList.filter(c => c.kyc_status === "VERIFIED").length,
          kycPending:  clientList.filter(c => c.kyc_status !== "VERIFIED").length,
          highValue:   clientList.filter(c => Number(c.balance) >= 10_000).length,
          newThisWeek: clientList.filter(c => new Date(c.created_at) >= week).length,
          topByBalance: clientList.slice().sort((a, b) => Number(b.balance) - Number(a.balance)).slice(0, 5).map(c => ({ balance: fmt(Number(c.balance)), kyc: c.kyc_status })),
        },
        transactions: {
          pendingCount:        txList.filter(t => t.status?.toUpperCase() === "PENDING").length,
          pendingVolume:       fmt(txList.filter(t => t.status?.toUpperCase() === "PENDING").reduce((s, t) => s + Number(t.amount), 0)),
          depositsThisWeek:   fmt(txList.filter(t => t.type?.toUpperCase() === "DEPOSIT" && new Date(t.created_at) >= week).reduce((s, t) => s + Number(t.amount), 0)),
          withdrawalsThisWeek: fmt(txList.filter(t => t.type?.toUpperCase() === "WITHDRAWAL" && new Date(t.created_at) >= week).reduce((s, t) => s + Number(t.amount), 0)),
          largeWithdrawals:    txList.filter(t => t.type?.toUpperCase() === "WITHDRAWAL" && Number(t.amount) >= 10_000).length,
        },
      };

      const userMsg = `Generate a CRM performance summary for a ${workerRole}:

DATA:
${JSON.stringify(ctx, null, 2)}

Respond in EXACTLY this format:

📊 CRM HEALTH SUMMARY
[3–4 sentence overview of the current platform state]

👥 TEAM STATUS
[Bullet points about team activity, online patterns, and agents that may need attention]

🔥 PRIORITY ACTIONS FOR ${workerRole.toUpperCase()}
[Top 3–5 items that require management attention right now]

💰 FINANCIAL PIPELINE (THIS WEEK)
[Summary of deposits, withdrawals, and pending transactions]

🚀 OPPORTUNITIES
[Client segments or situations representing growth or engagement opportunities]

📋 RECOMMENDED REVIEW TASKS
[Bullet list of suggested manual checks for the ${workerRole}]

NOTE: This summary is for internal management review only. No automated actions are taken. All recommendations require human approval.`;

      setResult(await callCRMOpenRouter(DASHBOARD_SYSTEM, userMsg));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  if (!allowed && workerRole) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <Users className="w-10 h-10 text-aura-platinum/20" />
        <p className="text-sm font-bold text-aura-platinum/40">Manager &amp; Director Access Only</p>
        <p className="text-xs text-aura-platinum/25 max-w-xs">
          This tab is available to managers, directors, and admins.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-aura-platinum/60 leading-relaxed">
        AI generates a CRM performance overview covering team activity, client pipeline,
        transaction health, and priority actions for {workerRole === "manager" ? "your team" : "the full platform"}.
        All outputs are for management review only.
      </p>

      <button
        onClick={generate}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating team insights…</>
          : <><BarChart3 className="w-4 h-4" /> Generate Team Insights Report</>}
      </button>

      <ResultBox result={result} loading={false} error={error} />
      {loading && <ResultBox result="" loading={true} error={null} />}
    </div>
  );
}

// ── Tab 8 — Search & Knowledge Assistant ─────────────────────────────────────

const SEARCH_SYSTEM = `You are a CRM knowledge assistant for Bullenhaus trading platform.
Answer questions about CRM data using only the provided context snapshot.
RULES:
- Only reference data present in the snapshot — never invent figures or client details.
- Do not make legal, financial, or compliance conclusions.
- Do not reveal confidential client details beyond what is relevant to the question.
- All answers are for internal staff use only.`;

const EXAMPLE_QUERIES = [
  "Which clients have not completed KYC?",
  "Show clients with the highest balance",
  "How many clients registered this month?",
  "Which clients have zero balance?",
  "Summarise today's CRM activity",
  "Which clients need immediate attention?",
];

function SearchTab({
  clients, clientsLoading, workerRole,
}: {
  clients: SlimClient[];
  clientsLoading: boolean;
  workerRole: string;
}) {
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const search = async (q?: string) => {
    const question = (q ?? query).trim();
    if (!question) return;
    setLoading(true); setError(null); setResult("");
    try {
      const { data: txData } = await supabase
        .from("transactions")
        .select("type, status, amount, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(200);

      const txList = txData ?? [];
      const now    = new Date();
      const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const week   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const month  = new Date(now.getFullYear(), now.getMonth(), 1);

      const ctx = {
        askerRole:    workerRole || "agent",
        totalClients: clients.length,
        clientSummary: {
          kycVerified:    clients.filter(c => c.kyc_status === "VERIFIED").length,
          kycPending:     clients.filter(c => c.kyc_status !== "VERIFIED").length,
          withBalance:    clients.filter(c => c.balance > 0).length,
          zeroBalance:    clients.filter(c => c.balance === 0).length,
          highValue_10k:  clients.filter(c => c.balance >= 10_000).length,
          newToday:       clients.filter(c => new Date(c.createdAt) >= today).length,
          newThisWeek:    clients.filter(c => new Date(c.createdAt) >= week).length,
          newThisMonth:   clients.filter(c => new Date(c.createdAt) >= month).length,
          topByBalance:   clients.slice().sort((a, b) => b.balance - a.balance).slice(0, 8)
            .map(c => ({ name: c.name, balance: fmt(c.balance), kyc: c.kyc_status, country: c.country ?? "N/A" })),
          kycPendingList: clients.filter(c => c.kyc_status !== "VERIFIED").slice(0, 12)
            .map(c => ({ name: c.name, kyc: c.kyc_status, balance: fmt(c.balance) })),
          zeroBalanceList: clients.filter(c => c.balance === 0).slice(0, 10)
            .map(c => ({ name: c.name, kyc: c.kyc_status })),
        },
        transactionSummary: {
          pendingCount:         txList.filter(t => t.status?.toUpperCase() === "PENDING").length,
          depositsToday:        fmt(txList.filter(t => t.type?.toUpperCase() === "DEPOSIT" && new Date(t.created_at) >= today).reduce((s, t) => s + Number(t.amount), 0)),
          withdrawalsToday:     fmt(txList.filter(t => t.type?.toUpperCase() === "WITHDRAWAL" && new Date(t.created_at) >= today).reduce((s, t) => s + Number(t.amount), 0)),
          depositsThisWeek:     fmt(txList.filter(t => t.type?.toUpperCase() === "DEPOSIT" && new Date(t.created_at) >= week).reduce((s, t) => s + Number(t.amount), 0)),
          withdrawalsThisWeek:  fmt(txList.filter(t => t.type?.toUpperCase() === "WITHDRAWAL" && new Date(t.created_at) >= week).reduce((s, t) => s + Number(t.amount), 0)),
          largeWithdrawals_10k: txList.filter(t => t.type?.toUpperCase() === "WITHDRAWAL" && Number(t.amount) >= 10_000).length,
        },
      };

      const userMsg = `QUESTION FROM ${(workerRole || "agent").toUpperCase()}: "${question}"

CRM DATA SNAPSHOT:
${JSON.stringify(ctx, null, 2)}

Answer the question clearly and concisely using only the data above.
Format your answer cleanly with sections if helpful.
If the question cannot be answered from the available data, say so clearly.`;

      setResult(await callCRMOpenRouter(SEARCH_SYSTEM, userMsg));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-aura-platinum/60 leading-relaxed">
        Ask any question about your CRM data in plain language. AI will analyse the available data
        and return a structured answer. Answers are based on live data at time of query.
      </p>

      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50">Your Question</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-aura-platinum/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setResult(""); setError(null); }}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="e.g. Which clients haven't completed KYC?"
            className={`${inputCls} pl-10`}
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] text-aura-platinum/30 uppercase tracking-widest mb-2">Example queries</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => { setQuery(q); setResult(""); setError(null); search(q); }}
              className="px-2.5 py-1 rounded-lg text-[10px] bg-black/30 border border-glass-border text-aura-platinum/40 hover:text-aura-platinum hover:border-aura-gold/20 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => search()}
        disabled={!query.trim() || loading || clientsLoading}
        className="w-full py-3 rounded-xl bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
          : <><Search className="w-4 h-4" /> Search CRM Data</>}
      </button>

      <ResultBox result={result} loading={false} error={error} />
      {loading && <ResultBox result="" loading={true} error={null} />}
    </div>
  );
}

// ── API Key Settings (inline panel) ──────────────────────────────────────────

function ApiKeyPanel({ onClose }: { onClose: () => void }) {
  const [model,  setModel]  = useState(AI_PRIMARY_MODEL);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    aiStatus().then(d => setAiOnline(d.configured)).catch(() => setAiOnline(false));
  }, []);

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 350));
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-aura-gold/20 glass-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-aura-platinum uppercase tracking-widest">AI Model Settings</p>
        <button onClick={onClose} className="text-[10px] text-aura-platinum/40 hover:text-aura-platinum transition-colors">Close</button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/30 border border-glass-border">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${aiOnline === null ? "bg-aura-platinum/30 animate-pulse" : aiOnline ? "bg-aura-emerald" : "bg-rose-500/60"}`} />
        <span className="text-[10px] text-aura-platinum/60">
          {aiOnline === null ? "Checking server..." : aiOnline ? "OpenRouter server key active" : "AI service not configured"}
        </span>
      </div>

      {/* Model */}
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-1.5">Server model policy</label>
        <div className="relative">
          <select value={model} onChange={e => setModel(e.target.value)} className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
            {CRM_FREE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-aura-platinum/40 pointer-events-none" />
        </div>
      </div>

      <button onClick={save} disabled={saving || saved} className="w-full py-2.5 rounded-lg bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">
        {saved ? <><CheckCircle2 className="w-4 h-4" /> Closed</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Closing...</> : "Close"}
      </button>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "summary",      label: "Client Summary",      icon: FileText,      desc: "Profile, financials, risk level"  },
  { key: "scoring",      label: "Lead Scoring",         icon: Target,        desc: "Hot / Warm / Cold / Risky"        },
  { key: "action",       label: "Next Best Action",     icon: Zap,           desc: "Agent step recommendation"        },
  { key: "comm",         label: "Communication",        icon: MessageSquare, desc: "Calls, chats, emails, notes"      },
  { key: "risk",         label: "Risk Alerts",          icon: ShieldAlert,   desc: "Suspicious patterns & KYC gaps"   },
  { key: "productivity", label: "Productivity",         icon: Clock,         desc: "Templates, scripts & reminders"   },
  { key: "dashboard",    label: "Team Insights",        icon: BarChart3,     desc: "Manager & director dashboard"     },
  { key: "search",       label: "CRM Search",           icon: Search,        desc: "Ask questions in plain language"  },
];

export function AIInsights() {
  const { t } = useI18n();
  const [tab,            setTab]            = useState<TabKey>("summary");
  const [clients,        setClients]        = useState<SlimClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError,   setClientsError]   = useState<string | null>(null);
  const [showKeyPanel,   setShowKeyPanel]   = useState(false);
  const [workerRole,     setWorkerRole]     = useState<string>("");

  const [hasKey, setHasKey] = useState<boolean>(false);
  useEffect(() => {
    aiStatus().then(d => setHasKey(d.configured)).catch(() => setHasKey(false));
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: u } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();
      if (u?.role) setWorkerRole(u.role);
    });
  }, []);

  const loadClients = useCallback(async () => {
    setClientsLoading(true); setClientsError(null);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, first_name, last_name, phone, country, balance, kyc_status, created_at")
        .eq("role", "client")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      setClients((data ?? []).map(mapSlim));
    } catch (e) {
      console.error('[AIInsights] Failed to load clients', e);
      setClientsError('Unable to load AI insight clients');
    }
    finally { setClientsLoading(false); }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-aura-gold/10 border border-aura-gold/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-aura-gold" />
            </div>
            <h1 className="text-xl font-bold text-aura-platinum">{t('aiPageTitle')}</h1>
            <Sparkles className="w-4 h-4 text-aura-gold" />
          </div>
          <p className="text-[13px] text-aura-platinum/50 leading-relaxed max-w-xl">
            AI-powered analysis: client summaries, lead scoring, next actions, communication analysis,
            risk alerts, productivity tools, team dashboards, and CRM search.
            All outputs are recommendations — no actions are automated.
            {workerRole && <span className="ml-2 text-[10px] text-aura-gold/60 uppercase tracking-widest font-bold">· {workerRole}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`w-2 h-2 rounded-full ${hasKey ? "bg-aura-emerald" : "bg-aura-ruby"}`} />
          <span className="text-[10px] text-aura-platinum/40 uppercase tracking-widest">
            {hasKey ? "API Connected" : "No API Key"}
          </span>
          <button
            onClick={() => setShowKeyPanel(s => !s)}
            className="ml-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-glass-border text-[11px] text-aura-platinum/60 hover:text-aura-platinum transition-all font-bold uppercase tracking-widest"
          >
            {showKeyPanel ? "Close" : "Configure API"}
          </button>
          <button onClick={loadClients} disabled={clientsLoading} className="p-1.5 rounded-lg hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors" title="Refresh client list">
            <RefreshCw className={`w-4 h-4 ${clientsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── API key panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showKeyPanel && <ApiKeyPanel onClose={() => setShowKeyPanel(false)} />}
      </AnimatePresence>

      {/* ── No-key warning ─────────────────────────────────────────────────── */}
      {!hasKey && !showKeyPanel && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-aura-ruby/5 border border-aura-ruby/15">
          <AlertTriangle className="w-4 h-4 text-aura-ruby shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-aura-ruby mb-0.5">OpenRouter API Key Required</p>
            <p className="text-[11px] text-aura-platinum/50">
              Set OPENROUTER_API_KEY in the server or Supabase Edge Function secrets.
              The key is never stored in this browser.
            </p>
          </div>
        </div>
      )}

      {/* ── Client list error ─────────────────────────────────────────────── */}
      {clientsError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-aura-ruby/5 border border-aura-ruby/15">
          <AlertTriangle className="w-4 h-4 text-aura-ruby shrink-0 mt-0.5" />
          <p className="text-xs text-aura-ruby">{clientsError}</p>
        </div>
      )}

      {!clientsLoading && !clientsError && clients.length === 0 && (
        <div className="rounded-xl border border-glass-border glass-card p-5">
          <p className="text-sm font-bold text-aura-platinum">No AI insights yet</p>
          <p className="mt-1 text-xs text-aura-platinum/50">
            Insights will appear after client activity, calls, tasks, or lead updates.
          </p>
        </div>
      )}

      {/* ── Disclaimer banner ─────────────────────────────────────────────── */}
      <Disclaimer />

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left ${
                active
                  ? "bg-aura-gold/8 border-aura-gold/30 text-aura-gold"
                  : "glass-card-glass-border text-aura-platinum/50 hover:border-aura-gold/15 hover:text-aura-platinum/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">{t.label}</span>
              <span className="text-[8px] opacity-60 leading-tight">{t.desc}</span>
              {active && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-aura-gold rounded-b-xl" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-glass-border glass-card p-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
            {tab === "summary"      && <SummaryTab     clients={clients} clientsLoading={clientsLoading} />}
            {tab === "scoring"      && <ScoringTab     clients={clients} clientsLoading={clientsLoading} />}
            {tab === "action"       && <ActionTab      clients={clients} clientsLoading={clientsLoading} />}
            {tab === "comm"         && <CommTab />}
            {tab === "risk"         && <RiskTab        clients={clients} clientsLoading={clientsLoading} />}
            {tab === "productivity" && <ProductivityTab clients={clients} clientsLoading={clientsLoading} />}
            {tab === "dashboard"    && <TeamDashTab    workerRole={workerRole} />}
            {tab === "search"       && <SearchTab      clients={clients} clientsLoading={clientsLoading} workerRole={workerRole} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-aura-platinum/25 uppercase tracking-widest">
        AI outputs are for internal CRM use only · Human approval required for all actions ·
        {clients.length > 0 && ` ${clients.length} clients loaded`}
      </p>
    </div>
  );
}
