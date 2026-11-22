// Encrypts (or decrypts) the topdorm room pack: the 4 fixed profiles (names and portrait features) travel in the page only
// encrypted with the room password (PBKDF2-SHA256 200 000 rounds + AES-GCM 256). The repo is public: never commit the plain
// text. Usage:
//   node tools/td_pack.mjs enc plain.json <password>   → prints the line for world_casterton.js (topdorm:{…})
//   node tools/td_pack.mjs dec <password>              → prints the plain JSON read from src/world_casterton.js
import fs from 'node:fs';
const sub=globalThis.crypto.subtle, b64=u=>Buffer.from(u).toString('base64'), ub=s=>new Uint8Array(Buffer.from(s,'base64'));
async function key(pw,salt,it){ const base=await sub.importKey('raw',new TextEncoder().encode(String(pw).trim().toLowerCase()),'PBKDF2',false,['deriveKey']);
  return sub.deriveKey({name:'PBKDF2',salt,iterations:it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); }
const [cmd,a,b]=process.argv.slice(2);
if(cmd==='enc'){ const it=200000, salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
  const pt=new TextEncoder().encode(JSON.stringify(JSON.parse(fs.readFileSync(a,'utf8'))));
  const ct=new Uint8Array(await sub.encrypt({name:'AES-GCM',iv},await key(b,salt,it),pt));
  console.log(JSON.stringify({it,s:b64(salt),i:b64(iv),c:b64(ct)})); }
else if(cmd==='dec'){ const src=fs.readFileSync(new URL('../src/world_casterton.js',import.meta.url),'utf8'); const m=src.match(/topdorm:(\{"it":[^}]*\})/); if(!m) throw new Error('no topdorm pack');
  const o=JSON.parse(m[1]); const pt=await sub.decrypt({name:'AES-GCM',iv:ub(o.i)},await key(a,ub(o.s),o.it),ub(o.c)); console.log(new TextDecoder().decode(pt)); }
else console.log('node tools/td_pack.mjs enc plain.json <password> | dec <password>');
