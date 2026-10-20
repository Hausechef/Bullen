// Deterministic telephony store — single source of truth for call state.
// Uses Zustand. Includes BroadcastChannel leader election to prevent
// multiple SIP registrations across CRM tabs.
import { create } from 'zustand';
import type { TelephonyState, ActiveCall, MicPermission, CallResult, AudioDiagnostics } from './types';
import { SipClient } from './sipClient';
import { requestMicPermission, releaseStream, watchDeviceRemoval } from './media';
import { normalizeOutboundNumber } from './normalize';
import { logCall, updateCallLog } from '../app/crm/hooks/useCallLogs';

interface TelephonyStore {
  state: TelephonyState;
  micPermission: MicPermission;
  isLeader: boolean;
  activeCall: ActiveCall | null;
  error: string | null;
  audioBlocked: boolean;
  audioDiagnostics: AudioDiagnostics;
  setError: (error: string | null) => void;
  resumeAudio: () => void;
  connect: (cfg: { wssUrl: string; sipUser: string; sipPassword: string; sipDomain: string; agentId: string }) => Promise<void>;
  dial: (rawNumber: string, name?: string, clientId?: string | null) => Promise<void>;
  hangup: () => void;
  answer: () => Promise<void>;
  reject: () => void;
  mute: () => void;
  unmute: () => void;
  hold: () => void;
  resume: () => void;
  dtmf: (digit: string) => void;
  disconnect: () => Promise<void>;
}

let sip: SipClient | null = null;
let disconnecting: Promise<void> | null = null;
let leaderChannel: BroadcastChannel | null = null;
let isLeaderTab = false;
let agentIdCache = '';
const endedResults = new Map<number, CallResult>();
let dialAttempt = 0;
let unwatchMic: (() => void) | null = null;
let readyTimer: ReturnType<typeof setTimeout> | null = null;

function clearReadyTimer(): void {
  if (readyTimer) clearTimeout(readyTimer);
  readyTimer = null;
}

function clearMicrophone(): void {
  unwatchMic?.();
  unwatchMic = null;
  releaseStream();
}

// Leader election: first tab to broadcast wins; others stay OFFLINE.
function initLeaderElection(): void {
  if (typeof BroadcastChannel === 'undefined') { isLeaderTab = true; return; }
  leaderChannel = new BroadcastChannel('bullenhaus-telephony');
  isLeaderTab = true;
  leaderChannel.onmessage = (e) => {
    if (e.data?.type === 'CLAIM_LEADER' && isLeaderTab) {
      // Another tab is trying to claim; we re-assert unless they have lower timestamp.
      if (e.data.ts > Date.now()) isLeaderTab = false;
    }
  };
  leaderChannel.postMessage({ type: 'CLAIM_LEADER', ts: Date.now() });
}

export const useTelephony = create<TelephonyStore>((set, get) => ({
  state: 'OFFLINE',
  micPermission: 'PENDING',
  isLeader: false,
  activeCall: null,
  error: null,
  audioBlocked: false,
  audioDiagnostics: {
    microphoneLevel: 0,
    remoteLevel: 0,
    microphoneTrackLive: false,
    remoteTrackLive: false,
    outboundAudioPackets: 0,
    inboundAudioPackets: 0,
    lastUpdatedAt: null,
  },
  setError: (error) => set({ error }),
  resumeAudio: () => { sip?.resumeAudio(); },

  connect: async (cfg) => {
    if (disconnecting) await disconnecting;
    if (sip) return; // already connected
    clearReadyTimer();
    initLeaderElection();
    if (!isLeaderTab) {
      set({ state: 'OFFLINE', error: 'Telephony active in another tab', isLeader: false });
      return;
    }
    agentIdCache = cfg.agentId;
    set({ isLeader: true, error: null });

    // SIP registration does NOT require microphone. Mic is requested only on dial.
    const client = new SipClient(cfg, {
      onState: (s) => {
        if (sip !== client) return;
        set((current) => ({ state: s, ...(s === 'READY' ? { error: null } : {}), activeCall: s === 'CONNECTED' && current.activeCall ? { ...current.activeCall, answeredAt: current.activeCall.answeredAt ?? Date.now() } : current.activeCall }));
      },
      onError: (error) => { if (sip === client) set({ error }); },
      onIncoming: (number, name) => {
        if (sip !== client) return;
        const call: ActiveCall = { direction: 'inbound', remoteNumber: number, remoteName: name, startedAt: Date.now(), muted: false, onHold: false };
        set({ activeCall: call, error: null });
        logCall({ agentId: agentIdCache, phoneNumber: number, direction: 'inbound', status: 'ringing' }).then((log) => {
          if (!log) return;
          if (get().activeCall?.startedAt === call.startedAt) set((current) => ({ activeCall: current.activeCall ? { ...current.activeCall, callLogId: log.id } : null }));
          else {
            const result = endedResults.get(call.startedAt);
            updateCallLog(log.id, { status: result?.status === 'ENDED' ? 'completed' : 'no_answer', duration_seconds: result?.durationSeconds ?? 0 }).catch(() => {});
          }
          endedResults.delete(call.startedAt);
        }).catch(() => {});
      },
      onCallEnded: (result: CallResult) => {
        if (sip !== client) return;
        clearReadyTimer();
        clearMicrophone();
        const call = get().activeCall;
        if (call && !call.callLogId) endedResults.set(call.startedAt, result);
        if (call?.callLogId) {
          updateCallLog(call.callLogId, {
            status: result.status === 'ENDED' ? 'completed' : result.status.toLowerCase() as any,
            duration_seconds: result.durationSeconds,
          }).catch(() => {});
        }
        set({ state: 'ENDED', activeCall: null });
        readyTimer = setTimeout(() => {
          readyTimer = null;
          if (sip === client && !get().activeCall && get().state === 'ENDED') {
            set({ state: client.isRegistered() ? 'READY' : 'OFFLINE' });
          }
        }, 1500);
      },
      onRemoteStream: () => { /* handled in sipClient via remoteAudio */ },
      onPlaybackBlocked: (audioBlocked) => { if (sip === client) set({ audioBlocked }); },
      onAudioTrackState: (kind, live) => { if (sip !== client) return; set((current) => ({
        audioDiagnostics: {
          ...current.audioDiagnostics,
          ...(kind === 'microphone' ? { microphoneTrackLive: live } : { remoteTrackLive: live }),
          lastUpdatedAt: Date.now(),
        },
      })); },
      onAudioLevel: (kind, level) => { if (sip !== client) return; set((current) => ({
        audioDiagnostics: {
          ...current.audioDiagnostics,
          ...(kind === 'microphone' ? { microphoneLevel: level } : { remoteLevel: level }),
          lastUpdatedAt: Date.now(),
        },
      })); },
      onRtpStats: (stats) => { if (sip !== client) return; set((current) => ({
        audioDiagnostics: { ...current.audioDiagnostics, ...stats, lastUpdatedAt: Date.now() },
      })); },
    });
    sip = client;

    try {
      await client.connect();
    } catch (err: any) {
      if (sip === client) set({ state: 'FAILED', error: err?.message ?? 'Connection failed' });
    }
  },

  dial: async (rawNumber, name, clientId) => {
    if (!sip || get().state !== 'READY') { set({ error: 'Phone not ready' }); return; }
    if (!sip.isRegistered()) { set({ state: 'OFFLINE', error: 'SIP connection lost. Reconnecting…' }); return; }
    const client = sip;
    clearReadyTimer();
    const agentId = agentIdCache;
    const attempt = ++dialAttempt;
    client.prepareAudio();
    const trimmed = (rawNumber ?? '').trim();
    // Internal extensions (1-5 digits, no +) bypass external normalization.
    const isInternal = /^\d{1,5}$/.test(trimmed);
    let e164: string;
    if (isInternal) {
      e164 = trimmed;
    } else {
      const norm = normalizeOutboundNumber(trimmed);
      if (!norm.ok) {
        set({ error: 'Use an international country code, for example +374…' });
        return;
      }
      e164 = norm.e164;
    }
    set({ error: null, state: 'DIALING' });

    // Request microphone only when placing a call.
    const { permission, stream } = await requestMicPermission();
    if (sip !== client || attempt !== dialAttempt || get().state !== 'DIALING') return;
    set({ micPermission: permission });
    if (!stream) { set({ error: `Microphone ${permission}`, state: 'READY' }); return; }

    if (get().state !== 'DIALING' || attempt !== dialAttempt) {
      if (!get().activeCall && get().state !== 'DIALING') clearMicrophone();
      return;
    }
    client.setLocalStream(stream);
    set((current) => ({ audioDiagnostics: { ...current.audioDiagnostics, microphoneTrackLive: true, lastUpdatedAt: Date.now() } }));
    unwatchMic?.();
    unwatchMic = watchDeviceRemoval(() => set({ micPermission: 'DEVICE_REMOVED' }));

    if (get().state !== 'DIALING' || attempt !== dialAttempt) return;

    const call: ActiveCall = { direction: 'outbound', remoteNumber: e164, remoteName: name, clientId: clientId ?? null, startedAt: Date.now(), muted: false, onHold: false };
    set({ activeCall: call });
    // A slow CRM database must not prevent sending the SIP INVITE. Preserve
    // the eventual log/result even if the call ends before the insert returns.
    void logCall({
      agentId,
      clientId: clientId ?? null,
      phoneNumber: e164,
      direction: 'outbound',
      status: 'initiated',
    }).then((log) => {
      if (!log) { endedResults.delete(call.startedAt); return; }
      if (sip === client && get().activeCall?.startedAt === call.startedAt) {
        set((current) => ({ activeCall: current.activeCall ? { ...current.activeCall, callLogId: log.id } : null }));
      } else {
        const result = endedResults.get(call.startedAt);
        updateCallLog(log.id, { status: result?.status === 'ENDED' ? 'completed' : (result?.status.toLowerCase() as any) ?? 'no_answer', duration_seconds: result?.durationSeconds ?? 0 }).catch(() => {});
      }
      endedResults.delete(call.startedAt);
    }).catch(() => { endedResults.delete(call.startedAt); });
    try {
      await client.dial(e164);
    } catch (error: any) {
      if (sip !== client || get().activeCall?.startedAt !== call.startedAt) return;
      clearMicrophone();
      const result: CallResult = { status: 'FAILED', durationSeconds: 0 };
      const logId = get().activeCall?.callLogId;
      if (!logId) endedResults.set(call.startedAt, result);
      if (logId) void updateCallLog(logId, { status: 'failed', duration_seconds: 0 }).catch(() => {});
      set({ activeCall: null, state: client.isRegistered() ? 'READY' : 'OFFLINE', error: error?.message || 'Could not start call' });
    }
  },

  hangup: () => {
    dialAttempt++;
    if (get().state === 'DIALING' && !get().activeCall) { clearMicrophone(); set({ state: 'READY' }); }
    sip?.hangup();
  },

  answer: async () => {
    if (!sip || get().state !== 'INCOMING') return;
    const pending = get().activeCall;
    sip.prepareAudio();
    const { permission, stream } = await requestMicPermission();
    set({ micPermission: permission });
    if (get().activeCall?.startedAt !== pending?.startedAt || get().state !== 'INCOMING') return;
    if (!stream) { set({ error: `Microphone ${permission}` }); return; }
    sip.setLocalStream(stream);
    set((current) => ({ audioDiagnostics: { ...current.audioDiagnostics, microphoneTrackLive: true, lastUpdatedAt: Date.now() } }));
    unwatchMic?.();
    unwatchMic = watchDeviceRemoval(() => set({ micPermission: 'DEVICE_REMOVED' }));
    try { await sip.answer(); } catch { set({ error: 'Incoming call could not be answered' }); }
  },
  reject: () => { sip?.reject(); },

  mute: () => { sip?.mute(); set((s) => ({ activeCall: s.activeCall ? { ...s.activeCall, muted: true } : null })); },
  unmute: () => { sip?.unmute(); set((s) => ({ activeCall: s.activeCall ? { ...s.activeCall, muted: false } : null })); },
  hold: () => { sip?.hold(); },
  resume: () => { sip?.resume(); },
  dtmf: (digit) => { sip?.sendDtmf(digit); },

  disconnect: async () => {
    dialAttempt++;
    clearReadyTimer();
    const old = sip;
    sip = null;
    leaderChannel?.close();
    leaderChannel = null;
    isLeaderTab = false;
    agentIdCache = '';
    clearMicrophone();
    set({ state: 'OFFLINE', activeCall: null, isLeader: false, audioBlocked: false });
    if (old) {
      const pending = old.disconnect().catch(() => {});
      disconnecting = pending;
      await pending;
      if (disconnecting === pending) disconnecting = null;
    } else if (disconnecting) {
      await disconnecting;
    }
  },
}));
