// WGS84/ETRS89 latitude-longitude to UTM zone 30N (EPSG:25830), Krüger series (sub-millimetre in the zone)
function toUTM30(lat,lon){ const a=6378137, f=1/298.257222101, k0=0.9996, n=f/(2-f), A=a/(1+n)*(1+n*n/4+n*n*n*n/64);
  const al=[n/2-2*n*n/3+5*n*n*n/16, 13*n*n/48-3*n*n*n/5, 61*n*n*n/240], e=Math.sqrt(f*(2-f));
  const ph=lat*Math.PI/180, la=(lon+3)*Math.PI/180; const t=Math.sinh(Math.atanh(Math.sin(ph))-e*Math.atanh(e*Math.sin(ph)));
  const xi=Math.atan2(t,Math.cos(la)), eta=Math.atanh(Math.sin(la)/Math.sqrt(1+t*t)); let E=eta, N=xi;
  for(let j=1;j<=3;j++){ E+=al[j-1]*Math.cos(2*j*xi)*Math.sinh(2*j*eta); N+=al[j-1]*Math.sin(2*j*xi)*Math.cosh(2*j*eta); }
  return [500000+k0*A*E, k0*A*N]; }
// WGS84 latitude-longitude to the British National Grid (EPSG:27700): Helmert shift to OSGB36 (the 7 parameters of the
// Ordnance Survey, about 2-3 m; the same transformation pyproj used for the game's map), then Transverse Mercator on Airy 1830
function toBNG(lat,lon){ const r=Math.PI/180;
  const a1=6378137, b1=6356752.3141, e1=1-b1*b1/(a1*a1), ph=lat*r, la=lon*r, sp=Math.sin(ph), cp=Math.cos(ph), nu1=a1/Math.sqrt(1-e1*sp*sp);
  const x1=nu1*cp*Math.cos(la), y1=nu1*cp*Math.sin(la), z1=nu1*(1-e1)*sp;
  const tx=-446.448, ty=125.157, tz=-542.060, s=20.4894e-6, rx=-0.1502/3600*r, ry=-0.2470/3600*r, rz=-0.8421/3600*r;
  const x2=tx+(1+s)*x1-rz*y1+ry*z1, y2=ty+rz*x1+(1+s)*y1-rx*z1, z2=tz-ry*x1+rx*y1+(1+s)*z1;
  const a=6377563.396, b=6356256.909, e2=1-b*b/(a*a), p=Math.hypot(x2,y2); let f=Math.atan2(z2,p*(1-e2));
  for(let i=0;i<8;i++){ const nu=a/Math.sqrt(1-e2*Math.sin(f)**2); f=Math.atan2(z2+e2*nu*Math.sin(f),p); }
  const L=Math.atan2(y2,x2), F0=0.9996012717, f0=49*r, l0=-2*r, N0=-100000, E0=400000, n=(a-b)/(a+b), n2=n*n, n3=n2*n;
  const sf=Math.sin(f), cf=Math.cos(f), tf=Math.tan(f), nu=a*F0/Math.sqrt(1-e2*sf*sf), rho=a*F0*(1-e2)/Math.pow(1-e2*sf*sf,1.5), et2=nu/rho-1;
  const dM=f-f0, sM=f+f0, M=b*F0*((1+n+5/4*n2+5/4*n3)*dM-(3*n+3*n2+21/8*n3)*Math.sin(dM)*Math.cos(sM)+(15/8*n2+15/8*n3)*Math.sin(2*dM)*Math.cos(2*sM)-35/24*n3*Math.sin(3*dM)*Math.cos(3*sM));
  const I=M+N0, II=nu/2*sf*cf, III=nu/24*sf*cf**3*(5-tf*tf+9*et2), IIIA=nu/720*sf*cf**5*(61-58*tf*tf+tf**4), IV=nu*cf, V=nu/6*cf**3*(nu/rho-tf*tf), VI=nu/120*cf**5*(5-18*tf*tf+tf**4+14*et2-58*tf*tf*et2), d=L-l0;
  return [E0+IV*d+V*d**3+VI*d**5, I+II*d*d+III*d**4+IIIA*d**6]; }
if(typeof module!=='undefined') module.exports={toUTM30,toBNG};
