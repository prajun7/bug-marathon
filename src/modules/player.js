export class Player {
  constructor(scene, environment) {
    this.scene = scene;
    this.environment = environment;

    // Movement settings
    this.speed = 1;
    this.isMovingLeft = false;
    this.isMovingRight = false;

    // Position values
    this.lanePosition = 0; // -1 = left, 0 = center, 1 = right
    this.targetX = 0;
    this.smoothingFactor = 0.1; // Slower smoothing for stability

    this.createPlayer();
    this.setupControls();

    // For fixed segment tracking
    this.currentSegmentIndex = 0;
  }

  createPlayer() {
    const geometry = new THREE.BoxGeometry(2, 4, 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      shininess: 30,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 2, 0);
    this.scene.scene.add(this.mesh);
  }

  setupControls() {
    // Track key state instead of direct movement
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        if (this.lanePosition > -1) {
          this.lanePosition -= 0.5;
        }
      } else if (e.key === "ArrowRight" || e.key === "d") {
        if (this.lanePosition < 1) {
          this.lanePosition += 0.5;
        }
      }
    });
  }

  getCurrentSegment() {
    if (!this.environment.segments.length) return null;

    const playerZ = this.mesh.position.z;
    for (let segment of this.environment.segments) {
      if (
        playerZ >= segment.zPosition - this.environment.segmentLength &&
        playerZ <= segment.zPosition
      ) {
        return segment;
      }
    }
    return this.environment.segments[0];
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

  update() {
    // Move forward continuously
    this.mesh.position.z -= this.speed;

    // Get current segment - only update segment when crossed boundary
    if (this.environment.segments.length === 0) return;

    const playerZ = this.mesh.position.z;
    let segment = null;

    // Find current segment based on z position
    for (let i = 0; i < this.environment.segments.length; i++) {
      const segmentZ = this.environment.segments[i].zPosition;
      if (
        playerZ >= segmentZ - this.environment.segmentLength &&
        playerZ <= segmentZ
      ) {
        segment = this.environment.segments[i];
        this.currentSegmentIndex = i;
        break;
      }
    }

    if (
      !segment &&
      this.currentSegmentIndex < this.environment.segments.length
    ) {
      segment = this.environment.segments[this.currentSegmentIndex];
    }

    if (!segment) return;

    // Get road center at current position
    const roadWidth = this.environment.roadWidth;
    const xOffset = this.lanePosition * (roadWidth / 3); // Divide road into 3 lanes

    // Simple way to get road center X (no tangent calculations)
    this.targetX = segment.xPosition + xOffset;

    // Smoothly move toward target X position
    this.mesh.position.x +=
      (this.targetX - this.mesh.position.x) * this.smoothingFactor;

    // Very gradually rotate to match road angle
    const targetRotation = segment.angle;
    this.mesh.rotation.y += (targetRotation - this.mesh.rotation.y) * 0.05;

    // Update camera using same smoothing principle
    const cameraTarget = {
      x: this.mesh.position.x,
      y: this.mesh.position.y + 10,
      z: this.mesh.position.z + 35,
    };

    this.scene.updateCameraPosition(cameraTarget);
  }
}
