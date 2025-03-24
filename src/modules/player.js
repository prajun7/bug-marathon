export class Player {
  constructor(scene) {
    this.scene = scene;

    // Reduced speed settings
    this.speed = 1; // Halved from 0.5
    this.lateralSpeed = 0.4; // Halved from 0.8

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

  checkCollisions() {
    // This will be implemented later
    // Placeholder for future collision detection
    /*
    const playerBounds = new THREE.Box3().setFromObject(this.mesh);
    
    // Check if player is out of bounds (no rocks)
    if (this.isOutOfBounds()) {
        // Player will fall
    }

    // Check rock collisions
    this.environment.getCurrentSegment(this.position).barriers.forEach(rock => {
        if (rock.userData.isBarrier) {
            const rockBounds = new THREE.Box3().setFromObject(rock);
            if (playerBounds.intersectsBox(rockBounds)) {
                // Apply push force
                const pushForce = rock.userData.pushForce;
                // Push player back
            }
        }
    });
    */
  }

  update(deltaTime) {
    // Move forward continuously
    this.mesh.position.z -= this.speed;

    // Update camera to follow player
    this.scene.updateCameraPosition(this.mesh.position);

    // Add this line when ready to implement collisions
    // this.checkCollisions();
  }
}
