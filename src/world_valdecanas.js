/* ================= world: Isla de Valdecañas (embalse de Valdecañas, río Tajo, Cáceres) ================= */
const WP={
  id:'valdecanas', key:'vg', title:'Isla de Valdecañas',
  lat:39.84, lon:-5.37, sea:true, bed:[-20,40],
  center:[-300,-60], centerY:10, orbitR:1700, droneR:900,
  plane:{alt:430, spread:600},
  map:{x0:-1340,x1:800,z0:-1080,z1:920}, scaleBar:200,
  ranges:[{n:'Sierra de Gredos (hacia el norte)',z:[-40000,-15000]},{n:'Las Villuercas (hacia el sur)',z:[15000,40000]}],
  range:[-788,455],
  pier:{A:[420,-222],B:[690,-131]},
  ruins:[[-1237.5,437.5,-0.36],[-1222.5,427.5,-0.36],[-1207.5,420,-0.36],[-1192.5,412.5,-0.36],[-1177.5,407.5,-0.36],[-1165,415,-0.36],[-1225,446,-0.36],[-1210,438,-0.36],[-1195,430,-0.36],[-1180,422.5,-0.36],
    [-1289,383,1.57],[-1289,402,1.57],[-1289,421,1.57],[-1288,440,1.4],[-1277.5,452.5,0.6],[-1262.5,460,0.35],[-1247.5,465,0.2],[-1150,395,-0.47],[-1137.5,387.5,-0.47],[-1125,380,-0.47]],
  boats:[[1150,-300,300,'sail'],[300,520,240,'motor'],[-300,1250,320,'sail'],[1200,600,280,'motor'],[-1750,-420,250,'sail'],[-2000,620,220,'motor'],[900,-820,170,'sail'],[650,1150,260,'sail']],
  // cranes: flocks in V formation circling the reservoir (they winter in Extremadura from late October): x, y, z, radius, speed, birds
  birds:[[-300,120,-60,750,13,9],[-500,160,200,1150,15,13],[200,195,-400,1550,16,11]],
  treeExclude:[[400,790,-245,-60]],
  mpSalt:'isla-de-valdecanas/sala/v1', mpTopic:'vgolf/1/',
  legend:[['water','Agua: embalse, laguna y lagos'],[3,'Calle (fairway)'],[5,'Green'],[4,'Antegreen'],[6,'Tee'],[7,'Búnker'],[2,'Semi-rough'],[1,'Rough y dehesa'],[8,'Caminos y carreteras'],[9,'Playa'],[10,'Jardines y césped'],['villa','Villas y otros edificios (Catastro)'],['hotel','Hotel (3 plantas)'],['ruin','Estructuras sin terminar']],
  T:{
    loadData:'Descargando datos de la isla…', loadRelief:'Modelando el relieve real (IGN, 5 m)…', loadRegion:'Sierras, embalse y lagos…', loadBuildings:'Levantando villas y hotel con las plantas del Catastro…',
    landed:['¡En la isla!','Explora, busca las bolas doradas o ve a un tee para jugar'], walking:'Paseando por la isla', notJumped:'aún no ha saltado a la isla',
    House:'Villa', house:'villa', houses:'villas', place:'la isla', where:'en la isla', mapTitle:'Mapa de la isla',
    invite:'la Isla de Valdecañas', gameTitle:'Isla de Valdecañas Golf', samePlace:'la misma isla',
    photoNote:'Las villas son los tejados marrones; las calles y greens, el verde intenso.',
    planNote:'Plano del campo dibujado a partir de la foto aérea.',
    onGround:'En la isla', sounds:'agua en la orilla, pájaros de día, grillos de noche y grullas cuando pasan las bandadas',
    guideIntro:'Es la Isla de Valdecañas, en el embalse del mismo nombre (río Tajo, Cáceres), construida con datos reales: el relieve del Instituto Geográfico Nacional, su foto aérea como suelo y cada edificio del Catastro. Empiezas en una avioneta: saltas, planeas y aterrizas donde quieras. Desde ahí puedes explorar, conducir un buggy, nadar, jugar los 18 hoyos y buscar 12 bolas doradas.',
    rough:'Hierba alta y dehesa con encinas.', mdtStep:'5 m',
    glossary:'<dt>Dehesa</dt><dd>Pastizal con encinas dispersas, típico de Extremadura.</dd><dt>Grulla</dt><dd>Ave grande y gris que pasa el invierno en Extremadura (de finales de octubre a febrero); vuela en bandadas en forma de V.</dd><dt>Albero</dt><dd>Tono de arena amarillenta, el color de las fachadas de las villas.</dd>',
    cardNote:'Metros desde barras amarillas, de la tarjeta oficial.'
  },
  about:{t:'La isla',h:({BLD,W,fmt})=>`
    <p>La Isla de Valdecañas ocupa unas 133 hectáreas en la cola del embalse de Valdecañas, entre El Gordo y Berrocalejo (Cáceres), y se une a tierra por un dique con carretera.</p>
    <h3>Lo que hay en la isla real</h3>
    <ul><li>Campo de 18 hoyos, par 72 y 6.319 m desde blancas (5.924 m desde amarillas), diseñado por Álvaro Arana y abierto en 2010.</li><li>Hotel de cuatro estrellas en la parte oeste, con la casa club.</li><li>Unas 185 villas de una planta, de color albero, con cubiertas planas de grava y chimeneas de acero corten.</li><li>Pantalán con marina al este, playa con laguna al oeste, campo de prácticas al sur de la casa club y zona deportiva al norte, junto al dique de acceso.</li><li>En la punta oeste, estructuras de hormigón que se quedaron sin terminar; en el centro, terrazas de parcelas que nunca se urbanizaron.</li></ul>
    <h3>Qué sale de datos reales</h3>
    <ul><li><b>Relieve:</b> Modelo Digital del Terreno de 5 m del IGN (LiDAR). Las sierras del horizonte, del modelo de 200 m.</li><li><b>Suelo:</b> la foto aérea del PNOA, a 0,5 m por píxel en la isla.</li><li><b>Edificios:</b> ${BLD.length} volúmenes con la planta exacta del Catastro; la altura sale de su número de plantas.</li><li><b>Árboles:</b> ${W.TREES.length.toLocaleString('es-ES')} copas detectadas en la foto, con su posición y tamaño.</li><li><b>Agua:</b> el embalse a 313 m sobre el mar; la laguna de la playa y los lagos del campo, a su propio nivel; ${W.POOLS.length} piscinas detectadas en la foto.</li><li><b>Sol:</b> en el modo «Ahora», su posición se calcula con la fecha, la hora y la latitud y longitud de la isla.</li><li><b>Golf:</b> calles, greens y búnkeres son los de la foto; el orden de los hoyos, del plano oficial del campo; par, metros y hándicap, de la tarjeta.</li></ul>
    <h3>Qué es aproximado</h3>
    <ul><li>La posición exacta de cada tee y de la bandera dentro del green: el plano oficial es un dibujo, no un mapa a escala.</li><li>Fachadas, ventanas, porches y chimeneas siguen el estilo de las fotos de las villas, pero no son las de cada casa.</li><li>La especie de cada árbol (encina, pino, ciprés, chopo) se elige por la zona.</li><li>Las estructuras sin terminar están modeladas a mano sobre la foto.</li><li>Los interiores de las casas son inventados: la forma de cada casa y el sitio de sus ventanas son los del modelo (planta del Catastro), pero la distribución en estancias y los muebles se generan con uno de 8 estilos. La distribución se decide según la puerta por la que entras, que siempre da al salón.</li></ul>
    <p class="src">Datos: relieve y foto aérea © Instituto Geográfico Nacional (CC BY 4.0, <a href="https://centrodedescargas.cnig.es" target="_blank" rel="noopener">CNIG</a>) · edificios: <a href="https://www.catastro.hacienda.gob.es/webinspire/index.html" target="_blank" rel="noopener">Dirección General del Catastro</a> · caminos: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a> · campo: <a href="https://www.golfpass.com/courses/35938-vincci-valdecanas-golf/scorecard-and-layout" target="_blank" rel="noopener">tarjeta del campo</a>, <a href="https://blog.mobgolf.com/isla-de-valdecanas-fantastico-diseno/" target="_blank" rel="noopener">mobgolf</a>, <a href="https://wantesgolf.wordpress.com/2016/12/29/golf-isla-valdecanas-caceres/" target="_blank" rel="noopener">Wantes Golf</a>, <a href="https://reunido.uniovi.es/index.php/RCG/article/download/11021/10384/20012" target="_blank" rel="noopener">Universidad de Oviedo</a></p>`},
  afterLoad(W){
    const BLDS=W.BUILDINGS; const hotel=BLDS.filter(b=>b.f>=3).sort((a,b)=>b.area-a.area)[0];
    W.HOT=hotel?hotel.c:[-905,290]; W.HOT_B=hotel;
    W.POIS=[{n:'Hotel y casa club',p:[W.HOT[0],(hotel?hotel.top:20)+8,W.HOT[1]]},{n:'Pantalán y marina',p:[700,9,-128]},{n:'Playa y laguna',p:[-1110,9,470]},
      {n:'Zona deportiva',p:[190,12,-880]},{n:'Dique de acceso',p:[500,9,-1025]},{n:'Parcelas sin urbanizar',p:[-150,52,-200]},{n:'Estructuras sin terminar',p:[-1225,20,425]},{n:'Campo de prácticas',p:[-700,20,480]}];
  },
  buggySpots({rows,atTee,W}){ rows(W.HOT[0]+40,W.HOT[1]-20,3); for(const n of [3,5,10,13,16]) atTee(n-1); },
  goldSpots({add,T,W,BLD,PIER,ruinTop,insideGoldSpot,spots}){
    const hb=W.HOT_B; if(hb&&hb.top!==undefined) add(hb.c[0],hb.top+0.9,hb.c[1],'En la azotea del hotel: llega planeando');
    if(PIER.plat) add(PIER.plat[0],PIER.deckY+0.9,PIER.plat[1],'En la plataforma del final del pantalán');
    add(-1090,T(-1090,415)+1.0,415,'En la arena de la playa, junto a la laguna');
    add(-56,T(-56,-234)+1.0,-234,'En el punto más alto de la isla, en las terrazas del centro');
    add(500,T(500,-1025)+1.0,-1025,'Sobre el dique de acceso, camino de tierra firme');
    { const p=W.PONDS.find(p=>p.hole===11); if(p) add(p.c[0],p.level+0.6,p.c[1],'Flotando en el lago del hoyo 11: hay que nadar'); }
    { let best=null,bd=1e9; for(const b of BLD){ if(b.kind!=='villa') continue; const d=Math.hypot(b.c[0]+972,b.c[1]-104); if(d<bd){ bd=d; best=b; } } if(best) add(best.c[0],best.top+0.9,best.c[1],'En el tejado de una villa del noroeste'); }
    add(215,T(215,-845)+1.0,-845,'En el centro del campo de fútbol de la zona deportiva');
    { const p=W.PONDS[0]; if(p) add(-1150,p.level+0.6,530,'Flotando en la laguna de la playa'); }
    if(ruinTop) add(ruinTop.x,ruinTop.y+0.9,ruinTop.z,'En lo alto de las estructuras sin terminar de la punta oeste');
    { const H=W.HOLES[16]; if(H){ const x=H.pin[0]+2.5, z=H.pin[1]+1.5; add(x,T(x,z)+1.0,z,'Junto a la bandera del hoyo 17, el par 3 sobre la cala'); } }
    { const q=insideGoldSpot(); if(q){ add(q.x,q.y,q.z,'En el salón de una villa del sur: busca el haz dorado que sale del tejado y entra'); if(spots.length) spots[spots.length-1].vb=q.b; } }
    { const p=W.PONDS.find(p=>p.hole===2); if(p){ let bx=p.c[0], bz=p.c[1]; for(let r=4;r<60;r+=2){ const x=p.c[0]+r, z=p.c[1]; if(W.waterLevel(x,z)===0&&T(x,z)>p.level-0.5){ bx=x+3; bz=z; break; } } add(bx,T(bx,bz)+1.0,bz,'En la orilla de la charca del hoyo 2'); } }
  }
};
