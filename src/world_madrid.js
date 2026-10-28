/* ================= world: Madrid — Real Club de la Puerta de Hierro (Arriba, Abajo) y Club de Campo Villa de Madrid (Negro, Amarillo) ================= */
// Game frame: x = east, z = south, metres from UTM 30N (ETRS89) 437280 E, 4479050 N; y = 0 is 560 m above sea level.
const WP={
  id:'madrid', key:'pm', title:'Golf en Madrid',
  lat:40.4598, lon:-3.7398, sea:false, bed:[10,190],
  center:[-540,220], centerY:70, orbitR:2700, droneR:800,
  plane:{alt:560, spread:420},
  // the plane flies over the centre of the course you picked
  dropCenter(k){ const C=W.COURSES[k]||W.COURSES[0]; return C.mid||WP.center; },
  map:{x0:-1960,x1:900,z0:-1650,z1:2060,bg:'#cdd5bd'}, miniWindow:820, mapMark:0.78, scaleBar:500,
  ranges:[{n:'Sierra de Guadarrama (al noroeste, a 50 km)',z:[-70000,-25000],x:[-70000,0]}],
  bstyle:'madrid', pineNoise:0.05, pineBase:0.22, treeFar:2600, treeChunk:256, coreTiles:16,
  files:{core:'ortho_core_4096.jpg',coreLow:'ortho_core_2048.jpg',wide:'ortho_region_4096.jpg',mapPhoto:'ortho_map_2048.jpg',mapPlan:'map_surface_2048.png'},
  mpSalt:'golf-madrid/sala/v1', mpTopic:'mgolf/1/',
  mapCol:{villa:'#f4efe4',hotel:'#a3a29c'},
  legend:[['water','Agua: río Manzanares, lagos y estanques'],[3,'Calle (fairway)'],[5,'Green'],[4,'Antegreen'],[6,'Tee'],[7,'Búnker'],[2,'Semi-rough'],[1,'Rough, monte y arbolado'],[8,'Caminos, calles y carreteras'],[9,'Tierra y arena'],[10,'Césped, parques y campos de deporte'],['villa','Casas y edificios bajos (Catastro)'],['hotel','Bloques y edificios altos (Catastro)']],
  T:{
    loadData:'Descargando los datos de los campos…', loadRelief:'Modelando el relieve real (IGN, 5 m)…', loadRegion:'La sierra, el río y Madrid alrededor…', loadBuildings:'Levantando casas y edificios con las plantas del Catastro…',
    landed:['¡En el campo!','Explora, coge un buggy o ve a un tee para jugar'], walking:'Paseando por los campos', notJumped:'aún no ha saltado al campo',
    House:'Casa', house:'casa', houses:'casas', place:'los campos', where:'en el campo', mapTitle:'Mapa de los campos',
    invite:'los campos de golf de Puerta de Hierro y el Club de Campo', gameTitle:'Golf en Madrid', samePlace:'los mismos campos',
    photoNote:'Las calles y greens son el verde intenso; los búnkeres, las manchas de arena clara; el río Manzanares cruza el mapa de norte a sur.',
    planNote:'Plano de los campos dibujado con OpenStreetMap y la foto aérea.',
    onGround:'En el campo', sounds:'pájaros de día y grillos de noche, con el rumor lejano de la ciudad',
    guideIntro:'Son los cuatro recorridos de 18 hoyos del Real Club de la Puerta de Hierro (Campo de Arriba y Campo de Abajo) y del Club de Campo Villa de Madrid (Recorrido Negro y Recorrido Amarillo), construidos con datos reales: el relieve del Instituto Geográfico Nacional, su foto aérea como suelo, cada edificio del Catastro y las calles, greens y búnkeres de OpenStreetMap. En el inicio eliges recorrido. <b>Ver hoyos</b> te lleva volando por cada hoyo, del tee al green, con su par, sus metros y sus distancias. Para jugar, saltas desde la avioneta, planeas y aterrizas donde quieras; luego puedes ir a un tee, conducir un buggy, nadar en el río o buscar 12 bolas doradas.',
    guideExtra:'',
    rough:'Hierba alta entre encinas, pinos piñoneros, cedros y chopos junto al río.', mdtStep:'5 m',
    glossary:'<dt>Recorrido</dt><dd>Cada campo de 18 hoyos: Arriba y Abajo en Puerta de Hierro; Negro y Amarillo en el Club de Campo.</dd><dt>Hándicap del hoyo</dt><dd>Orden de dificultad del hoyo dentro de su recorrido: el 1 es el más difícil y el 18 el más fácil.</dd><dt>Barras</dt><dd>Marcas de salida de cada tee, por colores: blancas (las más atrasadas), amarillas, azules y rojas.</dd><dt>Encina</dt><dd>Árbol de hoja perenne del monte madrileño, como el del Monte de El Pardo, al norte.</dd><dt>Pino piñonero</dt><dd>Pino de copa ancha y plana, muy común en los campos de Madrid.</dd>',
    cardNote:'Metros desde barras amarillas, de la tarjeta oficial del club.',
    poster:'Madrid · Puerta de Hierro · Hoyo 18'
  },
  about:{t:'Los campos',h:({BLD,W,fmt})=>`
    <p>Los dos clubes están en el noroeste de Madrid, separados por la carretera de Castilla y el río Manzanares, a unos 6 km de la Puerta del Sol. Al norte empieza el Monte de El Pardo; al este se ven las torres de la Castellana.</p>
    <h3>Real Club de la Puerta de Hierro</h3>
    <ul><li>Nació en 1895 como club de polo y en 1912 se instaló aquí, junto a la Puerta de Hierro, el arco del siglo XVIII que daba entrada al monte de El Pardo.</li><li><b>Campo de Arriba</b> (par ${W.COURSES[0].par}, ${fmt(W.COURSES[0].L)} m): uno de los más antiguos de España, con trazado original de Harry Colt.</li><li><b>Campo de Abajo</b> (par ${W.COURSES[1].par}, ${fmt(W.COURSES[1].L)} m): mucho más joven, de 1966, en la parte baja junto al río.</li><li>La casa club, de Luis Gutiérrez Soto, se inauguró en 1944. El club ha acogido el Open de España y el Trofeo Eisenhower de 1970.</li></ul>
    <h3>Club de Campo Villa de Madrid</h3>
    <ul><li>Abrió en 1931 y ocupa casi 250 hectáreas en la carretera de Castilla.</li><li><b>Recorrido Negro</b> (par ${W.COURSES[2].par}, ${fmt(W.COURSES[2].L)} m): de Javier Arana, abierto en 1956 sobre antiguas trincheras de la Guerra Civil. Es la sede habitual del Open de España.</li><li><b>Recorrido Amarillo</b> (par ${W.COURSES[3].par}, ${fmt(W.COURSES[3].L)} m): abrió en 1993; sus nueve últimos hoyos los diseñó Severiano Ballesteros y José María Olazábal fue elegido en 2019 para renovarlos.</li><li>También tiene un campo corto de 9 hoyos, hípica, hockey, tenis y piscinas.</li></ul>
    <h3>Qué sale de datos reales</h3>
    <ul><li><b>Relieve:</b> Modelo Digital del Terreno de 5 m del IGN (LiDAR); alrededor, el de 25 m, y la sierra de Guadarrama, del de 200 m.</li><li><b>Suelo:</b> la foto aérea del PNOA; cerca de ti se cargan teselas de 0,46 m por píxel.</li><li><b>Golf:</b> calles, greens, tees, búnkeres y caminos de OpenStreetMap; el orden de los hoyos, de los planos de los clubes y del plano oficial del Open de España; par, metros y hándicap, de las tarjetas oficiales.</li><li><b>Edificios:</b> ${BLD.length.toLocaleString('es-ES')} volúmenes con la planta exacta del Catastro; la altura sale de su número de plantas.</li><li><b>Árboles:</b> ${W.TREES.length.toLocaleString('es-ES')} copas detectadas en la foto, con su posición y tamaño.</li><li><b>Agua:</b> el río Manzanares por tramos, con su nivel real, los lagos de los campos y ${W.POOLS.length} piscinas de la foto.</li><li><b>Sol:</b> en el modo «Ahora», su posición se calcula con la fecha, la hora y la latitud y longitud de Madrid.</li></ul>
    <h3>Qué es aproximado</h3>
    <ul><li>La posición exacta de cada barra de salida y de la bandera dentro del green: los tees se colocan a la distancia de la tarjeta sobre la línea del hoyo.</li><li>Fachadas, tejados y ventanas siguen un estilo madrileño genérico (chalés de teja, bloques de ladrillo), no el de cada edificio. Las casas cercanas a los hoyos se pueden visitar por dentro, con distribución y muebles inventados.</li><li>Las torres de la Castellana y otros edificios del horizonte son volúmenes simplificados.</li><li>La especie de cada árbol se elige por zonas.</li></ul>
    <p class="src">Datos: relieve y foto aérea © Instituto Geográfico Nacional (CC BY 4.0, <a href="https://centrodedescargas.cnig.es" target="_blank" rel="noopener">CNIG</a>) · edificios: <a href="https://www.catastro.hacienda.gob.es/webinspire/index.html" target="_blank" rel="noopener">Dirección General del Catastro</a> · campos, caminos y agua: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a> · historia: <a href="https://en.wikipedia.org/wiki/Real_Club_de_la_Puerta_de_Hierro" target="_blank" rel="noopener">Wikipedia (Puerta de Hierro)</a>, <a href="https://en.wikipedia.org/wiki/Club_de_Campo_Villa_de_Madrid" target="_blank" rel="noopener">Wikipedia (Club de Campo)</a>, <a href="https://www.esmadrid.com/deporte/club-campo-villa-madrid" target="_blank" rel="noopener">esMadrid</a>, <a href="https://golfbusinessnews.com/news/courses/olazabal-to-update-seve-ballesteros-design-at-villa-de-madrid/" target="_blank" rel="noopener">Golf Business News</a></p>`},
  afterLoad(W){
    // centre of each course (tees and greens), for the plane and the course picker
    for(const C of W.COURSES){ let x=0,z=0,n=0; for(const i of C.holes){ const H=W.HOLES[i]; x+=H.tx+H.gx; z+=H.tz+H.gz; n+=2; } C.mid=n?[x/n,z/n]:WP.center; }
    const big=(x,z,r)=>{ let best=null; for(const b of W.BUILDINGS){ if(b.f<1) continue; const d=Math.hypot(b.c[0]-x,b.c[1]-z); if(d<r&&(!best||b.area>best.area)) best=b; } return best; };
    const rc=big(-56,-19,40), cc=big(-1319,955,40); W.CLUBS={rc:rc?rc.c:[-56,-19],cc:cc?cc.c:[-1319,955],rcB:rc,ccB:cc};
    const L=(n,x,z,dy)=>({n,p:[x,W.terrain(x,z)+(dy||14),z]});
    W.POIS=[L('Casa club · Puerta de Hierro',W.CLUBS.rc[0],W.CLUBS.rc[1],18),L('Casa club · Club de Campo',W.CLUBS.cc[0],W.CLUBS.cc[1],16),
      L('Puerta de Hierro (1753)',-395,457),L('Puente de San Fernando',-586,19),L('Río Manzanares',-190,1500),L('Hipódromo de la Zarzuela',-1458,-812,20),
      L('Monte de El Pardo',-1310,-1546,30),L('Dehesa de la Villa',1300,160,20),L('Ciudad Universitaria',1150,1500,40),L('Depuradora de Viveros',-420,1010)];
    W.POIS.push({n:'Centro de Madrid (Puerta del Sol)',p:[3060,W.terrain(3060,4760)+60,4760],far:true});
  },
  buggySpots({rows,atTee,W}){
    rows(W.CLUBS.rc[0]+30,W.CLUBS.rc[1]+25,4); rows(W.CLUBS.cc[0]+35,W.CLUBS.cc[1]-30,4);
    for(const C of W.COURSES){ for(const n of [1,5,10,14]) atTee(C.holes[n-1]); }
  },
  goldSpots({add,T,W,BLD,insideGoldSpot,spots}){
    const roof=(b,txt)=>{ if(b&&b.top!==undefined){ const y=Math.max(b.walkY||b.top,b.top-1); add(b.c[0],y+0.9,b.c[1],txt); } };
    roof(BLD.find(b=>b===W.CLUBS.rcB)||W.CLUBS.rcB,'En el tejado de la casa club de Puerta de Hierro: llega planeando');
    roof(BLD.find(b=>b===W.CLUBS.ccB)||W.CLUBS.ccB,'En la cubierta de la casa club del Club de Campo: llega planeando');
    add(-389,T(-389,463)+1.0,463,'Junto a la Puerta de Hierro, el arco del siglo XVIII que da nombre al club');
    { let best=null; for(const p of W.PONDS){ if(p.name!=='Río Manzanares') continue; const d=Math.hypot(p.c[0]+190,p.c[1]-1500); if(!best||d<best.d) best={p,d}; } if(best) add(best.p.c[0],best.p.level+0.6,best.p.c[1],'Flotando en el río Manzanares: hay que nadar'); }
    { const p=W.PONDS.filter(p=>p.name==='Lago').sort((a,b)=>Math.hypot(a.c[0]+734,a.c[1]+684)-Math.hypot(b.c[0]+734,b.c[1]+684))[0]; if(p) add(p.c[0],p.level+0.6,p.c[1],'Flotando en el lago del Campo de Abajo'); }
    add(-1458,T(-1458,-812)+1.0,-812,'En el Hipódromo de la Zarzuela, al norte de Puerta de Hierro');
    { const C=W.COURSES.find(c=>c.id==='negro'); if(C){ const H=W.HOLES[C.holes[17]]; const x=H.pin[0]+2.5, z=H.pin[1]+1.5; add(x,T(x,z)+1.0,z,'Junto a la bandera del 18 del Recorrido Negro, el del Open de España'); } }
    { const C=W.COURSES.find(c=>c.id==='arriba'); if(C){ const H=W.HOLES[C.holes[0]]; add(H.tx+3,T(H.tx+3,H.tz)+1.0,H.tz,'En el tee del 1 del Campo de Arriba, junto a la casa club'); } }
    { const q=insideGoldSpot([-300,-700]); if(q){ add(q.x,q.y,q.z,'En el salón de una casa junto al Campo de Abajo: busca el haz dorado que sale del tejado y entra'); if(spots.length) spots[spots.length-1].vb=q.b; } }
    add(1240,T(1240,77)+1.0,77,'En el mirador de la Dehesa de la Villa, al este, con vistas a los dos clubes');
    add(-586,T(-586,19)+1.0,19,'Junto al Puente de San Fernando, sobre el Manzanares');
    { // the highest ground of the courses
      let best=null; for(const C of W.COURSES) for(const i of C.holes){ const H=W.HOLES[i]; for(const p of H.P){ const h=T(p[0],p[1]); if(!best||h>best.h) best={x:p[0],z:p[1],h}; } }
      if(best) add(best.x+4,T(best.x+4,best.z)+1.0,best.z,'En el punto más alto de los cuatro recorridos'); }
    { const C=W.COURSES.find(c=>c.id==='amarillo'); if(C){ const H=W.HOLES[C.holes[8]]; add(H.gx,T(H.gx,H.gz)+1.0,H.gz,'En el green del 9 del Recorrido Amarillo'); } }
  }
};
