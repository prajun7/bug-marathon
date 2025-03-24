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
      shadowMap: { enabled: true },
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("app").appendChild(this.renderer.domElement);

    // Enable shadows
    this.renderer.shadowMap.enabled = true;

    // Better lighting setup
    this.setupLighting();

    // Temple Run-like environment color
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

    // Initial camera position
    this.camera.position.set(0, 30, 50);
    this.camera.lookAt(0, 0, -20);

    // Handle window resizing
    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  setupLighting() {
    // Ambient light for overall visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Main directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(-10, 50, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
  }

  updateCameraPosition(playerPosition) {
    // Smoother camera follow
    const cameraHeight = 25;
    const cameraDistance = 35;
    const lookAheadDistance = 30;

    // Position camera behind and above player
    this.camera.position.x = playerPosition.x * 0.8; // Smooth out lateral movement
    this.camera.position.y = cameraHeight;
    this.camera.position.z = playerPosition.z + cameraDistance;

    // Look ahead of the player
    this.camera.lookAt(
      playerPosition.x * 0.5,
      2,
      playerPosition.z - lookAheadDistance
    );
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
