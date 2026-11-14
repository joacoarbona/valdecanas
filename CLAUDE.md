# Juego de golf 3D: notas para Claude

Juego familiar de Joaquín con dos mundos y un solo motor:

- **Isla de Valdecañas**: joaco.org/valdecanas.
- **Golf en Madrid**: joaco.org/golf-madrid, con Puerta de Hierro Arriba y Abajo y Club de Campo Negro y Amarillo.

Cada mundo tiene su **tarjeta en directo** para rondas reales, en joaco.org/<ruta>/tarjeta/.

También están publicados como artefactos de claude.ai:

| Qué | Enlace |
| --- | --- |
| Isla de Valdecañas | https://claude.ai/artifact/TjZLVYsgSfcTSBmZ3mp7NM |
| Golf en Madrid | https://claude.ai/artifact/3nAii7F6LqVDEMZ9DqsWys |
| Plan iPhone y WebGPU (doc) | https://claude.ai/artifact/Ky5z2kjbmgk88FccGw99Hd |

Los artefactos antiguos se quedaron en versiones anteriores: AeJ4a1YaoW9iw2fML7UtvE y QdjjEqhB4N3cMDV8CHbfgq (1-nov), 7K5amygLwWnEWHP5wUUc15 y U1caj466YobSGypSA2v6Mu (bloque 3), G8pEqcqmUCcWDtuYYUCQvt y M6iCkdXVX4fZ8S2J4RaXmi (bloque 4), 39Rsfp6nRDvJpqs9TLaji4 y AvdJ14Vrn4WPq8DTzZn7pd (bloque 5), 3sYXxgEnQj2AZHFUCPwKbu y 7RZuYzveVJZbeALRPMCBC9 (pantalla limpia, 4-nov), LtyfKj66oLRLrPE3sXWgTV y U7j56dLhVvE8Jwm7xWHCqH (partida con la sala y J1, 5 a 11-nov), QEbQ2E8ifprvRJujYwP2AT y LJJCR6sJB3ff5maa7CPt9J (J2a, 12-nov), 3ar5LVyr9c9w5VTvGkcb6D y RLRGQcBvwkdCxr2nm9iM9n (J2b, 12-nov), QiHqXorhqZoo4sTZCpZ9cZ y Fqag6DJDoD2RMPtDnXkzmq (G2, 12-nov). Los de la tabla son del 14-nov (J3, bicis) y llevan la capacidad `downloads` declarada (guardar fotos). Madrid tiene 80 ficheros: con `publish_files` hay que subirlo en tres tandas (página y datos sin teselas al crear, y luego 32 + 32 teselas con `slug` y `base_version`); de golpe, la llamada no llega a ejecutarse. Truco barato (herramienta antigua) para un artefacto nuevo: los datos se copian en el servidor desde el artefacto anterior con `files` = {"data/…": {"artifact": <url anterior>, "path": "data/…"}}, sin subirlos.

## Cómo trabaja Joaquín

- Escribe en español y con mensajes cortos. Espera entregas completas, probadas y publicadas, sin preguntas que puedas resolver tú.
- Las interfaces van en tema claro.
- En herramientas complejas quiere introducción, guía de uso, glosario y leyendas explícitas en mapas y gráficos. Cada función nueva lleva su línea en la guía del juego.
- Planifica al P80 y gestiona al P50.
- Tiene Claude Pro: cuida el uso (ver «Ahorrar uso»).

## Estructura

- `src/` es la fuente de verdad.
  - **Motor**: módulos `g3*.js` concatenados en un solo IIFE, en el orden de `ENGINE` en `src/build_pages.py`: a, f, b, d, e, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, wb, x, y, z, bk, c. Un módulo nuevo va antes de `g3c.js`, que arranca el juego y define `window.__vg` (la API de pruebas).

    | Módulo | Contenido |
    | --- | --- |
    | a | renderer, luz por hora del día, terreno, agua, edificios, árboles, ruinas, muelle |
    | f | posprocesado HDR, luz del cielo, hierba y follaje |
    | b | personaje, vehículos, colisiones, cámara, golf, HUD, mapa y minimapa |
    | d | interiores de las villas |
    | e | multijugador: salas por MQTT sobre WebSocket con AES-GCM, chat y voz WebRTC; amigos en buggy, coche, caballo, moto, lancha, tabla y esquí |
    | g | Ver hoyos |
    | h | coches del tee 1 |
    | i | avatares de amigos |
    | j | pádel y tenis |
    | k | caballos y fauna |
    | l | barras de salida, caddie, lectura del green y tiempo |
    | m | repetición, modo foto y retos |
    | n | partida con hándicap contra rivales de la máquina (y `recv`, `stbl`, `rel`, que usa también `g3z`) |
    | o | golfistas, buggies, moto de agua y pesca |
    | p | pádel en sala |
    | q | ciudad de Madrid |
    | r | vuelta real de la tarjeta en 3D |
    | s | lanchas, esquí acuático, windsurf, kitesurf y caballos en el mapa |
    | t | pantalla en el móvil: sin zoom y «Ajustar pantalla» |
    | u | pantalla de inicio por modos, hoja «Jugar al golf» y mando (Gamepad API, se consulta en cada `step`) |
    | v | música (cuatro emisoras generadas con Web Audio) y pasajeros (en el vehículo de un amigo, y esquí detrás de su lancha) |
    | w | karts (la segunda parte está en `wb`): circuitos (lazo de hoyos y los de `WP.karts`), puertas, conos, semáforo, derrape con mini-turbo, rampas con acrobacia, atajos, monedas, turbos, bolas, charcos, rivales de la máquina, carrera con la sala, podio, clasificación y récord |
    | wb | karts, segunda parte (J2b): opciones (`KOPT`), garaje (`KG`, `kgDress`), objetos (`kbFire`, `kbHit`, `kbShots`), fantasma de la contrarreloj, Gran Premio y batalla de globos |
    | x | hotel y bar: Vincci Valdecañas Golf (recepción, bar con camarero, restaurante Ribereño, terraza al atardecer) |
    | y | motivos para volver: monedas, tienda, vitrina de trofeos (también en el hotel), circuitos (boyas en moto y lancha, slalom, caballos) y torneo familiar |
    | z | «Partida con la sala»: vuelta con hándicap contra los amigos de la sala, todos desde el tee 1, clasificación en vivo (`#rmBoard`) |
    | bk | bicis (J3): aparcabicis, BMX, de montaña y de niño con ruedines, manejo y trucos, bike park, sendas de bajada, contra el reloj y carreras con la sala |
    | c | guía, menú, entrada y arranque |

  - **Mundos y páginas**: `template3.html` es el HTML y el CSS. `world_common.js`, `world_valdecanas.js` y `world_madrid.js` llevan los datos y textos de cada mundo; cada uno activa sus partes con claves como `nautica`, `horses`, `pier` o `ruins`. `card/` es la tarjeta en directo. `card/g2.js` (G2: distancias por palo, «juega como», palo y plan del hoyo) va en la tarjeta (marca `/*G2*/` de `card.js`) y también en el motor, entre `g3r.js` y `g3s.js`, porque «Ver hoyos» lo usa.
  - **Compilación**: `build_pages.py` genera todas las páginas (ver «Compilar y probar»).
- `game/data/` y `madrid/game/data/` son los datos procesados: relieve VH16, ortofotos, edificios, árboles, `course.json`, `card.json` y, en Madrid, teselas y `city.bin`.
- `scripts/` descarga y procesa los datos geográficos. Las descargas se hacen con GitHub Actions, porque desde la nube no se llega al IGN. `scripts/build_game.py` y `scripts/build_joaco.py` son de la época de un solo mundo: no usarlos.
- `tools/test/` tiene las pruebas con Playwright.
- `prototype/webgpu/` es el prototipo del motor nuevo (ver su README).

## Reglas del motor

- three.js r128 se carga desde cdnjs. En los artefactos solo valen cdnjs, jsdelivr y unpkg, con versión exacta.
- Todo el motor es un solo IIFE: usa `var` para los objetos que otro módulo lee antes de evaluarse (zona muerta temporal). Los nombres de nivel superior no se pueden repetir entre módulos.
- Para el tamaño de la vista usa `viewW()`, `viewH()` y `fitView()`, nunca `innerWidth` o `innerHeight`: en el iPhone encogen al ampliar la página.
- Los recuadros de texto miden 16 px o más. No quites los guardas de gestos de `g3t.js`.
- La guía, que es la pestaña «Cómo se juega» del menú, y el glosario están en `g3c.js`. La leyenda del mapa está en `legendHTML` (`g3b.js`) y `extrasLegend` (`g3s.js`).
- Los mensajes de commit y de PR terminan con las líneas de atribución que indique el sistema.

## Compilar y probar

```sh
python3 src/build_pages.py        # todo a build/ (PAGES_OUT=/otra/carpeta para cambiarla)
(cd tools/test && npm install)    # three r128 y qrcode para las pruebas
python3 tools/test/ms.py valdecanas tools/test/steps/regresion_golf_moto_caballo.txt
python3 tools/test/ms.py madrid tools/test/steps/regresion_golf_moto_caballo.txt 390x844
```

`src/build_pages.py` genera:

- `build/publish_<mundo>/`: el artefacto, con los binarios como `.txt` en base64.
- `build/joaco_<mundo>/`: la copia para joaco.org, con los binarios tal cual.
- `game/index.html` y `madrid/game/index.html`: la copia del repo.
- Las tarjetas en directo.

Las pruebas:

- **`ms.py`** lee pasos de una línea: `js: <expresión>` imprime el resultado, `tick: n` avanza n fotogramas y `shot: nombre` guarda una captura en `tools/test/out/`. Empieza con `__vg.setPaused(true)` y avanza con `__vg.tick(n,1/30)` para no depender del reloj.
  - Hora del día: `__vg.setTOD('manana'|'mediodia'|'tarde'|'puesta'|'noche')`.
  - Aterrizar en la isla: `__vg.startDrop(); __vg.jumpFromPlane(); __vg.landNow()`.
  - Mover la cámara del dron: `__vg.goDrone()` y luego `__vg.orbit`.
- **`mp2.py`**: dos jugadores en una sala (`steps/mp_agua.txt` y `mp_agua2.txt`: amigos en el agua). Si algún paso empieza por `C:` abre un tercer jugador; `view: C 390x844` pone su ventana en tamaño móvil. Chromium no llega aquí a sockets locales, así que el broker MQTT va dentro de la prueba y se enruta con `route_web_socket`.
- **`card/ct.py`**: dos móviles en la tarjeta en directo, con GPS simulado. Responde al parte del viento (Open-Meteo) con 18 km/h del norte.
- **G2**: `card/g2.txt` (ct.py, los dos mundos: escalera tipo, golpes GPS → mis palos, ajuste a mano, caddie sin viento, automático y a mano, cuentas, plan del hoyo, guía y viento guardado en el golpe) y `steps/g2_plan.txt` (ms.py, los dos mundos; Madrid a 390x844: plan tipo y plan con `vg_bag` en «Ver hoyos», `?hoyo=`, caídas y guía).
- **`zoomt.py`**: comprobaciones de pantalla en móvil.
- **Mando**: `steps/modos_y_mando.txt` sustituye `navigator.getGamepads` por un mando falso y prueba menú, golf y paseo.
- **Música**: `steps/musica.txt` (ms.py). Con la isla en pantalla el reloj de audio del navegador de pruebas casi no avanza, así que la prueba toca cada emisora a mano.
- **Karts J2a**: `steps/karts_j2a.txt` (ms.py; Valdecañas, y Madrid a 390x844): circuitos y hoja, derrape en una curva real con el piloto automático, rampa con acrobacia, atajo (puertas que se dan por pasadas), hierba que frena, tres vueltas, podio, clasificación, mapa y guía. Los tiempos salen de pocos segundos porque el reloj de carrera es `Date.now` y los fotogramas de la prueba van más deprisa.
- **Karts J2b**: `steps/karts_j2b.txt` (ms.py; Valdecañas, y Madrid a 390x844): hoja con los cuatro modos, garaje (compra con monedas), carrera inversa con 7 rivales, los siete objetos, zona de agua, mapa, Gran Premio entero, contrarreloj con fantasma, batalla de globos y guía. El piloto automático de la prueba son las propias ayudas de dirección y acelerador (`kt.run`).
- **Karts**: `steps/karts.txt` (ms.py; un piloto automático recorre las puertas; espera con `js: new Promise(...)`, porque ms.py no tiene `wait`) y `steps/mp_karts.txt` (mp2.py: invitación con opciones y 3 rivales del anfitrión, misma carrera, el invitado ve el coche del garaje del amigo y los rivales sincronizados, saco de arena, bola y golpe que llegan al otro).
- **Premios, circuitos y torneo**: `steps/premios.txt` (ms.py; también en Madrid a 390x844): monedas y trofeos con `prgEvt`, tienda, pestañas, guía y glosario, boyas en moto con piloto automático, segunda vuelta con fantasma y diferencia, mapa y leyenda, lancha, slalom, caballos, torneo de tres jugadores (una ronda por `endRound`, el resto a mano), copa y vitrina del hotel. En Madrid fallan a propósito los pasos de agua y hotel (no hay).
- **Hotel y bar**: `steps/hotel.txt` (ms.py): menú «Hotel y bar», recepción, Ribereño, pedir en la barra, camarero, coger la bebida, sentarse en la terraza al atardecer, beber, levantarse, entrar por la puerta del bar, subir las escaleras desde el césped, mapa y leyenda.
- **Partida con la sala**: `steps/mp_partida.txt` (mp2.py, Valdecañas, Stableford: invitación desde «Jugar al golf», aceptar, los dos en el tee 1, golpes recibidos en la tarjeta del hoyo, cuenta Stableford comprobada aparte, sin avisos de «empieza el hoyo», salir y volver a la sala, recarga, tablero y tablero encogido, final con ganador, monedas y trofeo) y `steps/mp_partida_liguilla.txt` (mp2.py, Madrid, Match play con tres: C llega tarde en un móvil y le sale la partida en marcha, liguilla comprobada aparte, tarjeta de la sala con los 72 hoyos, C la deja y A la cierra para todos). El aviso `KeyError: 'code'` al final es del arnés de Playwright al cerrar las páginas: no importa.
- **Bicis**: `steps/bicis.txt` (ms.py; Valdecañas, y Madrid a 390x844): inicio y hoja, aparcabicis y su acción, pedaleo e inclinación, mesa del bike park con giro 360, caída con el mortal a medias, salto y derrape, medio tubo, pump track y senda con el piloto automático (`BK.auto`: sigue el curso y frena antes de las curvas), salida automática al cruzar el arco verde, bajar y volver a montar, tienda (color de la bici), mapa, leyenda, guía, glosario, modo foto y hoyo desde la bici. El giro de prueba junto al primer aparcabicis acaba contra el edificio (inclinación 1 en Valdecañas, que es la caída, y 0 en Madrid): no importa. `steps/mp_bicis.txt` (mp2.py): B ve al amigo en BMX con su avatar, A reta a la sala en el pump track, B acepta, salen a la vez y los dos ven la misma clasificación. Los tiempos de esa carrera salen de pocos segundos (reloj `Date.now` y fotogramas rápidos).
- **Pasajeros**: `steps/mp_pasajeros.txt` (mp2.py): buggy, grupa del caballo y esquí detrás de la lancha. B espera a ver el estado de A antes de acercarse, porque los estados llegan con retraso cuando hay dos navegadores.

Los errores `ERR_TUNNEL_CONNECTION_FAILED` vienen de las fuentes de Google bloqueadas en la nube: no importan. Cualquier `PAGEERROR` es un fallo. Prueba los dos mundos antes de publicar.

## Publicar (siempre las tres cosas)

1. **Repo del juego** (`joacoarbona/valdecanas`): commit en `main` y push.
2. **joaco.org** (`joacoarbona/master`):
   - Copia `build/joaco_valdecanas/index.html` en `joaco-org/public/valdecanas/index.html`, y `build/joaco_madrid/index.html` en `joaco-org/public/golf-madrid/index.html`. Copia también `tarjeta/index.html` y `data/` si cambiaron.
   - Crea una rama y el PR con la API REST (GraphQL no funciona desde aquí): `gh api repos/joacoarbona/Master/pulls --input pr.json` (JSON con title, head, base y body; con `-f` el servidor devolvió 502 el 4-nov).
   - Fusiónalo: `gh api -X PUT repos/joacoarbona/master/pulls/<n>/merge -f merge_method=squash`.
   - Espera a que Vercel diga `success`: `gh api repos/joacoarbona/master/commits/<sha>/status`.
3. **Artefactos de claude.ai** (desde el 12-nov las herramientas son `mcp__claude-artifacts__*`; ver la nota al final de este punto): en una conversación nueva, primero `Artifact read` de la URL. Después `Artifact publish` con `file_path=build/publish_<mundo>/index.html` y `url=<la del artefacto>`. Los datos ya están subidos; mándalos con `files` (y `root=build/publish_<mundo>`) solo si cambian.
   - **Ojo con el coste**: si la versión en vivo no la publicó la misma conversación, el servidor rechaza el publish hasta que se lea entera (unas 5.100 líneas y 650 KB por mundo, demasiado para Claude Pro). Publica los artefactos en la misma conversación que hizo el último publish. En una conversación nueva, Joaquín prefiere **artefactos nuevos** (publish sin `url`, con `files` de `build/publish_<mundo>/data/` y `root=build/publish_<mundo>`): no leas los antiguos; actualiza la tabla de enlaces de arriba.
   - **Con `publish_files`** (12-nov): la página debe empezar por `<!DOCTYPE html>`, y `build/publish_<mundo>/index.html` no lo lleva. Envuélvela con `full()` de `build_pages.py` en `build/art_<mundo>/index.html` (no en `/tmp`: no se adjunta) y pasa en `files` ese `index.html` más cada fichero de `build/publish_<mundo>/data/` con su ruta (`as`: `data/…`). Después, `declare_capabilities` con `{"downloads": {}}`.

## Estado a 12 de noviembre de 2026 (tarde)

- **J3 hecho y publicado** (12-nov; repo, joaco.org PR #44 con Vercel `success` y dos artefactos nuevos de la tabla, publicados el 14-nov). Todo en `g3bk.js` (nombres `bk*`, estado `BK`).
  - **Datos del mundo** (`WP.bikes`): `racks(W)` (nombre y punto; `bkSpot` busca cerca un sitio seco, llano y sin edificios y orienta el aparcabicis hacia el lado más despejado), `park:[x,z,radio,desnivel máximo]` (`bkPkFind` prueba explanadas de 90×50 m cada 16 m y 30°, lejos de los circuitos de karts y de `avoid`, sin golf ni agua, dentro del mapa) y `trails` (nombre y, si se quiere, `near` y `r`). Valdecañas: hotel, casa club, playa, marina y bike park (sale al norte de la playa, al oeste del hotel); sendas «de las terrazas» (desde lo más alto, hacia el 4) y «de la dehesa». Madrid: las dos casas club, Casa de Campo y bike park (en la punta de la Casa de Campo que entra en el mapa, al sur de la carretera de Castilla); sendas «de la Casa de Campo» y «del monte» (monte de Puerta de Hierro).
  - **Carga**: `buildBikes` (tras `buildHotel`, antes de los árboles: park y aparcabicis, con `TREE_EXCL` y `W.GRASS_CLEAR`) y `bkTrailsBoot` (tras `buildTrees` y antes de la hierba, porque las sendas esquivan árboles y se quita la hierba de su cinta). Cuesta 50-160 ms el park y 75-100 ms las sendas.
  - **Bicis** (`BK_T`: `bmx`, `mtb`, `kid`, con medidas, velocidad, salto, rapidez de trucos, hierba y arena): cinco mallas fusionadas por tipo y color (`bkParts`, `bkMesh`, `BKGEO`), escaladas con el personaje. `bkRender(M,R,V,sc)` coloca bici y ciclista desde un estado visual (inclinación, cabeceo, giro, mortal, tailwhip, bielas, ruedas, dirección y postura; la 9 es la caída) y `bkRiderPose` lleva pies a los pedales y manos al manillar con dos huesos (`bkIK`). Sirve para tu bici, la aparcada y la de los amigos.
  - **Manejo** (modo `bike`; `bkStep` → `bkPhys` en dos subpasos): pedaleo hasta `vmax` según el suelo (`bkSurf`; Esprint ×1,22), pendiente, rodadura y aire; giro de bici con aceleración lateral máxima de 7,5 m/s² (13 en las curvas peraltadas del pump track, `bkBerm`); inclinación = atan(v·ω/g). Saltar = salto; si lo mantienes girando al caer, derrape (`B.drift`; al soltar tras 0,6 s, +1,3 m/s y puntos). Despega cuando el suelo baja más deprisa de lo que cae la bici (`B.vyG`, la subida real del último paso). En el medio tubo (`bkHPLaunch`) sales recto hacia arriba y giras 180° en el aire. Si ruedas hacia atrás por una cuesta, la bici da la vuelta. Choques (`bkBlocked`): agua honda, piscinas, edificios, árboles y escalones de más de 0,35 m; a más de 7 m/s te caes (con ruedines, nunca).
  - **Trucos** (`BK_TR`, `bkTrick`, `bkTrickTick`, `bkLand`): en el aire, Saltar + joystick: a un lado Giro 360 (150), adelante Superman (120), atrás Mortal atrás (300), suelto Tailwhip en BMX (200) o Manos fuera (80). Con ruedines solo giro y manos fuera. Combo = suma × número de trucos; más de 0,55 s en el aire suma puntos. Truco por debajo del 82 % al tocar el suelo o impacto de más de 10,5 m/s: caída de 1,5 s. `BK.pts` cuenta mientras no te bajas (récord `vg_bk_best`); cada 1.000, `prgEvt('bkpts')`.
  - **Bike park** (`BK.pk`; coordenadas locales `u`, `v` con `bkPkW` y `bkPkUV`; `bkPkLH` da altura y tipo): explanada elevada con terraplén del 30 % alrededor, pump track (lazo de 86 m con 8 lomas y curvas peraltadas), dos mesas (1,3 y 1,7 m), medio tubo de 3,4 m (eje `u` de 14 a 32, `v` = 12), dos rampas de madera y tres lomas. Mallas con `bkPkPatch` (campo de alturas con paredes). `terrainAt` (`g3b.js`) usa `bkGroundAt`, así que se anda (y bota la bola) por encima.
  - **Sendas** (`bkTrails`, `bkTrailFind`, `bkTrailWalk`): desde los puntos más altos (rejilla de 24 m), pasos de 6 m cuesta abajo que evitan greens, tees, búnkeres, edificios, árboles y agua, dentro del mapa; la segunda empieza a más de 170 m de la primera. Se suavizan y se muestrean cada 2 m: cinta de tierra de 3 m, arco verde de salida, arco de cuadros de meta (4 m antes del final), postes en las puertas (cada 45 m) y dos rampas de madera (`BK.ramps`, también en `bkGroundAt`).
  - **Contra el reloj** (`BK.run`; `bkRunPrepare`, `bkRunBegin`, `bkGate`, `bkFinish`, `bkResults`): sendas y pump track (3 vueltas). Semáforo (`#kartLights`), columna amarilla en la siguiente puerta, cruce con `cirCross`, parciales, récord `vg_bk_<mundo>_<id>` con trayectoria y fantasma dorado (`cirGhostMesh`). Medallas (`bkMedals`): bajada simulada en una dimensión con la de montaña a tope; oro ×1,12, plata ×1,35, bronce ×1,7. Las sendas empiezan solas al cruzar en bici el arco verde. `prgEvt('bkrun')`; oro en una senda da el trofeo «Oro en la bajada».
  - **Con la sala**: mensaje `bkgo` (`rid`, curso `c`, hora `go`); a los demás les sale «Correr», salen a la vez (separados por `bkSlot`) y cada uno ve la clasificación (`bkRaceRank`) con el estado `br` (carrera) y `bp` ([progreso, tiempo de llegada]). El estado lleva `bk` (tipo, inclinación, cabeceo, giro, mortal, bielas, postura, tailwhip y dirección) y `bkc` (color de la tienda); `bkPeer` dibuja la bici del amigo con su avatar. `prgEvt('bkrace')`; ganar a un amigo da el trofeo «Ganador en bici».
  - **Interfaz**: botón «Bicis» del inicio (`#mBikes`) y del menú (`#mBike`), y «Opciones» del marcador → `bkSheet()` (bici, dónde, contra el reloj, retar a la sala, cómo se juega y cómo se lee); en un aparcabicis, «Coger una bici» → `bkSheet(rack)`. Marcador `#bkHud` (en el móvil arriba a la izquierda; `body.bkon` oculta `#status`) y avisos de trucos `#bkTrick`. Tu bici se queda donde la dejas («Montar en la bici»); al coger otra, la anterior vuelve a su aparcabicis. Si algo te saca de la bici (un hoyo, un kart, el inicio), `bkTick` la aparca; el modo foto no.
  - **Tienda y trofeos**: hueco `bici` (verde neón 50, rosa 50, negro mate 70, dorada 150 y cuadro de campeón con el trofeo `bajada`); `bkRecolor` desde `prgApply`. Trofeos `trucos`, `bajada` y `bici` (21 en total).
  - **Mapa y guía**: `bkDrawMap` y `bkLegend` (en `drawExtras` y `extrasLegend`), `bkGuideHTML` (en «Más formas de jugar») y `bkGlossHTML`.
  - **Queda de J**: subir al kart de otro (pasajero) y J4 (pack para niños). **Siguiente según el orden**: J4; G1 sigue pendiente.

## Estado a 12 de noviembre de 2026

- **G2 hecho y publicado** (12-nov; repo, joaco.org PR #43 con Vercel `success` y dos artefactos nuevos de la tabla).
  - **Datos**: `card_data.py` añade a `card.json` `ll` (centro en lat/lon, para el viento) y `el` (rejilla de alturas de 1 byte en base64, cada 12 m en Valdecañas y 20 m en Madrid, sacada de `h_core.bin`; `elevAt` interpola). Al cambiar `course.json` hay que volver a correr `python3 src/card/card_data.py`.
  - **Lógica común** (`card/g2.js`, nombres `g2*` y `G2_*`): `G2_REF` (escalera tipo de 14 palos, metros totales), `g2Typ` (mediana y media de los golpes a menos del 20 %), `g2Bag(muestras, a mano)` (orden: a mano, GPS con 3 golpes buenos, mezcla con 1-2, estimada = escalera × la mediana de los cocientes de los palos conocidos; las estimadas nunca adelantan a sus vecinas), `g2Plays(d,dh,viento,ux,uz)` (desnivel 1:1 hasta ±25 %; viento en contra +0,6 %·km/h, a favor −0,3 %, rebajado en golpes cortos; deriva 0,35 %·km/h; viento = de dónde viene, en grados), `g2Pick` (palo más cercano, alternativa a menos de 7 m, porcentaje del swing por debajo del LW) y `g2Plan` (golpes hasta el green por la línea del hoyo; prueba los 6 palos más largos, penaliza arena o agua en la caída con la rejilla de superficies y dejar menos de 0,8 × LW).
  - **Tarjeta** (`card.js`, bloque G2): `mySamples` lee mis golpes de todas las partidas del móvil (el jugador con `dev` o el nombre `<key>_yo`), descarta >25 m de precisión GPS y <25 o >330 m, y los pasa a llano y sin viento; `bagNow` junta los de los dos mundos (`vg_g2s_<key>`) y deja el resultado en `vg_bag` para el juego. Ajustes a mano en `vg_bagman`. Viento `WIND` (`vg_windm`: auto con Open-Meteo cada 10 min, a mano `vg_windman` o sin viento); cada golpe GPS guarda ahora el viento (`s[4]` km/h y `s[5]` grados). Caddie (`caddieHTML`) bajo las distancias GPS; plan (`planHTML`, `planWire`) en Hoyo (plegable, `vg_planopen`) y en la pestaña nueva **Plan** (recorrido, barras y hoyo), con el mapa (`drawHoleMap(...,plan)`) y el enlace «Ver el vuelo del hoyo en 3D» (`?hoyo=<índice>&barras=`). Pestaña **Mis palos** (`VIEWS.bag`). Guía y glosario ampliados.
  - **Juego** (`g3g.js`): `viewPlan` con `vg_bag` (o la escalera tipo) y la superficie del juego; la tarjeta de «Ver hoyos» lleva `#vPlan`, y las caídas salen como etiquetas `.vlab.plan` con una línea azul claro (`VW.pline`). `viewFromURL` (llamada tras `rrFromURL` en `g3c.js`) abre el vuelo de un hoyo. Guía y glosario del juego con su línea.
  - J3 se hizo después (ver arriba).

- **J2b hecho y publicado** (12-nov; repo, joaco.org PR #42 con Vercel `success` y dos artefactos nuevos de la tabla): con esto J2 queda cerrado. Lo nuevo está en `g3wb.js`; `g3w.js` conserva la conducción y la carrera.
  - **Modos** (`KOPT.md`, no se guarda): Carrera, Gran Premio, Contrarreloj y Batalla de globos, elegidos arriba en `kartSheet`. `kartNewRace` reparte y `kartLaunch(sp)` crea la carrera y manda la invitación. `KART.mode` y `KART.x` (opciones de esta carrera: `md`, `rv`, `it`, `bs`, `cu`, `ar`, `bt`, `gp`, `host`) valen para todos los de la carrera.
  - **Opciones**: `KOPT` (`vg_kopt`): objetos (`it`), velocidad de los rivales (`bs` 0 a 2: 10,2, 11,5 o 12,7 m/s de base, más hasta 1,5 según el rival), ayuda a los rezagados (`cu`: +1,5 m/s en la segunda mitad y a más de 50 m del primero, mejores objetos y efecto goma de los rivales), sentido inverso (`rv`) y, solo en el dispositivo, ayuda de dirección (`as`, en `kartSteer`) y acelerador automático (`ag`, en `kartThr`). Rivales de la máquina: 0, 1, 3, 5 o 7 (`KART.nb`).
  - **Sentido inverso y circuitos**: `kartBuild(ids,k,rev,nm)` invierte los puntos antes de suavizar (clave `…_r`, récords aparte). En Madrid hay un circuito por recorrido (`kartCircuits` da `campo` para el recorrido en juego y `c<i>` para los otros; `kartCirIds`).
  - **Zonas de agua** (`C.fords`, dos tramos de 16 m al 45,5 % y al 79,5 %): planos azules de borde a borde; frenan a 10,5 m/s salvo con turbo, en modo dorado o por el aire. Si el kart se queda parado fuera del eje 1,6 s (agua de verdad, un muro), vuelve solo a la pista.
  - **Objetos** (`KB_IT`; `KART.item` es el tipo y `KART.itemN` cuántos): turbo, bolas de golf (3, rectas), bola dorada (persigue al de delante), bolsa de arena (detrás), paraguas (8 s, para un golpe), nube de lluvia (4 s a los de delante) y modo dorado (6 s). `kbRoll` reparte según el puesto (`kbFrac`). Los rivales también cogen cajas y los usan. Quien dispara simula el tiro y decide el golpe (`kbHit`); a la sala van `kti` (tiro, saco, nube, `quita`), `kth` (golpe a un amigo o a un rival del anfitrión) y `ktbt` (el anfitrión manda cuatro veces por segundo dónde van sus rivales; el invitado los lleva a ese punto). `ktb` (bola soltada de versiones anteriores) se sigue entendiendo.
  - **Garaje** (`KG`, `vg_kgar`; `kartGarage`): kart, buggy o coche (`KG_VEH`: aceleración, punta, hierba, asiento y altura), 8 colores más el dorado, y pegatina o dorsal (`KG_STK`). `kgDress(malla,d,b)` cambia la geometría del buggy por la del vehículo (`kgGeo`, colores por vértice) y cuelga las pegatinas y lo que va encima (`kgFx`: paraguas, brillo dorado, nube y globos); `kgUndress` lo devuelve. `seatPos` lee `b.kc`. El estado manda `kg` (aspecto) y `kf` (paraguas, dorado, nube), y `kgPeer` viste la copia del amigo. Tienda (`SHOP`, hueco `kart`): pintura dorada (120), llamas (60) y corona (trofeo `gp`).
  - **Rivales**: hasta 7 (`kbBotList`): primero los avatares de la familia (`AVS`) y luego `KART_BOTS`; con amigos en la sala solo `KART_BOTS`, que van en el mensaje `ktgo` (`o.bt`).
  - **Gran Premio** (`KART.gp`; `kbGpRounds`, `kbGpGo`, `kbGpTable`): cuatro carreras (los circuitos del mundo y, si faltan, los mismos en inverso), puntos 10-8-6-5-4-3-2-1. En sala, el organizador lanza cada carrera y a los demás les empieza sola; cada navegador suma los puntos por nombre.
  - **Contrarreloj** (`kbGhostStart`, `kbGhost`): sin rivales ni cajas, 3 turbos. Guarda la carrera (4 muestras por segundo) en `<clave del circuito>_g<vueltas>` si mejora, y la repite un kart blanco «Tu récord»; el marcador da la diferencia.
  - **Batalla de globos** (`kbArena` busca un círculo de 34 m seco, despejado y llano cerca del tee 1; `kbBatMe`, `kbBatBots`, `kbBatRank`): 3 globos, 3 minutos, cajas y dos turbos; el estado manda `kp` = [globos, dianas, fuera]. Con amigos no hay rivales de la máquina.
  - **Premios**: `prgEvt('gp'|'ktt'|'kbat')` y dos trofeos nuevos, «Campeón del Gran Premio» y «Rey de los globos» (18 trofeos).
  - **Queda de J** (entonces): subir al kart de otro (pasajero), J3 y J4.

- **J2a hecho y publicado** (12-nov; repo, joaco.org y dos artefactos nuevos de la tabla): conducción de consola y circuitos, todo en `g3w.js`.
  - **Circuitos** (`kartCircuits`, `kartCirBuild`): «Caminos del campo» (el lazo de hoyos de `kartPickHoles`, ahora de unos 1,1 km; en Madrid se llama «Circuito del club», `WP.kartCampo`) y los dibujados a mano en `WP.karts` de `world_valdecanas.js`: «Playa y laguna» y «Calles de las villas». Son los 4 del plan: 3 en Valdecañas y 1 en Madrid. `KART.cir` guarda el elegido; el mensaje `ktgo` lo lleva en `c`. Conos naranjas cada 20 m en los bordes (a 9 m del eje).
  - **Atajos** (`kartCuts`): hasta dos rectas por circuito que recortan una curva, buscadas solas (secas, sin edificios ni árboles; ahorran lo máximo). Franja de tierra y cartel verde ATAJO. Mientras vas por uno (`KART.cutT`), las puertas que quedan dentro se dan por pasadas. Fuera de la pista (más de 11 m del eje) la hierba frena a 8 m/s, salvo en atajo o con turbo.
  - **Rampas** (`C.ramps`): dos en la pista y una en cada atajo. Al despegar, Saltar en el aire hace la acrobacia (`KART.trick`) y da 1,3 s de impulso al caer. Los rivales dan un saltito.
  - **Derrape** (`kartDrive`, `kartSteer`, llamado desde `updateDrive`): Saltar da un bote; si vas girando y lo mantienes (`kartHeld`: botón, espacio o A del mando; `inp.jh`), derrapas. Niveles a 0,55, 1,3 y 2,3 s (chispas azules, naranjas y moradas) y mini-turbo de 0,7, 1,2 o 1,9 s al soltar. `placeBuggyMesh` lee `b.lift` (altura) y `b.spinV` (giro visual).
  - **Monedas**: 33 a 36 por circuito; cada una sube la velocidad máxima 0,3 m/s (13 → 16 con 10); un trompo quita 3. Turbo: 20,5 m/s.
  - **Final**: tres vueltas por defecto. Al cruzar la meta, `kartPodium` busca un sitio despejado junto a la pista, sube a los tres primeros (cajones oro, plata y bronce, con nombre), aparca tu kart delante y suelta confeti; a los 2,6 s sale la clasificación con monedas, mini-turbos y acrobacias.
  - J2b se hizo después (ver arriba).

## Estado a 11 de noviembre de 2026

- **J1 cerrado** (11-nov; repo, joaco.org y los dos artefactos de la tabla, republicados en la misma conversación): al revisar, el inicio por modos, las embarcaciones del amigo en multijugador y el mando ya estaban hechos y publicados (bloque 1 del 3-nov). Faltaba el modo **Karts** del inicio: botón `#mKarts` (`g3y.js`) que abre `kartSheet()`; `kartNewRace` aterriza con `cirLand()` si vienes del inicio o del dron. Prueba `steps/inicio_karts.txt` (ms.py, los dos mundos a 390x844). Siguiente según el orden: fase 1 del plan iPhone, G1 o J2.

- **Partida con la sala** (5-nov; `g3z.js`; repo, joaco.org PR #23 con Vercel `success` y artefactos nuevos de la tabla): vuelta con hándicap contra los amigos de la sala, sin rivales de la máquina.
  - **Empezar**: «Jugar al golf» con amigos en la sala ofrece «Con la sala» (formato elegido allí); también la pestaña Partida (recorrido, barras, formato y tu hándicap) y el botón «Partida de golf» del recuadro de la sala en el inicio. `rmStart` borra la tarjeta, manda la invitación y te pone en el tee 1 (`rmGoTee` → `playTee(true)`). A los demás les sale `mpPrompt` «Jugar la partida» (`rmJoin`). Quien entra tarde en la sala ve una vez la partida en marcha si va por la ida.
  - **Mensaje** `rmp`: cabecera (`m` id, `f` formato, `c` recorrido, `te` barras, `o`/`on` organizador, `t0`) + `u` (id estable del jugador, `vg_uid`), `n`, `cl` (color), `hc`, `sc` (golpes por hoyo en el orden del recorrido), `x` (deja la partida), `e` (cerrada), `iv` (invitación). Se manda al unirse, tras cada hoyo (`rmCard` desde `saveScores`), al entrar alguien en la sala (`rmHello` desde `mpHi`) y cada 25 s. Cada navegador calcula la clasificación con las entradas, así que un mensaje perdido lo arregla el siguiente. «Va por» (hoyo y golpe) sale del estado de posición (`p.cur`); `p.rmu` enlaza el par con su `u`.
  - **Formatos** (`rmTable`): Stableford (puntos; empate, mejor neto), Medal neto (neto al par de los hoyos jugados) y Match play (dos: hoyos arriba, dormie, «3 y 2»; tres o más: liguilla todos contra todos, 1 punto por match ganado y 0,5 por empate, solo matches empezados; empate, más hoyos de ventaja). En match, el de más hándicap recibe la diferencia (`rmDuel`). Los golpes por hoyo salen de `recv` (`g3n.js`).
  - **En pantalla**: `#rmBoard` debajo de la barra de la sala (en pantallas bajas arriba al centro): puesto (= empate), jugador con hándicap, «va por» y resultado; se encoge al tocarlo (`vg_rmopen`). Se oculta en carreras, menús, foto y repetición. La línea de la tarjeta del hoyo (`#hcMatch`, `rmHcLine`) dice los golpes que recibes o das en ese hoyo. Toast con tu puesto tras cada hoyo y aviso de cambio de líder.
  - **Final** (`rmCheck`): cuando todos los que siguen han terminado o alguien pulsa «Cerrar la partida ahora». Monedas (15, +25 si ganas) y trofeo «Ganador con la sala» (`prgEvt('sala')`, 16 trofeos). `endRound` abre la pestaña Partida (`rmRound`).
  - **Guardado**: `<mundo>_rm` (vale 18 h y es de la sala `RM.room`); al recargar y volver a la sala sigues en la misma partida. El hándicap del jugador (`vg_hcp`) es el mismo que el de la partida contra la máquina.
  - **Mientras hay partida**: no salen los avisos «X empieza el hoyo» de los que juegan, «Tarjeta nueva para todos» no borra la tuya y no hay rivales de la máquina.
- **Arreglos del 5-nov**: en Madrid la tarjeta de la sala perdía los golpes de los amigos fuera de los 18 primeros hoyos (Abajo, Negro y Amarillo; `slice(0,18)` en `g3e.js`); el botón «Jugar el …» de la sala decía el índice del hoyo y no su número; el paso de la moto de la regresión ya no falla en Madrid; en el móvil el aviso de la sala se estrecha cuando está la clasificación.

- **Pantalla limpia en competición** (4-nov, noche; repo, joaco.org PR #22 y artefactos nuevos): `raceUI()` en `g3y.js` pone `body.race` mientras hay carrera de karts o circuito en marcha (`raceNow`). Con ella se oculta `#status`, el marcador (`#kartHud`, `#cirHud`) se encoge y en el móvil va arriba a la izquierda, las medallas solo salen al cruzar parciales, las monedas (`prgPop`) esperan a la meta y también mientras apuntas o la bola vuela (`quietNow`), y `tip()` no repite instrucciones largas ya leídas (`tipSeen`, `vg_tips`). Botón «Avisos: pocos/todos» del menú (`QUIET`, `vg_quiet`, `body.quiet`): recuadros más pequeños e instrucciones una sola vez siempre.

- **Bloque 5 hecho y publicado** (repo, joaco.org PR #21 con Vercel `success`, y dos artefactos nuevos de la tabla): motivos para volver (`g3y.js`), en los dos mundos.
  - **Progreso** (`PRG`, `localStorage` `vg_prog`, común a los dos mundos): monedas, compras, ropa puesta (`eq` por hueco: camisa, pantalón, gorro, palos, bola), trofeos (`tro`, con fecha, mundo y quién) y últimos movimientos. Todo premio pasa por `prgEvt(tipo,datos)`, llamado desde `g3b` (hoyo y `endRound`), `g3m` (récord de retos), `g3c` (bola dorada), `g3w` (karts), `g3o` (pesca) y `g3s` (saltos en esquí). `prgPop` enseña los avisos en cola (las monedas seguidas se suman).
  - **Tienda** (`SHOP`): ropa, gorras, palos y bolas. `prgSkin` pone lo comprado sobre el personaje o el avatar en `setSkin`; `buildRig` lee `sk.cs` y `sk.ch` (varilla y cabeza del palo). `prgBall` colorea bola y estela. La chaqueta verde (trofeo de campeón) y la bola dorada (todas las bolas doradas) no se compran.
  - **Trofeos** (`TRO`, 15 entonces y 16 desde la partida con la sala, con copa de oro, plata o bronce): pestaña «Premios» del menú (monedas, tabla de cómo se ganan, tienda, vitrina, récords de circuitos) y vitrina de cristal en la recepción del hotel (`torHotel`, llamada desde `hxEnter`; acción «Ver la vitrina de trofeos»), con las copas de los campeones encima.
  - **Circuitos** (`CIR`, `CIRK`; botón «Circuitos» del menú y del inicio): boyas en moto de agua (12 puertas en zigzag, una vuelta) y en lancha (8 puertas, dos vueltas) sobre el círculo de la lancha de esquí (`SKI.loop`); slalom de esquí (6 boyas por pasada, hasta 3 pasadas; pasada perfecta = lancha más rápida); carrera de caballos en un óvalo de terreno libre buscado junto a `WP.horses` (`cirHorseRing`: en Valdecañas sale pequeño y son tres vueltas; en Madrid cae en el Hipódromo de la Zarzuela). Semáforo de karts, medallas por tiempo (86 %, 70 % y 55 % de la velocidad máxima), récord con trayectoria y parciales en `vg_cir_<mundo>_<circuito>` y fantasma dorado «Tu récord». Mapa y leyenda (`cirDrawMap`, `cirLegend`).
  - **Torneo familiar** (`TOR`, pestaña «Torneo» y modo del inicio): de 2 a 6 jugadores con hándicap, de 1 a 4 rondas, opción de una ronda por jugador y día. «Jugar ronda» pone la tarjeta nueva en el tee 1 y `endRound` la apunta (`torRound`); también se apunta a mano una vuelta real. Clasificación por neto al par; empate, mejor última ronda. Al acabar: historial `<mundo>_torneos`, trofeo de campeón, copa en el hotel y celebración al entrar (`torCeremony`).

- **Bloque 4 hecho y publicado**: hotel y bar (`g3x.js`), solo en Valdecañas (clave `hotel` del mundo, con `name` y `rest`).
  - **Fuentes**: la memoria del proyecto (proarquitectura, «Hotel Husa Golf Valdecañas»: cuerpo de tres plantas, vestíbulo prisma de acero corten acristalado, salón-bar al sur con vistas al embalse, mármol blanco de Macael en el vestíbulo, tarima de roble, cerámica en el comedor) y las fotos de las galerías (entrada acristalada, salón con dos sofás y lámparas de pie, balcones con sillas de mimbre).
  - **Ejes**: `hxFrame` saca de la huella del Catastro (`W.HOT_B`, parte 1) el eje largo `u`, el sur `v` y las fachadas (`tN`, `tS`, salida norte `tO`). `hxW(s,t)` y `hxL(x,z)` pasan de locales a mundo. Distribución en `HXL`: Ribereño al oeste, bar en medio y recepción al este; puerta principal en s=10 (norte) y del bar en s=-7 (sur).
  - **Fuera, al cargar** (`buildHotel`, llamado en `boot` antes de los árboles): terraza de baldosa con barandilla de vidrio, escaleras, 6 mesas con sillas (`HX.seats`), sombrillas, olivos, guirnalda de luces y dos clientes; pórtico de corten con el nombre en la entrada norte. Quita árboles (`TREE_EXCL`) y hierba (`W.GRASS_CLEAR`, en `g3f.js`) de la terraza. El suelo de la terraza y del bar va por encima del terreno más alto (`deckY`).
  - **Dentro** (`hxEnter`): usa la maquinaria de las villas (`S.interior` con `hotel:true`, plano, recorrido y colisiones). Mientras estás dentro se ocultan `BLDMESH` y `BLDHIDE` (fachadas del hotel, tejados y cristales de `g3a.js`), y `collide` ignora las partes del hotel (`S.interior.skip`). Las lámparas del hotel van siempre encendidas. `exitVilla` llama a `hxLeft`.
  - **La bebida**: «Pedir en la barra» abre `#hotelSheet`; el camarero (`hxBarmanTick`) va a tu sitio, coge la botella y llena el vaso en la barra; «Coger la bebida» lo pone en la mano (`rig.aR.el`). «Sentarte» (o «Sentarte en la terraza» desde dentro, que elige la silla que mira a la puesta) pone la hora en puesta y la devuelve al levantarte; `#hotelSeat` tiene Beber y Levantarte.
  - **Mapa**: terraza y dos puertas moradas (`hxDrawMap`, `hxLegend`). Menú: «Hotel y bar».

- **Bloque 3 hecho y publicado**: karts (`g3w.js`), desde el botón «Karts» del menú.
  - **Circuito**: `kartPickHoles` elige de 2 a 6 hoyos seguidos del recorrido que cierran el lazo cerca del primer tee, de unos 1,6 km, sin agua y con pocos árboles; se suaviza y se muestrea cada 4 m. Una puerta cada unos 110 m (la de salida, a cuadros); la siguiente va en verde, con columna amarilla y punto en el mapa (leyenda en `extrasLegend`).
  - **Carrera**: semáforo (`KART.go`, reloj `Date.now`), turbos (velocidad máxima 18 en vez de 12,5), cajas «?» con 1 a 3 bolas de golf (Acción: soltar; quien la pisa derrapa), charcos, choques sí o no y hasta 3 rivales de la máquina que siguen la pista con efecto goma. En carrera, los árboles a menos de 7 m de la pista no frenan en seco (`KART.offT`).
  - **Con la sala**: mensajes `ktgo` (invitación con circuito, vueltas, choques y hora de salida) y `ktb` (bola soltada). El estado lleva `kr` (id de carrera) y `kp` (vuelta, metros, tiempo de llegada). Con amigos no hay rivales de la máquina.
  - **Récord** en `localStorage` por circuito y vueltas, más la mejor vuelta. Con la música encendida, suena Arcade durante la carrera.

- **Bloque 2 hecho y publicado** (repo, joaco.org y los dos artefactos de la tabla):
  - **Pasajeros** (`g3v.js`, modo `pas`): con un amigo cerca en buggy, coche (si no lleva copiloto), caballo, moto de agua o lancha sale «Subir con …». El estado envía `rd` (id del conductor) y `rk` (tipo); cada uno dibuja al pasajero en el asiento a partir del vehículo del conductor. «Bajarte» o Saltar te deja al lado, o nadando si hay fondo.
  - **Esquí detrás de la lancha de un amigo**: la lancha ofrece «Subir a la lancha» o «Esquiar detrás» (`#pasPrompt`). `SKI.tow` guarda el id del amigo; el estado lleva `tw` y los demás no dibujan una segunda lancha. Si el amigo se baja o se para más de 4 s, sueltas la cuerda.
  - **Música**: emisoras Paseo, Guitarra, Arcade y Noche, en la fila «Música» del inicio y en el botón y la barra de volumen del menú (`vg_mus`, `vg_musv`). Pasa por `master`, así que «Sonido: no» la apaga.

- **Bloque 1 publicado** en el repo, en joaco.org (PR #17 de `joacoarbona/master`, Vercel `success`) y en dos artefactos nuevos (tabla de arriba), creados así para no releer los antiguos.
- Prueba nueva `steps/mp_agua3.txt`: con los dos jugadores en tiempo real y cerca, B ve la cometa del amigo. La espuma de la moto del amigo solo se dibuja a menos de 350 m de la cámara; en las pruebas la cámara queda en el aire tras `landNow()`, por eso sale `espuma: false`.
- El paso de moto de agua de `regresion_golf_moto_caballo.txt` devuelve «sin agua en este mundo» en Madrid (antes fallaba).

- **Inicio por modos** (bloque 1, hecho): Jugar al golf (hoja con recorrido, barras, formato y rivales), Partida real, Explorar, Con amigos y Retos.
- **Mando** (bloque 1, hecho): Xbox, PlayStation o Luna; leyenda en la guía, «Jugar con mando».
- **Agua en multijugador** (bloque 1, hecho): se ve la moto, lancha, tabla (con cometa) o el esquí del amigo con su espuma, y nuestra copia se oculta; al bajarse, la embarcación queda donde la dejó. Los coches ya iban bien.

- **Juego**: caída en avioneta, planeador, buggies, coches, 18 hoyos por recorrido, barras de salida, caddie, tiempo y viento, repetición, modo foto, retos, partida contra amigos con hándicap, golfistas y buggies por el campo, villas por dentro, pádel y tenis (en sala con amigos), caballos, fauna y avatares de amigos.
- **Multijugador**: salas con voz y chat.
- **Madrid**: la ciudad alrededor en 3D.
- **Agua (Valdecañas)**: moto de agua, pesca, lanchas, esquí acuático, windsurf y kitesurf.
- **Tarjeta en directo**: con GPS, historial y estadísticas, y repetición de la vuelta real en 3D.
- **Móvil**: «Ajustar pantalla».
- **Pendiente de Joaquín**: las fotos de la casa de Valdecañas para recrearla y el alta en Apple Developer, que hace falta para la fase 2.

## Siguientes tareas: dos líneas en paralelo (actualizado el 11-nov-2026; una conversación por bloque)

Sesión = una tarea del tamaño del arreglo del zoom del 1-nov (unos 20 minutos de trabajo y 45 pasos). Cifras en sesiones, P50 · P80. Orden propuesto: J1, G1, J2, G2, J3, J4, G3, J5, J6, J7, y el plan iPhone y WebGPU intercalado (su fase 1 justo después de J1).

### Línea J · Juego (diversión, también para niños)

1. **J1 · Empezar fácil y jugar con mando** (2,5 · 4) — **hecho** (inicio por modos, agua en multijugador y mando el 3-nov; modo «Karts» en el inicio el 11-nov)
   - **Pantalla de inicio por modos**: botones grandes «Jugar al golf» (directo al tee), «Partida real» (tarjeta en directo o repetir una vuelta real), «Explorar la isla» (salto en avioneta), «Karts», «Con amigos» y «Retos», cada uno con una línea que explique qué es.
   - **Agua en multijugador**: el estado que se envía (`o` en `g3e.js`) lleva el caballo (`hz`) y el buggy (`d`), pero no la embarcación, así que un amigo en moto, lancha, tabla o esquí se ve sin ella. Enviar tipo e índice (`JET.list`) y el esquí, dibujarla con su espuma y ocultar nuestra copia mientras la usa, como con los buggies. Revisar también los coches de `g3h.js`.
   - **Mando**: ver abajo.
2. **J2 · Karts al estilo de las carreras de karts de consola** (6 · 9) — **hecho el 12-nov** (J2a: conducción, 3 vueltas, podio y circuitos con rampas y atajos; J2b: garaje, inverso, agua, objetos, modos, 8 karts y opciones). Todo propio y con tema de golf: no copiar personajes, objetos ni nombres de Nintendo.
   - **Karts**: karts nuevos, buggies y coches, conducidos por los avatares de la familia; garaje para elegir color y pegatinas.
   - **Circuitos**: 4 circuitos (caminos del campo, playa y laguna, calles de las villas y uno en Madrid), en sentido normal e inverso, con rampas, atajos y zonas de agua.
   - **Conducción**: derrape con mini-turbo por niveles de chispas, salto con acrobacia que da impulso, monedas que suben la velocidad, salida con semáforo, 3 vueltas, posiciones y podio con confeti.
   - **Objetos** en cajas regalo:
     - turbo;
     - bola de golf que sale recta;
     - bola dorada que persigue al de delante;
     - bolsa de arena de búnker que se suelta detrás;
     - paraguas de golf que protege;
     - nube de lluvia que frena a los de delante;
     - modo dorado invencible unos segundos.
   - **Modos**: Gran Premio (4 circuitos y puntos), contrarreloj contra tu fantasma, batalla de globos en un recinto, en sala con amigos y bots hasta 8.
   - **Opciones de sala**: choques sí o no, objetos sí o no, velocidad de los bots (fácil, normal o rápido), ayuda de dirección y de acelerador para los pequeños, y ayuda para los rezagados.
3. **J3 · Bicis** (3 · 5) — **hecho el 12-nov**
   - **Dónde**: aparcabicis en el hotel, la playa, la marina y la casa club, y en Madrid en la Casa de Campo.
   - **Tipos**: BMX, de montaña y bici de niño con ruedines.
   - **Manejo**: pedaleo, inclinación en curvas, derrape con freno trasero, saltos en lomas y rampas, y trucos en el aire con puntos.
   - **Sitios**: «bike park» junto a la playa (pump track, saltos y medio tubo), sendas de bajada por el monte con tiempo, y carreras con amigos.
4. **J4 · Pack para niños** (5 · 8)
   - **Mascota**: un perro que te sigue y te trae la bola.
   - **Minigolf loco** junto al hotel, con molino, rampas, looping y agua, usando la física del golf.
   - **Búsqueda del tesoro**: mapa con pistas, cofres y cromos de los sitios y animales de la isla, y medallas de explorador.
   - **Animales**: dar zanahorias y cepillar a los caballos, y patos en la laguna.
   - **Diversión al aire libre**: tirolina de la loma al agua, tobogán y trampolín en la piscina, fuegos artificiales y globos al anochecer.
   - **Para los más pequeños**: un modo fácil con ayudas automáticas.
5. **J5 · Juntos y con música** (3 · 5) — **hecho el 4-nov-2026** (falta solo subir al kart de otro)
   - **Pasajeros**: subir a la grupa del caballo o al barco, buggy, coche o kart de otro, y esquiar detrás de la lancha de un amigo.
   - **Música**: emisoras generadas en el navegador, sin derechos de autor (paseo, guitarra española, arcade para karts y noche), con botón en el menú y volumen. Nada de canciones comerciales.
6. **J6 · Hotel y bar** (3 · 5) — **hecho el 4-nov-2026**: el hotel real es el Vincci Valdecañas Golf, de 4 estrellas, con el restaurante Ribereño. Recrear recepción, bar, restaurante y terraza a partir de fotos reales (galerías de hoteles en la web; `image_search`). En la barra pides gin-tonic, refresco, zumo o batido, el camarero lo sirve y te sientas en la terraza al atardecer.
7. **J7 · Motivos para volver** (5 · 8) — **hecho el 4-nov-2026** (los karts de la tienda se hicieron con J2b y las bicis con J3): monedas por retos, carreras y birdies para desbloquear ropa, palos, karts y bicis, con una vitrina de trofeos; circuitos con boyas para moto y lancha, slalom de esquí y carreras de caballos contra tu récord; torneo familiar de varios días con trofeo en el hotel.

### Línea N · Novedades pedidas por Joaquín el 14-nov-2026 (solo Valdecañas salvo T1; orden: T1, V1, H1)

1. **T1 · Mejoras técnicas** (1,5 · 2,5), en los dos mundos
   - **Desatasco**: a veces el coche, el buggy, el kart o el caballo se quedan encajados contra un árbol o la esquina de una casa y no se puede salir. Detectar el atasco (acelerando y sin avanzar 1,5 s) y sacar solo el vehículo al punto libre más cercano mirando hacia fuera; marcha atrás que siempre funcione; y un botón «Desatascar» en el menú (y en el mando) que te recoloca. Revisar `updateDrive`, `updateRide`, `collide`, `bldAt` y los árboles (`treeGrid`); las bicis (`bkBlocked`) también.
   - **Menú con mando de PlayStation, sin ratón**: hoy el mando mueve al personaje, pero en el inicio, el menú, las hojas (karts, bicis, circuitos, hotel) y los avisos no se sabe con qué botones moverse. Foco visible que se mueve con la cruceta o el stick izquierdo, ✕ acepta, ○ vuelve o cierra, L1 y R1 cambian de pestaña, Options abre el menú; el stick derecho desplaza el texto. Una barra de ayuda abajo con los símbolos del mando conectado (PlayStation: ✕ ○ □ △; Xbox: A B X Y), que solo sale con mando. Guía «Jugar con mando» ampliada. Probar con el mando falso de `steps/modos_y_mando.txt`.
2. **V1 · Volar: coches voladores y helicópteros** (3 · 5)
   - **Qué y dónde**: 4 coches voladores y 2 helicópteros en 3 zonas con helipuerto pintado: junto al hotel (1 coche y 1 helicóptero), junto al embarcadero (1 coche y 1 helicóptero) y junto a las pistas de pádel de la zona deportiva (2 coches).
   - **Vuelo**: despegue y aterrizaje vertical, subir y bajar, avanzar, girar e inclinarse; techo de vuelo y límite del mapa; aterrizar en cualquier sitio llano (también azoteas y el pantalán); sombra en el suelo y altímetro. Fácil para niños: si sueltas los mandos se queda quieto en el aire. Rotor y sonido en el helicóptero; el coche volador, de diseño propio.
   - **Con la sala**: los amigos ven la aeronave y pueden subirse de pasajeros (el coche, 3 plazas más el piloto; el helicóptero, 5), como en `g3v.js`; nuestra copia se oculta mientras otro la pilota.
   - **Extras**: vista de cabina, modo foto desde el aire, aros en el cielo contra el reloj, mapa, leyenda, guía y glosario, y mando.
3. **H1 · Modo Halloween** (3 · 5)
   - **Cuándo**: se activa solo al anochecer del 31 de octubre (y esa semana), y con un botón «Halloween» del menú cualquier día. Pone la hora en anochecer, niebla baja, luna, calabazas con luz en las puertas de las villas y música propia de miedo suave (apta para niños de 6 años).
   - **Por las casas**: al acercarte van apareciendo fantasmas, brujas en escoba, murciélagos, esqueletos y gatos negros; asustan un poco y se van.
   - **Truco o trato**: acción «Llamar a la puerta» en las villas: sale un vecino disfrazado con «¿Truco o trato?»; trato da caramelos (se cuentan, con cesta) y truco es una broma (un susto, lluvia de arañas de juguete, te convierte un rato en calabaza). Cada casa, una vez por noche; meta de visitar todas, con trofeo.
   - **Disfraces** (tienda y pestaña propia): Drácula, bruja, momia, esqueleto, fantasma de sábana, calabaza y pirata; se ven también en la sala. Diseños propios, sin personajes de películas.
   - **Con la sala**: los amigos se ven disfrazados y compiten por caramelos.

### Línea G · Golf real con amigos (tarjeta en directo y juego)

1. **G1 · Juegos entre amigos en la tarjeta** (2,5 · 4)
   - **Modalidades**: skins, nassau (ida, vuelta y total), mejor bola por parejas (fourball), foursome, scramble y Ryder por equipos con sus puntos.
   - **Extras**: «más cerca de bandera» en los pares 3 y «drive más largo», medidos con el GPS, y birdies y sandies.
   - **Ajuste final**: quién debe a quién, en puntos, cañas o euros.
   - **Para compartir**: imagen resumen de la vuelta para WhatsApp.
2. **G2 · Mis distancias y caddie en la vuelta real** (2 · 3)
   - **Distancias**: la distancia media de cada palo, sacada de tus golpes con GPS.
   - **Caddie**: en la tarjeta, la distancia que «juega» el golpe (desnivel y viento) y el palo recomendado.
   - **Antes de jugar**: el plan del hoyo con el vuelo de «Ver hoyos».
3. **G3 · Liga del grupo y hándicap** (3 · 5)
   - **Liga**: clasificación de la temporada y Ryder anual.
   - **Hándicap**: evolución con el método WHS (orientativo, no oficial).
   - **Quedadas**: fecha, quién viene y partidas de 4 equilibradas por hándicap.
   - Necesita guardar datos en la nube, por ejemplo una base pequeña en Vercel. Joaquín tendría que crear la cuenta y pasar la clave.
4. **G4 · Más campos** (2 · 3 por campo): los campos donde juega el grupo, con el mismo proceso de datos (IGN y OpenStreetMap) que Madrid.

### Mando (J1)

- Usa la Gamepad API y consulta `navigator.getGamepads()` en cada fotograma, con el mapeo estándar y una zona muerta de 0,15.
- Botones:

  | Mando | Acción |
  | --- | --- |
  | Stick izquierdo | `inp.mx`/`inp.my`: andar, conducir, barcos, caballo |
  | Stick derecho | cámara (`camS.yaw`/`pitch`; en el dron, `orbit`) |
  | A | saltar (`inp.jumpQ`) y confirmar en menús |
  | X | acción (`doAction`) |
  | B | atrás y cerrar ventanas |
  | Y | mapa |
  | Gatillo derecho | swing: mantener y soltar (pádel: golpear) |
  | Gatillo izquierdo | esprint |
  | LB y RB o cruceta | palo y tipo de golpe |
  | Start | menú |

- Al conectar un mando, aviso «Mando conectado».
- Guía: una sección «Jugar con mando» con la leyenda de botones.
- Sirve cualquier mando que reconozca el sistema: Luna (iOS 16 o posterior), Xbox o PlayStation.
- En las pruebas, simula el mando sustituyendo `navigator.getGamepads`.

## Ahorrar uso (Claude Pro)

- Usa una conversación por bloque de trabajo. Cada paso relee toda la conversación, así que una conversación larga cuesta varias veces más por paso.
- Los módulos tienen líneas muy largas: busca con `grep` y lee rangos, no ficheros enteros.
- Deja los renders y las pruebas pesadas para el final de cada bloque.
