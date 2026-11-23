/* ===== g3sc.js: S2 · el colegio por dentro (Casterton: WP.school) ===== */
// The rooms are of our own design (the real ones are not public): the plan is laid out on the real footprint of the
// main building, with a corridor in the shape of a cross, and the villa interior builder (g3d.js) puts up the walls,
// the windows and the walking grid. No boarding houses, no names or photos of pupils or teachers, no crest.
var SC={b:null,tried:false,F:null,P:null,hemi:null,out:null};
const SC_TH={id:'colegio',n:'Colegio',floor:'terrazzo',fc:'#cfc8bb',wall:'#f3f0e8',acc:'#2f6bd6',wood:'#c9a97c',wood2:'#8a6a48',fab:'#3f6fb0',fab2:'#9b2d2d',metal:'#5b6168',stone:'#e8e4dc',rug:['plain','#d9534f','#f2c230','#2f6bd6'],curtain:'#9b2d2d',pot:'#e8e2d6',special:'school'};
const SC_EXTRA=['Aula de lengua','Aula de historia','Sala de profesores','Aula de estudio','Aula de teatro','Aula de apoyo','Aula de francés','Aula de religión'];
const SC_CH=1.6, SC_SU=10.5, SC_SV=9;
const SC_KINDS=[['reception','Recepción'],['library','Biblioteca'],['math','Aula de matemáticas'],['science','Laboratorio de ciencias'],['art','Aula de arte'],['music','Aula de música'],['ict','Aula de informática'],['geo','Aula de geografía'],['lang','Aula de idiomas'],['infant','Aula de los pequeños'],['hall','Salón de actos'],['dining','Comedor']];
const SC_TXT={reception:'el mostrador, los sofás, el tablón y la vitrina de copas',library:'estanterías llenas, mesas de lectura y un rincón con pufs',math:'la pizarra con cuentas (y tú puedes hacer las tuyas)',science:'mesas de laboratorio con fregadero, taburetes y frascos',art:'mesas grandes, caballetes y cuadros de los alumnos',music:'piano, batería, atriles y sillas en semicírculo',ict:'ordenadores en fila y una pantalla',geo:'el mapa del mundo y la bola del mundo',lang:'palabras en tres idiomas',infant:'una alfombra de colores, mesas bajitas y juguetes',hall:'el escenario con su telón y filas de sillas',dining:'mesas largas con bancos y la barra de la comida',corridor:'el pasillo en cruz que une todas las salas',store:'estanterías con cajas',class:'pupitres y pizarra'};
const GR_TH={id:'grange',n:'Casterton Grange',floor:'herring',fc:'#7a5232',wall:'#efe6d2',acc:'#b8913a',wood:'#5a3a22',wood2:'#3a2416',fab:'#7d2a2a',fab2:'#c9a24a',metal:'#b8913a',stone:'#e8e1d2',rug:['persian','#7d2a2a','#d9b37a','#23314a'],curtain:'#8a6a3a',pot:'#3f5a3a',special:'school'};
const GR_KINDS=[['ggold','Salón dorado'],['gdining','Comedor'],['gbillar','Sala de billar y bar'],['gcons','Invernadero'],['gkitchen','Cocina'],['gstudy','Estudio'],['gsnug','Salita'],['gboot','Guardarropa']];
Object.assign(SC_TXT,{ggold:'sofás dorados, chimenea con espejo, piano de cola y lámpara de araña',gdining:'la mesa larga con sus sillas, el aparador y los candelabros',gbillar:'la mesa de billar, los tacos y la barra con taburetes',gcons:'butacas de mimbre, una mesa redonda y muchas plantas',gkitchen:'la isla, el fogón grande y los armarios',gstudy:'el escritorio, las estanterías con libros y la bola del mundo',gsnug:'un sofá, butacas, la tele y la chimenea',gboot:'perchas, botas de agua y bancos'});
const SC_SPEC={school:{key:'school',n:'Colegio',ent:'Entrar en el colegio',plan:'Plano del colegio (planta baja)',tour:'Recorrido del colegio',su:SC_SU,sv:SC_SV,ch:SC_CH,corr:'Pasillos y entrada',first:['reception','Recepción'],big:[['hall','Salón de actos'],['dining','Comedor']],kinds:SC_KINDS,extra:SC_EXTRA,ek:'class',store:['store','Almacén']},
  grange:{key:'grange',n:'Casterton Grange',ent:'Entrar en Casterton Grange',plan:'Plano de Casterton Grange (planta baja)',tour:'Recorrido de Casterton Grange',su:7.5,sv:7,ch:1.5,corr:'Vestíbulo y pasillos',first:['ggold','Salón dorado'],big:[['gdining','Comedor'],['gbillar','Sala de billar y bar']],kinds:GR_KINDS,extra:['Salita del jardín','Sala de juegos','Sala de música'],ek:'gsnug',store:['gboot','Guardarropa'],storeN:['Guardarropa','Despensa','Aseo','Bodega','Lavadero','Cuarto de las botas','Trastero']}};
var GR={b:null,tried:false,out:null};
function grB(){ const C=WP.campo&&WP.campo.grange; if(GR.b||GR.tried||!C) return GR.b; if(!BLD.length) return null; GR.tried=true; GR.b=BLD.find(b=>b.id===C.id&&b.ring)||null; return GR.b; }
function scIsGr(b){ return !!b&&!!WP.campo&&!!WP.campo.grange&&b===grB(); }
function scSpec(b){ return scIsGr(b||(S.interior&&S.interior.b))?SC_SPEC.grange:SC_SPEC.school; }
function scTheme(b){ return scIsGr(b)?GR_TH:SC_TH; }
function scB(){ if(SC.b||SC.tried||!WP.school) return SC.b; if(!BLD.length) return null; SC.tried=true; SC.b=BLD.find(b=>b.id===WP.school.id&&b.ring)||null; return SC.b; }
function scIs(b){ return (!!WP.school&&!!b&&b===scB())||scIsGr(b); }
// the frame of the building: u along its longest wall, v across; uc, vc = the middle of its floor
function scFrame(b){ if(SC.F&&SC.F.b===b) return SC.F; const r=b.ring; let best=0,ang=0; for(let i=0;i<r.length;i++){ const a=r[i], c=r[(i+1)%r.length]; const L=Math.hypot(c[0]-a[0],c[1]-a[1]); if(L>best){ best=L; ang=Math.atan2(c[1]-a[1],c[0]-a[0]); } }
  const ca=Math.cos(ang), sa=Math.sin(ang), ox=b.c[0], oz=b.c[1];
  const toL=(x,z)=>[(x-ox)*ca+(z-oz)*sa,-(x-ox)*sa+(z-oz)*ca], toW=(u,v)=>[ox+u*ca-v*sa,oz+u*sa+v*ca];
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9; for(const p of r){ const q=toL(p[0],p[1]); u0=Math.min(u0,q[0]); u1=Math.max(u1,q[0]); v0=Math.min(v0,q[1]); v1=Math.max(v1,q[1]); }
  const inL=(u,v,m)=>{ const p=toW(u,v); if(!inBld(b,p[0],p[1])) return false; return !m||nearestEdge(b,p[0],p[1])[0]>m; };
  let su=0,sv=0,n=0; for(let u=u0;u<=u1;u+=1) for(let v=v0;v<=v1;v+=1) if(inL(u,v)){ su+=u; sv+=v; n++; }
  const dW=(du,dv)=>[du*ca-dv*sa,du*sa+dv*ca];
  return SC.F={b,ang,ca,sa,toL,toW,dW,inL,u0,u1,v0,v1,uc:n?su/n:0,vc:n?sv/n:0}; }
function scCuts(a0,a1,c,step,ch){ ch=ch||SC_CH; const L=[], lo=c-ch, hi=c+ch;
  const nL=Math.max(1,Math.round((lo-a0)/step)); for(let k=0;k<nL;k++) L.push([a0+(lo-a0)*k/nL,a0+(lo-a0)*(k+1)/nL,0]);
  L.push([lo,hi,1]); const nR=Math.max(1,Math.round((a1-hi)/step)); for(let k=0;k<nR;k++) L.push([hi+(a1-hi)*k/nR,hi+(a1-hi)*(k+1)/nR,0]); return L; }
// the four ends of the corridor cross; the entrance is the one nearest the car park (WP.school.ref)
function scEnds(F){ const E=[]; for(const [du,dv] of [[1,0],[-1,0],[0,1],[0,-1]]){ let t=0; while(t<200&&F.inL(F.uc+du*(t+0.5),F.vc+dv*(t+0.5))) t+=0.5; E.push({u:F.uc+du*t,v:F.vc+dv*t,du,dv}); } return E; }
function scDoorOut(b){ const F=scFrame(b), R=(scIsGr(b)?WP.campo.grange.ref:WP.school.ref)||[0,0]; let best=null,bd=1e9; for(const e of scEnds(F)){ const p=F.toW(e.u,e.v), d=Math.hypot(p[0]-R[0],p[1]-R[1]); if(d<bd){ bd=d; best=e; } } const o=F.dW(best.du,best.dv), p=F.toW(best.u,best.v); return [p[0]+o[0]*0.6,p[1]+o[1]*0.6,best]; }
function scPlan(b){ const F=scFrame(b), {toW,toL,inL}=F, SP=scSpec(b); const UI=scCuts(F.u0,F.u1,F.uc,SP.su,SP.ch), VI=scCuts(F.v0,F.v1,F.vc,SP.sv,SP.ch);
  const ic=UI.findIndex(q=>q[2]), jc=VI.findIndex(q=>q[2]); const cellAt=[], cells=[];
  for(let i=0;i<UI.length;i++){ cellAt.push([]); for(let j=0;j<VI.length;j++){ const U=UI[i], V=VI[j], corr=!!(U[2]||V[2]); let k=0; for(let a=0;a<6;a++) for(let c=0;c<6;c++) if(inL(U[0]+(U[1]-U[0])*(a+0.5)/6,V[0]+(V[1]-V[0])*(c+0.5)/6)) k++;
    const C={i,j,u0:U[0],u1:U[1],v0:V[0],v1:V[1],corr,f:k/36,A:k/36*(U[1]-U[0])*(V[1]-V[0]),room:corr?0:-1}; cellAt[i].push(C); if(!corr&&C.f>0.12) cells.push(C); } }
  const rooms=[{id:0,kind:'corridor',name:SP.corr,cells:[]}]; const add=(kind,name,cs)=>{ const id=rooms.length; rooms.push({id,kind,name,cells:cs}); for(const c of cs) c.room=id; return id; };
  // the assembly hall and the dining hall: the two biggest pairs of neighbouring cells
  const pairs=[]; for(const C of cells){ if(C.f<0.62) continue; for(const D of [cellAt[C.i+1]&&cellAt[C.i+1][C.j],cellAt[C.i][C.j+1]]) if(D&&!D.corr&&D.f>=0.62&&cells.includes(D)) pairs.push([C,D,C.A+D.A]); }
  pairs.sort((p,q)=>q[2]-p[2]); const used=new Set(); const big=[]; for(const p of pairs){ if(used.has(p[0])||used.has(p[1])) continue; big.push(p); used.add(p[0]); used.add(p[1]); if(big.length===2) break; }
  const dOut=scDoorOut(b), ent=dOut[2], entW=F.toW(ent.u,ent.v);
  // the reception: the cell next to the corridor nearest the entrance
  const adj=C=>Math.abs(C.i-ic)===1||Math.abs(C.j-jc)===1; let rc=null,rd=1e9; for(const C of cells){ if(used.has(C)||!adj(C)||C.f<0.35) continue; const p=toW((C.u0+C.u1)/2,(C.v0+C.v1)/2), d=Math.hypot(p[0]-entW[0],p[1]-entW[1]); if(d<rd){ rd=d; rc=C; } }
  if(rc){ add(SP.first[0],SP.first[1],[rc]); used.add(rc); }
  const rest=cells.filter(C=>!used.has(C)).sort((p,q)=>q.A-p.A); const KS=SP.kinds.filter(k=>k[0]!==SP.first[0]&&!SP.big.some(q=>q[0]===k[0])&&k[0]!==SP.store[0]); let ka=0, na=1, ns=0;
  for(const C of rest){ if(ka<KS.length&&C.f>=0.4){ add(KS[ka][0],KS[ka][1],[C]); ka++; } else if(C.f<0.45) add(SP.store[0],SP.storeN?SP.storeN[(ns++)%SP.storeN.length]:SP.store[1],[C]); else add(SP.ek,SP.extra[(na++)%SP.extra.length],[C]); }
  if(big[0]) add(SP.big[0][0],SP.big[0][1],[big[0][0],big[0][1]]); if(big[1]) add(SP.big[1][0],SP.big[1][1],[big[1][0],big[1][1]]);
  const roomOf=C=>!C?-1:C.corr?(C.f>0.02?0:-1):C.room;
  // one door per room, on the side it shares with the corridor (or, if none, with the room on the way to it)
  const doorsL=[]; const side=(C,s)=>{ // s: 'u0','u1','v0','v1' -> run of the inside part of that side
    const onU=s[0]==='u', c=onU?(s[1]==='0'?C.u0:C.u1):(s[1]==='0'?C.v0:C.v1), a0=onU?C.v0:C.u0, a1=onU?C.v1:C.u1; let bst=null,cur=null;
    for(let t=a0+0.3;t<=a1-0.3;t+=0.25){ const ok=onU?inL(c-0.4,t,0.15)&&inL(c+0.4,t,0.15):inL(t,c-0.4,0.15)&&inL(t,c+0.4,0.15); if(ok){ if(!cur) cur=[t,t]; cur[1]=t; if(!bst||cur[1]-cur[0]>bst[1]-bst[0]) bst=cur.slice(); } else cur=null; }
    return bst?{s,onU,c,t0:bst[0],t1:bst[1]}:null; };
  for(const R of rooms){ if(!R.id) continue; const w=SP.big.some(q=>q[0]===R.kind)?2.0:1.2; let pick=null;
    for(const C of R.cells){ const cand=[]; if(C.i===ic-1) cand.push('u1'); if(C.i===ic+1) cand.push('u0'); if(C.j===jc-1) cand.push('v1'); if(C.j===jc+1) cand.push('v0');
      for(const s of cand){ const q=side(C,s); if(q&&q.t1-q.t0>w+0.3&&(!pick||q.t1-q.t0>pick.t1-pick.t0)) pick=Object.assign(q,{C}); } }
    if(!pick) for(const C of R.cells){ const cand=[[C.i<ic?'u1':'u0',C.i<ic?[C.i+1,C.j]:[C.i-1,C.j]],[C.j<jc?'v1':'v0',C.j<jc?[C.i,C.j+1]:[C.i,C.j-1]]];
      for(const [s,n] of cand){ const D=cellAt[n[0]]&&cellAt[n[0]][n[1]]; if(!D||roomOf(D)<0||roomOf(D)===R.id) continue; const q=side(C,s); if(q&&q.t1-q.t0>w+0.3&&(!pick||q.t1-q.t0>pick.t1-pick.t0)) pick=Object.assign(q,{C}); } }
    if(!pick) continue; const tm=(pick.t0+pick.t1)/2; const d={onU:pick.onU,c:pick.c,t0:tm-w/2,t1:tm+w/2,room:R.id};
    const inward=pick.s[1]==='0'?1:-1, nL=pick.onU?[inward,0]:[0,inward], p=pick.onU?toW(pick.c,tm):toW(tm,pick.c), nW=F.dW(nL[0],nL[1]);
    R.door={x:p[0],z:p[1],nx:nW[0],nz:nW[1],side:pick.s,C:pick.C}; doorsL.push(d); }
  // the walls: every cut line between two different rooms (the corridor counts as one), kept where it is inside the building
  const walls=[]; const wallRun=(onU,c,a0,a1)=>{ const ds=doorsL.filter(d=>d.onU===onU&&Math.abs(d.c-c)<1e-6&&d.t0>=a0-0.01&&d.t1<=a1+0.01); let cur=null; const runs=[];
    for(let t=a0;t<=a1+1e-6;t+=0.25){ const tt=Math.min(t,a1), ok=onU?inL(c,tt,0.12):inL(tt,c,0.12); if(ok){ if(!cur) cur=[tt,tt]; cur[1]=tt; } else if(cur){ runs.push(cur); cur=null; } } if(cur) runs.push(cur);
    for(const r of runs){ if(r[1]-r[0]<0.3) continue; const A=onU?toW(c,r[0]):toW(r[0],c), B=onU?toW(c,r[1]):toW(r[1],c); walls.push({a:A,b:B,doors:ds.filter(d=>d.t0>=r[0]&&d.t1<=r[1]).map(d=>[d.t0-r[0],d.t1-r[0]]).sort((p,q)=>p[0]-q[0])}); } };
  for(let i=0;i<UI.length-1;i++) for(let j=0;j<VI.length;j++){ const L=roomOf(cellAt[i][j]), R=roomOf(cellAt[i+1][j]); if(L<0||R<0||L===R) continue; wallRun(true,UI[i][1],VI[j][0],VI[j][1]); }
  for(let j=0;j<VI.length-1;j++) for(let i=0;i<UI.length;i++){ const L=roomOf(cellAt[i][j]), R=roomOf(cellAt[i][j+1]); if(L<0||R<0||L===R) continue; wallRun(false,VI[j][1],UI[i][0],UI[i][1]); }
  const pieces=[], doors=[]; for(const w of walls){ const ex=w.b[0]-w.a[0], ez=w.b[1]-w.a[1], Lw=Math.hypot(ex,ez); if(Lw<0.05) continue; const ux=ex/Lw, uz=ez/Lw; let t=0;
    for(const d of w.doors){ if(d[0]>t+0.05) pieces.push([[w.a[0]+ux*t,w.a[1]+uz*t],[w.a[0]+ux*d[0],w.a[1]+uz*d[0]]]); doors.push([[w.a[0]+ux*d[0],w.a[1]+uz*d[0]],[w.a[0]+ux*d[1],w.a[1]+uz*d[1]]]); t=d[1]; }
    if(Lw>t+0.05) pieces.push([[w.a[0]+ux*t,w.a[1]+uz*t],[w.b[0],w.b[1]]]); }
  // each room's rectangle (the union of its cells)
  for(const R of rooms){ if(!R.id) continue; const r=[1e9,-1e9,1e9,-1e9]; for(const C of R.cells){ r[0]=Math.min(r[0],C.u0); r[1]=Math.max(r[1],C.u1); r[2]=Math.min(r[2],C.v0); r[3]=Math.max(r[3],C.v1); } R.rect=r; R.area=R.cells.reduce((a,C)=>a+C.A,0); }
  const find=(I,x)=>{ for(let k=0;k<I.length;k++) if(x>=I[k][0]-1e-6&&x<=I[k][1]+1e-6) return k; return -1; };
  const roomAt=(x,z)=>{ const q=toL(x,z), i=find(UI,q[0]), j=find(VI,q[1]); if(i<0||j<0) return 0; const C=cellAt[i][j]; const r=roomOf(C); return r<0?0:r; };
  SC.P={F,UI,VI,ic,jc,cellAt,rooms,ent,entW,SP};
  return {ang:F.ang,toL,toW,u0:F.u0,u1:F.u1,v0:F.v0,v1:F.v1,runs:()=>[],walls,pieces,doors,school:true,rooms:rooms.map(R=>({id:R.id,kind:R.kind,name:R.name})),roomAt}; }
// windows: the building's walls become 3 m panels with a window each (the shell, with no holes, is hidden while you are inside)
function scPrep(b){ if(b.panels&&b.panels.length) return; const P=[]; const r=b.ring; for(let i=0;i<r.length;i++){ const a=r[i], c=r[(i+1)%r.length], L=Math.hypot(c[0]-a[0],c[1]-a[1]); const n=Math.floor(L/3); if(n<1) continue; const st=(L-n*3)/2;
  for(let k=0;k<n;k++){ const t0=st+k*3, t1=t0+3; P.push({p0:[a[0]+(c[0]-a[0])*t0/L,a[1]+(c[1]-a[1])*t0/L],p1:[a[0]+(c[0]-a[0])*t1/L,a[1]+(c[1]-a[1])*t1/L],ty:2,nc:true}); } } b.panels=P; }
function scMats(){ return {scChairR:IM({color:'#d6442a',roughness:0.45}),scChairB:IM({color:'#2f6bd6',roughness:0.45}),scChairY:IM({color:'#f2c230',roughness:0.45}),scChairG:IM({color:'#3f9a4c',roughness:0.45}),
  scBoard:IM({color:'#fbfbf8',roughness:0.25}),scCork:IM({color:'#b98a55',roughness:1}),scBench:IM({color:'#e9e6df',roughness:0.35}),scBook1:IM({color:'#7a2f2f',roughness:0.8}),scBook2:IM({color:'#2f4f7a',roughness:0.8}),scBook3:IM({color:'#3f6a3a',roughness:0.8}),scBook4:IM({color:'#c9a03a',roughness:0.8}),scStage:IM({color:'#6b4b2e',roughness:0.55}),scKeys:IM({color:'#f7f5ee',roughness:0.3})}; }

/* ---- textures of our own: boards and posters ---- */
function scTx(k,w,h,fn){ return txc('sc'+k,()=>canvasTex(w,h,fn)); }
function scBoardTex(kind){ return scTx('bd'+kind,512,192,(g,w,h)=>{ g.fillStyle='#fbfbf8'; g.fillRect(0,0,w,h); g.strokeStyle='#9aa0a6'; g.lineWidth=8; g.strokeRect(4,4,w-8,h-8); g.textAlign='left'; g.textBaseline='middle';
  const T=(t,x,y,c,s)=>{ g.fillStyle=c||'#1d4fa8'; g.font='700 '+(s||30)+'px "Comic Sans MS", system-ui, sans-serif'; g.fillText(t,x,y); };
  if(kind==='math'){ T('7 + 5 = 12',24,44); T('15 − 8 = 7',24,96,'#c0392b'); T('23 + 19 = 42',24,148,'#1f8a43'); T('9 + ? = 14',290,44,'#1d4fa8'); T('50 − 26 = ?',290,96,'#c0392b'); g.strokeStyle='#1d4fa8'; g.lineWidth=3; g.beginPath(); g.moveTo(290,150); g.lineTo(490,150); g.stroke(); for(let k=0;k<=10;k++){ g.beginPath(); g.moveTo(290+k*20,142); g.lineTo(290+k*20,158); g.stroke(); } }
  else if(kind==='science'){ T('El ciclo del agua',24,40); T('☁  lluvia → río → mar → vapor',24,96,'#1f8a43',26); T('H₂O',24,150,'#c0392b',36); T('100 °C: hierve',200,150,'#1d4fa8',26); }
  else if(kind==='geo'){ T('Continentes',24,40); T('Europa · Asia · África',24,96,'#1f8a43',26); T('América · Oceanía · Antártida',24,146,'#c0392b',26); }
  else if(kind==='lang'){ T('Hello  ·  Hola  ·  Bonjour',24,50); T('Thank you · Gracias · Merci',24,104,'#c0392b',26); T('Friend · Amigo · Ami',24,152,'#1f8a43',26); }
  else if(kind==='music'){ g.strokeStyle='#1d1d1d'; g.lineWidth=2; for(let k=0;k<5;k++){ g.beginPath(); g.moveTo(24,54+k*16); g.lineTo(w-24,54+k*16); g.stroke(); } g.fillStyle='#1d1d1d'; [[80,110],[140,102],[200,94],[260,86],[320,94],[380,102],[440,110]].forEach(([x,y])=>{ g.beginPath(); g.ellipse(x,y,9,7,-0.4,0,7); g.fill(); g.fillRect(x+7,y-40,3,40); }); T('Do Re Mi Fa Sol La Si',24,170,'#c0392b',22); }
  else if(kind==='infant'){ T('A B C  ·  1 2 3',24,60,'#c0392b',40); ['#d6442a','#f2c230','#2f6bd6','#3f9a4c','#9b59b6'].forEach((c,k)=>{ g.fillStyle=c; g.beginPath(); g.arc(60+k*90,140,26,0,7); g.fill(); }); }
  else if(kind==='ict'){ g.fillStyle='#eaf2fb'; g.fillRect(16,16,w-32,h-32); T('Hoy: programar un robot',24,60); T('adelante · gira · repite 4',24,120,'#1f8a43',26); }
  else { T('Hoy: lectura y escritura',24,60); T('Deberes: página 12',24,120,'#c0392b',26); } }); }
function scPosterTex(kind){ return scTx('po'+kind,256,256,(g,w,h)=>{ g.fillStyle='#fffdf6'; g.fillRect(0,0,w,h); g.strokeStyle='#2b2f33'; g.lineWidth=6; g.strokeRect(3,3,w-6,h-6);
  if(kind==='map'){ g.fillStyle='#8fc3e8'; g.fillRect(12,12,w-24,h-24); g.fillStyle='#6aa84f'; [[60,80,40,34],[70,150,22,40],[128,70,22,26],[136,128,26,40],[188,86,46,34],[200,170,22,14],[128,226,60,8]].forEach(([x,y,a,b])=>{ g.beginPath(); g.ellipse(x,y,a,b,0.3,0,7); g.fill(); }); }
  else if(kind==='shapes'){ const cs=['#d6442a','#2f6bd6','#f2c230','#3f9a4c']; g.fillStyle=cs[0]; g.fillRect(30,30,80,80); g.fillStyle=cs[1]; g.beginPath(); g.arc(180,70,42,0,7); g.fill(); g.fillStyle=cs[2]; g.beginPath(); g.moveTo(70,150); g.lineTo(120,230); g.lineTo(20,230); g.fill(); g.fillStyle=cs[3]; g.beginPath(); for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; g.lineTo(180+Math.cos(a)*44,190+Math.sin(a)*44); } g.fill(); }
  else if(kind==='table'){ const cs=['#f4a261','#e9c46a','#8ecae6','#90be6d','#cdb4db']; for(let r=0;r<7;r++) for(let c=0;c<9;c++){ if(r<2&&c>0&&c<8) continue; g.fillStyle=cs[(r+c)%5]; g.fillRect(14+c*25.5,20+r*31,23,28); } }
  else if(kind==='words'){ g.fillStyle='#2f6bd6'; g.font='800 34px system-ui, sans-serif'; g.textAlign='center'; g.fillText('HELLO',w/2,70); g.fillStyle='#d6442a'; g.fillText('HOLA',w/2,135); g.fillStyle='#3f9a4c'; g.fillText('BONJOUR',w/2,200); }
  else if(kind==='notice'){ g.fillStyle='#b98a55'; g.fillRect(8,8,w-16,h-16); const cs=['#ffffff','#fff3b0','#cde7ff','#ffd6d6','#d9f2d0']; for(let k=0;k<9;k++){ g.fillStyle=cs[k%5]; const x=20+(k%3)*76, y=22+Math.floor(k/3)*76; g.save(); g.translate(x+33,y+30); g.rotate((k%4-1.5)*0.06); g.fillRect(-30,-28,60,56); g.fillStyle='#d6442a'; g.beginPath(); g.arc(0,-24,4,0,7); g.fill(); g.restore(); } }
  else if(kind==='notes'){ g.fillStyle='#1d1d1d'; g.font='800 120px serif'; g.textAlign='center'; g.fillText('♪♫',w/2,170); }
  else { const R=rng(kind.length*17+3); for(let k=0;k<7;k++){ g.fillStyle=['#d6442a','#2f6bd6','#f2c230','#3f9a4c','#9b59b6','#e8742c'][k%6]; g.beginPath(); g.arc(30+R()*196,30+R()*196,14+R()*36,0,7); g.fill(); } } }); }

/* ---- furniture ---- */
// a room's frame for laying out furniture: s = metres from the front wall into the room, t = across (0 in the middle)
function scRoomFrame(R,floor){ const F=SC.P.F, r=R.rect, rr={u0:r[0],u1:r[1],v0:r[2],v1:r[3]}; const ds=R.door?R.door.side:'v0';
  const inside=(u,v)=>F.inL(u,v,0.5); const frac=s=>{ let k=0,n=0; const onU=s[0]==='u', c=s==='u0'?rr.u0-0.9:s==='u1'?rr.u1+0.9:s==='v0'?rr.v0-0.9:rr.v1+0.9, a0=onU?rr.v0:rr.u0, a1=onU?rr.v1:rr.u1; for(let t=a0+0.5;t<a1;t+=1){ n++; if(onU?F.inL(c,t):F.inL(t,c)) k++; } return n?k/n:0; };
  const perp=ds[0]==='u'?['v0','v1']:['u0','u1'], opp=ds==='u0'?'u1':ds==='u1'?'u0':ds==='v0'?'v1':'v0'; let fs=perp.sort((a,b)=>frac(b)-frac(a))[0];
  const ext=s=>s[0]==='u'?rr.u1-rr.u0:rr.v1-rr.v0; if(ext(fs)<5.5) fs=opp;
  const cu=(rr.u0+rr.u1)/2, cv=(rr.v0+rr.v1)/2; const depth=fs[0]==='u'?rr.u1-rr.u0:rr.v1-rr.v0, width=fs[0]==='u'?rr.v1-rr.v0:rr.u1-rr.u0;
  const L=(s,t)=>fs==='v0'?[cu+t,rr.v0+s]:fs==='v1'?[cu-t,rr.v1-s]:fs==='u0'?[rr.u0+s,cv-t]:[rr.u1-s,cv+t];
  const fL=fs==='v0'?[0,-1]:fs==='v1'?[0,1]:fs==='u0'?[-1,0]:[1,0];
  const W=(s,t)=>{ const q=L(s,t); return F.toW(q[0],q[1]); }, fw=F.dW(fL[0],fL[1]);
  return {fs,depth,width,L,W,fw,inside,rr}; }
function scFurnish(E){ const {G,M,I,floor,ceil,grp,lights,downs}=E; const fl=floor, F=SC.P.F, P=SC.P; let np=0;
  const ang=f=>Math.atan2(f[0],-f[1]);   // a ctx angle whose local -z points along f (world)
  const rot=(f,k)=>{ const c=Math.cos(k), s=Math.sin(k); return [f[0]*c-f[1]*s,f[0]*s+f[1]*c]; };
  const place=(p,a)=>{ const o=E.ctx(p[0],p[1],a); o.cx=p[0]; o.cz=p[1]; return o; };
  const DP=P.rooms.filter(R=>R.door).map(R=>[R.door.x,R.door.z]).concat([F.toW(P.ent.u,P.ent.v)]);
  const ok=(o,w,d,rid)=>{ for(const [x,z] of [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2],[0,-d/2],[0,d/2],[-w/2,0],[w/2,0],[0,0]]){ const q=o.at(x,z); if(!inBld(F.b,q[0],q[1])||nearestEdge(F.b,q[0],q[1])[0]<0.3) return false; if(E.ctxRoom&&E.ctxRoom(q[0],q[1])!==rid) return false; for(const dp of DP) if(Math.hypot(q[0]-dp[0],q[1]-dp[1])<1.7) return false; } return true; };
  const reg=(o,w,d,kind,top,tall)=>{ E.claim(o.cx,o.cz,o.a,w,d,kind,tall); if(top) E.solid(o.cx,o.cz,o.a,w,d,top); };
  const plane=(o,tex,lz,yc,w,h,back)=>{ const mat=IM({map:tex,roughness:0.6}); M['scPlane'+(np++)]=mat; const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat); const p=o.at(0,lz); m.position.set(p[0],fl+yc,p[1]); m.rotation.y=-o.a+(back?Math.PI:0); m.receiveShadow=true; grp.add(m); return m; };
  const roomAt=(x,z)=>{ const q=F.toL(x,z); const fi=(Ix,v)=>Ix.findIndex(a=>v>=a[0]-1e-6&&v<=a[1]+1e-6); const i=fi(P.UI,q[0]), j=fi(P.VI,q[1]); if(i<0||j<0) return 0; const C=P.cellAt[i][j]; return C.corr?0:C.room<0?0:C.room; };
  E.ctxRoom=roomAt;
  const chairM=['scChairR','scChairB','scChairY','scChairG'];
  const chair=(o,lx,lz,m,sc)=>{ sc=sc||1; const h=0.44*sc; o.bx(m,lx,h-0.03,lz,0.42*sc,0.04,0.4*sc); o.bx(m,lx,h,lz+0.19*sc,0.42*sc,0.4*sc,0.04); for(const [x,z] of [[-0.18,-0.17],[0.18,-0.17],[-0.18,0.17],[0.18,0.17]]) o.cy('metal',lx+x*sc,0,lz+z*sc,0.014,h-0.03); };
  const desk=(o,w,d,h,mat)=>{ o.bx(mat||'wood',0,h-0.03,0,w,0.03,d); for(const [x,z] of [[-w/2+0.04,-d/2+0.04],[w/2-0.04,-d/2+0.04],[-w/2+0.04,d/2-0.04],[w/2-0.04,d/2-0.04]]) o.cy('metal',x,0,z,0.018,h-0.03); };
  const shelf=(o,w,h,d,books)=>{ o.bx('wood2',0,0,0,w,0.05,d); o.bx('wood2',0,h-0.04,0,w,0.04,d); for(const x of [-w/2,w/2]) o.bx('wood2',x,0,0,0.04,h,d); o.bx('wood2',0,0,-d/2+0.01,w,h,0.02);
    const nS=Math.max(2,Math.floor(h/0.38)); for(let k=1;k<nS;k++){ const y=k*h/nS; o.bx('wood2',0,y,0,w,0.025,d); if(books){ let x=-w/2+0.06; const R=rng(Math.round(o.cx*7+o.cz*13+k)); while(x<w/2-0.08){ const bw=0.03+R()*0.04, bh=0.2+R()*0.1; o.bx('scBook'+(1+Math.floor(R()*4)),x+bw/2,y+0.025,0.02,bw,bh,d*0.72); x+=bw+0.004; } } } };
  const board=(o,kind,w)=>{ o.bx('frame',0,0.9,-0.02,w+0.08,1.3,0.04); plane(o,scBoardTex(kind),0.01,1.55,w,1.2*(w>2.6?1:0.9)); o.bx('metal',0,0.88,0.06,w*0.9,0.03,0.1); };
  const poster=(o,kind,lz,y,s)=>{ plane(o,scPosterTex(kind),lz,y,s,s); };
  const glow=(p)=>{ G.glow.bx(p[0],ceil-0.03,p[1],1.2,0.025,0.6,F.ang); };
  const lightsIn=(fr,R)=>{ for(let s=1.8;s<fr.depth-0.8;s+=3.2) for(let t=-fr.width/2+1.6;t<fr.width/2-0.8;t+=3.2){ const p=fr.W(s,t); if(roomAt(p[0],p[1])===R.id&&inBld(F.b,p[0],p[1])) glow(p); } };
  // pupils' desks in rows, facing the board
  const desksRows=(R,fr,o0)=>{ o0=o0||{}; const s0=o0.s0||2.7, ds=o0.ds||1.6, dt=o0.dt||1.8, w=o0.w||1.2, h=o0.h||0.72, sc=o0.sc||1; let n=0;
    for(let s=s0;s<fr.depth-0.9;s+=ds){ const cols=Math.max(1,Math.floor((fr.width-1.4)/dt)); for(let c=0;c<cols;c++){ const t=(c-(cols-1)/2)*dt; const o=place(fr.W(s,t),ang(fr.fw)); if(!ok(o,w+0.3,1.3,R.id)) continue;
      desk(o,w,0.55*sc,h); chair(o,-w/4,0.5*sc,chairM[(n+c)%4],sc); chair(o,w/4,0.5*sc,chairM[(n+c+1)%4],sc); reg(o,w,1.2*sc,'pupitre',h); n++; } } return n; };
  const front=(R,fr,kind,o1)=>{ o1=o1||{}; const bw=Math.min(3.6,fr.width-1.6); const ob=place(fr.W(0.08,0),ang(fr.fw)); board(ob,kind,bw); R.board=fr.W(0.9,0);
    if(!o1.noDesk){ const t=fr.width/2-1.5; const od=place(fr.W(1.4,t),ang(rot(fr.fw,Math.PI))); if(ok(od,1.4,0.7,R.id)){ desk(od,1.4,0.7,0.75,'wood2'); chair(od,0,-0.6,'black'); reg(od,1.4,1.2,'mesa del profesor',0.75); } } };
  const sideWall=(fr,s,sg)=>{ const t=sg*(fr.width/2-0.05); const f=rot(fr.fw,sg>0?Math.PI/2:-Math.PI/2); return place(fr.W(s,t),ang(f)); };
  for(const R of P.rooms){ if(!R.id||!R.rect) continue; const fr=scRoomFrame(R,fl); R.fr=fr; lightsIn(fr,R);
    const K=R.kind;
    if(['math','geo','lang','class'].includes(K)){ front(R,fr,K==='class'?'class':K); desksRows(R,fr);
      if(K==='math'){ poster(sideWall(fr,2.2,1),'shapes',0.02,1.6,0.9); poster(sideWall(fr,4.4,1),'table',0.02,1.6,0.9); }
      if(K==='geo'){ poster(sideWall(fr,2.6,1),'map',0.02,1.6,1.4); const og=place(fr.W(1.4,fr.width/2-1.5),0); og.cy('wood2',0,0.75,0,0.05,0.12); og.sp('blue',0,1.05,0,0.2,0.2,0.2); og.sp('green',0.06,1.1,0.05,0.12,0.1,0.1); }
      if(K==='lang'){ poster(sideWall(fr,2.6,1),'words',0.02,1.6,1.0); const os=sideWall(fr,4.6,-1); if(ok(os,1.6,0.5,R.id)){ shelf(os,1.6,1.2,0.4,true); reg(os,1.6,0.5,'estantería',1.2); } }
      if(K==='math') R.act=true; }
    else if(K==='infant'){ front(R,fr,'infant'); const oc=place(fr.W(fr.depth*0.55,0),ang(fr.fw)); oc.bx('rug',0,0.005,0,Math.min(3,fr.width-2),0.01,2.2);
      for(const [s,t] of [[2.4,-fr.width/4],[2.4,fr.width/4],[fr.depth-2.2,-fr.width/4],[fr.depth-2.2,fr.width/4]]){ const o=place(fr.W(s,t),ang(fr.fw)); if(!ok(o,1.6,1.6,R.id)) continue; desk(o,0.9,0.9,0.5,'yellow'); [[0,-0.62],[0,0.62],[-0.62,0],[0.62,0]].forEach(([x,z],k)=>chair(o,x,z,chairM[k],0.7)); reg(o,1.6,1.6,'mesa baja',0.5); }
      const ot=sideWall(fr,fr.depth*0.5,-1); if(ok(ot,1.6,0.5,R.id)){ shelf(ot,1.6,0.9,0.4,false); for(let k=0;k<6;k++) ot.bx(chairM[k%4],-0.6+k*0.24,0.32+(k%2)*0.36,0,0.18,0.18,0.18); reg(ot,1.6,0.5,'juguetes',0.9); }
      poster(sideWall(fr,2.4,1),'dots',0.02,1.3,0.9); }
    else if(K==='science'){ front(R,fr,'science',{noDesk:true}); const od=place(fr.W(1.6,0),ang(fr.fw)); if(ok(od,2.4,0.8,R.id)){ desk(od,2.4,0.8,0.9,'scBench'); od.bx('steel',0.8,0.9,0,0.45,0.04,0.35); reg(od,2.4,0.8,'mesa del profesor',0.9); }
      let n=0; for(let s=3.3;s<fr.depth-1.0;s+=2.2) for(const t of [-fr.width/4,fr.width/4]){ const o=place(fr.W(s,t),ang(fr.fw)); if(!ok(o,2.6,1.6,R.id)) continue; desk(o,2.4,0.8,0.9,'scBench'); o.bx('steel',1.0,0.9,0,0.36,0.03,0.3); o.cy('chrome',1.0,0.92,-0.25,0.012,0.28);
        for(const x of [-0.8,0,0.8]){ o.cy('metal',x,0,0.65,0.02,0.62); o.cy(chairM[n%4],x,0.62,0.65,0.17,0.04); } for(const x of [-0.5,0.3]){ o.cy('glass',x,0.93,-0.15,0.045,0.18); o.cy('green',x,0.93,-0.15,0.035,0.08); } reg(o,2.4,1.6,'mesa de laboratorio',0.9); n++; }
      const os=sideWall(fr,fr.depth*0.5,1); if(ok(os,2.0,0.45,R.id)){ shelf(os,2.0,1.6,0.4,false); for(let k=0;k<8;k++) os.cy(k%2?'glass':'blue',-0.8+k*0.22,0.42+(k%3)*0.53,0,0.05,0.2); reg(os,2.0,0.45,'estantería',1.6); }
      poster(sideWall(fr,2.4,-1),'table',0.02,1.6,1.0); }
    else if(K==='art'){ front(R,fr,'class',{noDesk:true}); let n=0; for(let s=2.6;s<fr.depth-1.2;s+=2.6){ const o=place(fr.W(s,0),ang(fr.fw)); if(!ok(o,2.2,1.6,R.id)) continue; desk(o,2.0,1.2,0.76,'wood'); for(let k=0;k<5;k++) o.bx(chairM[k%4],-0.7+k*0.35,0.76,-0.2+(k%2)*0.3,0.22,0.004,0.16);
        for(const [x,z] of [[-0.6,0.85],[0.6,0.85],[-0.6,-0.85],[0.6,-0.85]]){ o.cy('metal',x,0,z,0.02,0.6); o.cy(chairM[(n++)%4],x,0.6,z,0.17,0.04); } reg(o,2.0,2.0,'mesa de arte',0.76); }
      for(const [s,sg] of [[2.4,1],[4.6,1],[2.4,-1]]){ const o=sideWall(fr,s,sg); poster(o,'art'+s+sg,0.02,1.6,0.8); }
      for(const t of [-fr.width/2+1.2,fr.width/2-1.2]){ const o=place(fr.W(fr.depth-1.0,t),ang(fr.fw)); if(!ok(o,0.7,0.7,R.id)) continue; o.cy('wood2',-0.25,0,0.2,0.02,1.6); o.cy('wood2',0.25,0,0.2,0.02,1.6); o.cy('wood2',0,0,-0.3,0.02,1.5); o.bx('wood2',0,0.9,0.12,0.7,0.03,0.08); plane(o,scPosterTex('easel'+t),0.1,1.25,0.6,0.6,true); reg(o,0.7,0.7,'caballete',0); } }
    else if(K==='music'){ front(R,fr,'music',{noDesk:true}); const op=place(fr.W(1.2,fr.width/2-1.3),ang(rot(fr.fw,Math.PI))); if(ok(op,1.5,0.7,R.id)){ op.bx('black',0,0,0,1.5,1.25,0.6); op.bx('scKeys',0,0.72,-0.38,1.4,0.04,0.18); op.bx('black',0,0,-0.55,0.4,0.48,0.36); reg(op,1.5,1.2,'piano',1.25); }
      const cx=fr.depth*0.62, r=Math.min(3.2,fr.width/2-0.8); for(let k=0;k<9;k++){ const a=Math.PI*(0.1+0.8*k/8), s=cx-Math.sin(a)*r*0.55, t=Math.cos(a)*r; const p=fr.W(s,t), q=fr.W(cx-r*0.9,0); const f=[q[0]-p[0],q[1]-p[1]], l=Math.hypot(f[0],f[1])||1; const o=place(p,ang([f[0]/l,f[1]/l])); if(!ok(o,0.5,0.5,R.id)) continue; chair(o,0,0.15,chairM[k%4]); o.cy('metal',0,0,-0.4,0.012,1.0); o.bx('black',0,1.0,-0.42,0.42,0.3,0.02); reg(o,0.5,0.9,'silla y atril',0.45); }
      const odm=place(fr.W(fr.depth-1.3,-fr.width/2+1.4),0); if(ok(odm,1.4,1.2,R.id)){ odm.cy('red',0,0,0,0.3,0.4); odm.cy('red',0.55,0.3,-0.3,0.18,0.18); odm.cy('red',-0.5,0.3,-0.3,0.16,0.18); odm.cy('gold',0.6,0,0.35,0.015,0.9); odm.cy('gold',0.6,0.9,0.35,0.22,0.01); reg(odm,1.4,1.2,'batería',0.6); }
      poster(sideWall(fr,2.4,1),'notes',0.02,1.6,0.9); }
    else if(K==='ict'){ front(R,fr,'ict'); for(const sg of [-1,1]) for(let s=2.4;s<fr.depth-0.9;s+=1.5){ const o=sideWall(fr,s,sg); const q=o.at(0,0.45), oo=place(q,o.a); if(!ok(oo,1.2,0.6,R.id)) continue; desk(oo,1.2,0.6,0.74); oo.bx('black',0,0.74,-0.1,0.55,0.36,0.04); oo.bx('screen',0,0.78,-0.075,0.5,0.31,0.005); oo.bx('black',0,0.74,0.12,0.44,0.02,0.14); chair(oo,0,0.55,chairM[Math.round(s)%4]); reg(oo,1.2,1.1,'ordenador',0.74); } }
    else if(K==='library'){ for(const sg of [-1,1]) for(let s=1.3;s<fr.depth-1.0;s+=1.7){ const o=sideWall(fr,s,sg); const oo=place(o.at(0,0.22),o.a); if(!ok(oo,1.6,0.4,R.id)) continue; shelf(oo,1.6,2.0,0.36,true); reg(oo,1.6,0.4,'estantería',2.0,true); }
      const ob=place(fr.W(0.3,0),ang(fr.fw)); if(ok(ob,Math.min(4,fr.width-2.4),0.4,R.id)){ shelf(ob,Math.min(4,fr.width-2.4),2.0,0.36,true); reg(ob,Math.min(4,fr.width-2.4),0.4,'estantería',2.0,true); }
      for(let s=2.4;s<fr.depth*0.6;s+=2.4){ const o=place(fr.W(s,0),ang(fr.fw)); if(!ok(o,2.0,1.8,R.id)) continue; desk(o,1.8,0.9,0.74,'wood'); for(const [x,z,a] of [[-0.45,-0.75,Math.PI],[0.45,-0.75,Math.PI],[-0.45,0.75,0],[0.45,0.75,0]]){ const q=o.at(x,z), oc=place(q,o.a+a); chair(oc,0,0,'wood2'); } reg(o,1.8,2.0,'mesa de lectura',0.74); }
      const or=place(fr.W(fr.depth*0.78,0),ang(fr.fw)); if(ok(or,2.4,2.0,R.id)){ or.bx('rug',0,0.005,0,2.6,0.01,2.0); for(const [x,z,m] of [[-0.8,0.3,'scChairR'],[0.1,-0.4,'scChairB'],[0.9,0.4,'scChairY']]) or.blob(m,x,0.22,z,0.42,0.24,0.42); reg(or,2.6,2.0,'rincón de lectura',0.4); }
      lights.push([...fr.W(fr.depth*0.5,0).slice(0,1),ceil-0.5,fr.W(fr.depth*0.5,0)[1]]); }
    else if(K==='hall'){ const sw=fr.width-1.2, sd=Math.min(4.2,fr.depth*0.25); const os=place(fr.W(sd/2+0.05,0),ang(fr.fw)); if(ok(os,Math.min(sw,4),sd*0.8,R.id)){ os.bx('scStage',0,0,0,sw,0.6,sd); reg(os,sw,sd,'escenario',0.6); os.bx('fab2',0,0.6,-sd/2+0.08,sw,ceil-fl-0.7,0.08); os.bx('wood2',sw*0.3,0.6,0.4,0.5,1.1,0.4); }
      let n=0; for(let s=sd+1.8;s<fr.depth-1.0;s+=1.05){ for(let t=-fr.width/2+1.0;t<fr.width/2-0.9;t+=0.62){ if(Math.abs(t)<0.6) continue; const o=place(fr.W(s,t),ang(fr.fw)); if(!ok(o,0.5,0.5,R.id)) continue; chair(o,0,0,chairM[(n++)%4]); E.claim(o.cx,o.cz,o.a,0.5,0.5,'silla'); } }
      lights.push([...fr.W(fr.depth*0.4,0).slice(0,1),ceil-0.5,fr.W(fr.depth*0.4,0)[1]]); }
    else if(K==='dining'){ const oc=place(fr.W(0.45,0),ang(rot(fr.fw,Math.PI))); const cw=Math.min(6,fr.width-2); if(ok(oc,cw,0.7,R.id)){ oc.bx('steel',0,0,0,cw,0.9,0.7); oc.bx('glass',0,0.9,-0.2,cw,0.45,0.02); for(let k=0;k<5;k++) oc.bx('scChairB',-cw/2+0.6+k*(cw-1.2)/4,0.9,-0.12,0.42,0.02,0.3); reg(oc,cw,0.7,'barra de la comida',0.9); }
      for(let s=2.6;s<fr.depth-1.2;s+=2.6) for(let t=-fr.width/2+2.2;t<fr.width/2-1.4;t+=4.4){ const o=place(fr.W(s,t),ang(rot(fr.fw,Math.PI/2))); if(!ok(o,3.8,2.0,R.id)) continue; desk(o,3.6,0.9,0.74,'scBench'); for(const z of [-0.75,0.75]){ o.bx('wood2',0,0.42,z,3.4,0.05,0.32); for(const x of [-1.5,1.5]) o.bx('metal',x,0,z,0.05,0.42,0.28); } o.cy('glass',0.6,0.74,0,0.06,0.22); reg(o,3.6,2.1,'mesa larga',0.74); }
      lights.push([...fr.W(fr.depth*0.5,0).slice(0,1),ceil-0.5,fr.W(fr.depth*0.5,0)[1]]); }
    else if(K==='reception'){ const oc=place(fr.W(1.4,fr.width/4),ang(rot(fr.fw,Math.PI))); if(ok(oc,2.2,0.7,R.id)){ oc.bx('wood',0,0,0,2.2,1.05,0.7); oc.bx('white',0,1.05,0,2.3,0.04,0.8); oc.bx('black',0.5,1.09,0.1,0.5,0.32,0.04); oc.bx('screen',0.5,1.12,0.075,0.46,0.27,0.004); reg(oc,2.2,0.7,'mostrador',1.05); }
      const ov=place(fr.W(fr.depth-1.4,-fr.width/4),ang(fr.fw)); if(ok(ov,2.0,0.9,R.id)){ ov.rb('fab',0,0.2,0,2.0,0.25,0.85,0.06); ov.rb('fab',0,0.2,0.35,2.0,0.55,0.18,0.06); reg(ov,2.0,0.9,'sofá',0.45); }
      const ot=sideWall(fr,fr.depth*0.5,1); const oq=place(ot.at(0,0.3),ot.a); if(ok(oq,1.4,0.5,R.id)){ oq.bx('wood2',0,0,0,1.4,0.8,0.45); oq.bx('glass',0,0.8,0,1.4,1.0,0.45); for(let k=0;k<3;k++){ oq.cy('gold',-0.4+k*0.4,0.84,0,0.05,0.12); oq.sp('gold',-0.4+k*0.4,1.04,0,0.09,0.09,0.09); } reg(oq,1.4,0.5,'vitrina de copas',1.8,true); }
      poster(sideWall(fr,1.6,-1),'notice',0.02,1.5,1.2); lights.push([...fr.W(fr.depth*0.5,0).slice(0,1),ceil-0.5,fr.W(fr.depth*0.5,0)[1]]);
      for(const t of [-fr.width/2+0.6,fr.width/2-0.6]){ const o=place(fr.W(fr.depth-0.6,t),0); if(!ok(o,0.5,0.5,R.id)) continue; o.cy('ceramic',0,0,0,0.22,0.5); o.blob('leaf',0,1.0,0,0.45,0.55,0.45); reg(o,0.5,0.5,'planta',0.5); } }
    else if(K==='ggold'){ const c=fr.W(fr.depth*0.5,0);
      for(const sg of [-1,1]){ const p=fr.W(fr.depth*0.5+sg*1.35,0); const o=place(p,ang([c[0]-p[0],c[1]-p[1]])); if(ok(o,2.2,0.9,R.id)){ o.rb('fab2',0,0.2,0,2.2,0.25,0.85,0.08); o.rb('fab2',0,0.2,0.36,2.2,0.6,0.18,0.08); for(const x of [-1.05,1.05]) o.rb('fab2',x,0.2,0,0.16,0.45,0.85,0.06); reg(o,2.2,0.9,'sofá dorado',0.45); } }
      { const o=place(c,ang(fr.fw)); if(ok(o,1.2,0.6,R.id)){ o.bx('wood2',0,0.38,0,1.2,0.05,0.6); for(const [x,z] of [[-0.55,-0.25],[0.55,-0.25],[-0.55,0.25],[0.55,0.25]]) o.cy('gold',x,0,z,0.02,0.38); o.sp('ceramic',0.2,0.5,0,0.12,0.1,0.12); reg(o,1.2,0.6,'mesa baja',0.43); } }
      { const o=sideWall(fr,fr.depth*0.5,1); const oo=place(o.at(0,0.3),o.a); if(ok(oo,1.8,0.5,R.id)){ oo.bx('stone',0,0,0,1.8,1.15,0.45); oo.bx('black',0,0.12,-0.2,0.9,0.75,0.08); oo.bx('stone',0,1.15,0.02,2.0,0.08,0.55); oo.bx('gold',0,1.35,0.2,1.1,1.0,0.04); oo.bx('glass',0,1.42,0.17,0.95,0.86,0.01); reg(oo,1.8,0.5,'chimenea con espejo',1.2,true); } }
      { const o=place(fr.W(fr.depth-1.7,fr.width/2-1.5),ang(rot(fr.fw,Math.PI/2))); if(ok(o,1.6,2.4,R.id)){ o.rb('black',0,0.65,0,1.5,0.32,1.9,0.15); o.bx('black',0,0.97,-0.6,1.4,0.02,0.6); for(const [x,z] of [[-0.6,-0.7],[0.6,-0.7],[0,0.8]]) o.cy('black',x,0,z,0.05,0.65); o.bx('scKeys',0,0.78,-0.95,1.2,0.05,0.16); reg(o,1.6,2.4,'piano de cola',1.0); } }
      lights.push([c[0],ceil-0.6,c[1]]); const ch=place(c,0); ch.cy('gold',0,ceil-fl-0.9,0,0.012,0.9); ch.sp('gold',0,ceil-fl-1.0,0,0.35,0.12,0.35); for(let k=0;k<6;k++){ const a=k*Math.PI/3; ch.sp('cream',Math.cos(a)*0.45,ceil-fl-0.92,Math.sin(a)*0.45,0.06,0.09,0.06); } }
    else if(K==='gdining'){ const c=fr.W(fr.depth*0.5,0), L=Math.max(2.2,Math.min(5.2,fr.depth-2.6)); const o=place(c,ang(fr.fw));
      if(ok(o,1.2,L,R.id)){ o.bx('wood',0,0.72,0,1.2,0.06,L); for(const z of [-L/2+0.15,L/2-0.15]) for(const x of [-0.5,0.5]) o.cy('wood',x,0,z,0.04,0.72);
        for(let z=-L/2+0.55;z<L/2-0.35;z+=0.75) for(const sx of [-1,1]){ const p=o.at(sx*0.85,z), q=o.at(0,z); chair(place(p,ang([q[0]-p[0],q[1]-p[1]])),0,0,'fab'); }
        for(const z of [-L/4,L/4]){ o.cy('gold',0,0.78,z,0.05,0.04); o.cy('gold',0,0.82,z,0.012,0.3); o.sp('cream',0,1.14,z,0.02,0.05,0.02); } reg(o,2.4,L+0.4,'mesa del comedor',0.75); }
      { const os=sideWall(fr,fr.depth*0.5,-1); const oo=place(os.at(0,0.3),os.a); if(ok(oo,2.0,0.5,R.id)){ oo.bx('wood2',0,0,0,2.0,0.9,0.48); oo.bx('gold',0,0.9,0,2.05,0.03,0.5); oo.sp('ceramic',-0.6,1.05,0,0.12,0.15,0.12); reg(oo,2.0,0.5,'aparador',0.95); } }
      lights.push([c[0],ceil-0.6,c[1]]); }
    else if(K==='gbillar'){ const c=fr.W(fr.depth*0.42,0); const o=place(c,ang(fr.fw));
      if(ok(o,1.9,3.1,R.id)){ o.bx('wood2',0,0,0,1.7,0.62,2.9); o.bx('felt',0,0.62,0,1.5,0.2,2.7); o.bx('wood2',-0.8,0.62,0,0.1,0.24,2.9); o.bx('wood2',0.8,0.62,0,0.1,0.24,2.9); o.bx('wood2',0,0.62,-1.4,1.7,0.24,0.1); o.bx('wood2',0,0.62,1.4,1.7,0.24,0.1);
        for(const [x,z] of [[-0.7,-1.3],[0.7,-1.3],[-0.7,0],[0.7,0],[-0.7,1.3],[0.7,1.3]]) o.cy('wood2',x,0,z,0.07,0.62); const bc=['white','red','yellow','blue','black','green','red','yellow']; for(let k=0;k<8;k++) o.sp(bc[k],-0.3+(k%4)*0.2,0.855,0.5+Math.floor(k/4)*0.2,0.03,0.03,0.03); reg(o,1.9,3.1,'mesa de billar',0.86);
        o.bx('fab',0,ceil-fl-1.15,0,0.5,0.18,2.0); o.cy('gold',0,ceil-fl-0.97,-0.6,0.01,0.97); o.cy('gold',0,ceil-fl-0.97,0.6,0.01,0.97); }
      lights.push([c[0],ceil-0.9,c[1]]);
      { const os=sideWall(fr,fr.depth*0.42,1); const oo=place(os.at(0,0.08),os.a); if(ok(oo,1.4,0.25,R.id)){ oo.bx('wood2',0,0.8,0,1.4,0.9,0.06); for(let k=0;k<7;k++) oo.cy('wood',-0.55+k*0.18,0.25,0.07,0.012,1.4); reg(oo,1.4,0.25,'tacos de billar',1.7,true); } }
      { const bw=Math.min(3,fr.width-2.2), oc=place(fr.W(fr.depth-1.3,0),ang(rot(fr.fw,Math.PI))); if(ok(oc,bw,1.3,R.id)){ oc.bx('wood2',0,0,0,bw,1.05,0.6); oc.bx('gold',0,1.05,0,bw+0.1,0.05,0.7); oc.bx('wood',0,1.4,0.95,bw,0.04,0.25); const bt=['green','red','glass','gold','cream','blue'];
        for(let k=0;k<6;k++) oc.cy(bt[k],-bw/2+0.3+k*(bw-0.6)/5,1.44,0.95,0.04,0.28); for(let k=0;k<3;k++){ const x=-bw/2+0.5+k*(bw-1)/2; oc.cy('metal',x,0,-0.6,0.02,0.72); oc.cy('fab',x,0.72,-0.6,0.18,0.06); } reg(oc,bw,1.3,'barra con taburetes',1.1); } } }
    else if(K==='gcons'){ const c=fr.W(fr.depth*0.5,0); const o=place(c,0); if(ok(o,1.0,1.0,R.id)){ o.cy('white',0,0,0,0.05,0.7); o.cy('white',0,0.7,0,0.5,0.03); reg(o,1.0,1.0,'mesa redonda',0.73); }
      for(let k=0;k<4;k++){ const a=k*Math.PI/2+0.4, p=[c[0]+Math.cos(a)*1.15,c[1]+Math.sin(a)*1.15], oc=place(p,ang([c[0]-p[0],c[1]-p[1]])); if(!ok(oc,0.8,0.8,R.id)) continue; oc.rb('cream',0,0.12,0,0.75,0.3,0.7,0.12); oc.rb('cream',0,0.12,0.3,0.75,0.75,0.14,0.1); oc.rb('fab2',0,0.42,-0.02,0.6,0.08,0.55,0.03); reg(oc,0.8,0.8,'butaca de mimbre',0.5); }
      let n=0; for(let s=0.7;s<fr.depth-0.4;s+=1.3) for(const sg of [-1,1]){ const o2=place(fr.W(s,sg*(fr.width/2-0.55)),0); if(!ok(o2,0.6,0.6,R.id)) continue; o2.cy('ceramic',0,0,0,0.25,0.45); o2.blob('leaf',0,0.95+((n++)%3)*0.15,0,0.5,0.65,0.5); reg(o2,0.6,0.6,'planta',0.5); }
      lights.push([c[0],ceil-0.5,c[1]]); }
    else if(K==='gkitchen'){ const c=fr.W(fr.depth*0.55,0); const o=place(c,ang(fr.fw)); if(ok(o,1.3,2.4,R.id)){ o.bx('cream',0,0,0,1.0,0.88,2.2); o.bx('white',0,0.88,0,1.1,0.05,2.3); reg(o,1.3,2.4,'isla',0.93); }
      { const os=sideWall(fr,fr.depth*0.5,1), oo=place(os.at(0,0.33),os.a), w=Math.max(1.6,Math.min(3.6,fr.depth-1.6)); if(ok(oo,w,0.62,R.id)){ oo.bx('cream',0,0,0,w,0.88,0.6); oo.bx('white',0,0.88,0,w,0.04,0.62); oo.bx('black',-w/2+0.6,0,-0.02,1.1,0.92,0.62); oo.bx('gold',-w/2+0.6,0.5,-0.33,1.0,0.02,0.02); oo.bx('steel',w/2-0.6,0.86,0,0.5,0.03,0.4); oo.bx('cream',0,1.45,0.12,w,0.7,0.34); reg(oo,w,0.62,'armarios y fogón',0.92,true); } }
      lights.push([c[0],ceil-0.5,c[1]]); }
    else if(K==='gstudy'){ const c=fr.W(fr.depth*0.45,0); const o=place(c,ang(rot(fr.fw,Math.PI))); if(ok(o,1.6,1.3,R.id)){ desk(o,1.6,0.8,0.76,'wood2'); o.bx('fab',0,0.76,0,0.6,0.01,0.4); chair(o,0,0.7,'fab'); o.cy('gold',0.6,0.76,-0.2,0.06,0.02); o.cy('gold',0.6,0.78,-0.2,0.01,0.3); reg(o,1.6,1.3,'escritorio',0.78); }
      for(const sg of [-1,1]){ const os=sideWall(fr,fr.depth*0.5,sg), w=Math.max(1.2,Math.min(2.4,fr.depth-1.6)), oo=place(os.at(0,0.2),os.a); if(!ok(oo,w,0.4,R.id)) continue; shelf(oo,w,2.1,0.36,true); reg(oo,w,0.4,'estantería',2.1,true); }
      { const og=place(fr.W(fr.depth-1.0,fr.width/2-1.0),0); if(ok(og,0.6,0.6,R.id)){ og.cy('wood2',0,0,0,0.04,0.8); og.sp('blue',0,1.05,0,0.25,0.25,0.25); reg(og,0.6,0.6,'bola del mundo',1.2); } }
      lights.push([c[0],ceil-0.5,c[1]]); }
    else if(K==='gsnug'){ const c=fr.W(fr.depth*0.5,0); { const o=place(fr.W(fr.depth*0.62,0),ang(fr.fw)); if(ok(o,2.2,0.9,R.id)){ o.rb('fab',0,0.2,0,2.2,0.25,0.85,0.08); o.rb('fab',0,0.2,0.36,2.2,0.6,0.18,0.08); reg(o,2.2,0.9,'sofá',0.45); } }
      { const ot=place(fr.W(0.35,0),ang(rot(fr.fw,Math.PI))); if(ok(ot,1.4,0.45,R.id)){ ot.bx('wood2',0,0,0,1.4,0.5,0.42); ot.bx('black',0,0.5,0.1,1.2,0.68,0.05); ot.bx('screen',0,0.52,0.07,1.14,0.62,0.004); reg(ot,1.4,0.45,'tele',1.2,true); } }
      lights.push([c[0],ceil-0.5,c[1]]); }
    else if(K==='store'||K==='gboot'){ for(const sg of [-1,1]){ const o=sideWall(fr,fr.depth*0.5,sg); const oo=place(o.at(0,0.25),o.a); if(!ok(oo,1.8,0.5,R.id)) continue; shelf(oo,1.8,1.8,0.45,false); for(let k=0;k<6;k++) oo.bx('cream',-0.6+(k%3)*0.6,0.06+Math.floor(k/3)*0.72,0,0.5,0.34,0.38); reg(oo,1.8,0.5,'estantería',1.8,true); } } }
  // the corridor: lights, a noticeboard at the entrance, plants at the crossing and coat pegs
  { const Q=P.F; for(const C of P.cellAt.flat()){ if(!C.corr||C.f<0.3) continue; const along=C.i===P.ic; const L=along?C.v1-C.v0:C.u1-C.u0; for(let k=0.5;k<L;k+=4){ const u=along?Q.uc:C.u0+k, v=along?C.v0+k:Q.vc; if(Q.inL(u,v,0.6)) glow(Q.toW(u,v)); } }
    const cr=Q.toW(Q.uc,Q.vc), ch=P.SP.ch; for(const [du,dv] of [[1,1],[-1,-1]]){ const p=Q.toW(Q.uc+du*(ch-0.4),Q.vc+dv*(ch-0.4)); const o=place(p,0); o.cy('ceramic',0,0,0,0.2,0.45); o.blob('leaf',0,0.95,0,0.4,0.5,0.4); reg(o,0.45,0.45,'planta',0.45); }
    lights.push([cr[0],ceil-0.4,cr[1]]); }
  SC.P.rooms.forEach(R=>{ if(R.board) R.boardY=fl; }); }
function scEnvPoint(){ const P=SC.P; if(!P) return [0,0]; const F=P.F; return F.toW(F.uc,F.vc); }
// the stops of the guided tour: the entrance, then every room from its door looking in
function scViews(){ const P=SC.P, F=P.F, v=[]; const e=P.ent, p0=F.toW(e.u-e.du*1.5,e.v-e.dv*1.5), d0=F.dW(-e.du,-e.dv); v.push({x:p0[0],z:p0[1],yaw:Math.atan2(d0[1],d0[0]),room:'Entrada'});
  const order=P.SP.kinds.map(k=>k[0]).filter(k=>k!=='gboot'); const rs=P.rooms.filter(R=>R.door&&order.includes(R.kind)).sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind));
  for(const R of rs){ const d=R.door, x=d.x+d.nx*1.3, z=d.z+d.nz*1.3; const c=F.toW((R.rect[0]+R.rect[1])/2,(R.rect[2]+R.rect[3])/2); v.push({x,z,yaw:Math.atan2(c[1]-z,c[0]-x),room:R.name}); } return v; }
function scShell(){ const I=S.interior; return I&&scIsGr(I.b)?(LU.grMesh||[]):LU.scMesh; }
function scEntered(){ const I=S.interior; if(!I||!I.school) return; SC.shell=scShell(); for(const m of SC.shell) m.visible=false;
  if(!SC.hemi) SC.hemi=new THREE.HemisphereLight(0xffffff,0xd8cfc0,0.55); I.grp.add(SC.hemi); SC.hemi.intensity=0.12+0.16*(1-TOD.night); }
function scLeft(){ for(const m of (SC.shell||LU.scMesh)) m.visible=true; SC.shell=null; }
function scPlaceIn(){ const I=S.interior; if(!I||!I.school) return; const Q=SC.P, F=Q.F, e=Q.ent; const p=F.toW(e.u-e.du*1.4,e.v-e.dv*1.4), d=F.dW(-e.du,-e.dv); scPlaceAt(p[0],p[1],Math.atan2(d[1],d[0])); }
function scPlaceAt(x,z,yaw){ P.x=x; P.z=z; P.y=S.interior.floor; P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=yaw; camS.yaw=yaw; camS.pitch=0.04; setFP(store.get('vg_fp')!=='0'); }
function scTip(){ if(SC.P.SP.key==='grange'){ tip('Casterton Grange por dentro · '+SC.P.rooms.filter(R=>R.id).length+' salas de la planta baja (de diseño propio) · ▶ Recorrido para verlas todas · el plano, en Mapa',5600); return; } const n=SC.P.rooms.filter(R=>SC_KINDS.some(k=>k[0]===R.kind)).length; tip('Colegio por dentro · '+n+' salas alrededor de un pasillo en cruz (de diseño propio) · ▶ Recorrido para verlas todas · el plano, en Mapa',5600); }
function scNear(){ if(S.mode!=='walk'||S.interior) return null; for(const b of [WP.school?scB():null,grB()]){ if(!b) continue; if(Math.abs(P.x-b.c[0])>80||Math.abs(P.z-b.c[1])>80) continue; const e=nearestEdge(b,P.x,P.z); if(!inBld(b,P.x,P.z)&&e[0]<2.4&&P.y<b.top) return b; } return null; }
function scRoomNow(){ const I=S.interior; if(!I||!I.school) return null; return SC.P.rooms[I.plan.roomAt(P.x,P.z)]||null; }
function scActIn(){ const R=scRoomNow(); if(!R||!R.act||!R.board||!WP.cuentas) return null; if(Math.hypot(P.x-R.board[0],P.z-R.board[1])>3.2) return null; return {k:'schMath',label:'🔢 Hacer cuentas en la pizarra',ref:R}; }
function schDo(k){ if(k==='schMath'){ if(typeof mtStart==='function') mtStart('prac'); } }
function scGo(gr){ const b=gr?grB():scB(); if(!b) return; closeModal(); hideMap(); fadeTo(()=>{ if(S.mode==='menu'||S.mode==='drone'){ plane.visible=false; glider.visible=false; rig.root.visible=true; S.landedOnce=true; }
    if(P.buggy) exitBuggy(); if(S.mode==='ride') dismountHorse(); if(P.fly) flLeave(); if(KART.on) kartEnd('Has dejado la carrera'); if(S.mode!=='walk') setMode('walk');
    if(S.interior) exitVilla(); const q=scDoorOut(b); enterVilla(b,q[0],q[1]); scPlaceIn(); scTip(); }); }
// outside: a sign at the entrance
function scBuildOut(){ const b=scB(); if(!b) return; const q=scDoorOut(b), e=q[2], F=scFrame(b), o=F.dW(e.du,e.dv), r=F.dW(-e.dv,e.du); const x=q[0]+o[0]*2.4+r[0]*2.6, z=q[1]+o[1]*2.4+r[1]*2.6, y=W.terrain(x,z);
  const g=new THREE.Group(); const post=new THREE.MeshLambertMaterial({color:Cc('#2b2f33')}); for(const s of [-0.7,0.7]){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.6,0.08),post); m.position.set(x+r[0]*s,y+0.8,z+r[1]*s); g.add(m); }
  const tx=canvasTex(512,192,(c,w,h)=>{ c.fillStyle='#1f3a5f'; c.fillRect(0,0,w,h); c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.font='800 46px system-ui, sans-serif'; c.fillText('Casterton',w/2,64); c.font='700 34px system-ui, sans-serif'; c.fillText('Sedbergh Prep · Entrada',w/2,132); });
  const bd=new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.68),new THREE.MeshLambertMaterial({map:tx,side:THREE.DoubleSide})); bd.position.set(x,y+1.5,z); bd.rotation.y=Math.PI/2-Math.atan2(o[1],o[0]); g.add(bd);
  if(WP.uniform&&typeof unWolfDraw==='function'){ const ft=canvasTex(384,256,(c,w,h)=>{ c.fillStyle='#1f3a5f'; c.fillRect(0,0,w,h); c.fillStyle='#6b4428'; c.fillRect(0,h*0.86,w,h*0.14); unWolfDraw(c,w/2,h*0.45,h*0.38); });
    const fm=new THREE.MeshLambertMaterial({map:ft,side:THREE.DoubleSide}), pm=new THREE.MeshLambertMaterial({color:Cc('#d9dde2')});
    for(const s of [-1,1]){ const px=x+r[0]*s*2.6, pz=z+r[1]*s*2.6, py=W.terrain(px,pz); const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,6,8),pm); pole.position.set(px,py+3,pz); g.add(pole);
      const f=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1),fm); f.position.set(px+r[0]*s*0.78,py+5.4,pz+r[1]*s*0.78); f.rotation.y=bd.rotation.y; g.add(f); } SC.flags=true; }
  scene.add(g); SC.out={x:q[0],z:q[1]}; }
function scDrawMap(g,m2c,s,big){ if(!WP.school||!SC.out) return; const [x,y]=m2c(SC.out.x,SC.out.z); g.save(); g.fillStyle='#1f3a5f'; g.strokeStyle='#fff'; g.lineWidth=1.4*s; const r=(big?5:3.2)*s; g.beginPath(); g.rect(x-r,y-r,2*r,2*r); g.fill(); g.stroke();
  if(big){ g.fillStyle='#fff'; g.font='800 '+(6*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('C',x,y+0.4*s); g.fillStyle='#16231b'; g.textAlign='left'; g.fillText('Colegio (entrada)',x+r*1.6,y); } g.restore(); }
function scLegend(){ return WP.school?'<div><i style="background:#1f3a5f;border:2px solid #fff"></i>Entrada del colegio (edificio principal, con salas por dentro)</div>':''; }
function scLegendPlanHTML(){ const it=(c,t,line)=>'<div><i style="background:'+c+';'+(line?'height:4px;border:0;border-radius:2px':'')+'"></i>'+t+'</div>'; const P=SC.P;
  const list=P?P.rooms.filter(R=>R.id).map(R=>'<li><b>'+R.name+'</b>'+(SC_TXT[R.kind]?': '+SC_TXT[R.kind]:'')+'</li>').join(''):'';
  return '<p class="note" style="margin:6px 0">'+(P&&P.SP.key==='grange'?'Planta baja de Casterton Grange, con su forma real. Las salas son de diseño propio: un vestíbulo con pasillos y, alrededor, el salón dorado, el comedor, la sala de billar con su barra, el invernadero, la cocina y más. La flecha eres tú; la entrada mira a la avenida.':'Planta baja del edificio principal del colegio, con su forma real. Las salas son de diseño propio: un pasillo en cruz y, alrededor, las aulas. La flecha eres tú; la entrada está en el lado del aparcamiento.')+'</p><div class="legend">'+it(PLAN_COL.wall,'Fachada (muro exterior)',true)+it(PLAN_COL.part,'Tabique interior',true)+it(PLAN_COL.win,'Ventana',true)+it(PLAN_COL.door,'Puerta',true)+it(PLAN_COL.furn,'Muebles (pupitres, mesas, estanterías)')+'</div><ul style="margin:6px 0 0;padding-left:18px;font-size:13px">'+list+'</ul>'; }
function scGuideHTML(){ if(!WP.school) return ''; return '<li><b>El colegio por dentro</b> (botón «🏫 Ir al colegio» del menú, o «Entrar en el colegio» junto a su fachada): la planta baja del edificio principal, con salas de diseño propio alrededor de un pasillo en cruz: recepción, biblioteca, aulas de matemáticas, ciencias, arte, música, informática, geografía, idiomas y de los pequeños, salón de actos y comedor. ▶ Recorrido te las enseña todas; en el aula de matemáticas, junto a la pizarra, «Hacer cuentas en la pizarra». Fuera, las pistas de tenis del colegio.</li>'; }
function scGlossHTML(){ return WP.school?'<dt>Prep school</dt><dd>Colegio británico para niños de 3 a 13 años que prepara para el colegio de los mayores.</dd><dt>Salón de actos</dt><dd>Sala grande con escenario para funciones, conciertos y reuniones de todo el colegio.</dd><dt>Laboratorio</dt><dd>Aula con mesas altas, fregaderos y material para hacer experimentos de ciencias.</dd>':''; }
{ const m=$('mSchool'); if(m){ m.hidden=!WP.school; m.onclick=()=>{ saveName(); ensureAudio(); scGo(); }; } }
