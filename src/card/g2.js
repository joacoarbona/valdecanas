
/* ================= G2, shared by the live scorecard and the game: my distance with each club, how long a shot "plays" and the plan of a hole ================= */
var G2_CLUBS=['Dr','M3','M5','H','4','5','6','7','8','9','PW','GW','SW','LW'];
var G2_NAME={Dr:'Driver',M3:'Madera 3',M5:'Madera 5',H:'Híbrido','4':'Hierro 4','5':'Hierro 5','6':'Hierro 6','7':'Hierro 7','8':'Hierro 8','9':'Hierro 9',PW:'Pitching',GW:'Gap wedge',SW:'Sand wedge',LW:'Lob wedge'};
// total distance (flight and roll, in metres) of an amateur of middle handicap: the ladder that fills the clubs without GPS shots, scaled to the player
var G2_REF={Dr:200,M3:182,M5:170,H:160,'4':152,'5':144,'6':135,'7':126,'8':116,'9':106,PW:95,GW:82,SW:68,LW:54};
function g2Dist(a,b){ return Math.hypot(a[0]-b[0],a[1]-b[1]); }
// the typical full shot of a club: the median, and the mean of the shots within 20 % of it (duffs and half shots do not count)
function g2Typ(a){ if(!a||!a.length) return null; var s=a.slice().sort(function(x,y){ return x-y; }), n=s.length, med=n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;
  var k=n>=3?s.filter(function(d){ return d>=med*0.8&&d<=med*1.2; }):s; var sum=0; for(var i=0;i<k.length;i++) sum+=k[i];
  return {n:n,k:k.length,avg:sum/k.length,lo:k[0],hi:k[k.length-1]}; }
// the bag: by hand first, then GPS (with fewer than 3 good shots it is mixed with the estimate), then the reference ladder scaled to the clubs that are known
function g2Bag(samples,man){ samples=samples||{}; man=man||{}; var typ={}, rat=[], c, i;
  for(i=0;i<G2_CLUBS.length;i++){ c=G2_CLUBS[i]; var t=g2Typ(samples[c]); if(t){ typ[c]=t; rat.push(t.avg/G2_REF[c]); } if(+man[c]>0) rat.push(+man[c]/G2_REF[c]); }
  rat.sort(function(x,y){ return x-y; }); var f=rat.length?(rat.length%2?rat[(rat.length-1)/2]:(rat[rat.length/2-1]+rat[rat.length/2])/2):1; f=Math.max(0.5,Math.min(1.5,f));
  var d={}, src={};
  for(i=0;i<G2_CLUBS.length;i++){ c=G2_CLUBS[i]; var est=G2_REF[c]*f, t2=typ[c];
    if(+man[c]>0){ d[c]=Math.round(+man[c]); src[c]='man'; } else if(t2){ var w=Math.min(3,t2.k); d[c]=Math.round((t2.avg*w+est*(3-w))/3); src[c]=t2.k>=3?'gps':'mix'; } else { d[c]=Math.round(est); src[c]='est'; } }
  // an estimated club never passes a longer one nor falls below a shorter one
  for(i=1;i<G2_CLUBS.length;i++){ c=G2_CLUBS[i]; if(src[c]==='est'&&d[c]>d[G2_CLUBS[i-1]]-4) d[c]=d[G2_CLUBS[i-1]]-4; }
  for(i=G2_CLUBS.length-2;i>=0;i--){ c=G2_CLUBS[i]; if(src[c]==='est'&&d[c]<d[G2_CLUBS[i+1]]+4) d[c]=d[G2_CLUBS[i+1]]+4; }
  return {d:d,src:src,typ:typ,f:f,known:rat.length}; }
// how long a shot of d metres "plays": dh = metres the target is above the ball, wind = {sp km/h, dir degrees it comes from} or null, (ux,uz) = direction of the shot (x east, z south)
function g2Plays(d,dh,wind,ux,uz){ var el=Math.max(-0.25*d,Math.min(0.25*d,dh||0)), wi=0, drift=0, head=0, cross=0;
  if(wind&&wind.sp>0){ var a=wind.dir*Math.PI/180, wx=-Math.sin(a), wz=Math.cos(a); head=-(wx*ux+wz*uz)*wind.sp; cross=(wx*-uz+wz*ux)*wind.sp;
    var k=Math.max(0.25,Math.min(1,(d-30)/70)); wi=d*(head>0?0.006:0.003)*head*k; drift=d*0.0035*cross*k; }
  return {d:d,plays:d+el+wi,el:el,wi:wi,drift:drift,head:head,cross:cross}; }
// the club for a distance that plays "p": the nearest; alt = the neighbour on the other side when it is close; pct = part of the swing when even the shortest is too long
function g2Pick(bag,p,driver){ var L=G2_CLUBS.filter(function(c){ return driver||c!=='Dr'; }), best=null, i;
  for(i=0;i<L.length;i++){ var e=Math.abs(bag[L[i]]-p); if(!best||e<best.e) best={c:L[i],e:e}; }
  var o={c:best.c,alt:null,pct:0,short:p>bag[L[0]]*1.03}; var last=L[L.length-1];
  if(best.c===last&&p<bag[last]*0.92){ o.pct=Math.max(10,Math.round(p/bag[last]*10)*10); return o; }
  var j=L.indexOf(best.c), n=bag[best.c]>=p?L[j+1]:L[j-1]; if(n&&Math.abs(bag[n]-p)<=Math.abs(bag[best.c]-p)+7) o.alt=n; return o; }
function g2Along(pts,s){ var i; for(i=0;i<pts.length-1;i++){ var l=g2Dist(pts[i],pts[i+1]); if(s<=l||i===pts.length-2){ var t=l?Math.min(1,s/l):0; return {p:[pts[i][0]+(pts[i+1][0]-pts[i][0])*t,pts[i][1]+(pts[i+1][1]-pts[i][1])*t],i:i,u:l?[(pts[i+1][0]-pts[i][0])/l,(pts[i+1][1]-pts[i][1])/l]:[1,0]}; } s-=l; } return {p:pts[0],i:0,u:[1,0]}; }
function g2Len(pts){ var s=0; for(var i=0;i<pts.length-1;i++) s+=g2Dist(pts[i],pts[i+1]); return s; }
// what is left of the line of the hole from a position: the corners still ahead and the green
function g2Rest(P,pos){ var best=1e9, bi=0; for(var i=0;i<P.length-1;i++){ var a=P[i], b=P[i+1], vx=b[0]-a[0], vz=b[1]-a[1], l2=vx*vx+vz*vz||1, t=Math.max(0,Math.min(1,((pos[0]-a[0])*vx+(pos[1]-a[1])*vz)/l2)), dd=Math.hypot(a[0]+vx*t-pos[0],a[1]+vz*t-pos[1]); if(dd<best){ best=dd; bi=i; } }
  var G=P[P.length-1], out=P.slice(bi+1).filter(function(q,j,A){ return j===A.length-1||g2Dist(q,G)<g2Dist(pos,G)-15; }); return out.length?out:[G]; }
function g2Haz(c){ return c===0||c===7||c>=20; }
/* the plan of a hole from a position. o = {from:[x,z], rest:[[x,z]…] (corners ahead, the green last), bag:{club:metres}, elev(x,z), surf(x,z), wind, tee:true if the first shot is from the tee}
   Each step: {c club, alt, pct, d metres on the ground, pl (see g2Plays), to:[x,z], green:true if it goes for the green, leave metres left, safe:true if a longer club was left out because of sand or water} */
function g2Plan(o){ var steps=[], pts=[o.from].concat(o.rest), first=!!o.tee, bag=o.bag, elev=o.elev||function(){ return 0; }, surf=o.surf||function(){ return 1; };
  for(var it=0;it<6;it++){ var cur=pts[0], G=pts[pts.length-1], direct=g2Dist(cur,G); if(direct<1) break;
    var allowed=G2_CLUBS.filter(function(c){ return first||c!=='Dr'; }).sort(function(a,b){ return bag[b]-bag[a]; });
    var pl=g2Plays(direct,elev(G[0],G[1])-elev(cur[0],cur[1]),o.wind,(G[0]-cur[0])/direct,(G[1]-cur[1])/direct);
    if(pl.plays<=bag[allowed[0]]*1.03){ var pk=g2Pick(bag,pl.plays,first); steps.push({c:pk.c,alt:pk.alt,pct:pk.pct,d:direct,pl:pl,to:G,green:true,leave:0}); break; }
    var total=g2Len(pts), best=null, hazSeen=false;
    for(var ci=0;ci<Math.min(6,allowed.length);ci++){ var c=allowed[ci], a=Math.min(bag[c],total-20), q=null, pl2=null, d2=0;
      for(var k=0;k<4;k++){ q=g2Along(pts,a); d2=g2Dist(cur,q.p)||1; pl2=g2Plays(d2,elev(q.p[0],q.p[1])-elev(cur[0],cur[1]),o.wind,(q.p[0]-cur[0])/d2,(q.p[1]-cur[1])/d2); a=Math.max(20,Math.min(total-20,a+(bag[c]-pl2.plays))); }
      q=g2Along(pts,a); d2=g2Dist(cur,q.p)||1; pl2=g2Plays(d2,elev(q.p[0],q.p[1])-elev(cur[0],cur[1]),o.wind,(q.p[0]-cur[0])/d2,(q.p[1]-cur[1])/d2);
      var bad=0; for(var s=-12;s<=12;s+=6){ var h=g2Along(pts,Math.max(0,a+s)); for(var w=-8;w<=8;w+=8) if(g2Haz(surf(h.p[0]-h.u[1]*w,h.p[1]+h.u[0]*w))) bad++; }
      var leave=g2Dist(q.p,G), sc=(bad>=2?1000+bad:0)+(leave>15&&leave<bag.LW*0.8?60:0)-a; if(bad>=2&&ci===0) hazSeen=true;
      if(!best||sc<best.sc) best={sc:sc,c:c,a:a,q:q,d:d2,pl:pl2,leave:leave,ci:ci,bad:bad}; }
    steps.push({c:best.c,alt:null,pct:0,d:best.d,pl:best.pl,to:best.q.p,green:false,leave:best.leave,safe:hazSeen&&best.ci>0,risk:best.bad>=2});
    pts=[best.q.p].concat(pts.slice(best.q.i+1)); first=false; }
  return steps; }
