import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, PhoneMissed, X, Minimize2, Maximize2, Delete, Clock, User, Sparkles, Loader2, AlertTriangle, Copy, CheckCheck, Bot, Send, LogOut, CheckCircle2 } from "lucide-react";
import { supabase } from "../../../lib/supabase/browserClient";
import { logCall, updateCallLog } from "../hooks/useCallLogs";
import { generateCallBrief, CALL_GOALS, type CallGoal, type CallBrief } from "../lib/callCopilot";
import {
  generateNextScenarioStep, createScenarioSession, appendScenarioTurns, closeScenarioSession,
  CALL_OBJECTIVES, SCENARIO_STAGES, type CallObjective, type ScenarioStage, type ScenarioTurn, type ScenarioOutcome,
} from "../lib/callScenario";

// ── Types ────────────────────────────────────────────────────────────────────

type CallState = 'idle' | 'dialing' | 'ringing' | 'active' | 'ended';

interface RecentCall {
  id: string;
  phone: string;
  name?: string;
  status: string;
  duration: number;
  at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function fmtPhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

const DIALPAD = [
  ['1', ''],  ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'],['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'],['8', 'TUV'],['9', 'WXYZ'],
  ['*', ''],  ['0', '+'],   ['#', ''],
] as const;

const OUTCOME_META: Record<ScenarioOutcome, { label: string; color: string }> = {
  deposit_interest:   { label: 'Deposit interest', color: 'text-aura-emerald border-aura-emerald/30 bg-aura-emerald/10' },
  callback_requested: { label: 'Callback requested', color: 'text-aura-gold border-aura-gold/30 bg-aura-gold/10' },
  no_interest:        { label: 'No interest', color: 'text-aura-platinum/60 border-glass-border bg-white/5' },
  opted_out:          { label: 'Opted out — do not call again', color: 'text-aura-ruby border-aura-ruby/30 bg-aura-ruby/10' },
  escalated:          { label: 'Escalated to specialist', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
};

// Status colour map
const statusColor: Record<string, string> = {
  completed: 'text-aura-emerald',
  answered:  'text-aura-emerald',
  no_answer: 'text-aura-warning',
  busy:      'text-aura-warning',
  failed:    'text-aura-ruby',
  initiated: 'text-aura-platinum/50',
  ringing:   'text-aura-platinum/50',
};

// ── Component ────────────────────────────────────────────────────────────────

interface PhoneDialerProps {
  /** Pre-fill number + client info (from client cards) */
  prefill?: { phone: string; name?: string; clientId?: string } | null;
  onClearPrefill?: () => void;
}

export function PhoneDialer({ prefill, onClearPrefill }: PhoneDialerProps) {
  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab]             = useState<'dialpad' | 'recent' | 'copilot' | 'scenario'>('dialpad');

  const [briefGoal, setBriefGoal]       = useState<CallGoal>('cold_call');
  const [briefContext, setBriefContext] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError]     = useState<string | null>(null);
  const [brief, setBrief]               = useState<CallBrief | null>(null);
  const [copied, setCopied]             = useState(false);

  // AI Scenario (multi-turn planning, up to the point of telephony connection —
  // see TelephonySettings, no provider is wired up, so the agent relays every line)
  const [scenarioObjective, setScenarioObjective] = useState<CallObjective>('deposit_push');
  const [scenarioSessionId, setScenarioSessionId] = useState<string | null>(null);
  const [scenarioTranscript, setScenarioTranscript] = useState<ScenarioTurn[]>([]);
  const [scenarioStage, setScenarioStage] = useState<ScenarioStage>('opening');
  const [scenarioReply, setScenarioReply] = useState('');
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [scenarioDone, setScenarioDone] = useState(false);
  const [scenarioOutcome, setScenarioOutcome] = useState<ScenarioOutcome | null>(null);

  const [number, setNumber]       = useState('');
  const [callState, setCallState] = useState<CallState>('idle');
  const [elapsed, setElapsed]     = useState(0);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string | null>(null);

  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef  = useRef<number>(0);

  // Apply prefill when a client card triggers a call
  useEffect(() => {
    if (prefill) {
      setNumber(prefill.phone);
      setCurrentClientId(prefill.clientId ?? null);
      setCurrentName(prefill.name ?? null);
      setOpen(true);
      setMinimized(false);
      setTab('dialpad');
      setBrief(null);
      setBriefError(null);
      setBriefContext('');
      setScenarioSessionId(null);
      setScenarioTranscript([]);
      setScenarioStage('opening');
      setScenarioReply('');
      setScenarioError(null);
      setScenarioDone(false);
      setScenarioOutcome(null);
    }
  }, [prefill]);

  const handleGenerateBrief = async () => {
    setBriefLoading(true);
    setBriefError(null);
    try {
      const result = await generateCallBrief({ clientName: currentName, goal: briefGoal, context: briefContext });
      setBrief(result);
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : 'Could not generate a call brief.');
    } finally {
      setBriefLoading(false);
    }
  };

  const copyBrief = () => {
    if (!brief) return;
    const text = [
      `Opening: ${brief.opening}`,
      brief.discoveryQuestions.length ? `\nQuestions:\n${brief.discoveryQuestions.map(q => `- ${q}`).join('\n')}` : '',
      brief.keyPoints.length ? `\nKey points:\n${brief.keyPoints.map(p => `- ${p}`).join('\n')}` : '',
      brief.anticipatedObjections.length ? `\nObjections:\n${brief.anticipatedObjections.map(o => `- "${o.objection}" -> ${o.response}`).join('\n')}` : '',
      `\nRisk reminder: ${brief.riskReminder}`,
      `\nSoft close: ${brief.softClose}`,
    ].join('\n');
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startScenario = async () => {
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      const session = await createScenarioSession({
        leadId: currentClientId,
        callLogId: currentCallId,
        objective: scenarioObjective,
      });
      const step = await generateNextScenarioStep({ objective: scenarioObjective, clientName: currentName, transcript: [] });
      const turns: ScenarioTurn[] = [{ speaker: 'ai', text: step.aiLine, stage: step.stage, at: new Date().toISOString() }];
      setScenarioSessionId(session?.id ?? null);
      setScenarioTranscript(turns);
      setScenarioStage(step.stage);
      setScenarioDone(step.done);
      setScenarioOutcome(step.outcome);
      if (session?.id) await appendScenarioTurns(session.id, turns, step.stage);
      if (session?.id && step.done) await closeScenarioSession(session.id, step.outcome === 'opted_out' ? 'opted_out' : 'completed', step.outcome);
    } catch (err) {
      setScenarioError(err instanceof Error ? err.message : 'Could not start the scenario.');
    } finally {
      setScenarioLoading(false);
    }
  };

  const continueScenario = async () => {
    if (!scenarioReply.trim()) return;
    setScenarioLoading(true);
    setScenarioError(null);
    try {
      const withReply: ScenarioTurn[] = [
        ...scenarioTranscript,
        { speaker: 'client', text: scenarioReply.trim(), stage: scenarioStage, at: new Date().toISOString() },
      ];
      const step = await generateNextScenarioStep({ objective: scenarioObjective, clientName: currentName, transcript: withReply });
      const nextTurns: ScenarioTurn[] = [...withReply, { speaker: 'ai', text: step.aiLine, stage: step.stage, at: new Date().toISOString() }];
      setScenarioTranscript(nextTurns);
      setScenarioStage(step.stage);
      setScenarioDone(step.done);
      setScenarioOutcome(step.outcome);
      setScenarioReply('');
      if (scenarioSessionId) {
        await appendScenarioTurns(scenarioSessionId, nextTurns, step.stage);
        if (step.done) await closeScenarioSession(scenarioSessionId, step.outcome === 'opted_out' ? 'opted_out' : 'completed', step.outcome);
      }
    } catch (err) {
      setScenarioError(err instanceof Error ? err.message : 'Could not continue the scenario.');
    } finally {
      setScenarioLoading(false);
    }
  };

  const optOutScenario = async () => {
    setScenarioStage('outcome');
    setScenarioDone(true);
    setScenarioOutcome('opted_out');
    if (scenarioSessionId) await closeScenarioSession(scenarioSessionId, 'opted_out', 'opted_out');
  };

  const resetScenario = () => {
    setScenarioSessionId(null);
    setScenarioTranscript([]);
    setScenarioStage('opening');
    setScenarioReply('');
    setScenarioError(null);
    setScenarioDone(false);
    setScenarioOutcome(null);
  };

  // Load recent calls when tab switches
  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    const { data } = await supabase
      .from('call_logs')
      .select('id, phone_number, status, duration_seconds, created_at, client:users!call_logs_client_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(30);
    setRecentCalls(
      (data ?? []).map((r: any) => ({
        id: r.id,
        phone: r.phone_number,
        name: r.client?.full_name ?? undefined,
        status: r.status,
        duration: r.duration_seconds,
        at: r.created_at,
      }))
    );
    setLoadingRecent(false);
  }, []);

  useEffect(() => {
    if (tab === 'recent' && open) loadRecent();
  }, [tab, open, loadRecent]);

  // Timer
  useEffect(() => {
    if (callState === 'active') {
      startRef.current = Date.now() - elapsed * 1000;
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // Dialpad press
  const press = (digit: string) => {
    if (callState !== 'idle') return;
    setNumber(prev => (prev.length < 16 ? prev + digit : prev));
  };

  const backspace = () => {
    if (callState !== 'idle') return;
    setNumber(prev => prev.slice(0, -1));
  };

  // Initiate call
  const startCall = async () => {
    const phone = number.replace(/\D/g, '');
    if (!phone || callState !== 'idle') return;

    setCallState('dialing');
    setElapsed(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCallState('idle'); return; }

    const entry = await logCall({
      agentId:     user.id,
      clientId:    currentClientId,
      phoneNumber: phone,
      direction:   'outbound',
      status:      'initiated',
    });
    setCurrentCallId(entry?.id ?? null);

    // Simulate ringing → active (replace with real provider SDK later)
    setTimeout(() => setCallState('ringing'), 800);
    setTimeout(() => {
      setCallState('active');
      if (entry?.id) updateCallLog(entry.id, { status: 'answered' });
    }, 3000);
  };

  // End call
  const endCall = async () => {
    if (currentCallId) {
      const finalStatus = callState === 'ringing' ? 'no_answer' : 'completed';
      await updateCallLog(currentCallId, { status: finalStatus, duration_seconds: elapsed });
    }
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setElapsed(0);
      setCurrentCallId(null);
    }, 1500);
  };

  // Click-to-call from recent
  const redial = (phone: string) => {
    setNumber(phone);
    setTab('dialpad');
  };

  const handleClose = () => {
    if (callState === 'active' || callState === 'ringing' || callState === 'dialing') return;
    setOpen(false);
    setNumber('');
    setCurrentClientId(null);
    setCurrentName(null);
    onClearPrefill?.();
  };

  // ── Floating button ───────────────────────────────────────────────────────

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open dialer"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-aura-emerald shadow-[0_0_24px_rgba(16,185,129,0.5)] hover:shadow-[0_0_32px_rgba(16,185,129,0.7)] flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        <Phone className="w-6 h-6 text-black" />
      </button>
    );
  }

  // ── Minimized pill ────────────────────────────────────────────────────────

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 glass-card border-aura-emerald/40 rounded-full px-4 py-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer" onClick={() => setMinimized(false)}>
        <span className={`w-2 h-2 rounded-full ${callState === 'active' ? 'bg-aura-emerald animate-pulse' : 'bg-aura-platinum/30'}`} />
        <span className="text-xs font-mono text-aura-platinum">
          {callState === 'active' ? fmtDuration(elapsed) : (number ? fmtPhone(number) : 'Dialer')}
        </span>
        <Maximize2 className="w-3.5 h-3.5 text-aura-platinum/50" />
      </div>
    );
  }

  // ── Full dialer panel ─────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[320px] rounded-2xl border border-glass-border glass-card shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border bg-black/30">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-aura-gold" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-aura-platinum">Phone</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(true)} className="p-1.5 rounded hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors">
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleClose} disabled={callState === 'active' || callState === 'ringing' || callState === 'dialing'} className="p-1.5 rounded hover:bg-white/5 text-aura-platinum/40 hover:text-aura-platinum transition-colors disabled:opacity-30">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-glass-border">
        {(['dialpad', 'recent', 'copilot', 'scenario'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${
              tab === t ? 'text-aura-gold border-b-2 border-aura-gold -mb-px bg-aura-gold/5' : 'text-aura-platinum/40 hover:text-aura-platinum'
            }`}
          >
            {t === 'copilot' && <Sparkles className="w-2.5 h-2.5" />}
            {t === 'scenario' && <Bot className="w-2.5 h-2.5" />}
            {t === 'dialpad' ? 'Dialpad' : t === 'recent' ? 'History' : t === 'copilot' ? 'AI Brief' : 'Scenario'}
          </button>
        ))}
      </div>

      {tab === 'dialpad' && (
        <div className="p-4 space-y-4">

          {/* Active call status bar */}
          {callState !== 'idle' && callState !== 'ended' && (
            <div className={`rounded-lg px-3 py-2 text-center text-[11px] font-mono border ${
              callState === 'active'  ? 'border-aura-emerald/30 bg-aura-emerald/10 text-aura-emerald' :
              callState === 'ringing' ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400' :
              'border-glass-border glass-card text-aura-platinum/50'
            }`}>
              {callState === 'dialing'  && '⬤ Dialing…'}
              {callState === 'ringing'  && '⬤ Ringing…'}
              {callState === 'active'   && `⬤ ${fmtDuration(elapsed)}`}
            </div>
          )}
          {callState === 'ended' && (
            <div className="rounded-lg px-3 py-2 text-center text-[11px] font-mono border border-glass-border glass-card text-aura-platinum/40">
              Call ended
            </div>
          )}

          {/* Client name tag */}
          {currentName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aura-gold/10 border border-aura-gold/20">
              <User className="w-3 h-3 text-aura-gold" />
              <span className="text-[11px] text-aura-gold truncate">{currentName}</span>
            </div>
          )}

          {/* Number display */}
          <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-center">
              <span className="text-xl font-mono tracking-widest text-aura-platinum">
                {number ? fmtPhone(number) : <span className="text-aura-platinum/20">Enter number</span>}
              </span>
            </div>
            {number && callState === 'idle' && (
              <button onClick={backspace} className="p-2 text-aura-platinum/40 hover:text-aura-platinum transition-colors">
                <Delete className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dialpad grid */}
          <div className="grid grid-cols-3 gap-2">
            {DIALPAD.map(([digit, sub]) => (
              <button
                key={digit}
                onMouseDown={() => press(digit)}
                disabled={callState !== 'idle'}
                className="flex flex-col items-center justify-center h-12 rounded-xl border border-glass-border glass-card hover:bg-white/5 hover:border-aura-gold/20 active:bg-aura-gold/10 transition-all disabled:opacity-40 select-none"
              >
                <span className="text-sm font-medium text-aura-platinum leading-none">{digit}</span>
                {sub && <span className="text-[7px] text-aura-platinum/30 tracking-widest mt-0.5">{sub}</span>}
              </button>
            ))}
          </div>

          {/* Call / End button */}
          <div className="flex justify-center pt-1">
            {callState === 'idle' || callState === 'ended' ? (
              <button
                onClick={startCall}
                disabled={!number || callState === 'ended'}
                className="h-14 w-14 rounded-full bg-aura-emerald hover:bg-aura-emerald/90 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_28px_rgba(16,185,129,0.6)] flex items-center justify-center transition-all disabled:opacity-30 disabled:shadow-none"
              >
                <Phone className="w-6 h-6 text-black" />
              </button>
            ) : (
              <button
                onClick={endCall}
                className="h-14 w-14 rounded-full bg-aura-ruby hover:bg-aura-ruby/90 shadow-[0_0_20px_rgba(251,113,133,0.4)] flex items-center justify-center transition-all animate-pulse"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'recent' && (
        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
          {loadingRecent ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-xs text-aura-platinum/30 animate-pulse">Loading…</span>
            </div>
          ) : recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <PhoneMissed className="w-8 h-8 text-aura-platinum/10" />
              <span className="text-xs text-aura-platinum/30">No call history yet</span>
            </div>
          ) : (
            <div className="divide-y divide-glass-border">
              {recentCalls.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 group transition-colors">
                  <div className={`shrink-0 ${statusColor[c.status] ?? 'text-aura-platinum/30'}`}>
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-aura-platinum truncate">
                      {c.name ?? fmtPhone(c.phone)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-aura-platinum/30 font-mono">{fmtPhone(c.phone)}</span>
                      {c.duration > 0 && (
                        <>
                          <span className="text-aura-platinum/20">·</span>
                          <span className="text-[9px] text-aura-platinum/30 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{fmtDuration(c.duration)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-[8px] text-aura-platinum/20 mt-0.5">
                      {new Date(c.at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => redial(c.phone)}
                    title="Redial"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-aura-emerald/10 text-aura-emerald hover:bg-aura-emerald/20 transition-all"
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'copilot' && (
        <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
          <p className="text-[9px] text-aura-platinum/40 leading-relaxed">
            Generates talking points for YOU to use on your own call. It never contacts the client and never guarantees any outcome — always state risk clearly and let the client decide.
          </p>

          {currentName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aura-gold/10 border border-aura-gold/20">
              <User className="w-3 h-3 text-aura-gold" />
              <span className="text-[11px] text-aura-gold truncate">{currentName}</span>
            </div>
          )}

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-aura-platinum/50 mb-1 block">Call Type</label>
            <select
              value={briefGoal}
              onChange={e => setBriefGoal(e.target.value as CallGoal)}
              className="w-full rounded-lg border border-glass-border bg-black/30 px-2.5 py-2 text-[11px] text-aura-platinum focus:border-aura-gold/40 focus:outline-none"
            >
              {CALL_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-aura-platinum/50 mb-1 block">Context (optional)</label>
            <textarea
              value={briefContext}
              onChange={e => setBriefContext(e.target.value)}
              rows={2}
              placeholder="e.g. Client asked about KYC status last time; wants to know minimum deposit"
              className="w-full rounded-lg border border-glass-border bg-black/30 px-2.5 py-2 text-[11px] text-aura-platinum placeholder:text-aura-platinum/20 focus:border-aura-gold/40 focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={handleGenerateBrief}
            disabled={briefLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black border border-aura-gold/30 hover:border-aura-gold font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {briefLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {briefLoading ? 'Generating…' : brief ? 'Regenerate Brief' : 'Generate Call Brief'}
          </button>

          {briefError && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-aura-ruby/10 border border-aura-ruby/20 text-aura-ruby text-[10px]">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {briefError}
            </div>
          )}

          {brief && (
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-aura-gold/70 mb-1">Opening</p>
                <p className="text-[11px] text-aura-platinum/80 leading-relaxed">{brief.opening}</p>
              </div>

              {brief.discoveryQuestions.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-aura-gold/70 mb-1">Ask</p>
                  <ul className="space-y-1">
                    {brief.discoveryQuestions.map((q, i) => (
                      <li key={i} className="text-[11px] text-aura-platinum/80 leading-relaxed">• {q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {brief.keyPoints.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-aura-gold/70 mb-1">Key Points</p>
                  <ul className="space-y-1">
                    {brief.keyPoints.map((p, i) => (
                      <li key={i} className="text-[11px] text-aura-platinum/80 leading-relaxed">• {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {brief.anticipatedObjections.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-aura-gold/70 mb-1">If They Say…</p>
                  <div className="space-y-2">
                    {brief.anticipatedObjections.map((o, i) => (
                      <div key={i} className="rounded-lg bg-black/30 border border-glass-border p-2">
                        <p className="text-[10px] text-aura-platinum/50 italic">"{o.objection}"</p>
                        <p className="text-[11px] text-aura-platinum/80 mt-1">{o.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2 flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-400 leading-relaxed">{brief.riskReminder}</p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-aura-gold/70 mb-1">Soft Close</p>
                <p className="text-[11px] text-aura-platinum/80 leading-relaxed">{brief.softClose}</p>
              </div>

              <button
                onClick={copyBrief}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-glass-border text-aura-platinum/60 hover:text-aura-platinum hover:border-aura-gold/30 text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                {copied ? <CheckCheck className="w-3 h-3 text-aura-emerald" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Brief'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'scenario' && (
        <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
          <p className="text-[9px] text-aura-platinum/40 leading-relaxed">
            Plans the call turn by turn. No telephony provider is connected (see Telephony Settings) — YOU place the call, read each suggested line, and type back what the client actually said.
          </p>

          {currentName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aura-gold/10 border border-aura-gold/20">
              <User className="w-3 h-3 text-aura-gold" />
              <span className="text-[11px] text-aura-gold truncate">{currentName}</span>
            </div>
          )}

          {scenarioTranscript.length === 0 ? (
            <>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-aura-platinum/50 mb-1 block">Objective</label>
                <select
                  value={scenarioObjective}
                  onChange={e => setScenarioObjective(e.target.value as CallObjective)}
                  className="w-full rounded-lg border border-glass-border bg-black/30 px-2.5 py-2 text-[11px] text-aura-platinum focus:border-aura-gold/40 focus:outline-none"
                >
                  {CALL_OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <p className="text-[9px] text-aura-platinum/30 mt-1">{CALL_OBJECTIVES.find(o => o.value === scenarioObjective)?.description}</p>
              </div>
              <button
                onClick={startScenario}
                disabled={scenarioLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black border border-aura-gold/30 hover:border-aura-gold font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {scenarioLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                {scenarioLoading ? 'Starting…' : 'Start Scenario'}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] uppercase tracking-widest text-aura-platinum/40">
                  {CALL_OBJECTIVES.find(o => o.value === scenarioObjective)?.label}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-aura-gold/70">
                  {SCENARIO_STAGES.find(s => s.value === scenarioStage)?.label}
                </span>
              </div>

              <div className="space-y-2">
                {scenarioTranscript.map((turn, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-2 text-[11px] leading-relaxed border ${
                      turn.speaker === 'ai'
                        ? 'bg-aura-gold/10 border-aura-gold/20 text-aura-platinum/90'
                        : 'bg-black/30 border-glass-border text-aura-platinum/60 ml-3'
                    }`}
                  >
                    <span className="block text-[8px] font-bold uppercase tracking-widest mb-0.5 opacity-50">
                      {turn.speaker === 'ai' ? 'Say' : 'Client said'}
                    </span>
                    {turn.text}
                  </div>
                ))}
              </div>

              {scenarioError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-aura-ruby/10 border border-aura-ruby/20 text-aura-ruby text-[10px]">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {scenarioError}
                </div>
              )}

              {scenarioDone ? (
                <>
                  {scenarioOutcome && (
                    <div className={`rounded-lg px-3 py-2 border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${OUTCOME_META[scenarioOutcome].color}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> {OUTCOME_META[scenarioOutcome].label}
                    </div>
                  )}
                  <button
                    onClick={resetScenario}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-glass-border text-aura-platinum/60 hover:text-aura-platinum hover:border-aura-gold/30 text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    <Bot className="w-3 h-3" /> New Scenario
                  </button>
                </>
              ) : (
                <>
                  <textarea
                    value={scenarioReply}
                    onChange={e => setScenarioReply(e.target.value)}
                    rows={2}
                    placeholder="What did the client just say?"
                    className="w-full rounded-lg border border-glass-border bg-black/30 px-2.5 py-2 text-[11px] text-aura-platinum placeholder:text-aura-platinum/20 focus:border-aura-gold/40 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={continueScenario}
                      disabled={scenarioLoading || !scenarioReply.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-aura-gold/10 hover:bg-aura-gold text-aura-gold hover:text-black border border-aura-gold/30 hover:border-aura-gold font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {scenarioLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Continue
                    </button>
                    <button
                      onClick={optOutScenario}
                      title="Client asked to stop being contacted"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-aura-ruby/30 text-aura-ruby hover:bg-aura-ruby/10 text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      <LogOut className="w-3 h-3" /> Opt-out
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
