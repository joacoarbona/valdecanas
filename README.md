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

Marco de coordenadas del juego: metros, x hacia el este, z hacia el sur, y hacia arriba; el origen es el centro de `data/meta.json` (UTM 30N) y y = 0 es la lámina del embalse (313,25 m).

## El campo

El orden de los hoyos está confirmado con el plano oficial del campo y la tarjeta (par, metros desde amarillas y hándicap). Tees y banderas están situados sobre la foto aérea; su posición exacta es aproximada.

## Datos y licencias

- Relieve (MDT 5 m y 200 m) y ortofoto PNOA del **IGN** — CC BY 4.0, © Instituto Geográfico Nacional.
- Edificios INSPIRE de la **Dirección General del Catastro**.
- Caminos, edificios y elementos del campo de **OpenStreetMap** — © colaboradores de OpenStreetMap, ODbL.
