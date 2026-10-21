import * as pc from 'playcanvas';

/**
 * 3D Material Preview Sphere Renderer
 * Renders a rotating sphere with PBR lighting in a small thumbnail canvas.
 */
export class MaterialPreviewRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.app = null;
    this.sphereEntity = null;
    this.material = null;
    this.init();
  }

  init() {
    this.app = new pc.Application(this.canvas, {
      graphicsDeviceOptions: {
        alpha: true,
        antialias: true
      }
    });

    this.app.start();
    this.app.setCanvasFillMode(pc.FILLMODE_NONE);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Camera
    const camera = new pc.Entity('PreviewCamera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.1, 0.13, 0.17, 1),
      fov: 45,
      nearClip: 0.1,
      farClip: 20
    });
    camera.setPosition(0, 0, 2.5);
    this.app.root.addChild(camera);

    // Lighting (Key + Fill)
    const keyLight = new pc.Entity('KeyLight');
    keyLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.98, 0.9),
      intensity: 1.8
    });
    keyLight.setEulerAngles(45, 30, 0);
    this.app.root.addChild(keyLight);

    const fillLight = new pc.Entity('FillLight');
    fillLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(0.4, 0.5, 0.7),
      intensity: 0.8
    });
    fillLight.setEulerAngles(-30, -120, 0);
    this.app.root.addChild(fillLight);

    // Sphere Mesh
    this.material = new pc.StandardMaterial();
    this.material.diffuse = new pc.Color(0.9, 0.5, 0.1);
    this.material.metalness = 0.5;
    this.material.useMetalness = true;
    this.material.roughness = 0.3;
    this.material.update();

    this.sphereEntity = new pc.Entity('PreviewSphere');
    this.sphereEntity.addComponent('render', {
      type: 'sphere',
      material: this.material
    });
    this.app.root.addChild(this.sphereEntity);

    // Continuous smooth rotation
    this.app.on('update', (dt) => {
      if (this.sphereEntity) {
        this.sphereEntity.rotate(8 * dt, 15 * dt, 0);
      }
    });
  }

  updateMaterial(props) {
    if (!this.material) return;

    if (props.diffuse) {
      this.material.diffuse = new pc.Color(...props.diffuse);
    }
    if (props.metalness !== undefined) {
      this.material.metalness = props.metalness;
      this.material.useMetalness = true;
    }
    if (props.roughness !== undefined) {
      this.material.roughness = props.roughness;
    }
    if (props.emissive) {
      this.material.emissive = new pc.Color(...props.emissive);
    }
    if (props.emissiveIntensity !== undefined) {
      this.material.emissiveIntensity = props.emissiveIntensity;
    }

    this.material.update();
  }

  destroy() {
    if (this.app) {
      this.app.destroy();
      this.app = null;
    }
  }
}
