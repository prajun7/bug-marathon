export class Player {
  constructor(scene) {
    this.scene = scene;

    // Player settings
    this.speed = 0.5;
    this.lateralSpeed = 0.8;

    this.createPlayer();
    this.setupControls();
  }

  createPlayer() {
    // Create a simple player cube
    const geometry = new THREE.BoxGeometry(2, 4, 2);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);

    // Start position
    this.mesh.position.set(0, 2, 0);
    this.scene.scene.add(this.mesh);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      const maxX = this.scene.runwayWidth / 2 - 2; // Keep player within runway
      switch (e.key) {
        case "ArrowLeft":
          if (this.mesh.position.x > -maxX) {
            this.mesh.position.x -= this.lateralSpeed;
          }
          break;
        case "ArrowRight":
          if (this.mesh.position.x < maxX) {
            this.mesh.position.x += this.lateralSpeed;
          }
          break;
      }
    });
  }

  update() {
    // Move forward continuously
    this.mesh.position.z -= this.speed;

    // Update camera to follow player
    this.scene.updateCameraPosition(this.mesh.position);
  }
}
