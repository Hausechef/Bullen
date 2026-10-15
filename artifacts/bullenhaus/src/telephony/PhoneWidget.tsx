// Compact global phone widget — survives route changes.
// Shows state, active call and controls.
import { useEffect, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Pause, Play, Grid3x3, X } from 'lucide-react';
import { useTelephony } from './callStore';
import type { TelephonyState } from './types';
import { PhoneAudioNotice } from './PhoneAudioNotice';

const STATE_LABEL: Record<TelephonyState, string> = {
  OFFLINE: 'Offline',
  CONNECTING: 'Connecting…',
  REGISTERING: 'Registering…',
  READY: 'Ready',
  DIALING: 'Dialing…',
  RINGING: 'Ringing…',
  INCOMING: 'Eingehender Anruf',
  CONNECTED: 'Connected',
  HOLD: 'On hold',
  ENDING: 'Ending…',
  ENDED: 'Ended',
  BUSY: 'Busy',
  NO_ANSWER: 'No answer',
  FAILED: 'Failed',
};

const STATE_COLOR: Record<TelephonyState, string> = {
  OFFLINE: 'text-white/40',
  CONNECTING: 'text-yellow-400',
  REGISTERING: 'text-yellow-400',
  READY: 'text-emerald-400',
  DIALING: 'text-blue-400',
  RINGING: 'text-blue-400',
  INCOMING: 'text-emerald-400',
  CONNECTED: 'text-emerald-400',
  HOLD: 'text-yellow-400',
  ENDING: 'text-yellow-400',
  ENDED: 'text-white/60',
  BUSY: 'text-orange-400',
  NO_ANSWER: 'text-orange-400',
  FAILED: 'text-red-400',
};

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PhoneWidget() {
  const state = useTelephony((s) => s.state);
  const call = useTelephony((s) => s.activeCall);
  const error = useTelephony((s) => s.error);
  const micPerm = useTelephony((s) => s.micPermission);
  const audio = useTelephony((s) => s.audioDiagnostics);
  const hangup = useTelephony((s) => s.hangup);
  const answer = useTelephony((s) => s.answer);
  const reject = useTelephony((s) => s.reject);
  const mute = useTelephony((s) => s.mute);
  const unmute = useTelephony((s) => s.unmute);
  const hold = useTelephony((s) => s.hold);
  const resume = useTelephony((s) => s.resume);
  const dtmf = useTelephony((s) => s.dtmf);
  const [elapsed, setElapsed] = useState(0);
  const [showDtmf, setShowDtmf] = useState(false);
  const [minimized, setMinimized] = useState(true);

  useEffect(() => {
    if (state !== 'CONNECTED' || !call?.answeredAt) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - (call.answeredAt ?? call.startedAt)) / 1000)), 1000);
    return () => clearInterval(id);
  }, [state, call]);

  if (state === 'OFFLINE' && !error) return null;

  const inCall = state === 'CONNECTED' || state === 'HOLD' || state === 'DIALING' || state === 'RINGING';

  return (
    <div data-telephony-widget className="fixed bottom-4 right-4 z-[9999] w-72 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Phone size={14} className={STATE_COLOR[state]} />
          <span className={`text-xs font-medium ${STATE_COLOR[state]}`}>{STATE_LABEL[state]}</span>
        </div>
        <button onClick={() => setMinimized((m) => !m)} className="text-white/40 hover:text-white/80">
          {minimized ? <Grid3x3 size={14} /> : <X size={14} />}
        </button>
      </div>

      {/* Error / mic denied */}
      <PhoneAudioNotice />
      {state === 'INCOMING' && call && <div className="px-4 py-3" role="alert"><p className="text-sm text-white">{call.remoteName || call.remoteNumber}</p><p className="text-xs text-white/60">{call.remoteNumber}</p><div className="flex gap-2 mt-2"><button onClick={answer} className="px-3 py-2 rounded bg-emerald-700 text-white">Annehmen</button><button onClick={reject} className="px-3 py-2 rounded bg-red-700 text-white">Ablehnen</button></div></div>}
      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10">{error}</div>
      )}
      {micPerm === 'DENIED' && (
        <div className="px-4 py-2 text-xs text-orange-400 bg-orange-500/10">Microphone access denied. Check browser permissions.</div>
      )}

      {/* Active call */}
      {call && inCall && !minimized && (
        <div className="px-4 py-3 space-y-3">
          <div>
            <div className="text-sm text-white font-medium truncate">{call.remoteName || call.remoteNumber}</div>
            <div className="text-xs text-white/50">{call.remoteNumber}</div>
          </div>
          {state === 'CONNECTED' && (
            <div className="text-2xl font-mono text-emerald-400">{fmtDuration(elapsed)}</div>
          )}
          {(state === 'CONNECTED' || state === 'HOLD') && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/70" aria-label="Audio diagnostics">
              <div className="mb-1 flex items-center justify-between">
                <span>Микрофон</span>
                <span className={audio.microphoneTrackLive && audio.microphoneLevel > 0.01 ? 'text-emerald-400' : 'text-amber-300'}>
                  {audio.microphoneTrackLive && audio.microphoneLevel > 0.01 ? 'сигнал есть' : 'скажите что-нибудь'}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.round(Math.min(1, audio.microphoneLevel) * 100)}%` }} /></div>
              <div className="mt-2 flex items-center justify-between">
                <span>Входящий звук</span>
                <span className={audio.inboundAudioPackets > 0 && audio.remoteTrackLive ? 'text-emerald-400' : 'text-amber-300'}>
                  {audio.inboundAudioPackets > 0 && audio.remoteTrackLive ? 'пакеты идут' : 'ожидание'}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-sky-400 transition-all" style={{ width: `${Math.round(Math.min(1, audio.remoteLevel) * 100)}%` }} /></div>
              <div className="mt-2 text-white/40">RTP: ↑ {audio.outboundAudioPackets} / ↓ {audio.inboundAudioPackets}</div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {call.muted ? (
              <button onClick={unmute} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-orange-400" title="Unmute"><MicOff size={16} /></button>
            ) : (
              <button onClick={mute} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title="Mute"><Mic size={16} /></button>
            )}
            {state === 'HOLD' ? (
              <button onClick={resume} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400" title="Resume"><Play size={16} /></button>
            ) : (
              <button onClick={hold} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title="Hold"><Pause size={16} /></button>
            )}
            <button onClick={() => setShowDtmf((v) => !v)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title="DTMF">123</button>
            <button onClick={hangup} className="ml-auto p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400" title="Hangup"><PhoneOff size={16} /></button>
          </div>
          {showDtmf && (
            <div className="grid grid-cols-3 gap-1">
              {['1','2','3','4','5','6','7','8','9','*','0','#'].map((d) => (
                <button key={d} onClick={() => dtmf(d)} className="py-1.5 rounded bg-white/5 hover:bg-white/10 text-sm text-white/80">{d}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Minimized active call */}
      {call && inCall && minimized && (
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="text-xs text-white/70 truncate">{call.remoteName || call.remoteNumber}</div>
          <button onClick={hangup} className="p-1.5 rounded-lg bg-red-500/20 text-red-400"><PhoneOff size={14} /></button>
        </div>
      )}
    </div>
  );
}
