import { showToast } from './toast.js';
import { GameBundler } from '../compiler/game-bundler.js';

/**
 * Top Navigation Bar with Organized Dropdown Menus
 */
export class TopBar {
  constructor(
    container,
    editor,
    aiController,
    templatesModal = null,
    publishModal = null,
    helpModal = null,
    guideModal = null,
    aiSettingsModal = null,
    projectSettingsModal = null,
    postProcessingModal = null,
    timelinePanel = null,
    hudModal = null,
    extraModals = {}
  ) {
    this.container = container;
    this.editor = editor;
    this.aiController = aiController;
    this.templatesModal = templatesModal;
    this.publishModal = publishModal;
    this.helpModal = helpModal;
    this.guideModal = guideModal;
    this.aiSettingsModal = aiSettingsModal;
    this.projectSettingsModal = projectSettingsModal;
    this.postProcessingModal = postProcessingModal;
    this.timelinePanel = timelinePanel;
    this.hudModal = hudModal;
    this.extraModals = extraModals || {};
    this.isPlaying = false;
    this.isMenuOpen = false;

    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <!-- Left Section: Logo & Dropdown Menu Bar -->
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-right: 4px;">
          <div style="width: 26px; height: 26px; background: linear-gradient(135deg, #ff6600, #ff3300); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: #fff; box-shadow: 0 0 10px rgba(255,102,0,0.4);">M</div>
          <span style="font-weight: 700; font-size: 13px; color: var(--text-primary); letter-spacing: -0.2px;">MakuluLinux <span style="color: var(--accent-orange); font-weight: 600;">Studio</span></span>
        </div>

        <div style="height: 18px; width: 1px; background: var(--border-subtle); margin: 0 2px;"></div>

        <!-- Menu Bar -->
        <nav class="topbar-menu-bar">
          <!-- File Menu -->
          <div class="topbar-menu-item">
            <button class="topbar-menu-btn" data-menu="file">File ▾</button>
            <div class="topbar-dropdown-menu" id="menu-file">
              <div class="topbar-dropdown-item" id="menu-action-import">
                <span class="item-label">📂 Import Project (JSON)...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-export">
                <span class="item-label">💾 Export Project (JSON)...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-export-html">
                <span class="item-label">🌐 Export Standalone HTML5 Game...</span>
              </div>
              <div class="topbar-dropdown-separator"></div>
              <div class="topbar-dropdown-item" id="menu-action-templates">
                <span class="item-label">🎮 Starter Genre Templates...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-publish">
                <span class="item-label">🚀 Publish Game to Web...</span>
              </div>
            </div>
          </div>

          <!-- Scene Menu -->
          <div class="topbar-menu-item">
            <button class="topbar-menu-btn" data-menu="scene">Scene ▾</button>
            <div class="topbar-dropdown-menu" id="menu-scene">
              <div class="topbar-dropdown-item" id="menu-action-new-scene">
                <span class="item-label">➕ New Scene...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-rename-scene">
                <span class="item-label">✏️ Rename Active Scene...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-dup-scene">
                <span class="item-label">📋 Duplicate Active Scene</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-del-scene" style="color: #ef4444;">
                <span class="item-label">🗑️ Delete Active Scene</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-drop-ground">
                <span class="item-label">⬇️ Drop Selected to Floor Ground</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-hdri-skybox">
                <span class="item-label">🌌 Custom HDRI Skybox & Reflections...</span>
              </div>
              <div class="topbar-dropdown-separator"></div>
              <div style="padding: 4px 12px; font-size: 10px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Atmosphere & Lighting</div>
              <div class="topbar-dropdown-item" data-sky="day">
                <span class="item-label">☀️ Clear Day</span>
              </div>
              <div class="topbar-dropdown-item" data-sky="sunset">
                <span class="item-label">🌅 Sunset</span>
              </div>
              <div class="topbar-dropdown-item" data-sky="cyberpunk">
                <span class="item-label">🌆 Cyberpunk</span>
              </div>
              <div class="topbar-dropdown-item" data-sky="foggy">
                <span class="item-label">🌫️ Foggy Valley</span>
              </div>
              <div class="topbar-dropdown-item" data-sky="night">
                <span class="item-label">🌙 Night</span>
              </div>
              <div class="topbar-dropdown-separator"></div>
              <div style="padding: 4px 12px; font-size: 10px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Camera View</div>
              <div class="topbar-dropdown-item" data-cam="persp">
                <span class="item-label">🎥 Perspective View</span>
              </div>
              <div class="topbar-dropdown-item" data-cam="ortho">
                <span class="item-label">📐 Orthographic View</span>
              </div>
            </div>
          </div>

          <!-- Tools Menu -->
          <div class="topbar-menu-item">
            <button class="topbar-menu-btn" data-menu="tools">Tools ▾</button>
            <div class="topbar-dropdown-menu" id="menu-tools">
              <div class="topbar-dropdown-item" id="menu-action-hud">
                <span class="item-label">📺 2D Screen UI & HUD Designer...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-sfx-studio">
                <span class="item-label">🔊 Procedural Audio Synth Studio...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-timeline">
                <span class="item-label">🎬 Animation Timeline Sequencer...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-anim-blend">
                <span class="item-label">🕺 Visual Animation Blend Graph...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-flow-graph">
                <span class="item-label">⚡ Visual Behavior & Event Flow Graph...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-physics-joint">
                <span class="item-label">⚙️ Physics Joint & Ragdoll Studio...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-hdri-studio">
                <span class="item-label">🌅 Environment & Skybox Studio...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-postfx">
                <span class="item-label">✨ Post-Processing FX Pipeline...</span>
              </div>
              <div class="topbar-dropdown-separator"></div>
              <div class="topbar-dropdown-item" id="menu-action-model-store">
                <span class="item-label">📦 3D Model Store & Assets...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-terrain">
                <span class="item-label">🏔️ Procedural Terrain Sculptor...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-material">
                <span class="item-label">🎨 PBR Material Studio...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-shader-graph">
                <span class="item-label">🎨 Visual Shader Graph Editor...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-code">
                <span class="item-label">📜 Script Code Studio...</span>
              </div>
              <div class="topbar-dropdown-separator"></div>
              <div class="topbar-dropdown-item" id="menu-action-console">
                <span class="item-label">📋 Console & Diagnostic Logs</span>
              </div>
            </div>
          </div>

          <!-- Settings Menu -->
          <div class="topbar-menu-item">
            <button class="topbar-menu-btn" data-menu="settings">Settings ▾</button>
            <div class="topbar-dropdown-menu" id="menu-settings">
              <div class="topbar-dropdown-item" id="menu-action-ai-settings">
                <span class="item-label">⚙️ AI Copilot Settings...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-proj-settings">
                <span class="item-label">⚙️ Project & Physics Settings...</span>
              </div>
            </div>
          </div>

          <!-- Help Menu -->
          <div class="topbar-menu-item">
            <button class="topbar-menu-btn" data-menu="help">Help ▾</button>
            <div class="topbar-dropdown-menu" id="menu-help">
              <div class="topbar-dropdown-item" id="menu-action-guide">
                <span class="item-label">📖 Beginner's Game Masterclass...</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-help">
                <span class="item-label">❓ Hotkeys & Controls Reference...</span>
              </div>
              <div class="topbar-dropdown-separator"></div>
              <div class="topbar-dropdown-item" id="menu-action-website">
                <span class="item-label">🌐 MakuluLinux Official Website</span>
              </div>
              <div class="topbar-dropdown-item" id="menu-action-github">
                <span class="item-label">🐙 GitHub Repository</span>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <!-- Center Section: Active Scene Switcher, Mode Toggle & AI Prompt Bar -->
      <div style="display: flex; align-items: center; gap: 10px; flex: 1; max-width: 600px; justify-content: center; margin: 0 12px;">
        <!-- Scene Quick Picker -->
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary); white-space: nowrap;">
          <span>Scene:</span>
          <select id="top-scene-select" class="select-input" style="width: 105px; padding: 2px 6px; height: 26px; font-size: 11px;">
            <option value="Main Scene">Main Scene</option>
            <option value="__create_new__">+ New Scene...</option>
          </select>
        </div>

        <!-- Mode Switcher (Simple vs Pro) -->
        <div class="mode-switch" id="mode-switcher" style="flex-shrink: 0;">
          <button class="mode-btn ${this.editor.mode === 'simple' ? 'active' : ''}" data-mode="simple">🌱 Simple</button>
          <button class="mode-btn ${this.editor.mode === 'pro' ? 'active' : ''}" data-mode="pro">⚡ Pro</button>
        </div>

        <!-- Quick AI Prompt Bar -->
        <div class="quick-prompt-wrap" style="flex: 1; min-width: 120px; max-width: 260px;">
          <span class="quick-prompt-icon">✨</span>
          <input type="text" id="top-quick-prompt" class="quick-prompt-input" placeholder="Ask AI Copilot..." />
          <button id="top-quick-submit" class="quick-prompt-submit" title="Send to AI Copilot">↵</button>
        </div>
      </div>

      <!-- Right Action Controls (Popular frequent tools) -->
      <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
        <!-- Quick Atmosphere Select -->
        <select id="env-sky-select" class="select-input" style="width: 88px; height: 26px; padding: 2px 4px; font-size: 11px;" title="Environment Atmosphere & Fog">
          <option value="day">☀️ Day</option>
          <option value="sunset">🌅 Sunset</option>
          <option value="cyberpunk">🌆 Cyberpunk</option>
          <option value="foggy">🌫️ Foggy</option>
          <option value="night">🌙 Night</option>
        </select>

        <!-- Quick Post-FX Pipeline Button -->
        <button id="btn-quick-postfx" class="btn" style="background: rgba(0, 229, 255, 0.12); border-color: #00e5ff; color: #00e5ff; font-weight: 600; padding: 2px 8px; height: 26px; font-size: 11px;" title="Post-Processing FX (Bloom, Fog, Exposure)">✨ FX</button>

        <!-- Quick 3D Viewport Snapshot / Screenshot Button -->
        <button id="btn-viewport-snapshot" class="btn" style="background: rgba(168, 85, 247, 0.15); border-color: #a855f7; color: #c084fc; font-weight: 600; padding: 2px 8px; height: 26px; font-size: 11px;" title="Capture High-Res Viewport Screenshot & Save to Assets">📸 Snapshot</button>

        <!-- Undo / Redo -->
        <div style="display: flex; gap: 2px;">
          <button id="btn-undo" class="btn" title="Undo (Ctrl+Z)" style="padding: 4px 8px; font-size: 11px;">↶</button>
          <button id="btn-redo" class="btn" title="Redo (Ctrl+Y)" style="padding: 4px 8px; font-size: 11px;">↷</button>
        </div>

        <!-- Play / Simulate Button -->
        <button id="btn-play-sim" class="btn btn-primary" style="padding: 4px 12px; font-size: 11px; gap: 4px;">
          <span id="play-icon">▶</span> <span id="play-text">Play</span>
        </button>

        <!-- Standalone Publish Button -->
        <button id="btn-open-publish" class="btn btn-primary" style="padding: 4px 12px; font-size: 11px; font-weight: 700; background: linear-gradient(135deg, #ff6600, #ff3300); border: none; box-shadow: 0 0 10px rgba(255,102,0,0.4);">🚀 Publish</button>
      </div>
    `;
  }

  bindEvents() {
    this.setupDropdownMenus();
    this.setupFileActions();
    this.setupSceneActions();
    this.setupToolActions();
    this.setupSettingsActions();
    this.setupHelpActions();
    this.setupSimulation();
    this.setupAIPrompt();
    this.setupModeSwitcher();
    this.setupUndoRedo();
  }

  /**
   * Setup Dropdown Menu Bar open/close & hover interactions
   */
  setupDropdownMenus() {
    const menuBtns = this.container.querySelectorAll('.topbar-menu-btn');
    const dropdowns = this.container.querySelectorAll('.topbar-dropdown-menu');

    const closeAllMenus = () => {
      dropdowns.forEach(d => d.classList.remove('open'));
      menuBtns.forEach(b => b.classList.remove('active'));
      this.isMenuOpen = false;
    };

    menuBtns.forEach(btn => {
      const menuName = btn.dataset.menu;
      const targetDropdown = this.container.querySelector(`#menu-${menuName}`);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = targetDropdown && targetDropdown.classList.contains('open');
        closeAllMenus();
        if (!isOpen && targetDropdown) {
          targetDropdown.classList.add('open');
          btn.classList.add('active');
          this.isMenuOpen = true;
        }
      });

      btn.addEventListener('mouseenter', () => {
        if (this.isMenuOpen && targetDropdown && !targetDropdown.classList.contains('open')) {
          closeAllMenus();
          targetDropdown.classList.add('open');
          btn.classList.add('active');
          this.isMenuOpen = true;
        }
      });
    });

    // Close menus on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.topbar-menu-bar')) {
        closeAllMenus();
      }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllMenus();
      }
    });

    // Close menus when clicking any menu item
    dropdowns.forEach(d => {
      d.addEventListener('click', () => {
        closeAllMenus();
      });
    });
  }

  /**
   * File Menu Actions
   */
  setupFileActions() {
    // Import project
    const importItem = this.container.querySelector('#menu-action-import');
    if (importItem) {
      importItem.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const success = this.editor.loadSceneJSON(event.target.result);
              if (success) {
                showToast(`✨ Loaded scene from "${file.name}"!`, 'success');
              } else {
                showToast(`Failed to parse scene JSON from "${file.name}"`, 'error');
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      });
    }

    // Export project
    const exportItem = this.container.querySelector('#menu-action-export');
    if (exportItem) {
      exportItem.addEventListener('click', () => {
        const json = this.editor.exportSceneJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.editor.projectName.replace(/\s+/g, '_')}_scene.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('💾 Scene exported to JSON file', 'success');
      });
    }

    // Export Standalone HTML5 Game
    const exportHtmlItem = this.container.querySelector('#menu-action-export-html');
    if (exportHtmlItem) {
      exportHtmlItem.addEventListener('click', () => {
        try {
          const bundler = new GameBundler(this.editor);
          const html = bundler.compileStandaloneHTML({
            title: this.editor.projectName || 'MakuluLinux Game',
            author: 'MakuluLinux Studio Creator'
          });
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${(this.editor.projectName || 'Game').replace(/\s+/g, '_')}_Standalone.html`;
          a.click();
          URL.revokeObjectURL(url);
          showToast('✨ Standalone HTML5 game compiled & downloaded!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Failed to compile standalone HTML5 game', 'error');
        }
      });
    }

    // Templates Modal
    const tmplItem = this.container.querySelector('#menu-action-templates');
    if (tmplItem) {
      tmplItem.addEventListener('click', () => {
        if (this.templatesModal) this.templatesModal.open();
      });
    }

    // Publish Modal
    const pubItem = this.container.querySelector('#menu-action-publish');
    const pubBtn = this.container.querySelector('#btn-open-publish');
    const openPublish = () => {
      if (this.publishModal) this.publishModal.open();
    };
    if (pubItem) pubItem.addEventListener('click', openPublish);
    if (pubBtn) pubBtn.addEventListener('click', openPublish);
  }

  /**
   * Scene Menu Actions & Scene Selector
   */
  setupSceneActions() {
    const sceneSelect = this.container.querySelector('#top-scene-select');
    if (sceneSelect) {
      this.editor.events.on('scene:list:changed', (sceneNames) => {
        sceneSelect.innerHTML = '';
        sceneNames.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          if (name === this.editor.activeSceneName) opt.selected = true;
          sceneSelect.appendChild(opt);
        });
        const createOpt = document.createElement('option');
        createOpt.value = '__create_new__';
        createOpt.textContent = '+ New Scene...';
        sceneSelect.appendChild(createOpt);
      });

      sceneSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '__create_new__') {
          this.promptNewScene();
        } else {
          this.editor.switchScene(val);
          showToast(`Switched active scene to "${val}"`, 'info');
        }
      });
    }

    // New Scene
    const newSceneItem = this.container.querySelector('#menu-action-new-scene');
    if (newSceneItem) {
      newSceneItem.addEventListener('click', () => this.promptNewScene());
    }

    // Rename Scene
    const renameItem = this.container.querySelector('#menu-action-rename-scene');
    if (renameItem) {
      renameItem.addEventListener('click', () => {
        const current = this.editor.activeSceneName;
        const newName = prompt('Enter new name for scene:', current);
        if (newName && newName.trim() && newName.trim() !== current) {
          this.editor.renameScene(current, newName.trim());
          showToast(`Renamed scene to "${newName.trim()}"`, 'success');
        }
      });
    }

    // Duplicate Scene
    const dupItem = this.container.querySelector('#menu-action-dup-scene');
    if (dupItem) {
      dupItem.addEventListener('click', () => {
        const newName = this.editor.duplicateScene(this.editor.activeSceneName);
        showToast(`📋 Duplicated scene -> "${newName}"`, 'success');
      });
    }

    // Delete Scene
    const delItem = this.container.querySelector('#menu-action-del-scene');
    if (delItem) {
      delItem.addEventListener('click', () => {
        if (this.editor.scenes.size <= 1) {
          showToast('Cannot delete the last remaining scene in project', 'warn');
          return;
        }
        if (confirm(`Are you sure you want to delete scene "${this.editor.activeSceneName}"?`)) {
          const toDel = this.editor.activeSceneName;
          this.editor.deleteScene(toDel);
          showToast(`Deleted scene "${toDel}"`, 'info');
        }
      });
    }

    // Drop to Ground Action
    const dropGroundItem = this.container.querySelector('#menu-action-drop-ground');
    if (dropGroundItem) {
      dropGroundItem.addEventListener('click', () => {
        const active = this.editor.selection.getActive();
        if (active) {
          const pos = active.getPosition();
          const scaleY = active.getLocalScale().y;
          active.setPosition(pos.x, scaleY / 2, pos.z);
          this.editor.events.emit('entity:transformed', active);
          showToast(`⬇️ Dropped "${active.name}" to ground floor!`, 'success');
        } else {
          showToast('Select an entity in Hierarchy or 3D scene first', 'warn');
        }
      });
    }

    // Viewport Snapshot Button
    const snapshotBtn = this.container.querySelector('#btn-viewport-snapshot');
    if (snapshotBtn) {
      snapshotBtn.addEventListener('click', () => {
        const canvas = document.getElementById('viewport-canvas');
        if (canvas) {
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${(this.editor.projectName || 'Scene').replace(/\s+/g, '_')}_Snapshot_${Date.now().toString().slice(-4)}.png`;
            a.click();

            if (this.editor.assetsPanel) {
              this.editor.assetsPanel.addAsset({
                id: Date.now().toString(),
                name: `Snapshot_${Date.now().toString().slice(-4)}.png`,
                type: 'textures',
                icon: '🖼️',
                size: '180 KB',
                url: dataUrl,
                base64Data: dataUrl
              });
            }
            showToast('📸 High-Res 3D Viewport Snapshot Captured & Added to Assets!', 'success');
          } catch (err) {
            showToast('Could not capture viewport screenshot', 'error');
          }
        }
      });
    }

    // Atmosphere presets in Scene menu
    const skyItems = this.container.querySelectorAll('[data-sky]');
    skyItems.forEach(item => {
      item.addEventListener('click', () => {
        const sky = item.dataset.sky;
        if (this.editor.runtime) {
          this.editor.runtime.setAtmosphere(sky);
          const envSelect = this.container.querySelector('#env-sky-select');
          if (envSelect) envSelect.value = sky;
          showToast(`🌌 Atmosphere updated to ${item.textContent.trim()}`, 'info');
        }
      });
    });

    // Quick Atmosphere select dropdown
    const envSelect = this.container.querySelector('#env-sky-select');
    if (envSelect) {
      envSelect.addEventListener('change', (e) => {
        if (this.editor.runtime) {
          this.editor.runtime.setAtmosphere(e.target.value);
          showToast(`🌌 Atmosphere updated to ${e.target.options[e.target.selectedIndex].text}`, 'info');
        }
      });
    }

    // Camera projection in Scene menu
    const camItems = this.container.querySelectorAll('[data-cam]');
    camItems.forEach(item => {
      item.addEventListener('click', () => {
        const proj = item.dataset.cam;
        if (this.editor.runtime && this.editor.runtime.editorCamera) {
          this.editor.runtime.editorCamera.setProjection(proj);
          showToast(`Camera view: ${proj === 'ortho' ? 'Orthographic' : 'Perspective'}`, 'info');
        }
      });
    });
  }

  promptNewScene() {
    const name = prompt('Enter new scene name:', 'Level_2');
    if (name && name.trim()) {
      const cleanName = name.trim();
      this.editor.switchScene(cleanName);
      showToast(`✨ Created and switched to scene "${cleanName}"!`, 'success');
    } else {
      const sceneSelect = this.container.querySelector('#top-scene-select');
      if (sceneSelect) sceneSelect.value = this.editor.activeSceneName;
    }
  }

  /**
   * Tools Menu Actions
   */
  setupToolActions() {
    // 2D HUD UI Designer
    const hudItem = this.container.querySelector('#menu-action-hud');
    if (hudItem) {
      hudItem.addEventListener('click', () => {
        if (this.hudModal) this.hudModal.open();
      });
    }

    // Procedural Audio Synth Studio
    const sfxItem = this.container.querySelector('#menu-action-sfx-studio');
    if (sfxItem) {
      sfxItem.addEventListener('click', () => {
        if (this.extraModals && this.extraModals.sfxStudioModal) {
          this.extraModals.sfxStudioModal.open();
        }
      });
    }

    // Animation Timeline Sequencer
    const tlItem = this.container.querySelector('#menu-action-timeline');
    if (tlItem) {
      tlItem.addEventListener('click', () => {
        if (this.timelinePanel) this.timelinePanel.toggle();
      });
    }

    // Visual Animation Blend Graph
    const animBlendItem = this.container.querySelector('#menu-action-anim-blend');
    if (animBlendItem) {
      animBlendItem.addEventListener('click', () => {
        if (this.extraModals && this.extraModals.animBlendModal) {
          this.extraModals.animBlendModal.open();
        }
      });
    }

    // Post-Processing FX Pipeline
    const fxItem = this.container.querySelector('#menu-action-postfx');
    const quickFxBtn = this.container.querySelector('#btn-quick-postfx');
    const openFX = () => {
      if (this.postProcessingModal) this.postProcessingModal.open();
    };
    if (fxItem) fxItem.addEventListener('click', openFX);
    if (quickFxBtn) quickFxBtn.addEventListener('click', openFX);

    // 3D Model Store
    const modelStoreItem = this.container.querySelector('#menu-action-model-store');
    if (modelStoreItem) {
      modelStoreItem.addEventListener('click', () => {
        if (this.extraModals.modelStore) this.extraModals.modelStore.open();
      });
    }

    // Terrain Sculptor
    const terrainItem = this.container.querySelector('#menu-action-terrain');
    if (terrainItem) {
      terrainItem.addEventListener('click', () => {
        if (this.extraModals.terrainModal) this.extraModals.terrainModal.open();
      });
    }

    // Material Studio
    const matItem = this.container.querySelector('#menu-action-material');
    if (matItem) {
      matItem.addEventListener('click', () => {
        if (this.extraModals.materialModal) this.extraModals.materialModal.open();
      });
    }

    // Shader Graph Editor
    const shaderGraphItem = this.container.querySelector('#menu-action-shader-graph');
    if (shaderGraphItem) {
      shaderGraphItem.addEventListener('click', () => {
        if (this.extraModals.shaderGraphModal) this.extraModals.shaderGraphModal.open();
      });
    }

    // Script Code Studio
    const codeItem = this.container.querySelector('#menu-action-code');
    if (codeItem) {
      codeItem.addEventListener('click', () => {
        if (this.extraModals.codeEditor) this.extraModals.codeEditor.open();
      });
    }

    // Visual Flow Graph
    const flowItem = this.container.querySelector('#menu-action-flow-graph');
    if (flowItem) {
      flowItem.addEventListener('click', () => {
        if (this.extraModals.flowGraphModal) this.extraModals.flowGraphModal.open();
      });
    }

    // Physics Joint Studio
    const jointItem = this.container.querySelector('#menu-action-physics-joint');
    if (jointItem) {
      jointItem.addEventListener('click', () => {
        if (this.extraModals.physicsJointModal) this.extraModals.physicsJointModal.open();
      });
    }

    // HDRI Skybox Studio
    const hdriItem = this.container.querySelector('#menu-action-hdri-studio');
    const hdriSkyItem = this.container.querySelector('#menu-action-hdri-skybox');
    const openHDRI = () => {
      if (this.extraModals.hdriStudioModal) this.extraModals.hdriStudioModal.open();
    };
    if (hdriItem) hdriItem.addEventListener('click', openHDRI);
    if (hdriSkyItem) hdriSkyItem.addEventListener('click', openHDRI);

    // Console & Diagnostics
    const consoleItem = this.container.querySelector('#menu-action-console');
    if (consoleItem) {
      consoleItem.addEventListener('click', () => {
        this.editor.events.emit('console:toggle');
      });
    }
  }

  /**
   * Settings Menu Actions
   */
  setupSettingsActions() {
    const aiSetItem = this.container.querySelector('#menu-action-ai-settings');
    if (aiSetItem) {
      aiSetItem.addEventListener('click', () => {
        if (this.aiSettingsModal) this.aiSettingsModal.open();
      });
    }

    const projSetItem = this.container.querySelector('#menu-action-proj-settings');
    if (projSetItem) {
      projSetItem.addEventListener('click', () => {
        if (this.projectSettingsModal) this.projectSettingsModal.open();
      });
    }
  }

  /**
   * Help Menu Actions
   */
  setupHelpActions() {
    const guideItem = this.container.querySelector('#menu-action-guide');
    if (guideItem) {
      guideItem.addEventListener('click', () => {
        if (this.guideModal) this.guideModal.open();
      });
    }

    const helpItem = this.container.querySelector('#menu-action-help');
    if (helpItem) {
      helpItem.addEventListener('click', () => {
        if (this.helpModal) this.helpModal.open();
      });
    }

    const webItem = this.container.querySelector('#menu-action-website');
    if (webItem) {
      webItem.addEventListener('click', () => {
        window.open('https://www.makululinux.org', '_blank');
      });
    }

    const ghItem = this.container.querySelector('#menu-action-github');
    if (ghItem) {
      ghItem.addEventListener('click', () => {
        window.open('https://github.com/raymerjacque/Makulu-Game-Studio', '_blank');
      });
    }
  }

  /**
   * Simulation Play/Stop
   */
  setupSimulation() {
    const playBtn = this.container.querySelector('#btn-play-sim');
    const playIcon = this.container.querySelector('#play-icon');
    const playText = this.container.querySelector('#play-text');
    if (!playBtn) return;

    playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.editor.isPlaying = this.isPlaying;
      let banner = document.getElementById('simulation-banner');

      if (this.isPlaying) {
        playBtn.style.background = '#ef4444';
        playBtn.style.borderColor = '#ef4444';
        playIcon.textContent = '⏹';
        playText.textContent = 'Stop';

        // Add visual banner over 3D Viewport
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'simulation-banner';
          banner.style.cssText = `
            position: absolute;
            top: 14px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.95);
            border: 1px solid #34d399;
            color: #fff;
            padding: 6px 18px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
            z-index: 50;
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: 8px;
          `;
          banner.innerHTML = `<span style="animation: pulse 1s infinite;">🟢</span> <span>GAME SIMULATION RUNNING — Press WASD to Move</span>`;
          const vp = document.getElementById('viewport-container');
          if (vp) vp.appendChild(banner);
        }

        // Hide gizmos during simulation so handles don't clutter the player
        if (this.editor.runtime && this.editor.runtime.gizmoManager) {
          this.editor.runtime.gizmoManager.updateGizmoVisibility();
        }

        // Focus canvas so key presses are registered immediately
        if (this.editor.runtime && this.editor.runtime.canvas) {
          this.editor.runtime.canvas.focus();
        }

        this.editor.events.emit('game:play');
        showToast('▶ Game Simulation Active! Use WASD to control objects.', 'success');
      } else {
        playBtn.style.background = 'var(--accent-orange)';
        playBtn.style.borderColor = 'var(--accent-orange)';
        playIcon.textContent = '▶';
        playText.textContent = 'Play';

        if (banner) banner.remove();

        this.editor.events.emit('game:stop');

        // Restore gizmo visibility after simulation
        if (this.editor.runtime && this.editor.runtime.gizmoManager) {
          this.editor.runtime.gizmoManager.updateGizmoVisibility();
        }

        showToast('⏹ Simulation Stopped. Back to Editor mode.', 'info');
      }
    });
  }

  /**
   * AI Copilot Quick Prompt
   */
  setupAIPrompt() {
    const promptInput = this.container.querySelector('#top-quick-prompt');
    const promptSubmit = this.container.querySelector('#top-quick-submit');
    if (!promptInput || !promptSubmit) return;

    const submitPrompt = () => {
      const text = promptInput.value.trim();
      if (!text || promptInput.disabled) return;
      promptInput.value = '';
      if (this.aiController) {
        this.aiController.sendUserPrompt(text);
      }
    };

    promptSubmit.addEventListener('click', submitPrompt);
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitPrompt();
    });
  }

  /**
   * Toggle visual busy state for topbar quick prompt
   */
  setAIBusy(isBusy, status = 'AI is busy...') {
    const wrap = this.container.querySelector('.quick-prompt-wrap');
    const promptInput = this.container.querySelector('#top-quick-prompt');
    const icon = this.container.querySelector('.quick-prompt-icon');
    if (!wrap || !promptInput) return;

    if (isBusy) {
      wrap.classList.add('is-busy');
      promptInput.disabled = true;
      if (!promptInput.hasAttribute('data-orig-placeholder')) {
        promptInput.setAttribute('data-orig-placeholder', promptInput.placeholder || 'Ask AI Copilot...');
      }
      promptInput.placeholder = `⚡ ${status}`;
      if (icon) icon.classList.add('spin-anim');
    } else {
      wrap.classList.remove('is-busy');
      promptInput.disabled = false;
      const orig = promptInput.getAttribute('data-orig-placeholder') || 'Ask AI Copilot...';
      promptInput.placeholder = orig;
      if (icon) icon.classList.remove('spin-anim');
    }
  }

  /**
   * Simple Mode vs Pro Mode
   */
  setupModeSwitcher() {
    const modeBtns = this.container.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.editor.setEditorMode(mode);
        showToast(
          mode === 'simple' ? '🌱 Switched to Simple Novice Mode' : '⚡ Switched to Pro Technical ECS Mode',
          'success'
        );
      });
    });
  }

  /**
   * Undo / Redo
   */
  setupUndoRedo() {
    const btnUndo = this.container.querySelector('#btn-undo');
    const btnRedo = this.container.querySelector('#btn-redo');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        this.editor.commandBus.undo();
        showToast('↶ Action Undone', 'info');
      });
    }
    if (btnRedo) {
      btnRedo.addEventListener('click', () => {
        this.editor.commandBus.redo();
        showToast('↷ Action Redone', 'info');
      });
    }
  }
}
