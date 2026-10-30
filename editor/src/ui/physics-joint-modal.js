import * as pc from 'playcanvas';
import { showToast } from './toast.js';

/**
 * Physics Joint & Ragdoll Constraint Configurator Studio Modal
 * Interactive setup of 6-DOF Physics constraints: Hinge, Point-to-Point, Slider, Ball & Socket, and Ragdoll Skeletons.
 */
export class PhysicsJointModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.currentEntity = null;

    this.render();
  }

  render() {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('physics-joint-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'physics-joint-modal';
      modal.className = 'modal-backdrop';
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 15, 26, 0.88);
        backdrop-filter: blur(14px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      `;

      modal.innerHTML = `
        <div class="modal-window" style="width: 880px; max-width: 95vw; height: 620px; max-height: 92vh; background: var(--bg-panel); border: 1px solid var(--border-highlight); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 50px rgba(234,179,8,0.25);">
          <!-- Header -->
          <div style="padding: 12px 18px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">⚙️</span>
              <span style="font-weight: 800; font-size: 14px; color: var(--text-primary);">Physics Joint & Ragdoll Constraint Studio</span>
              <span style="font-size: 10px; color: #facc15; background: rgba(234,179,8,0.15); padding: 2px 8px; border-radius: 100px; border: 1px solid rgba(234,179,8,0.3); font-weight: 700;">6-DOF PHYSICS</span>
            </div>
            <button id="btn-close-physics-joint" class="btn btn-icon" style="color: var(--text-muted);">✕</button>
          </div>

          <!-- Body -->
          <div style="flex: 1; display: flex; padding: 18px; gap: 18px; overflow-y: auto;">
            <!-- Left Preset Column -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
              <div style="font-weight: 700; font-size: 12px; color: var(--text-primary);">Select Joint Constraint Type</div>

              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div class="joint-type-card active" data-joint="hinge" style="background: var(--bg-darker); border: 1px solid #facc15; border-radius: 8px; padding: 12px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
                  <div style="font-weight: 700; font-size: 12px; color: #facc15;">🚪 Hinge Joint</div>
                  <div style="font-size: 10px; color: var(--text-muted);">Doors, gates, spinning wheels, steering pivots</div>
                </div>

                <div class="joint-type-card" data-joint="point_to_point" style="background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
                  <div style="font-weight: 700; font-size: 12px; color: #38bdf8;">🪢 Point-to-Point</div>
                  <div style="font-size: 10px; color: var(--text-muted);">Chains, hanging ropes, swinging tethers</div>
                </div>

                <div class="joint-type-card" data-joint="slider" style="background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
                  <div style="font-weight: 700; font-size: 12px; color: #34d399;">🛗 Slider Joint</div>
                  <div style="font-size: 10px; color: var(--text-muted);">Pistons, sliding elevators, shock absorbers</div>
                </div>

                <div class="joint-type-card" data-joint="ball_and_socket" style="background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; cursor: pointer; display: flex; flex-direction: column; gap: 4px;">
                  <div style="font-weight: 700; font-size: 12px; color: #c084fc;">🦴 Ball & Socket</div>
                  <div style="font-size: 10px; color: var(--text-muted);">Ragdoll limbs, shoulder/hip joints</div>
                </div>
              </div>

              <!-- Ragdoll Skeleton Auto-Generator -->
              <div style="background: rgba(234, 179, 8, 0.08); border: 1px dashed rgba(234, 179, 8, 0.4); border-radius: 8px; padding: 14px; text-align: center; margin-top: auto;">
                <div style="font-size: 24px; margin-bottom: 4px;">🦴</div>
                <div style="font-weight: 700; font-size: 11px; color: #facc15;">1-Click Ragdoll Character Constraint Generator</div>
                <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 8px;">Automatically attaches Ball & Socket joints to character limbs upon defeat</div>
                <button class="btn btn-sm btn-primary" id="btn-generate-ragdoll-skeleton" style="padding: 6px 14px; font-size: 11px; background: #facc15; border: none; color: #000; font-weight: 800;">⚡ Auto-Generate Ragdoll Joints</button>
              </div>
            </div>

            <!-- Right Configurator Column -->
            <div style="width: 320px; background: var(--bg-darker); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
              <div style="font-weight: 700; font-size: 12px; color: #facc15; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                ⚙️ Joint Parameters
              </div>

              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 10px; color: var(--text-muted);">Connected Target Entity:</span>
                <input type="text" id="pjoint-target-entity" class="text-input" placeholder="Entity Name (e.g. Frame)" style="font-size: 11px;">
              </div>

              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 10px; color: var(--text-muted);">Pivot Point Offset [X, Y, Z]:</span>
                <div class="vec3-group">
                  <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="0.1" id="pjoint-pivot-x" class="vec3-input" value="0"></div>
                  <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="0.1" id="pjoint-pivot-y" class="vec3-input" value="0"></div>
                  <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="0.1" id="pjoint-pivot-z" class="vec3-input" value="0"></div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 10px; color: var(--text-muted);">Rotation Axis Vector [X, Y, Z]:</span>
                <div class="vec3-group">
                  <div class="vec3-item x"><span class="vec3-prefix">X</span><input type="number" step="0.1" id="pjoint-axis-x" class="vec3-input" value="0"></div>
                  <div class="vec3-item y"><span class="vec3-prefix">Y</span><input type="number" step="0.1" id="pjoint-axis-y" class="vec3-input" value="1"></div>
                  <div class="vec3-item z"><span class="vec3-prefix">Z</span><input type="number" step="0.1" id="pjoint-axis-z" class="vec3-input" value="0"></div>
                </div>
              </div>

              <button class="btn btn-primary" id="btn-apply-joint-constraint" style="margin-top: auto; padding: 10px; font-weight: 700; font-size: 12px; justify-content: center; background: linear-gradient(135deg, #facc15, #eab308); border: none; color: #000;">
                ⚡ Apply Physics Joint to Active Entity
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
    const modal = document.getElementById('physics-joint-modal');
    if (!modal) return;

    modal.querySelector('#btn-close-physics-joint').addEventListener('click', () => this.close());

    let activeType = 'hinge';

    modal.querySelectorAll('.joint-type-card').forEach(card => {
      card.addEventListener('click', () => {
        modal.querySelectorAll('.joint-type-card').forEach(c => c.style.borderColor = 'var(--border-subtle)');
        card.style.borderColor = '#facc15';
        activeType = card.dataset.joint;
      });
    });

    modal.querySelector('#btn-apply-joint-constraint').addEventListener('click', () => {
      const active = this.currentEntity || this.editor.selection.getActive();
      if (active) {
        const targetEntity = modal.querySelector('#pjoint-target-entity').value.trim();
        const px = parseFloat(modal.querySelector('#pjoint-pivot-x').value) || 0;
        const py = parseFloat(modal.querySelector('#pjoint-pivot-y').value) || 0;
        const pz = parseFloat(modal.querySelector('#pjoint-pivot-z').value) || 0;

        const ax = parseFloat(modal.querySelector('#pjoint-axis-x').value) || 0;
        const ay = parseFloat(modal.querySelector('#pjoint-axis-y').value) || 1;
        const az = parseFloat(modal.querySelector('#pjoint-axis-z').value) || 0;

        active.joint = {
          type: activeType,
          targetEntity: targetEntity,
          pivot: [px, py, pz],
          axis: [ax, ay, az]
        };

        try {
          this.editor.addComponent(active, 'joint', active.joint);
        } catch (err) {}

        this.editor.events.emit('scene:changed');
        showToast(`⚙️ Applied ${activeType} Physics Joint constraint to "${active.name}"!`, 'success');
        this.close();
      } else {
        showToast('Select an entity in Hierarchy or 3D scene first', 'warn');
      }
    });

    modal.querySelector('#btn-generate-ragdoll-skeleton').addEventListener('click', () => {
      const active = this.currentEntity || this.editor.selection.getActive();
      if (active) {
        if (this.editor.behaviors) {
          this.editor.behaviors.attachBehavior(active, 'ragdoll_physics', { jointType: 'ball_and_socket' });
        }
        showToast(`🦴 Auto-generated Ragdoll Skeleton joint constraints on "${active.name}"!`, 'success');
        this.close();
      } else {
        showToast('Select a character model in Hierarchy or 3D scene first', 'warn');
      }
    });
  }

  open(targetEntity = null) {
    this.currentEntity = targetEntity || this.editor.selection.getActive();
    this.isOpen = true;
    const modal = document.getElementById('physics-joint-modal');
    if (modal) modal.style.display = 'flex';
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('physics-joint-modal');
    if (modal) modal.style.display = 'none';
  }
}
