/* ================= world: Casterton y los Lagos — S0: Casterton, Sedbergh Prep, el Casterton Golf Club y 3 km del valle del Lune ================= */
// Game frame: x = east, z = south, metres from British National Grid 362600 E, 479700 N (the school); y = 0 is sea level
// (the Irish Sea and Morecambe Bay, 20-40 km to the west, are the only sea; the River Lune runs in reaches with their own level).
const WP={
  id:'casterton', key:'cl', title:'Casterton y los Lagos',
  lat:54.2117, lon:-2.575, sea:true, openSea:true, bed:[0,300],
  center:[-300,250], centerY:150, orbitR:2600, droneR:750,
  plane:{alt:640, spread:520},
  map:{x0:-3000,x1:3000,z0:-3000,z1:3000,bg:'#c6d2b4'}, miniWindow:700, mapMark:0.78, scaleBar:500,
  ranges:[{n:'Howgill Fells (al norte)',z:[-40000,-9000],x:[-8000,14000]},{n:'Fells del Lake District (al oeste)',x:[-40000,-16000],z:[-25000,8000]},{n:'Ingleborough y los Yorkshire Dales (al este)',x:[6000,40000],z:[-4000,26000]}],
  avatars:true,
  // the school's horses: the paddocks by the stables (set in afterLoad from OpenStreetMap; these are only the fallback)
  horses:[[180,-120,3],[-260,320,2]], wildlife:{rabbits:16,deer:3},
  // S0: stone houses with slate roofs, dry stone walls and hedges (LIDAR and OpenStreetMap), Cumbrian colours far away
  coreSat:0.92, grassSat:1.0,   // the drawn ground is already as green as the satellite saw it
  bstyle:'lune', walls:true, extraJSON:['walls.json'], kick:true,
  // S2: the school's main building (osm92) has its rooms inside; its door is on the side of the car park
  school:{id:'osm92', n:'Casterton, Sedbergh Prep', ref:[-85,77]}, cuentas:{}, carParks:true,
  // S3: walls and gates, the riding centre (searched near arena), the routes of course.json and the places with a board
  campo:{arena:[180,-120], grange:{id:'osm259', ref:[-268,-398]}, places:[
    {id:'devil',n:"Devil's Bridge",p:[-1040,1465],sub:'Puente medieval · Acción: Leer el cartel',d:"Puente medieval de piedra sobre el río Lune, con tres arcos nervados. Cuenta la leyenda que lo hizo el diablo a cambio del primero que lo cruzara, y que una anciana tiró un bollo al otro lado para que pasara primero su perro. Desde 1932 los coches van por el puente de al lado, el Stanley Bridge: este es para ir a pie, a caballo o en bici."},
    {id:'ruskin',n:"Ruskin's View",p:[-1502,700],look:[-1400,765],sub:'Mirador del valle del Lune',d:"Mirador detrás de la iglesia de St Mary, sobre una curva del Lune. Lo pintó Turner, y el escritor John Ruskin escribió en 1875 que era «uno de los paisajes más bonitos de Inglaterra, y por tanto del mundo». Hay un banco para mirarlo."},
    {id:'market',n:'Market Place, Kirkby Lonsdale',p:[-1444,1079],sub:'Plaza del mercado',d:"La plaza del mercado del pueblo, con su cruz de piedra. Kirkby Lonsdale tiene mercado los jueves desde 1227, cuando el rey le dio permiso para celebrarlo."},
    {id:'stmary',n:"St Mary's",p:[-1478,878],sub:'Iglesia de Kirkby Lonsdale',d:"La iglesia de Kirkby Lonsdale. Las partes más antiguas son normandas, del siglo XII, con columnas muy gruesas talladas con rombos. Detrás está Ruskin's View."},
    {id:'holy',n:'Holy Trinity, Casterton',p:[-140,15],sub:'Iglesia de Casterton',d:"La iglesia de Casterton, junto al colegio, construida entre 1831 y 1833."},
    {id:'grange',n:'Casterton Grange',p:[-290,-402],look:[-290,-402],mile:[-146,-424],sub:'Casa de 1848 · Acción: Entrar',d:"Casa victoriana de 1848 que diseñó el arquitecto Ewan Christian (el de la National Portrait Gallery de Londres) para el reverendo David Barclay-Bevan. Hoy se alquila entera para estancias y bodas, como un hotel, y aquí se puede entrar: la planta baja tiene salas de diseño propio (salón dorado, comedor, sala de billar con barra, invernadero, cocina y más). Junto a la entrada de la finca, en el lado oeste de la A683, hay un hito de piedra antiguo, protegido."},
    {id:'circle',n:'Casterton Stone Circle',p:[1334,-294],sub:'Círculo de piedras de la Edad del Bronce',d:"Círculo de unas 20 piedras pequeñas de la Edad del Bronce, de unos 18 m de ancho, en lo alto de la ladera. Desde aquí se ve todo el valle."}]},
  fly:{ceilAbove:'ground', zones:W=>[{n:'Colegio',p:[-307,-96],r:110,c:['heli','car']},{n:'Club de golf',p:[-452,613],r:130,c:['heli','car']},{n:'Kirkby Lonsdale',p:[-1105,1310],r:110,c:['car','car']}]},
  outerPal:{dry:'#6f8b4b',dry2:'#7f9955',oak:'#3d5833',scrub:'#7b7454',rock:'#7d7a70',shore:'#9a9178'}, outerH:[220,520,720,980],
  pineNoise:2, pineBase:0.02, pineAs:'spruce', treeNear:[0,0.14,0.14],   // conifers: the woods mapped as needle-leaved (trees.bin) and a few more treeFar:2600, treeChunk:256, coreTiles:12,
  files:{core:'ortho_core_4096.jpg',coreLow:'ortho_core_2048.jpg',wide:'ortho_wide_2048.jpg',mapPhoto:'ortho_map_2048.jpg',mapPlan:'map_surface_2048.png'},
  mpSalt:'casterton/sala/v1', mpTopic:'cgolf/1/',
  mapCol:{villa:'#e6dfd1',hotel:'#bdb5a5'},
  legend:[['water','Agua: el río Lune, arroyos y estanques'],[10,'Prados, jardines y campos de deporte'],[1,'Monte, bosque y matorral'],[3,'Calle (fairway)'],[5,'Green'],[6,'Tee'],[7,'Búnker'],[2,'Rough del campo de golf'],[8,'Carreteras, caminos y aparcamientos'],[9,'Patios de granja y tierra'],['villa','Casas, granjas y otros edificios'],['hotel','Edificios del colegio']],
  T:{
    loadData:'Descargando los datos del valle…', loadRelief:'Modelando el relieve real (LIDAR de la Environment Agency, 1 m)…', loadRegion:'Los fells, el valle del Lune y la bahía de Morecambe…', loadBuildings:'Levantando las casas de piedra, las granjas y el colegio…',
    landed:['¡En Casterton!','Explora el valle, sigue los muros de piedra o baja al río Lune'], walking:'Paseando por el valle del Lune', notJumped:'aún no ha saltado al valle',
    House:'Casa', house:'casa', houses:'casas', place:'el valle', where:'en el valle', mapTitle:'Mapa de Casterton',
    invite:'Casterton y el valle del Lune', gameTitle:'Casterton y los Lagos', samePlace:'el mismo valle',
    photoSrc:'Fondo: el suelo dibujado del valle. ', loadStart:'Descargando el relieve, el suelo y las casas…',
    glossBase:'<dt>LIDAR</dt><dd>Láser desde un avión que mide la altura del suelo (DTM) y de lo que hay encima (DSM): árboles, setos, muros y tejados. Aquí, el de la Environment Agency, de 1 m.</dd><dt>OpenStreetMap</dt><dd>Mapa libre hecho por voluntarios: caminos, casas, ríos, campos de deporte y el campo de golf.</dd>',
    photoNote:'El suelo está dibujado con datos reales: el color sale del satélite Sentinel-2 y cada árbol, seto, muro y tejado, del LIDAR, con su sombra.',
    planNote:'Plano dibujado con OpenStreetMap y el LIDAR.',
    onGround:'En el valle', sounds:'ovejas y pájaros de día, búhos de noche y el río Lune cuando estás cerca',
    exploreMode:'Explorar Casterton',
    guideIntro:'Es Casterton, en el valle del río Lune (Cumbria, al norte de Inglaterra): el colegio Casterton, Sedbergh Prep, el Casterton Golf Club, que está al lado, Kirkby Lonsdale con el Devil\'s Bridge y 3 km de prados, muros de piedra seca y setos alrededor. Todo sale de datos reales: el relieve y la altura de cada árbol, muro y tejado, del LIDAR de la Environment Agency; las casas y los caminos, de OpenStreetMap y del Ordnance Survey; el color del suelo, del satélite Sentinel-2. Empiezas en una avioneta: saltas, planeas y aterrizas donde quieras. Es la primera fase (S0): el mundo base. El golf de verdad, el colegio por dentro, los caballos, el dron y los deportes llegan en las fases siguientes.',
    guideExtra:'',
    rough:'Hierba de monte, helechos y brezo en los fells; prados segados en el valle.', mdtStep:'1 m',
    glossary:'<dt>Fell</dt><dd>Monte de pasto, casi sin árboles, típico de Cumbria.</dd><dt>Beck</dt><dd>Arroyo, en el inglés del norte de Inglaterra (Barbon Beck, Leck Beck).</dd><dt>Lune</dt><dd>El río del valle: nace en los Howgill Fells y desemboca en la bahía de Morecambe, pasando por Kirkby Lonsdale y Lancaster.</dd><dt>Devil\'s Bridge</dt><dd>El puente medieval de piedra sobre el Lune en Kirkby Lonsdale.</dd><dt>Prep school</dt><dd>Colegio para niños de 3 a 13 años que prepara para el colegio de mayores (aquí, Sedbergh School).</dd><dt>Sentinel-2</dt><dd>Satélites europeos del programa Copernicus que fotografían la Tierra con píxeles de 10 m.</dd>',
    cardNote:'Barras blancas, amarillas y rojas, con las yardas de la tarjeta del club pasadas a metros. Los hoyos 10 a 18 repiten los 9 primeros.', poster:'Casterton · valle del Lune',
    horsesWhere:'junto a las cuadras del colegio y en los prados de al lado'
  },
  about:{t:'El valle',h:({BLD,W,fmt})=>`
    <p>Casterton es un pueblo pequeño de Cumbria, en el valle del río Lune, a 2 km de Kirkby Lonsdale. Al este suben los fells de Casterton y Barbon; al norte, los Howgill Fells; al oeste, el Lake District.</p>
    <h3>Qué hay</h3>
    <ul><li><b>Casterton, Sedbergh Prep</b>: el colegio de primaria y de 11 a 13 años de Sedbergh School, en el antiguo Casterton School (fundado en 1823), con su capilla, sus casas de internos, sus campos de deporte, su piscina y sus cuadras.</li>
    <li><b>Casterton Golf Club</b>, junto al colegio: 9 hoyos que se juegan dos veces (par 70), con barras blancas, amarillas y rojas a las distancias de la tarjeta del club; el <b>Par 3</b> de nueve hoyos cortos, el <b>campo de prácticas</b>, y el <b>footgolf</b> y el <b>rugbygolf</b> en los mismos hoyos (botón «Footgolf y más»).</li>
    <li><b>El colegio por dentro</b>: la planta baja del edificio principal con recepción, biblioteca, aulas (en la de matemáticas, cuentas en la pizarra), laboratorio, salón de actos y comedor, de diseño propio; fuera, sus pistas de tenis.</li>
    <li><b>Coches y aeronaves</b>: coches en los aparcamientos del colegio, del club de golf y de Kirkby Lonsdale, y helicópteros y coches voladores en tres helipuertos (colegio, club de golf y Kirkby Lonsdale).</li>
    <li><b>Kirkby Lonsdale</b>, con la iglesia de St Mary, el <b>Ruskin\'s View</b> sobre el Lune y el <b>Devil\'s Bridge</b>, el puente medieval.</li>
    <li>Los prados, separados por <b>muros de piedra seca</b> y <b>setos</b> que no se atraviesan, con sus <b>cancelas</b> que se abren al llegar, granjas de piedra y ovejas.</li>
    <li><b>Caballos, rutas y lugares</b>: la <b>pista de saltos</b> del centro ecuestre junto a las cuadras, cinco <b>rutas</b> reales por los caminos de herradura (al Devil\'s Bridge, Kirkby Lonsdale y Ruskin\'s View, Holy Trinity y Casterton Grange, Barbon y el círculo de piedras), los <b>puentes</b> que se cruzan y los <b>lugares</b> con cartel.</li></ul>
    <h3>Qué sale de datos reales</h3>
    <ul><li><b>Relieve:</b> el LIDAR de la Environment Agency, con 1 m de detalle (aquí, cada 4 m); alrededor, el de 2 m; y la región, el modelo Copernicus de 30 m.</li>
    <li><b>Casas:</b> ${BLD.length.toLocaleString('es-ES')} edificios con la planta de OpenStreetMap y del Ordnance Survey; la altura de cada uno la mide el LIDAR.</li>
    <li><b>Árboles:</b> ${W.TREES.length.toLocaleString('es-ES')} copas encontradas en el LIDAR, con su posición y su tamaño.</li>
    <li><b>Muros y setos:</b> los de OpenStreetMap y las líneas largas y finas, de medio metro a dos y medio de alto, que se ven en el LIDAR.</li>
    <li><b>Suelo:</b> no hay foto aérea abierta de Casterton, así que se dibuja: el color, del satélite Sentinel-2 (10 m); el relieve de cada copa, seto, muro y tejado, con su sombra, del LIDAR; caminos, agua, campos de deporte y jardines, de OpenStreetMap.</li>
    <li><b>Agua:</b> el río Lune por tramos, cada uno con su nivel, y los estanques.</li></ul>
    <h3>Qué es aproximado</h3>
    <ul><li>Fachadas y tejados siguen el estilo de la zona (piedra gris, ventanas de guillotina blancas y pizarra), no el de cada casa.</li><li>La especie de cada árbol.</li><li>Un muro y un seto se distinguen por su altura en el LIDAR: alguno puede estar cambiado.</li></ul>
    <p class="src">Datos: relieve y LIDAR © Environment Agency (Open Government Licence) · región: Copernicus GLO-30 (© DLR e.V. 2010-2014 y © Airbus Defence and Space GmbH 2014-2018, programa Copernicus de la UE y la ESA) · color: datos modificados de Copernicus Sentinel-2 · casas, caminos y agua: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a> · edificios: contiene datos del OS © Crown copyright and database right (OS OpenMap Local, OGL)</p>`},
  afterLoad(W){
    const PO=(W.course.pois||[]);
    const find=(re,k)=>PO.find(p=>re.test(p.n)&&(!k||p.k.startsWith(k)));
    const school=find(/Casterton.*(Prep|School)|Sedbergh Prep/i,'school')||{p:[0,0]};
    const golf=find(/Casterton Golf/i,'golf')||find(/golf/i,'golf');
    W.SCHOOL=school.p; W.GOLFC=golf?golf.p:[school.p[0]+500,school.p[1]];
    const L=(n,x,z,dy)=>({n,p:[x,W.terrain(x,z)+(dy||14),z]});
    W.POIS=[L('Casterton, Sedbergh Prep',school.p[0],school.p[1],22)];
    if(golf) W.POIS.push(L('Casterton Golf Club',golf.p[0],golf.p[1],14));
    const add=(re,k,label,dy)=>{ const p=find(re,k); if(p) W.POIS.push(L(label||p.n,p.p[0],p.p[1],dy)); return p; };
    add(/^Kirkby Lonsdale$/i,'place','Kirkby Lonsdale',30); add(/^Casterton$/i,'place','Casterton (pueblo)',18);
    add(/Devil.?s Bridge/i,'bridge','Devil\'s Bridge (puente medieval)',10); add(/Ruskin/i,'','Ruskin\'s View',10);
    add(/Casterton Grange/i,'','Casterton Grange',16); add(/St\.? Mary/i,'church','Iglesia de St Mary',22);
    add(/Holy Trinity/i,'church','Iglesia de Casterton',18); add(/Underley Hall/i,'','Underley Hall',18);
    { const r=PO.find(p=>p.k==='river'&&/Lune/i.test(p.n)); if(r) W.POIS.push(L('Río Lune',r.p[0],r.p[1],8)); }
    for(const p of PO.filter(p=>p.k.startsWith('place:village')||p.k.startsWith('place:hamlet'))) if(!W.POIS.some(q=>q.n.startsWith(p.n))) W.POIS.push(L(p.n,p.p[0],p.p[1],18));
    // horses: the stables of the school, if mapped
    const st=PO.filter(p=>p.k==='horses'); if(st.length) WP.horses=st.slice(0,3).map((p,i)=>[p.p[0]+12,p.p[1]+12,i?2:3]);
  },
  buggySpots({rows,atTee,W}){
    rows(W.SCHOOL[0]+40,W.SCHOOL[1]+30,3); rows(W.GOLFC[0]+20,W.GOLFC[1]+20,4);
    for(const C of W.COURSES) for(const n of [1,4,7]) atTee(C.holes[n-1]);
  },
  goldSpots({add,T,W,BLD,insideGoldSpot,spots}){
    const PO=(W.course.pois||[]); const at=(re,txt,dy)=>{ const p=PO.find(q=>re.test(q.n)); if(p) add(p.p[0],T(p.p[0],p.p[1])+(dy||1.0),p.p[1],txt); return p; };
    // the roof of the school's biggest building
    { let best=null; for(const b of BLD){ if(b.kd!=='school'||!b.walkY) continue; if(!best||b.area>best.area) best=b; } if(best) add(best.c[0],(best.roofTop||best.walkY)+0.9,best.c[1],'En lo más alto del edificio grande del colegio: llega planeando'); }
    at(/Devil.?s Bridge/i,'Junto al Devil\'s Bridge, el puente medieval sobre el Lune');
    at(/Ruskin/i,'En el Ruskin\'s View, el mirador sobre el Lune junto a la iglesia de Kirkby Lonsdale');
    at(/Casterton Grange/i,'En la avenida de Casterton Grange, la finca de al lado del colegio');
    { const r=W.PONDS.filter(p=>p.name==='Río Lune').sort((a,b)=>Math.hypot(a.c[0]+1300,a.c[1]-900)-Math.hypot(b.c[0]+1300,b.c[1]-900))[0]; if(r) add(r.c[0],r.level+0.6,r.c[1],'Flotando en el río Lune: hay que nadar'); }
    { let best=null; for(let x=-2900;x<=2900;x+=50) for(let z=-2900;z<=2900;z+=50){ const h=T(x,z); if(!best||h>best.h) best={x,z,h}; } if(best) add(best.x,best.h+1.0,best.z,'En lo más alto del mapa, en el fell: sube planeando'); }
    if(W.HOLES.length){ const H=W.HOLES[W.HOLES.length-1]; add(H.gx,T(H.gx,H.gz)+1.0,H.gz,'En el último green del Casterton Golf Club'); }
    at(/^Casterton$/i,'En el centro del pueblo de Casterton');
    { const q=insideGoldSpot([W.SCHOOL[0]-300,W.SCHOOL[1]+300]); if(q){ add(q.x,q.y,q.z,'En el salón de una casa cerca del colegio: busca el haz dorado que sale del tejado y entra'); if(spots.length) spots[spots.length-1].vb=q.b; } }
    at(/Holy Trinity/i,'Junto a la iglesia de Casterton');
    at(/^Kirkby Lonsdale$/i,'En el centro de Kirkby Lonsdale');
    { // a dry stone wall in the open fields
      const J=W.X&&W.X['walls.json']; if(J&&J.w){ const w=J.w.find(w=>w[0]===0&&w[2].length>=8&&Math.hypot(w[2][0]/4-W.SCHOOL[0],w[2][1]/4-W.SCHOOL[1])>700); if(w){ const x=w[2][0]/4, z=w[2][1]/4; add(x,T(x,z)+w[1]/10+0.9,z,'Encima de un muro de piedra seca, en los prados'); } } }
  }
};
