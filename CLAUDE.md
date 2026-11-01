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
  - **Motor**: módulos `g3*.js` concatenados en un solo IIFE, en el orden de `ENGINE` en `src/build_pages.py`: a, f, b, d, e, g, h, i, j, k, l, m, n, o, p, q, r, s, t, c. Un módulo nuevo va antes de `g3c.js`, que arranca el juego y define `window.__vg` (la API de pruebas).

    | Módulo | Contenido |
    | --- | --- |
    | a | renderer, luz por hora del día, terreno, agua, edificios, árboles, ruinas, muelle |
    | f | posprocesado HDR, luz del cielo, hierba y follaje |
    | b | personaje, vehículos, colisiones, cámara, golf, HUD, mapa y minimapa |
    | d | interiores de las villas |
    | e | multijugador: salas por MQTT sobre WebSocket con AES-GCM, chat y voz WebRTC |
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
- **`mp2.py`**: dos jugadores en una sala. Chromium no llega aquí a sockets locales, así que el broker MQTT va dentro de la prueba y se enruta con `route_web_socket`.
- **`card/ct.py`**: dos móviles en la tarjeta en directo, con GPS simulado.
- **`zoomt.py`**: comprobaciones de pantalla en móvil.

Los errores `ERR_TUNNEL_CONNECTION_FAILED` vienen de las fuentes de Google bloqueadas en la nube: no importan. Cualquier `PAGEERROR` es un fallo. Prueba los dos mundos antes de publicar.

## Publicar (siempre las tres cosas)

1. **Repo del juego** (`joacoarbona/valdecanas`): commit en `main` y push.
2. **joaco.org** (`joacoarbona/master`):
   - Copia `build/joaco_valdecanas/index.html` en `joaco-org/public/valdecanas/index.html`, y `build/joaco_madrid/index.html` en `joaco-org/public/golf-madrid/index.html`. Copia también `tarjeta/index.html` y `data/` si cambiaron.
   - Crea una rama y el PR con la API REST (GraphQL no funciona desde aquí): `gh api repos/joacoarbona/master/pulls -f title=… -f head=<rama> -f base=main -F body=@pr.md`.
   - Fusiónalo: `gh api -X PUT repos/joacoarbona/master/pulls/<n>/merge -f merge_method=squash`.
   - Espera a que Vercel diga `success`: `gh api repos/joacoarbona/master/commits/<sha>/status`.
3. **Artefactos de claude.ai**: en una conversación nueva, primero `Artifact read` de la URL. Después `Artifact publish` con `file_path=build/publish_<mundo>/index.html` y `url=<la del artefacto>`. Los datos ya están subidos; mándalos con `files` solo si cambian.

## Estado a 1 de noviembre de 2026

- **Juego**: caída en avioneta, planeador, buggies, coches, 18 hoyos por recorrido, barras de salida, caddie, tiempo y viento, repetición, modo foto, retos, partida contra amigos con hándicap, golfistas y buggies por el campo, villas por dentro, pádel y tenis (en sala con amigos), caballos, fauna y avatares de amigos.
- **Multijugador**: salas con voz y chat.
- **Madrid**: la ciudad alrededor en 3D.
- **Agua (Valdecañas)**: moto de agua, pesca, lanchas, esquí acuático, windsurf y kitesurf.
- **Tarjeta en directo**: con GPS, historial y estadísticas, y repetición de la vuelta real en 3D.
- **Móvil**: «Ajustar pantalla».
- **Pendiente de Joaquín**: las fotos de la casa de Valdecañas para recrearla y el alta en Apple Developer, que hace falta para la fase 2.

## Siguientes tareas, en este orden

1. **Mando**, más o menos una sesión. Hoy el juego no lee mandos.
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
2. **Fase 1 del plan: instalable desde Safari**. Ficha de la app (manifest), iconos, service worker que guarda el juego y sus datos, aviso «Instálalo» y botón Exportar / Importar. En el iPhone la app instalada no ve lo guardado en Safari.
3. **Fase 2: app de iPhone con Capacitor y TestFlight**, compilada con GitHub Actions en macOS.
4. **Fase 3: WebGPU**, a partir de `prototype/webgpu/`.

## Ahorrar uso (Claude Pro)

- Usa una conversación por bloque de trabajo. Cada paso relee toda la conversación, así que una conversación larga cuesta varias veces más por paso.
- Los módulos tienen líneas muy largas: busca con `grep` y lee rangos, no ficheros enteros.
- Deja los renders y las pruebas pesadas para el final de cada bloque.
