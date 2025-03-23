export class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // Add renderer to DOM
    document.getElementById("app").appendChild(this.renderer.domElement);

    // Set up camera position for better overhead view
    this.camera.position.set(0, 15, 10);
    this.camera.lookAt(0, 0, 0);

    // Add better lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(ambientLight, directionalLight);

    // Add a subtle background color
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Handle window resizing
    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
