export class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // Set up renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("app").appendChild(this.renderer.domElement);

    // Initial camera position
    this.camera.position.set(0, 30, 50);
    this.camera.lookAt(0, 0, -20);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(ambientLight);
    this.scene.add(directionalLight);

    // Set sky blue background
    this.scene.background = new THREE.Color(0x87ceeb);

    // Handle window resizing
    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  updateCameraPosition(playerPosition) {
    // Camera follows player from behind and above
    this.camera.position.x = playerPosition.x;
    this.camera.position.y = 30;
    this.camera.position.z = playerPosition.z + 50;
    this.camera.lookAt(playerPosition.x, 0, playerPosition.z - 20);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
