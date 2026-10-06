import { useState, useEffect, useCallback } from "react";
import {
  Phone, Plus, Trash2, UserCheck, Loader2, AlertCircle, CheckCircle2,
  RefreshCw, Wifi, WifiOff, Settings, Link, Unlink, PhoneCall
} from "lucide-react";
import { supabase } from "../../../lib/supabase/browserClient";
import { Button } from "../components/ui/Button";
import { useI18n } from "../lib/i18n";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TelephonyNumber {
  id: string;
  phone_number: string;
  label: string | null;
  provider: string;
  assigned_agent_id: string | null;
  is_active: boolean;
  created_at: string;
  agent?: { full_name: string | null; email: string } | null;
}

interface Agent {
  id: string;
  full_name: string | null;
  email: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function agentDisplayName(a: { full_name?: string | null; email: string }) {
  return a.full_name?.trim() || a.email.split('@')[0];
}

// ── Add Number Modal ──────────────────────────────────────────────────────────

function AddNumberModal({ agents, onClose, onAdded }: {
  agents: Agent[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const { t } = useI18n();
  const [number, setNumber]   = useState('');
  const [label, setLabel]     = useState('');
  const [provider, setProvider] = useState('manual');
  const [agentId, setAgentId] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const save = async () => {
    if (!number.trim()) { setError(t('telPhoneRequired')); return; }
    setSaving(true);
    setError(null);
    const { error: dbErr } = await supabase.from('telephony_numbers').insert({
      phone_number:      number.trim(),
      label:             label.trim() || null,
      provider,
      assigned_agent_id: agentId || null,
      is_active:         true,
    });
    if (dbErr) { setError(dbErr.message); setSaving(false); return; }
    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 glass-card border-glass-border rounded-2xl p-6 shadow-2xl">
        <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-aura-platinum mb-5">{t('telModalTitle')}</h3>

        {error && <div className="mb-4 p-3 rounded-lg bg-aura-ruby/10 border border-aura-ruby/30 text-aura-ruby text-xs flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="text-[9px] uppercase tracking-widest text-aura-platinum/40 block mb-1.5">{t('telPhoneLabel')}</label>
            <input value={number} onChange={e => setNumber(e.target.value)}
              placeholder="+1 555 000 0000"
              className="w-full bg-black/40 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-aura-platinum font-mono outline-none focus:border-aura-gold/40 transition-colors" />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-aura-platinum/40 block mb-1.5">{t('telLabelOptional')}</label>
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Sales Line 1"
              className="w-full bg-black/40 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-aura-platinum outline-none focus:border-aura-gold/40 transition-colors" />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-aura-platinum/40 block mb-1.5">{t('telProvider')}</label>
            <select value={provider} onChange={e => setProvider(e.target.value)}
              className="w-full bg-black/40 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-aura-platinum outline-none focus:border-aura-gold/40 transition-colors">
              <option value="manual">Manual</option>
              <option value="twilio">Twilio</option>
              <option value="telnyx">Telnyx</option>
              <option value="vonage">Vonage</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-aura-platinum/40 block mb-1.5">{t('telAssignAgent')}</label>
            <select value={agentId} onChange={e => setAgentId(e.target.value)}
              className="w-full bg-black/40 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-aura-platinum outline-none focus:border-aura-gold/40 transition-colors">
              <option value="">{t('telUnassigned')}</option>
              {agents.map(a => <option key={a.id} value={a.id}>{agentDisplayName(a)}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">{t('cancel')}</Button>
          <Button variant="outline" onClick={save} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('telAddNumber')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TelephonySettings() {
  const { t } = useI18n();
  const [numbers, setNumbers]     = useState<TelephonyNumber[]>([]);
  const [agents, setAgents]       = useState<Agent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [numRes, agentRes] = await Promise.all([
        supabase.from('telephony_numbers')
          .select('*, agent:users!telephony_numbers_assigned_agent_id_fkey(full_name, email)')
          .order('created_at', { ascending: false }),
        supabase.from('users').select('id, full_name, email').eq('role', 'agent').order('full_name'),
      ]);
      if (numRes.error) throw new Error(numRes.error.message);
      if (agentRes.error) throw new Error(agentRes.error.message);
      setNumbers((numRes.data ?? []) as TelephonyNumber[]);
      setAgents((agentRes.data ?? []) as Agent[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reassign = async (numberId: string, agentId: string | null) => {
    setReassigning(numberId);
    const { error: err } = await supabase.from('telephony_numbers')
      .update({ assigned_agent_id: agentId || null, updated_at: new Date().toISOString() })
      .eq('id', numberId);
    if (!err) {
      await load();
      showSuccess(agentId ? t('telNumberAssigned') : t('telNumberUnassigned'));
    }
    setReassigning(null);
  };

  const deleteNumber = async (id: string) => {
    setDeleting(id);
    await supabase.from('telephony_numbers').delete().eq('id', id);
    await load();
    setDeleting(null);
    showSuccess(t('telNumberRemoved'));
  };

  const toggleActive = async (num: TelephonyNumber) => {
    await supabase.from('telephony_numbers').update({ is_active: !num.is_active }).eq('id', num.id);
    await load();
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="border-b border-glass-border pb-4">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('telTitle')}</h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('telSubtitle')}</p>
      </div>

      {/* Provider connection cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'Twilio',  logo: '📞', status: t('telNotConnected'), color: 'text-aura-ruby/70',    border: 'border-glass-border' },
          { name: 'Telnyx',  logo: '🔗', status: t('telNotConnected'), color: 'text-aura-ruby/70',    border: 'border-glass-border' },
          { name: 'Vonage',  logo: '📡', status: t('telNotConnected'), color: 'text-aura-ruby/70',    border: 'border-glass-border' },
        ].map(p => (
          <div key={p.name} className={`rounded-xl border ${p.border} glass-card p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{p.logo}</span>
                <span className="text-sm font-bold text-aura-platinum">{p.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 text-aura-ruby/50" />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${p.color}`}>{p.status}</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full text-[10px]">
              <Settings className="w-3 h-3" /> {t('telConfigure')}
            </Button>
          </div>
        ))}
      </div>

      {/* Numbers management */}
      <div className="rounded-xl border border-glass-border glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <PhoneCall className="w-4 h-4 text-aura-gold" />
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-aura-platinum">{t('telPhoneNumbers')}</span>
            <span className="text-[10px] bg-aura-gold/20 text-aura-gold px-2 py-0.5 rounded-full font-bold">{numbers.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {successMsg && (
              <span className="text-[10px] text-aura-emerald flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />{successMsg}
              </span>
            )}
            <button onClick={load} disabled={loading} className="p-2 rounded-lg hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors disabled:opacity-30">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="w-3.5 h-3.5" /> {t('telAddNumber')}
            </Button>
          </div>
        </div>

        {error && <div className="p-4 text-aura-ruby text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-aura-gold animate-spin" /></div>
        ) : numbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Phone className="w-10 h-10 text-aura-platinum/10" />
            <p className="text-sm text-aura-platinum/30">{t('telNoNumbersYet')}</p>
            <p className="text-xs text-aura-platinum/20">{t('telNoNumbersDesc')}</p>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="w-3.5 h-3.5" /> {t('telAddFirstNumber')}
            </Button>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_80px] gap-4 px-6 py-2.5 border-b border-glass-border glass-card">
              {[t('telColNumber'), t('telColLabel'), t('telColAssigned'), t('status'), t('telColActions')].map(h => (
                <div key={h} className="text-[9px] font-bold uppercase tracking-[0.2em] text-aura-platinum/30">{h}</div>
              ))}
            </div>
            <div className="divide-y divide-glass-border">
              {numbers.map(num => (
                <div key={num.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_80px] gap-4 px-6 py-4 items-center hover:bg-white/2 transition-colors">

                  {/* Number */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-aura-platinum/40 shrink-0" />
                    <div>
                      <div className="text-xs font-mono text-aura-platinum">{num.phone_number}</div>
                      <div className="text-[9px] text-aura-platinum/30 uppercase tracking-wider">{num.provider}</div>
                    </div>
                  </div>

                  {/* Label */}
                  <div className="text-xs text-aura-platinum/50 truncate">{num.label || '—'}</div>

                  {/* Agent assignment */}
                  <div>
                    {reassigning === num.id ? (
                      <Loader2 className="w-4 h-4 text-aura-gold animate-spin" />
                    ) : (
                      <select
                        value={num.assigned_agent_id ?? ''}
                        onChange={e => reassign(num.id, e.target.value || null)}
                        className="bg-black/60 border border-glass-border text-aura-platinum text-[10px] rounded-lg px-2 py-1.5 outline-none focus:border-aura-gold/50 w-full max-w-[160px]"
                      >
                        <option value="">{t('telUnassigned')}</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{agentDisplayName(a)}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <button onClick={() => toggleActive(num)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-colors ${
                        num.is_active
                          ? 'border-aura-emerald/30 bg-aura-emerald/10 text-aura-emerald'
                          : 'border-glass-border bg-white/5 text-aura-platinum/40'
                      }`}>
                      {num.is_active ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                      {num.is_active ? t('telActive') : t('telInactive')}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {num.assigned_agent_id && (
                      <button onClick={() => reassign(num.id, null)} title="Unassign"
                        className="p-1.5 rounded-lg hover:bg-yellow-400/10 text-aura-platinum/30 hover:text-yellow-400 transition-colors">
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNumber(num.id)}
                      disabled={deleting === num.id}
                      title="Delete number"
                      className="p-1.5 rounded-lg hover:bg-aura-ruby/10 text-aura-platinum/30 hover:text-aura-ruby transition-colors disabled:opacity-30"
                    >
                      {deleting === num.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showAdd && <AddNumberModal agents={agents} onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}
