# Prototipo del motor nuevo (WebGPU)

Comparación de la isla con el motor actual (three.js r128) y con three.js r187: misma playa y laguna, misma hora y misma cámara. Las imágenes están en `out/comparacion_*.jpg`.

## Qué incluye

- **Escena**: los datos del juego (relieve, ortofotos, árboles, edificios, ruinas y sol), exportados desde el motor actual con `export_*.py`.
- **Cielo**: cielo físico con nubes, luz del cielo (IBL) y bruma.
- **Sol y sombras**: sombras del sol en un mapa de 4096².
- **Agua**: reflejos reales, olas, color de poca profundidad y espuma en la orilla.
- **Árboles**: copas por capas.
- **Imagen**: oclusión ambiental (GTAO), resplandor y tono ACES.

## Cómo se genera

```sh
python3 src/build_pages.py && (cd tools/test && npm install)       # páginas del juego y three r128
cd prototype/webgpu && npm install                                  # three r187
python3 export_before.py 96   # 'antes': fotos fijas A/B y 96 fotogramas del vídeo, y las poses de cámara
python3 export_data.py        # relieve de toda la isla a 4 m, todos los árboles y edificios
python3 export_ruins.py       # ruinas de la playa y la foto 'antes' C
PR=2 EXTRA="$(cat final_params.txt)" python3 proto/run_proto.py still A B C
PR=1 EXTRA="$(cat final_params.txt)" python3 proto/run_proto.py video 96
python3 compose.py stills video
```

## Lecciones aprendidas

- **Sin tarjeta gráfica** (Chromium sin interfaz):
  - WebGPU solo aparece con `--enable-unsafe-webgpu --use-webgpu-adapter=swiftshader` y en un origen seguro (`http://localhost`).
  - Aun así, las capturas del lienzo WebGPU salen negras y `queue.onSubmittedWorkDone()` falla.
  - Para renderizar aquí se usa `forceWebGL` (`&webgl=1`). Da la misma imagen, porque los materiales de nodos (TSL) compilan a los dos.
- **Sombras**: después de cambiar el frustum hay que llamar a `sun.shadow.camera.updateProjectionMatrix()`. Si no, solo hay sombra en ±5 m.
- **El terreno no debe proyectar sombra** con el sol bajo: se sombrea a sí mismo («acné») y tapa las sombras de los árboles.
- **Brillo**: con la foto aérea como color, la luz del cielo domina si el sol es débil. El sol va en torno a 5 con el entorno a 0,26 y exposición 0,74 en ACES.
- **Nombres nuevos en r187**:
  - `RenderPipeline` sustituye a `PostProcessing`.
  - `packNormalToRGB` y `unpackRGBToNormal` sustituyen a `directionToColor` y `colorToDirection`.
  - `PCFSoftShadowMap` ya no existe.
  - GTAO necesita la textura de normales sin empaquetar: `mrt({ output, normal: normalView })`.
- **Coste**: unos 15–30 s por fotograma en CPU a 960×540–1280×720.

## Pendiente

- Falta la hierba y el detalle de cerca.
- Hay que ajustar colores: la arena, las villas y los montes lejanos salen demasiado claros.
- Falta el viento en los árboles y la integración en el juego, que es la fase 3 del plan.
