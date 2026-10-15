import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const current = path.join(root, 'artifacts/bullenhaus/dist/public');
const baseline = process.argv[2];
function files(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : [path.join(dir,e.name)]);
}
const secretValues = new Set();
for (const dir of [root, path.join(root,'artifacts/bullenhaus'), path.join(root,'artifacts/api-server')]) {
  for (const name of readdirSync(dir).filter(n=>/^\.env(?:\.|$)/.test(n))) {
    for (const line of readFileSync(path.join(dir,name),'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]*(?:PASSWORD|SECRET|SERVICE_ROLE|PHONE_101_PASS|SIP_101_PASS)[A-Z0-9_]*)=(.*)$/);
      if (match) {
        const value = match[2].trim().replace(/^(['"])(.*)\1$/,'$2');
        if (value.length >= 8) secretValues.add(value);
      }
    }
  }
}
// Compare local PBX passwords without printing or storing their values.
const localPjsip = 'D:/bh_telephony/pjsip.conf';
if (existsSync(localPjsip)) {
  for (const line of readFileSync(localPjsip,'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*password\s*=\s*(.+)$/);
    if (match?.[1].length >= 8) secretValues.add(match[1].trim());
  }
}
const payloads = [...files(current), ...(baseline ? files(baseline) : [])].filter(f=>/\.(?:js|html|css|json)$/.test(f));
for (const file of payloads) {
  const text = readFileSync(file,'utf8');
  for (const value of secretValues) {
    if (text.includes(value)) throw new Error(`Private credential found in public file ${path.relative(current,file)}`);
  }
  for (const token of text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? []) {
    try {
      if (JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).role === 'service_role') throw new Error(`Service-role JWT found in ${path.relative(current,file)}`);
    } catch (error) {
      if (error.message.startsWith('Service-role JWT')) throw error;
    }
  }
  if (text.includes('fixture-only') || text.includes('Telephony regression fixture')) throw new Error('Test fixture included in production');
}
const hash = f=>createHash('sha256').update(readFileSync(f)).digest('hex');
const shared = baseline ? files(current).filter(f=>existsSync(path.join(baseline,path.relative(current,f)))) : [];
const changedSameName = shared.filter(f=>hash(f)!==hash(path.join(baseline,path.relative(current,f)))).map(f=>path.relative(current,f));
console.log(JSON.stringify({publicFilesScanned:payloads.length,privateCredentialValuesChecked:secretValues.size,privateCredentialsFound:0,testFixturesIncluded:false,indexSha256:hash(path.join(current,'index.html')),sameNameAssetsUnchanged:shared.length-changedSameName.length,changedSameName},null,2));
