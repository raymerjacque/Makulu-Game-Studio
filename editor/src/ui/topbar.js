import { showToast } from './toast.js';

/**
 * Top Navigation Bar
 */
export class TopBar {
  constructor(container, editor, aiController, templatesModal = null, publishModal = null, helpModal = null, guideModal = null, aiSettingsModal = null, projectSettingsModal = null, postProcessingModal = null, timelinePanel = null) {
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
    this.isPlaying = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 26px; height: 26px; background: linear-gradient(135deg, #ff6600, #ff3300); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: #fff; box-shadow: 0 0 10px rgba(255,102,0,0.4);">M</div>
          <span style="font-weight: 700; font-size: 13px; color: var(--text-primary); letter-spacing: -0.2px;">MakuluLinux <span style="color: var(--accent-orange); font-weight: 600;">Studio</span></span>
        </div>

        <div style="height: 18px; width: 1px; background: var(--border-subtle); margin: 0 4px;"></div>

        <!-- Scene Picker, Templates, Guide, Help, AI Settings -->
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary);">
          <span>Scene:</span>
          <select id="top-scene-select" class="select-input" style="width: 110px; padding: 2px 6px; height: 26px;">
            <option value="Main Scene">Main Scene</option>
            <option value="__create_new__">+ New Scene...</option>
          </select>
          <button id="btn-open-templates" class="btn" style="background: rgba(255,102,0,0.18); border-color: var(--accent-orange); color: var(--accent-orange); font-weight: 600; padding: 3px 8px; font-size: 11px;" title="1-Click Genre Starter Templates">🎮 Templates</button>
          <button id="btn-open-timeline" class="btn" style="background: rgba(251, 146, 60, 0.16); border-color: #fb923c; color: #fb923c; font-weight: 600; padding: 3px 8px; font-size: 11px;" title="Animation Timeline & Keyframe Sequencer">🎬 Timeline</button>
          <button id="btn-open-guide" class="btn" style="background: rgba(0, 229, 255, 0.16); border-color: #00e5ff; color: #00e5ff; font-weight: 600; padding: 3px 8px; font-size: 11px;" title="Beginner's Step-by-Step Game Creation Masterclass">📖 Guide</button>
          <button id="btn-open-help" class="btn" style="background: rgba(168, 85, 247, 0.16); border-color: #c084fc; color: #c084fc; font-weight: 600; padding: 3px 8px; font-size: 11px;" title="Editor Overview, Navigation Controls & Hotkeys">❓ Help</button>
          <button id="btn-open-ai-settings" class="btn" style="background: rgba(255, 102, 0, 0.16); border-color: var(--accent-orange); color: var(--accent-orange); font-weight: 600; padding: 3px 8px; font-size: 11px;" title="Configure AI Providers (OpenAI, Gemini, Claude, Groq, Kimi...)">⚙️ AI Settings</button>
          <button id="btn-open-proj-settings" class="btn" style="background: rgba(34, 197, 94, 0.16); border-color: #22c55e; color: #4ade80; font-weight: 600; padding: 3px 8px; font-size: 11px;" title="Project & Physics Settings (Gravity, Tone Mapping, Shadows)">⚙️ Project</button>
        </div>

        <!-- Mode Switcher (Simple vs Pro) -->
        <div class="mode-switch" id="mode-switcher">
          <button class="mode-btn ${this.editor.mode === 'simple' ? 'active' : ''}" data-mode="simple">🌱 Simple Mode</button>
          <button class="mode-btn ${this.editor.mode === 'pro' ? 'active' : ''}" data-mode="pro">⚡ Pro Mode</button>
        </div>
      </div>

      <!-- Quick AI Prompt Bar -->
      <div class="quick-prompt-wrap">
        <span class="quick-prompt-icon">✨</span>
        <input type="text" id="top-quick-prompt" class="quick-prompt-input" placeholder="Ask AI: 'Create a medieval arena with 6 pillars' or 'Make a neon light'..." />
        <button id="top-quick-submit" class="quick-prompt-submit" title="Send to AI Copilot">↵</button>
      </div>

      <!-- Right Action Controls -->
      <div style="display: flex; align-items: center; gap: 8px;">
        <!-- Atmosphere Sky & Camera Select -->
        <select id="env-sky-select" class="select-input" style="width: 100px; height: 26px; padding: 2px 4px; font-size: 11px;" title="Environment Atmosphere & Fog">
          <option value="day">☀️ Clear Day</option>
          <option value="sunset">🌅 Sunset</option>
          <option value="cyberpunk">🌆 Cyberpunk</option>
          <option value="foggy">🌫️ Foggy Valley</option>
          <option value="night">🌙 Night</option>
        </select>
        <button id="btn-open-postfx" class="btn" style="background: rgba(0, 229, 255, 0.16); border-color: #00e5ff; color: #00e5ff; font-weight: 600; padding: 2px 8px; height: 26px; font-size: 11px;" title="Post-Processing & Render Pipeline FX (Bloom, Fog, Exposure)">✨ FX</button>

        <select id="camera-view-select" class="select-input" style="width: 105px; height: 26px; padding: 2px 4px; font-size: 11px;">
          <option value="persp">Perspective</option>
          <option value="ortho">Orthographic</option>
        </select>

        <!-- Undo / Redo -->
        <button id="btn-undo" class="btn" title="Undo (Ctrl+Z)" style="padding: 4px 8px; font-size: 11px;">↶</button>
        <button id="btn-redo" class="btn" title="Redo (Ctrl+Y)" style="padding: 4px 8px; font-size: 11px;">↷</button>

        <!-- Play / Simulate Button -->
        <button id="btn-play-sim" class="btn btn-primary" style="padding: 4px 12px; font-size: 11px; gap: 4px;">
          <span id="play-icon">▶</span> <span id="play-text">Play</span>
        </button>

        <!-- Save & Load Project -->
        <button id="btn-import-project" class="btn" style="padding: 4px 10px; font-size: 11px;">📂 Import</button>
        <button id="btn-save-project" class="btn" style="padding: 4px 10px; font-size: 11px;">💾 Export</button>
        <button id="btn-open-publish" class="btn btn-primary" style="padding: 4px 12px; font-size: 11px; font-weight: 700; background: linear-gradient(135deg, #ff6600, #ff3300); border: none; box-shadow: 0 0 10px rgba(255,102,0,0.4);">🚀 Publish</button>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Open Templates
    const tmplBtn = this.container.querySelector('#btn-open-templates');
    if (tmplBtn) {
      tmplBtn.addEventListener('click', () => {
        if (this.templatesModal) this.templatesModal.open();
      });
    }

    // Open Guide
    const guideBtn = this.container.querySelector('#btn-open-guide');
    if (guideBtn) {
      guideBtn.addEventListener('click', () => {
        if (this.guideModal) this.guideModal.open();
      });
    }

    // Open Help
    const helpBtn = this.container.querySelector('#btn-open-help');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        if (this.helpModal) this.helpModal.open();
      });
    }

    // Scene Selector
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
          const name = prompt('Enter new scene name:', 'Level_2');
          if (name && name.trim()) {
            const cleanName = name.trim();
            this.editor.switchScene(cleanName);
            // Add option to select
            const opt = document.createElement('option');
            opt.value = cleanName;
            opt.textContent = cleanName;
            sceneSelect.insertBefore(opt, sceneSelect.lastElementChild);
            sceneSelect.value = cleanName;
            showToast(`✨ Created and switched to scene "${cleanName}"!`, 'success');
          } else {
            sceneSelect.value = this.editor.activeSceneName;
          }
        } else {
          this.editor.switchScene(val);
          showToast(`Switched active scene to "${val}"`, 'info');
        }
      });
    }

    // Open AI Settings
    const aiSettingsBtn = this.container.querySelector('#btn-open-ai-settings');
    if (aiSettingsBtn) {
      aiSettingsBtn.addEventListener('click', () => {
        if (this.aiSettingsModal) this.aiSettingsModal.open();
      });
    }

    // Mode switcher buttons
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

    // Undo / Redo
    const btnUndo = this.container.querySelector('#btn-undo');
    const btnRedo = this.container.querySelector('#btn-redo');
    btnUndo.addEventListener('click', () => {
      this.editor.commandBus.undo();
      showToast('↶ Action Undone', 'info');
    });
    btnRedo.addEventListener('click', () => {
      this.editor.commandBus.redo();
      showToast('↷ Action Redone', 'info');
    });

    // Environment Sky Atmosphere select
    const envSelect = this.container.querySelector('#env-sky-select');
    if (envSelect) {
      envSelect.addEventListener('change', (e) => {
        if (this.editor.runtime) {
          this.editor.runtime.setAtmosphere(e.target.value);
          showToast(`🌌 Atmosphere updated to ${e.target.options[e.target.selectedIndex].text}`, 'info');
        }
      });
    }

    // Camera view select
    const camSelect = this.container.querySelector('#camera-view-select');
    camSelect.addEventListener('change', (e) => {
      if (this.editor.runtime && this.editor.runtime.editorCamera) {
        this.editor.runtime.editorCamera.setProjection(e.target.value);
        showToast(`Camera view: ${e.target.value === 'ortho' ? 'Orthographic' : 'Perspective'}`, 'info');
      }
    });

    // Quick AI prompt bar
    const promptInput = this.container.querySelector('#top-quick-prompt');
    const promptSubmit = this.container.querySelector('#top-quick-submit');

    const submitPrompt = () => {
      const text = promptInput.value.trim();
      if (!text) return;
      promptInput.value = '';
      if (this.aiController) {
        this.aiController.sendUserPrompt(text);
      }
    };

    promptSubmit.addEventListener('click', submitPrompt);
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitPrompt();
    });

    // Play simulation button
    const playBtn = this.container.querySelector('#btn-play-sim');
    const playIcon = this.container.querySelector('#play-icon');
    const playText = this.container.querySelector('#play-text');

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
          document.getElementById('viewport-container').appendChild(banner);
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

    // Timeline panel button
    const tlBtn = this.container.querySelector('#btn-open-timeline');
    if (tlBtn) {
      tlBtn.addEventListener('click', () => {
        if (this.timelinePanel) this.timelinePanel.toggle();
      });
    }

    // Post-Processing FX modal button
    const fxBtn = this.container.querySelector('#btn-open-postfx');
    if (fxBtn) {
      fxBtn.addEventListener('click', () => {
        if (this.postProcessingModal) this.postProcessingModal.open();
      });
    }

    // Project Settings modal button
    const projBtn = this.container.querySelector('#btn-open-proj-settings');
    if (projBtn) {
      projBtn.addEventListener('click', () => {
        if (this.projectSettingsModal) this.projectSettingsModal.open();
      });
    }

    // Publish modal button
    const publishBtn = this.container.querySelector('#btn-open-publish');
    if (publishBtn) {
      publishBtn.addEventListener('click', () => {
        if (this.publishModal) this.publishModal.open();
      });
    }

    // Import project button
    const importBtn = this.container.querySelector('#btn-import-project');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
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

    // Save project button
    const saveBtn = this.container.querySelector('#btn-save-project');
    saveBtn.addEventListener('click', () => {
      const json = this.editor.exportSceneJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.editor.projectName.replace(/\s+/g, '_')}_scene.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
