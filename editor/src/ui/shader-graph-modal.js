import * as pc from 'playcanvas';
import { MaterialPreviewRenderer } from './material-preview.js';
import { showToast } from './toast.js';

/**
 * Visual Shader & Material Node Graph Editor Modal
 * Enables game developers to visually compose procedural shaders and PBR materials using nodes.
 */
export class ShaderGraphModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.matPreview = null;
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.draggingNode = null;

    this.render();
  }

  render() {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('shader-graph-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'shader-graph-modal';
      modal.className = 'modal-backdrop';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 15, 26, 0.85);
        backdrop-filter: blur(12px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;

      modal.innerHTML = `
        <div class="modal-window" style="width: 1080px; max-width: 95vw; height: 700px; max-height: 92vh; background: var(--bg-panel); border: 1px solid var(--border-highlight); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 40px rgba(0,229,255,0.25);">
          <!-- Header -->
          <div style="padding: 12px 18px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🎨</span>
              <span style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Visual Shader & Material Node Graph Editor</span>
              <span style="font-size: 10px; color: #00e5ff; background: rgba(0,229,255,0.12); padding: 2px 8px; border-radius: 100px; border: 1px solid rgba(0,229,255,0.3); font-weight: 700;">PRO SHADER STUDIO</span>
            </div>
            <button id="btn-close-shader-graph" class="btn btn-icon" style="color: var(--text-muted);">✕</button>
          </div>

          <!-- Body split into Node Canvas (Left) and 3D Preview + Inspector (Right) -->
          <div style="flex: 1; display: flex; overflow: hidden;">
            <!-- Left Node Palette & Canvas -->
            <div style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--border-subtle); position: relative; background: #0b1120;">
              <!-- Node Toolbar -->
              <div style="padding: 8px 12px; background: rgba(15,23,42,0.8); border-bottom: 1px solid var(--border-subtle); display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-right: 4px;">ADD NODES:</span>
                <button class="btn btn-sm btn-add-node" data-nodetype="color" style="font-size: 10px; gap: 4px;">🎨 Color Swatch</button>
                <button class="btn btn-sm btn-add-node" data-nodetype="texture" style="font-size: 10px; gap: 4px;">🖼️ Texture Sampler</button>
                <button class="btn btn-sm btn-add-node" data-nodetype="fresnel" style="font-size: 10px; gap: 4px;">✨ Fresnel Rim</button>
                <button class="btn btn-sm btn-add-node" data-nodetype="sine" style="font-size: 10px; gap: 4px;">🌊 Sine Wave Anim</button>
                <button class="btn btn-sm btn-add-node" data-nodetype="noise" style="font-size: 10px; gap: 4px;">🌫️ Noise Generator</button>
                <button class="btn btn-sm btn-add-node" data-nodetype="uvscroll" style="font-size: 10px; gap: 4px;">🔄 UV Scroll</button>
                <button class="btn btn-sm" id="btn-clear-shader-graph" style="font-size: 10px; margin-left: auto; color: #ef4444;">🗑️ Clear Graph</button>
              </div>

              <!-- Node Graph Interactive Canvas -->
              <div id="shader-node-canvas" style="flex: 1; position: relative; overflow: hidden; background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0); background-size: 20px 20px;">
                <svg id="shader-svg-connections" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;"></svg>
              </div>
            </div>

            <!-- Right 3D Orbit Preview & Surface Output Controls -->
            <div style="width: 320px; background: var(--bg-panel); display: flex; flex-direction: column; padding: 14px; gap: 12px; border-left: 1px solid var(--border-subtle); overflow-y: auto;">
              <!-- WebGL 3D Preview Sphere -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="font-weight: 700; font-size: 11px; color: var(--text-secondary); width: 100%; display: flex; justify-content: space-between;">
                  <span>3D Shader Preview</span>
                  <span style="color: var(--accent-orange);">Real-Time WebGL</span>
                </div>
                <canvas id="shader-preview-canvas" width="220" height="220" style="width: 220px; height: 220px; border-radius: 12px; border: 1px solid var(--border-highlight); background: #000; box-shadow: 0 0 20px rgba(0,0,0,0.6);"></canvas>
              </div>

              <!-- Generated Material Parameters -->
              <div style="background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-weight: 700; font-size: 11px; color: var(--accent-orange);">PBR Surface Output</div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                  <span>Diffuse Color:</span>
                  <input type="color" id="sg-diffuse-color" value="#00e5ff" style="background: none; border: none; width: 36px; height: 22px; cursor: pointer;">
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                  <span>Emissive Glow:</span>
                  <input type="color" id="sg-emissive-color" value="#0055ff" style="background: none; border: none; width: 36px; height: 22px; cursor: pointer;">
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                  <span>Metallic Factor:</span>
                  <input type="range" id="sg-metallic-slider" min="0" max="1" step="0.05" value="0.7" style="width: 100px;">
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                  <span>Roughness Factor:</span>
                  <input type="range" id="sg-roughness-slider" min="0" max="1" step="0.05" value="0.2" style="width: 100px;">
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                  <span>Fresnel Power:</span>
                  <input type="range" id="sg-fresnel-slider" min="0" max="5" step="0.1" value="2.5" style="width: 100px;">
                </div>
              </div>

              <!-- Action Buttons -->
              <button class="btn btn-primary" id="btn-apply-shader-to-selected" style="padding: 10px; font-weight: 700; font-size: 12px; gap: 8px; justify-content: center; background: linear-gradient(135deg, #00e5ff, #0088ff); border: none;">
                ✨ Apply Shader Material to Selected Object
              </button>

              <button class="btn" id="btn-save-shader-as-asset" style="padding: 8px; font-size: 11px; justify-content: center;">
                💾 Save as Material Asset (.mat)
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    this.bindEvents();
  }

  bindEvents() {
    const modal = document.getElementById('shader-graph-modal');
    if (!modal) return;

    modal.querySelector('#btn-close-shader-graph').addEventListener('click', () => this.close());

    modal.querySelectorAll('.btn-add-node').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addNode(btn.dataset.nodetype);
      });
    });

    modal.querySelector('#btn-clear-shader-graph').addEventListener('click', () => {
      this.clearGraph();
    });

    const diffuseColorInp = modal.querySelector('#sg-diffuse-color');
    const emissiveColorInp = modal.querySelector('#sg-emissive-color');
    const metallicInp = modal.querySelector('#sg-metallic-slider');
    const roughnessInp = modal.querySelector('#sg-roughness-slider');

    const updatePreview = () => {
      if (!this.matPreview) return;
      const hexD = diffuseColorInp.value;
      const hexE = emissiveColorInp.value;

      const rD = parseInt(hexD.slice(1, 3), 16) / 255;
      const gD = parseInt(hexD.slice(3, 5), 16) / 255;
      const bD = parseInt(hexD.slice(5, 7), 16) / 255;

      const rE = parseInt(hexE.slice(1, 3), 16) / 255;
      const gE = parseInt(hexE.slice(3, 5), 16) / 255;
      const bE = parseInt(hexE.slice(5, 7), 16) / 255;

      this.matPreview.updateMaterial({
        diffuse: [rD, gD, bD],
        emissive: [rE, gE, bE],
        metalness: parseFloat(metallicInp.value),
        roughness: parseFloat(roughnessInp.value)
      });
    };

    diffuseColorInp.addEventListener('input', updatePreview);
    emissiveColorInp.addEventListener('input', updatePreview);
    metallicInp.addEventListener('input', updatePreview);
    roughnessInp.addEventListener('input', updatePreview);

    modal.querySelector('#btn-apply-shader-to-selected').addEventListener('click', () => {
      const active = this.editor.selection.getActive();
      if (active) {
        const hexD = diffuseColorInp.value;
        const hexE = emissiveColorInp.value;

        const rD = parseInt(hexD.slice(1, 3), 16) / 255;
        const gD = parseInt(hexD.slice(3, 5), 16) / 255;
        const bD = parseInt(hexD.slice(5, 7), 16) / 255;

        const rE = parseInt(hexE.slice(1, 3), 16) / 255;
        const gE = parseInt(hexE.slice(3, 5), 16) / 255;
        const bE = parseInt(hexE.slice(5, 7), 16) / 255;

        const mat = new pc.StandardMaterial();
        mat.diffuse = new pc.Color(rD, gD, bD);
        mat.emissive = new pc.Color(rE, gE, bE);
        mat.metalness = parseFloat(metallicInp.value);
        mat.useMetalness = true;
        mat.roughness = parseFloat(roughnessInp.value);
        mat.update();

        const applyNode = (node) => {
          if (node.render) {
            node.render.material = mat;
          }
          if (node.children) node.children.forEach(applyNode);
        };
        applyNode(active);

        this.editor.events.emit('entity:component:changed', active);
        this.editor.events.emit('scene:changed');
        showToast(`✨ Custom Shader Graph Material applied to "${active.name}"!`, 'success');
      } else {
        showToast('Select an entity in Hierarchy or 3D scene first', 'warn');
      }
    });

    modal.querySelector('#btn-save-shader-as-asset').addEventListener('click', () => {
      const hexD = diffuseColorInp.value;
      const hexE = emissiveColorInp.value;

      const rD = parseInt(hexD.slice(1, 3), 16) / 255;
      const gD = parseInt(hexD.slice(3, 5), 16) / 255;
      const bD = parseInt(hexD.slice(5, 7), 16) / 255;

      const rE = parseInt(hexE.slice(1, 3), 16) / 255;
      const gE = parseInt(hexE.slice(3, 5), 16) / 255;
      const bE = parseInt(hexE.slice(5, 7), 16) / 255;

      const name = `Shader_${Date.now().toString().slice(-4)}.mat`;
      if (this.editor.assetsPanel) {
        this.editor.assetsPanel.addAsset({
          id: Date.now().toString(),
          name: name,
          type: 'materials',
          icon: '🎨',
          size: '3.2 KB',
          materialData: {
            diffuse: [rD, gD, bD],
            emissive: [rE, gE, bE],
            metalness: parseFloat(metallicInp.value),
            roughness: parseFloat(roughnessInp.value)
          }
        });
      }
      showToast(`💾 Saved custom shader material asset "${name}"!`, 'success');
    });
  }

  open() {
    this.isOpen = true;
    const modal = document.getElementById('shader-graph-modal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => {
        const previewCanvas = modal.querySelector('#shader-preview-canvas');
        if (previewCanvas && !this.matPreview) {
          this.matPreview = new MaterialPreviewRenderer(previewCanvas);
        }
        if (this.nodes.length === 0) {
          this.setupDefaultGraph();
        }
      }, 50);
    }
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('shader-graph-modal');
    if (modal) modal.style.display = 'none';
  }

  setupDefaultGraph() {
    this.addNode('color', 60, 80, { color: '#00e5ff', name: 'Base Color' });
    this.addNode('fresnel', 60, 260, { power: 2.5, name: 'Fresnel Rim' });
    this.addNode('output', 480, 160, { name: 'PBR Surface Output' });
  }

  clearGraph() {
    this.nodes = [];
    this.connections = [];
    if (typeof document !== 'undefined') {
      const canvas = document.getElementById('shader-node-canvas');
      if (canvas) {
        const existing = canvas.querySelectorAll('.shader-node');
        existing.forEach(el => el.remove());
      }
      const svg = document.getElementById('shader-svg-connections');
      if (svg) svg.innerHTML = '';
    }
  }

  addNode(type, x = 120, y = 120, extraProps = {}) {
    const id = `node_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const nodeObj = { id, type, x, y, props: { ...extraProps } };
    this.nodes.push(nodeObj);

    if (typeof document === 'undefined') return;

    const canvas = document.getElementById('shader-node-canvas');
    if (!canvas) return;

    const el = document.createElement('div');
    el.className = 'shader-node';
    el.id = id;
    el.style.cssText = `
      position: absolute;
      left: ${x}px; top: ${y}px;
      width: 170px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid var(--border-highlight);
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      z-index: 10;
      color: #fff;
      font-size: 11px;
      user-select: none;
    `;

    const titleMap = {
      color: '🎨 Color Swatch',
      texture: '🖼️ Texture Sampler',
      fresnel: '✨ Fresnel Rim Effect',
      sine: '🌊 Sine Wave Anim',
      noise: '🌫️ Noise Generator',
      uvscroll: '🔄 UV Scroll',
      output: '🌟 PBR Surface Output'
    };

    el.innerHTML = `
      <div style="padding: 6px 10px; background: rgba(0,229,255,0.15); border-bottom: 1px solid var(--border-subtle); border-radius: 8px 8px 0 0; font-weight: 700; color: #00e5ff; display: flex; justify-content: space-between; align-items: center;">
        <span>${titleMap[type] || type}</span>
        ${type !== 'output' ? `<span class="btn-node-del" style="cursor:pointer; color:#ef4444; font-size:10px;">✕</span>` : ''}
      </div>
      <div style="padding: 10px; display: flex; flex-direction: column; gap: 6px;">
        ${type === 'color' ? `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span>Color:</span>
            <input type="color" value="${extraProps.color || '#00e5ff'}" style="background:none; border:none; width:30px; height:20px; cursor:pointer;">
          </div>
        ` : ''}
        ${type === 'fresnel' ? `
          <div style="font-size:10px; color:var(--text-muted);">Rim Shader Intensity</div>
        ` : ''}
        ${type === 'sine' ? `
          <div style="font-size:10px; color:var(--text-muted);">Sinusoidal Time Oscillation</div>
        ` : ''}
        ${type === 'output' ? `
          <div style="font-size:10px; color:#34d399; font-weight:700;">Final Render Surface</div>
        ` : ''}
      </div>
    `;

    // Make node draggable
    let isDragging = false;
    let startX = 0, startY = 0;

    const header = el.firstElementChild;
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX - nodeObj.x;
      startY = e.clientY - nodeObj.y;
      el.style.zIndex = 20;
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        nodeObj.x = e.clientX - startX;
        nodeObj.y = e.clientY - startY;
        el.style.left = `${nodeObj.x}px`;
        el.style.top = `${nodeObj.y}px`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        el.style.zIndex = 10;
      }
    });

    const delBtn = el.querySelector('.btn-node-del');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        this.nodes = this.nodes.filter(n => n.id !== id);
        el.remove();
      });
    }

    canvas.appendChild(el);
  }
}
