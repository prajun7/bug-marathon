export class Player {
  constructor(scene, environment) {
    this.scene = scene;
    this.environment = environment;

    // Position settings
    this.xPosition = 0;
    this.zPosition = -20;
    this.isAlive = true;
    this.isFalling = false;
    this.respawnCountdown = 5;
    this.fallSpeed = 0.5;

    // Movement settings
    this.moveSpeed = 1.5;
    this.maxOffset = this.environment.roadWidth / 2 - 2;

    // Camera settings
    this.cameraX = 0;
    this.smoothSpeed = 0.015;

    this.createPlayer();
    this.setupControls();
    this.createRespawnText();
  }

  getCurrentSegment() {
    // Find current road segment
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

  createPlayer() {
    // Make player bigger and brighter
    const geometry = new THREE.BoxGeometry(4, 8, 4);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
      shininess: 30,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 4, this.zPosition);
    this.scene.scene.add(this.mesh);

    console.log("Player created at:", this.mesh.position);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      if (!this.isAlive) return; // Don't process controls while falling/respawning

      switch (e.key) {
        case "ArrowLeft":
        case "a":
          this.xPosition -= this.moveSpeed;
          break;
        case "ArrowRight":
        case "d":
          this.xPosition += this.moveSpeed;
          break;
      }
    });
  }

  createRespawnText() {
    // Create HTML element for respawn message
    const respawnDiv = document.createElement("div");
    respawnDiv.style.position = "absolute";
    respawnDiv.style.top = "50%";
    respawnDiv.style.left = "50%";
    respawnDiv.style.transform = "translate(-50%, -50%)";
    respawnDiv.style.fontSize = "48px";
    respawnDiv.style.color = "white";
    respawnDiv.style.display = "none";
    respawnDiv.id = "respawnText";
    document.body.appendChild(respawnDiv);
    this.respawnText = respawnDiv;
  }

  checkFall() {
    if (this.isFalling) return true;

    const segment = this.getCurrentSegment();
    if (!segment) return false;

    const distanceFromCenter = Math.abs(this.xPosition);
    const isOutsideRoad = distanceFromCenter > this.maxOffset;

    if (isOutsideRoad) {
      // Check if there's a barrier at this position
      const side = this.xPosition > 0 ? "right" : "left";
      const hasBarrier = segment.barriers[side].length > 0;

      if (!hasBarrier) {
        this.startFalling();
        return true;
      }
    }

    return false;
  }

  startFalling() {
    this.isFalling = true;
    this.isAlive = false;
    this.respawnCountdown = 5;
    this.showRespawnMessage();
  }

  showRespawnMessage() {
    this.respawnText.style.display = "block";
    this.updateRespawnCounter();
  }

  updateRespawnCounter() {
    if (this.respawnCountdown > 0) {
      this.respawnText.textContent = `Respawning in ${this.respawnCountdown}...`;
      this.respawnCountdown--;
      setTimeout(() => this.updateRespawnCounter(), 1000);
    } else {
      this.respawn();
    }
  }

  respawn() {
    this.isFalling = false;
    this.isAlive = true;
    this.xPosition = 0;
    this.mesh.position.y = 4;
    this.mesh.rotation.set(0, 0, 0);
    this.respawnText.style.display = "none";
  }

  update() {
    if (!this.isAlive) {
      if (this.isFalling) {
        // Update falling animation
        this.mesh.position.y -= this.fallSpeed;
        this.mesh.rotation.x += 0.05;
        this.mesh.rotation.z += 0.05;
      }
      return;
    }

    // Add constant forward movement (negative Z is forward)
    this.forwardSpeed = 1.0; // Adjust this value to change speed
    this.zPosition -= this.forwardSpeed;

    // Normal movement update
    const segment = this.getCurrentSegment();
    if (!segment) return;

    // Check for falling
    this.checkFall();

    // Update position
    this.mesh.position.x = this.xPosition;
    this.mesh.position.z = this.zPosition;

    // Update camera
    if (this.isAlive) {
      this.updateCamera(segment.xPosition);
    }
  }

  updateCamera(roadCenterX) {
    // Camera follows road center
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
