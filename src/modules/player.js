export class Player {
  constructor(scene, environment) {
    this.scene = scene;
    this.environment = environment;

    // Position tracking
    this.xPosition = 0;
    this.zPosition = -30;

    // Movement constraints
    this.moveSpeed = 2;
    this.maxOffset = this.environment.roadWidth / 2 - 2;

    // Camera smoothing
    this.cameraX = 0;
    this.cameraTargetX = 0;
    this.smoothSpeed = 0.015; // Very small for extra smoothness

    // Store previous positions for smoothing
    this.previousCenterPoints = [];
    this.maxPreviousPoints = 10;

    this.createPlayer();
    this.setupControls();
  }

  createPlayer() {
    const geometry = new THREE.BoxGeometry(4, 8, 4);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.2,
      shininess: 30,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 4, this.zPosition);
    this.scene.scene.add(this.mesh);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      const currentSegment = this.getCurrentSegment();
      if (!currentSegment) return;

      const roadCenterX = currentSegment.xPosition;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
          const newLeftPos = this.xPosition - this.moveSpeed;
          const leftDistance = Math.abs(newLeftPos - roadCenterX);
          if (leftDistance < this.maxOffset) {
            this.xPosition = newLeftPos;
          }
          break;

        case "ArrowRight":
        case "d":
          const newRightPos = this.xPosition + this.moveSpeed;
          const rightDistance = Math.abs(newRightPos - roadCenterX);
          if (rightDistance < this.maxOffset) {
            this.xPosition = newRightPos;
          }
          break;
      }
    });
  }

  getCurrentSegment() {
    for (const segment of this.environment.segments) {
      if (
        this.zPosition >= segment.zPosition - this.environment.segmentLength &&
        this.zPosition <= segment.zPosition
      ) {
        return segment;
      }
    }
    return this.environment.segments[0];
  }

  getAverageCenterPoint() {
    if (this.previousCenterPoints.length === 0) return null;

    // Calculate weighted average of previous points
    let totalX = 0;
    let totalWeight = 0;

    this.previousCenterPoints.forEach((point, index) => {
      const weight = (index + 1) / this.previousCenterPoints.length;
      totalX += point.x * weight;
      totalWeight += weight;
    });

    return totalX / totalWeight;
  }

  updateCamera(roadCenterX) {
    // Add current center point to history
    this.previousCenterPoints.push({ x: roadCenterX });
    if (this.previousCenterPoints.length > this.maxPreviousPoints) {
      this.previousCenterPoints.shift();
    }

    // Get smoothed center point
    const averageCenterX = this.getAverageCenterPoint() || roadCenterX;

    // Predict future position based on road curve
    const nextSegment = this.environment.segments.find(
      (seg) => seg.zPosition < this.zPosition - this.environment.segmentLength
    );
    let predictedX = averageCenterX;
    if (nextSegment) {
      predictedX = (averageCenterX + nextSegment.xPosition) / 2;
    }

    // Super smooth camera movement
    this.cameraTargetX = predictedX;
    this.cameraX += (this.cameraTargetX - this.cameraX) * this.smoothSpeed;

    // Update camera position with smoothed values
    const cameraHeight = 20;
    const cameraDistance = 35;

    this.scene.camera.position.set(
      this.cameraX,
      cameraHeight,
      this.zPosition + cameraDistance
    );

    // Smooth look-at point
    const lookAtX = this.cameraX;
    const lookAtZ = this.zPosition - 30;
    const lookAtY = 0;

    this.scene.camera.lookAt(lookAtX, lookAtY, lookAtZ);
  }

  update() {
    const currentSegment = this.getCurrentSegment();
    if (!currentSegment) return;

    const roadCenterX = currentSegment.xPosition;

    // Keep player on road
    const distanceFromCenter = Math.abs(this.xPosition - roadCenterX);
    if (distanceFromCenter > this.maxOffset) {
      const direction = this.xPosition > roadCenterX ? 1 : -1;
      this.xPosition = roadCenterX + this.maxOffset * direction;
    }

    // Update player position
    this.mesh.position.x = this.xPosition;
    this.mesh.position.z = this.zPosition;
    this.mesh.rotation.y = currentSegment.angle;

    // Update camera with enhanced smoothing
    this.updateCamera(roadCenterX);
  }
}
