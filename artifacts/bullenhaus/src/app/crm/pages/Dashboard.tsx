import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Activity,
  DollarSign,
  Loader2
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from "../../../lib/supabase/browserClient";
import { useI18n } from "../lib/i18n";

interface DashboardStats {
  clientCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
  crmWorkers: { full_name: string | null; role: string; email: string; last_seen_at: string | null }[];
  weeklyFlow: { name: string; deposit: number; withdrawal: number }[];
}

function getOnlineStatus(lastSeen: string | null, onlineLabel: string, offlineLabel: string) {
  if (!lastSeen) return { label: offlineLabel, dotClass: 'bg-aura-platinum/20', textClass: 'text-aura-platinum/30' };
  const mins = (Date.now() - new Date(lastSeen).getTime()) / 60_000;
  if (mins < 5)  return { label: onlineLabel,               dotClass: 'bg-aura-emerald shadow-[0_0_6px_rgba(16,185,129,0.6)]', textClass: 'text-aura-emerald' };
  if (mins < 60) return { label: `${Math.floor(mins)}m ago`, dotClass: 'bg-yellow-400', textClass: 'text-yellow-400' };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return { label: `${hrs}h ago`,              dotClass: 'bg-aura-platinum/30', textClass: 'text-aura-platinum/40' };
  return           { label: new Date(lastSeen).toLocaleDateString(), dotClass: 'bg-aura-platinum/20', textClass: 'text-aura-platinum/30' };
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

async function loadStats(): Promise<DashboardStats> {
  const [clientsRes, workersRes, txRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("users").select("full_name, role, email, last_seen_at").in("role", ["agent", "manager", "director"]).order("role"),
    supabase.from("transactions").select("type, amount, created_at").eq("status", "Completed"),
  ]);

  const txData = (txRes.data ?? []) as { type: string; amount: number; created_at: string }[];

  // Build weekly flow — last 7 days
  const now = new Date();
  const weeklyFlow = DAYS.map((name, i) => {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayTx = txData.filter(t => {
      const d = new Date(t.created_at);
      return d >= dayStart && d <= dayEnd;
    });

    return {
      name,
      deposit:    dayTx.filter(t => t.type === "Deposit").reduce((s, t) => s + Number(t.amount), 0),
      withdrawal: dayTx.filter(t => t.type === "Withdrawal").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  const totalDeposits    = txData.filter(t => t.type === "Deposit").reduce((s, t) => s + Number(t.amount), 0);
  const totalWithdrawals = txData.filter(t => t.type === "Withdrawal").reduce((s, t) => s + Number(t.amount), 0);

  return {
    clientCount: clientsRes.count ?? 0,
    totalDeposits,
    totalWithdrawals,
    crmWorkers: workersRes.data ?? [],
    weeklyFlow,
  };
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function Dashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats().then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const netFlow = (stats?.totalDeposits ?? 0) - (stats?.totalWithdrawals ?? 0);
  const hasFlow = (stats?.totalDeposits ?? 0) + (stats?.totalWithdrawals ?? 0) > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* AI Insight Banner */}
      <div className="rounded-2xl border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md flex items-start gap-4">
        <div className="p-3 bg-black/40 border border-glass-border rounded-xl shrink-0 mt-1">
          <Activity className="w-6 h-6 text-aura-gold" />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xs font-bold tracking-widest text-aura-gold">{t('dashInsightsLabel')}</h3>
            <span className="text-[9px] bg-aura-gold/10 text-aura-gold border border-aura-gold/20 px-2 py-0.5 rounded uppercase tracking-widest">{t('dashLive')}</span>
          </div>
          <p className="text-aura-platinum/80 leading-relaxed text-sm">
            {loading
              ? t('dashLoadingAnalytics')
              : stats && stats.clientCount > 0
                ? `Platform has ${stats.clientCount} registered client${stats.clientCount !== 1 ? "s" : ""}. ${stats.crmWorkers.length} CRM specialists active across ${new Set(stats.crmWorkers.map(w => w.role)).size} roles. ${hasFlow ? `Net capital flow: ${netFlow >= 0 ? "+" : ""}${fmt(netFlow)} since launch.` : "No transactions recorded yet."}`
                : "No clients registered yet. Share the trading platform link to onboard your first clients."
            }
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title={t('dashActiveClients')}
          value={loading ? "—" : String(stats?.clientCount ?? 0)}
          change={stats && stats.clientCount > 0 ? "Registered" : "No clients yet"}
          trend="up"
          icon={<Users className="w-5 h-5" />}
          subtitle={t('dashTotalOnboarded')}
        />
        <KPICard
          title={t('dashTotalDeposits')}
          value={loading ? "—" : fmt(stats?.totalDeposits ?? 0)}
          change={stats && stats.totalDeposits > 0 ? "Completed" : "No deposits yet"}
          trend="up"
          icon={<DollarSign className="w-5 h-5" />}
          subtitle={t('dashAllTime')}
        />
        <KPICard
          title={t('dashNetCapFlow')}
          value={loading ? "—" : fmt(netFlow)}
          change={netFlow >= 0 ? "Positive" : "Negative"}
          trend={netFlow >= 0 ? "up" : "down"}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={t('dashDepMinusWit')}
        />
        {(() => {
          const workers = stats?.crmWorkers ?? [];
          const onlineCount = workers.filter(w => {
            if (!w.last_seen_at) return false;
            return (Date.now() - new Date(w.last_seen_at).getTime()) < 5 * 60_000;
          }).length;
          return (
            <KPICard
              title={t('dashCrmTeam')}
              value={loading ? "—" : String(onlineCount)}
              change={loading ? "…" : `${onlineCount} of ${workers.length} online`}
              trend={onlineCount > 0 ? "up" : "down"}
              icon={<ShieldAlert className="w-5 h-5" />}
              subtitle={t('dashActiveLast5')}
            />
          );
        })()}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Capital Flow Chart */}
        <div className="glass-panel p-8 rounded-2xl xl:col-span-2 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60">{t('dashCapFlowTitle')}</h3>
            </div>
            <div className="text-[10px] text-aura-gold border border-aura-gold/30 px-3 py-1 rounded-full uppercase">
              {hasFlow ? t('dashLiveData') : t('dashAwaitingTx')}
            </div>
          </div>
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.weeklyFlow ?? []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FB7185" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="rgba(232,232,234,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(232,232,234,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#121214", borderColor: "rgba(255,255,255,0.08)", borderRadius: "12px", fontSize: "12px" }}
                  itemStyle={{ color: "#E8E8EA" }}
                  formatter={(v: number) => fmt(v)}
                />
                <Area type="monotone" dataKey="deposit" name="Deposit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorDeposit)" />
                <Area type="monotone" dataKey="withdrawal" name="Withdrawal" stroke="#FB7185" strokeWidth={2} fillOpacity={1} fill="url(#colorWithdrawal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CRM Team */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">{t('dashCrmTeam')}</h3>
            <span className="text-[10px] font-mono text-aura-platinum/30 uppercase mt-1 block">
              {stats?.crmWorkers.length ?? 0} active specialists
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-aura-gold animate-spin" />
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
              {(stats?.crmWorkers ?? []).map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded border bg-white/[0.02] border-glass-border hover:bg-white/5 transition-colors"
                >
                  <div>
                    <div className="text-xs font-medium text-aura-platinum">{w.full_name || w.email.split("@")[0]}</div>
                    <div className="text-[9px] text-aura-platinum/40 tracking-wider uppercase mt-0.5">{w.role}</div>
                  </div>
                  {(() => {
                    const s = getOnlineStatus(w.last_seen_at, t('dashOnline'), t('dashOffline'));
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dotClass}`} />
                        <span className={`text-[9px] font-bold ${s.textClass}`}>{s.label}</span>
                      </div>
                    );
                  })()}
                </div>
              ))}
              {(stats?.crmWorkers ?? []).length === 0 && (
                <div className="text-center py-8 text-aura-platinum/30 text-xs">{t('dashNoCrmWorkers')}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, trend, icon, subtitle, alert }: any) {
  return (
    <div className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl">
      <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40 flex items-center justify-between">
        {title}
        <span className="p-1.5 bg-white/5 rounded-lg text-aura-gold">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-light tracking-tight text-aura-gold">{value}</div>
      <div className={`mt-2 text-[10px] flex items-center gap-1 ${alert ? "text-aura-ruby" : trend === "up" ? "text-aura-emerald" : "text-aura-ruby"}`}>
        {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change}
        {subtitle && <span className="text-aura-platinum/20 ml-1 font-normal tracking-normal">{subtitle}</span>}
      </div>
    </div>
  );
}
