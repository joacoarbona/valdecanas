# Juego de golf 3D: notas para Claude

Juego familiar de Joaquín con dos mundos y un solo motor:

- **Isla de Valdecañas**: joaco.org/valdecanas.
- **Golf en Madrid**: joaco.org/golf-madrid, con Puerta de Hierro Arriba y Abajo y Club de Campo Negro y Amarillo.

Cada mundo tiene su **tarjeta en directo** para rondas reales, en joaco.org/<ruta>/tarjeta/.

También están publicados como artefactos de claude.ai:

| Qué | Enlace |
| --- | --- |
| Isla de Valdecañas | https://claude.ai/artifact/AeJ4a1YaoW9iw2fML7UtvE |
| Golf en Madrid | https://claude.ai/artifact/QdjjEqhB4N3cMDV8CHbfgq |
| Plan iPhone y WebGPU (doc) | https://claude.ai/artifact/Ky5z2kjbmgk88FccGw99Hd |

## Cómo trabaja Joaquín

- Escribe en español y con mensajes cortos. Espera entregas completas, probadas y publicadas, sin preguntas que puedas resolver tú.
- Las interfaces van en tema claro.
- En herramientas complejas quiere introducción, guía de uso, glosario y leyendas explícitas en mapas y gráficos. Cada función nueva lleva su línea en la guía del juego.
- Planifica al P80 y gestiona al P50.
- Tiene Claude Pro: cuida el uso (ver «Ahorrar uso»).

## Estructura

- `src/` es la fuente de verdad.
  - **Motor**: módulos `g3*.js` concatenados en un solo IIFE, en el orden de `ENGINE` en `src/build_pages.py`: a, f, b, d, e, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, c. Un módulo nuevo va antes de `g3c.js`, que arranca el juego y define `window.__vg` (la API de pruebas).

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
    | n | partida contra los amigos con hándicap |
    | o | golfistas, buggies, moto de agua y pesca |
    | p | pádel en sala |
    | q | ciudad de Madrid |
    | r | vuelta real de la tarjeta en 3D |
    | s | lanchas, esquí acuático, windsurf, kitesurf y caballos en el mapa |
    | t | pantalla en el móvil: sin zoom y «Ajustar pantalla» |
    | u | pantalla de inicio por modos, hoja «Jugar al golf» y mando (Gamepad API, se consulta en cada `step`) |
    | c | guía, menú, entrada y arranque |

  - **Mundos y páginas**: `template3.html` es el HTML y el CSS. `world_common.js`, `world_valdecanas.js` y `world_madrid.js` llevan los datos y textos de cada mundo; cada uno activa sus partes con claves como `nautica`, `horses`, `pier` o `ruins`. `card/` es la tarjeta en directo.
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
- **`mp2.py`**: dos jugadores en una sala (`steps/mp_agua.txt` y `mp_agua2.txt`: amigos en el agua). Chromium no llega aquí a sockets locales, así que el broker MQTT va dentro de la prueba y se enruta con `route_web_socket`.
- **`card/ct.py`**: dos móviles en la tarjeta en directo, con GPS simulado.
- **`zoomt.py`**: comprobaciones de pantalla en móvil.
- **Mando**: `steps/modos_y_mando.txt` sustituye `navigator.getGamepads` por un mando falso y prueba menú, golf y paseo.

Los errores `ERR_TUNNEL_CONNECTION_FAILED` vienen de las fuentes de Google bloqueadas en la nube: no importan. Cualquier `PAGEERROR` es un fallo. Prueba los dos mundos antes de publicar.

## Publicar (siempre las tres cosas)

1. **Repo del juego** (`joacoarbona/valdecanas`): commit en `main` y push.
2. **joaco.org** (`joacoarbona/master`):
   - Copia `build/joaco_valdecanas/index.html` en `joaco-org/public/valdecanas/index.html`, y `build/joaco_madrid/index.html` en `joaco-org/public/golf-madrid/index.html`. Copia también `tarjeta/index.html` y `data/` si cambiaron.
   - Crea una rama y el PR con la API REST (GraphQL no funciona desde aquí): `gh api repos/joacoarbona/master/pulls -f title=… -f head=<rama> -f base=main -F body=@pr.md`.
   - Fusiónalo: `gh api -X PUT repos/joacoarbona/master/pulls/<n>/merge -f merge_method=squash`.
   - Espera a que Vercel diga `success`: `gh api repos/joacoarbona/master/commits/<sha>/status`.
3. **Artefactos de claude.ai**: en una conversación nueva, primero `Artifact read` de la URL. Después `Artifact publish` con `file_path=build/publish_<mundo>/index.html` y `url=<la del artefacto>`. Los datos ya están subidos; mándalos con `files` solo si cambian.

## Estado a 3 de noviembre de 2026

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

## Siguientes tareas, por bloques (propuesta del 3-nov-2026; una conversación por bloque)

Sesión = una tarea del tamaño del arreglo del zoom del 1-nov (unos 20 minutos de trabajo y 45 pasos). Cifras P50 · P80.

1. **Bloque 1 · Empezar fácil y jugar con mando** (2,5 · 4 sesiones) — **hecho el 3-nov-2026**
   - **Pantalla de inicio por modos**: botones grandes «Jugar al golf» (directo al tee: recorrido, barras, formato y rivales), «Partida real» (abre la tarjeta en directo o repite una vuelta real), «Explorar la isla» (salto en avioneta), «Con amigos» (crear o unirse a una sala) y «Retos». Cada uno con una línea que explique qué es.
   - **Arreglo del agua en multijugador**: el estado que se envía (`o` en `g3e.js`) lleva el caballo (`hz`) y el buggy (`d`), pero no la embarcación, así que un amigo en moto, lancha, tabla o esquí se ve sin ella. Enviar el tipo y el índice de la embarcación (`JET.list`) y el esquí, dibujarla con su espuma y ocultar nuestra copia mientras la usa, como con los buggies. Revisar también los coches de `g3h.js`.
   - **Mando**: ver abajo.
2. **Bloque 2 · Juntos y con música** (3 · 5)
   - **Pasajeros**: subir a la grupa del caballo, al barco, al buggy o al coche de un amigo; el conductor manda y el pasajero mira. Esquí acuático detrás de la lancha de un amigo.
   - **Música**: emisoras generadas en el navegador, sin derechos de autor (paseo tranquilo, guitarra española, arcade para karts, noche), con botón en el menú y volumen. No usar canciones comerciales.
3. **Bloque 3 · Modo karts, opcional por sala** (3 · 5): choques entre coches y buggies sí o no; circuito por los caminos del campo con vueltas, semáforo de salida, turbos y objetos (bolas de golf que hacen derrapar, charcos), clasificación y récord.
4. **Bloque 4 · Hotel y bar** (3 · 5): el hotel real es el Vincci Valdecañas Golf, de 4 estrellas, con el restaurante Ribereño. Recrear recepción, bar, restaurante y terraza a partir de fotos reales (galerías de hoteles en la web; `image_search`). En la barra pides gin-tonic, refresco, zumo o batido, el camarero lo sirve y te sientas en la terraza al atardecer.
5. **Bloque 5 · Motivos para volver** (5 · 8): progreso y premios (monedas por retos, bolas doradas, birdies y carreras para desbloquear ropa, palos y colores, con una vitrina de trofeos); circuitos con boyas para moto y lancha, slalom de esquí y carreras de caballos contra tu récord; torneo familiar de varios días con trofeo en el hotel.
6. **Plan iPhone y WebGPU** (doc enlazado arriba): fase 1 instalable desde Safari, fase 2 TestFlight y fase 3 WebGPU. La fase 1 es barata y se puede meter después del bloque 1.

### Mando (bloque 1)

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
