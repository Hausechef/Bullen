import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pnpmStore = path.join(root, 'node_modules/.pnpm');
const esbuildPackage = readdirSync(pnpmStore).find((name) => name.startsWith('esbuild@'));
if (!esbuildPackage) throw new Error('Local esbuild package is unavailable');
const { build } = await import(pathToFileURL(path.join(pnpmStore, esbuildPackage, 'node_modules/esbuild/lib/main.js')));

globalThis.__sipRecoveryHarness = { userAgents: [], registerers: [], inviters: [] };

const mocks = {
  sip: `
    class Emitter {
      constructor() { this.listeners = []; }
      addListener(listener) { this.listeners.push(listener); }
      emit(value) { for (const listener of this.listeners) listener(value); }
    }
    export const SessionState = {
      Initial: 'Initial', Establishing: 'Establishing', Established: 'Established',
      Terminating: 'Terminating', Terminated: 'Terminated'
    };
    export const RegistererState = { Initial: 'Initial', Registered: 'Registered', Unregistered: 'Unregistered', Terminated: 'Terminated' };
    export class UserAgent {
      static makeURI(value) { return { value, user: value.split(':')[1]?.split('@')[0] }; }
      constructor(options) {
        this.options = options;
        this.connected = false;
        this.transport = { disconnect: async () => { this.connected = false; } };
        globalThis.__sipRecoveryHarness.userAgents.push(this);
      }
      async start() { this.connected = true; this.options.delegate?.onConnect?.(); }
      async stop() { this.connected = false; }
      isConnected() { return this.connected; }
    }
    export class Registerer {
      constructor() {
        this.state = RegistererState.Initial;
        this.stateChange = new Emitter();
        this.registerCalls = 0;
        globalThis.__sipRecoveryHarness.registerers.push(this);
      }
      async register() {
        this.registerCalls += 1;
        this.state = RegistererState.Registered;
        this.stateChange.emit(this.state);
      }
    }
    const peerConnection = () => ({
      addEventListener() {}, removeEventListener() {}, getReceivers() { return []; }, getSenders() { return []; },
      async getStats() { return new Map(); }
    });
    export class Inviter {
      constructor() {
        this.state = SessionState.Initial;
        this.stateChange = new Emitter();
        this.disposed = 0;
        this.sessionDescriptionHandler = { peerConnection: peerConnection(), remoteMediaStream: new MediaStream() };
        globalThis.__sipRecoveryHarness.inviters.push(this);
      }
      async invite() { this.state = SessionState.Established; this.stateChange.emit(this.state); }
      async bye() { this.state = SessionState.Terminated; this.stateChange.emit(this.state); }
      async cancel() { this.state = SessionState.Terminated; this.stateChange.emit(this.state); }
      async dispose() { this.disposed += 1; this.state = SessionState.Terminated; this.stateChange.emit(this.state); }
    }
    export class Invitation extends Inviter { async accept() { this.state = SessionState.Established; this.stateChange.emit(this.state); } async reject() { await this.cancel(); } }
    export const Web = { Transport: class {}, defaultSessionDescriptionHandlerFactory: () => () => ({}) };
  `,
  ringback: `export class RingbackTone { prepare() {} start() {} stop() {} dispose() {} watchRemoteStream() {} }`,
  media: `export function watchAudioLevel() { return () => {}; }`,
  codecs: `export function useG711() {}`,
};

const result = await build({
  absWorkingDir: root,
  entryPoints: ['artifacts/bullenhaus/src/telephony/sipClient.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  plugins: [{
    name: 'sip-transport-recovery-doubles',
    setup(builder) {
      builder.onResolve({ filter: /^sip\.js$/ }, () => ({ path: 'sip', namespace: 'mock' }));
      builder.onResolve({ filter: /^\.\/ringback$/ }, () => ({ path: 'ringback', namespace: 'mock' }));
      builder.onResolve({ filter: /^\.\/media$/ }, () => ({ path: 'media', namespace: 'mock' }));
      builder.onResolve({ filter: /^\.\/codecs$/ }, () => ({ path: 'codecs', namespace: 'mock' }));
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, (args) => ({ contents: mocks[args.path], loader: 'js' }));
    },
  }],
});

class FakeTrack {
  constructor() { this.readyState = 'live'; this.enabled = true; this.kind = 'audio'; }
  clone() { return new FakeTrack(); }
  addEventListener() {}
  stop() { this.readyState = 'ended'; }
}
class FakeMediaStream {
  constructor(tracks = []) { this.tracks = tracks; }
  getAudioTracks() { return this.tracks.filter((track) => track.kind === 'audio'); }
  getTrackById() { return undefined; }
  addTrack(track) { this.tracks.push(track); }
  addEventListener() {}
  removeEventListener() {}
}
class FakeAudio {
  constructor() { this.srcObject = null; this.volume = 1; this.muted = false; }
  setAttribute() {}
  async play() {}
  pause() {}
}

globalThis.MediaStream = FakeMediaStream;
globalThis.Audio = FakeAudio;
globalThis.window = { addEventListener() {}, removeEventListener() {} };

const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`;
const { SipClient } = await import(moduleUrl);
const states = [];
const errors = [];
const ended = [];
const client = new SipClient({
  wssUrl: 'wss://fixture.invalid/ws', sipUser: '101', sipPassword: 'fixture-only', sipDomain: 'fixture.invalid',
}, {
  onState: (state) => states.push(state),
  onError: (error) => errors.push(error),
  onCallEnded: (result) => ended.push(result),
  onRemoteStream() {},
});

await client.connect();
const ua = globalThis.__sipRecoveryHarness.userAgents[0];
const registerer = globalThis.__sipRecoveryHarness.registerers[0];
assert.equal(ua.options.transportOptions.keepAliveInterval, 15, 'WSS keepalive must run before a one-minute idle timeout');
assert.equal(ua.options.reconnectionAttempts, 8, 'unexpected WSS closures must retry automatically');
assert.equal(registerer.registerCalls, 1, 'initial SIP registration must run once');
assert.equal(states.at(-1), 'READY');

client.setLocalStream(new FakeMediaStream([new FakeTrack()]));
await client.dial('+37491500065');
const inviter = globalThis.__sipRecoveryHarness.inviters[0];
assert.equal(states.at(-1), 'CONNECTED');

ua.connected = false;
ua.options.delegate.onDisconnect(new Error('fixture disconnect'));
assert.equal(inviter.disposed, 0, 'a transient signalling loss must not dispose an established media session');
assert.equal(ended.length, 0, 'a transient signalling loss must not end the call');
assert.equal(states.at(-1), 'CONNECTED', 'the active call must remain connected while WSS recovers');
assert.match(errors.at(-1), /kept active/i);

ua.connected = true;
ua.options.delegate.onConnect();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(registerer.registerCalls, 2, 'registration must refresh on the recovered transport');
assert.equal(errors.at(-1), null, 'the transient transport error must clear after recovery');
assert.equal(states.at(-1), 'CONNECTED');
assert.equal(ended.length, 0);

client.hangup();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(ended.length, 1, 'normal hangup must still end the call once');
await client.disconnect();
console.log('SIP_TRANSPORT_RECOVERY: keepalive enabled; active call survives WSS disconnect and re-registration');
