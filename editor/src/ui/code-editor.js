/**
 * Built-in PlayCanvas Script Code Editor
 */
export class CodeEditorModal {
  constructor(editor, aiUI) {
    this.editor = editor;
    this.aiUI = aiUI;
    this.currentScriptName = null;
    this.isOpen = false;

    this.render();
    this.bindEvents();
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'code-editor-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    this.modal.innerHTML = `
      <div style="width: 840px; height: 600px; background: var(--bg-darkest); border: 1px solid var(--border-highlight); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Code Editor Header -->
        <div style="height: 42px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px;">📜</span>
            <span id="code-script-title" style="font-weight: 700; font-size: 13px; color: var(--text-primary);">script.js</span>
            <span style="font-size: 10px; background: rgba(255,102,0,0.15); color: var(--accent-orange); padding: 2px 6px; border-radius: 4px; font-weight: 600;">PlayCanvas Script</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <!-- Template Selector -->
            <select id="code-template-select" class="select-input" style="width: 140px; height: 26px; padding: 2px 6px; font-size: 11px;">
              <option value="">⚡ Insert Template...</option>
              <option value="rotate">Spin / Rotator</option>
              <option value="wasd">WASD Movement</option>
              <option value="flicker">Flicker Light</option>
              <option value="follow">Follow Camera</option>
              <option value="health">Health & Damage</option>
              <option value="interactor">Proximity Trigger</option>
              <option value="enemy">Enemy Chase AI</option>
            </select>

            <button id="code-btn-ask-ai" class="btn" style="background: rgba(255,102,0,0.2); border-color: var(--accent-orange); color: var(--accent-orange); font-size: 11px; padding: 4px 8px;">✨ Ask AI to Code</button>
            <button id="code-btn-save" class="btn btn-primary" style="font-size: 11px; padding: 4px 12px;">💾 Save & Compile</button>
            <button id="code-btn-close" class="btn" style="font-size: 11px; padding: 4px 8px;">✕</button>
          </div>
        </div>

        <!-- Code Editor Area -->
        <div style="flex: 1; display: flex; position: relative;">
          <!-- Line Numbers -->
          <div id="code-line-numbers" style="width: 44px; background: var(--bg-darker); border-right: 1px solid var(--border-subtle); padding: 12px 6px; text-align: right; color: var(--text-muted); font-family: var(--font-mono); font-size: 12px; line-height: 1.6; user-select: none;">
            1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>10<br>11<br>12<br>13<br>14<br>15<br>16<br>17<br>18<br>19<br>20
          </div>

          <!-- Code Textarea -->
          <textarea id="code-textarea" spellcheck="false" style="
            flex: 1;
            background: var(--bg-darkest);
            border: none;
            outline: none;
            color: #e2e8f0;
            font-family: var(--font-mono);
            font-size: 12px;
            line-height: 1.6;
            padding: 12px 16px;
            resize: none;
            white-space: pre;
            tab-size: 2;
          "></textarea>
        </div>

        <!-- Status Bar -->
        <div style="height: 26px; background: var(--bg-darker); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: var(--text-muted);">
          <span>JavaScript (ES6) | UTF-8</span>
          <span id="code-status-msg" style="color: var(--accent-green);">● Ready</span>
        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#code-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    // Close on clicking backdrop
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Close on pressing Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Save & Compile button
    const saveBtn = this.modal.querySelector('#code-btn-save');
    const textarea = this.modal.querySelector('#code-textarea');
    const statusMsg = this.modal.querySelector('#code-status-msg');

    saveBtn.addEventListener('click', () => {
      const code = textarea.value;
      if (this.currentScriptName) {
        this.editor.scripts.set(this.currentScriptName, code);
        statusMsg.textContent = `✓ Compiled & saved at ${new Date().toLocaleTimeString()}`;
        statusMsg.style.color = 'var(--accent-green)';
        setTimeout(() => {
          this.close();
        }, 600);
      }
    });

    // Template Selector
    const tmplSelect = this.modal.querySelector('#code-template-select');
    tmplSelect.addEventListener('change', () => {
      const val = tmplSelect.value;
      if (val && this.templates[val]) {
        textarea.value = this.templates[val];
        this.updateLineNumbers();
        tmplSelect.value = '';
      }
    });

    // Ask AI to code
    const askAiBtn = this.modal.querySelector('#code-btn-ask-ai');
    askAiBtn.addEventListener('click', () => {
      const prompt = prompt('What script logic would you like the AI to write?', 'Make this object smoothly rotate on its Y axis and bounce up and down');
      if (prompt && this.aiUI) {
        this.close();
        this.aiUI.sendUserPrompt(`Write a PlayCanvas script: ${prompt}`);
      }
    });

    // Line number updates on typing
    textarea.addEventListener('input', () => this.updateLineNumbers());
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    });
  }

  updateLineNumbers() {
    const textarea = this.modal.querySelector('#code-textarea');
    const lineNumbers = this.modal.querySelector('#code-line-numbers');
    const lines = textarea.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= Math.max(lines, 20); i++) {
      numbers += `${i}<br>`;
    }
    lineNumbers.innerHTML = numbers;
  }

  open(scriptName = 'customScript.js', initialCode = null) {
    this.currentScriptName = scriptName;
    const title = this.modal.querySelector('#code-script-title');
    title.textContent = scriptName;

    const textarea = this.modal.querySelector('#code-textarea');
    textarea.value = initialCode || this.editor.scripts.get(scriptName) || this.templates.rotate;

    this.updateLineNumbers();
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }

  templates = {
    rotate: `// PlayCanvas Object Spinner Script
var RotateScript = pc.createScript('rotateScript');

RotateScript.attributes.add('speed', { type: 'number', default: 30, title: 'Speed (deg/s)' });
RotateScript.attributes.add('axis', { type: 'string', default: 'y', title: 'Axis (x, y, z)' });

RotateScript.prototype.update = function(dt) {
    var s = this.speed * dt;
    if (this.axis === 'x') this.entity.rotate(s, 0, 0);
    else if (this.axis === 'y') this.entity.rotate(0, s, 0);
    else if (this.axis === 'z') this.entity.rotate(0, 0, s);
};`,

    wasd: `// PlayCanvas WASD Character Controller
var PlayerMovement = pc.createScript('playerMovement');

PlayerMovement.attributes.add('speed', { type: 'number', default: 8, title: 'Speed' });
PlayerMovement.attributes.add('jumpForce', { type: 'number', default: 5, title: 'Jump Force' });

PlayerMovement.prototype.initialize = function() {
    this.pos = new pc.Vec3();
};

PlayerMovement.prototype.update = function(dt) {
    var move = new pc.Vec3();
    var app = this.app;

    if (app.keyboard.isPressed(pc.KEY_W)) move.add(this.entity.forward);
    if (app.keyboard.isPressed(pc.KEY_S)) move.sub(this.entity.forward);
    if (app.keyboard.isPressed(pc.KEY_A)) move.sub(this.entity.right);
    if (app.keyboard.isPressed(pc.KEY_D)) move.add(this.entity.right);

    if (move.lengthSq() > 0) {
        move.normalize().mulScalar(this.speed * dt);
        this.entity.translate(move);
    }
};`,

    flicker: `// PlayCanvas Light Flicker Script
var LightFlicker = pc.createScript('lightFlicker');

LightFlicker.attributes.add('baseIntensity', { type: 'number', default: 2.0 });
LightFlicker.attributes.add('variance', { type: 'number', default: 0.5 });

LightFlicker.prototype.update = function(dt) {
    if (this.entity.light) {
        var noise = (Math.random() - 0.5) * this.variance;
        this.entity.light.intensity = Math.max(0.1, this.baseIntensity + noise);
    }
};`,

    follow: `// PlayCanvas Follow Camera
var FollowCamera = pc.createScript('followCamera');

FollowCamera.attributes.add('target', { type: 'entity', title: 'Target Entity' });
FollowCamera.attributes.add('distance', { type: 'number', default: 6 });
FollowCamera.attributes.add('height', { type: 'number', default: 2.5 });

FollowCamera.prototype.postUpdate = function(dt) {
    if (!this.target) return;
    var targetPos = this.target.getPosition();
    var camPos = targetPos.clone().sub(this.target.forward.clone().mulScalar(this.distance));
    camPos.y += this.height;
    this.entity.setPosition(camPos);
    this.entity.lookAt(targetPos);
};`,

    health: `// PlayCanvas Character Health Component
var HealthSystem = pc.createScript('healthSystem');

HealthSystem.attributes.add('maxHp', { type: 'number', default: 100, title: 'Max HP' });
HealthSystem.attributes.add('currentHp', { type: 'number', default: 100, title: 'Current HP' });

HealthSystem.prototype.takeDamage = function(amount) {
    this.currentHp = Math.max(0, this.currentHp - amount);
    if (this.currentHp <= 0) {
        this.entity.enabled = false;
    }
};`,

    interactor: `// PlayCanvas Proximity Trigger Interactor
var ProximityTrigger = pc.createScript('proximityTrigger');

ProximityTrigger.attributes.add('radius', { type: 'number', default: 2.5, title: 'Radius' });

ProximityTrigger.prototype.update = function(dt) {
    var player = this.app.root.findByName('Player');
    if (player) {
        var dist = this.entity.getPosition().distance(player.getPosition());
        if (dist <= this.radius) {
            // Trigger interactive action
        }
    }
};`,

    enemy: `// PlayCanvas Hostile Enemy Chase AI
var EnemyAI = pc.createScript('enemyAI');

EnemyAI.attributes.add('speed', { type: 'number', default: 3.5, title: 'Chase Speed' });
EnemyAI.attributes.add('detectRadius', { type: 'number', default: 12.0, title: 'Detection Radius' });

EnemyAI.prototype.update = function(dt) {
    var player = this.app.root.findByName('Player');
    if (player) {
        var pos = this.entity.getPosition();
        var targetPos = player.getPosition();
        var dist = pos.distance(targetPos);
        if (dist <= this.detectRadius && dist > 1.2) {
            this.entity.lookAt(new pc.Vec3(targetPos.x, pos.y, targetPos.z));
            this.entity.translateLocal(0, 0, -this.speed * dt);
        }
    }
};`
  };
}
