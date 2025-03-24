export class Player {
  constructor(scene, environment) {
    this.scene = scene;
    this.environment = environment;

    // Position settings
    this.xPosition = 0;
    this.zPosition = -20;

    // Movement settings
    this.forwardSpeed = 1; // Constant forward movement
    this.lateralSpeed = 2;
    this.maxOffset = this.environment.roadWidth / 2 - 4; // Buffer from edge

    // Camera settings
    this.cameraX = 0;
    this.smoothSpeed = 0.015;

    this.createPlayer();
    this.setupControls();
  }

  createPlayer() {
    // Make player bigger and brighter
    const geometry = new THREE.BoxGeometry(4, 8, 4);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 4, this.zPosition);
    this.scene.scene.add(this.mesh);

    console.log("Player created at:", this.mesh.position);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
          if (this.xPosition > -this.maxOffset) {
            this.xPosition -= this.lateralSpeed;
          }
          break;
        case "ArrowRight":
        case "d":
          if (this.xPosition < this.maxOffset) {
            this.xPosition += this.lateralSpeed;
          }
          break;
      }
    });
  }

  update() {
    // Constant forward movement
    this.zPosition -= this.forwardSpeed;

    // Keep player within road bounds
    this.xPosition = Math.max(
      Math.min(this.xPosition, this.maxOffset),
      -this.maxOffset
    );

    // Update player position
    this.mesh.position.x = this.xPosition;
    this.mesh.position.z = this.zPosition;

    // Update camera to follow road center only
    this.updateCamera();
  }

  updateCamera() {
    // Camera follows road center (always at x=0)
    this.scene.camera.position.set(
      0, // Always centered on road
      25, // Height
      this.zPosition + 40 // Distance behind
    );

    // Look at road center ahead
    this.scene.camera.lookAt(
      0, // Look at center of road
      0, // Ground level
      this.zPosition - 30
    );
  }
}
