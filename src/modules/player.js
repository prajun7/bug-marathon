export class Player {
  constructor(scene) {
    this.scene = scene;

    // Player settings
    this.speed = 0.3;
    this.lateralSpeed = 0.2;

    this.createPlayer();
    this.setupControls();
  }

  createPlayer() {
    // Create a simple player cube
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);

    // Start position
    this.mesh.position.set(0, 1, 0);
    this.scene.scene.add(this.mesh);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          if (this.mesh.position.x > -6) {
            // Prevent going off runway
            this.mesh.position.x -= this.lateralSpeed;
          }
          break;
        case "ArrowRight":
          if (this.mesh.position.x < 6) {
            // Prevent going off runway
            this.mesh.position.x += this.lateralSpeed;
          }
          break;
      }
    });
  }

  update() {
    // Move forward continuously
    this.mesh.position.z -= this.speed;
  }
}
