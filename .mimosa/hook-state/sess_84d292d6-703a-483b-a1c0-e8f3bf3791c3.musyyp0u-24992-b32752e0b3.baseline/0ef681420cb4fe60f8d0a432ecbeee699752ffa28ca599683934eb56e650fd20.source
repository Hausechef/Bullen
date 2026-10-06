import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Loader2, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../lib/supabase/browserClient";
import { Button } from "../components/ui/Button";

type KycStatus = "PENDING" | "VERIFIED" | "REJECTED" | "UNVERIFIED" | "ALL";

interface KycClient {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  kyc_status: string;
  created_at: string;
  updated_at: string;
}

const FIELD_LIST = "id, email, full_name, username, display_name, avatar_url, role, kyc_status, created_at, updated_at";

export function KYCReview() {
  const [status, setStatus] = useState<KycStatus>("PENDING");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<KycClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let req = supabase
        .from("users")
        .select(FIELD_LIST)
        .eq("role", "client")
        .order("created_at", { ascending: false })
        .limit(50);

      if (status !== "ALL") req = req.eq("kyc_status", status);
      const search = query.trim();
      if (search.length >= 2) {
        const safe = search.replace(/[%(),]/g, "");
        req = req.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%,username.ilike.%${safe}%,display_name.ilike.%${safe}%`);
      }

      const { data, error: dbError } = await req;
      if (dbError) throw dbError;
      setRows((data ?? []) as KycClient[]);
    } catch (e) {
      console.error("[KYCReview] Unable to load KYC clients", e);
      setRows([]);
      setError("Unable to load KYC clients");
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    const timer = window.setTimeout(load, query.trim().length === 1 ? 0 : 300);
    return () => window.clearTimeout(timer);
  }, [load, query]);

  const emptyText = status === "PENDING" ? "No pending KYC clients" : "No KYC clients found";
  const pendingCount = useMemo(() => rows.filter(r => r.kyc_status === "PENDING").length, [rows]);

  const updateStatus = async (id: string, next: "VERIFIED" | "REJECTED") => {
    try {
      const { error: dbError } = await supabase.from("users").update({ kyc_status: next }).eq("id", id);
      if (dbError) throw dbError;
      toast.success(`KYC ${next.toLowerCase()}`);
      await load();
    } catch (e) {
      console.error("[KYCReview] Unable to update KYC status", e);
      toast.error("Unable to update KYC status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-glass-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum flex items-center gap-3">
            <ShieldCheck className="text-aura-gold" size={22} /> KYC Review
          </h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">
            Compliance queue {status === "PENDING" && pendingCount > 0 ? `- ${pendingCount} pending loaded` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-platinum/30" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search clients"
              className="w-full rounded-lg border border-glass-border bg-black/30 py-2 pl-9 pr-3 text-xs text-aura-platinum outline-none focus:border-aura-gold/40 sm:w-64"
            />
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as KycStatus)}
            className="rounded-lg border border-glass-border bg-black/30 px-3 py-2 text-xs text-aura-platinum outline-none focus:border-aura-gold/40"
          >
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="UNVERIFIED">Unverified</option>
            <option value="ALL">All</option>
          </select>
          <Button variant="secondary" onClick={load} isLoading={loading}>
            {!loading && <RefreshCw className="h-3.5 w-3.5" />} Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-aura-ruby/25 bg-aura-ruby/5 p-4 text-sm text-aura-ruby">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-glass-border glass-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-aura-platinum/40">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-aura-gold" /> Loading KYC clients
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-aura-platinum/40">{emptyText}</div>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-glass-border glass-card text-[10px] uppercase tracking-widest text-aura-platinum/40">
              <tr>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-aura-platinum">{row.full_name || row.display_name || row.email}</div>
                    <div className="mt-0.5 text-[10px] text-aura-platinum/40">{row.email}</div>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-aura-gold">{row.kyc_status}</td>
                  <td className="px-5 py-4 text-xs text-aura-platinum/50">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={row.kyc_status === "VERIFIED"} onClick={() => updateStatus(row.id, "VERIFIED")}>
                        <Check className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="danger" disabled={row.kyc_status === "REJECTED"} onClick={() => updateStatus(row.id, "REJECTED")}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
