
/* ================= the city around (Madrid): OpenStreetMap buildings of 5 floors and more, extruded with windows that light up at night ================= */
const CITY={meshes:[],n:0,labels:[]};
function cityTex(){ const S_=256, n=8; const R=rng(91); const mk=(lit)=>canvasTex(S_,S_,(g,w,h)=>{ const cw=w/n, ch=h/n; g.fillStyle=lit?'#000':'#ffffff'; g.fillRect(0,0,w,h);
    for(let j=0;j<n;j++) for(let i=0;i<n;i++){ const x=i*cw+cw*0.2, y=j*ch+ch*0.22, ww=cw*0.6, hh=ch*0.52; if(lit){ if(R()<0.33){ g.fillStyle=R()<0.75?'#ffd79a':'#cfe3ff'; g.fillRect(x,y,ww,hh); } } else { g.fillStyle='#3b4652'; g.fillRect(x,y,ww,hh); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x,y+hh,ww,ch*0.06); } } },true);
  const a=mk(false), b=mk(true); a.anisotropy=b.anisotropy=Math.min(4,MAXANI); return [a,b]; }
async function buildCity(){ if(!WP.city) return; let buf; try{ buf=await getBuf(WP.city); }catch(e){ console.warn('city',e); return; }
  const dv=new DataView(buf); if(dv.getUint8(0)!==67) return; const cnt=dv.getUint32(4,true); let o=8; const R=rng(17);
  const TILE=4000, tiles=new Map(); const tint=[[0.74,0.47,0.36],[0.85,0.79,0.68],[0.93,0.92,0.9],[0.78,0.74,0.7],[0.55,0.66,0.78]];
  const get=k=>{ let t=tiles.get(k); if(!t){ t={wp:[],wn:[],wu:[],wc:[],rp:[],ri:[],rn:0}; tiles.set(k,t); } return t; };
  for(let b=0;b<cnt;b++){ const n=dv.getUint8(o); const h=dv.getUint16(o+1,true)/10; const kind=dv.getUint8(o+3); o+=4; const pts=[]; for(let i=0;i<n;i++){ pts.push([dv.getInt16(o,true)/2,dv.getInt16(o+2,true)/2]); o+=4; }
    if(n<3) continue; let cx=0,cz=0; for(const p of pts){ cx+=p[0]; cz+=p[1]; } cx/=n; cz/=n; let y0=1e9; for(const p of pts) y0=Math.min(y0,W.terrain(p[0],p[1])); y0-=0.6; const top=y0+0.6+h;
    const T=get(Math.floor(cx/TILE)+','+Math.floor(cz/TILE)); const col=kind===2?tint[4]:kind===3?tint[3]:(h>40&&R()<0.5)?tint[4]:tint[(R()*3)|0]; const k=0.88+R()*0.2; const c=[col[0]*k,col[1]*k,col[2]*k]; const uo=Math.floor(R()*8)/8;
    let acc=0; for(let i=0;i<n;i++){ const a=pts[i], q=pts[(i+1)%n]; const ex=q[0]-a[0], ez=q[1]-a[1], L=Math.hypot(ex,ez); if(L<0.3) continue; const nx=ez/L, nz=-ex/L;
      const u0=uo+acc/20.8, u1=uo+(acc+L)/20.8, v1=h/24.8; acc+=L;
      T.wp.push(a[0],y0,a[1], q[0],y0,q[1], q[0],top,q[1], a[0],y0,a[1], q[0],top,q[1], a[0],top,a[1]); for(let r=0;r<6;r++){ T.wn.push(nx,0,nz); T.wc.push(c[0],c[1],c[2]); }
      T.wu.push(u0,0, u1,0, u1,v1, u0,0, u1,v1, u0,v1); }
    const tr=THREE.ShapeUtils.triangulateShape(pts.map(p=>new THREE.Vector2(p[0],p[1])),[]); const base=T.rn; for(const p of pts){ T.rp.push(p[0],top,p[1]); } T.rn+=n; for(const t of tr) T.ri.push(base+t[0],base+t[2],base+t[1]); CITY.n++; }
  const [wt,et]=cityTex(); const wm=new THREE.MeshLambertMaterial({map:wt,vertexColors:true,emissiveMap:et,emissive:new THREE.Color(1,1,1),emissiveIntensity:0,side:THREE.DoubleSide}); wm.userData.nightK=2.6; NIGHTMATS.push(wm);
  const rm=new THREE.MeshLambertMaterial({color:Cc('#8d8a85'),side:THREE.DoubleSide});
  for(const T of tiles.values()){ if(!T.wp.length) continue; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(T.wp,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(T.wn,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(T.wu,2)); g.setAttribute('color',new THREE.Float32BufferAttribute(T.wc,3)); g.computeBoundingSphere();
    const m=new THREE.Mesh(g,wm); m.receiveShadow=false; m.castShadow=false; scene.add(m); CITY.meshes.push(m);
    const r=new THREE.BufferGeometry(); r.setAttribute('position',new THREE.Float32BufferAttribute(T.rp,3)); r.setIndex(T.ri); r.computeVertexNormals(); r.computeBoundingSphere(); const rmesh=new THREE.Mesh(r,rm); scene.add(rmesh); CITY.meshes.push(rmesh); }
  wm.emissiveIntensity=TOD.night*(wm.userData.nightK)*(FXQ?2.2:1);
  // the towers that make the skyline, with their name
  for(const t of (WP.cityLabels||[])){ const el=document.createElement('div'); el.className='lab'; el.textContent=t[0]; el.hidden=true; $('labels').appendChild(el); CITY.labels.push({el,x:t[1],z:t[2],y:W.terrain(t[1],t[2])+t[3]+12}); } }
function cityLabels(){ const m=S.mode, on=m==='menu'||m==='drone'||m==='view'||m==='photo'||m==='plane'||m==='glide'||m==='fall'; for(const l of CITY.labels){ if(!on){ l.el.hidden=true; continue; } const q=project(l.x,l.y,l.z); if(!q||!q[2]||camera.position.distanceTo(new V3(l.x,l.y,l.z))>16000){ l.el.hidden=true; continue; } l.el.hidden=false; l.el.style.transform='translate('+q[0]+'px,'+q[1]+'px) translate(-50%,-100%)'; } }
