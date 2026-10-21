import { Editor } from './core/editor.js';
import { EngineRuntime } from './engine/pc-app.js';
import { TopBar } from './ui/topbar.js';
import { ToolStrip } from './ui/toolstrip.js';
import { HierarchyPanel } from './ui/hierarchy.js';
import { InspectorPanel } from './ui/inspector.js';
import { AssetsPanel } from './ui/assets.js';
import { AIAssistantUI } from './ui/ai-assistant.js';
import { CodeEditorModal } from './ui/code-editor.js';
import { ModelStoreModal } from './ui/model-store-modal.js';
import { MaterialEditorModal } from './ui/material-editor-modal.js';
import { TerrainModal } from './ui/terrain-modal.js';
import { TemplatesModal } from './ui/templates-modal.js';
import { PublishModal } from './ui/publish-modal.js';
import { HelpModal } from './ui/help-modal.js';
import { GuideModal } from './ui/guide-modal.js';
import { AISettingsModal } from './ui/ai-settings-modal.js';
import { ProjectSettingsModal } from './ui/project-settings-modal.js';
import { PostProcessingModal } from './ui/postprocessing-modal.js';
import { TimelinePanel } from './ui/timeline.js';
import { ConsoleDrawer } from './ui/console-drawer.js';
import { BehaviorManager } from './core/behaviors.js';

// Styles
import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/ai.css';

/**
 * Bootstrap MakuluLinux Game Studio
 */
async function bootstrap() {
  console.log('🚀 Initializing MakuluLinux Game Studio...');

  const editor = new Editor();

  // Initialize AI Assistant early so TopBar can reference it
  const aiUI = new AIAssistantUI(editor);

  // Mount UI Panels
  const topBarContainer = document.getElementById('top-bar');
  const toolStripContainer = document.getElementById('tool-strip');
  const hierarchyContainer = document.getElementById('hierarchy-panel');
  const inspectorContainer = document.getElementById('inspector-panel');
  const assetsContainer = document.getElementById('assets-panel');
  const canvasElement = document.getElementById('viewport-canvas');

  // Initialize Modals & Drawers
  const codeEditor = new CodeEditorModal(editor, aiUI);
  const modelStore = new ModelStoreModal(editor);
  const terrainModal = new TerrainModal(editor);
  const materialModal = new MaterialEditorModal(editor);
  const templatesModal = new TemplatesModal(editor);
  const publishModal = new PublishModal(editor);
  const helpModal = new HelpModal(editor);
  const guideModal = new GuideModal(editor);
  const aiSettingsModal = new AISettingsModal(editor);
  aiUI.setSettingsModal(aiSettingsModal);
  const projectSettingsModal = new ProjectSettingsModal(editor);
  const postProcessingModal = new PostProcessingModal(editor);
  const timelinePanel = new TimelinePanel(editor);
  const consoleDrawer = new ConsoleDrawer(document.body, editor, aiUI);

  const behaviors = new BehaviorManager(editor);
  editor.behaviors = behaviors;

  new TopBar(topBarContainer, editor, aiUI, templatesModal, publishModal, helpModal, guideModal, aiSettingsModal, projectSettingsModal, postProcessingModal, timelinePanel);
  new ToolStrip(toolStripContainer, editor);
  new HierarchyPanel(hierarchyContainer, editor);
  new InspectorPanel(inspectorContainer, editor, codeEditor);
  new AssetsPanel(assetsContainer, editor, modelStore, terrainModal, codeEditor, materialModal);

  // Initialize PlayCanvas 3D Engine Runtime
  const runtime = new EngineRuntime(canvasElement, editor);
  editor.setRuntime(runtime);

  // Setup Resizable Splitters
  setupSplitters();

  console.log('✅ MakuluLinux Game Studio Ready!');
}

/**
 * Resizable Pane Dividers
 */
function setupSplitters() {
  // Horizontal splitter (Hierarchy panel)
  const hierarchyPanel = document.getElementById('hierarchy-panel');
  const resizerH = document.createElement('div');
  resizerH.className = 'resizer-h';
  hierarchyPanel.appendChild(resizerH);

  let isResizingH = false;
  resizerH.addEventListener('mousedown', (e) => {
    isResizingH = true;
    resizerH.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizingH) return;
    const newWidth = Math.max(200, Math.min(e.clientX - 44, 450));
    hierarchyPanel.style.width = `${newWidth}px`;
  });

  window.addEventListener('mouseup', () => {
    if (isResizingH) {
      isResizingH = false;
      resizerH.classList.remove('resizing');
      document.body.style.cursor = 'default';
    }
  });

  // Vertical splitter (Assets panel)
  const assetsPanel = document.getElementById('assets-panel');
  const resizerV = document.createElement('div');
  resizerV.className = 'resizer-v';
  assetsPanel.appendChild(resizerV);

  let isResizingV = false;
  resizerV.addEventListener('mousedown', (e) => {
    isResizingV = true;
    resizerV.classList.add('resizing');
    document.body.style.cursor = 'row-resize';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isResizingV) return;
    const newHeight = Math.max(100, Math.min(window.innerHeight - e.clientY, 500));
    assetsPanel.style.height = `${newHeight}px`;
  });

  window.addEventListener('mouseup', () => {
    if (isResizingV) {
      isResizingV = false;
      resizerV.classList.remove('resizing');
      document.body.style.cursor = 'default';
    }
  });
}

window.addEventListener('DOMContentLoaded', bootstrap);
