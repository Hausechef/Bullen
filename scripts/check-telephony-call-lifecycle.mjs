import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pnpmStore = path.join(root, 'node_modules/.pnpm');
const esbuildPackage = readdirSync(pnpmStore).find((name) => name.startsWith('esbuild@'));
if (!esbuildPackage) throw new Error('Local esbuild package is unavailable');
const { build } = await import(pathToFileURL(path.join(pnpmStore, esbuildPackage, 'node_modules/esbuild/lib/main.js')));

globalThis.BroadcastChannel = undefined;
globalThis.__telephonyHarness = {
  clients: [],
  dials: [],
  logs: [],
  updates: [],
  releasedStreams: 0,
};

const mocks = {
  client: `
    export class SipClient {
      constructor(cfg, callbacks) {
        this.cfg = cfg;
        this.callbacks = callbacks;
        this.registered = false;
        globalThis.__telephonyHarness.clients.push(this);
      }
      async connect() { this.registered = true; this.callbacks.onState('READY'); }
      async disconnect() { this.registered = false; }
      isRegistered() { return this.registered; }
      prepareAudio() {}
      setLocalStream(stream) { this.stream = stream; }
      async dial(number) {
        globalThis.__telephonyHarness.dials.push(number);
        this.callbacks.onState('RINGING');
      }
      finish(status = 'FAILED') {
        this.callbacks.onError?.('Call rejected by PBX/provider (503)');
        this.callbacks.onCallEnded({ status, durationSeconds: 0 });
      }
      hangup() { this.finish('NO_ANSWER'); }
      resumeAudio() {}
      async answer() {}
      reject() {}
      mute() {}
      unmute() {}
      hold() {}
      resume() {}
      sendDtmf() {}
    }
  `,
  media: `
    const track = { readyState: 'live', enabled: true };
    const stream = { getAudioTracks: () => [track] };
    export async function requestMicPermission() { return { permission: 'GRANTED', stream }; }
    export function releaseStream() { globalThis.__telephonyHarness.releasedStreams += 1; }
    export function watchDeviceRemoval() { return () => {}; }
  `,
  logs: `
    export async function logCall(params) {
      globalThis.__telephonyHarness.logs.push(params);
      return { id: 'log-' + globalThis.__telephonyHarness.logs.length };
    }
    export async function updateCallLog(id, patch) {
      globalThis.__telephonyHarness.updates.push({ id, ...patch });
    }
  `,
};

const result = await build({
  absWorkingDir: root,
  entryPoints: ['artifacts/bullenhaus/src/telephony/callStore.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  nodePaths: [path.join(root, 'artifacts/bullenhaus/node_modules')],
  plugins: [{
    name: 'telephony-lifecycle-doubles',
    setup(builder) {
      builder.onResolve({ filter: /^\.\/sipClient$/ }, (args) =>
        args.importer.endsWith('callStore.ts') ? { path: 'client', namespace: 'mock' } : undefined);
      builder.onResolve({ filter: /^\.\/media$/ }, () => ({ path: 'media', namespace: 'mock' }));
      builder.onResolve({ filter: /useCallLogs$/ }, () => ({ path: 'logs', namespace: 'mock' }));
      builder.onLoad({ filter: /.*/, namespace: 'mock' }, (args) => ({ contents: mocks[args.path], loader: 'js' }));
    },
  }],
});

const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`;
const { useTelephony } = await import(moduleUrl);
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await useTelephony.getState().connect({
  wssUrl: 'wss://fixture.invalid/ws',
  sipUser: '101',
  sipPassword: 'fixture-only',
  sipDomain: 'fixture.invalid',
  agentId: 'agent-fixture',
});
assert.equal(useTelephony.getState().state, 'READY', 'phone must be ready after registration');

const inputs = [
  '+37491500065',
  '37491500065',
  '0037491500065',
  '+374 91 500065',
  '+374-91-500065',
];

for (const [index, input] of inputs.entries()) {
  await useTelephony.getState().dial(input, `Attempt ${index + 1}`);
  assert.equal(globalThis.__telephonyHarness.dials.at(-1), '+37491500065', `attempt ${index + 1} must keep Armenia country code`);
  assert.equal(useTelephony.getState().state, 'RINGING', `attempt ${index + 1} must enter ringing`);
  assert.equal(useTelephony.getState().activeCall?.remoteNumber, '+37491500065');

  globalThis.__telephonyHarness.clients[0].finish('FAILED');
  assert.equal(useTelephony.getState().state, 'ENDED', `attempt ${index + 1} must terminate deterministically`);
  assert.equal(useTelephony.getState().activeCall, null, `attempt ${index + 1} must clear activeCall`);

  await wait(1650);
  assert.equal(useTelephony.getState().state, 'READY', `attempt ${index + 1} must recover without page refresh`);
}

const dialCount = globalThis.__telephonyHarness.dials.length;
await useTelephony.getState().dial('015123456789');
assert.equal(globalThis.__telephonyHarness.dials.length, dialCount, 'national number without country code must not be dialed');
assert.match(useTelephony.getState().error ?? '', /country code/);
assert.equal(useTelephony.getState().state, 'READY');
assert.equal(globalThis.__telephonyHarness.logs.length, inputs.length, 'each real dial attempt must be logged');
assert.ok(globalThis.__telephonyHarness.releasedStreams >= inputs.length, 'microphone stream must be released after every call');

await useTelephony.getState().disconnect();
console.log(`TELEPHONY_LIFECYCLE: ${inputs.length}/${inputs.length} sequential calls recovered; no refresh and no implicit +49`);
