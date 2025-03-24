export class Player {
  constructor(scene, environment) {
    this.scene = scene;
    this.environment = environment;

    // Reduced speed settings
    this.speed = 2;
    this.lateralSpeed = 0.4;
    this.autoAlignStrength = 0.15; // Increased to better follow turns

    this.createPlayer();
    this.setupControls();
  }

  createPlayer() {
    // Make player more visible
    const geometry = new THREE.BoxGeometry(2, 4, 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      shininess: 30,
    });
    this.mesh = new THREE.Mesh(geometry, material);

    // Adjust starting position
    this.mesh.position.set(0, 2, 0);
    this.scene.scene.add(this.mesh);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      const maxX = this.environment.runwayWidth / 2 - 2;
      const currentSegment = this.getCurrentSegment();
      const localX = this.mesh.position.x - currentSegment.xPosition;

      if (!currentSegment) return;

      switch (e.key) {
        case "ArrowLeft":
          if (localX > -maxX) {
            this.mesh.position.x -= this.lateralSpeed;
          }
          break;
        case "ArrowRight":
          if (localX < maxX) {
            this.mesh.position.x += this.lateralSpeed;
          }
          break;
      }
    });
  }

  getCurrentSegment() {
    // Find the segment the player is currently on
    for (const segment of this.environment.segments) {
      if (
        this.mesh.position.z >
          segment.zPosition - this.environment.segmentLength &&
        this.mesh.position.z <= segment.zPosition
      ) {
        return segment;
      }
    }
    return this.environment.segments[0];
  }

  update() {
    // Move forward
    this.mesh.position.z -= this.speed;

    // Get current segment
    const currentSegment = this.getCurrentSegment();
    if (currentSegment) {
      // Auto-align with road
      const targetX = currentSegment.xPosition;
      const dx = targetX - this.mesh.position.x;
      this.mesh.position.x += dx * this.autoAlignStrength;

      // Enhanced player rotation for turns
      if (currentSegment.turnDirection !== 0) {
        // Rotate player more during turns
        this.mesh.rotation.y = currentSegment.turnDirection * 0.3;
        // Add slight tilt during turns
        this.mesh.rotation.z = -currentSegment.turnDirection * 0.1;
      } else {
        // Smoothly return to straight
        this.mesh.rotation.y *= 0.95;
        this.mesh.rotation.z *= 0.95;
      }
    }

    // Update camera
    this.scene.updateCameraPosition(this.mesh.position);
  }
}
