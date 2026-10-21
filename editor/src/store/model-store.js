/**
 * Free 3D Model Store Catalog (CC0 & Royalty Free)
 * Provides instant 1-click downloadable 3D GLB assets for MakuluLinux Game Studio.
 */

export const MODEL_CATALOG = [
  // Characters & Creatures
  {
    id: 'fox',
    name: 'Animated Fox',
    category: 'characters',
    author: 'Khronos CC-BY',
    polyCount: 'Low Poly',
    icon: '🦊',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    scale: 0.02
  },
  {
    id: 'robot',
    name: 'Robot Kyle',
    category: 'characters',
    author: 'Unity / CC0',
    polyCount: 'Low Poly',
    icon: '🤖',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    scale: 1.0
  },

  // Nature & Environment
  {
    id: 'tree_pine',
    name: 'Low-Poly Pine Tree',
    category: 'nature',
    author: 'Kenney CC0',
    polyCount: 'Low Poly',
    icon: '🌲',
    primitiveBackup: { type: 'cone', scale: [1.2, 3, 1.2], color: [0.15, 0.45, 0.2] }
  },
  {
    id: 'rock_boulder',
    name: 'Granite Boulder',
    category: 'nature',
    author: 'Kenney CC0',
    polyCount: 'Low Poly',
    icon: '🪨',
    primitiveBackup: { type: 'sphere', scale: [1.5, 1.1, 1.4], color: [0.4, 0.4, 0.42] }
  },

  // Props & Dungeon
  {
    id: 'chest',
    name: 'Treasure Chest',
    category: 'props',
    author: 'Kenney CC0',
    polyCount: 'Low Poly',
    icon: '💎',
    primitiveBackup: { type: 'box', scale: [1.2, 0.8, 0.8], color: [0.55, 0.35, 0.15] }
  },
  {
    id: 'barrel',
    name: 'Wooden Barrel',
    category: 'props',
    author: 'Kenney CC0',
    polyCount: 'Low Poly',
    icon: '🛢️',
    primitiveBackup: { type: 'cylinder', scale: [0.8, 1.2, 0.8], color: [0.45, 0.3, 0.15] }
  },
  {
    id: 'torch_stand',
    name: 'Medieval Wall Torch',
    category: 'props',
    author: 'Kenney CC0',
    polyCount: 'Low Poly',
    icon: '🔥',
    primitiveBackup: { type: 'cylinder', scale: [0.2, 1.5, 0.2], color: [0.2, 0.2, 0.2] }
  },

  // Vehicles
  {
    id: 'race_car',
    name: 'Sports Race Car',
    category: 'vehicles',
    author: 'Kenney CC0',
    polyCount: 'Low Poly',
    icon: '🏎️',
    primitiveBackup: { type: 'box', scale: [1.8, 0.6, 3.2], color: [0.9, 0.1, 0.1] }
  },
  {
    id: 'spaceship',
    name: 'Sci-Fi Starfighter',
    category: 'vehicles',
    author: 'Kenney CC0',
    polyCount: 'Low Poly',
    icon: '🚀',
    primitiveBackup: { type: 'cone', scale: [2.0, 1.0, 3.5], color: [0.2, 0.6, 0.9] }
  },

  // Architecture
  {
    id: 'castle_tower',
    name: 'Stone Castle Tower',
    category: 'architecture',
    author: 'Kenney CC0',
    polyCount: 'Low Poly',
    icon: '🏰',
    primitiveBackup: { type: 'cylinder', scale: [2.5, 6.0, 2.5], color: [0.5, 0.52, 0.55] }
  },
  {
    id: 'sci_fi_portal',
    name: 'Cyber Gate Portal',
    category: 'architecture',
    author: 'Poly Pizza CC0',
    polyCount: 'Low Poly',
    icon: '🌀',
    primitiveBackup: { type: 'torus', scale: [3.0, 3.0, 0.5], color: [0.1, 0.8, 0.9] }
  }
];
