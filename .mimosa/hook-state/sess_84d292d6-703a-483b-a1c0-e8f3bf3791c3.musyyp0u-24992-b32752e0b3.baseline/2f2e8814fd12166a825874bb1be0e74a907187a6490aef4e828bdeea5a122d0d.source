import { useState } from "react";
import { Phone, PhoneOff, PhoneMissed, Clock, Search, RefreshCw, Loader2, User } from "lucide-react";
import { useCallLogs, type CallLog } from "../hooks/useCallLogs";
import { useI18n } from "../lib/i18n";

function fmtDuration(secs: number) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function fmtPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length <= 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+${d.slice(0, d.length - 10)} (${d.slice(-10, -7)}) ${d.slice(-7, -4)}-${d.slice(-4)}`;
}

const STATUS_META: Record<string, { label: string; icon: typeof Phone; color: string; bg: string }> = {
  completed:  { label: "Completed",  icon: Phone,        color: "text-aura-emerald", bg: "bg-aura-emerald/10 border-aura-emerald/20" },
  answered:   { label: "Answered",   icon: Phone,        color: "text-aura-emerald", bg: "bg-aura-emerald/10 border-aura-emerald/20" },
  no_answer:  { label: "No Answer",  icon: PhoneMissed,  color: "text-yellow-400",   bg: "bg-yellow-400/10 border-yellow-400/20" },
  busy:       { label: "Busy",       icon: PhoneMissed,  color: "text-yellow-400",   bg: "bg-yellow-400/10 border-yellow-400/20" },
  failed:     { label: "Failed",     icon: PhoneOff,     color: "text-aura-ruby",    bg: "bg-aura-ruby/10 border-aura-ruby/20" },
  initiated:  { label: "Initiated",  icon: Phone,        color: "text-aura-platinum/40", bg: "bg-white/5 border-glass-border" },
  ringing:    { label: "Ringing",    icon: Phone,        color: "text-aura-platinum/40", bg: "bg-white/5 border-glass-border" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.initiated;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${m.color} ${m.bg}`}>
      <Icon className="w-2.5 h-2.5" />{m.label}
    </span>
  );
}

export function CallHistory() {
  const { t } = useI18n();
  const { logs, loading, error, refetch } = useCallLogs(200);
  const [search, setSearch] = useState("");

  const filtered = search
    ? logs.filter(l => {
        const q = search.toLowerCase();
        return (
          l.phone_number.includes(q) ||
          (l.agent?.full_name ?? l.agent?.email ?? "").toLowerCase().includes(q) ||
          (l.client?.full_name ?? l.client?.email ?? "").toLowerCase().includes(q)
        );
      })
    : logs;

  const totalCalls    = logs.length;
  const completedCalls = logs.filter(l => l.status === "completed" || l.status === "answered").length;
  const totalDuration  = logs.reduce((s, l) => s + (l.duration_seconds ?? 0), 0);

  return (
    <div className="space-y-6 pb-12">

      {/* Header */}
      <div className="border-b border-glass-border pb-4">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">
          {t('chTitle')}
        </h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">
          {t('chSubtitle')}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: t('chTotalCalls'),  value: totalCalls,              sub: t('dashAllTime'), color: "text-aura-platinum" },
          { label: t('chCompleted'),  value: completedCalls,           sub: `${totalCalls ? Math.round(completedCalls / totalCalls * 100) : 0}% answer rate`, color: "text-aura-emerald" },
          { label: t('chTalkTime'),   value: fmtDuration(totalDuration), sub: t('chAllAgents'), color: "text-aura-gold" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40 mb-1">{k.label}</div>
            <div className={`text-2xl font-light font-mono ${k.color}`}>{k.value}</div>
            <div className="text-[10px] text-aura-platinum/30 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Search + refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-aura-platinum/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('chSearchPlaceholder')}
            className="w-full bg-black/40 border border-glass-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-aura-platinum placeholder:text-aura-platinum/30 outline-none focus:border-aura-gold/40 transition-colors"
          />
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-2.5 rounded-xl border border-glass-border glass-card hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors disabled:opacity-30"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl border border-aura-ruby/30 bg-aura-ruby/5 text-aura-ruby text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-glass-border glass-card overflow-hidden">
        {/* Head */}
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-glass-border bg-black/30">
          {[t('chColPhone'), t('chColClient'), t('chColAgent'), t('status'), t('chColDuration'), t('chColDate')].map(h => (
            <div key={h} className="text-[9px] font-bold uppercase tracking-[0.2em] text-aura-platinum/30">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-aura-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <PhoneMissed className="w-10 h-10 text-aura-platinum/10" />
            <span className="text-sm text-aura-platinum/30">
              {search ? t('chNoMatch') : t('chNoRecords')}
            </span>
            <span className="text-xs text-aura-platinum/20">{t('chWillAppear')}</span>
          </div>
        ) : (
          <div className="divide-y divide-glass-border">
            {filtered.map((log: CallLog) => {
              const agentName = log.agent?.full_name || log.agent?.email?.split("@")[0] || "—";
              const clientName = log.client?.full_name || log.client?.email?.split("@")[0] || null;
              return (
                <div
                  key={log.id}
                  className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors items-center"
                >
                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      (STATUS_META[log.status] ?? STATUS_META.initiated).bg
                    }`}>
                      <Phone className={`w-3 h-3 ${(STATUS_META[log.status] ?? STATUS_META.initiated).color}`} />
                    </div>
                    <span className="text-xs font-mono text-aura-platinum">{fmtPhone(log.phone_number)}</span>
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {clientName ? (
                      <>
                        <User className="w-3 h-3 text-aura-gold shrink-0" />
                        <span className="text-xs text-aura-platinum truncate">{clientName}</span>
                      </>
                    ) : (
                      <span className="text-xs text-aura-platinum/20">—</span>
                    )}
                  </div>

                  {/* Agent */}
                  <div className="text-xs text-aura-platinum/70 truncate">{agentName}</div>

                  {/* Status */}
                  <div><StatusBadge status={log.status} /></div>

                  {/* Duration */}
                  <div className="flex items-center gap-1 text-xs font-mono text-aura-platinum/50">
                    {log.duration_seconds > 0 && <Clock className="w-3 h-3" />}
                    {fmtDuration(log.duration_seconds)}
                  </div>

                  {/* Date */}
                  <div className="text-[10px] text-aura-platinum/30">
                    <div>{new Date(log.created_at).toLocaleDateString()}</div>
                    <div className="font-mono">{new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
