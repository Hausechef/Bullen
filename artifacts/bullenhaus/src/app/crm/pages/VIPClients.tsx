import React, { useState, useEffect, useRef } from "react";
import {
  Search, MoreVertical, ShieldAlert, Star, Phone, Mail, ChevronRight,
  LayoutList, CheckCircle2, AlertTriangle, TrendingUp, ArrowDownLeft,
  ArrowUpRight, Loader2, AlertCircle, DollarSign, Clock, ShieldCheck, Globe,
  Copy, UserCircle, ExternalLink
} from "lucide-react";
import { usePhoneDialer } from "../contexts/PhoneDialerContext";
import { useAuth } from "../../trading/contexts/AuthContext";
import { Button } from "../components/ui/Button";
import { Drawer } from "../components/ui/Drawer";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { useClients, fetchClientTransactions, type CRMClient, type ClientTransaction, type BalanceFlashDirection } from "../hooks/useClients";
import { useI18n } from "../lib/i18n";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function ClientDrawer({ client, isOpen, onClose }: { client: CRMClient | null; isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "deposits" | "kyc">("overview");
  const [unmasked, setUnmasked] = useState(false);
  const [transactions, setTransactions] = useState<ClientTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setUnmasked(false);
      setTransactions([]);
      setTxError(null);
      return;
    }
    if (client && isOpen) {
      setTxLoading(true);
      fetchClientTransactions(client.id)
        .then(tx => { setTransactions(tx); setTxLoading(false); })
        .catch(e => { setTxError(e.message); setTxLoading(false); });
    }
  }, [isOpen, client]);

  if (!client) return null;

  const clientName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase() || "?";
  const totalDeposits = transactions.filter(t => t.type === "DEPOSIT" && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === "WITHDRAWAL" && t.status === "COMPLETED").reduce((s, t) => s + t.amount, 0);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={clientName} subtitle={`${client.tier} Tier Client`}>
      <div className="flex border-b border-glass-border">
        {(["overview", "deposits", "kyc"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors border-b-2 ${
              activeTab === tab ? "border-aura-gold text-aura-gold" : "border-transparent text-aura-platinum/50 hover:text-aura-platinum"
            }`}
          >
            {tab === "deposits" ? "Transactions" : tab}
          </button>
        ))}
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar">

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-4 border-b border-glass-border pb-6">
              <div className="h-16 w-16 rounded border border-white/5 glass-card flex items-center justify-center font-display text-2xl text-aura-gold shadow-inner shrink-0">
                {initials}
              </div>
              <div>
                <h3 className="text-xl font-medium text-aura-platinum">{clientName}</h3>
                <div className="text-xs text-aura-platinum/50 mt-1">{client.email}</div>
                <div className="mt-2 text-[10px] font-mono text-aura-platinum/30">ID: {client.id.substring(0, 8)}</div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div
                className="glass-card border-glass-border rounded p-4 flex justify-between items-center group cursor-pointer hover:border-aura-gold/30 transition-colors"
                onClick={() => setUnmasked(v => !v)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center border border-white/5">
                    <Mail className="w-3.5 h-3.5 text-aura-platinum/60" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">Secure Email</div>
                    <div className="font-mono text-sm text-aura-platinum mt-1">
                      {unmasked ? client.email : client.email.replace(/(.{2})(.*)(?=@)/, "$1***")}
                    </div>
                  </div>
                </div>
                <span className="text-[9px] text-aura-gold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Toggle</span>
              </div>
            </div>

            {/* Balance + Deposit summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-4 rounded border border-aura-gold/20">
                <div className="text-[9px] uppercase tracking-[0.2em] text-aura-platinum/40 mb-1">Account Balance</div>
                <div className="text-lg font-mono text-aura-gold">{fmt(client.totalBalance)}</div>
              </div>
              <div className="bg-black/40 p-4 rounded border border-glass-border">
                <div className="text-[9px] uppercase tracking-[0.2em] text-aura-platinum/40 mb-2">KYC Status</div>
                <Badge variant={client.kyc_status === "VERIFIED" ? "success" : client.kyc_status === "REJECTED" ? "danger" : "warning"}>
                  {client.kyc_status}
                </Badge>
              </div>
              <div className="bg-black/40 p-4 rounded border border-aura-emerald/20">
                <div className="text-[9px] uppercase tracking-[0.2em] text-aura-platinum/40 mb-1">Total Deposited</div>
                <div className="text-base font-mono text-aura-emerald">
                  {txLoading ? "…" : fmt(totalDeposits)}
                </div>
              </div>
              <div className="bg-black/40 p-4 rounded border border-aura-ruby/20">
                <div className="text-[9px] uppercase tracking-[0.2em] text-aura-platinum/40 mb-1">Total Withdrawn</div>
                <div className="text-base font-mono text-aura-ruby">
                  {txLoading ? "…" : fmt(totalWithdrawals)}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-glass-border">
              <Button variant="primary" className="w-full justify-start py-4">
                <Phone className="w-4 h-4" /> Start Secure Call
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start py-4"
                onClick={() => window.open(`mailto:${client.email}`, '_blank')}
              >
                <Mail className="w-4 h-4" /> Draft Encrypted Email
              </Button>
            </div>
          </div>
        )}

        {/* ── Transactions ── */}
        {activeTab === "deposits" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Summary Strip */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-black/40 p-3 rounded border border-glass-border text-center">
                <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Balance</div>
                <div className="text-sm font-mono text-aura-gold">{fmt(client.totalBalance)}</div>
              </div>
              <div className="bg-black/40 p-3 rounded border border-aura-emerald/20 text-center">
                <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Deposited</div>
                <div className="text-sm font-mono text-aura-emerald">{txLoading ? "…" : fmt(totalDeposits)}</div>
              </div>
              <div className="bg-black/40 p-3 rounded border border-aura-ruby/20 text-center">
                <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Withdrawn</div>
                <div className="text-sm font-mono text-aura-ruby">{txLoading ? "…" : fmt(totalWithdrawals)}</div>
              </div>
            </div>

            {txLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-aura-gold animate-spin" />
              </div>
            )}

            {txError && (
              <div className="flex items-center gap-2 text-aura-ruby text-xs p-4 border border-aura-ruby/30 rounded bg-aura-ruby/5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {txError}
              </div>
            )}

            {!txLoading && !txError && transactions.length === 0 && (
              <div className="text-center py-12 text-aura-platinum/30 text-xs uppercase tracking-widest">
                No transactions yet
              </div>
            )}

            {!txLoading && transactions.map(tx => {
              const isDeposit = tx.type === "DEPOSIT";
              const isWithdrawal = tx.type === "WITHDRAWAL";
              const statusColor =
                tx.status === "COMPLETED" || tx.status === "APPROVED"  ? "text-aura-emerald" :
                tx.status === "FAILED"    || tx.status === "REJECTED"  ? "text-aura-ruby" :
                tx.status === "PROCESSING"                              ? "text-blue-400" :
                "text-aura-warning";
              return (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isDeposit ? "border-aura-emerald/20 bg-aura-emerald/5" :
                    isWithdrawal ? "border-aura-ruby/20 bg-aura-ruby/5" :
                    "border-glass-border bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isDeposit ? "bg-aura-emerald/10" : isWithdrawal ? "bg-aura-ruby/10" : "bg-white/5"
                    }`}>
                      {isDeposit
                        ? <ArrowDownLeft className="w-4 h-4 text-aura-emerald" />
                        : isWithdrawal
                        ? <ArrowUpRight className="w-4 h-4 text-aura-ruby" />
                        : <TrendingUp className="w-4 h-4 text-aura-gold" />
                      }
                    </div>
                    <div>
                      <div className="text-xs font-bold text-aura-platinum uppercase tracking-wider">{tx.type}</div>
                      <div className="text-[10px] text-aura-platinum/40 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(tx.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-sm font-bold ${
                      isDeposit ? "text-aura-emerald" : isWithdrawal ? "text-aura-ruby" : "text-aura-platinum"
                    }`}>
                      {isDeposit ? "+" : isWithdrawal ? "−" : ""}{fmt(tx.amount)}
                    </div>
                    <div className={`text-[9px] uppercase tracking-wider mt-0.5 ${statusColor}`}>{tx.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── KYC ── */}
        {activeTab === "kyc" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className={`flex items-center gap-4 p-5 rounded-xl border ${
              client.kyc_status === "VERIFIED"
                ? "border-aura-emerald/30 bg-aura-emerald/5"
                : client.kyc_status === "REJECTED"
                ? "border-aura-ruby/30 bg-aura-ruby/5"
                : "border-aura-warning/30 bg-aura-warning/5"
            }`}>
              {client.kyc_status === "VERIFIED"
                ? <ShieldCheck className="w-8 h-8 text-aura-emerald" />
                : client.kyc_status === "REJECTED"
                ? <ShieldAlert className="w-8 h-8 text-aura-ruby" />
                : <AlertTriangle className="w-8 h-8 text-aura-warning" />
              }
              <div>
                <div className="font-bold text-sm text-aura-platinum">KYC {client.kyc_status}</div>
                <div className="text-xs text-aura-platinum/50 mt-1">
                  {client.kyc_status === "VERIFIED"
                    ? "Identity verified — full platform access granted."
                    : client.kyc_status === "REJECTED"
                    ? "Verification failed — client needs to re-submit documents."
                    : "Documents pending review."
                  }
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-black/40 p-4 rounded border border-glass-border">
                <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Account Tier</div>
                <div className="text-sm font-bold text-aura-gold">{client.tier}</div>
              </div>
              <div className="bg-black/40 p-4 rounded border border-glass-border">
                <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Registered</div>
                <div className="text-xs font-mono text-aura-platinum">
                  {new Date(client.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export function VIPClientsPage() {
  return <VIPClients vipOnly />;
}

export function VIPClients({ vipOnly = false }: { vipOnly?: boolean }) {
  const { t } = useI18n();
  const { openDialer } = usePhoneDialer();
  const { role } = useAuth();
  const isAgent = role === 'agent';
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { clients, loading: isLoading, error, flashMap } = useClients(1, 100, search);

  const selectedClient = selectedClientId ? (clients.find(c => c.id === selectedClientId) ?? null) : null;

  const filteredClients = clients.filter(c => {
    if (vipOnly && c.tier === 'Silver') return false;
    if (filterTier) return c.tier === filterTier;
    return true;
  });

  const title = vipOnly ? t("vipTitle") : "Clients";
  const subtitle = vipOnly ? t("vipSubtitle") : "All registered clients";
  const searchPlaceholder = vipOnly ? t("searchVips") : "Search clients...";

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-glass-border pb-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{title}</h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{subtitle}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-card border-glass-border rounded pl-9 pr-4 py-2 text-xs text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors w-full sm:w-64 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <Button variant={filterTier === null ? "outline" : "secondary"} size="sm" onClick={() => setFilterTier(null)}>{t("all")}</Button>
            <Button variant={filterTier === "Titanium" ? "outline" : "secondary"} size="sm" onClick={() => setFilterTier("Titanium")}>Titanium</Button>
            <Button variant={filterTier === "Platinum" ? "outline" : "secondary"} size="sm" onClick={() => setFilterTier("Platinum")}>Platinum</Button>
            {!vipOnly && (
              <Button variant={filterTier === "Silver" ? "outline" : "secondary"} size="sm" onClick={() => setFilterTier("Silver")}>Silver</Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-aura-ruby/30 bg-aura-ruby/5 text-aura-ruby text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <ClientCardSkeleton key={i} />)}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredClients.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              isAgent={isAgent}
              flashDir={flashMap[c.id]}
              onViewProfile={() => setSelectedClientId(c.id)}
              onCall={(phone, name, clientId) => openDialer({ phone, name, clientId })}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-glass-border glass-card min-h-[40vh] flex items-center justify-center">
          <EmptyState
            icon={<LayoutList />}
            title={t("noVipTitle")}
            description={t("noVipDescription")}
            action={<Button variant="secondary" onClick={() => { setSearch(""); setFilterTier(null); }}>{t("clearFilters")}</Button>}
          />
        </div>
      )}

      <ClientDrawer isOpen={!!selectedClient} onClose={() => setSelectedClientId(null)} client={selectedClient} />
    </div>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="rounded-xl border border-glass-border glass-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
        <div className="bg-black/40 px-4 py-3 rounded border border-glass-border">
          <Skeleton className="h-2 w-16 mb-2" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="bg-black/40 px-4 py-3 rounded border border-glass-border">
          <Skeleton className="h-2 w-16 mb-2" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-glass-border pt-4">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

function ClientCardMenu({ client, onViewProfile, onCall, isAgent }: {
  client: CRMClient;
  onViewProfile: () => void;
  onCall: (phone: string, name: string, clientId: string) => void;
  isAgent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const clientName = `${client.firstName} ${client.lastName}`;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const actions = [
    {
      icon: <UserCircle className="w-3.5 h-3.5" />,
      label: 'View Profile',
      onClick: () => { onViewProfile(); setOpen(false); },
    },
    {
      icon: <Mail className="w-3.5 h-3.5" />,
      label: 'Send Email',
      onClick: () => { window.open(`mailto:${client.email}`, '_blank'); setOpen(false); },
    },
    {
      icon: <Copy className="w-3.5 h-3.5" />,
      label: 'Copy Email',
      onClick: () => { navigator.clipboard.writeText(client.email); setOpen(false); },
    },
    ...(client.phone ? [{
      icon: <ExternalLink className="w-3.5 h-3.5" />,
      label: 'Copy Phone',
      onClick: () => { navigator.clipboard.writeText(client.phone!); setOpen(false); },
    }] : []),
    ...(isAgent && client.phone ? [{
      icon: <Phone className="w-3.5 h-3.5 text-aura-emerald" />,
      label: 'Call Client',
      onClick: () => { onCall(client.phone!, clientName, client.id); setOpen(false); },
      highlight: true,
    }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-2 hover:bg-white/5 rounded transition-colors text-aura-platinum/50 hover:text-aura-platinum opacity-0 group-hover:opacity-100"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-44 glass-card shadow-2xl overflow-hidden">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); a.onClick(); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left transition-colors hover:bg-white/5 ${
                (a as any).highlight ? 'text-aura-emerald' : 'text-aura-platinum/70 hover:text-aura-platinum'
              } ${i > 0 ? 'border-t border-white/5' : ''}`}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({ client, onViewProfile, onCall, isAgent, flashDir }: { client: CRMClient; onViewProfile: () => void; onCall: (phone: string, name: string, clientId: string) => void; isAgent: boolean; flashDir?: BalanceFlashDirection }) {
  const clientName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase() || "?";
  const isNew = (Date.now() - new Date(client.createdAt).getTime()) < 48 * 60 * 60 * 1000;

  return (
    <div className={`rounded-xl border glass-card p-6 relative group transition-all duration-300 hover:bg-white/5 ${
      isNew
        ? "border-aura-emerald/50 shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:border-aura-emerald/70"
        : client.riskScore === "CRITICAL"
        ? "border-aura-ruby/30 hover:border-aura-ruby/50"
        : "border-glass-border hover:border-aura-gold/20"
    }`}>
      {isNew && (
        <div className="absolute top-0 left-0 bg-aura-emerald text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-br flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.4)]">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> New
        </div>
      )}
      {!isNew && client.riskScore === "CRITICAL" && (
        <div className="absolute top-0 right-0 bg-aura-ruby text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl flex items-center gap-1 shadow-[0_0_10px_rgba(251,113,133,0.3)]">
          <ShieldAlert className="w-3 h-3" /> Churn Risk
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded border border-white/5 glass-card flex items-center justify-center font-display text-aura-gold shadow-inner">
            {initials}
          </div>
          <div>
            <h3 className="text-sm font-medium text-aura-platinum flex items-center gap-2">
              {clientName}
              {client.tier === "Titanium" && <Star className="w-3 h-3 text-aura-gold fill-aura-gold" />}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[9px] uppercase tracking-wider">
              <span className="text-aura-gold">{client.tier}</span>
              <span className="text-aura-platinum/30">•</span>
              <span className="text-aura-platinum/50">{new Date(client.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <ClientCardMenu client={client} onViewProfile={onViewProfile} onCall={onCall} isAgent={isAgent} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 mb-3">
        <div className={`bg-black/40 px-4 py-3 rounded border border-aura-gold/20 transition-all duration-300 ${flashDir === 'up' ? 'balance-flash-up' : flashDir === 'down' ? 'balance-flash-down' : ''}`}>
          <div className="text-[9px] text-aura-platinum/40 uppercase tracking-[0.2em] mb-1">Balance</div>
          <div className="text-lg font-light font-mono text-aura-gold">{fmt(client.totalBalance)}</div>
        </div>
        <div className="bg-black/40 px-4 py-3 rounded border border-glass-border">
          <div className="text-[9px] text-aura-platinum/40 uppercase tracking-[0.2em] mb-2">KYC Status</div>
          <Badge variant={client.kyc_status === "VERIFIED" ? "success" : client.kyc_status === "REJECTED" ? "danger" : "warning"}>
            {client.kyc_status}
          </Badge>
        </div>
      </div>

      {(client.phone || client.country) && (
        <div className="flex items-center gap-3 mb-4 text-[10px] text-aura-platinum/50">
          {client.phone && (
            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-aura-emerald/60" />{client.phone}</span>
          )}
          {client.phone && client.country && <span className="text-aura-platinum/20">·</span>}
          {client.country && (
            <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-aura-platinum/30" />{client.country}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-glass-border pt-4">
        {isAgent && (
          <Button
            variant="secondary"
            className="flex-1 text-[10px]"
            onClick={() => {
              const phone = client.phone || client.email;
              if (phone) onCall(phone, clientName, client.id);
            }}
            disabled={!client.phone}
            title={client.phone ? `Call ${clientName}` : "No phone number on file"}
          >
            <Phone className="w-3.5 h-3.5" /> {client.phone ? "Call" : "No phone"}
          </Button>
        )}
        <Button
          variant="secondary"
          className="flex-1 text-[10px]"
          onClick={() => window.open(`mailto:${client.email}`, '_blank')}
          title={client.email}
        >
          <Mail className="w-3.5 h-3.5" /> Email
        </Button>
        <Button variant="outline" className="flex-1 text-[10px]" onClick={onViewProfile}>
          Profile <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
