// SIP.js WebRTC client — wraps SIP.js UserAgent for Asterisk WSS.
// Exposes deterministic state transitions; no SIP protocol details leak to UI.
import { UserAgent, Registerer, RegistererState, Inviter, Invitation, SessionState, type Session, type UserAgentOptions, Web } from 'sip.js';
import type { TelephonyConfig, TelephonyState, CallResult } from './types';
import { toDialDigits } from './normalize';
import { RingbackTone } from './ringback';
import { useG711 } from './codecs';
import { watchAudioLevel } from './media';

const TERMINATION_TIMEOUT_MS = 8_000;

// Cleanup must not hold the store's reconnect lock forever. A rejected or late
// operation is still observed, so it cannot become an unhandled rejection.
async function settleWithin(operation: () => Promise<unknown>, timeoutMs: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(operation).then(() => true, () => false),
      new Promise<boolean>((resolve) => { timer = setTimeout(() => resolve(false), timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface SipCallbacks {
  onState: (state: TelephonyState) => void;
  onError?: (error: string) => void;
  onCallEnded: (result: CallResult) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onIncoming?: (number: string, name?: string) => void;
  onPlaybackBlocked?: (blocked: boolean) => void;
  onAudioTrackState?: (kind: 'microphone' | 'remote', live: boolean) => void;
  onAudioLevel?: (kind: 'microphone' | 'remote', level: number) => void;
  onRtpStats?: (stats: { outboundAudioPackets: number; inboundAudioPackets: number }) => void;
}

export class SipClient {
  private ua: UserAgent | null = null;
  private registerer: Registerer | null = null;
  private session: Session | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private callStartedAt = 0;
  private callAnsweredAt = 0;
  private cb: SipCallbacks;
  private cfg: TelephonyConfig;
  private localStream: MediaStream | null = null;
  private muted = false;
  private onHold = false;
  private ringback = new RingbackTone();
  private earlyMedia = false;
  private mediaCleanup: (() => void) | null = null;
  private localAudioCleanup: (() => void) | null = null;
  private remoteAudioCleanup: (() => void) | null = null;
  private statsTimer: ReturnType<typeof setInterval> | null = null;
  private playbackAttempt = 0;
  private disposed = false;
  private recovering = false;
  private localHangup = false;
  private terminationTimer: ReturnType<typeof setTimeout> | null = null;
  private shutdown: Promise<void> | null = null;
  private callFailure: CallResult['status'] | null = null;
  private stopToneOnPageHide = () => this.ringback.stop();

  constructor(cfg: TelephonyConfig, cb: SipCallbacks) {
    this.cfg = cfg;
    this.cb = cb;
    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
    this.remoteAudio.setAttribute('playsinline', '');
    this.remoteAudio.muted = false;
    this.remoteAudio.volume = 1;
    window.addEventListener('pagehide', this.stopToneOnPageHide);
  }

  async connect(): Promise<void> {
    this.cb.onState('CONNECTING');

    const options: UserAgentOptions = {
      uri: UserAgent.makeURI(`sip:${this.cfg.sipUser}@${this.cfg.sipDomain}`),
      authorizationUsername: this.cfg.sipUser,
      authorizationPassword: this.cfg.sipPassword,
      transportConstructor: Web.Transport,
      transportOptions: { server: this.cfg.wssUrl },
      sessionDescriptionHandlerFactory: Web.defaultSessionDescriptionHandlerFactory(async () => {
        const track = this.localStream?.getAudioTracks().find((t) => t.readyState === 'live');
        if (!track) throw new Error('Microphone is no longer available');
        // SIP.js stops sender tracks when the session closes. Give it a clone
        // of the approved microphone, so it neither reopens a second capture
        // nor stops the application-owned stream during renegotiation.
        const senderTrack = track.clone();
        senderTrack.enabled = !this.muted;
        return new MediaStream([senderTrack]);
      }),
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionConfiguration: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        },
      },
      logBuiltinEnabled: false,
      logConfiguration: false,
      logLevel: 'error',
      delegate: {
        onDisconnect: () => {
          if (this.disposed || this.recovering) return;
          if (this.session) {
            this.callFailure = 'FAILED';
            const session = this.session;
            void settleWithin(() => session.dispose(), 1000);
            this.finishSession(session);
          }
          this.cb.onError?.('SIP connection lost. Reconnecting…');
          this.cb.onState('OFFLINE');
        },
        onInvite: (invitation: Invitation) => {
          if (this.disposed || this.recovering || this.session) {
            invitation.reject({ statusCode: 486 }).catch(() => {});
            return;
          }
          this.session = invitation;
          this.callStartedAt = Date.now();
          this.callAnsweredAt = 0;
          this.callFailure = null;
          this.localHangup = false;
          this.muted = false;
          this.onHold = false;
          this.earlyMedia = false;
          invitation.stateChange.addListener((state) => {
            if (!this.disposed && !this.recovering && this.session === invitation) this.handleSessionState(state);
          });
          this.cb.onIncoming?.(invitation.remoteIdentity.uri.user || 'Unknown', invitation.remoteIdentity.displayName);
          this.cb.onState('INCOMING');
          this.ringback.prepare();
          this.ringback.start();
        },
      },
    };

    this.ua = new UserAgent(options);
    // SIP.js 0.21 start() resolves when its transport is connected. Register
    // after that promise instead of leaving an unbounded polling timer behind.
    await this.ua.start();
    if (!this.disposed) await this.register();
  }

  setLocalStream(stream: MediaStream): void {
    this.localAudioCleanup?.();
    this.localStream = stream;
    const track = stream.getAudioTracks()[0];
    this.cb.onAudioTrackState?.('microphone', track?.readyState === 'live');
    this.cb.onAudioLevel?.('microphone', 0);
    this.localAudioCleanup = watchAudioLevel(stream, (level) => {
      this.cb.onAudioLevel?.('microphone', level);
    });
    track?.addEventListener('ended', () => {
      this.cb.onAudioTrackState?.('microphone', false);
      this.cb.onAudioLevel?.('microphone', 0);
    }, { once: true });
  }

  prepareAudio(): void {
    this.ringback.prepare();
    if (this.remoteAudio?.srcObject) this.playRemoteAudio();
  }

  resumeAudio(): void { this.playRemoteAudio(); }

  private async register(): Promise<void> {
    if (!this.ua || this.disposed) return;
    this.cb.onState('REGISTERING');
    this.registerer = new Registerer(this.ua, { logConfiguration: false });
    this.registerer.stateChange.addListener((state) => {
      if (this.disposed || this.recovering) return;
      if (state === RegistererState.Registered) {
        if (!this.session) this.cb.onState('READY');
      } else if (state === RegistererState.Unregistered) {
        this.cb.onState('OFFLINE');
      }
    });
    try {
      await this.registerer.register({
        requestDelegate: {
          onReject: (response) => {
            if (this.disposed || this.recovering) return;
            this.cb.onError?.(`SIP registration rejected (${response.message.statusCode})`);
            this.cb.onState('FAILED');
          },
        },
      });
    } catch {
      if (!this.disposed) {
        this.cb.onError?.('SIP registration failed');
        this.cb.onState('FAILED');
      }
    }
  }

  async dial(e164: string): Promise<void> {
    if (this.session) throw new Error('Previous call is still ending');
    if (!this.isRegistered() || !this.ua || !this.localStream) throw new Error('Phone is reconnecting');
    this.muted = false;
    this.onHold = false;
    this.localStream.getAudioTracks().forEach((track) => { track.enabled = true; });
    const digits = toDialDigits(e164);
    const target = UserAgent.makeURI(`sip:${digits}@${this.cfg.sipDomain}`);
    if (!target) throw new Error('Invalid SIP destination');

    const inviter = new Inviter(this.ua, target, {
      earlyMedia: true,
      sessionDescriptionHandlerModifiers: [useG711],
      sessionDescriptionHandlerModifiersReInvite: [useG711],
      sessionDescriptionHandlerOptions: {
        constraints: { audio: true, video: false },
      },
    });
    this.session = inviter;
    this.callStartedAt = Date.now();
    this.callAnsweredAt = 0;
    this.callFailure = null;
    this.localHangup = false;
    this.earlyMedia = false;
    this.ringback.stop();

    inviter.stateChange.addListener((state) => {
      if (!this.disposed && !this.recovering && this.session === inviter) this.handleSessionState(state);
    });

    try {
      await inviter.invite({
        requestDelegate: {
          onProgress: (response) => {
            if (this.disposed || this.recovering || this.localHangup || this.session !== inviter || inviter.state !== SessionState.Establishing) return;
            if (response.message.body) {
              this.attachMedia();
            } else if (response.message.statusCode === 180 && !this.earlyMedia) {
              this.ringback.start();
            }
            if (response.message.statusCode === 180 || response.message.statusCode === 183) {
              this.cb.onState('RINGING');
            }
          },
          onReject: (response) => {
            if (this.disposed || this.recovering || this.session !== inviter) return;
            this.ringback.stop();
            // 487 after our CANCEL is an expected completion, not a provider
            // failure. Keep real provider failures visible.
            if (this.localHangup && response.message.statusCode === 487) return;
            this.callFailure = response.message.statusCode === 486 ? 'BUSY' : 'FAILED';
            this.cb.onError?.(`Call rejected by PBX/provider (${response.message.statusCode})`);
          },
        },
      });
      if (!this.localHangup && this.session === inviter && inviter.state === SessionState.Establishing && !this.earlyMedia) {
        this.ringback.start();
      }
    } catch (error: any) {
      this.ringback.stop();
      if (!this.disposed && !this.recovering && this.session === inviter) {
        this.cb.onError?.(error?.message || 'Не удалось отправить вызов в АТС');
        this.callFailure = 'FAILED';
        void settleWithin(() => inviter.dispose(), 1000);
        this.finishSession(inviter);
      }
    }
  }

  async answer(): Promise<void> {
    const invitation = this.session;
    if (!(invitation instanceof Invitation) || invitation.state !== SessionState.Initial) return;
    this.ringback.stop();
    try {
      await invitation.accept({ sessionDescriptionHandlerModifiers: [useG711], sessionDescriptionHandlerOptions: { constraints: { audio: true, video: false } } });
    } catch (error) {
      await invitation.reject().catch(() => {});
      if (this.session === invitation) {
        this.callFailure = 'FAILED';
        this.finishSession(invitation);
      }
      throw error;
    }
  }

  reject(): void {
    const invitation = this.session;
    if (!(invitation instanceof Invitation) || invitation.state !== SessionState.Initial) return;
    this.hangup();
  }

  private handleSessionState(state: SessionState): void {
    const s = this.session;
    if (!s) return;
    switch (state) {
      case SessionState.Establishing:
        this.cb.onState(this.localHangup ? 'ENDING' : 'DIALING');
        break;
      case SessionState.Established:
        if (this.localHangup) {
          // A 200 can cross our CANCEL. Do not re-enable audio or display an
          // active call after the agent has already hung up.
          this.beginTermination(s);
          void Promise.resolve().then(() => this.requestSessionEnd(s)).catch(() => { void this.recoverTermination(s); });
          break;
        }
        this.ringback.stop();
        this.callAnsweredAt = Date.now();
        this.attachMedia();
        this.cb.onState('CONNECTED');
        break;
      case SessionState.Terminating:
        this.beginTermination(s);
        break;
      case SessionState.Terminated: {
        // SIP.js changes state before invoking the request's onReject delegate.
        // Let that delegate record the response code before writing the result.
        queueMicrotask(() => {
          if (this.disposed || this.recovering) return;
          this.finishSession(s);
        });
        break;
      }
    }
  }

  private clearTerminationTimer(): void {
    if (this.terminationTimer) clearTimeout(this.terminationTimer);
    this.terminationTimer = null;
  }

  private beginTermination(session: Session): void {
    if (this.session !== session || this.disposed || this.recovering) return;
    this.ringback.stop();
    this.mute();
    this.remoteAudio?.pause();
    this.cb.onState('ENDING');
    if (this.terminationTimer) return;
    this.terminationTimer = setTimeout(() => {
      this.terminationTimer = null;
      void this.recoverTermination(session);
    }, TERMINATION_TIMEOUT_MS);
  }

  private finishSession(session: Session): void {
    if (this.session !== session) return;
    const result = this.buildResult();
    this.clearTerminationTimer();
    this.session = null;
    this.ringback.stop();
    this.clearMedia();
    this.remoteAudio?.pause();
    if (this.remoteAudio) this.remoteAudio.srcObject = null;
    this.cb.onCallEnded(result);
  }

  private async recoverTermination(session: Session): Promise<void> {
    if (this.disposed || this.recovering || this.session !== session) return;
    this.recovering = true; // Never advertise Ready on the suspect transport.
    this.clearTerminationTimer();
    this.cb.onError?.('Call cleanup timed out. Reconnecting phone…');
    // Dispose closes the peer connection/sender tracks. Close this tab's SIP
    // transport before allowing a fresh registration; do not just clear the UI
    // and place another INVITE on a still-live orphan session.
    await settleWithin(() => session.dispose(), 1000);
    const ua = this.ua;
    if (ua) await settleWithin(() => ua.transport.disconnect(), 2000);
    if (this.disposed || this.session !== session) return;
    this.finishSession(session);
    this.cb.onState('OFFLINE'); // TelephonyProvider retires and reconnects us.
  }

  private attachMedia(): void {
    const s = this.session as any;
    const sdh = s?.sessionDescriptionHandler;
    if (!sdh) return;
    const pc: RTCPeerConnection | undefined = sdh.peerConnection;
    if (!pc) return;
    this.mediaCleanup?.();
    this.remoteAudioCleanup?.();
    // Use SIP.js's stable stream and listen for late tracks/renegotiation.
    const stream: MediaStream = sdh.remoteMediaStream ?? new MediaStream();
    const bind = () => {
      if (this.session !== s || !this.remoteAudio) return;
      pc.getReceivers().forEach(({ track }) => {
        if (track?.kind === 'audio' && track.readyState !== 'ended' && !stream.getTrackById(track.id)) stream.addTrack(track);
      });
      if (!stream.getAudioTracks().length) return;
      if (this.remoteAudio.srcObject !== stream) this.remoteAudio.srcObject = stream;
      const remoteTrack = stream.getAudioTracks()[0];
      this.cb.onAudioTrackState?.('remote', remoteTrack?.readyState === 'live');
      this.cb.onAudioLevel?.('remote', 0);
      this.remoteAudioCleanup?.();
      this.remoteAudioCleanup = watchAudioLevel(stream, (level) => {
        this.cb.onAudioLevel?.('remote', level);
      });
      this.cb.onAudioLevel?.('remote', remoteTrack?.readyState === 'live' ? 0 : 0);
      remoteTrack?.addEventListener('ended', () => this.cb.onAudioTrackState?.('remote', false), { once: true });
      this.cb.onRemoteStream(stream);
      this.playRemoteAudio();
    };
    pc.addEventListener('track', bind);
    stream.addEventListener('addtrack', bind);
    this.mediaCleanup = () => { pc.removeEventListener('track', bind); stream.removeEventListener('addtrack', bind); };
    this.startRtpStats(pc);
    bind();
  }

  private startRtpStats(pc: RTCPeerConnection): void {
    if (this.statsTimer) clearInterval(this.statsTimer);
    const sample = async () => {
      try {
        const reports = await pc.getStats();
        let outboundAudioPackets = 0;
        let inboundAudioPackets = 0;
        reports.forEach((report) => {
          const entry = report as RTCStats & { kind?: string; mediaType?: string; packetsSent?: number; packetsReceived?: number };
          const isAudio = entry.kind === 'audio' || entry.mediaType === 'audio';
          if (!isAudio) return;
          if (entry.type === 'outbound-rtp') outboundAudioPackets += Number(entry.packetsSent ?? 0);
          if (entry.type === 'inbound-rtp') inboundAudioPackets += Number(entry.packetsReceived ?? 0);
        });
        this.cb.onRtpStats?.({ outboundAudioPackets, inboundAudioPackets });
      } catch { /* diagnostics must never interrupt a call */ }
    };
    void sample();
    this.statsTimer = setInterval(() => { void sample(); }, 1000);
  }

  private playRemoteAudio(): void {
    const audio = this.remoteAudio;
    const session = this.session;
    const stream = audio?.srcObject as MediaStream | null;
    if (!audio || !session || !stream) return;
    const attempt = ++this.playbackAttempt;
    audio.muted = false;
    audio.volume = 1;
    audio.play().then(() => {
      if (this.session !== session || attempt !== this.playbackAttempt) return;
      this.cb.onPlaybackBlocked?.(false);
      if (session.state === SessionState.Establishing && !this.earlyMedia) {
        this.ringback.watchRemoteStream(stream, () => { this.earlyMedia = true; });
      }
    }).catch(() => {
      if (this.session === session && attempt === this.playbackAttempt) this.cb.onPlaybackBlocked?.(true);
    });
  }

  private clearMedia(): void {
    this.mediaCleanup?.();
    this.mediaCleanup = null;
    this.playbackAttempt++;
    this.cb.onPlaybackBlocked?.(false);
    this.remoteAudioCleanup?.();
    this.remoteAudioCleanup = null;
    this.localAudioCleanup?.();
    this.localAudioCleanup = null;
    if (this.statsTimer) clearInterval(this.statsTimer);
    this.statsTimer = null;
    this.cb.onAudioLevel?.('microphone', 0);
    this.cb.onAudioLevel?.('remote', 0);
    this.cb.onAudioTrackState?.('microphone', false);
    this.cb.onAudioTrackState?.('remote', false);
    this.cb.onRtpStats?.({ outboundAudioPackets: 0, inboundAudioPackets: 0 });
  }

  private buildResult(): CallResult {
    const ended = Date.now();
    const answered = this.callAnsweredAt > 0;
    const duration = answered ? Math.round((ended - this.callAnsweredAt) / 1000) : 0;
    const cause = (this.session as any)?.sessionStatus?.terminationCause;
    return { status: answered ? 'ENDED' : this.callFailure ?? 'NO_ANSWER', durationSeconds: duration, hangupCause: cause };
  }

  mute(): void {
    if (this.muted) return;
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = false));
    (this.session?.sessionDescriptionHandler as any)?.peerConnection?.getSenders().forEach((sender: RTCRtpSender) => { if (sender.track?.kind === 'audio') sender.track.enabled = false; });
    this.muted = true;
  }

  unmute(): void {
    if (!this.muted) return;
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = true));
    (this.session?.sessionDescriptionHandler as any)?.peerConnection?.getSenders().forEach((sender: RTCRtpSender) => { if (sender.track?.kind === 'audio') sender.track.enabled = true; });
    this.muted = false;
  }

  async hold(): Promise<void> {
    const s = this.session as any;
    if (!s?.sessionDescriptionHandler || this.onHold) return;
    this.onHold = true;
    try {
      await s.sessionDescriptionHandler.hold();
      this.cb.onState('HOLD');
    } catch { this.onHold = false; }
  }

  async resume(): Promise<void> {
    const s = this.session as any;
    if (!s?.sessionDescriptionHandler || !this.onHold) return;
    try {
      await s.sessionDescriptionHandler.unhold();
      this.onHold = false;
      this.cb.onState('CONNECTED');
    } catch { /* stay on hold */ }
  }

  sendDtmf(digit: string): void {
    const s = this.session as any;
    const options = { info: { contentType: 'application/dtmf-relay', body: `Signal=${digit}\r\nDuration=250` } };
    s?.info?.(undefined, options).catch(() => {});
  }

  hangup(): void {
    this.ringback.stop();
    const s = this.session;
    if (!s || this.disposed || this.recovering || this.localHangup) return;
    this.localHangup = true;
    this.beginTermination(s);
    void Promise.resolve().then(() => this.requestSessionEnd(s)).catch(() => {
      if (this.session === s && !this.disposed) void this.recoverTermination(s);
    });
  }

  private requestSessionEnd(session: Session): Promise<unknown> {
    if (session.state === SessionState.Established) return session.bye();
    if (session instanceof Invitation && session.state === SessionState.Initial) return session.reject({ statusCode: 486 });
    if (session instanceof Inviter && (session.state === SessionState.Initial || session.state === SessionState.Establishing)) return session.cancel();
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    if (this.shutdown) return this.shutdown;
    this.disposed = true;
    this.clearTerminationTimer();
    window.removeEventListener('pagehide', this.stopToneOnPageHide);
    this.ringback.dispose();
    this.clearMedia();
    this.remoteAudio?.pause();
    if (this.remoteAudio) this.remoteAudio.srcObject = null;
    const session = this.session;
    const ua = this.ua;
    this.session = null;
    this.registerer = null;
    this.ua = null;
    this.shutdown = (async () => {
      if (session) {
        await settleWithin(() => this.requestSessionEnd(session), 1000);
        await settleWithin(() => session.dispose(), 1000);
      }
      if (ua && !await settleWithin(() => ua.stop(), 3000)) {
        await settleWithin(() => ua.transport.disconnect(), 2000);
      }
    })();
    return this.shutdown;
  }

  isMuted(): boolean { return this.muted; }
  isRegistered(): boolean {
    return !this.disposed && !this.recovering && !!this.ua?.isConnected() && this.registerer?.state === RegistererState.Registered;
  }
  isOnHold(): boolean { return this.onHold; }
}
