import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Shield, Database, Settings, Search,
  Edit2, Lock, Plus, Trash2, RefreshCw, KeyRound,
  Loader2, AlertCircle, CheckCircle2, ChevronDown,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useI18n } from "../lib/i18n";
import { supabase } from "../../trading/lib/supabase";
import { aiStatus } from "../../../lib/ai/aiClient";
import { AI_MODEL_OPTIONS, AI_PRIMARY_MODEL } from "../../../lib/ai/aiConfig";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Worker {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  role: "agent" | "manager" | "director" | "admin";
  kyc_status: string;
  created_at: string;
}

const ROLES = ["agent", "manager", "director", "admin"] as const;
const ROLE_COLORS: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  admin:    "danger",
  director: "warning",
  manager:  "info",
  agent:    "default",
};

// ── API helpers ────────────────────────────────────────────────────────────────

async function apiFetchWorkers(): Promise<Worker[]> {
  // Read CRM workers directly via Supabase (RLS lets admin/manager read users).
  // Avoids depending on the serverless API for the read path (counts/table).
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, display_name, role, kyc_status, created_at, updated_at")
    .in("role", ["agent", "manager", "director", "admin"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Worker[];
}

// Privileged worker operations (create/delete/reset) run in the Supabase
// Edge Function "crm-workers" (uses service_role, enforces admin role).
async function invokeWorkerFn(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("crm-workers", { body: payload });
  if (error) {
    let msg = error.message;
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) msg = body.error;
    } catch { /* ignore */ }
    throw new Error(msg || "Request failed");
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

async function apiCreateWorker(body: { email: string; password: string; full_name: string; role: string }) {
  await invokeWorkerFn({ action: "create", ...body });
}

// Role / name change is RLS-permitted for admins → done directly via Supabase.
async function apiUpdateWorker(id: string, body: { role?: string; full_name?: string }) {
  const updates: Record<string, string> = {};
  if (body.role) updates.role = body.role;
  if (body.full_name !== undefined) {
    updates.full_name = body.full_name;
    updates.display_name = body.full_name;
  }
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("users").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
  }
}

async function apiDeleteWorker(id: string) {
  await invokeWorkerFn({ action: "delete", id });
}

async function apiResetPassword(id: string, password: string) {
  await invokeWorkerFn({ action: "reset-password", id, password });
}

// ── Main Component ────────────────────────────────────────────────────────────

type ToastType = "success" | "error";
interface Toast { id: number; msg: string; type: ToastType }

export function AdminPanel() {
  const { t } = useI18n();

  const [workers, setWorkers]       = useState<Worker[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [toasts, setToasts]         = useState<Toast[]>([]);

  const [createOpen, setCreateOpen]       = useState(false);
  const [editTarget, setEditTarget]       = useState<Worker | null>(null);
  const [resetTarget, setResetTarget]     = useState<Worker | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Worker | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  const [newEmail, setNewEmail]       = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName]         = useState("");
  const [newRole, setNewRole]         = useState("agent");

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");

  const [newPw, setNewPw]             = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");

  const [aiOnline,  setAiOnline]  = useState<boolean | null>(null);
  const [aiModel,   setAiModel]   = useState("deepseek/deepseek-chat");
  const [aiKey,     setAiKey]     = useState("");
  const [aiSaving,  setAiSaving]  = useState(false);
  const [aiSaved,   setAiSaved]   = useState(false);

  // Cheap-but-quality OpenRouter models.
  const CRM_FREE_MODELS = [
    { value: "deepseek/deepseek-chat",                    label: "DeepSeek Chat — very cheap & strong (recommended)" },
    { value: "openai/gpt-4o-mini",                        label: "OpenAI GPT-4o mini — cheap & strong" },
    { value: "meta-llama/llama-3.3-70b-instruct",         label: "Llama 3.3 70B — cheap, open" },
    { value: "mistralai/mistral-small-24b-instruct-2501", label: "Mistral Small 24B — cheapest" },
  ];

  const refreshAiStatus = useCallback(async () => {
    try {
      const { data } = await supabase.rpc("ai_settings_status");
      if (data && typeof data === "object") {
        setAiOnline(!!(data as any).configured);
        if ((data as any).model) setAiModel((data as any).model);
        return;
      }
    } catch { /* fall through */ }
    try { const d = await aiStatus(); setAiOnline(d.configured); } catch { setAiOnline(false); }
  }, []);

  useEffect(() => { refreshAiStatus(); }, [refreshAiStatus]);

  const saveAiModel = async () => {
    setAiSaving(true);
    try {
      const payload: Record<string, unknown> = { id: 1, model: aiModel };
      if (aiKey.trim()) payload.openrouter_api_key = aiKey.trim();
      const { error } = await supabase.from("ai_settings").upsert(payload, { onConflict: "id" });
      if (error) throw new Error(error.message);
      setAiKey("");
      setAiSaved(true);
      showToast("AI provider settings saved");
      await refreshAiStatus();
      setTimeout(() => setAiSaved(false), 2500);
    } catch (e: any) {
      showToast(e?.message || "Failed to save AI settings", "error");
    } finally {
      setAiSaving(false);
    }
  };

  const showToast = (msg: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setWorkers(await apiFetchWorkers());
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = workers.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !q || w.email.toLowerCase().includes(q) || (w.full_name || "").toLowerCase().includes(q);
    const matchRole   = roleFilter === "all" || w.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = workers.reduce((acc, w) => {
    acc[w.role] = (acc[w.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setFormError(null);
    try {
      await apiCreateWorker({ email: newEmail, password: newPassword, full_name: newName, role: newRole });
      showToast(`Worker ${newEmail} created`);
      setCreateOpen(false);
      setNewEmail(""); setNewPassword(""); setNewName(""); setNewRole("agent");
      await load();
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setFormLoading(true); setFormError(null);
    try {
      await apiUpdateWorker(editTarget.id, { role: editRole, full_name: editName });
      showToast("Worker updated");
      setEditTarget(null);
      await load();
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPw !== newPwConfirm) { setFormError("Passwords do not match"); return; }
    setFormLoading(true); setFormError(null);
    try {
      await apiResetPassword(resetTarget.id, newPw);
      showToast("Password reset successfully");
      setResetTarget(null); setNewPw(""); setNewPwConfirm("");
    } catch (err: any) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setFormLoading(true);
    try {
      await apiDeleteWorker(deleteTarget.id);
      showToast(`${deleteTarget.email} removed`);
      setDeleteTarget(null);
      await load();
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setFormLoading(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-12 relative">

      {/* Toast stack */}
      <div className="fixed top-5 right-5 z-[100] space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`flex items-center gap-2 px-4 py-3 rounded border text-xs font-medium shadow-lg pointer-events-auto ${
                t.type === "success"
                  ? "bg-aura-emerald/10 border-aura-emerald/30 text-aura-emerald"
                  : "bg-aura-ruby/10 border-aura-ruby/30 text-aura-ruby"
              }`}
            >
              {t.type === "success"
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                : <AlertCircle  className="w-3.5 h-3.5 shrink-0" />}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="border-b border-glass-border pb-4">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">
          {t('adminTitle')}
        </h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">
          {t('adminSubtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { icon: Users,    label: "Total Workers",       value: workers.length,                                    color: "text-aura-gold" },
          { icon: Shield,   label: "Admins / Directors",  value: (roleCounts.admin || 0) + (roleCounts.director || 0), color: "text-aura-ruby" },
          { icon: Database, label: "Managers",            value: roleCounts.manager || 0,                           color: "text-blue-400" },
          { icon: Settings, label: "Agents",              value: roleCounts.agent   || 0,                           color: "text-aura-platinum/60" },
        ] as const).map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-glass-border glass-card p-5 text-center">
            <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
            <div className="text-xl font-light text-aura-platinum">{loading ? "—" : value}</div>
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Workers table */}
      <div className="rounded-xl border border-glass-border glass-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-glass-border">
          <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">CRM Workers</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
              <input
                type="text" placeholder="Search..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-black/40 border border-glass-border rounded pl-9 pr-4 py-1.5 text-xs text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors w-40"
              />
            </div>
            <div className="relative">
              <select
                value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="bg-black/40 border border-glass-border rounded px-3 py-1.5 text-[10px] text-aura-platinum uppercase tracking-widest outline-none focus:border-aura-gold/50 appearance-none pr-7 cursor-pointer"
              >
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-aura-platinum/40 pointer-events-none" />
            </div>
            <button
              onClick={load} disabled={loading}
              className="p-1.5 rounded border border-glass-border hover:border-aura-gold/30 hover:bg-white/5 text-aura-platinum/50 hover:text-aura-gold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Button variant="primary" size="sm" onClick={() => { setFormError(null); setCreateOpen(true); }}>
              <Plus className="w-3 h-3" /> Add Worker
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-[9px] font-bold tracking-[0.2em] text-aura-platinum/40 uppercase border-b border-glass-border">
                <th className="px-5 py-3">Name / Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Added</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-aura-gold/50 mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-aura-platinum/30 text-xs">
                  {search || roleFilter !== "all" ? "No workers match your filter" : "No CRM workers yet — click «Add Worker» to create one"}
                </td></tr>
              ) : filtered.map(worker => (
                <tr key={worker.id} className="border-b border-glass-border/50 hover:bg-white/[0.03] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="text-sm text-aura-platinum font-medium">{worker.full_name || worker.display_name || "—"}</div>
                    <div className="text-[10px] text-aura-platinum/40 font-mono mt-0.5">{worker.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={ROLE_COLORS[worker.role] || "default"}>{worker.role}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-[10px] text-aura-platinum/40 font-mono">
                    {new Date(worker.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button title="Edit" onClick={() => { setEditTarget(worker); setEditName(worker.full_name || ""); setEditRole(worker.role); setFormError(null); }}
                        className="p-1.5 rounded hover:bg-white/10 text-aura-platinum/50 hover:text-aura-gold transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button title="Reset password" onClick={() => { setResetTarget(worker); setNewPw(""); setNewPwConfirm(""); setFormError(null); }}
                        className="p-1.5 rounded hover:bg-white/10 text-aura-platinum/50 hover:text-blue-400 transition-colors">
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button title="Delete" onClick={() => setDeleteTarget(worker)}
                        className="p-1.5 rounded hover:bg-aura-ruby/10 text-aura-platinum/50 hover:text-aura-ruby transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE MODAL ─────────────────────────────────────────────────────── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New CRM Worker" subtitle="Account will be immediately active">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <FormError msg={formError} />}
          <FormField label="Full Name">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Mira Sable" className={inputCls} />
          </FormField>
          <FormField label="Email *">
            <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="mira@company.com" className={inputCls} />
          </FormField>
          <FormField label="Password *">
            <input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 characters" className={inputCls} />
          </FormField>
          <FormField label="Role *">
            <RoleSelect value={newRole} onChange={setNewRole} />
          </FormField>
          <ModalFooter onCancel={() => setCreateOpen(false)} loading={formLoading} submitLabel="Create Worker" />
        </form>
      </Modal>

      {/* ── EDIT MODAL ───────────────────────────────────────────────────────── */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Worker" subtitle={editTarget?.email}>
        <form onSubmit={handleEdit} className="space-y-4">
          {formError && <FormError msg={formError} />}
          <FormField label="Full Name">
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
          </FormField>
          <FormField label="Role">
            <RoleSelect value={editRole} onChange={setEditRole} />
          </FormField>
          <ModalFooter onCancel={() => setEditTarget(null)} loading={formLoading} submitLabel="Save Changes" />
        </form>
      </Modal>

      {/* ── RESET PASSWORD MODAL ─────────────────────────────────────────────── */}
      <Modal isOpen={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password" subtitle={resetTarget?.email}>
        <form onSubmit={handleResetPw} className="space-y-4">
          {formError && <FormError msg={formError} />}
          <FormField label="New Password">
            <input type="password" required minLength={8} value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Min 8 characters" className={inputCls} />
          </FormField>
          <FormField label="Confirm Password">
            <input type="password" required value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)}
              placeholder="Repeat password" className={inputCls} />
          </FormField>
          <ModalFooter onCancel={() => setResetTarget(null)} loading={formLoading} submitLabel="Reset Password"
            submitIcon={<Lock className="w-3 h-3" />} />
        </form>
      </Modal>

      {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────────────── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Worker" subtitle="This action cannot be undone">
        <div className="space-y-5">
          <div className="p-4 rounded bg-aura-ruby/5 border border-aura-ruby/20">
            <p className="text-sm text-aura-platinum/80">
              Permanently delete{" "}
              <span className="text-aura-ruby font-medium">{deleteTarget?.full_name || deleteTarget?.email}</span>?
            </p>
            <p className="text-[10px] text-aura-platinum/40 mt-1.5 font-mono">{deleteTarget?.email}</p>
          </div>
          <div className="pt-2 border-t border-glass-border flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" isLoading={formLoading} onClick={handleDelete}>
              <Trash2 className="w-3 h-3" /> Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── AI Core Insights — API Key Configuration ── */}
      <div className="rounded-2xl border border-glass-border glass-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-aura-gold/10 border border-aura-gold/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-aura-gold" />
          </div>
          <h3 className="text-sm font-bold text-aura-platinum uppercase tracking-widest">AI Core Insights — API Settings</h3>
          <div className={`ml-auto w-2 h-2 rounded-full transition-colors ${aiOnline === null ? "bg-aura-platinum/20 animate-pulse" : aiOnline ? "bg-aura-emerald" : "bg-rose-500/60"}`} />
        </div>
        <p className="text-[11px] text-aura-platinum/40 mb-5 leading-relaxed pl-11">
          Powers all AI features (Client Summary, Lead Scoring, Next Best Action, Communication Analysis) via OpenRouter.
          Paste your OpenRouter API key below — it is stored server-side and never shown back to the browser.
        </p>
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-glass-border">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${aiOnline === null ? "bg-aura-platinum/30 animate-pulse" : aiOnline ? "bg-aura-emerald" : "bg-rose-500/60"}`} />
            <span className="text-[11px] text-aura-platinum/70">
              {aiOnline === null ? "Checking…" : aiOnline ? `OpenRouter active · ${aiModel}` : "No OpenRouter key set — paste one below"}
            </span>
            {aiOnline && <CheckCircle2 className="w-3.5 h-3.5 text-aura-emerald ml-auto flex-shrink-0" />}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-1.5">OpenRouter API Key</label>
            <input
              type="password"
              value={aiKey}
              onChange={e => setAiKey(e.target.value)}
              placeholder={aiOnline ? "•••••••• (leave blank to keep current key)" : "sk-or-v1-..."}
              autoComplete="off"
              className="w-full bg-black/40 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors"
            />
            <p className="text-[10px] text-aura-platinum/30 mt-1">Used by every AI feature. Stored server-side, never returned to the browser.</p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-1.5">Model</label>
            <div className="relative">
              <select value={aiModel} onChange={e => setAiModel(e.target.value)} className="w-full bg-black/40 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none pr-8 cursor-pointer">
                {AI_MODEL_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-aura-platinum/40 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={saveAiModel}
            disabled={aiSaving || aiSaved}
            className="px-6 py-2.5 rounded-lg bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black font-bold border border-aura-gold/30 hover:border-aura-gold transition-all text-xs uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
          >
            {aiSaved
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>
              : aiSaving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              : <><KeyRound className="w-3.5 h-3.5" /> Save AI Settings</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-black/40 border border-glass-border rounded px-4 py-2.5 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors placeholder:text-aura-platinum/20";

function FormError({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded bg-aura-ruby/5 border border-aura-ruby/20 text-xs text-aura-ruby">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
        {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-aura-platinum/40 pointer-events-none" />
    </div>
  );
}

function ModalFooter({
  onCancel, loading, submitLabel, submitIcon,
}: { onCancel: () => void; loading: boolean; submitLabel: string; submitIcon?: React.ReactNode }) {
  return (
    <div className="pt-3 border-t border-glass-border flex justify-end gap-2">
      <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
      <Button variant="primary" type="submit" isLoading={loading}>
        {submitIcon}{submitLabel}
      </Button>
    </div>
  );
}
