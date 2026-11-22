// English for the game (Casterton): every visible Spanish text in the engine and the world file is a string literal or a
// template literal; en.json maps each one (by its Spanish text) to English. At build time `apply` rewrites each literal
// as (VG_EN?"English":"Spanish"), so one page carries both and the language is chosen when it loads (localStorage
// vg_lang). Template literals keep their ${…}: the key numbers them ${0}, ${1}… and the English may reorder them.
//   node src/i18n/i18n.mjs extract <file.js> [module names…]  → JSON list of the texts still missing in en.json
//   node src/i18n/i18n.mjs apply < engine.js > engine_en.js     (also: apply-world)
//   node src/i18n/i18n.mjs html < template.html                  → JSON list of static texts in the page
import fs from 'node:fs'; import * as acorn from './acorn.mjs';
const DIR=new URL('.',import.meta.url).pathname;
export const DICT=()=>{ const o={}; for(const f of fs.readdirSync(DIR).filter(f=>/^en.*\.json$/.test(f)).sort()) Object.assign(o,JSON.parse(fs.readFileSync(DIR+f,'utf8'))); return o; };
export function isText(s){ const t=s.replace(/<[^>]*>/g,' ').replace(/\$\{\d+\}/g,' ').replace(/&[a-z#0-9]+;/g,' ').trim();
  if(!/[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}/.test(t)) return false;
  if(/\b(vec[234]|gl_[A-Za-z]+|uniform|varying|void main|precision |texture2D)\b/.test(s)) return false;
  if(/^[#.]?[a-z][\w-]*$/.test(t)||/^[a-z_][\w]*$/.test(t)) return false;
  if(/^(https?:|data:|\.\/|\/|vg_)/.test(t)) return false;
  if(/^[\w-]+:[^ ]/.test(t)&&/;/.test(t)) return false;
  if(/^[\w-]+(\s*,\s*[\w-]+)+$/.test(t)&&!/[áéíóúñ]/.test(t)&&t===t.toLowerCase()) return false;
  return /[áéíóúñ¿¡ÁÉÍÓÚÑ]/.test(t)||/\s/.test(t)||/^[A-ZÁÉÍÓÚ][a-záéíóúñ]+/.test(t); }
function parse(code){ return acorn.parse(code,{ecmaVersion:'latest',allowReturnOutsideFunction:true,allowAwaitOutsideFunction:true,sourceType:'script'}); }
// the literals that can be swapped: not object keys, not directives, not tagged templates
function targets(code){ const ast=parse(code), out=[];
  (function walk(n,p){ if(!n||typeof n.type!=='string') return;
    if(n.type==='Literal'&&typeof n.value==='string'){ const key=(p&&(p.type==='Property'||p.type==='MethodDefinition'||p.type==='PropertyDefinition')&&p.key===n&&!p.computed)||(p&&p.type==='ExpressionStatement'&&p.directive)||(p&&/Import|Export/.test(p.type));
      if(!key) out.push({n,k:n.value}); }
    else if(n.type==='TemplateLiteral'&&!(p&&p.type==='TaggedTemplateExpression')){ let k='`'; n.quasis.forEach((q,i)=>{ k+=q.value.raw; if(i<n.expressions.length) k+='${'+i+'}'; }); out.push({n,k,t:1}); }
    for(const f in n){ if(f==='type'||f==='start'||f==='end') continue; const v=n[f]; if(Array.isArray(v)) v.forEach(c=>walk(c,n)); else if(v&&typeof v==='object'&&typeof v.type==='string') walk(v,n); } })(ast,null);
  return out; }
export function extract(code,ranges){ const D=DICT(), seen=new Set(), res=[];
  for(const t of targets(code)){ if(!isText(t.k)||t.k in D) continue; let m=''; if(ranges) for(const r of ranges) if(t.n.start>=r[1]&&t.n.start<r[2]) m=r[0]; if(ranges&&!m) continue; if((m+'|'+t.k) in D||seen.has(m+'|'+t.k)) continue; seen.add(m+'|'+t.k); res.push({m,k:t.k}); }
  return res; }
// ranges = [[module, start, end]…] of the engine: a key 'g3fl.js|Subir' wins over 'Subir' inside that module
export function apply(code,ranges){ const D=DICT(), mod=t=>{ if(ranges) for(const r of ranges) if(t.n.start>=r[1]&&t.n.start<r[2]) return r[0]; return ''; };
  const T=targets(code).map(t=>{ const o=D[mod(t)+'|'+t.k]; if(typeof o==='string') t.en=o; else t.en=D[t.k]; return t; }).filter(t=>typeof t.en==='string'&&t.en!==t.k).sort((a,b)=>a.n.start-b.n.start);
  let i=0; const emit=(s,e)=>{ let o='', at=s; while(i<T.length&&T[i].n.start<e){ const t=T[i++]; if(t.n.start<at) continue; o+=code.slice(at,t.n.start)+one(t); at=t.n.end; } return o+code.slice(at,e); };
  const one=t=>{ const en=t.en, es=code.slice(t.n.start,t.n.end);
    if(!t.t) return '(VG_EN?'+JSON.stringify(en)+':'+es+')';
    const ex=t.n.expressions.map(x=>{ const save=i; const s=emit(x.start,x.end); return s; });
    // the Spanish side: the original template with its expressions already rewritten
    let esT='`'; t.n.quasis.forEach((q,j)=>{ esT+=q.value.raw; if(j<ex.length) esT+='${'+ex[j]+'}'; }); esT+='`';
    const enT='`'+en.slice(1).replace(/\$\{(\d+)\}/g,(m,d)=>'${'+ex[+d]+'}')+'`';
    return '(VG_EN?'+enT+':'+esT+')'; };
  return emit(0,code.length); }
const [cmd,...args]=process.argv.slice(2);
if(cmd==='extract'){ const code=fs.readFileSync(args[0],'utf8'); let ranges=null;
  if(args[1]==='--mods'){ ranges=JSON.parse(fs.readFileSync(args[2],'utf8')); }
  console.log(JSON.stringify(extract(code,ranges),null,0)); }
else if(cmd==='apply'){ const code=fs.readFileSync(0,'utf8'); process.stdout.write(apply(code,process.env.I18N_RANGES?JSON.parse(fs.readFileSync(process.env.I18N_RANGES,'utf8')):null)); }
