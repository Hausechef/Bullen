import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { FileUp, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase/browserClient';
import { useAuth } from '../trading/contexts/AuthContext';
import './RecoveryClientPortal.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 6;
const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp',
  'text/plain', 'text/csv', 'application/json',
]);

const CATEGORIES = [
  ['CRYPTO', 'Crypto asset fraud'],
  ['FOREX_CFD', 'Forex / CFD'],
  ['INVESTMENT_FRAUD', 'Investment fraud'],
  ['CARD_PHISHING', 'Card or phishing'],
  ['ROMANCE', 'Romance scam'],
  ['OTHER', 'Other'],
] as const;

const LOSS_RANGES = ['Under $1,000', '$1,000–$5,000', '$5,000–$25,000', '$25,000–$100,000', 'Over $100,000'] as const;

type RecoveryCase = {
  id: string;
  case_number: string;
  category: string;
  status: string;
  loss_range: string;
  created_at: string;
  updated_at: string;
};

type ClientTimelineEvent = { id: string; title: string; body: string | null; created_at: string };
type ClientMessage = { id: string; sender_id: string; body: string; created_at: string };
type ClientEvidence = { id: string; file_name: string; object_path: string; created_at: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function filePath(userId: string, caseId: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120) || 'evidence';
  return `${userId}/${caseId}/${crypto.randomUUID()}-${safeName}`;
}

function getGlassSurface(target: EventTarget | null) {
  return target instanceof Element
    ? target.closest<HTMLElement>('button, form, aside, .recovery-client__hero, form > div.rounded-xl, aside div.rounded-xl, aside div.rounded-lg')
    : null;
}

export function RecoveryClientPortal() {
  const { user } = useAuth();
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ClientTimelineEvent[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [evidence, setEvidence] = useState<ClientEvidence[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    category: 'CRYPTO', lossRange: '', incidentDate: '', platform: '', assetType: '',
    transactionRef: '', walletAddress: '', contactEmail: user?.email ?? '', description: '',
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const updateGlassSurface = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const surface = getGlassSurface(event.target);
    if (!surface) return;
    const bounds = surface.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    surface.style.setProperty('--recovery-tilt-x', `${(0.5 - y) * 4}deg`);
    surface.style.setProperty('--recovery-tilt-y', `${(x - 0.5) * 5}deg`);
    surface.style.setProperty('--recovery-light-x', `${x * 100}%`);
    surface.style.setProperty('--recovery-light-y', `${y * 100}%`);
  };

  const resetGlassSurface = (event: PointerEvent<HTMLElement>) => {
    const surface = getGlassSurface(event.target);
    if (!surface || surface.contains(event.relatedTarget as Node | null)) return;
    surface.style.setProperty('--recovery-tilt-x', '0deg');
    surface.style.setProperty('--recovery-tilt-y', '0deg');
    surface.style.setProperty('--recovery-light-x', '50%');
    surface.style.setProperty('--recovery-light-y', '0%');
  };

  const canSubmit = useMemo(() => (
    Boolean(user && form.lossRange && form.description.trim().length >= 50 && form.description.trim().length <= 5000)
  ), [form.description, form.lossRange, user]);

  const loadCases = useCallback(async () => {
    setLoadingCases(true);
    if (!user) {
      setCases([]);
      setLoadingCases(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('recovery_cases')
        .select('id, case_number, category, status, loss_range, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setCases((data ?? []) as RecoveryCase[]);
    } catch (error) {
      console.error('[RecoveryClientPortal] Unable to load cases', error);
      toast.error('Unable to load your Recovery cases.');
    } finally {
      setLoadingCases(false);
    }
  }, [user]);

  useEffect(() => { void loadCases(); }, [loadCases]);
  useEffect(() => { if (user?.email) setForm((current) => ({ ...current, contactEmail: current.contactEmail || user.email || '' })); }, [user?.email]);

  const loadCaseDetail = useCallback(async (caseId: string) => {
    setLoadingDetail(true);
    try {
      const [timelineResult, messagesResult, evidenceResult] = await Promise.all([
        supabase.from('recovery_case_timeline').select('id, title, body, created_at').eq('case_id', caseId).order('created_at', { ascending: false }),
        supabase.from('recovery_case_messages').select('id, sender_id, body, created_at').eq('case_id', caseId).order('created_at', { ascending: true }),
        supabase.from('recovery_case_evidence').select('id, file_name, object_path, created_at').eq('case_id', caseId).order('created_at', { ascending: false }),
      ]);
      if (timelineResult.error) throw timelineResult.error;
      if (messagesResult.error) throw messagesResult.error;
      if (evidenceResult.error) throw evidenceResult.error;
      setTimeline((timelineResult.data ?? []) as ClientTimelineEvent[]);
      setMessages((messagesResult.data ?? []) as ClientMessage[]);
      setEvidence((evidenceResult.data ?? []) as ClientEvidence[]);
    } catch (error) {
      console.error('[RecoveryClientPortal] Unable to load case detail', error);
      toast.error('Unable to load case updates.');
    } finally { setLoadingDetail(false); }
  }, []);

  useEffect(() => { if (selectedCaseId) void loadCaseDetail(selectedCaseId); }, [loadCaseDetail, selectedCaseId]);

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files];
    for (const file of Array.from(picked)) {
      if (next.length >= MAX_FILES) { toast.error(`You can attach up to ${MAX_FILES} files.`); break; }
      if (file.size === 0 || file.size > MAX_FILE_SIZE) { toast.error(`${file.name} must be between 1 byte and 10 MB.`); continue; }
      if (!ACCEPTED_MIME_TYPES.has(file.type)) { toast.error(`${file.name} is not an accepted evidence type.`); continue; }
      next.push(file);
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !canSubmit) return;
    setSubmitting(true);
    try {
      const { data: created, error: caseError } = await supabase
        .from('recovery_cases')
        .insert({
          client_id: user.id,
          category: form.category,
          loss_range: form.lossRange,
          incident_date: form.incidentDate || null,
          platform: form.platform.trim() || null,
          asset_type: form.assetType.trim() || null,
          transaction_ref: form.transactionRef.trim() || null,
          wallet_address: form.walletAddress.trim() || null,
          contact_email: form.contactEmail.trim().toLowerCase() || null,
          description: form.description.trim(),
        })
        .select('id, case_number')
        .single();
      if (caseError) throw caseError;

      for (const file of files) {
        const objectPath = filePath(user.id, created.id, file);
        const { error: uploadError } = await supabase.storage
          .from('recovery-evidence')
          .upload(objectPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error: evidenceError } = await supabase.from('recovery_case_evidence').insert({
          case_id: created.id,
          uploaded_by_id: user.id,
          object_path: objectPath,
          file_name: file.name.slice(0, 200),
          mime_type: file.type,
          size_bytes: file.size,
        });
        if (evidenceError) {
          await supabase.storage.from('recovery-evidence').remove([objectPath]);
          throw evidenceError;
        }
      }

      toast.success(`Case ${created.case_number} submitted.`);
      setForm({ category: 'CRYPTO', lossRange: '', incidentDate: '', platform: '', assetType: '', transactionRef: '', walletAddress: '', contactEmail: user.email ?? '', description: '' });
      setFiles([]);
      await loadCases();
      setSelectedCaseId(created.id);
    } catch (error) {
      console.error('[RecoveryClientPortal] Unable to submit case', error);
      toast.error('Your case could not be submitted. Please review the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedCaseId || !user || !messageDraft.trim()) return;
    try {
      const { error } = await supabase.from('recovery_case_messages').insert({ case_id: selectedCaseId, sender_id: user.id, body: messageDraft.trim() });
      if (error) throw error;
      setMessageDraft('');
      await loadCaseDetail(selectedCaseId);
    } catch (error) {
      console.error('[RecoveryClientPortal] Unable to send message', error);
      toast.error('Unable to send your message.');
    }
  };

  const openEvidence = async (item: ClientEvidence) => {
    const { data, error } = await supabase.storage.from('recovery-evidence').createSignedUrl(item.object_path, 60);
    if (error || !data?.signedUrl) { toast.error('Unable to open this evidence file.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="recovery-client min-h-dvh bg-[#090a0d] px-4 py-10 text-aura-platinum sm:px-6 lg:px-10" onPointerMove={updateGlassSurface} onPointerOut={resetGlassSurface}>
      <section className="mx-auto max-w-6xl">
        <div className="recovery-client__hero mb-10 rounded-3xl border border-orange-300/15 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.16),transparent_38%),linear-gradient(130deg,rgba(15,15,20,0.96),rgba(7,8,12,0.98))] p-7 shadow-2xl sm:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-orange-200/65">Bullenhaus Recovery</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-light italic tracking-tight sm:text-5xl">Start a private recovery case.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-aura-platinum/55">Describe the incident factually, attach only relevant evidence, and follow the case status here. We never request seed phrases, private keys or banking passwords.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
          <form onSubmit={submit} className="rounded-2xl border border-glass-border bg-black/25 p-5 shadow-card sm:p-7">
            <div className="mb-6 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-orange-300" /><div><h2 className="font-serif text-2xl italic">Case intake</h2><p className="mt-1 text-xs text-aura-platinum/45">Required fields are marked by the submit requirement.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-aura-platinum/65">What happened?<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm text-aura-platinum outline-none focus:border-orange-300/50">{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-xs text-aura-platinum/65">Approximate loss range<select required value={form.lossRange} onChange={(e) => setForm({ ...form, lossRange: e.target.value })} className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm text-aura-platinum outline-none focus:border-orange-300/50"><option value="">Select a range</option>{LOSS_RANGES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              <label className="text-xs text-aura-platinum/65">Incident date<input type="date" max={new Date().toISOString().slice(0, 10)} value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm text-aura-platinum outline-none focus:border-orange-300/50" /></label>
              <label className="text-xs text-aura-platinum/65">Platform, broker or person<input maxLength={120} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm text-aura-platinum outline-none focus:border-orange-300/50" /></label>
              <label className="text-xs text-aura-platinum/65">Asset or payment method<input maxLength={120} value={form.assetType} onChange={(e) => setForm({ ...form, assetType: e.target.value })} className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm text-aura-platinum outline-none focus:border-orange-300/50" /></label>
              <label className="text-xs text-aura-platinum/65">Contact email<input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm text-aura-platinum outline-none focus:border-orange-300/50" /></label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-xs text-aura-platinum/65">Transaction reference<input maxLength={200} value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm text-aura-platinum outline-none focus:border-orange-300/50" /></label><label className="block text-xs text-aura-platinum/65">Public wallet address<input maxLength={200} value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} placeholder="Never enter a seed phrase or private key" className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm text-aura-platinum outline-none focus:border-orange-300/50" /></label></div>
            <label className="mt-4 block text-xs text-aura-platinum/65">Describe what happened<textarea required minLength={50} maxLength={5000} rows={7} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Include the sequence of events, payments and dates." className="mt-2 w-full resize-y rounded-lg border border-glass-border bg-black/30 px-3 py-2.5 text-sm leading-6 text-aura-platinum outline-none focus:border-orange-300/50" /></label>
            <div className="mt-5 rounded-xl border border-dashed border-orange-200/25 bg-orange-300/[0.03] p-4"><input ref={inputRef} type="file" multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.json" onChange={(e) => addFiles(e.target.files)} /><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 text-xs font-semibold text-orange-200 hover:text-orange-100"><FileUp className="h-4 w-4" /> Attach evidence (up to {MAX_FILES} files, 10 MB each)</button>{files.length > 0 && <ul className="mt-3 space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded bg-black/25 px-3 py-2 text-xs text-aura-platinum/65"><span className="truncate pr-3">{file.name}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} className="text-aura-platinum/40 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button></li>)}</ul>}</div>
            <button type="submit" disabled={!canSubmit || submitting} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-300 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-200 disabled:cursor-not-allowed disabled:opacity-45">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Submit recovery case</button>
          </form>

          <aside className="rounded-2xl border border-glass-border bg-black/25 p-5 shadow-card sm:p-7"><h2 className="font-serif text-2xl italic">Your cases</h2><p className="mt-2 text-xs leading-5 text-aura-platinum/45">Only cases associated with your account appear here.</p><div className="mt-5 space-y-3">{loadingCases ? <div className="flex items-center gap-2 py-8 text-sm text-aura-platinum/45"><Loader2 className="h-4 w-4 animate-spin" /> Loading cases</div> : cases.length === 0 ? <p className="rounded-xl border border-dashed border-glass-border px-4 py-8 text-center text-sm text-aura-platinum/40">No Recovery cases yet.</p> : cases.map((item) => <button key={item.id} onClick={() => setSelectedCaseId(item.id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedCaseId === item.id ? 'border-orange-300/50 bg-orange-300/10' : 'border-glass-border bg-black/20 hover:bg-white/[0.03]'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-orange-200">{item.case_number}</p><p className="mt-1 text-sm text-aura-platinum">{CATEGORIES.find(([value]) => value === item.category)?.[1] ?? item.category}</p></div><span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-2 py-1 text-[9px] font-bold tracking-wider text-orange-100">{item.status.replace('_', ' ')}</span></div><p className="mt-3 text-[11px] text-aura-platinum/40">{item.loss_range} · Updated {formatDate(item.updated_at)}</p></button>)}</div>{selectedCaseId && <div className="mt-6 border-t border-glass-border pt-5">{loadingDetail ? <div className="flex items-center gap-2 py-4 text-xs text-aura-platinum/45"><Loader2 className="h-4 w-4 animate-spin" /> Loading updates</div> : <><p className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/35">Case updates</p><div className="mt-3 space-y-2">{timeline.length === 0 ? <p className="text-xs text-aura-platinum/40">No client updates yet.</p> : timeline.map((event) => <div key={event.id} className="rounded-lg border border-glass-border bg-black/20 p-3"><p className="text-xs text-aura-platinum">{event.title}</p>{event.body && <p className="mt-1 text-[11px] leading-5 text-aura-platinum/55">{event.body}</p>}<p className="mt-2 text-[10px] text-aura-platinum/30">{formatDate(event.created_at)}</p></div>)}</div><p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-aura-platinum/35">Evidence</p><div className="mt-2 space-y-1">{evidence.length === 0 ? <p className="text-xs text-aura-platinum/40">No files attached.</p> : evidence.map((item) => <button key={item.id} onClick={() => void openEvidence(item)} className="block max-w-full truncate text-left text-xs text-orange-200 hover:text-orange-100">{item.file_name}</button>)}</div><p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-aura-platinum/35">Message your specialist</p><textarea value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} maxLength={4000} rows={3} className="mt-2 w-full rounded-lg border border-glass-border bg-black/30 p-2.5 text-xs text-aura-platinum outline-none focus:border-orange-300/50" placeholder="Write a factual update or question." /><button type="button" onClick={() => void sendMessage()} disabled={!messageDraft.trim()} className="mt-2 rounded-lg border border-orange-300/30 px-3 py-2 text-xs font-semibold text-orange-100 hover:bg-orange-300/10 disabled:opacity-40">Send message</button>{messages.length > 0 && <div className="mt-3 space-y-2">{messages.map((message) => <div key={message.id} className={`rounded-lg p-2.5 text-xs ${message.sender_id === user?.id ? 'bg-orange-300/10 text-orange-50' : 'bg-black/25 text-aura-platinum/65'}`}><p>{message.body}</p><p className="mt-1 text-[9px] opacity-55">{formatDate(message.created_at)}</p></div>)}</div>}</>}</div>}</aside>
        </div>
      </section>
    </main>
  );
}
