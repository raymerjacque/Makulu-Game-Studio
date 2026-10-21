/**
 * MakuluLinux Game Studio - Beginner's Step-by-Step Game Creation Masterclass Modal
 */
export class GuideModal {
  constructor(editor) {
    this.editor = editor;
    this.isOpen = false;
    this.currentStep = 0;
    this.steps = this.getTutorialSteps();
    this.render();
    this.bindEvents();
  }

  getTutorialSteps() {
    return [
      {
        id: 'intro',
        title: 'Project Overview & Goal',
        subtitle: 'What we are building today',
        icon: '🎯',
        badge: 'Start Here',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">🎯</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Welcome to Game Development with MakuluLinux Studio!</h2>
              <div style="font-size: 12.5px; color: var(--accent-orange); font-weight: 600;">Beginner's Masterclass: Building "The Rolling Gem Collector"</div>
            </div>
          </div>

          <p style="font-size: 14px; color: var(--text-primary); line-height: 1.7;">
            Welcome! If you have never made a 3D game before, you are in the exact right place. This step-by-step guide will walk you through building your very first fully functional 3D game from complete scratch — with <b>zero programming required</b>!
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 18px; margin: 18px 0;">
            <h4 style="margin: 0 0 10px 0; color: #00e5ff; font-size: 14px;">🎮 What your finished game will have:</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px; color: var(--text-secondary);">
              <div>✅ A 3D Arena with colored boundaries</div>
              <div>✅ Real-time shadows & atmospheric spotlight</div>
              <div>✅ A playable character steered with WASD keys</div>
              <div>✅ Golden spinning collectible gems</div>
              <div>✅ 3D obstacle props from the Model Store</div>
              <div>✅ Instant 1-Click HTML5 Web Export</div>
            </div>
          </div>

          <div style="background: rgba(16, 185, 129, 0.12); border-left: 3px solid #10b981; padding: 14px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: #10b981; font-size: 13px; margin-bottom: 4px;">🌱 No Experience Needed</div>
            <div style="font-size: 12.5px; color: var(--text-primary);">
              Everything in this tutorial can be done using the mouse and the simple controls. Follow along step by step using the "Next Step ➔" button below!
            </div>
          </div>
        `
      },
      {
        id: 'step1',
        title: 'Step 1: Switch to Simple Mode',
        subtitle: 'Activating the novice workflow',
        icon: '🌱',
        badge: 'Step 01',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">🌱</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 1: Switch to Simple Mode</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Setting up the visual beginner interface</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            MakuluLinux Game Studio has two distinct modes: <b>Simple Mode</b> and <b>Pro Mode</b>. For this beginner tutorial, we will use Simple Mode, which replaces complicated technical math with friendly visual cards, color palettes, and size sliders.
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 How to do it:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>Look at the <b>Top Navigation Bar</b> at the very top of your screen.</li>
              <li>Find the pill switcher with two buttons: <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">🌱 Simple Mode</kbd> and <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">⚡ Pro Mode</kbd>.</li>
              <li>Click <b>🌱 Simple Mode</b>.</li>
              <li>You will see a green toast notification: <i>"🌱 Switched to Simple Novice Mode"</i>.</li>
            </ol>
          </div>

          <div style="background: rgba(0, 229, 255, 0.1); border-left: 3px solid #00e5ff; padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: #00e5ff; font-size: 12px; margin-bottom: 4px;">✨ What changed?</div>
            <div style="font-size: 12.5px; color: var(--text-primary);">
              Now when you select any entity, the right Inspector will show 8 color swatches, size scaling sliders, and instant plug-and-play behavior cards instead of complex shader vectors!
            </div>
          </div>
        `
      },
      {
        id: 'step2',
        title: 'Step 2: Create the Ground Arena',
        subtitle: 'Building the floor stage',
        icon: '🟩',
        badge: 'Step 02',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">🟩</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 2: Create the Ground Arena</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Spawning a flat 3D platform for the game stage</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            Every game needs a surface for the player and objects to rest on. We will spawn a 3D Box and stretch it into a wide, flat arena floor.
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 Step-by-Step Instructions:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>In the left <b>Hierarchy Panel</b>, click the orange <b>+ Add</b> button.</li>
              <li>In the popup menu, select <b>📦 Box</b>. A cube will appear in the center of your 3D viewport.</li>
              <li>Click on the newly spawned Box in the Hierarchy or in the 3D viewport to select it.</li>
              <li>Look at the right <b>Inspector Panel</b>:
                <ul>
                  <li>In the name field, change the name to: <code style="color: var(--accent-orange);">Ground Arena</code>.</li>
                  <li>In the <b>Quick Size</b> section, drag the slider or nudge buttons until it is large and flat (or switch to Pro mode for a moment and type X: <b>24</b>, Y: <b>0.5</b>, Z: <b>24</b>, then switch back to Simple).</li>
                  <li>Under <b>🎨 Quick Color Swatches</b>, click the <b>Dark Stone (Obsidian)</b> or <b>Forest Green</b> swatch!</li>
                </ul>
              </li>
            </ol>
          </div>

          <div style="background: rgba(255, 102, 0, 0.1); border-left: 3px solid var(--accent-orange); padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 12px; margin-bottom: 4px;">💡 Pro-Tip: Centering the Camera</div>
            <div style="font-size: 12.5px; color: var(--text-primary);">
              Press the <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">F</kbd> key at any time to center the 3D camera view perfectly on the Ground Arena!
            </div>
          </div>
        `
      },
      {
        id: 'step3',
        title: 'Step 3: Setup Lighting & Atmosphere',
        subtitle: 'Illuminating your 3D world',
        icon: '💡',
        badge: 'Step 03',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">💡</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 3: Setup Lighting & Atmosphere</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Add a glowing spotlight with real-time shadow projection</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            Lighting gives your game depth, contrast, and atmosphere. A default Directional Light (Sun) is already shining, but we want to add a focused dramatic spotlight pointing down at the center of the arena.
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 Step-by-Step Instructions:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>Click <b>+ Add</b> in the Hierarchy panel and select <b>🔦 Spot Light</b>.</li>
              <li>You will see a visible 3D helper cone pointing down into the arena!</li>
              <li>Press the <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">W</kbd> key to activate the Move Gizmo.</li>
              <li>Click and drag the <b>Green vertical arrow</b> upwards to elevate the spotlight to about <b>8 units</b> above the ground.</li>
              <li>In the right Inspector under <b>Light Color</b>, pick a vibrant <b>Cyan (#00e5ff)</b> or warm <b>Golden Amber (#f59e0b)</b>.</li>
            </ol>
          </div>

          <div style="background: rgba(168, 85, 247, 0.12); border-left: 3px solid #c084fc; padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: #c084fc; font-size: 12px; margin-bottom: 4px;">✨ Visible Fixture Helpers</div>
            <div style="font-size: 12.5px; color: var(--text-primary);">
              Notice that Spot Lights have a visible cone and Point Lights have a glowing bulb in the editor so you can easily select and position them in 3D!
            </div>
          </div>
        `
      },
      {
        id: 'step4',
        title: 'Step 4: Spawn the Player Character',
        subtitle: 'Creating the hero entity',
        icon: '🔵',
        badge: 'Step 04',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">🔵</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 4: Spawn the Player Character</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Creating the ball that the player will navigate</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            Now let's create our hero! In this game, the player controls an agile rolling orb navigating the arena.
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 Step-by-Step Instructions:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>Click <b>+ Add</b> in the Hierarchy panel and select <b>🔮 Sphere</b>.</li>
              <li>In the right Inspector, change the name from <i>Sphere</i> to: <code style="color: var(--accent-orange);">Player</code>.</li>
              <li>Press <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">W</kbd> to activate the Move Gizmo, and drag the green arrow up so the ball rests comfortably on top of the ground (Position Y ≈ <b>1.0</b>).</li>
              <li>Under <b>🎨 Quick Color Swatches</b>, click the vibrant <b>Cobalt Blue</b> or <b>Fiery Orange</b> swatch so your character clearly stands out against the ground!</li>
            </ol>
          </div>

          <div style="background: rgba(16, 185, 129, 0.12); border-left: 3px solid #10b981; padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: #10b981; font-size: 12px; margin-bottom: 4px;">🎯 Ready for Behavior</div>
            <div style="font-size: 12.5px; color: var(--text-primary);">
              Right now, the Player is just a 3D sphere. In the next step, we will bring it to life with keyboard controls!
            </div>
          </div>
        `
      },
      {
        id: 'step5',
        title: 'Step 5: Attach WASD Player Controls',
        subtitle: 'Activating instant keyboard movement',
        icon: '🎮',
        badge: 'Step 05',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">🎮</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 5: Attach WASD Player Controls</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Zero code required: Turn on the Behavior Card</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            Usually in game engines, you would have to write 50 lines of JavaScript code to listen for keyboard events, calculate delta time, and update velocity. In MakuluLinux Studio, we built <b>Behavior Cards</b> to do this in one click!
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 Step-by-Step Instructions:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>Make sure the <b>Player</b> sphere is selected in the Hierarchy.</li>
              <li>Look at the right Inspector panel and scroll down to the <b>⚡ Plug & Play Behaviors</b> section.</li>
              <li>Find the card titled <b>🎮 WASD Player Controller</b>.</li>
              <li>Click the toggle button on the right side of the card.</li>
              <li>You will see a green badge turn ON: <span class="badge badge-green">Active</span>!</li>
            </ol>
          </div>

          <div style="background: rgba(0, 229, 255, 0.1); border-left: 3px solid #00e5ff; padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: #00e5ff; font-size: 12px; margin-bottom: 4px;">🎮 What this behavior gives your player:</div>
            <div style="font-size: 12.5px; color: var(--text-primary);">
              When you press <b>W, A, S, D</b> or the <b>Arrow Keys</b>, the ball will smoothly accelerate across the arena, rotate in the direction of movement, and slide across the floor.
            </div>
          </div>
        `
      },
      {
        id: 'step6',
        title: 'Step 6: Create Spinning Collectible Gems',
        subtitle: 'Adding treasures & goals',
        icon: '💎',
        badge: 'Step 06',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">💎</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 6: Create Spinning Collectible Gems</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Spawn golden floating crystals with continuous spin animation</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            Now let's add the collectibles that players need to find! We will spawn smaller shapes, color them shimmering gold, and attach the continuous <b>Spin Animation</b> behavior.
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 Step-by-Step Instructions:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>Click <b>+ Add</b> in the Hierarchy panel and select <b>📦 Box</b> or <b>🥫 Cylinder</b>.</li>
              <li>Rename it in the Inspector to: <code style="color: var(--accent-orange);">Gem 1</code>.</li>
              <li>Under <b>Quick Size</b>, slide the size down to around <b>0.6x</b> so it looks like a small jewel.</li>
              <li>Press <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">W</kbd> and move it to one side of the arena, slightly floating off the floor (e.g. Position X: <b>5</b>, Y: <b>1.2</b>, Z: <b>5</b>).</li>
              <li>Under <b>Quick Color Swatches</b>, click the <b>Golden Amber (#f59e0b)</b> swatch.</li>
              <li>Scroll down to <b>Plug & Play Behaviors</b> and toggle ON: <b>🌀 Spin Animation</b>!</li>
            </ol>
          </div>

          <div style="background: rgba(255, 102, 0, 0.1); border-left: 3px solid var(--accent-orange); padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 12px; margin-bottom: 4px;">💡 Quick Tip: Make Multiple Gems!</div>
            <div style="font-size: 12.5px; color: var(--text-primary);">
              Repeat these steps to create 3 or 4 gems placed in different corners of your arena (e.g. Gem 2 at X: -6, Z: 6, and Gem 3 at X: -6, Z: -6)!
            </div>
          </div>
        `
      },
      {
        id: 'step7',
        title: 'Step 7: Drop 3D Props from the Model Store',
        subtitle: 'Decorating with free CC0 3D assets',
        icon: '📦',
        badge: 'Step 07',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">📦</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 7: Drop 3D Props from the Model Store</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Populate the arena with trees, wooden crates, and stone pillars</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            To make the arena look like a real game level, let's add some obstacle props. MakuluLinux Studio comes with a built-in curated store of CC0 public-domain 3D models ready to spawn in 1 click!
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 Step-by-Step Instructions:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>Look at the bottom <b>Assets Panel</b>.</li>
              <li>Click the orange button labeled <b>📦 3D Store</b>.</li>
              <li>A library of 3D models will open (Pine Trees, Medieval Pillars, Wooden Crates, Barrels, Treasure Chests).</li>
              <li>Click <b>Spawn</b> on the <b>Medieval Stone Pillar</b> or <b>Wooden Crate</b>.</li>
              <li>The 3D model will instantly appear in your scene!</li>
              <li>Use the Move Gizmo (<kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">W</kbd>) to place several obstacles between the Player and the Gems.</li>
            </ol>
          </div>

          <div style="background: rgba(16, 185, 129, 0.12); border-left: 3px solid #10b981; padding: 12px 16px; border-radius: 0 6px 6px 0;">
            <div style="font-weight: 700; color: #10b981; font-size: 12px; margin-bottom: 4px;">🏔️ Want mountains instead?</div>
            <div style="font-size: 12.5px; color: var(--text-primary);">
              You can also click the green <b>🏔️ Terrain</b> button to generate realistic Perlin noise mountains and valleys around your arena!
            </div>
          </div>
        `
      },
      {
        id: 'step8',
        title: 'Step 8: Test in Live Simulation Mode',
        subtitle: 'Play your game right inside the editor',
        icon: '▶️',
        badge: 'Step 08',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">▶️</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 8: Test in Live Simulation Mode</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Experience your gameplay instantly</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            It's time for the moment of truth! You do not need to export or wait for compilers just to test. MakuluLinux Game Studio has a built-in <b>Simulate Mode</b> that activates all behaviors live inside the 3D viewport.
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 How to Playtest:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>Look at the top bar and click the blue <b>▶ Play</b> button.</li>
              <li>A glowing green banner will appear across the viewport: <code style="color: #10b981;">SIMULATION RUNNING (WASD to Move)</code>.</li>
              <li>Click inside the 3D viewport once to focus it.</li>
              <li>Press your <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">W</kbd>, <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">A</kbd>, <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">S</kbd>, <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">D</kbd> or <b>Arrow Keys</b>!</li>
              <li>Watch your Player roll smoothly around the arena, navigate past the obstacles, and watch the golden gems spin!</li>
              <li>When you are finished testing, click <b>⏹ Stop</b> on the top bar to return to edit mode.</li>
            </ol>
          </div>
        `
      },
      {
        id: 'step9',
        title: 'Step 9: Ask AI Copilot for Polish',
        subtitle: 'Let the AI add magic touches',
        icon: '✨',
        badge: 'Step 09',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">✨</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 9: Ask AI Copilot for Polish</h2>
              <div style="font-size: 12.5px; color: var(--text-secondary);">Use natural language to enhance your game world</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            Want to add dramatic details quickly? The MakuluLinux AI Copilot is built right into the studio and can modify your scene on command!
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 Try typing these into the top AI bar:</div>
            
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
              <div style="background: var(--bg-darkest); padding: 10px 14px; border-radius: 6px; border-left: 3px solid #ff6600;">
                💬 <i>"Add four glowing purple pillars at the four corners of the arena"</i>
              </div>
              <div style="background: var(--bg-darkest); padding: 10px 14px; border-radius: 6px; border-left: 3px solid #00e5ff;">
                💬 <i>"Create a red spotlight pointing at the player"</i>
              </div>
              <div style="background: var(--bg-darkest); padding: 10px 14px; border-radius: 6px; border-left: 3px solid #10b981;">
                💬 <i>"Audit my scene for lighting and physics issues"</i>
              </div>
            </div>

            <div style="font-size: 12.5px; color: var(--text-secondary); margin-top: 12px;">
              Click the paper airplane button or press <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">Enter</kbd>, and watch the AI execute your changes directly on the canvas! Remember: you can always press <kbd style="background: var(--bg-darkest); padding: 2px 6px; border-radius: 4px;">Ctrl+Z</kbd> to undo anything the AI does.
            </div>
          </div>
        `
      },
      {
        id: 'step10',
        title: 'Step 10: Compile & Publish Your Game',
        subtitle: 'Share your game with the world',
        icon: '🚀',
        badge: 'Step 10 · Final',
        content: `
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="font-size: 32px;">🚀</div>
            <div>
              <h2 style="margin: 0; font-size: 19px; color: #fff;">Step 10: Compile & Publish Your Game</h2>
              <div style="font-size: 12.5px; color: var(--accent-orange); font-weight: 600;">Congratulations! You are officially a game developer!</div>
            </div>
          </div>

          <p style="font-size: 13.5px; line-height: 1.7;">
            Your first 3D game is complete! Now it's time to share it with your friends, family, or publish it to the internet.
          </p>

          <div style="background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 16px; margin: 18px 0;">
            <div style="font-weight: 700; color: var(--accent-orange); font-size: 13px; margin-bottom: 10px;">📋 How to Export & Publish:</div>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--text-primary);">
              <li>Click the glowing orange <b>🚀 Publish</b> button on the top right.</li>
              <li>In the Publish Dialog, you have two amazing options:
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                  <div style="background: var(--bg-darkest); padding: 12px; border-radius: 6px;">
                    <b style="color: #00e5ff;">Option A · Download Standalone Game (.html)</b><br>
                    <span style="font-size: 12px; color: var(--text-secondary);">Downloads a single zero-install HTML5 file. Anyone can double-click this file on Windows, Mac, Linux, Android, or iOS to play your game in full screen without installing anything!</span>
                  </div>
                  <div style="background: var(--bg-darkest); padding: 12px; border-radius: 6px;">
                    <b style="color: var(--accent-orange);">Option B · 1-Click Makulu Cloud Web Hosting</b><br>
                    <span style="font-size: 12px; color: var(--text-secondary);">Instantly generates a live web link that you can send in Discord, WhatsApp, or post on social media for anyone to play right in their browser!</span>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <div style="background: linear-gradient(135deg, rgba(255,102,0,0.15), rgba(168,85,247,0.15)); border: 1px solid var(--accent-orange); border-radius: 8px; padding: 16px; text-align: center; margin-top: 16px;">
            <div style="font-size: 24px; margin-bottom: 4px;">🏆</div>
            <div style="font-weight: 800; font-size: 15px; color: #fff;">You built a 3D game with MakuluLinux Game Studio!</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Next, explore the <b>🎮 Templates</b> button to see complete FPS arenas and Medieval adventures!</div>
          </div>
        `
      }
    ];
  }

  render() {
    this.modal = document.createElement('div');
    this.modal.id = 'guide-modal';
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
      <div style="width: 980px; max-width: 95vw; height: 88vh; max-height: 870px; background: var(--bg-darkest); border: 1px solid #00e5ff; border-radius: var(--radius-lg); box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 35px rgba(0, 229, 255, 0.22); display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Modal Header -->
        <div style="height: 56px; background: var(--bg-darker); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 22px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(0, 229, 255, 0.15); border: 1px solid #00e5ff; display: flex; align-items: center; justify-content: center; font-size: 19px; color: #00e5ff;">
              📖
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px; color: var(--text-primary); letter-spacing: -0.2px;">
                Beginner's Masterclass · Building Your First 3D Game
              </div>
              <div style="font-size: 11px; color: var(--text-secondary);">
                10-Step Interactive Guide: The Rolling Gem Collector
              </div>
            </div>
          </div>
          <button id="guide-btn-close" class="btn" style="padding: 4px 10px; font-size: 14px; border-radius: 6px;">✕</button>
        </div>

        <!-- Progress Indicator Bar -->
        <div style="height: 4px; background: var(--bg-panel); width: 100%; position: relative;">
          <div id="guide-progress-fill" style="height: 100%; width: 10%; background: linear-gradient(90deg, #00e5ff, #10b981); transition: width 0.3s ease;"></div>
        </div>

        <!-- Modal Body (Two-Column Layout) -->
        <div style="flex: 1; display: flex; overflow: hidden;">
          
          <!-- Left Navigation Sidebar -->
          <div style="width: 270px; background: var(--bg-darker); border-right: 1px solid var(--border-subtle); display: flex; flex-direction: column; flex-shrink: 0;">
            <div style="padding: 12px 14px; border-bottom: 1px solid var(--border-subtle); font-size: 11px; font-weight: 700; color: #00e5ff; text-transform: uppercase; letter-spacing: 0.5px;">
              Tutorial Steps (10 Milestones)
            </div>
            <div id="guide-step-list" style="flex: 1; overflow-y: auto; padding: 8px;">
              <!-- Navigation Step Buttons rendered dynamically -->
            </div>
            <div style="padding: 12px; border-top: 1px solid var(--border-subtle); font-size: 11px; color: var(--text-muted); text-align: center;">
              MakuluLinux Game Studio
            </div>
          </div>

          <!-- Right Content Area -->
          <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-darkest);">
            
            <div id="guide-content-area" style="flex: 1; overflow-y: auto; padding: 28px 36px; color: var(--text-primary); font-size: 13.5px; line-height: 1.65;">
              <!-- Active Step Content rendered here -->
            </div>

            <!-- Bottom Navigation Controls -->
            <div style="height: 52px; background: var(--bg-darker); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; flex-shrink: 0;">
              <button id="guide-btn-prev" class="btn" style="padding: 6px 14px; font-size: 12px;">
                ⬅ Previous Step
              </button>

              <div id="guide-step-counter" style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">
                Step 1 of 10
              </div>

              <button id="guide-btn-next" class="btn btn-primary" style="padding: 6px 18px; font-size: 12px; background: linear-gradient(135deg, #00e5ff, #0099ff); border: none; font-weight: 700; color: #000;">
                Next Step ➔
              </button>
            </div>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(this.modal);
    this.renderStepList();
    this.renderActiveStep();
  }

  renderStepList() {
    const list = this.modal.querySelector('#guide-step-list');
    list.innerHTML = this.steps.map((s, idx) => `
      <div class="guide-nav-item ${idx === this.currentStep ? 'active' : ''}" data-step="${idx}" style="
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        margin-bottom: 4px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        background: ${idx === this.currentStep ? 'rgba(0, 229, 255, 0.16)' : 'transparent'};
        border: 1px solid ${idx === this.currentStep ? '#00e5ff' : 'transparent'};
      ">
        <span style="font-size: 16px;">${s.icon}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 12px; font-weight: 600; color: ${idx === this.currentStep ? '#fff' : 'var(--text-primary)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${s.title}
          </div>
          <div style="font-size: 10px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${s.subtitle}
          </div>
        </div>
        <span class="badge" style="font-size: 9px; padding: 2px 5px; background: ${idx === this.currentStep ? 'rgba(0,229,255,0.25)' : 'var(--bg-darkest)'}; color: ${idx === this.currentStep ? '#00e5ff' : 'var(--text-muted)'};">
          ${idx === 0 ? 'Intro' : '0' + idx}
        </span>
      </div>
    `).join('');

    list.querySelectorAll('.guide-nav-item').forEach(el => {
      el.addEventListener('click', () => {
        this.goToStep(parseInt(el.dataset.step));
      });
    });
  }

  renderActiveStep() {
    const step = this.steps[this.currentStep];
    const content = this.modal.querySelector('#guide-content-area');
    content.scrollTop = 0;
    content.innerHTML = step.content;

    // Update Progress Bar
    const progressFill = this.modal.querySelector('#guide-progress-fill');
    const percent = ((this.currentStep + 1) / this.steps.length) * 100;
    progressFill.style.width = `${percent}%`;

    // Update Counter & Prev/Next buttons
    const counter = this.modal.querySelector('#guide-step-counter');
    counter.textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;

    const prevBtn = this.modal.querySelector('#guide-btn-prev');
    const nextBtn = this.modal.querySelector('#guide-btn-next');

    prevBtn.disabled = this.currentStep === 0;
    prevBtn.style.opacity = this.currentStep === 0 ? '0.4' : '1';

    if (this.currentStep === this.steps.length - 1) {
      nextBtn.innerHTML = 'Finish Tutorial 🎉';
      nextBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      nextBtn.style.color = '#fff';
    } else {
      nextBtn.innerHTML = 'Next Step ➔';
      nextBtn.style.background = 'linear-gradient(135deg, #00e5ff, #0099ff)';
      nextBtn.style.color = '#000';
    }
  }

  goToStep(index) {
    if (index < 0 || index >= this.steps.length) return;
    this.currentStep = index;
    this.renderStepList();
    this.renderActiveStep();
  }

  bindEvents() {
    const closeBtn = this.modal.querySelector('#guide-btn-close');
    closeBtn.addEventListener('click', () => this.close());

    // Dismiss on click outside modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Prev / Next button actions
    const prevBtn = this.modal.querySelector('#guide-btn-prev');
    prevBtn.addEventListener('click', () => {
      if (this.currentStep > 0) this.goToStep(this.currentStep - 1);
    });

    const nextBtn = this.modal.querySelector('#guide-btn-next');
    nextBtn.addEventListener('click', () => {
      if (this.currentStep < this.steps.length - 1) {
        this.goToStep(this.currentStep + 1);
      } else {
        this.close();
      }
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(stepIndex = 0) {
    this.goToStep(stepIndex);
    this.modal.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.modal.style.display = 'none';
    this.isOpen = false;
  }
}
