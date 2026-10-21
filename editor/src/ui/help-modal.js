/**
 * MakuluLinux Game Studio - Comprehensive Help & Editor Reference Modal
 */
export class HelpModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.activeCategory = 'overview';
    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'help-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: var(--font-sans);
    `;

    this.modal.innerHTML = `
      <div style="width: 960px; max-width: 95vw; height: 86vh; max-height: 850px; background: var(--bg-darkest); border: 1px solid var(--accent-orange); border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,102,0,0.25); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Modal Header -->
        <div style="height: 54px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 22px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(168, 85, 247, 0.2); border: 1px solid #c084fc; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #c084fc;">
              ❓
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px; color: var(--text-primary); letter-spacing: -0.2px;">
                MakuluLinux Game Studio · Help & Reference
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">
                Comprehensive documentation, architecture, interface controls & tools
              </div>
            </div>
          </div>
          <button id="help-btn-close" class="btn" style="padding: 4px 10px; font-size: 14px; border-radius: 6px;">✕</button>
        </div>

        <!-- Modal Body (Two-Column Layout) -->
        <div style="flex: 1; display: flex; overflow: hidden;">
          
          <!-- Left Navigation Sidebar -->
          <div style="width: 250px; background: var(--bg-darker); border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; flex-shrink: 0;">
            <div style="padding: 12px; border-bottom: 1px solid var(--border-subtle);">
              <input type="text" id="help-search-input" placeholder="🔍 Filter topics..." style="width: 100%; box-sizing: border-box; background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 6px 10px; font-size: 12px; color: var(--text-primary); outline: none;">
            </div>
            <div id="help-category-list" style="flex: 1; overflow-y: auto; padding: 8px;">
              <!-- Navigation Category Buttons rendered dynamically -->
            </div>
            <div style="padding: 12px; border-top: 1px solid var(--border-subtle); font-size: 11px; color: var(--text-muted); text-align: center;">
              Version 1.0.0 (LTS) · MakuluLinux
            </div>
          </div>

          <!-- Right Content Area -->
          <div id="help-content-area" style="flex: 1; overflow-y: auto; padding: 28px 36px; background: var(--bg-darkest); color: var(--text-primary); font-size: 13.5px; line-height: 1.65;">
            <!-- Active Category Content rendered here -->
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
    this.renderCategoryList();
    this.renderActiveContent();
  }

  getCategories() {
    return [
      {
        id: 'overview',
        icon: '🖥️',
        title: 'Editor Overview & Layout',
        desc: '5-Pane architecture & docking'
      },
      {
        id: 'modes',
        icon: '🌱',
        title: 'Simple vs Pro Mode',
        desc: 'Beginner vs technical workflows'
      },
      {
        id: 'viewport',
        icon: '🎮',
        title: '3D Viewport & Navigation',
        desc: 'Orbit, Pan, Zoom, WASD Flythrough'
      },
      {
        id: 'gizmos',
        icon: '🔧',
        title: 'Gizmos & Snapping',
        desc: 'Move (W), Rotate (E), Scale (R)'
      },
      {
        id: 'ai-copilot',
        icon: '✨',
        title: 'Native AI Studio Copilot',
        desc: 'MakuluLinux AI engine integration'
      },
      {
        id: 'behaviors',
        icon: '⚡',
        title: 'Plug & Play Behaviors',
        desc: 'WASD Player, Spin & Light Flicker'
      },
      {
        id: 'assets-terrain',
        icon: '📦',
        title: '3D Store & Terrain Sculptor',
        desc: 'CC0 model library & Perlin noise'
      },
      {
        id: 'publish',
        icon: '🚀',
        title: 'Compiler & Cloud Publishing',
        desc: 'HTML5 bundler & AppImage export'
      },
      {
        id: 'shortcuts',
        icon: '⌨️',
        title: 'Keyboard Shortcuts',
        desc: 'Full hotkey reference list'
      }
    ];
  }

  renderCategoryList(filter = '') {
    const list = this.modal.querySelector('#help-category-list');
    const categories = this.getCategories();
    const query = filter.trim().toLowerCase();

    const filtered = categories.filter(c => 
      c.title.toLowerCase().includes(query) || 
      c.desc.toLowerCase().includes(query)
    );

    list.innerHTML = filtered.map(c => `
      <div class="help-nav-item ${c.id === this.activeCategory ? 'active' : ''}" data-cat="${c.id}" style="
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        margin-bottom: 4px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        background: ${c.id === this.activeCategory ? 'rgba(255,102,0,0.18)' : 'transparent'};
        border: 1px solid ${c.id === this.activeCategory ? 'var(--accent-orange)' : 'transparent'};
      ">
        <span style="font-size: 16px;">${c.icon}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 12px; font-weight: 600; color: ${c.id === this.activeCategory ? '#fff' : 'var(--text-primary)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.title}</div>
          <div style="font-size: 10px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.desc}</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.help-nav-item').forEach(el => {
      el.addEventListener('click', () => {
        this.activeCategory = el.dataset.cat;
        this.renderCategoryList(filter);
        this.renderActiveContent();
      });
    });
  }

  renderActiveContent() {
    const content = this.modal.querySelector('#help-content-area');
    content.scrollTop = 0;

    switch (this.activeCategory) {
      case 'overview':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">🖥️</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">Editor Architecture & 5-Pane Layout</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Designed for AAA-grade workflow familiar to Unity, Unreal and PlayCanvas creators</div>
            </div>
          </div>

          <p>MakuluLinux Game Studio is built upon a high-performance WebGL/WebGPU architecture powered by the open-source PlayCanvas engine. The editor UI is arranged into five unified docked panes:</p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0;">
            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 6px;">1. Hierarchy Panel (Left)</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Displays the full hierarchical scene tree of all entities. Features instant live search and the <code>+ Add</code> button to spawn primitives, lights, and cameras.</div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="font-weight: 700; color: #00e5ff; font-size: 13px; margin-bottom: 6px;">2. 3D Viewport (Center)</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Interactive 3D canvas featuring infinite procedural floor grid, 3D transform gizmos, visible fixtures for lights & cameras, and DPI-scaled object picking.</div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="font-weight: 700; color: #10b981; font-size: 13px; margin-bottom: 6px;">3. Inspector Panel (Right)</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Real-time properties inspector that dynamically adapts between 🌱 <b>Simple Mode</b> (swatches, sliders, behaviors) and ⚡ <b>Pro Mode</b> (Vector3, PBR channels, components).</div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="font-weight: 700; color: #c084fc; font-size: 13px; margin-bottom: 6px;">4. Bottom Asset & Code Studio</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Tabbed bottom tray housing the <b>Asset Browser</b>, <b>3D Model Store</b>, <b>Terrain Sculptor</b>, and the full PlayCanvas <b>Script Studio</b>.</div>
            </div>
          </div>

          <div style="background: rgba(255,102,0,0.1); border-left: 3px solid var(--accent-orange); padding: 12px 16px; border-radius: 0 6px 6px 0; margin-top: 16px;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 12px; margin-bottom: 4px;">💡 Resizable Splitters</div>
            <div style="font-size: 12px; color: var(--text-primary);">All pane dividers are interactive. Hover your mouse over the vertical edge between Hierarchy and Viewport, or between Viewport and Assets, and drag to resize to your preference!</div>
          </div>
        `;
        break;

      case 'modes':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">🌱</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">Dual-Tier UI: Simple vs Pro Mode</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Switch anytime via the top bar toggle switch</div>
            </div>
          </div>

          <div style="display: flex; gap: 16px; margin: 18px 0;">
            <div style="flex: 1; background: var(--bg-panel); border: 1px solid #10b981; border-radius: 8px; padding: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <span style="font-size: 20px;">🌱</span>
                <span style="font-weight: 700; color: #10b981; font-size: 14px;">Simple Mode (Beginners)</span>
              </div>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: var(--text-secondary); line-height: 1.8;">
                <li><b>8-Color Quick Palette:</b> 1-click apply Red, Orange, Amber, Emerald, Cyan, Blue, Purple, or Obsidian without touching shaders.</li>
                <li><b>Visual Size Sliders:</b> Scale entities smoothly from 0.1x to 10x without typing math coordinates.</li>
                <li><b>±0.5 Nudge Controls:</b> Move objects up, down, left, right with large intuitive arrow buttons.</li>
                <li><b>Plug & Play Behaviors:</b> Attach WASD Movement, Spin, or Flicker with one toggle switch!</li>
              </ul>
            </div>

            <div style="flex: 1; background: var(--bg-panel); border: 1px solid var(--accent-orange); border-radius: 8px; padding: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <span style="font-size: 20px;">⚡</span>
                <span style="font-weight: 700; color: var(--accent-orange); font-size: 14px;">Pro Mode (Engineers)</span>
              </div>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: var(--text-secondary); line-height: 1.8;">
                <li><b>Exact Vector3 Transforms:</b> Numerical input fields for Position (X, Y, Z), Rotation (Pitch, Yaw, Roll), and Scale.</li>
                <li><b>PBR Material Preview Sphere:</b> Real-time 3D orbiting preview with Diffuse color, Metalness, and Roughness channel sliders.</li>
                <li><b>Full Component Stack:</b> Render meshes, Directional/Point/Spot lights with range, inner/outer angles, and shadows.</li>
                <li><b>PlayCanvas Scripting:</b> Custom JavaScript/ES6 lifecycle hooks (<code>initialize</code>, <code>update</code>).</li>
              </ul>
            </div>
          </div>
        `;
        break;

      case 'viewport':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">🎮</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">3D Viewport Controls & Camera Navigation</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Industry-standard smooth orbiting, panning, and flythrough navigation</div>
            </div>
          </div>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; overflow: hidden; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
              <thead>
                <tr style="background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); text-align: left;">
                  <th style="padding: 10px 14px; color: var(--accent-orange);">Action</th>
                  <th style="padding: 10px 14px; color: var(--accent-orange);">Mouse / Keyboard Control</th>
                  <th style="padding: 10px 14px; color: var(--accent-orange);">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 10px 14px; font-weight: 600;">Orbit Camera</td>
                  <td style="padding: 10px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Left Mouse Button + Drag</kbd></td>
                  <td style="padding: 10px 14px; color: var(--text-secondary);">Rotates camera around current focus target in 3D space</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 10px 14px; font-weight: 600;">Pan View</td>
                  <td style="padding: 10px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Right Mouse Button + Drag</kbd> or <kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Shift + Left Drag</kbd></td>
                  <td style="padding: 10px 14px; color: var(--text-secondary);">Translates the camera plane horizontally and vertically</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 10px 14px; font-weight: 600;">Zoom</td>
                  <td style="padding: 10px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Mouse Wheel</kbd></td>
                  <td style="padding: 10px 14px; color: var(--text-secondary);">Smooth exponential dolly in and out towards target</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 10px 14px; font-weight: 600;">WASD Flythrough</td>
                  <td style="padding: 10px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Hold Right-Click + W/A/S/D</kbd></td>
                  <td style="padding: 10px 14px; color: var(--text-secondary);">First-person free-fly spectator camera through the scene</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: 600;">Frame Selection</td>
                  <td style="padding: 10px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">F</kbd> key</td>
                  <td style="padding: 10px 14px; color: var(--text-secondary);">Instantly teleports and centers view onto selected object</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
        break;

      case 'gizmos':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">🔧</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">Interactive 3D Gizmos & Snapping</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Manipulate objects directly in 3D space with high precision</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0;">
            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 20px; margin-bottom: 4px;">👆</div>
              <div style="font-weight: 700; color: #fff; font-size: 13px;">Select Mode</div>
              <div style="font-size: 11px; color: var(--accent-orange); margin-top: 4px;">Shortcut: <b>Q</b></div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Hides gizmo for clean unobstructed view.</div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 20px; margin-bottom: 4px;">✥</div>
              <div style="font-weight: 700; color: #fff; font-size: 13px;">Translate (Move)</div>
              <div style="font-size: 11px; color: var(--accent-orange); margin-top: 4px;">Shortcut: <b>W</b></div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Drag Red (X), Green (Y), Blue (Z) arrows.</div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 20px; margin-bottom: 4px;">↻</div>
              <div style="font-weight: 700; color: #fff; font-size: 13px;">Rotate</div>
              <div style="font-size: 11px; color: var(--accent-orange); margin-top: 4px;">Shortcut: <b>E</b></div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Drag rotation rings to tilt and twist.</div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; text-align: center;">
              <div style="font-size: 20px; margin-bottom: 4px;">⤢</div>
              <div style="font-weight: 700; color: #fff; font-size: 13px;">Scale</div>
              <div style="font-size: 11px; color: var(--accent-orange); margin-top: 4px;">Shortcut: <b>R</b></div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Drag colored cubes to stretch or shrink.</div>
            </div>
          </div>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin-top: 14px;">
            <div style="font-weight: 700; color: #fff; margin-bottom: 8px;">Coordinate Space & Snapping Options</div>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: var(--text-secondary); line-height: 1.8;">
              <li><b>World vs Local:</b> Located on the left vertical toolstrip. Toggle between global world axes and local object rotation.</li>
              <li><b>Grid Snapping:</b> Click the magnet icon in the toolstrip to constrain translation to crisp 1.0 unit increments.</li>
              <li><b>Floor Grid Toggle:</b> Toggle the infinite 3D floor reference grid on or off for cinematic screenshots.</li>
            </ul>
          </div>
        `;
        break;

      case 'ai-copilot':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">✨</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">Native AI Studio Copilot</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Powered by MakuluLinux AI API (Electra & Electra-Nano)</div>
            </div>
          </div>

          <p>Unlike standard text chat bots, the MakuluLinux AI Copilot has full transactional control over the entire 3D editor through the <b>Universal Command Bus</b>. Every action performed by the AI can be undone (<kbd>Ctrl+Z</kbd>) and redone (<kbd>Ctrl+Y</kbd>).</p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 16px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">⚡ Things you can ask the AI to do right now:</div>
            
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
              <div style="background: var(--bg-darkest); padding: 8px 12px; border-radius: 6px; border-left: 3px solid #ff6600;">
                <b>Procedural Architecture:</b> <i>"Create an enclosed medieval stone arena with 8 perimeter pillars and a gold altar in the center"</i>
              </div>
              <div style="background: var(--bg-darkest); padding: 8px 12px; border-radius: 6px; border-left: 3px solid #00e5ff;">
                <b>Cinematic Lighting:</b> <i>"Add three neon cyan spotlights pointing down and a red ambient fill light"</i>
              </div>
              <div style="background: var(--bg-darkest); padding: 8px 12px; border-radius: 6px; border-left: 3px solid #10b981;">
                <b>Gameplay Behaviors:</b> <i>"Make the selected entity spin continuously and move the player to (0, 2, 0)"</i>
              </div>
              <div style="background: var(--bg-darkest); padding: 8px 12px; border-radius: 6px; border-left: 3px solid #c084fc;">
                <b>Automated Scene Auditing:</b> Click <b>✨ Run AI Health Audit</b> in the Copilot pane to scan for missing lights, ungrounded meshes, and missing camera frustums!
              </div>
            </div>
          </div>
        `;
        break;

      case 'behaviors':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">⚡</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">Plug & Play Behavior Engine</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Add instant interactive gameplay logic with zero lines of code</div>
            </div>
          </div>

          <p>Behaviors allow beginners and rapid prototypers to animate and control entities immediately without writing JavaScript. Select any entity in the Hierarchy and check the <b>Plug & Play Behaviors</b> section in the Inspector:</p>

          <div style="display: flex; flex-direction: column; gap: 12px; margin: 16px 0;">
            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #10b981; font-size: 13px;">🎮 WASD Player Controller</span>
                <span class="badge badge-green" style="font-size: 10px;">Interactive</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">
                Converts any mesh (Box, Sphere, Capsule, or imported 3D model) into a playable character responding to <kbd>W</kbd>, <kbd>A</kbd>, <kbd>S</kbd>, <kbd>D</kbd> or Arrow Keys during Play Mode. Includes smooth acceleration and rotation.
              </div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #00e5ff; font-size: 13px;">🌀 Spin Animation</span>
                <span class="badge badge-blue" style="font-size: 10px;">Procedural</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">
                Continuously rotates the object along its Y-axis at a smooth 45° per second. Perfect for collectible coins, floating gems, powerups, or rotating radar antennas.
              </div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 700; color: #ff6600; font-size: 13px;">🔥 Torch Light Flicker</span>
                <span class="badge" style="background: rgba(255,102,0,0.2); color: #ff6600; font-size: 10px;">Atmosphere</span>
              </div>
              <div style="font-size: 12px; color: var(--text-secondary);">
                Procedurally modulates light intensity and range with realistic Perlin noise fluctuation, mimicking medieval campfires, flickering dungeon torches, and faulty fluorescent tubes.
              </div>
            </div>
          </div>
        `;
        break;

      case 'assets-terrain':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">📦</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">3D Model Store & Procedural Terrain</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Free CC0 assets and natural landscape generation</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0;">
            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px;">
              <div style="font-size: 22px; margin-bottom: 6px;">📦 3D Model Store</div>
              <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 10px 0;">
                Click the orange <b>📦 3D Store</b> button in the bottom Assets panel to open the curated library of CC0 public-domain 3D models.
              </p>
              <ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: var(--text-secondary);">
                <li>1-Click instant spawning into active scene</li>
                <li>Low-poly trees, stones, barrels, treasure chests</li>
                <li>Medieval weapons, vehicles, and sci-fi props</li>
              </ul>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px;">
              <div style="font-size: 22px; margin-bottom: 6px;">🏔️ Procedural Terrain Sculptor</div>
              <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 10px 0;">
                Click the green <b>🏔️ Terrain</b> button to generate custom 3D mountains, rolling hills, and valleys.
              </p>
              <ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: var(--text-secondary);">
                <li>Adjust Resolution (16x16 up to 128x128 vertices)</li>
                <li>Control Max Elevation & Perlin Noise Roughness</li>
                <li>Automatic biome elevation vertex coloring (water, sand, grass, rock, snow)</li>
              </ul>
            </div>
          </div>
        `;
        break;

      case 'publish':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">🚀</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">Game Compiler & 1-Click Cloud Publishing</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Share your creations with the world instantly</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin: 16px 0;">
            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px;">
              <div style="font-weight: 700; color: #00e5ff; font-size: 13.5px; margin-bottom: 6px;">Option 1: Download Standalone HTML5 Game (.html)</div>
              <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                The built-in compiler packages your entire scene, PlayCanvas 3D engine, custom behaviors, materials, and lighting into a <b>single self-contained HTML file</b>.
                <br>• Zero external dependencies or web servers needed.
                <br>• Just double-click the <code>.html</code> file on any PC, Mac, Linux, or mobile phone to play!
              </div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px;">
              <div style="font-weight: 700; color: var(--accent-orange); font-size: 13.5px; margin-bottom: 6px;">Option 2: 1-Click Makulu Cloud Web Hosting</div>
              <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                Click <b>🚀 Publish to Web</b> in the Publish modal to generate an instant live URL.
                <br>• Automatically generates an interactive playtest link with 1-click clipboard copying.
                <br>• Includes full responsive mobile touch controls and full-screen support.
              </div>
            </div>

            <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px;">
              <div style="font-weight: 700; color: #10b981; font-size: 13.5px; margin-bottom: 6px;">Option 3: Linux Desktop AppImage & .deb Packages</div>
              <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                The studio itself is packaged as a universal <code>MakuluLinux Game Studio-1.0.0.AppImage</code> and Debian <code>.deb</code> located in <code>PlayCanvas/editor/release/</code> for native high-performance desktop execution across all Linux distributions.
              </div>
            </div>
          </div>
        `;
        break;

      case 'shortcuts':
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 28px;">⌨️</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; color: #fff;">Keyboard Shortcuts Reference</h2>
              <div style="font-size: 12px; color: var(--text-secondary);">Master every studio control with quick key combinations</div>
            </div>
          </div>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; overflow: hidden; margin-top: 14px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
              <thead>
                <tr style="background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); text-align: left;">
                  <th style="padding: 10px 14px; color: var(--accent-orange);">Shortcut</th>
                  <th style="padding: 10px 14px; color: var(--accent-orange);">Function</th>
                  <th style="padding: 10px 14px; color: var(--accent-orange);">Category</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Q</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Select Mode (Hide Gizmo)</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">Gizmo</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">W</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Translate / Move Gizmo</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">Gizmo</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">E</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Rotate Gizmo</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">Gizmo</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">R</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Scale Gizmo</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">Gizmo</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">F</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Frame Selection (Center Camera)</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">Navigation</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Ctrl + Z</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Undo Last Action</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">Command Bus</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Ctrl + Y</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Redo Last Action</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">Command Bus</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Delete</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Delete Selected Entity</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">Hierarchy</td>
                </tr>
                <tr>
                  <td style="padding: 9px 14px;"><kbd style="background: var(--bg-darkest); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-subtle);">Escape</kbd></td>
                  <td style="padding: 9px 14px; font-weight: 600;">Deselect All / Close Dialogs</td>
                  <td style="padding: 9px 14px; color: var(--text-secondary);">System</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
        break;
    }
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#help-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    // Dismiss on click outside modal window
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Topic search filter
    const search = this.modal.querySelector('#help-search-input');
    if (search) {
      search.addEventListener('input', (e) => {
        this.renderCategoryList(e.target.value);
      });
    }

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(category = 'overview') {
    this.activeCategory = category;
    this.renderCategoryList();
    this.renderActiveContent();
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
