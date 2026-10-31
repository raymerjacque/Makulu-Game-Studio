/** Decode an uploaded image into the exact normalized grid the terrain generator accepts. */
export async function readHeightmap(file, subdivisions) {
  if (!Number.isInteger(subdivisions) || subdivisions < 1 || subdivisions > 256) throw new Error('Invalid heightmap resolution.');
  const image = await createImageBitmap(file);
  try {
    const side = subdivisions + 1, canvas = document.createElement('canvas');
    canvas.width = side; canvas.height = side;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Heightmap image decoding is unavailable.');
    context.drawImage(image, 0, 0, side, side);
    const pixels = context.getImageData(0, 0, side, side).data, heights = [];
    for (let z = 0; z < side; z++) {
      const row = [];
      for (let x = 0; x < side; x++) {
        const i = (z * side + x) * 4;
        row.push(((pixels[i] + pixels[i + 1] + pixels[i + 2]) / (3 * 255)) * (pixels[i + 3] / 255));
      }
      heights.push(row);
    }
    return heights;
  } finally { image.close(); }
}
