import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Clock3,
  HeartHandshake,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase/browserClient";
import { Button } from "../components/ui/Button";

type RecoveryStatus = "NEW" | "CONTACTED" | "IN_REVIEW" | "ACTIVE_CASE" | "CLOSED";
type StatusFilter = RecoveryStatus | "ALL";

interface RecoveryRegistration {
  id: string;
  external_user_id: string;
  full_name: string;
  email: string;
  registration_status: RecoveryStatus;
  source: string;
  registered_at: string;
  last_synced_at: string;
  created_at: string;
}

const FIELD_LIST = [
  "id",
  "external_user_id",
  "full_name",
  "email",
  "registration_status",
  "source",
  "registered_at",
  "last_synced_at",
  "created_at",
].join(", ");

const STATUS_OPTIONS: Array<{ value: RecoveryStatus; label: string }> = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "ACTIVE_CASE", label: "Active case" },
  { value: "CLOSED", label: "Closed" },
];

const statusClasses: Record<RecoveryStatus, string> = {
  NEW: "border-orange-300/25 bg-orange-300/10 text-orange-200",
  CONTACTED: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  IN_REVIEW: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  ACTIVE_CASE: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  CLOSED: "border-white/10 bg-white/5 text-aura-platinum/45",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RecoveryOperations() {
  const [rows, setRows] = useState<RecoveryRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from("recovery_registrations")
        .select(FIELD_LIST)
        .order("registered_at", { ascending: false })
        .limit(250);
      if (dbError) throw dbError;
      setRows((data ?? []) as unknown as RecoveryRegistration[]);
    } catch (loadError) {
      console.error("[RecoveryOperations] Unable to load registrations", loadError);
      setRows([]);
      setError("Recovery registrations are unavailable. Check the Recovery database migration and access policy.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "ALL" && row.registration_status !== status) return false;
      if (!normalizedQuery) return true;
      return `${row.full_name} ${row.email}`.toLowerCase().includes(normalizedQuery);
    });
  }, [query, rows, status]);

  const metrics = useMemo(() => ({
    total: rows.length,
    fresh: rows.filter((row) => row.registration_status === "NEW").length,
    reviewing: rows.filter((row) => row.registration_status === "IN_REVIEW").length,
    active: rows.filter((row) => row.registration_status === "ACTIVE_CASE").length,
  }), [rows]);

  const updateStatus = async (row: RecoveryRegistration, nextStatus: RecoveryStatus) => {
    if (row.registration_status === nextStatus) return;
    setSavingId(row.id);
    try {
      const { error: dbError } = await supabase
        .from("recovery_registrations")
        .update({ registration_status: nextStatus })
        .eq("id", row.id);
      if (dbError) throw dbError;
      setRows((current) => current.map((item) => (
        item.id === row.id ? { ...item, registration_status: nextStatus } : item
      )));
      toast.success("Recovery status updated");
    } catch (updateError) {
      console.error("[RecoveryOperations] Unable to update status", updateError);
      toast.error("Unable to update Recovery status");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-orange-300/15 bg-[linear-gradient(125deg,rgba(194,79,33,0.14),rgba(12,12,16,0.72)_42%,rgba(212,175,55,0.06))] p-6 shadow-[0_24px_70px_-42px_rgba(234,88,12,0.75)]">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-orange-200/10 bg-orange-400/[0.04] blur-sm" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.32em] text-orange-200/65">Separate service queue</p>
            <h2 className="flex items-center gap-3 font-serif text-3xl font-light italic tracking-tight text-aura-platinum">
              <HeartHandshake className="text-orange-300" size={28} /> Recovery Operations
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-aura-platinum/48">
              Registrations from BHRecover only. Trade accounts, balances and trading leads remain isolated.
            </p>
          </div>
          <Button variant="secondary" onClick={load} isLoading={loading}>
            {!loading && <RefreshCw className="h-3.5 w-3.5" />} Refresh queue
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Recovery registration metrics">
        {[
          { label: "Registrations", value: metrics.total, icon: HeartHandshake },
          { label: "New", value: metrics.fresh, icon: Clock3 },
          { label: "In review", value: metrics.reviewing, icon: ShieldCheck },
          { label: "Active cases", value: metrics.active, icon: UserRoundCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-glass-border bg-black/25 p-4 shadow-card backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-aura-platinum/35">{label}</span>
              <Icon className="h-4 w-4 text-orange-300/70" />
            </div>
            <div className="mt-3 font-mono text-2xl text-aura-platinum">{value}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-glass-border bg-black/20 p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-platinum/30" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Recovery name or email"
            className="w-full rounded-lg border border-glass-border bg-black/30 py-2.5 pl-9 pr-3 text-xs text-aura-platinum outline-none transition-colors focus:border-orange-300/40"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-xs text-aura-platinum outline-none focus:border-orange-300/40"
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-aura-ruby/25 bg-aura-ruby/5 p-4 text-sm text-aura-ruby">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-glass-border glass-card">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-aura-platinum/40">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-orange-300" /> Loading Recovery queue
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <HeartHandshake className="mx-auto mb-4 h-8 w-8 text-orange-300/35" />
            <p className="font-serif text-xl italic text-aura-platinum/65">No Recovery registrations found</p>
            <p className="mt-2 text-xs text-aura-platinum/35">New accounts will appear here after server synchronization.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-glass-border bg-black/25 text-[10px] uppercase tracking-widest text-aura-platinum/40">
                <tr>
                  <th className="px-5 py-3">Recovery client</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3">Last sync</th>
                  <th className="px-5 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-orange-200/[0.025]">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-aura-platinum">{row.full_name}</div>
                      <div className="mt-1 text-[10px] text-aura-platinum/40">{row.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${statusClasses[row.registration_status]}`}>
                          {STATUS_OPTIONS.find((item) => item.value === row.registration_status)?.label}
                        </span>
                        <select
                          value={row.registration_status}
                          disabled={savingId === row.id}
                          onChange={(event) => void updateStatus(row, event.target.value as RecoveryStatus)}
                          aria-label={`Update status for ${row.full_name}`}
                          className="max-w-6 cursor-pointer border-0 bg-transparent text-transparent outline-none disabled:cursor-wait"
                        >
                          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[10px] text-aura-platinum/48">{formatDate(row.registered_at)}</td>
                    <td className="px-5 py-4 font-mono text-[10px] text-aura-platinum/48">{formatDate(row.last_synced_at)}</td>
                    <td className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-orange-200/60">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
