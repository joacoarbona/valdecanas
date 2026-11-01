// WGS84/ETRS89 latitude-longitude to UTM zone 30N (EPSG:25830), Krüger series (sub-millimetre in the zone)
function toUTM30(lat,lon){ const a=6378137, f=1/298.257222101, k0=0.9996, n=f/(2-f), A=a/(1+n)*(1+n*n/4+n*n*n*n/64);
  const al=[n/2-2*n*n/3+5*n*n*n/16, 13*n*n/48-3*n*n*n/5, 61*n*n*n/240], e=Math.sqrt(f*(2-f));
  const ph=lat*Math.PI/180, la=(lon+3)*Math.PI/180; const t=Math.sinh(Math.atanh(Math.sin(ph))-e*Math.atanh(e*Math.sin(ph)));
  const xi=Math.atan2(t,Math.cos(la)), eta=Math.atanh(Math.sin(la)/Math.sqrt(1+t*t)); let E=eta, N=xi;
  for(let j=1;j<=3;j++){ E+=al[j-1]*Math.cos(2*j*xi)*Math.sinh(2*j*eta); N+=al[j-1]*Math.sin(2*j*xi)*Math.cosh(2*j*eta); }
  return [500000+k0*A*E, k0*A*N]; }
if(typeof module!=='undefined') module.exports={toUTM30};
