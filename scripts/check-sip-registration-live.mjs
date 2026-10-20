import process from 'node:process';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pnpmStore = path.join(root, 'node_modules/.pnpm');
const wsPackage = readdirSync(pnpmStore).find((name) => name.startsWith('ws@'));
const sipPackage = readdirSync(pnpmStore).find((name) => name.startsWith('sip.js@'));
if (!wsPackage || !sipPackage) throw new Error('Local ws/sip.js packages are unavailable');
const { default: WebSocket } = await import(pathToFileURL(path.join(pnpmStore, wsPackage, 'node_modules/ws/index.js')));
const { UserAgent, Registerer, RegistererState, Web } = await import(pathToFileURL(path.join(pnpmStore, sipPackage, 'node_modules/sip.js/lib/index.js')));

globalThis.WebSocket = WebSocket;

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const password = Buffer.concat(chunks).toString('utf8').trim();
if (!password) throw new Error('SIP password was not supplied on stdin');

const holdMs = 70_000;
let unexpectedDisconnect = null;
const uri = UserAgent.makeURI('sip:101@bullenhaus.st');
if (!uri) throw new Error('Invalid SIP URI');

const ua = new UserAgent({
  uri,
  authorizationUsername: '101',
  authorizationPassword: password,
  transportConstructor: Web.Transport,
  transportOptions: {
    server: 'wss://bullenhaus.st/ws',
    connectionTimeout: 10,
    keepAliveInterval: 15,
    keepAliveDebounce: 5,
    traceSip: false,
  },
  reconnectionAttempts: 8,
  reconnectionDelay: 2,
  logBuiltinEnabled: false,
  logConfiguration: false,
  logLevel: 'error',
  delegate: {
    onDisconnect: (error) => { unexpectedDisconnect = error ?? new Error('transport disconnected'); },
  },
});

const registerer = new Registerer(ua, { logConfiguration: false });
const registered = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('REGISTER timeout')), 15_000);
  registerer.stateChange.addListener((state) => {
    if (state === RegistererState.Registered) {
      clearTimeout(timeout);
      resolve();
    }
  });
});

try {
  await ua.start();
  await registerer.register();
  await registered;
  console.log('SIP_REGISTERED');
  await new Promise((resolve) => setTimeout(resolve, holdMs));
  if (unexpectedDisconnect || !ua.isConnected() || registerer.state !== RegistererState.Registered) {
    throw unexpectedDisconnect ?? new Error('registration or transport did not remain active');
  }
  console.log(`SIP_REGISTERED_WSS_OK elapsed_ms=${holdMs}`);
} finally {
  await registerer.unregister().catch(() => {});
  await ua.stop().catch(() => {});
}
