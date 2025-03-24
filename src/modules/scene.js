export class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById("app").appendChild(this.renderer.domElement);

    // Add fog for distance fade effect
    const fogColor = 0x87ceeb; // Same as sky color
    this.scene.fog = new THREE.Fog(fogColor, 150, 300); // Start and end distances
    this.scene.background = new THREE.Color(fogColor);

    // Better lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    // Initial camera position
    this.camera.position.set(0, 20, 15);
    this.camera.lookAt(0, 0, -30);

    // Handle window resizing
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Camera smoothing
    this.cameraTargetX = 0;
    this.cameraTargetY = 20;
    this.cameraTargetZ = 0;

    this.cameraLookX = 0;
    this.cameraLookY = 0;
    this.cameraLookZ = -30;
  }

  updateCameraPosition(target) {
    // Ultra-smooth camera easing
    const positionEasing = 0.02;
    const lookEasing = 0.01;

    // Smooth camera position update
    this.cameraTargetX +=
      (target.x * 0.8 - this.cameraTargetX) * positionEasing;
    this.cameraTargetY += (target.y - this.cameraTargetY) * positionEasing;
    this.cameraTargetZ += (target.z - this.cameraTargetZ) * positionEasing;

    this.camera.position.x = this.cameraTargetX;
    this.camera.position.y = this.cameraTargetY;
    this.camera.position.z = this.cameraTargetZ;

    // Smooth camera look target
    this.cameraLookX += (target.x * 0.5 - this.cameraLookX) * lookEasing;
    this.cameraLookZ += (target.z - 30 - this.cameraLookZ) * lookEasing;

    this.camera.lookAt(this.cameraLookX, 0, this.cameraLookZ);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
