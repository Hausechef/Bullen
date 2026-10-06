import { useEffect, useState, useCallback } from "react";
import {
  Loader2, RefreshCw, Zap, CheckCircle2, Users, TrendingUp, DollarSign,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { useI18n } from "../lib/i18n";
import { supabase } from "../../../lib/supabase/browserClient";
import { getLeadCounts } from "../../trading/services/leadsService";

// ── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  last_seen_at: string | null;
  leadCount: number;
  clientCount: number;
}

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  stage: string;
  assigned_agent_id: string | null;
}

interface ClientRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  assigned_agent_id: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOnlineStatus(lastSeen: string | null) {
  if (!lastSeen) return { status: 'offline', label: 'Never seen', dotClass: 'bg-aura-platinum/20', textClass: 'text-aura-platinum/30' };
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const mins = diffMs / 60_000;
  if (mins < 5)  return { status: 'online',  label: 'Online',            dotClass: 'bg-aura-emerald shadow-[0_0_6px_rgba(16,185,129,0.9)]', textClass: 'text-aura-emerald' };
  if (mins < 60) return { status: 'away',    label: `${Math.floor(mins)}m ago`,  dotClass: 'bg-yellow-400',  textClass: 'text-yellow-400' };
  const hrs = Math.floor(diffMs / 3_600_000);
  if (hrs < 24)  return { status: 'offline', label: `${hrs}h ago`,       dotClass: 'bg-aura-platinum/30', textClass: 'text-aura-platinum/40' };
  return           { status: 'offline', label: new Date(lastSeen).toLocaleDateString(), dotClass: 'bg-aura-platinum/20', textClass: 'text-aura-platinum/30' };
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function displayName(u: { full_name?: string | null; email: string }) {
  return u.full_name?.trim() || u.email.split('@')[0];
}

// ── Component ────────────────────────────────────────────────────────────────

export function ManagerDashboard() {
  const { t } = useI18n();

  const [agents, setAgents]             = useState<Agent[]>([]);
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [clients, setClients]           = useState<ClientRecord[]>([]);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [activeClientCount, setActiveClientCount] = useState(0);
  const [unassignedSummary, setUnassignedSummary] = useState({ leads: 0, clients: 0 });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const [assignTab, setAssignTab]       = useState<'leads' | 'clients'>('leads');
  const [assigning, setAssigning]       = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [successMsg, setSuccessMsg]     = useState<string | null>(null);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamRes, clientsRes, txRes, clientCountRes, unassignedLeadCount, unassignedClientRes, leadsRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, full_name, email, role, last_seen_at')
          .in('role', ['agent', 'manager'])
          .order('role'),
        supabase
          .from('users')
          .select('id, full_name, email, assigned_agent_id')
          .eq('role', 'client')
          .is('assigned_agent_id', null)
          .order('created_at', { ascending: false })
          .limit(25),
        supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'Deposit')
          .in('status', ['Completed', 'Approved'])
          .limit(1000),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'client'),
        getLeadCounts({ assignedTo: null }),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'client')
          .is('assigned_agent_id', null),
        supabase
          .from('leads')
          .select('id, first_name, last_name, email, stage, assigned_agent_id')
          .is('assigned_agent_id', null)
          .order('created_at', { ascending: false })
          .limit(25),
      ]);

      if (teamRes.error) throw new Error(teamRes.error.message);
      if (clientsRes.error) throw new Error(clientsRes.error.message);
      if (leadsRes.error) throw new Error(leadsRes.error.message);

      const leadsData = (leadsRes.data ?? []) as Lead[];
      const clientsData = (clientsRes.data ?? []) as ClientRecord[];
      const teamData = (teamRes.data ?? []) as any[];
      const rawAgents = teamData.filter(u => u.role === 'agent');

      const agentList: Agent[] = await Promise.all(rawAgents.map(async (a) => {
        const [leadCount, clientCountRes] = await Promise.all([
          getLeadCounts({ assignedTo: a.id }),
          supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'client')
            .eq('assigned_agent_id', a.id),
        ]);
        return { ...a, leadCount, clientCount: clientCountRes.count ?? 0 };
      }));

      setAgents(agentList);
      setLeads(leadsData);
      setClients(clientsData);
      setActiveClientCount(clientCountRes.count ?? clientsData.length);
      setUnassignedSummary({ leads: unassignedLeadCount, clients: unassignedClientRes.count ?? 0 });
      setTotalDeposits((txRes.data ?? []).reduce((s: number, tx: any) => s + Number(tx.amount), 0));
    } catch (err) {
      console.error('[ManagerDashboard] Failed to load dashboard', err);
      setError('Unable to load manager dashboard');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Assignment helpers ─────────────────────────────────────────────────────

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const assignItem = async (table: 'leads' | 'users', id: string, agentId: string) => {
    setAssigning(id);
    const { error } = await supabase
      .from(table)
      .update({ assigned_agent_id: agentId })
      .eq('id', id);
    if (!error) await loadAll();
    setAssigning(null);
  };

  const handleAutoAssign = async () => {
    const agentsOnly = agents;
    if (agentsOnly.length === 0) { showSuccess('No agents available.'); return; }

    setAutoAssigning(true);
    const unassigned = assignTab === 'leads'
      ? leads.filter(l => !l.assigned_agent_id)
      : clients.filter(c => !c.assigned_agent_id);

    if (unassigned.length === 0) {
      setAutoAssigning(false);
      showSuccess('All items are already assigned.');
      return;
    }

    // Sort agents by total load ascending for fair distribution
    const sorted = [...agentsOnly].sort(
      (a, b) => (a.leadCount + a.clientCount) - (b.leadCount + b.clientCount)
    );

    const table = assignTab === 'leads' ? 'leads' : 'users';
    for (let i = 0; i < unassigned.length; i++) {
      const agent = sorted[i % sorted.length];
      await supabase
        .from(table)
        .update({ assigned_agent_id: agent.id })
        .eq('id', unassigned[i].id);
    }

    await loadAll();
    setAutoAssigning(false);
    showSuccess(`${unassigned.length} item(s) auto-assigned.`);
  };

  const agentNameById = (id: string | null) => {
    if (!id) return null;
    const a = agents.find(x => x.id === id);
    return a ? displayName(a) : null;
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const itemsForTab = assignTab === 'leads' ? leads : clients;
  const unassignedCount = {
    leads:   unassignedSummary.leads,
    clients: unassignedSummary.clients,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">
          {t('managerTitle')}
        </h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">
          {t('managerSubtitle')}
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Deposits', value: loading ? '—' : fmt(totalDeposits), sub: 'All completed deposits', icon: DollarSign, color: 'text-aura-gold', border: 'border-aura-gold/20' },
          { label: 'Active Clients', value: loading ? '—' : String(activeClientCount),   sub: 'Registered on platform', icon: Users,       color: 'text-aura-platinum', border: 'border-glass-border' },
          { label: 'Team Agents',    value: loading ? '—' : String(agents.length),    sub: `${unassignedCount.leads} unassigned leads`, icon: TrendingUp,  color: 'text-aura-platinum', border: 'border-glass-border' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-xl border ${kpi.border} bg-gradient-to-b from-white/5 to-transparent p-6 hover:border-aura-gold/20 transition-colors`}>
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={`w-4 h-4 ${kpi.color} opacity-50`} />
              <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40">{kpi.label}</div>
            </div>
            <div className={`text-2xl font-light tracking-tight ${kpi.color}`}>{kpi.value}</div>
            <div className="mt-2 text-[10px] text-aura-emerald">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl border border-aura-ruby/30 bg-aura-ruby/5 text-aura-ruby text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Agent Roster (real online status) ── */}
        <div className="xl:col-span-1 rounded-xl border border-glass-border glass-card p-6 flex flex-col min-h-[460px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Agents</h3>
            <button
              onClick={loadAll}
              disabled={loading}
              className="p-1.5 rounded hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors disabled:opacity-30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-aura-gold animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-aura-platinum/30 text-xs">
              No agents found
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1">
              {agents.map(agent => {
                const { label, dotClass, textClass } = getOnlineStatus(agent.last_seen_at);
                const load = agent.leadCount + agent.clientCount;
                return (
                  <div key={agent.id} className="p-3 rounded-lg border border-glass-border glass-card flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-aura-gold/20 to-transparent border border-aura-gold/20 flex items-center justify-center text-[10px] font-bold text-aura-gold uppercase">
                        {displayName(agent).substring(0, 2)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#121214] ${dotClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-aura-platinum truncate">{displayName(agent)}</div>
                      <div className={`text-[9px] font-mono uppercase tracking-wider ${textClass}`}>{label}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[8px] text-aura-platinum/30 uppercase tracking-wider">Load</div>
                      <div className={`text-sm font-bold font-mono ${load > 10 ? 'text-aura-ruby' : load > 5 ? 'text-aura-warning' : 'text-aura-emerald'}`}>
                        {load}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Assignment Panel ── */}
        <div className="xl:col-span-2 rounded-xl border border-glass-border glass-card p-6 flex flex-col min-h-[460px]">

          {/* Tab bar + Auto-Assign */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-glass-border">
              {(['leads', 'clients'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAssignTab(tab)}
                  className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                    assignTab === tab
                      ? 'bg-aura-gold/20 text-aura-gold border border-aura-gold/30'
                      : 'text-aura-platinum/50 hover:text-aura-platinum'
                  }`}
                >
                  {tab}
                  {unassignedCount[tab] > 0 && (
                    <span className="bg-aura-ruby text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {unassignedCount[tab]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {successMsg && (
                <span className="text-[10px] text-aura-emerald font-mono flex items-center gap-1 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoAssign}
                disabled={autoAssigning || loading || agents.length === 0}
              >
                {autoAssigning
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Zap className="w-3.5 h-3.5" />
                }
                Auto-Assign
              </Button>
            </div>
          </div>

          {/* Items list */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-aura-gold animate-spin" />
            </div>
          ) : itemsForTab.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-aura-platinum/30 text-xs">
              No {assignTab} found
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {itemsForTab.map(item => {
                const isLead = assignTab === 'leads';
                const lead = item as Lead;
                const client = item as ClientRecord;

                const name = isLead
                  ? `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || lead.email || '—'
                  : client.full_name?.trim() || client.email || '—';

                const sub = isLead ? lead.email || lead.stage : client.email || '';
                const currentAgent = agentNameById(item.assigned_agent_id);
                const isBeingAssigned = assigning === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isBeingAssigned
                        ? 'border-aura-gold/40 bg-aura-gold/5'
                        : 'border-glass-border glass-card hover:bg-black/40'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent border border-white/5 flex items-center justify-center text-[9px] text-aura-platinum/50 font-bold uppercase">
                      {name.substring(0, 2)}
                    </div>

                    {/* Name + current agent */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-aura-platinum truncate">{name}</div>
                      <div className="text-[9px] truncate mt-0.5">
                        {currentAgent
                          ? <span className="text-aura-gold">{currentAgent}</span>
                          : <span className="text-aura-ruby/70 font-medium">Unassigned</span>
                        }
                        {sub && <span className="text-aura-platinum/30 ml-1">· {sub}</span>}
                      </div>
                    </div>

                    {/* Agent picker */}
                    <div className="shrink-0">
                      {isBeingAssigned ? (
                        <Loader2 className="w-4 h-4 text-aura-gold animate-spin" />
                      ) : (
                        <select
                          value=""
                          onChange={async e => {
                            const val = e.target.value;
                            if (!val) return;
                            const table = isLead ? 'leads' : 'users';
                            await assignItem(table, item.id, val);
                          }}
                          disabled={agents.length === 0}
                          className="glass-card border-glass-border text-aura-platinum text-[10px] rounded-lg px-2 py-1.5 outline-none focus:border-aura-gold/50 disabled:opacity-40 max-w-[130px] cursor-pointer"
                        >
                          <option value="">Assign to…</option>
                          {agents.map(a => (
                            <option key={a.id} value={a.id}>
                              {displayName(a)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
