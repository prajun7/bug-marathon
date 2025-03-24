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

    // Restore original bright blue sky color
    this.scene.background = new THREE.Color(0x87ceeb); // Bright sky blue
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 300);

    // Adjusted lighting for tech theme
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    // Add a helper grid for debugging
    const gridHelper = new THREE.GridHelper(100, 20);
    this.scene.add(gridHelper);

    // Initial camera position
    this.camera.position.set(0, 25, 40);
    this.camera.lookAt(0, 0, 0);

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
