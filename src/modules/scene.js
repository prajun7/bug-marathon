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

    // Bright, cheerful sky color
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 300);

    // Lighting for cheerful atmosphere
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Initial camera position
    this.camera.position.set(0, 25, 35);
    this.camera.lookAt(0, 0, -20);

    // Handle window resizing
    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  updateCameraPosition(playerPosition) {
    // Smooth camera follow
    this.camera.position.x = playerPosition.x * 0.8;
    this.camera.position.z = playerPosition.z + 35;
    this.camera.lookAt(playerPosition.x * 0.5, 0, playerPosition.z - 30);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
