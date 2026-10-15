import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { build } = createRequire(new URL('../artifacts/bullenhaus/node_modules/vite/package.json', import.meta.url))('esbuild');
const mocks = {
  auth: `export function useAuth(){return window.__qa.auth}`,
  widget: `export function PhoneWidget(){return null}`,
  media: `export async function requestMicPermission(){return {permission:'GRANTED',stream:{getAudioTracks:()=>[]}}}; export function releaseStream(){}; export function watchDeviceRemoval(){return ()=>{}}; export function watchAudioLevel(){return ()=>{}};`,
  logs: `export function logCall(params){const q=window.__qa;q.logs.push(params);return q.logPromise??Promise.resolve({id:'log-'+q.logs.length})}; export async function updateCallLog(id,patch){window.__qa.updates.push({id,...patch})}`,
  ringback: `export class RingbackTone{prepare(){}start(){}stop(){}dispose(){}watchRemoteStream(){}}`,
  client: `export class SipClient {
    constructor(cfg,cb){this.cfg=cfg;this.cb=cb;this.registered=false;window.__qa.clients.push(this)}
    async connect(){this.cb.onState('CONNECTING'); if(window.__qa.failConnections-->0)throw Error('transport unavailable');this.registered=true;this.cb.onState('READY')}
    async disconnect(){this.registered=false; if(window.__qa.stopDelay)await new Promise(r=>setTimeout(r,window.__qa.stopDelay));this.cb.onState('OFFLINE')}
    isRegistered(){return this.registered} prepareAudio(){}setLocalStream(){}
    async dial(number){window.__qa.dials.push(number);this.cb.onState('RINGING')}
    hangup(){this.cb.onCallEnded({status:'NO_ANSWER',durationSeconds:0})}
  }`,
  protocol: `
    class Emitter {listeners=[];addListener(fn){this.listeners.push(fn)} emit(state){this.listeners.forEach(fn=>fn(state))}}
    export const RegistererState={Registered:'Registered',Unregistered:'Unregistered'};
    export const SessionState={Initial:'Initial',Establishing:'Establishing',Established:'Established',Terminating:'Terminating',Terminated:'Terminated'};
    export class UserAgent {
      constructor(options){this.options=options;this.connected=false;window.__qa.agents.push(this)}
      static makeURI(text){return {text,user:text.split(':')[1].split('@')[0]}}
      start(){return new Promise(resolve=>{this.release=()=>{this.connected=true;resolve()}})}
      async stop(){this.connected=false;this.options.delegate.onDisconnect()}
      isConnected(){return this.connected}
      drop(){this.connected=false;this.options.delegate.onDisconnect()}
    }
    export class Registerer {
      constructor(ua,options){this.ua=ua;this.options=options;this.stateChange=new Emitter;this.state=RegistererState.Unregistered;window.__qa.registerers.push(this)}
      async register(options){this.delegate=options.requestDelegate;this.state=RegistererState.Registered;this.stateChange.emit(this.state)}
      reject(code){this.state=RegistererState.Unregistered;this.stateChange.emit(this.state);this.delegate.onReject({message:{statusCode:code}})}
    }
    export class Inviter {
      constructor(ua,target){this.target=target;this.stateChange=new Emitter;this.state=SessionState.Initial;window.__qa.inviters.push(this)}
      async invite(options){this.delegate=options.requestDelegate;this.state=SessionState.Establishing;this.stateChange.emit(this.state)}
      reject(code){this.state=SessionState.Terminated;this.stateChange.emit(this.state);this.delegate.onReject({message:{statusCode:code}})}
      cancel(){this.state=SessionState.Terminated;this.stateChange.emit(this.state)}
    }
    export class Invitation {}
    export const Web={Transport:class{},defaultSessionDescriptionHandlerFactory:()=>()=>{}};
  `,
};
const result = await build({
  absWorkingDir: root,
  entryPoints: ['scripts/telephony-recovery-fixture.tsx'],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  nodePaths: [path.join(root, 'artifacts/bullenhaus/node_modules')],
  jsx: 'automatic',
  plugins: [{
    name: 'explicit-regression-doubles',
    setup(b) {
      b.onResolve({ filter: /^\.\/sipClient$/ }, a => a.importer.endsWith('callStore.ts') ? {path:'client',namespace:'mock'} : undefined);
      b.onResolve({ filter: /AuthContext$/ }, () => ({path:'auth',namespace:'mock'}));
      b.onResolve({ filter: /^\.\/PhoneWidget$/ }, () => ({path:'widget',namespace:'mock'}));
      b.onResolve({ filter: /^\.\/media$/ }, () => ({path:'media',namespace:'mock'}));
      b.onResolve({ filter: /useCallLogs$/ }, () => ({path:'logs',namespace:'mock'}));
      b.onResolve({ filter: /^\.\/ringback$/ }, () => ({path:'ringback',namespace:'mock'}));
      b.onResolve({ filter: /^sip\.js$/ }, () => ({path:'protocol',namespace:'mock'}));
      b.onLoad({ filter: /.*/, namespace:'mock' }, a => ({contents:mocks[a.path],loader:'js'}));
    },
  }],
});
const js = result.outputFiles[0].contents;
const server = createServer((req,res) => {
  if (req.url === '/fixture.js') {res.setHeader('content-type','text/javascript');res.end(js);return}
  if (req.url === '/api/telephony/config') {res.writeHead(503,{'content-type':'application/json'});res.end('{"error":"fixture route must be intercepted"}');return}
  res.setHeader('content-type','text/html');
  res.end(`<!doctype html><html><body><div id="root"></div><script>window.__qa={auth:{user:{id:'agent-a'},role:'agent',session:{access_token:'fixture-token-a'}},clients:[],agents:[],registerers:[],inviters:[],logs:[],updates:[],dials:[],failConnections:0,stopDelay:0};</script><script src="/fixture.js"></script></body></html>`);
});
server.listen(4175,'127.0.0.1',()=>console.log('TELEPHONY_FIXTURE http://127.0.0.1:4175'));
