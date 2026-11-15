/* ================= minigolf loco (J4a, solo Valdecañas): nueve hoyos locos junto al hotel ================= */
// Nombres mg*, estado MG. Cada hoyo se dibuja en sus propias coordenadas: a = a lo ancho, b = a lo largo desde el tee y z = altura sobre el fieltro.
// La bola usa la física del golf (g3b.js): gravedad GRAV, rodadura del green (SURF[5].c, algo más lenta en el fieltro) y la misma regla del hoyo
// (entra por debajo de 1,7 m/s; más rápida, se escapa por el borde una vez). Encima: bandas que rebotan, rampas que la lanzan, agua y un looping.
/*MGCORE*/
const MG_EZDT=1/120, MG_G=GRAV, MG_C=SURF[5].c*1.25, MG_R=0.05, MG_VMAX=6.5, MG_WALL=0.11, MG_E=0.74, MG_CUP=0.1, MG_CUPV=1.7;
function mgLin(x,x0,x1){ return x<=x0?0:x>=x1?1:(x-x0)/(x1-x0); }
function mgSm(x,x0,x1){ const t=mgLin(x,x0,x1); return t*t*(3-2*t); }
// a straight ramp from x0 to x1 with rounded ends (fillets of w m): 0 before and 1 after
function mgRamp(x,x0,x1,w){ const L=x1-x0; w=Math.min(w,L/2); const k=1/(L-w); if(x<=x0) return 0; if(x>=x1) return 1;
  if(x<x0+w) return k*(x-x0)*(x-x0)/(2*w); if(x>x1-w){ const y=x1-x; return 1-k*y*y/(2*w); } return k*(w/2+(x-x0-w)); }
function mgBump(x,c,r){ const d=Math.abs(x-c); if(d>=r) return 0; const q=Math.cos(Math.PI/2*d/r); return q*q; }
function mgCone(a,b,C){ const r=Math.hypot(a-C.a,b-C.b); if(r>=C.r) return 0; if(r>=C.cr) return C.h*Math.pow((C.r-r)/(C.r-C.cr),1.35); return C.h-C.cd*(1-(r/C.cr)*(r/C.cr)); }
// the castle hole turns on a quarter circle around its inner corner
const MG_ARC=(()=>{ const p=[]; for(let k=1;k<=5;k++){ const t=Math.PI/2+k*Math.PI/12; p.push([+(0.7+1.4*Math.cos(t)).toFixed(3),+(5.4+1.4*Math.sin(t)).toFixed(3)]); } return p; })();
// the nine holes. tee and cup in hole coordinates; aim: default direction (radians, 0 = +a, π/2 = straight down the lane)
const MG_HOLES=[
  {n:'Calentamiento',par:2,tee:[0,0],cup:[0,6.3],ic:'⛳',txt:'Recto, con una loma suave en medio: mide bien la fuerza.',
   poly:[[-0.65,-0.6],[0.65,-0.6],[0.65,6.8],[0.4,7.3],[-0.4,7.3],[-0.65,6.8]], h:(a,b)=>0.12*mgBump(b,3.2,0.95)},
  {n:'El molino',par:3,tee:[0,0],cup:[0,8.6],ic:'🌬️',txt:'Pasa por el túnel del molino cuando las aspas te dejen: si una baja delante, la bola rebota.',
   poly:[[-0.7,-0.6],[0.7,-0.6],[0.7,3.9],[0.26,4.5],[0.26,5.9],[0.7,6.4],[0.7,9.4],[0.45,9.9],[-0.45,9.9],[-0.7,9.4],[-0.7,6.4],[-0.26,5.9],[-0.26,4.5],[-0.7,3.9]],
   mill:{b:4.5,d:1.4,hub:1.55,len:1.52,w:0.26}, h:()=>0},
  {n:'La rampa',par:2,tee:[0,0],cup:[0,7.5],ic:'⛰️',txt:'Sube la rampa hasta el hoyo de arriba. Si te quedas corto, la bola vuelve rodando.',
   poly:[[-0.7,-0.6],[0.7,-0.6],[0.7,8.6],[0.45,9.0],[-0.45,9.0],[-0.7,8.6]], ramp:[2.8,4.8,0.5], h:(a,b)=>0.5*mgRamp(b,2.8,4.8,0.35)},
  {n:'El looping',par:3,tee:[0,0],cup:[0.12,8.9],ic:'🎢',txt:'Dale fuerte para que la bola dé la vuelta entera al looping. Si le falta fuerza, se cae y vuelve.',
   poly:[[-0.6,-0.6],[0.6,-0.6],[0.6,2.8],[0.32,3.4],[0.32,5.2],[0.65,5.8],[0.65,9.6],[0.4,10.1],[-0.4,10.1],[-0.65,9.6],[-0.65,5.8],[-0.32,5.2],[-0.32,3.4],[-0.6,2.8]],
   loop:{b:4.0,a:0,r:0.38,sh:0.14}, h:(a,b)=>0.3*mgRamp(b,6.2,9.2,0.6)},
  {n:'El río',par:3,tee:[0,0],cup:[0.3,8.6],ic:'🌉',txt:'Cruza el río por el puente estrecho. Si la bola cae al agua, un golpe más y repites desde donde golpeaste.',
   poly:[[-0.75,-0.6],[0.75,-0.6],[0.75,9.4],[0.5,9.9],[-0.5,9.9],[-0.75,9.4]], water:[{a0:-0.75,a1:0.75,b0:4.2,b1:5.6,z:-0.14}], bridge:{w:0.28,b0:4.2,b1:5.6,hh:0.08},
   h:(a,b)=>(b>4.2&&b<5.6)?(Math.abs(a)<0.28?0.08*Math.sin(Math.PI*(b-4.2)/1.4):-0.26):0},
  {n:'El salto',par:3,tee:[0,0],cup:[0,8.7],ic:'🚀',txt:'Coge carrerilla, salta el estanque desde la rampa roja y aterriza al otro lado.',
   poly:[[-0.75,-0.6],[0.75,-0.6],[0.75,10.4],[0.5,10.9],[-0.5,10.9],[-0.75,10.4]], water:[{a0:-0.75,a1:0.75,b0:3.8,b1:5.0,z:-0.2}], kick:[2.6,3.8,0.3], wh:0.55,
   h:(a,b)=>b<2.6?0:b<3.8?0.3*Math.pow((b-2.6)/1.2,1.6):b<5.0?-0.34:0},
  {n:'Pinball',par:3,tee:[0,0],cup:[0.62,8.4],ic:'🔴',txt:'Las setas rebotan y dan velocidad. Busca el hueco hasta el hoyo, a la derecha del fondo.',
   poly:[[-1.15,-0.6],[1.15,-0.6],[1.15,9.1],[0.8,9.6],[-0.8,9.6],[-1.15,9.1]],
   bump:[{a:-0.48,b:3.3,r:0.2},{a:0.48,b:3.3,r:0.2},{a:0,b:4.9,r:0.22},{a:-0.6,b:6.5,r:0.2},{a:0.22,b:6.7,r:0.18}], h:()=>0},
  {n:'El volcán',par:2,tee:[0,0],cup:[0,5.4],ic:'🌋',txt:'El hoyo está en el cráter: sube con la fuerza justa. Si te pasas, la bola baja por el otro lado.',
   poly:[[-1.0,-0.6],[1.0,-0.6],[1.35,0.6],[1.35,7.4],[0.9,8.0],[-0.9,8.0],[-1.35,7.4],[-1.35,0.6]], cone:{a:0,b:5.4,r:1.7,h:0.42,cr:0.3,cd:0.07}, h:null},
  {n:'El castillo',par:3,tee:[0,0],cup:[5.3,6.1],ic:'🏰',txt:'Sube por la curva peraltada y entra por la puerta del castillo. La última bola se queda dentro.',
   poly:[[-0.7,-0.6],[0.7,-0.6],[0.7,5.4],[3.3,5.4],[3.3,5.82],[4.3,5.82],[4.3,5.4],[6.1,5.4],[6.1,6.8],[4.3,6.8],[4.3,6.38],[3.3,6.38],[3.3,6.8],[0.7,6.8]].concat(MG_ARC,[[-0.7,5.4]]),
   castle:{a0:3.3,a1:4.3,b0:5.4,b1:6.8,g0:5.82,g1:6.38}, aim:Math.PI/2, wh:0.3, h:(a,b)=>{ const up=0.12*mgRamp(b,2.4,5.0,0.5)*(1-mgLin(a,0.7,4.6)); if(a>0.7||b<5.4) return up; const r=Math.hypot(a-0.7,b-5.4); return up+0.16*Math.pow(mgLin(r,0.55,1.4),2); }}
];
for(const H of MG_HOLES) if(H.cone) H.h=(a,b)=>mgCone(a,b,H.cone);
// walls (inner faces on the polygon edges, normals pointing in), bounding box
function mgPrep(H){ if(H.segs) return H; const P=H.poly; let ar=0; for(let i=0;i<P.length;i++){ const p=P[i], q=P[(i+1)%P.length]; ar+=p[0]*q[1]-q[0]*p[1]; } const ccw=ar>0; H.segs=[];
  let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;
  for(let i=0;i<P.length;i++){ const p=P[i], q=P[(i+1)%P.length], dx=q[0]-p[0], dy=q[1]-p[1], L=Math.hypot(dx,dy); if(L<1e-6) continue; const nx=ccw?-dy/L:dy/L, ny=ccw?dx/L:-dx/L;
    H.segs.push({x0:p[0],y0:p[1],x1:q[0],y1:q[1],dx,dy,L,nx,ny}); a0=Math.min(a0,p[0]); a1=Math.max(a1,p[0]); b0=Math.min(b0,p[1]); b1=Math.max(b1,p[1]); }
  H.bb=[a0,a1,b0,b1]; H.ccw=ccw; if(!H.h) H.h=()=>0; return H; }
function mgInside(H,a,b){ const P=H.poly; let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const pi=P[i], pj=P[j]; if((pi[1]>b)!==(pj[1]>b)&&a<(pj[0]-pi[0])*(b-pi[1])/(pj[1]-pi[1])+pi[0]) c=!c; } return c; }
// the slope under the ball: of the two one-sided slopes, the gentler one (so the lip of a ramp or the edge of the water is not a wall)
function mgGrad(H,a,b){ const e=0.012, h=H.h, h0=h(a,b), pick=(f,k)=>Math.abs(f)<Math.abs(k)?f:k; const ga=pick((h(a+e,b)-h0)/e,(h0-h(a-e,b))/e), gb=pick((h(a,b+e)-h0)/e,(h0-h(a,b-e))/e); return [Math.max(-3,Math.min(3,ga)),Math.max(-3,Math.min(3,gb))]; }
function mgWaterAt(H,a,b){ if(!H.water) return null; for(const w of H.water){ if(a>w.a0&&a<w.a1&&b>w.b0&&b<w.b1){ if(H.bridge&&Math.abs(a)<H.bridge.w&&b>H.bridge.b0&&b<H.bridge.b1) return null; return w; } } return null; }
function mgShoot(H,a,b,yaw,v){ return {a,b,z:H.h(a,b),va:Math.cos(yaw)*v,vb:Math.sin(yaw)*v,vz:0,air:false,t:0,done:null,lip:false,loop:null,walls:0,bumps:0,splash:null,inLoop:0}; }
// one step of the ball (o.ez: easy mode, bigger hole and a magnet; o.blk(t): the windmill blocks the tunnel at time t)
function mgStep(H,s,dt,o){ o=o||{}; s.t+=dt; if(s.loop){ mgLoopStep(H,s,dt); return; }
  const pa=s.a, pb=s.b;
  if(s.air){ s.vz-=MG_G*dt; s.a+=s.va*dt; s.b+=s.vb*dt; s.z+=s.vz*dt; const h=H.h(s.a,s.b);
    const w=mgWaterAt(H,s.a,s.b); if(w&&s.z<=w.z){ s.done='water'; s.splash=[s.a,s.b,w.z]; return; }
    if(s.z<=h){ const g=mgGrad(H,s.a,s.b), L=Math.hypot(g[0],g[1],1), nx=-g[0]/L, ny=-g[1]/L, nz=1/L, vn=s.va*nx+s.vb*ny+s.vz*nz;
      if(!mgInside(H,s.a,s.b)){ s.done='out'; return; }
      s.z=h; if(vn<0){ const e=0.32; s.va-=(1+e)*vn*nx; s.vb-=(1+e)*vn*ny; s.vz-=(1+e)*vn*nz; s.va*=0.94; s.vb*=0.94; if(-vn*e<0.5){ s.air=false; const vn2=s.va*nx+s.vb*ny+s.vz*nz; s.va-=vn2*nx; s.vb-=vn2*ny; s.vz-=vn2*nz; } } } }
  else {
    // rolling, as on the green: the slope pulls (gravity along the surface) and the felt brakes (rolling friction)
    const g=mgGrad(H,s.a,s.b), L=Math.hypot(g[0],g[1],1), nx=-g[0]/L, ny=-g[1]/L, nz=1/L;
    let vn=s.va*nx+s.vb*ny+s.vz*nz; s.va-=vn*nx; s.vb-=vn*ny; s.vz-=vn*nz;
    const gx=MG_G*nz*nx, gy=MG_G*nz*ny, gz=-MG_G+MG_G*nz*nz, gt=Math.hypot(gx,gy,gz), fr=MG_C*MG_G*nz;
    const sp=Math.hypot(s.va,s.vb,s.vz);
    if(sp>0.03){ const ux=s.va/sp, uy=s.vb/sp, uz=s.vz/sp; let na=s.va+(gx-ux*fr)*dt, nb=s.vb+(gy-uy*fr)*dt, nzv=s.vz+(gz-uz*fr)*dt; if(na*ux+nb*uy+nzv*uz<=0&&gt<fr){ na=nb=nzv=0; } s.va=na; s.vb=nb; s.vz=nzv; }
    else if(gt>fr*1.15){ s.va+=gx*dt; s.vb+=gy*dt; s.vz+=gz*dt; }
    else { s.va=s.vb=s.vz=0; if(!s.rest) s.rest=s.t; if(s.t-s.rest>0.15){ s.done='stop'; return; } }
    if(Math.hypot(s.va,s.vb)>0.03) s.rest=0;
    if(o.ez){ const dc=Math.hypot(H.cup[0]-s.a,H.cup[1]-s.b), v=Math.hypot(s.va,s.vb); if(dc<0.6&&dc>1e-3&&v<2.4){ const k=1.4*dt; s.va+=(H.cup[0]-s.a)/dc*k; s.vb+=(H.cup[1]-s.b)/dc*k; s.rest=0; } }
    const z1=s.z+s.vz*dt; s.a+=s.va*dt; s.b+=s.vb*dt; const h1=H.h(s.a,s.b);
    if(z1>h1+0.004&&s.vz>0.05){ s.air=true; s.z=z1; } else s.z=h1;
    const w=mgWaterAt(H,s.a,s.b); if(w&&s.z<=w.z+0.02){ s.done='water'; s.splash=[s.a,s.b,w.z]; return; }
  }
  // walls: the inner faces of the border, a little higher than the felt; a ball in the air above them flies over
  for(const W of H.segs){ let t=((s.a-W.x0)*W.dx+(s.b-W.y0)*W.dy)/(W.L*W.L); t=t<0?0:t>1?1:t; const cx=W.x0+W.dx*t, cy=W.y0+W.dy*t; let dx=s.a-cx, dy=s.b-cy; const d=Math.hypot(dx,dy);
    if(d>=MG_R) continue; if(s.air&&s.z>Math.max(0,H.h(cx,cy))+(H.wh||MG_WALL)) continue;
    let nx, ny; if(d>1e-6){ nx=dx/d; ny=dy/d; if(nx*W.nx+ny*W.ny<-0.2&&t>0&&t<1){ nx=W.nx; ny=W.ny; } } else { nx=W.nx; ny=W.ny; }
    s.a=cx+nx*MG_R; s.b=cy+ny*MG_R; const vn=s.va*nx+s.vb*ny; if(vn<0){ s.va-=(1+MG_E)*vn*nx; s.vb-=(1+MG_E)*vn*ny; s.va*=0.97; s.vb*=0.97; s.walls++; s.hitT=s.t; } }
  // round bumpers: they push the ball back faster than it came
  if(H.bump) for(const B of H.bump){ const dx=s.a-B.a, dy=s.b-B.b, d=Math.hypot(dx,dy), m=B.r+MG_R; if(d>=m||d<1e-6) continue; const nx=dx/d, ny=dy/d; s.a=B.a+nx*m; s.b=B.b+ny*m; const vn=s.va*nx+s.vb*ny;
    if(vn<0){ s.va-=2.2*vn*nx; s.vb-=2.2*vn*ny; const v=Math.hypot(s.va,s.vb), mx=Math.max(1.6,Math.min(5.5,-vn*1.25+1)); if(v<mx){ s.va*=mx/v; s.vb*=mx/v; } s.bumps++; s.bumpT=s.t; s.bumpI=H.bump.indexOf(B); } }
  // the windmill: a blade in front of the tunnel mouth turns it into a wall
  if(H.mill){ const M=H.mill; if(Math.abs(s.a)<M.w+MG_R&&((pb<M.b-MG_R&&s.b>=M.b-MG_R)||(pb>M.b-MG_R&&s.b<=M.b-MG_R&&s.vb<0&&pb<M.b+0.3))&&o.blk&&o.blk(s.t)){ s.b=pb<M.b-MG_R?M.b-MG_R-0.001:M.b-MG_R+0.001; s.vb=-s.vb*0.55; s.va*=0.8; s.mill=(s.mill||0)+1; s.millT=s.t; } }
  // the loop: a ball rolling into its mouth goes round it (or falls back)
  if(H.loop&&!s.air){ const Lp=H.loop; if(pb<Lp.b&&s.b>=Lp.b&&s.vb>0&&Math.abs(s.a-Lp.a)<0.34){ const v2=s.va*s.va+s.vb*s.vb; s.loop={ph:0,dir:1,E:v2,a0:s.a}; s.b=Lp.b; s.inLoop++; return; } }
  // the hole: same rule as on the green
  const cr=o.ez?0.2:MG_CUP, cv=o.ez?2.6:MG_CUPV, dc=Math.hypot(s.a-H.cup[0],s.b-H.cup[1]);
  if(!s.air&&dc<cr){ const v=Math.hypot(s.va,s.vb); if(v<cv){ s.done='holed'; s.a=H.cup[0]; s.b=H.cup[1]; return; } if(!s.lip){ s.lip=true; const an=(Math.random()<.5?1:-1)*0.35, c=Math.cos(an), sn=Math.sin(an), va=s.va*c-s.vb*sn, vb=s.va*sn+s.vb*c; s.va=va*0.75; s.vb=vb*0.75; } }
  if(!s.air&&!mgInside(H,s.a,s.b)){ if(Math.hypot(s.a-pa,s.b-pb)<0.2){ s.a=pa; s.b=pb; s.va*=-0.5; s.vb*=-0.5; } else { s.done='out'; return; } }
  if(s.t>(o.maxT||30)) s.done='stop';
}
// round the loop (in the plane b-z): energy E = v² + 2gR(1-cos φ), less the felt's friction along the way
function mgLoopStep(H,s,dt){ const Lp=H.loop, R=Lp.r, q=s.loop, g=MG_G;
  const v2=q.E-2*g*R*(1-Math.cos(q.ph));
  if(q.dir>0&&q.ph>Math.PI/2&&v2<-g*R*Math.cos(q.ph)){ // it can't stay on the track: it falls, a projectile
    const v=Math.sqrt(Math.max(0,v2)); s.loop=null; s.air=true; s.b=Lp.b+R*Math.sin(q.ph); s.z=R*(1-Math.cos(q.ph)); s.a=q.a0+Lp.sh*q.ph/(2*Math.PI); s.va=0; s.vb=v*Math.cos(q.ph); s.vz=v*Math.sin(q.ph); s.fell=1; return; }
  if(q.dir>0&&v2<=0.0004){ q.dir=-1; }
  const v=Math.sqrt(Math.max(v2,0.0004)); const dph=v/R*dt; q.ph+=q.dir*dph; q.E-=2*MG_C*g*1.4*v*dt;
  s.b=Lp.b+R*Math.sin(q.ph); s.z=R*(1-Math.cos(q.ph)); s.a=q.a0+Lp.sh*Math.max(0,q.ph)/(2*Math.PI);
  if(q.ph>=2*Math.PI){ const ve=Math.sqrt(Math.max(0.01,q.E)); s.loop=null; s.b=Lp.b+0.002; s.z=H.h(s.a,s.b); s.va=0; s.vb=ve; s.vz=0; s.looped=1; return; }
  if(q.ph<=0){ const ve=Math.sqrt(Math.max(0.01,q.E)); s.loop=null; s.b=Lp.b-0.002; s.z=H.h(s.a,s.b); s.va=0; s.vb=-ve; s.vz=0; s.back=1; return; }
}
// a whole shot, start to end (used by the easy mode to choose the shot and by the tests); rec: keep the path every ~0.04 s
function mgRun(H,a,b,yaw,v,o,rec){ mgPrep(H); const s=mgShoot(H,a,b,yaw,v), dt=o&&o.dt||1/240; const path=rec?[[s.a,s.b,s.z]]:null; let k=0;
  while(!s.done){ mgStep(H,s,dt,o); if(rec&&(++k%10===0)) path.push([s.a,s.b,s.z+(s.loop?0:0)]); }
  if(rec) path.push([s.a,s.b,s.z]); s.path=path; return s; }
// the easy mode chooses the shot: a sweep of directions (around the line to the hole and down the lane) and strengths, then a finer one around the best.
// It is a generator, so the game can spread it over several frames; it yields how far it has got and returns {yaw,p,sc,done}
function* mgBestGen(H,a,b){ mgPrep(H); const o={ez:true,dt:MG_EZDT,maxT:14}, tc=Math.atan2(H.cup[1]-b,H.cup[0]-a), cands=[]; let best=null, n=0;
  const test=(y,p)=>{ const s=mgRun(H,a,b,y,p*MG_VMAX,o); const d=Math.hypot(s.a-H.cup[0],s.b-H.cup[1]); const sc=s.done==='holed'?-100+p*2:(s.done==='water'||s.done==='out'?50+d:d); if(!best||sc<best.sc) best={yaw:y,p,sc,done:s.done}; return s.done==='holed'; };
  const cen=[tc]; const lane=Math.PI/2; if(Math.abs(((lane-tc+3*Math.PI)%(2*Math.PI))-Math.PI)>0.2) cen.push(lane);
  for(let k=0;k<=7;k++) for(const c of cen){ cands.push(c+k*0.07); if(k) cands.push(c-k*0.07); }
  const tot=cands.length+9; for(const y of cands){ let hit=false; for(let p=0.12;p<=1.0001;p+=0.07) if(test(y,p)){ hit=true; break; } n++; if(hit) return best; if(n%2===0) yield n/tot; }
  const y0=best.yaw, p0=best.p; for(let k=-4;k<=4;k++){ for(let dp=-0.06;dp<=0.0601;dp+=0.015){ const p=Math.min(1,Math.max(0.05,p0+dp)); if(test(y0+k*0.016,p)) return best; } n++; if(n%2===0) yield n/tot; }
  return best; }
function mgBestPow(H,a,b,yaw){ mgPrep(H); const o={ez:true,dt:MG_EZDT,maxT:14}; let best=null; const test=p=>{ const s=mgRun(H,a,b,yaw,p*MG_VMAX,o), d=Math.hypot(s.a-H.cup[0],s.b-H.cup[1]), sc=s.done==='holed'?-100+p*2:(s.done==='water'||s.done==='out'?50+d:d); if(!best||sc<best.sc) best={yaw,p,sc,done:s.done}; return s.done==='holed'; };
  for(let p=0.1;p<=1.0001;p+=0.05) if(test(p)) return best; const p0=best.p; for(let dp=-0.04;dp<=0.0401;dp+=0.01) if(test(Math.min(1,Math.max(0.05,p0+dp)))) return best; return best; }
function mgBest(H,a,b){ const g=mgBestGen(H,a,b); let r; do{ r=g.next(); } while(!r.done); return r.value; }
/*MGCORE_END*/

/* ---- the terrace: paving next to the hotel, on the flattest free ground around it (built while loading, before the trees) ---- */
const MG_PU=23.6, MG_PV=12.8, MG_LIFT=0.36, MG_EMB=9;
// where each hole goes on the terrace: its tee (u, v) and its direction along u. Row 1 goes away from the hotel, row 2 comes back, row 3 goes again
const MG_LAY=[[21.5,-11,-1],[7.5,-11,-1],[-8,-11,-1],[-21.5,-3,1],[-7,-3,1],[8.5,-3,1],[21.5,5,-1],[6.5,5,-1],[-8.5,5,-1]];
const MG_ACC=['#e74c3c','#2f80ed','#f2994a','#9b51e0','#27ae60','#eb5757','#e2b100','#d35400','#8e44ad'];
const MG_PAR=MG_HOLES.reduce((a,H)=>a+H.par,0);
var MG={ok:false,pk:null,H:[],cur:0,st:0,card:[0,0,0,0,0,0,0,0,0],phase:'off',yaw:Math.PI/2,pow:0,pt:0,s:null,ball:[0,0],last:null,wa:0,view:false,acc:0,ez:null,ezPick:null,ezT:0,best:0,bh:[],hio:0,rounds:0,after:'',fx:[],grp:null,dots:null,pdots:null};
function mgPW(u,v){ const K=MG.pk; return [K.cx+u*K.c-v*K.s,K.cz+u*K.s+v*K.c]; }
function mgPUV(x,z){ const K=MG.pk, dx=x-K.cx, dz=z-K.cz; return [dx*K.c+dz*K.s,-dx*K.s+dz*K.c]; }
function mgW(Q,a,b,z){ return new V3(a,z,b).applyMatrix4(Q.M); }
function mgLocal(Q,p){ const v=p.clone().applyMatrix4(Q.Mi); return [v.x,v.z,v.y]; }
function mgTest(cx,cz,c,s,av,hb){ let mn=1e9,mx=-1e9; const PU=MG_PU+1.5, PV=MG_PV+1.5;
  for(let v=-PV;v<=PV+0.01;v+=PV/6) for(let u=-PU;u<=PU+0.01;u+=PU/10){ const x=cx+u*c-v*s, z=cz+u*s+v*c; const g=W.terrain(x,z); if(g<W.waterLevel(x,z)+0.8) return null; const k=W.surfAt(x,z); if(k>=3&&k<=7) return null;
    if(W.poolAt(x,z)||bldAt(x,z,3)) return null; if(hb&&x>hb.x0-10&&x<hb.x1+10&&z>hb.z0-14&&z<hb.z1+20) return null; for(const q of av) if(Math.hypot(x-q[0],z-q[1])<q[2]) return null;
    if(g<mn) mn=g; if(g>mx) mx=g; if(mx-mn>2.6) return null; }
  return {rng:mx-mn,max:mx}; }
function mgFind(){ const D=WP.kids&&WP.kids.mini; if(!D||!W.HOT) return null; const H=W.HOT, R=D.r||170, a0=(HX&&HX.F)?Math.atan2(HX.F.u[1],HX.F.u[0]):0;
  const av=[]; for(const p of (FL.pads||[])) av.push([p.x,p.z,14]); for(const r of (BK.racks||[])) av.push([r.x,r.z,9]); if(BK.pk) av.push([BK.pk.cx,BK.pk.cz,78]); for(const k of (WP.karts||[])) for(const p of k.pts) av.push([p[0],p[1],10]);
  let best=null;
  for(let dz=-R;dz<=R;dz+=6) for(let dx=-R;dx<=R;dx+=6){ const cx=H[0]+dx, cz=H[1]+dz, dd=Math.hypot(dx,dz); if(dd>R) continue;
    for(const da of [0,Math.PI,0.25,-0.25,Math.PI+0.25,Math.PI-0.25,Math.PI/2,-Math.PI/2]){ const a=a0+da, c=Math.cos(a), s=Math.sin(a); if((H[0]-cx)*c+(H[1]-cz)*s<0) continue; // the entrance (+u) faces the hotel
      const r=mgTest(cx,cz,c,s,av,W.HOT_B); if(!r) continue; const sc=dd+r.rng*14+(Math.abs(da)%Math.PI>0.3?25:0); if(!best||sc<best.sc) best={cx,cz,a,base:r.max+0.12,sc}; } }
  return best; }
// the ground on the terrace (walkable felt included) and its bank; null elsewhere. Called by terrainAt (g3b.js)
function mgGroundAt(x,z){ if(typeof MG==='undefined'||!MG||!MG.pk) return null; const K=MG.pk, dx=x-K.cx, dz=z-K.cz; if(dx>42||dx<-42||dz>42||dz<-42) return null;
  const u=dx*K.c+dz*K.s, v=-dx*K.s+dz*K.c, du=Math.max(0,Math.abs(u)-MG_PU), dv=Math.max(0,Math.abs(v)-MG_PV);
  if(du===0&&dv===0){ for(const Q of MG.H){ if(u<Q.u0||u>Q.u1||v<Q.v0||v>Q.v1) continue; const a=(v-Q.lv)*Q.f, b=(u-Q.lu)*Q.dir; if(mgInside(Q.H,a,b)) return MG.Y0+Math.max(-0.2,Q.H.h(a,b)); } return K.base; }
  const d=Math.hypot(du,dv); if(d>=MG_EMB) return null; const e=K.base-d*0.3; return e>W.terrain(x,z)?e:null; }
function buildMini(){ if(!WP.kids||!WP.kids.mini) return; const F=mgFind(); if(!F){ console.warn('minigolf: sin sitio'); return; }
  const K=MG.pk={cx:F.cx,cz:F.cz,a:F.a,c:Math.cos(F.a),s:Math.sin(F.a),base:F.base}; MG.Y0=K.base+MG_LIFT;
  const E=MG_EMB+1, ring=[[-MG_PU-E,-MG_PV-E],[MG_PU+E,-MG_PV-E],[MG_PU+E,MG_PV+E],[-MG_PU-E,MG_PV+E]].map(p=>mgPW(p[0],p[1]));
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const p of ring){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); z0=Math.min(z0,p[1]); z1=Math.max(z1,p[1]); } TREE_EXCL.push([x0,x1,z0,z1]); W.GRASS_CLEAR=(W.GRASS_CLEAR||[]).concat([ring]);
  MG.grp=new THREE.Group(); scene.add(MG.grp); mgPad(); for(let i=0;i<MG_HOLES.length;i++) mgHoleBuild(i); mgDecor(); mgBallBuild(); mgLoad(); MG.ok=true; }
function mgMat(){ if(!MG.mat) MG.mat=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}); return MG.mat; }
function mgGeo(pos,col,idx){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); if(idx) g.setIndex(idx); g.computeVertexNormals(); return g; }
function mgPad(){ const K=MG.pk, pos=[], col=[], idx=[], cc=new THREE.Color(), U=MG_PU+MG_EMB, V=MG_PV+MG_EMB, nu=Math.round(2*U)+1, nv=Math.round(2*V)+1;
  for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){ const u=-U+i, v=-V+j, du=Math.max(0,Math.abs(u)-MG_PU), dv=Math.max(0,Math.abs(v)-MG_PV), d=Math.hypot(du,dv), w=mgPW(u,v);
    pos.push(w[0],K.base-Math.min(d,MG_EMB)*0.3+(d>0?0:0.004),w[1]); let c='#93a65e', f=0.94+((i*7+j*3)%5)*0.025;
    if(d===0){ const edge=Math.abs(u)>MG_PU-0.8||Math.abs(v)>MG_PV-0.8; c=edge?'#b8a98d':'#e6dcc8'; f=edge?1:((Math.floor((u+40)/1.5)+Math.floor((v+40)/1.5))%2?0.97:1.03); }
    cc.set(c).convertSRGBToLinear(); col.push(cc.r*f,cc.g*f,cc.b*f); }
  for(let j=0;j<nv-1;j++) for(let i=0;i<nu-1;i++){ const a=j*nu+i, b=a+1, c=a+nu, d=c+1; idx.push(a,c,b,b,c,d); }
  const m=new THREE.Mesh(mgGeo(pos,col,idx),mgMat()); m.receiveShadow=true; MG.grp.add(m); MG.pad=m; }
// the colours of the felt: green with mowing stripes, and each hole's own touches (ramps, water, bridge, volcano, cobbles)
function mgFeltCol(H,i,a,b,z){ let c='#3aa64a', f=(Math.floor(b/0.5)%2)?0.96:1.04;
  if(i===6) c='#2f62c9'; if(H.loop&&b>5.2) c='#4aa8dc';
  if(Math.hypot(a-H.tee[0],b-H.tee[1])<0.22) return ['#2f8a4a',1];
  if(H.ramp&&b>H.ramp[0]&&b<H.ramp[1]+0.1&&z>0.01&&z<H.ramp[2]-0.01){ c=(Math.floor(b/0.22)%2)?'#f2c94c':'#f08a24'; f=1; }
  if(H.kick&&b>H.kick[0]&&b<H.kick[1]){ c=(Math.floor(b/0.2)%2)?'#f4efe6':'#d8432f'; f=1; }
  if(H.water&&z<-0.1) return ['#2c6f96',1];
  if(H.bridge&&b>H.bridge.b0&&b<H.bridge.b1&&Math.abs(a)<H.bridge.w+0.02) return [(Math.floor(b/0.14)%2)?'#a8743f':'#94622f',1];
  if(H.cone){ const C=H.cone, r=Math.hypot(a-C.a,b-C.b); if(r<C.cr) return ['#3a2a22',1]; if(r<C.cr+0.12) return ['#ff6a1a',1]; if(z>0.01) return [z>0.25?'#6b3a2a':'#8b5a3c',0.95+((Math.floor(a*9)+Math.floor(b*9))%3)*0.04]; }
  if(H.castle&&a>2.9) { c='#9a9a92'; f=((Math.floor(a/0.18)+Math.floor(b/0.18))%2)?0.93:1.05; }
  return [c,f]; }
function mgFelt(Q){ const H=Q.H, st=0.08, [a0,a1,b0,b1]=H.bb, na=Math.ceil((a1-a0)/st)+1, nb=Math.ceil((b1-b0)/st)+1, pos=[], col=[], idx=[], cc=new THREE.Color(), vid=new Int32Array(na*nb).fill(-1);
  const V=(i,j)=>{ const k=j*na+i; if(vid[k]>=0) return vid[k]; const a=Math.min(a1,a0+i*st), b=Math.min(b1,b0+j*st), z=Math.max(-0.3,H.h(a,b)); vid[k]=pos.length/3; pos.push(a,z,b); const q=mgFeltCol(H,Q.i,a,b,z); cc.set(q[0]).convertSRGBToLinear(); col.push(cc.r*q[1],cc.g*q[1],cc.b*q[1]); return vid[k]; };
  for(let j=0;j<nb-1;j++) for(let i=0;i<na-1;i++){ const ca=a0+(i+0.5)*st, cb=b0+(j+0.5)*st; if(!mgInside(H,ca,cb)) continue; const p=V(i,j), q=V(i+1,j), r=V(i,j+1), t=V(i+1,j+1); idx.push(p,r,q,q,r,t); }
  const m=new THREE.Mesh(mgGeo(pos,col,idx),mgMat()); m.receiveShadow=true; Q.g.add(m); pickables.push(m); Q.felt=m; }
// the border: inner face on the polygon edge (where the ball bounces), a coloured top and the outer face down to the paving
function mgWalls(Q){ const H=Q.H, pos=[], col=[], cc=new THREE.Color(), wh=H.wh||MG_WALL, t=0.08, bot=-MG_LIFT-0.01, acc=Cc(MG_ACC[Q.i]), wht=Cc('#f5f2ea'), sid=Cc('#ddd5c6');
  const quad=(p,q,r,s,c)=>{ for(const v of [p,q,r,p,r,s]){ pos.push(v[0],v[1],v[2]); col.push(c.r,c.g,c.b); } };
  for(const S of H.segs){ const n=Math.max(1,Math.ceil(S.L/0.2)); for(let k=0;k<n;k++){ const t0=k/n, t1=(k+1)/n, A=[S.x0+S.dx*t0,S.y0+S.dy*t0], B=[S.x0+S.dx*t1,S.y0+S.dy*t1];
      const ha=Math.max(0,H.h(A[0],A[1]))+wh, hb=Math.max(0,H.h(B[0],B[1]))+wh, la=Math.min(Math.max(-0.3,H.h(A[0],A[1])),0)-0.005, lb=Math.min(Math.max(-0.3,H.h(B[0],B[1])),0)-0.005;
      const Ao=[A[0]-S.nx*t,A[1]-S.ny*t], Bo=[B[0]-S.nx*t,B[1]-S.ny*t];
      quad([A[0],Math.min(la,bot),A[1]],[B[0],Math.min(lb,bot),B[1]],[B[0],hb,B[1]],[A[0],ha,A[1]],wht);
      quad([A[0],ha,A[1]],[B[0],hb,B[1]],[Bo[0],hb,Bo[1]],[Ao[0],ha,Ao[1]],acc);
      quad([Ao[0],ha,Ao[1]],[Bo[0],hb,Bo[1]],[Bo[0],bot,Bo[1]],[Ao[0],bot,Ao[1]],sid); } }
  const m=new THREE.Mesh(mgGeo(pos,col),mgMat()); m.castShadow=true; m.receiveShadow=true; Q.g.add(m); }
function mgBox(g,w,h,d,c,x,y,z,ry){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:Cc(c)})); m.position.set(x,y,z); if(ry) m.rotation.y=ry; m.castShadow=true; m.receiveShadow=true; g.add(m); return m; }
function mgCyl(g,r0,r1,h,c,x,y,z,seg){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg||12),new THREE.MeshLambertMaterial({color:Cc(c)})); m.position.set(x,y,z); m.castShadow=true; g.add(m); return m; }
function mgSignTex(i){ const H=MG_HOLES[i]; return canvasTex(256,128,(c,w,h)=>{ c.fillStyle='#fffaf0'; c.fillRect(0,0,w,h); c.strokeStyle=MG_ACC[i]; c.lineWidth=10; c.strokeRect(5,5,w-10,h-10);
  c.fillStyle=MG_ACC[i]; c.beginPath(); c.arc(56,64,38,0,7); c.fill(); c.fillStyle='#fff'; c.font='900 46px Figtree, system-ui, sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(i+1),56,66);
  c.fillStyle='#16231b'; c.textAlign='left'; c.font='800 25px Figtree, system-ui, sans-serif'; c.fillText(H.n,104,52); c.font='700 20px Figtree, system-ui, sans-serif'; c.fillStyle='#59665d'; c.fillText('Par '+H.par,104,84); }); }
function mgHoleBuild(i){ const H=mgPrep(MG_HOLES[i]), L=MG_LAY[i], dir=L[2], f=-dir, K=MG.pk; const Q={H,i,lu:L[0],lv:L[1],dir,f,bm:[],fl:0};
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9; for(const p of H.poly){ const u=L[0]+dir*p[1], v=L[1]+f*p[0]; u0=Math.min(u0,u); u1=Math.max(u1,u); v0=Math.min(v0,v); v1=Math.max(v1,v); } Object.assign(Q,{u0:u0-0.1,u1:u1+0.1,v0:v0-0.1,v1:v1+0.1});
  const o=mgPW(L[0],L[1]); Q.M=new THREE.Matrix4().set(-f*K.s,0,dir*K.c,o[0], 0,1,0,MG.Y0, f*K.c,0,dir*K.s,o[1], 0,0,0,1); Q.Mi=Q.M.clone().invert();
  const g=Q.g=new THREE.Group(); g.matrixAutoUpdate=false; g.matrix.copy(Q.M); MG.grp.add(g);
  mgFelt(Q); mgWalls(Q);
  // water, the hole with its flag, the tee mat and the sign
  if(H.water){ if(!MG.wmat) MG.wmat=new THREE.MeshPhongMaterial({color:Cc('#2f9ae0'),transparent:true,opacity:0.82,shininess:90,specular:Cc('#ffffff'),side:THREE.DoubleSide}); for(const w of H.water){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w.a1-w.a0,w.b1-w.b0),MG.wmat); m.rotation.x=-Math.PI/2; m.position.set((w.a0+w.a1)/2,w.z,(w.b0+w.b1)/2); g.add(m); } }
  { const cz=H.h(H.cup[0],H.cup[1]); const cup=new THREE.Mesh(new THREE.CircleGeometry(MG_CUP,20),new THREE.MeshBasicMaterial({color:Cc('#111111')})); cup.rotation.x=-Math.PI/2; cup.position.set(H.cup[0],cz+0.004,H.cup[1]); g.add(cup);
    const rim=new THREE.Mesh(new THREE.RingGeometry(MG_CUP,MG_CUP+0.018,24),new THREE.MeshBasicMaterial({color:Cc('#f4f4f4')})); rim.rotation.x=-Math.PI/2; rim.position.set(H.cup[0],cz+0.005,H.cup[1]); g.add(rim);
    const pole=mgCyl(g,0.007,0.007,0.72,'#f4f4f4',H.cup[0]+MG_CUP*0.6,cz+0.36,H.cup[1],6); pole.castShadow=false;
    const ft=canvasTex(64,48,(c,w,h)=>{ c.fillStyle=MG_ACC[i]; c.fillRect(0,0,w,h); c.fillStyle='#fff'; c.font='900 34px Figtree, system-ui, sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(i+1),w/2,h/2+2); });
    const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.22,0.16),new THREE.MeshBasicMaterial({map:ft,side:THREE.DoubleSide})); fl.position.set(H.cup[0]+MG_CUP*0.6+0.11,cz+0.63,H.cup[1]); fl.rotation.y=Math.PI/2; g.add(fl); Q.flag=fl; }
  { const mat=mgBox(g,0.44,0.012,0.32,'#5fb36b',H.tee[0],H.h(H.tee[0],H.tee[1])+0.006,H.tee[1]); mat.castShadow=false; const dot=new THREE.Mesh(new THREE.CircleGeometry(0.03,12),new THREE.MeshBasicMaterial({color:Cc('#ffffff')})); dot.rotation.x=-Math.PI/2; dot.position.set(H.tee[0],H.h(H.tee[0],H.tee[1])+0.014,H.tee[1]); g.add(dot); }
  { const sa=H.bb[0]-0.55, sg=new THREE.Group(); sg.position.set(sa,-MG_LIFT,-0.3); g.add(sg); mgCyl(sg,0.025,0.03,1.3,'#5d6670',0,0.62,0,8); const bd=new THREE.Mesh(new THREE.PlaneGeometry(0.84,0.42),new THREE.MeshBasicMaterial({map:mgSignTex(i),side:THREE.DoubleSide})); bd.position.set(0,1.3,0); bd.rotation.y=Math.PI; sg.add(bd); }
  if(H.mill) mgMill(Q); if(H.loop) mgLoopMesh(Q); if(H.bump) mgBumpers(Q); if(H.cone) mgVolcano(Q); if(H.castle) mgCastle(Q); if(H.bridge) for(const sa of [-1,1]) for(const bb of [H.bridge.b0,H.bridge.b1]) mgCyl(g,0.03,0.03,0.22,'#7a5230',sa*(H.bridge.w+0.02),0.03,bb,6);
  MG.H.push(Q); }
// the windmill: a little white house over the tunnel, red roof and four blades that turn in front of the mouth
function mgMill(Q){ const M=Q.H.mill, g=Q.g, zc=M.b+M.d/2;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.78,1.62,4,1),new THREE.MeshLambertMaterial({color:Cc('#f6f0e2')})); body.rotation.y=Math.PI/4; body.position.set(0,0.81,zc); body.castShadow=true; g.add(body);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(0.66,0.62,4),new THREE.MeshLambertMaterial({color:Cc('#c0392b')})); roof.rotation.y=Math.PI/4; roof.position.set(0,1.93,zc); roof.castShadow=true; g.add(roof);
  for(const zz of [M.b-0.005,M.b+M.d+0.005]){ const d=new THREE.Mesh(new THREE.PlaneGeometry(M.w*2+0.04,0.3),new THREE.MeshBasicMaterial({color:Cc('#1c1a18'),side:THREE.DoubleSide})); d.position.set(0,0.15,zz); g.add(d); }
  mgBox(g,0.36,0.24,0.02,'#7fb3e0',0,1.1,M.b-0.01); mgBox(g,0.42,0.06,0.04,'#2f6bd6',0,0.36,M.b-0.02);
  const hub=new THREE.Group(); hub.position.set(0,M.hub,M.b-0.12); g.add(hub); mgCyl(hub,0.07,0.07,0.1,'#5b3b24',0,0,0,10).rotation.x=Math.PI/2;
  for(let k=0;k<4;k++){ const arm=new THREE.Group(); arm.rotation.z=k*Math.PI/2; hub.add(arm); const bl=mgBox(arm,0.2,M.len-0.12,0.025,'#efe6d2',0,-(M.len+0.12)/2,0); for(let q=1;q<5;q++) mgBox(arm,0.22,0.018,0.03,'#8a5a32',0,-0.12-q*(M.len-0.12)/5,0.005); mgBox(arm,0.03,M.len,0.03,'#8a5a32',-0.1,-M.len/2,0.01); }
  Q.blades=hub; }
function mgBlocked(Q){ if(!Q||!Q.H.mill) return false; for(let k=0;k<4;k++){ let t=(MG.wa+k*Math.PI/2)%(2*Math.PI); if(t>Math.PI) t-=2*Math.PI; if(Math.abs(t)<0.3) return true; } return false; }
// the loop: a red track round a circle (seen side on), with yellow rails and two posts
function mgLoopMesh(Q){ const Lp=Q.H.loop, g=Q.g, R=Lp.r+MG_R, cz=Lp.r+MG_R, N=72, pos=[], col=[], c1=Cc('#e74c3c'), c2=Cc('#f1c40f'); const P=(ph,da,dr)=>{ const a=Lp.a+Lp.sh*ph/(2*Math.PI)+da, r=R+dr; return [a,cz-r*Math.cos(ph),Lp.b+r*Math.sin(ph)]; };
  const strip=(da0,da1,dr0,dr1,c)=>{ for(let k=0;k<N;k++){ const p0=k/N*2*Math.PI, p1=(k+1)/N*2*Math.PI, A=P(p0,da0,dr0), B=P(p1,da0,dr0), C=P(p1,da1,dr1), D=P(p0,da1,dr1); for(const v of [A,B,C,A,C,D]){ pos.push(v[0],v[1],v[2]); col.push(c.r,c.g,c.b); } } };
  strip(-0.17,0.17,0,0,c1); strip(-0.17,-0.17,0,-0.07,c2); strip(0.17,0.17,0,-0.07,c2); strip(-0.17,0.17,0.02,0.02,Cc('#a93226'));
  const m=new THREE.Mesh(mgGeo(pos,col),mgMat()); m.castShadow=true; g.add(m);
  for(const s of [-1,1]) mgCyl(g,0.03,0.04,cz+0.1,'#7f8c8d',Lp.a+Lp.sh/2+s*0.32,(cz+0.1)/2,Lp.b,8); mgBox(g,0.7,0.04,0.06,'#7f8c8d',Lp.a+Lp.sh/2,cz+0.08,Lp.b); }
function mgBumpers(Q){ for(const B of Q.H.bump){ mgCyl(Q.g,B.r,B.r*1.08,0.16,'#f4efe6',B.a,0.08,B.b,20); const top=new THREE.Mesh(new THREE.CylinderGeometry(B.r*0.92,B.r*0.92,0.05,20),new THREE.MeshLambertMaterial({color:Cc('#e74c3c'),emissive:Cc('#000000')})); top.position.set(B.a,0.18,B.b); Q.g.add(top); Q.bm.push({m:top,t:0}); } }
function mgVolcano(Q){ const C=Q.H.cone; Q.smoke=[]; for(let k=0;k<4;k++){ const m=new THREE.Mesh(new THREE.SphereGeometry(0.09,8,6),new THREE.MeshLambertMaterial({color:Cc('#cfcfcf'),transparent:true,opacity:0.5,depthWrite:false})); m.position.set(C.a,C.h,C.b); Q.g.add(m); Q.smoke.push({m,t:k*0.9}); } }
function mgCastle(Q){ const K=Q.H.castle, g=Q.g, st='#cdbf9f', h=0.95, am=(K.a0+K.a1)/2, aw=K.a1-K.a0;
  mgBox(g,aw,h,K.g0-K.b0,st,am,h/2,(K.b0+K.g0)/2); mgBox(g,aw,h,K.b1-K.g1,st,am,h/2,(K.g1+K.b1)/2); mgBox(g,aw,h-0.4,K.g1-K.g0,st,am,0.4+(h-0.4)/2,(K.g0+K.g1)/2);
  const door=new THREE.Mesh(new THREE.PlaneGeometry(K.g1-K.g0,0.4),new THREE.MeshBasicMaterial({color:Cc('#1c1a18'),side:THREE.DoubleSide})); door.rotation.y=Math.PI/2; door.position.set(K.a0-0.005,0.2,(K.g0+K.g1)/2); g.add(door);
  for(let q=0;q<7;q++){ const bz=K.b0+0.1+q*(K.b1-K.b0-0.2)/6; mgBox(g,0.16,0.14,0.14,st,K.a0+0.08,h+0.07,bz); mgBox(g,0.16,0.14,0.14,st,K.a1-0.08,h+0.07,bz); }
  for(const [ta,tb] of [[K.a0,K.b0],[K.a0,K.b1],[K.a1,K.b0],[K.a1,K.b1]]){ mgCyl(g,0.26,0.28,1.45,'#d6c9aa',ta,0.72,tb,14); const r=new THREE.Mesh(new THREE.ConeGeometry(0.33,0.45,14),new THREE.MeshLambertMaterial({color:Cc('#b03a2e')})); r.position.set(ta,1.67,tb); r.castShadow=true; g.add(r); }
  const ft=canvasTex(64,40,(c,w,h)=>{ c.fillStyle='#2f80ed'; c.fillRect(0,0,w,h); c.fillStyle='#f2c94c'; c.beginPath(); c.arc(w/2,h/2,11,0,7); c.fill(); });
  for(const tb of [K.b0,K.b1]){ mgCyl(g,0.01,0.01,0.4,'#555',K.a0,2.05,tb,5); const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.26,0.16),new THREE.MeshBasicMaterial({map:ft,side:THREE.DoubleSide})); fl.position.set(K.a0+0.13,2.17,tb); g.add(fl); } }
// the entrance arch, the ticket kiosk, benches, pots and lamps
function mgDecor(){ const K=MG.pk, g=new THREE.Group(); g.position.set(K.cx,K.base,K.cz); g.rotation.y=-K.a; MG.grp.add(g);
  const tex=canvasTex(512,128,(c,w,h)=>{ c.fillStyle='#fffaf0'; c.fillRect(0,0,w,h); c.lineWidth=8; c.strokeStyle='#16231b'; c.strokeRect(4,4,w-8,h-8); const t='MINIGOLF LOCO', cols=['#e74c3c','#f2994a','#e2b100','#27ae60','#2f80ed','#9b51e0']; c.font='900 62px Figtree, system-ui, sans-serif'; c.textBaseline='middle';
    let x=34; for(let k=0;k<t.length;k++){ c.fillStyle=cols[k%cols.length]; c.fillText(t[k],x,h/2+3); x+=c.measureText(t[k]).width+(t[k]===' '?2:3); } });
  const ax=MG_PU+0.4, av=-7; for(const s of [-1,1]) mgCyl(g,0.08,0.09,2.7,'#2f6bd6',ax,1.35,av+s*1.9,10); const bd=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.05),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide})); bd.position.set(ax,2.75,av); bd.rotation.y=Math.PI/2; g.add(bd); mgBox(g,0.12,0.14,4.3,'#2f6bd6',ax,3.32,av);
  { const kx=MG_PU-1.0, kv=0.5; mgBox(g,1.1,1.25,1.5,'#f4efe6',kx,0.625,kv); mgBox(g,0.04,0.5,1.2,'#2b2b2b',kx+0.56,1.0,kv); for(let q=0;q<6;q++) mgBox(g,1.5,0.05,0.26,q%2?'#ffffff':'#e74c3c',kx+0.15,1.4,kv-0.65+q*0.26); }
  { const hm=new THREE.MeshLambertMaterial({color:Cc('#3f7d3a')}), hg=new THREE.BoxGeometry(1,1,1), hed=(u0,v0,u1,v1)=>{ const L=Math.hypot(u1-u0,v1-v0); if(L<0.2) return; const m=new THREE.Mesh(hg,hm); m.scale.set(Math.abs(u1-u0)+0.5,0.55,Math.abs(v1-v0)+0.5); m.position.set((u0+u1)/2,0.275,(v0+v1)/2); m.castShadow=true; m.receiveShadow=true; g.add(m); };
    const e=0.35, U=MG_PU-e, V=MG_PV-e; hed(-U,-V,U,-V); hed(-U,V,U,V); hed(-U,-V+0.5,-U,V-0.5); hed(U,-V+0.5,U,-9.2); hed(U,-4.8,U,V-0.5); }
  for(const [bu,bv,r] of [[14,-7,0],[0,-7,0],[-15,-7,0],[14,1,0],[-1,1,0],[17,9.6,0]]){ mgBox(g,1.4,0.06,0.42,'#9a6a3c',bu,0.45,bv); mgBox(g,1.4,0.36,0.05,'#9a6a3c',bu,0.7,bv-0.2); for(const s of [-0.6,0.6]) mgBox(g,0.06,0.45,0.4,'#3c3f43',bu+s,0.22,bv); }
  for(const [pu,pv] of [[MG_PU-1.2,MG_PV-1.2],[-MG_PU+1.2,-MG_PV+1.2],[-MG_PU+1.2,MG_PV-1.2],[MG_PU-0.9,-4.1],[-2,9.5],[-19,-7],[8,-7]]){ mgCyl(g,0.3,0.22,0.5,'#c0643a',pu,0.25,pv,12); const b=new THREE.Mesh(new THREE.SphereGeometry(0.42,10,8),new THREE.MeshLambertMaterial({color:Cc('#4f8f3a')})); b.position.set(pu,0.8,pv); b.castShadow=true; g.add(b);
    for(let q=0;q<5;q++){ const fl=new THREE.Mesh(new THREE.SphereGeometry(0.07,6,5),new THREE.MeshLambertMaterial({color:Cc(['#ff6fae','#f2c94c','#ffffff','#e74c3c','#9b51e0'][q])})); fl.position.set(pu+Math.cos(q*1.3)*0.33,0.95+Math.sin(q*2.1)*0.12,pv+Math.sin(q*1.3)*0.33); g.add(fl); } }
  for(const [lu,lv] of [[MG_PU-1,MG_PV-3],[0,MG_PV-1],[-MG_PU+1,0],[0,-MG_PV+1]]){ mgCyl(g,0.05,0.06,3,'#2b2d30',lu,1.5,lv,8); const l=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8),new THREE.MeshBasicMaterial({color:Cc('#fff3c4')})); l.position.set(lu,3.05,lv); g.add(l); } }
function mgBallBuild(){ MG.bm=new THREE.Mesh(new THREE.SphereGeometry(MG_R,16,12),new THREE.MeshLambertMaterial({color:Cc('#ffffff'),emissive:Cc('#333333')})); MG.bm.castShadow=true; MG.bm.visible=false; scene.add(MG.bm);
  const dg=new THREE.SphereGeometry(0.018,6,4); MG.dots=new THREE.InstancedMesh(dg,new THREE.MeshBasicMaterial({color:Cc('#ffffff')}),60); MG.pdots=new THREE.InstancedMesh(new THREE.SphereGeometry(0.03,6,4),new THREE.MeshBasicMaterial({color:Cc('#ffd23f')}),90);
  for(const d of [MG.dots,MG.pdots]){ d.count=0; d.frustumCulled=false; d.visible=false; scene.add(d); }
  const ag=new THREE.BufferGeometry(); ag.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0.09, -0.07,0,0.0, 0.07,0,0.0],3)); MG.arrow=new THREE.Mesh(ag,new THREE.MeshBasicMaterial({color:Cc('#ffffff'),side:THREE.DoubleSide,transparent:true,opacity:0.9})); MG.arrow.visible=false; scene.add(MG.arrow);
  const cg=new THREE.BufferGeometry(); cg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(40*3),3)); cg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(40*3),3));
  MG.conf=new THREE.Points(cg,new THREE.PointsMaterial({size:0.07,vertexColors:true,transparent:true,opacity:1,depthWrite:false})); MG.conf.visible=false; MG.conf.frustumCulled=false; scene.add(MG.conf); MG.confV=[]; MG.confT=0; }

/* ---- playing: aim, charge and release like the golf swing, the ball rolls with the physics above ---- */
function mgLoad(){ try{ const o=JSON.parse(store.get('vg_mg')||'{}')||{}; if(Array.isArray(o.card)&&o.card.length===9&&o.d===new Date().toDateString()) MG.card=o.card.map(x=>clamp(x|0,0,7)); MG.best=+o.best||0; MG.bh=Array.isArray(o.bh)?o.bh.map(x=>x|0):[]; MG.hio=+o.hio||0; MG.rounds=+o.rounds||0; }catch(e){} }
function mgSave(){ store.set('vg_mg',JSON.stringify({card:MG.card,d:new Date().toDateString(),best:MG.best,bh:MG.bh,hio:MG.hio,rounds:MG.rounds})); }
function mgQ(){ return MG.H[MG.cur]; }
function mgTot(){ return MG.card.reduce((a,x)=>a+(x||0),0); }
function mgDone(){ return MG.card.filter(x=>x>0).length; }
function mgNextHole(){ for(let k=0;k<9;k++) if(!MG.card[k]) return k; return 0; }
function mgGo(i){ if(!MG.ok) return; if(!['walk','drive','ride','jet','bike','menu','drone','fly','mini'].includes(S.mode)){ toast('Minigolf','Termina antes lo que estás haciendo'); return; }
  if(i===undefined) i=mgNextHole(); if(i===0&&mgDone()===9){ MG.card=MG.card.map(()=>0); mgSave(); }
  closeModal(); hideMap(); for(const id of ['kdSheet','flSheet','bkSheet','hlSheet','cirSheet']){ const e=$(id); if(e) e.hidden=true; }
  fadeTo(()=>{ if(S.interior) exitVilla(); if(P.fly) flLeave(); if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(P.jet) dismountJet(); if(BK.b) bkUnmount({stay:true}); cirLand(); mpEnterWorld(); mgHole(i); });
  if(MP.code&&S.mode!=='mini') mpSend({t:'mgon'}); }
function mgHole(i){ const Q=MG.H[i]; if(!Q) return; const H=Q.H; MG.cur=i; MG.st=0; MG.ball=[H.tee[0],H.tee[1]]; MG.last=null; MG.s=null; MG.view=false; MG.yaw=H.aim!==undefined?H.aim:Math.atan2(H.cup[1]-H.tee[1],H.cup[0]-H.tee[0]);
  MG.phase='aim'; setMode('mini'); mgPlace(); S.snap=true; mgEzStart(); mgUI(); toast('Minigolf · hoyo '+(i+1)+' de 9',H.n+' · par '+H.par); }
function mgPlace(){ const Q=mgQ(); if(!Q) return; const b=mgW(Q,MG.ball[0],MG.ball[1],Q.H.h(MG.ball[0],MG.ball[1])), d=mgW(Q,MG.ball[0]+Math.cos(MG.yaw),MG.ball[1]+Math.sin(MG.yaw),Q.H.h(MG.ball[0],MG.ball[1])), wy=Math.atan2(d.z-b.z,d.x-b.x), face=wy+Math.PI/2;
  P.x=b.x-Math.cos(face)*0.62; P.z=b.z-Math.sin(face)*0.62; P.y=groundAt(P.x,P.z,b.y+1.5); P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=face; MG.wy=wy; }
function mgPress(){ if(S.mode!=='mini'||MG.phase!=='aim') return; ensureAudio(); MG.phase='charge'; MG.pt=0; MG.pow=0; mgRing(0); }
function mgRelease(){ if(S.mode!=='mini'||MG.phase!=='charge') return; const p=MG.pow; mgRing(0); if(p<0.03){ MG.phase='aim'; return; } mgHit(p); }
function mgHit(p){ const Q=mgQ(), H=Q.H, ez=ezOn(); const yaw=MG.yaw+(ez?0:gauss()*CLUBS[8].err*Math.PI/180); MG.s=mgShoot(H,MG.ball[0],MG.ball[1],yaw,p*MG_VMAX); MG.last=MG.ball.slice(); MG.st++; MG.phase='roll'; MG.acc=0; MG.view=false; MG.sw=0; MG.sb=0; blip('hit'); mgUI(); }
function mgView(){ if(S.mode!=='mini') return; MG.view=!MG.view; mgUI(); }
function mgAim(d){ if(S.mode!=='mini'||MG.phase!=='aim') return; MG.yaw+=d; mgPlace(); }
function mgExit(){ if(S.mode!=='mini') return; MG.phase='off'; MG.ezJob=null; if(MG.bm) MG.bm.visible=false; setMode('walk'); camS.yaw=P.yaw-Math.PI/2; tip('Has salido del minigolf. Vuelve cuando quieras: «Minigolf» en el menú o anda hasta un tee',3600); }
function mgPlay(dt){ const Q=mgQ(); if(!Q) return; const H=Q.H;
  if(MG.phase==='charge'){ MG.pt+=dt; const up=1.25; MG.pow=MG.pt<up?MG.pt/up:1-(MG.pt-up)/up; if(MG.pow<=0){ MG.pow=0; MG.phase='aim'; mgRing(0); return; } mgRing(MG.pow);
    if(ezOn()&&MG.ezPick&&MG.pt<up&&MG.pow>=MG.ezPick.p){ MG.pow=MG.ezPick.p; mgRelease(); } return; }
  if(MG.phase==='roll'&&MG.s){ const s=MG.s, ez=ezOn(), st=ez?MG_EZDT:1/240, o={ez,blk:()=>mgBlocked(Q)}; MG.acc+=Math.min(dt,0.05); let n=0;
    while(MG.acc>=st&&!s.done&&n<40){ mgStep(H,s,st,o); MG.acc-=st; n++; }
    if(s.walls>MG.sw){ MG.sw=s.walls; mgTock(0.4); } if(s.bumps>MG.sb){ MG.sb=s.bumps; const B=Q.bm[s.bumpI]; if(B) B.t=0.35; mgTock(1); } if(s.mill&&s.millT>(MG.millT||-1)){ MG.millT=s.millT; mgTock(0.7); }
    if(s.done) mgEnd(s.done); return; }
  if(MG.phase==='pause'){ MG.pt-=dt; if(MG.pt<=0){ if(MG.after==='next'){ if(MG.cur<8){ const n=MG.cur+1; fadeTo(()=>{ if(MG.phase==='wait'&&S.mode==='mini') mgHole(n); }); MG.phase='wait'; } else mgRoundEnd(); } else { MG.phase='aim'; mgPlace(); mgEzStart(); mgUI(); } } } }
function mgEnd(k){ const Q=mgQ(), H=Q.H, s=MG.s, i=MG.cur, ez=ezOn();
  if(k==='holed'){ MG.card[i]=MG.st; if(!ez&&(!MG.bh[i]||MG.st<MG.bh[i])) MG.bh[i]=MG.st; blip('cup'); const d=MG.st-H.par; toast(MG.st===1?'¡Hoyo en uno!':scoreName(MG.st,H.par),MG.st+(MG.st===1?' golpe':' golpes')+' · '+(d===0?'par':(d>0?'+':'')+d)+' · total '+mgTot());
    const c=mgW(Q,H.cup[0],H.cup[1],H.h(H.cup[0],H.cup[1])+0.1); mgConfetti(c,MG.st===1?40:22); P.cheerT=2.2; if(MG.st===1){ MG.hio++; prgEarn(5,'Hoyo en uno en el minigolf'); prgTrophy('mghio'); } else if(d<0) prgEarn(2,'Bajo par en el minigolf');
    mgSave(); MG.phase='pause'; MG.pt=2.6; MG.after='next'; MG.ball=[H.cup[0],H.cup[1]]; }
  else if(k==='water'||k==='out'){ if(!ez) MG.st++; const sp=s.splash?mgW(Q,s.splash[0],s.splash[1],s.splash[2]):mgW(Q,s.a,s.b,0); if(k==='water'){ startSplash(sp.x,sp.z,sp.y); blip('water'); }
    toast(k==='water'?'¡Al agua!':'Fuera de la pista',ez?'En modo fácil no cuenta golpe: repites':'+1 golpe · repites desde donde golpeaste'); MG.ball=MG.last.slice(); MG.phase='pause'; MG.pt=1.5; MG.after='aim'; MG.s=null;
    if(MG.st>=6){ MG.card[i]=7; mgSave(); toast('Bola recogida','Máximo de 6 golpes: te apuntas 7'); MG.after='next'; } }
  else { MG.ball=[s.a,s.b]; MG.s=null; if(MG.st>=6){ MG.card[i]=7; mgSave(); toast('Bola recogida','Máximo de 6 golpes: te apuntas 7'); MG.phase='pause'; MG.pt=1.6; MG.after='next'; } else { MG.phase='pause'; MG.pt=0.45; MG.after='aim'; } }
  mgUI(); }
function mgRoundEnd(){ const t=mgTot(), d=t-MG_PAR, ez=ezOn(); MG.rounds++; if(!ez&&(!MG.best||t<MG.best)) MG.best=t; mgSave(); prgEarn(10,'Minigolf terminado'); if(d<=0){ prgEarn(10,'Minigolf al par o mejor'); prgTrophy('minigolf'); }
  MG.phase='off'; if(MG.bm) MG.bm.visible=false; setMode('walk'); camS.yaw=P.yaw-Math.PI/2; toast('¡Minigolf terminado!',t+' golpes · '+(d===0?'al par':(d>0?'+':'')+d+' sobre el par')+(ez?' · en modo fácil no cuenta como récord':(MG.best===t?' · tu mejor vuelta':'')));
  setTimeout(()=>{ if(S.mode==='walk') kdSheet('minigolf'); },1800); }
function mgTock(v){ if(!AC||!SOUND) return; const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain(); o.type=v>=1?'square':'triangle'; o.frequency.setValueAtTime(v>=1?660:320,t); o.frequency.exponentialRampToValueAtTime(v>=1?990:180,t+0.07); g.gain.setValueAtTime(0.08*v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.12); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.14); }
function mgConfetti(p,n){ const a=MG.conf.geometry.attributes.position.array, c=MG.conf.geometry.attributes.color.array, cc=new THREE.Color(); MG.confV=[]; for(let k=0;k<40;k++){ a[k*3]=p.x; a[k*3+1]=p.y; a[k*3+2]=p.z; cc.set(MG_ACC[k%9]); c[k*3]=cc.r; c[k*3+1]=cc.g; c[k*3+2]=cc.b; const an=Math.random()*6.28, sp=0.6+Math.random()*1.6; MG.confV.push(k<n?[Math.cos(an)*sp,2+Math.random()*2.5,Math.sin(an)*sp]:null); }
  MG.conf.geometry.setDrawRange(0,n); MG.conf.geometry.attributes.position.needsUpdate=true; MG.conf.geometry.attributes.color.needsUpdate=true; MG.conf.visible=true; MG.confT=1.8; MG.conf.material.opacity=1; }
// the easy mode looks for a good shot (direction and strength) a few tries per frame, then aims there and the strength stops by itself
function mgEzStart(){ MG.ezPick=null; MG.ezJob=null; if(!ezOn()||S.mode!=='mini') return; const Q=mgQ(); MG.ezJob=mgBestGen(Q.H,MG.ball[0],MG.ball[1]); MG.ezPct=0; }
function mgEzTick(){ if(!MG.ezJob){ if(ezOn()&&S.mode==='mini'&&MG.phase==='aim'&&MG.ezPick&&Math.abs(MG.yaw-MG.ezPick.yaw)>0.004){ const t=performance.now(); if(MG.ezYaw!==MG.yaw){ MG.ezYaw=MG.yaw; MG.ezYT=t; } else if(t-MG.ezYT>300){ const Q=mgQ(); MG.ezPick=mgBestPow(Q.H,MG.ball[0],MG.ball[1],MG.yaw); mgUI(); } } return; } const t0=performance.now(); let r; do{ r=MG.ezJob.next(); if(!r.done) MG.ezPct=r.value; } while(!r.done&&performance.now()-t0<12);
  if(r.done){ MG.ezJob=null; MG.ezPick=r.value; if(MG.ezPick&&MG.phase==='aim'){ MG.yaw=MG.ezPick.yaw; mgPlace(); } mgUI(); } }
function mgPredict(){ const Q=mgQ(); if(!Q||!MG.ezPick) return null; const k=MG.ezPick.yaw+'|'+MG.ezPick.p+'|'+MG.yaw+'|'+MG.ball; if(MG.predK===k) return MG.pred; MG.predK=k;
  const s=mgRun(Q.H,MG.ball[0],MG.ball[1],MG.yaw,MG.ezPick.p*MG_VMAX,{ez:true,dt:MG_EZDT,maxT:14},true); MG.pred=s.path; return MG.pred; }
// the aim line: straight ahead to the first wall and one bounce, ~3 m in all
function mgAimLine(H,a,b,yaw){ const pts=[]; let x=a, y=b, dx=Math.cos(yaw), dy=Math.sin(yaw), left=3.2, bounce=0;
  while(left>0&&bounce<2){ let tmin=left, hit=null; for(const S of H.segs){ const den=dx*S.dy-dy*S.dx; if(Math.abs(den)<1e-9) continue; const ex=S.x0-x, ey=S.y0-y, t=(ex*S.dy-ey*S.dx)/den, u=(ex*dy-ey*dx)/den; if(t>0.02&&u>=0&&u<=1){ const tt=t-MG_R/Math.max(0.2,Math.abs(dx*S.nx+dy*S.ny)); if(tt<tmin){ tmin=Math.max(0,tt); hit=S; } } }
    const n=Math.max(1,Math.floor(tmin/0.12)); for(let k=1;k<=n;k++) pts.push([x+dx*tmin*k/n,y+dy*tmin*k/n]); x+=dx*tmin; y+=dy*tmin; left-=tmin; if(!hit) break; const vn=dx*hit.nx+dy*hit.ny; dx-=2*vn*hit.nx; dy-=2*vn*hit.ny; bounce++; }
  return pts; }
const _mgM=new THREE.Matrix4();
function mgDots(D,pts,Q,max){ const n=Math.min(pts.length,max); for(let k=0;k<n;k++){ const p=pts[k], w=mgW(Q,p[0],p[1],(p.length>2?p[2]:Q.H.h(p[0],p[1]))+MG_R*0.6); _mgM.makeTranslation(w.x,w.y,w.z); D.setMatrixAt(k,_mgM); } D.count=n; D.instanceMatrix.needsUpdate=true; D.visible=n>0; }
// every frame (also when you are not playing): the blades turn, the bumpers flash, smoke, confetti, the ball and the aim
function mgTick(dt){ if(!MG.ok) return; const near=Math.hypot(camera.position.x-MG.pk.cx,camera.position.z-MG.pk.cz)<260, me=S.mode==='mini';
  if(near){ const Qm=MG.H[1], ez=ezOn()&&me&&MG.cur===1; if(ez){ const tgt=Math.round((MG.wa-Math.PI/4)/(Math.PI/2))*(Math.PI/2)+Math.PI/4; MG.wa+=clamp(tgt-MG.wa,-dt*1.2,dt*1.2); } else MG.wa=(MG.wa+dt*1.25)%(Math.PI*2); if(Qm&&Qm.blades) Qm.blades.rotation.z=-MG.wa;
    for(const Q of MG.H){ for(const B of Q.bm){ if(B.t>0){ B.t-=dt; B.m.material.emissive.set(B.t>0?'#ff8a3d':'#000000'); } } if(Q.smoke) for(const sm of Q.smoke){ sm.t=(sm.t+dt)%3.6; const C=Q.H.cone, f=sm.t/3.6; sm.m.position.set(C.a+Math.sin(sm.t*2)*0.05,C.h+f*1.3,C.b); sm.m.scale.setScalar(0.6+f*2.2); sm.m.material.opacity=0.45*(1-f); } } }
  if(MG.confT>0){ MG.confT-=dt; const a=MG.conf.geometry.attributes.position.array; for(let k=0;k<40;k++){ const v=MG.confV[k]; if(!v) continue; v[1]-=6*dt; a[k*3]+=v[0]*dt; a[k*3+1]+=v[1]*dt; a[k*3+2]+=v[2]*dt; } MG.conf.geometry.attributes.position.needsUpdate=true; MG.conf.material.opacity=Math.min(1,MG.confT/0.6); if(MG.confT<=0) MG.conf.visible=false; }
  mgEzTick();
  const Q=mgQ(); if(!me||!Q){ if(MG.bm.visible){ MG.bm.visible=false; MG.dots.visible=MG.pdots.visible=MG.arrow.visible=false; } return; }
  let p; if(MG.s&&(MG.phase==='roll')){ const s=MG.s; p=mgW(Q,s.a,s.b,s.z+MG_R); } else p=mgW(Q,MG.ball[0],MG.ball[1],Q.H.h(MG.ball[0],MG.ball[1])+MG_R);
  const sunk=MG.phase==='pause'&&MG.after==='next'&&MG.card[MG.cur]&&MG.card[MG.cur]<7; MG.bm.visible=true; MG.bm.position.copy(p); if(sunk) MG.bm.position.y-=0.06;
  const aiming=MG.phase==='aim'||MG.phase==='charge';
  if(aiming&&!MG.view){ mgDots(MG.dots,mgAimLine(Q.H,MG.ball[0],MG.ball[1],MG.yaw),Q,60); const pr=ezOn()&&MG.ezPick?mgPredict():null; if(pr) mgDots(MG.pdots,pr,Q,90); else MG.pdots.visible=false;
    const d=mgW(Q,MG.ball[0]+Math.cos(MG.yaw),MG.ball[1]+Math.sin(MG.yaw),0), wy=Math.atan2(d.z-p.z,d.x-p.x); MG.arrow.visible=true; MG.arrow.position.set(p.x+Math.cos(wy)*0.12,p.y-MG_R+0.01,p.z+Math.sin(wy)*0.12); MG.arrow.rotation.set(0,-wy+Math.PI/2,0); const sc=1+(MG.phase==='charge'?MG.pow*3:0); MG.arrow.scale.set(1,1,sc); }
  else { MG.dots.visible=MG.pdots.visible=MG.arrow.visible=false; }
  if(aiming) mgUIt(dt); }
function mgPose(){ if(MG.phase==='charge') return ['swing',MG.pow*0.25]; return ['address',0]; }
function mgCam(){ const Q=mgQ(); if(!Q) return 6; const H=Q.H;
  if(MG.view){ const C=mgW(Q,(H.bb[0]+H.bb[1])/2,(H.bb[2]+H.bb[3])/2,0), t=mgW(Q,H.tee[0],H.tee[1]-2.2,0), L=H.bb[3]-H.bb[2]; camT.pos.set(t.x,t.y+3.2+L*0.5,t.z); camT.look.set(C.x,C.y,C.z); return 3; }
  if(MG.phase==='roll'&&MG.s){ const s=MG.s, b=mgW(Q,s.a,s.b,s.z+MG_R); let va=s.va, vb=s.vb; if(Math.hypot(va,vb)<0.4){ va=Math.cos(MG.yaw); vb=Math.sin(MG.yaw); } const l=Math.hypot(va,vb), d=mgW(Q,s.a+va/l,s.b+vb/l,s.z+MG_R); const dx=d.x-b.x, dz=d.z-b.z;
    const up=(s.loop||s.air)?1.9:1.3; camT.pos.set(b.x-dx*2.4,b.y+up,b.z-dz*2.4); camT.look.set(b.x,b.y+0.1,b.z); return 3.5; }
  const b=mgW(Q,MG.ball[0],MG.ball[1],H.h(MG.ball[0],MG.ball[1])), d=mgW(Q,MG.ball[0]+Math.cos(MG.yaw),MG.ball[1]+Math.sin(MG.yaw),H.h(MG.ball[0],MG.ball[1])), dx=d.x-b.x, dz=d.z-b.z;
  camT.pos.set(b.x-dx*2.5-dz*0.45,b.y+1.25,b.z-dz*2.5+dx*0.45); camT.look.set(b.x+dx*1.7,b.y+0.05,b.z+dz*1.7); return 6; }
function mgTap(pt){ if(MG.phase!=='aim') return; const Q=mgQ(), l=mgLocal(Q,pt); if(Math.hypot(l[0]-MG.ball[0],l[1]-MG.ball[1])<0.15) return; MG.yaw=Math.atan2(l[1]-MG.ball[1],l[0]-MG.ball[0]); mgPlace(); }
function mgKey(e,down){ if(down){ if(e.code==='Space'){ e.preventDefault(); if(!e.repeat) mgPress(); } else if(e.key==='ArrowLeft') mgAim(-0.006); else if(e.key==='ArrowRight') mgAim(0.006); else if(e.key==='v'||e.key==='V') mgView(); else if(e.key==='Escape') mgExit(); }
  else if(e.code==='Space') mgRelease(); }
function mgGamepad(g){ if(g.lx&&MG.phase==='aim') mgAim(g.lx*g.dt*0.35); if(g.down(GPB.LEFT)) mgAim(-0.01); if(g.down(GPB.RIGHT)) mgAim(0.01);
  if(g.down(GPB.RT)||g.down(GPB.A)) mgPress(); if(g.up(GPB.RT)||g.up(GPB.A)) mgRelease(); if(g.down(GPB.Y)) mgView(); if(g.down(GPB.X)) kdSheet('minigolf'); if(g.down(GPB.B)) mgExit(); }

/* ---- on screen: the card of the hole, the ring and the buttons ---- */
function mgHUD(){ const h=$('mgHud'); if(h) h.hidden=S.mode!=='mini'; document.body.classList.toggle('mgon',S.mode==='mini'); const ep=$('ezPill'); if(ep) ep.hidden=!(ezOn()&&!['menu','loading','drone','view','photo','replay','rround','mini'].includes(S.mode)); }
function mgRing(p){ const f=Math.max(0,Math.min(1,p)); $('mgRingFill').setAttribute('stroke-dasharray',(ringC*f)+' '+ringC); $('mgRingFill').setAttribute('stroke',f>0.85?'#d6442a':'#255d3c'); }
function mgUI(){ if(!MG.ok) return; const Q=mgQ(); if(!Q) return; const H=Q.H, i=MG.cur;
  $('mgTitle').innerHTML='Hoyo '+(i+1)+' de 9<small>Par '+H.par+'</small>'; $('mgName').textContent=H.ic+' '+H.n; $('mgStroke').textContent='Golpe '+(MG.st+(MG.phase==='roll'?0:1)); const t=mgTot(), dn=mgDone(), pp=MG.card.reduce((a,x,k)=>a+(x?MG_HOLES[k].par:0),0);
  $('mgTot').textContent=dn?'Total '+t+' ('+(t-pp>0?'+':'')+(t-pp===0?'par':t-pp)+')':'Total 0'; $('mgTxt').textContent=H.txt;
  $('mgView').classList.toggle('on',MG.view); $('mgEz').hidden=!ezOn(); mgBoard(); }
function mgUIt(dt){ MG.uiT=(MG.uiT||0)-dt; if(MG.uiT>0) return; MG.uiT=0.25; const e=$('mgEz'); if(!ezOn()){ e.hidden=true; return; } e.hidden=false; e.textContent=MG.ezJob?'Modo fácil: buscando el mejor golpe… '+Math.round(MG.ezPct*100)+' %':(MG.ezPick?(MG.ezPick.done==='holed'?'Modo fácil: los puntos amarillos van al hoyo. Pulsa GOLPEAR y la fuerza se para sola (puedes cambiar la puntería)':'Modo fácil: con esta puntería la bola se queda cerca. Pulsa GOLPEAR y la fuerza se para sola'):''); }
function mgBoard(){ const b=$('mgBoard'); if(!b) return; const L=mgRank(); if(L.length<2){ b.hidden=true; return; } b.hidden=false; b.innerHTML='<b>Con la sala</b>'+L.map(r=>'<div'+(r.me?' class="me"':'')+'>'+esc(r.n)+': '+r.t+(r.t===1?' golpe · ':' golpes · ')+r.d+(r.d===1?' hoyo':' hoyos')+(r.h>=0&&!r.me?' · va por el '+(r.h+1):'')+'</div>').join(''); }
function mgRank(){ const L=[{n:'Tú',t:mgTot(),d:mgDone(),rel:mgTot()-MG.card.reduce((a,x,k)=>a+(x?MG_HOLES[k].par:0),0),h:MG.cur,me:1}]; if(MP.code) for(const p of MP.peers.values()) if(p.mgS) L.push({n:p.n||'Amigo',t:p.mgS.t,d:p.mgS.d,rel:p.mgS.r,h:p.mgS.on?p.mgS.h:-1}); L.sort((a,b)=>a.rel-b.rel||b.d-a.d); return L; }

/* ---- with the room: your ball and your card travel in the state (mg); «mgon» invites the others ---- */
function mgNetState(o){ if(!MG.ok) return; const dn=mgDone(); if(S.mode!=='mini'&&!dn) return; const r2=x=>Math.round(x*100); let u=0,v=0,z=0;
  if(S.mode==='mini'){ const Q=mgQ(), s=MG.s, a=s&&MG.phase==='roll'?s.a:MG.ball[0], b=s&&MG.phase==='roll'?s.b:MG.ball[1], zz=s&&MG.phase==='roll'?s.z:Q.H.h(a,b); const w=mgW(Q,a,b,zz), q=mgPUV(w.x,w.z); u=q[0]; v=q[1]; z=zz; }
  o.mg=[S.mode==='mini'?MG.cur:-1,r2(u),r2(v),r2(z),MG.st,mgTot(),dn,mgTot()-MG.card.reduce((a,x,k)=>a+(x?MG_HOLES[k].par:0),0)]; }
function mgOK(a){ return Array.isArray(a)&&a.length===8&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<60000)?a:null; }
function mgPeer(p,s,inWorld){ const q=s&&s.mg; p.mgS=q?{h:q[0],t:q[5],d:q[6],r:q[7],on:q[0]>=0}:null; const show=inWorld&&q&&q[0]>=0&&MG.ok&&s.m==='mini';
  if(!show){ if(p.mgB) p.mgB.visible=false; return; } if(!p.mgB){ p.mgB=new THREE.Mesh(new THREE.SphereGeometry(MG_R,12,8),new THREE.MeshLambertMaterial({color:Cc(pSkin(p).shirt),emissive:Cc('#222222')})); p.mgB.castShadow=true; scene.add(p.mgB); }
  const w=mgPW(q[1]/100,q[2]/100); p.mgB.visible=true; p.mgB.position.set(w[0],MG.Y0+q[3]/100+MG_R,w[1]); }
function mgNetIn(p,o){ if(o.t==='mgon'&&MG.ok&&S.mode!=='mini') mpPrompt('<b>'+esc(p.n)+'</b> está jugando al <b>minigolf loco</b> junto al hotel. ¿Juegas tú también? Cada uno con su bola y una clasificación común.','Sí, al minigolf',()=>mgGo(),15000); }

/* ---- the map, its legend, the guide, the glossary and the tab of the sheet ---- */
function mgDrawMap(g,m2c,s,big){ if(!MG.ok) return; g.save(); const c=[[-MG_PU,-MG_PV],[MG_PU,-MG_PV],[MG_PU,MG_PV],[-MG_PU,MG_PV]].map(p=>{ const w=mgPW(p[0],p[1]); return m2c(w[0],w[1]); });
  g.fillStyle='rgba(230,220,200,.9)'; g.strokeStyle='#2f9e44'; g.lineWidth=1.4*s; g.beginPath(); c.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle='#2f9e44'; g.lineWidth=(big?2:1.4)*s; for(const Q of MG.H){ const a=mgW(Q,Q.H.tee[0],Q.H.tee[1],0), b=mgW(Q,Q.H.cup[0],Q.H.cup[1],0), p=m2c(a.x,a.z), q=m2c(b.x,b.z); g.beginPath(); g.moveTo(p[0],p[1]); g.lineTo(q[0],q[1]); g.stroke(); }
  if(big){ const m=mgPW(0,0), p=m2c(m[0],m[1]); g.fillStyle='#16231b'; g.font='800 '+(7*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('Minigolf',p[0],p[1]-9*s); }
  g.restore(); }
function mgLegend(){ return MG.ok?'<div><i style="background:rgba(230,220,200,.9);border:2px solid #2f9e44"></i>Minigolf loco junto al hotel: 9 hoyos (las líneas verdes van del tee al hoyo)</div>':''; }
function mgGuideHTML(){ if(!MG.ok) return ''; return '<li><b>Minigolf loco</b> (junto al hotel; botón <b>Para los peques</b> del inicio o <b>Peques</b> del menú, o anda hasta un tee del minigolf): nueve hoyos con <b>molino</b>, <b>rampa</b>, <b>looping</b>, <b>río con puente</b>, <b>salto</b> sobre un estanque, <b>setas</b> que rebotan, <b>volcán</b> y <b>castillo</b>. Se juega como un putt: apunta con ◀ ▶ (o arrastrando, o tocando el fieltro), mantén <b>GOLPEAR</b> y suelta cuando el anillo marque la fuerza. Los puntos blancos son la línea de tiro hasta la primera banda y su rebote. Al agua o fuera de la pista: un golpe más y repites. Máximo de 6 golpes por hoyo (apuntas 7). Con la sala, cada uno juega su bola y salís todos en la misma clasificación.</li>'; }
function mgGlossHTML(){ return '<dt>Minigolf loco</dt><dd>Golf en pequeño, con el putter, por pistas de fieltro con bandas y obstáculos. Se cuentan los golpes; el par de cada hoyo es lo normal (24 en los nueve).</dd><dt>Banda</dt><dd>El borde de la pista: la bola rebota en ella, así que puedes apuntar a una banda para llegar al hoyo por carambola.</dd><dt>Looping</dt><dd>La vuelta completa en vertical del hoyo 4: la bola necesita bastante velocidad para no caerse en lo alto.</dd><dt>Línea de tiro</dt><dd>Los puntos blancos delante de la bola: por dónde sale y cómo rebota en la primera banda. En modo fácil, los puntos amarillos son el recorrido entero que hará la bola.</dd>'; }
function mgTabHTML(){ if(!MG.ok) return '<p>El minigolf no está en este mundo.</p>'; const dn=mgDone(), t=mgTot(), nx=mgNextHole();
  let h='<p>Nueve hoyos locos en una terraza junto al <b>hotel</b>, con molino, rampa, looping, río, salto, setas, volcán y castillo. Se juega con el putter y la misma física del golf: la bola rueda, sube y baja cuestas, rebota en las bandas y entra en el hoyo si llega despacio.</p>';
  h+='<div class="row"><button class="btn small primary" id="mgPlay">'+(dn&&dn<9?'Seguir: hoyo '+(nx+1):'Jugar desde el hoyo 1')+'</button>'+(dn?'<button class="btn small" id="mgNew">Tarjeta nueva</button>':'')+'</div>';
  h+='<div class="tablewrap"><table class="card"><thead><tr><th>Hoyo</th><th>Qué tiene</th><th>Par</th><th>Golpes</th><th>Tu mejor</th><th></th></tr></thead><tbody>'+MG_HOLES.map((H,k)=>'<tr><td>'+(k+1)+'</td><td>'+H.ic+' '+H.n+'</td><td>'+H.par+'</td><td class="num">'+(MG.card[k]||'—')+'</td><td class="num">'+(MG.bh[k]||'—')+'</td><td><button class="btn small" data-mgh="'+k+'">Jugar</button></td></tr>').join('')+'</tbody><tfoot><tr><td>Total</td><td></td><td>'+MG_PAR+'</td><td class="num">'+(dn?t:'—')+'</td><td class="num">'+(MG.best||'—')+'</td><td></td></tr></tfoot></table></div>';
  h+='<p class="note">Tu mejor vuelta de nueve: '+(MG.best?'<b>'+MG.best+' golpes</b>':'aún ninguna')+' · vueltas terminadas: '+MG.rounds+' · hoyos en uno: '+MG.hio+'. La tarjeta de hoy se guarda en este dispositivo.</p>';
  const R=mgRank(); if(R.length>1) h+='<h3>Con la sala</h3><div class="tablewrap"><table class="card"><thead><tr><th>Puesto</th><th>Jugador</th><th>Golpes</th><th>Hoyos</th><th>Respecto al par</th></tr></thead><tbody>'+R.map((r,k)=>'<tr><td>'+(k+1)+'</td><td>'+esc(r.n)+'</td><td class="num">'+r.t+'</td><td class="num">'+r.d+'</td><td class="num">'+(r.rel>0?'+':'')+(r.rel===0?'par':r.rel)+'</td></tr>').join('')+'</tbody></table></div>';
  h+='<h3>Cómo se juega</h3><ul><li><b>Apuntar:</b> ◀ ▶, arrastrando el dedo por la pantalla o tocando el fieltro donde quieres tirar. Flechas del teclado; en el mando, stick izquierdo o cruceta.</li><li><b>Fuerza:</b> mantén <b>GOLPEAR</b> (Espacio; R2 o ✕ en el mando): el anillo se llena y luego se vacía. Suelta cuando marque la fuerza que quieres; casi lleno (rojo) es un golpe muy fuerte.</li><li><b>Vista:</b> ve el hoyo entero desde arriba (V; △ en el mando).</li><li><b>Agua y fuera:</b> un golpe más y repites desde donde golpeaste. Máximo de 6 golpes por hoyo: si no entra, te apuntas 7.</li><li><b>Hoyo:</b> la bola entra si llega despacio; si va muy rápida, se escapa por el borde.</li></ul>';
  h+='<h3>Cómo se lee</h3><ul><li><b>Puntos blancos:</b> la línea de tiro hasta la primera banda y su rebote.</li><li><b>Puntos amarillos</b> (solo en modo fácil): el recorrido entero que hará la bola con la fuerza elegida.</li><li><b>Flecha blanca</b> junto a la bola: hacia dónde sale; al cargar, se alarga con la fuerza.</li><li><b>Banderita</b> con el número: el hoyo. El cartel del tee dice el número, el nombre y el par.</li><li><b>Anillo de fuerza:</b> verde hasta el 85 %, rojo por encima.</li></ul>';
  return h; }
function mgTabWire(){ const pl=$('mgPlay'); if(pl) pl.onclick=()=>mgGo(); const nw=$('mgNew'); if(nw) nw.onclick=()=>{ MG.card=MG.card.map(()=>0); mgSave(); kdSheet('minigolf'); }; document.querySelectorAll('[data-mgh]').forEach(b=>b.onclick=()=>mgGo(+b.dataset.mgh)); }
// walking up to a tee of the minigolf: «Jugar el hoyo n del minigolf»
function mgNear(){ if(!MG.ok||S.mode!=='walk') return null; const K=MG.pk; if(Math.abs(P.x-K.cx)>40||Math.abs(P.z-K.cz)>40) return null; let best=null, bd=2.6;
  for(const Q of MG.H){ const t=mgW(Q,Q.H.tee[0],Q.H.tee[1],0), d=Math.hypot(P.x-t.x,P.z-t.z); if(d<bd){ bd=d; best=Q; } } return best?{k:'mgTee',ref:best.i,label:'Jugar el hoyo '+(best.i+1)+' del minigolf'}:null; }
{ const q=id=>$(id), sw=q('mgSwing'); if(sw){ sw.addEventListener('pointerdown',e=>{ e.preventDefault(); mgPress(); }); for(const t of ['pointerup','pointercancel','pointerleave']) sw.addEventListener(t,()=>mgRelease()); sw.addEventListener('contextmenu',e=>e.preventDefault());
  let hold=null; for(const [id,k] of [['mgL',-1],['mgR',1]]){ const b=q(id); b.addEventListener('pointerdown',e=>{ e.preventDefault(); mgAim(k*0.006); clearInterval(hold); hold=setInterval(()=>mgAim(k*0.006),60); }); for(const t of ['pointerup','pointercancel','pointerleave']) b.addEventListener(t,()=>{ clearInterval(hold); hold=null; }); }
  q('mgView').onclick=mgView; q('mgCardB').onclick=()=>kdSheet('minigolf'); q('mgExit').onclick=mgExit; } }
