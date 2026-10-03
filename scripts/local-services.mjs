// Pin Realtime to a version compatible with the cloud snapshot and bind published ports locally.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = JSON.parse(execFileSync('docker', ['context', 'inspect'], { encoding:'utf8' }))[0];
const endpoint = context.Endpoints.docker.Host;
if (!endpoint.startsWith('npipe://')) throw new Error('This helper requires the local Windows Docker engine.');
const socketPath = endpoint.slice('npipe://'.length).replaceAll('/', '\\');
function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({socketPath, path:url, method, headers:data ? {'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)} : {}}, res => {
      const chunks=[];
      res.on('data',c=>chunks.push(c));
      res.on('end',()=>{
        const text=Buffer.concat(chunks).toString();
        const result=text ? JSON.parse(text) : {};
        if(res.statusCode>=400) reject(new Error(`Docker ${res.statusCode}: ${result.message}`));
        else resolve(result);
      });
    });
    req.on('error',reject);
    req.setTimeout(60000,()=>req.destroy(new Error('Docker request timed out')));
    req.end(data);
  });
}

const realtimeImage='public.ecr.aws/supabase/realtime:v2.130.0';
for (const service of ['realtime','db','kong','studio','inbucket']) {
  const name=`supabase_${service}_bullenhaus-local`;
  const original=await request('GET',`/containers/${name}/json`);
  const exposed=Object.values(original.NetworkSettings.Ports??{}).flat().filter(Boolean);
  const isRealtime=service==='realtime';
  if(isRealtime ? original.Config.Image===realtimeImage : exposed.length && exposed.every(p=>p.HostIp==='127.0.0.1')) continue;
  if(isRealtime) {
    try { execFileSync('docker',['image','inspect',realtimeImage],{stdio:'ignore'}); }
    catch { execFileSync('docker',['pull',realtimeImage],{stdio:'inherit'}); }
  }
  const bindings=structuredClone(original.HostConfig.PortBindings);
  for(const entries of Object.values(bindings??{})) for(const binding of entries) binding.HostIp='127.0.0.1';
  const backupName=`${name}-before-local-setup-${Date.now()}`;
  const snapshotPath=path.join(root,'.local/dev',`${backupName}.json`);
  fs.writeFileSync(snapshotPath,JSON.stringify(original));
  await request('POST',`/containers/${original.Id}/stop?t=30`);
  await request('POST',`/containers/${original.Id}/rename?name=${backupName}`);
  let replacement;
  try {
    const endpoints=Object.fromEntries(Object.entries(original.NetworkSettings.Networks).map(([network, details])=>[network,{Aliases:details.Aliases??[]} ]));
    replacement=await request('POST',`/containers/create?name=${name}`,{
      ...original.Config,
      ...(isRealtime?{Image:realtimeImage}:{}),
      HostConfig:{...original.HostConfig,PortBindings:bindings},
      NetworkingConfig:{EndpointsConfig:endpoints},
    });
    await request('POST',`/containers/${replacement.Id}/start`);
    const deadline=Date.now()+180000;
    while (true) {
      const check=await request('GET',`/containers/${replacement.Id}/json`);
      if(check.State.Running && (!check.State.Health || check.State.Health.Status==='healthy')) break;
      if(Date.now()>deadline || check.State.Status==='exited') throw new Error(`${name} did not become healthy`);
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    // Removing the stopped container preserves its named data volumes (v=false).
    await request('DELETE',`/containers/${original.Id}?v=false`);
    console.log(`${name}: ${isRealtime?'Realtime version aligned with the backup':'bound to 127.0.0.1'}`);
  } catch(error) {
    if(replacement?.Id) await request('DELETE',`/containers/${replacement.Id}?force=true&v=false`).catch(()=>{});
    await request('POST',`/containers/${original.Id}/rename?name=${name}`);
    await request('POST',`/containers/${original.Id}/start`);
    throw error;
  }
}
