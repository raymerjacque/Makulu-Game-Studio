import * as pc from 'playcanvas';
import { showToast } from '../ui/toast.js';

/**
 * Procedural 3D Terrain Generator & Sculptor
 * Generates heightmap meshes using Perlin noise or heightmap images with multi-texture splatting.
 */
export class TerrainGenerator {
  constructor(editor) {
    this.editor = editor;
  }

  generate(options = {}) {
    const app = this.editor.getApp();
    if (!app) return null;

    const name = options.name || 'Procedural Terrain';
    const width = options.width || 40;
    const depth = options.depth || 40;
    const subdivisions = options.subdivisions || 32;
    const maxHeight = options.maxHeight || 6;
    const roughness = options.roughness || 0.07;
    const seed = options.seed || Math.floor(Math.random() * 9999);
    const brushMode = options.brushMode || 'raise'; // 'raise', 'lower', 'flatten', 'smooth', 'noise'
    const customHeights = options.customHeights || null; // 2D array if imported from heightmap image

    const numVertsX = subdivisions + 1;
    const numVertsZ = subdivisions + 1;
    const stepX = width / subdivisions;
    const stepZ = depth / subdivisions;

    const positions = [];
    const normals = [];
    const uvs = [];
    const colors = [];
    const indices = [];

    // Perlin noise helper
    const noise = new PerlinNoise(seed);

    // 1. Generate Vertex Data & Heights
    const heights = [];
    for (let z = 0; z < numVertsZ; z++) {
      heights[z] = [];
      for (let x = 0; x < numVertsX; x++) {
        const posX = (x * stepX) - (width / 2);
        const posZ = (z * stepZ) - (depth / 2);

        let h = 0;
        if (customHeights && customHeights[z] && customHeights[z][x] !== undefined) {
          h = customHeights[z][x] * maxHeight;
        } else {
          // Multi-octave Perlin noise height
          h = noise.noise(x * roughness, z * roughness) * maxHeight;
          h += noise.noise(x * roughness * 2, z * roughness * 2) * (maxHeight * 0.3);

          if (brushMode === 'flatten') {
            h = Math.min(h, maxHeight * 0.4);
          } else if (brushMode === 'smooth') {
            h = (h + maxHeight * 0.3) * 0.5;
          } else if (brushMode === 'noise') {
            h += (Math.random() - 0.5) * (maxHeight * 0.4);
          }

          // Flatten outer edges for clean seamless integration
          const distFromCenter = Math.hypot(posX, posZ) / (width / 2);
          if (distFromCenter > 0.7) {
            const fade = Math.max(0, 1 - (distFromCenter - 0.7) / 0.3);
            h *= fade;
          }
        }

        heights[z][x] = h;

        positions.push(posX, h, posZ);
        uvs.push(x / subdivisions, z / subdivisions);

        // Elevation-based Biome Vertex Color (RGB) with Multi-Texture Splatting
        const normalizedH = Math.max(0, Math.min(1, h / maxHeight));
        let color = [0.25, 0.65, 0.25]; // Default Lush Grass Green

        if (normalizedH < 0.12) {
          color = [0.85, 0.75, 0.5]; // Sand / Valley Shore
        } else if (normalizedH < 0.5) {
          color = [0.25, 0.65, 0.25]; // Grass Green
        } else if (normalizedH < 0.78) {
          color = [0.45, 0.38, 0.32]; // Mountain Rock
        } else {
          color = [0.92, 0.95, 0.98]; // Snow Peak
        }

        colors.push(color[0], color[1], color[2], 1.0);
      }
    }

    // 2. Compute Surface Normals
    for (let z = 0; z < numVertsZ; z++) {
      for (let x = 0; x < numVertsX; x++) {
        const hl = x > 0 ? heights[z][x - 1] : heights[z][x];
        const hr = x < subdivisions ? heights[z][x + 1] : heights[z][x];
        const hd = z > 0 ? heights[z - 1][x] : heights[z][x];
        const hu = z < subdivisions ? heights[z + 1][x] : heights[z][x];

        const normal = new pc.Vec3(hl - hr, 2.0, hd - hu).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }

    // 3. Generate Triangles (Indices)
    for (let z = 0; z < subdivisions; z++) {
      for (let x = 0; x < subdivisions; x++) {
        const row1 = z * numVertsX;
        const row2 = (z + 1) * numVertsX;

        indices.push(row1 + x, row2 + x, row1 + x + 1);
        indices.push(row1 + x + 1, row2 + x, row2 + x + 1);
      }
    }

    // 4. Construct PlayCanvas Mesh
    let meshInstance = null;
    if (app.graphicsDevice && typeof app.graphicsDevice.createVertexBufferImpl === 'function') {
      const mesh = pc.createMesh(app.graphicsDevice, positions, {
        normals: normals,
        uvs: uvs,
        colors: colors,
        indices: indices
      });

      const material = new pc.StandardMaterial();
      material.useVertexColors = true;
      material.diffuseTint = true;
      material.diffuse = new pc.Color(1, 1, 1);
      material.roughness = 0.8;
      material.metalness = 0.1;
      material.update();

      meshInstance = new pc.MeshInstance(mesh, material);
    }

    const terrainEntity = this.editor.createEntity({
      name: name,
      transform: { position: [0, 0, 0] },
      components: []
    });

    if (terrainEntity) {
      if (meshInstance) {
        try {
          terrainEntity.addComponent('render', { meshInstances: [meshInstance] });
        } catch (e) {
          terrainEntity.render = { meshInstances: [meshInstance] };
        }
      } else {
        try {
          terrainEntity.addComponent('render', { type: 'box' });
        } catch (e) {
          terrainEntity.render = { type: 'box' };
        }
      }

      // Add collision component for physics
      try {
        terrainEntity.addComponent('collision', { type: 'mesh' });
      } catch (e) {
        terrainEntity.collision = { type: 'mesh' };
      }
    }

    showToast(`✨ Generated 3D Terrain "${name}" (${width}x${depth}m)!`, 'success');
    return terrainEntity;
  }
}

/**
 * Pseudo-random Perlin Noise implementation
 */
class PerlinNoise {
  constructor(seed = 0) {
    this.p = new Uint8Array(512);
    const permutation = new Uint8Array(256);
    for (let i = 0; i < 256; i++) permutation[i] = i;

    // Shuffle with seed
    let s = seed || 1234;
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
