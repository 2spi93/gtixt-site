# GTIXT Globe Earth Texture Pack

Embedded local Earth assets used by GTIXT Globe.

Current files:
- earth_diffuse.jpg: Earth day texture, 4096x2048
- earth_normal.png: Earth normal map, 4096x2048
- earth_specular.png: Earth ocean specular map, 4096x2048
- earth_bump.jpg: Earth bump/relief map, 4096x2048
- earth_clouds.png: Earth cloud layer, 4096x2048

Legacy compatibility files:
- earth_normal.jpg: older normal map, 2048x1024
- earth_specular.jpg: older ocean specular map, 2048x1024

4K source note:
- `earth_diffuse.jpg` comes from the Three.js Earth example asset pack.
- `earth_bump.jpg` is extracted from the red channel of the 4K combined Earth bump/roughness/clouds texture.
- `earth_clouds.png` is extracted from the blue channel of the same 4K combined texture.

Vector geopolitical layer:
- Country boundaries and coastlines are rendered from the bundled World Atlas dataset in the application code.
- World Atlas is derived from Natural Earth and is embedded at build time through npm dependencies.

Fallback behavior:
- If one of these image assets is missing, GTIXT Globe falls back to internally generated maps for that slot.
