import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export class ParticlesSwarm {
  private container: HTMLElement;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;

  private mesh: THREE.InstancedMesh;
  private geometry: THREE.TetrahedronGeometry;
  private material: THREE.MeshBasicMaterial;

  private positions: THREE.Vector3[];
  private dummy: THREE.Object3D;
  private target: THREE.Vector3;
  private color: THREE.Color;

  private count: number;

  private speed: number;
  private chaos: number;
  private coreSize: number;

  private animationId: number | null = null;
  private clock: THREE.Clock;

  private resizeHandler: () => void;

  /*
   * -----------------------------------------------------
   * OPTIONAL: mouse-parallax camera drift
   * -----------------------------------------------------
   * NOT present in the original exported source (that file
   * keeps the camera fixed at (0,0,100) forever). Added here
   * because a fully static camera reads as "frozen" compared
   * to what fog + correct pixel ratio produce. Delete this
   * block (and the two camera lines inside animate()) if you
   * want an exact match to the original's fixed camera.
   */
  private mouseX = 0;
  private mouseY = 0;
  private mouseHandler: (e: MouseEvent) => void;
  private baseCameraX = 0;
  private baseCameraY = 0;
  private baseCameraZ = 100;

  constructor(
    container: HTMLElement,
    options?: {
      count?: number;
      speed?: number;
      chaos?: number;
      coreSize?: number;
    }
  ) {
    this.container = container;

    /*
     * Original values from the exported source.
     */
    this.count = options?.count ?? 20000;
    this.speed = options?.speed ?? 0.4;
    this.chaos = options?.chaos ?? 20.0;
    this.coreSize = options?.coreSize ?? 10.0;

    /*
     * -----------------------------
     * Scene
     * -----------------------------
     */

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0x000000);

    /*
     * RESTORED: the original fades outer/distant particles
     * toward black. Without this the swarm looks flat and
     * loses the sense of depth/motion through the pattern.
     */
    this.scene.fog = new THREE.FogExp2(0x000000, 0.01);

    /*
     * -----------------------------
     * Camera
     * -----------------------------
     */

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);

    this.camera.position.set(
      this.baseCameraX,
      this.baseCameraY,
      this.baseCameraZ
    );

    /*
     * -----------------------------
     * Renderer
     * -----------------------------
     */

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    /*
     * REMOVED devicePixelRatio scaling. The original never
     * calls setPixelRatio, so it always rendered at 1x. Since
     * UnrealBloomPass is resolution-dependent, rendering at 2x
     * on high-DPI screens made bloom noticeably tighter/crisper
     * than the original's softer, bigger glow. Set explicitly
     * to 1 to match the original; change back to
     * Math.min(window.devicePixelRatio, 2) if you'd rather have
     * sharper geometry than an exact visual match.
     */
    this.renderer.setPixelRatio(1);

    this.renderer.setSize(width, height);

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);

    /*
     * -----------------------------
     * Geometry
     * -----------------------------
     */

    this.geometry = new THREE.TetrahedronGeometry(0.25);

    /*
     * -----------------------------
     * Material
     * -----------------------------
     */

    /*
     * FIXED: added vertexColors: true. InstancedMesh.setColorAt()
     * is a no-op visually unless the material opts in to reading
     * per-instance colors. Without this every particle rendered
     * flat white and the whole outer-blue -> core-purple hue
     * mapping was invisible in both the demo and the first port.
     */
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
    });

    /*
     * -----------------------------
     * Instanced mesh
     * -----------------------------
     *
     * 20,000 particles but only
     * one geometry + material.
     */

    this.mesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      this.count
    );

    /*
     * RESTORED: original marks the instance matrix buffer as
     * dynamic since it's rewritten every frame. Left at the
     * static default this can cause the driver to re-allocate
     * or stall on updates on some GPUs.
     */
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    /*
     * Enable per-instance colors.
     */
    const instanceColors = new Float32Array(this.count * 3);

    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
      instanceColors,
      3
    );

    this.scene.add(this.mesh);

    /*
     * -----------------------------
     * Particle state
     * -----------------------------
     */

    this.positions = [];

    this.dummy = new THREE.Object3D();

    this.target = new THREE.Vector3();

    this.color = new THREE.Color();

    /*
     * Same initial random-position
     * idea as the exported source.
     */
    for (let i = 0; i < this.count; i++) {
      this.positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        )
      );

      /*
       * Give every instance an
       * initial transform.
       */
      this.dummy.position.copy(this.positions[i]);

      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);

      /*
       * Initial color.
       */
      this.mesh.setColorAt(i, new THREE.Color(0x00ff88));
    }

    this.mesh.instanceMatrix.needsUpdate = true;

    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }

    /*
     * -----------------------------
     * Post processing
     * -----------------------------
     */

    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);

    this.composer.addPass(renderPass);

    /*
     * Original exported source:
     * bloom strength around 1.8.
     */
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.8,
      0.4,
      0
    );

    this.composer.addPass(this.bloomPass);

    /*
     * -----------------------------
     * Clock
     * -----------------------------
     */

    this.clock = new THREE.Clock();

    /*
     * -----------------------------
     * Resize
     * -----------------------------
     */

    this.resizeHandler = () => {
      this.resize();
    };

    window.addEventListener("resize", this.resizeHandler);

    /*
     * OPTIONAL mouse-parallax listener (see note above).
     * Normalizes mouse position to roughly -1..1.
     */
    this.mouseHandler = (e: MouseEvent) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener("mousemove", this.mouseHandler);

    /*
     * Start animation.
     */
    this.animate();
  }

  /*
   * --------------------------------
   * Animation
   * --------------------------------
   */

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    const time = this.clock.getElapsedTime();

    /*
     * OPTIONAL: ease the camera toward a small offset driven by
     * mouse position. Kept subtle (max ~6 units) so it doesn't
     * fight the fixed framing of the original. Delete these two
     * lines to restore an exactly fixed camera.
     */
    this.camera.position.x +=
      (this.mouseX * 6 - this.camera.position.x + this.baseCameraX) * 0.02;
    this.camera.position.y +=
      (-this.mouseY * 6 - this.camera.position.y + this.baseCameraY) * 0.02;
    this.camera.lookAt(0, 0, 0);

    /*
     * Fibonacci sphere.
     */
    const goldenRatio = (1.0 + Math.sqrt(5.0)) / 2.0;

    /*
     * --------------------------------
     * Update every particle
     * --------------------------------
     */

    for (let i = 0; i < this.count; i++) {
      /*
       * 1. Normalized particle index
       */

      const norm = i / this.count;

      /*
       * 2. Progress toward core
       *
       * 0 = outer edge
       * 1 = core
       */

      const progress = (norm + time * this.speed * 0.2) % 1.0;

      /*
       * Accelerated movement
       * toward center.
       */

      const easeProgress = Math.pow(progress, 1.5);

      /*
       * 3. Fibonacci sphere
       */

      const theta = (2.0 * Math.PI * i) / goldenRatio;

      const phi = Math.acos(1.0 - 2.0 * norm);

      /*
       * 4. Radius
       *
       * Outer ≈ 150
       * Core  ≈ coreSize
       */

      const currentRadius = this.coreSize + 150.0 * (1.0 - easeProgress);

      /*
       * 5. Chaos
       *
       * High at outside.
       * Falls toward zero
       * near the core.
       */

      const instability = Math.pow(1.0 - progress, 2.0);

      const wobbleX =
        Math.sin(time * 2.0 + norm * 100.0) * this.chaos * instability;

      const wobbleY =
        Math.cos(time * 1.5 + norm * 200.0) * this.chaos * instability;

      const wobbleZ =
        Math.sin(time * 3.0 - norm * 300.0) * this.chaos * instability;

      /*
       * 6. Position
       */

      const sinPhi = Math.sin(phi);

      const x = currentRadius * sinPhi * Math.cos(theta) + wobbleX;

      const y = currentRadius * sinPhi * Math.sin(theta) + wobbleY;

      const z = currentRadius * Math.cos(phi) + wobbleZ;

      /*
       * Target position.
       */

      this.target.set(x, y, z);

      /*
       * Smooth movement.
       *
       * This matches the exported
       * source's lerp behavior.
       */

      this.positions[i].lerp(this.target, 0.1);

      /*
       * 7. Update instance matrix
       */

      this.dummy.position.copy(this.positions[i]);

      /*
       * IMPORTANT:
       *
       * We do NOT add our own
       * particle rotation here.
       *
       * The exported source only
       * updates position/matrix.
       */

      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);

      /*
       * 8. Color mapping
       *
       * Outer:
       * cool blue
       *
       * Core:
       * purple/neon
       */

      const hue = 0.55 + 0.25 * progress;

      const saturation = 0.8 + 0.2 * progress;

      /*
       * Core pulse.
       */

      const corePulse =
        progress > 0.95 ? Math.sin(time * 10.0) * 0.3 : 0.0;

      const lightness = 0.2 + 0.6 * progress + corePulse;

      /*
       * Clamp lightness.
       */

      const clampedLightness = Math.max(0.0, Math.min(1.0, lightness));

      this.color.setHSL(hue, saturation, clampedLightness);

      this.mesh.setColorAt(i, this.color);
    }

    /*
     * Tell Three.js the
     * instance buffers changed.
     */

    this.mesh.instanceMatrix.needsUpdate = true;

    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }

    /*
     * Render through the
     * post-processing composer.
     */

    this.composer.render();
  };

  /*
   * --------------------------------
   * Resize
   * --------------------------------
   */

  private resize() {
    const width = this.container.clientWidth || window.innerWidth;

    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    this.composer.setSize(width, height);
  }

  /*
   * --------------------------------
   * Destroy / cleanup
   * --------------------------------
   */

  destroy() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);

      this.animationId = null;
    }

    window.removeEventListener("resize", this.resizeHandler);
    window.removeEventListener("mousemove", this.mouseHandler);

    /*
     * Dispose Three.js resources.
     */

    this.geometry.dispose();

    this.material.dispose();

    this.mesh.dispose();

    this.composer.dispose();

    this.renderer.dispose();

    /*
     * Remove canvas.
     */

    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}