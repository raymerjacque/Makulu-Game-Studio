/** Final height samples are saved, so restoration never depends on random regeneration. */
export function validateTerrainData(data) {
  const valid = value => Number.isFinite(value);
  if (!data || data.version !== 1 || !valid(data.width) || data.width <= 0 || data.width > 1e6 || !valid(data.depth) || data.depth <= 0 || data.depth > 1e6 || !Number.isInteger(data.subdivisions) || data.subdivisions < 1 || data.subdivisions > 256 || !valid(data.maxHeight) || data.maxHeight < 0 || data.maxHeight > 1e5) throw new Error('Invalid terrain dimensions or format.');
  const side = data.subdivisions + 1;
  if (!Array.isArray(data.heights) || data.heights.length !== side || !Array.from(data.heights).every(row => Array.isArray(row) && row.length === side && Array.from(row).every(h => valid(h) && Math.abs(h) <= 1e6))) throw new Error('Invalid terrain height samples.');
  return data;
}

export function generateTerrainData(options = {}) {
  const data = { version: 1, width: options.width ?? 40, depth: options.depth ?? 40,
    subdivisions: options.subdivisions ?? 32, maxHeight: options.maxHeight ?? 6,
    roughness: options.roughness ?? 0.07, seed: options.seed ?? Math.floor(Math.random() * 2147483647),
    brushMode: options.brushMode || 'raise', heights: [] };
  // Validate bounds before allocating a potentially large height grid.
  validateTerrainData({ ...data, subdivisions: 1, heights: [[0, 0], [0, 0]] });
  if (!Number.isInteger(data.subdivisions) || data.subdivisions < 1 || data.subdivisions > 256 || !Number.isFinite(data.roughness) || data.roughness < 0 || !Number.isInteger(data.seed) || data.seed < 0 || data.seed > 2147483646 || !['raise', 'lower', 'flatten', 'smooth', 'noise'].includes(data.brushMode)) throw new Error('Invalid terrain generator parameters.');
  const side = data.subdivisions + 1;
  if (options.customHeights && (!Array.isArray(options.customHeights) || options.customHeights.length !== side || !Array.from(options.customHeights).every(row => Array.isArray(row) && row.length === side && Array.from(row).every(h => Number.isFinite(h) && h >= 0 && h <= 1)))) throw new Error('Heightmap must contain a normalized sample for every terrain vertex.');
  const noise = new PerlinNoise(data.seed);
  let state = data.seed + 1;
  const random = () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; };
  for (let z = 0; z < side; z++) {
    const row = [];
    for (let x = 0; x < side; x++) {
      let h;
      if (options.customHeights) h = options.customHeights[z][x] * data.maxHeight;
      else {
        h = noise.noise(x * data.roughness, z * data.roughness) * data.maxHeight;
        h += noise.noise(x * data.roughness * 2, z * data.roughness * 2) * data.maxHeight * 0.3;
        if (data.brushMode === 'flatten') h = Math.min(h, data.maxHeight * 0.4);
        if (data.brushMode === 'smooth') h = (h + data.maxHeight * 0.3) * 0.5;
        if (data.brushMode === 'noise') h += (random() - 0.5) * data.maxHeight * 0.4;
        if (data.brushMode === 'lower') h = -Math.abs(h);
        const distance = Math.hypot(x * data.width / data.subdivisions - data.width / 2, z * data.depth / data.subdivisions - data.depth / 2) / (data.width / 2);
        if (distance > 0.7) h *= Math.max(0, 1 - (distance - 0.7) / 0.3);
      }
      row.push(h);
    }
    data.heights.push(row);
  }
  return validateTerrainData(data);
}

export function terrainGeometry(data) {
  validateTerrainData(data);
  const { width, depth, subdivisions: n, heights, maxHeight } = data;
  const positions = [], normals = [], uvs = [], colors = [], indices = [];
  for (let z = 0; z <= n; z++) for (let x = 0; x <= n; x++) {
    const h = heights[z][x];
    positions.push(x * width / n - width / 2, h, z * depth / n - depth / 2);
    uvs.push(x / n, z / n);
    const left = Math.max(0, x - 1), right = Math.min(n, x + 1), down = Math.max(0, z - 1), up = Math.min(n, z + 1);
    const dx = (heights[z][right] - heights[z][left]) / ((right - left) * width / n);
    const dz = (heights[up][x] - heights[down][x]) / ((up - down) * depth / n);
    const length = Math.hypot(dx, 1, dz); normals.push(-dx / length, 1 / length, -dz / length);
    const elevation = maxHeight ? Math.max(0, Math.min(1, h / maxHeight)) : 0;
    const color = elevation < 0.12 ? [0.85, 0.75, 0.5] : elevation < 0.5 ? [0.25, 0.65, 0.25] : elevation < 0.78 ? [0.45, 0.38, 0.32] : [0.92, 0.95, 0.98];
    colors.push(...color, 1);
    if (x < n && z < n) { const a = z * (n + 1) + x, b = a + n + 1; indices.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  return { positions, normals, uvs, colors, indices };
}

/** Shared by editor and generated games; no fallback box may substitute for saved terrain. */
export function applyTerrainMesh(pc, app, entity, data) {
  const geometry = terrainGeometry(data);
  const mesh = pc.createMesh(app.graphicsDevice, geometry.positions, geometry);
  const material = new pc.StandardMaterial();
  material.diffuse = new pc.Color(1, 1, 1); material.diffuseMapVertexColor = true;
  material.useMetalness = true; material.metalness = 0.1; material.gloss = 0.2; material.update();
  const instance = new pc.MeshInstance(mesh, material, entity);
  entity.addComponent('render', { meshInstances: [instance] });
  entity.render.material = material;
  const collisionModel = new pc.Model(); collisionModel.graph = new pc.GraphNode();
  collisionModel.meshInstances = [new pc.MeshInstance(mesh, material, collisionModel.graph)];
  entity._terrainCollisionModel = collisionModel;
  entity._terrainData = JSON.parse(JSON.stringify(data));
  entity.once('destroy', () => { collisionModel.destroy(); material.destroy(); });
  return entity;
}

export const TERRAIN_RUNTIME_CODE = [validateTerrainData, terrainGeometry, applyTerrainMesh].map(fn => fn.toString()).join('\n');

class PerlinNoise {
  constructor(seed = 0) {
    this.p = new Uint8Array(512);
    const permutation = new Uint8Array(256);
    for (let i = 0; i < 256; i++) permutation[i] = i;

    // Shuffle with seed
    let s = seed + 1;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const temp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = temp;
    }

    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }
}
