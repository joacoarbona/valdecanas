# Isla de Valdecañas · juego

Juego 3D familiar ambientado en la Isla de Valdecañas (embalse de Valdecañas, Cáceres): caída desde una avioneta, exploración a pie, nadando o en buggy, y los 18 hoyos del campo de golf.

El juego es una sola página web con Three.js (`game/index.html`) que carga los datos reales de `game/data/`.

## Probarlo en local

```sh
cd game
python3 -m http.server 8000
# abre http://localhost:8000
```

(Abrir el `index.html` con doble clic no funciona: el navegador no deja leer los datos desde el disco.)

## Cómo se construye

1. **Descargar** — la tarea `Descargar datos geográficos` (GitHub Actions, `scripts/fetch_geodata.py`) baja a `data/` el relieve, la ortofoto, el Catastro y OpenStreetMap.
2. **Procesar** — `python3 scripts/build_assets.py` genera `game/data/`:
   - `h_core.bin` (relieve de la isla, 4 m), `h_wide.bin` (orillas, 10 m), `h_region.bin` (sierras, 200 m), en formato `VH16`.
   - `ortho_*.jpg`: la foto aérea recortada para el suelo y el mapa.
   - `surface_core.rle`: mapa de superficies a 1 m (agua, rough, calle, green, tee, búnker, caminos, playa, jardín, lagos).
   - `buildings.json`: plantas del Catastro con número de pisos (`python3 scripts/build_assets.py --only-buildings` rehace solo esto).
   - `trees.bin`: copas de árbol detectadas en la foto.
   - `course.json`: los 18 hoyos (tee, quiebros, green con su contorno), lagos y caminos de buggy, a partir de `scripts/course_def.json`.
3. **Juego** — `python3 scripts/build_game.py` monta `game/index.html` a partir de `src/` (plantilla, mundo y juego). Los binarios (`.bin`, `.rle`) se copian también como `.txt` en base64, que es lo que lee la página (el alojamiento de artefactos solo sirve tipos web).
4. **joaco.org** — `python3 scripts/build_joaco.py /ruta/a/master/joaco-org` escribe `public/valdecanas/` (página + datos con los binarios tal cual, sin base64). Se publica en joaco.org/valdecanas/ al subirlo al repositorio `master`.

Marco de coordenadas del juego: metros, x hacia el este, z hacia el sur, y hacia arriba; el origen es el centro de `data/meta.json` (UTM 30N) y y = 0 es la lámina del embalse (313,25 m).

## Jugar con amigos (multijugador)

- **Salas** con un código de 6 caracteres; el enlace `joaco.org/valdecanas/?sala=CODIGO` entra directo.
- **Sin servidor propio**: cada jugador publica en un tema de la sala en dos servidores MQTT públicos a la vez (EMQX y HiveMQ, por WebSocket seguro), por si uno falla. El cliente MQTT 3.1.1 está escrito a mano en `src/g3e.js` (QoS 0, keep-alive, last will, reconexión).
- **Cifrado**: la clave AES-GCM y el nombre del tema salen del código de la sala con PBKDF2 (100.000 iteraciones), así que los servidores solo ven datos cifrados y el tema no delata el código.
- **Qué se comparte**: posición y pose 10 veces por segundo (interpolada 170 ms en el pasado), modo (avioneta, caída, planeador, buggy, golf, villa), bola y estela de cada uno, tarjetas, chat, avioneta para todos, invitación a jugar el mismo hoyo, buggies aparcados.
- **Voz**: WebRTC entre navegadores con «perfect negotiation» señalizada por la sala; volumen por distancia (voz por cercanía) y panorámica. Sin TURN: en algunas redes la voz directa no conecta.
- **Pruebas**: con dos servidores MQTT locales (aedes) y tres navegadores Playwright: presencia, movimiento, chat, tarjeta, avioneta común, buggy, voz con micrófono falso, cifrado visto desde el servidor y salidas.

## Gráficos

- **Tres niveles** según el equipo (`src/g3f.js`): **Altos** — WebGL 2 con imagen HDR en coma flotante, antialiasing MSAA ×4, oclusión ambiental en pantalla (SSAO), resplandor (bloom) con cadena de mips, exposición automática y sombras de 4096²; **Medios** — HDR y resplandor sin SSAO; **sencillo** — sin WebGL 2, mapeo de tonos ACES directo. `?nofx=1` en la URL fuerza el modo sencillo.
- **Cielo** con gradiente, sol, nubes procedurales, luna y estrellas; **agua** con olas, espuma en la orilla, cáusticas y brillo nocturno en las piscinas.
- **Reflejos**: mapa de entorno del cielo (PMREM) para los materiales físicos (paredes, cristales, buggies, bolas doradas).
- **Hierba en 3D** generada en la GPU alrededor del jugador con la altura de cada superficie (rough, calle, green…), el color de la foto aérea, viento y pisadas; **copas** que se mecen, con bordes irregulares y luz que las atraviesa.

## Casas por dentro

Al entrar en una villa (`src/g3d.js`) se construye su interior a partir de la planta del Catastro:

- **Ventanas reales**: los paneles de fachada con cristalera o ventana se convierten en huecos con el grosor del muro, marco, cristal y cortinas. Mientras estás dentro, la carcasa exterior deja de proyectar sombra y son los muros interiores los que lo hacen, así que el sol entra por los huecos, dibuja su mancha en el suelo y forma haces de luz con polvo.
- **Estancias**: un tabique a lo largo del eje mayor separa el salón-cocina (con la puerta por la que entras, ~56 % de la superficie) de la zona privada: dormitorio principal, baño y una tercera estancia según el estilo, cada una con su paso de puerta.
- **Muebles** colocados sobre una rejilla de 25 cm que sabe la distancia a cada pared: cocina con isla, comedor con lámpara colgante, sofá con alfombra y mesa baja frente a la tele o la chimenea, sillones, rincón de lectura, escritorio, piano, camas con mesillas, armarios, librerías, baño completo y la pieza especial de cada uno de los 8 estilos (green de prácticas, billar y recreativa, tienda infantil, mesa baja zen…).
- **Luz**: lámparas cálidas, relleno de luz de día en las dos cristaleras más grandes, chimenea que parpadea, sombras de contacto y un mapa de reflejos capturado desde el propio salón (cubo HDR → PMREM) que da los reflejos y la luz rebotada.
- **Visita**: primera persona por defecto (tecla C o botón 1ª/3ª), **recorrido guiado** (botón ▶ Recorrido o tecla R) que anda por el suelo libre (búsqueda A* en la rejilla) de estancia en estancia, y **plano de la casa** con leyenda en el minimapa y el mapa grande.

## El campo

El orden de los hoyos está confirmado con el plano oficial del campo y la tarjeta (par, metros desde amarillas y hándicap). Tees y banderas están situados sobre la foto aérea; su posición exacta es aproximada.

## Datos y licencias

- Relieve (MDT 5 m y 200 m) y ortofoto PNOA del **IGN** — CC BY 4.0, © Instituto Geográfico Nacional.
- Edificios INSPIRE de la **Dirección General del Catastro**.
- Caminos, edificios y elementos del campo de **OpenStreetMap** — © colaboradores de OpenStreetMap, ODbL.
