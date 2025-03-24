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

    // Add speed progression properties
    this.baseForwardSpeed = 0.5;
    this.maxForwardSpeed = 3.0;
    this.speedIncreaseRate = 0.0001; // Reduced from 0.001 for slower acceleration
    this.currentSpeedMultiplier = 1.0;
    this.timeSinceLastHit = 0;

    // Movement settings
    this.moveSpeed = 1.0;
    this.forwardSpeed = this.baseForwardSpeed;
    this.maxOffset = this.environment.roadWidth / 2 - 4;

    // Camera settings
    this.cameraX = 0;
    this.smoothSpeed = 0.015;

    // Add bounce properties
    this.bounceStrength = 0.5; // Increased bounce strength
    this.xVelocity = 0; // Add velocity for smoother bounce

    // Jump properties
    this.isJumping = false;
    this.jumpForce = 0.8;
    this.gravity = 0.04;
    this.jumpVelocity = 0;
    this.groundY = 4; // Normal height of player above ground
    this.jumpCount = 0; // Track number of jumps
    this.maxJumps = 2; // Maximum number of jumps allowed

    // Add score properties
    this.score = 0;
    this.lastPassedObstacleZ = 0;

    // Add sliding properties
    this.isSliding = false;
    this.slideHeight = 2; // Height while sliding (lower than normal)
    this.normalHeight = 8; // Normal height
    this.slideTimer = 0;
    this.slideDuration = 1000; // Sliding duration in milliseconds

    // Add knockback properties
    this.isKnockedBack = false;
    this.knockbackForce = 1.0;
    this.knockbackDuration = 1000; // milliseconds
    this.knockbackTimer = 0;

    // Add obstacle collision property
    this.isBlockedByObstacle = false;

    this.createPlayer();
    this.setupControls();
    this.createRespawnText();
    this.createScoreDisplay();
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
      if (!this.isAlive) return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
          this.xVelocity = -this.moveSpeed;
          break;
        case "ArrowRight":
        case "d":
          this.xVelocity = this.moveSpeed;
          break;
        case " ": // Space bar
          this.jump();
          break;
        case "ArrowDown":
        case "s":
          this.startSlide();
          break;
      }
    });

    // Add key up handler to stop movement
    document.addEventListener("keyup", (e) => {
      if (!this.isAlive) return;

      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) {
        this.xVelocity = 0;
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

  createScoreDisplay() {
    const scoreDiv = document.createElement("div");
    scoreDiv.style.position = "absolute";
    scoreDiv.style.top = "20px";
    scoreDiv.style.left = "20px";
    scoreDiv.style.fontSize = "24px";
    scoreDiv.style.color = "white";
    scoreDiv.style.fontFamily = "Arial, sans-serif";
    scoreDiv.style.padding = "10px";
    scoreDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    scoreDiv.style.borderRadius = "5px";
    scoreDiv.id = "scoreDisplay";
    document.body.appendChild(scoreDiv);
    this.scoreDisplay = scoreDiv;
    this.updateScoreDisplay();
  }

  updateScoreDisplay() {
    const speedPercentage =
      Math.round((this.currentSpeedMultiplier - 1) * 100 * 10) / 10;
    this.scoreDisplay.textContent = `Score: ${this.score} | Speed: +${speedPercentage}%`;
  }

  checkPassedObstacles() {
    const playerZ = this.mesh.position.z;

    this.environment.obstacles.forEach((obstacle) => {
      const obstacleZ = obstacle.mesh.position.z;

      // Check if we just passed this obstacle
      if (obstacleZ > playerZ && obstacleZ < this.lastPassedObstacleZ) {
        // We passed an obstacle without touching it
        this.score += 1;
        this.updateScoreDisplay();
      }
    });

    this.lastPassedObstacleZ = playerZ;
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
    this.respawnCountdown = 3;
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
    this.lastPassedObstacleZ = this.mesh.position.z; // Reset last passed obstacle
  }

  update() {
    if (!this.isAlive) {
      if (this.isFalling) {
        this.mesh.position.y -= this.fallSpeed;
        this.mesh.rotation.x += 0.05;
        this.mesh.rotation.z += 0.05;
      }
      return;
    }

    // Update speed progression
    this.updateSpeed(16);

    // Handle knockback
    if (this.isKnockedBack) {
      this.knockbackTimer += 16;
      if (this.knockbackTimer < this.knockbackDuration) {
        this.zPosition += this.knockbackForce;
        this.mesh.rotation.x = Math.sin(this.knockbackTimer * 0.01) * 0.2;
      } else {
        this.isKnockedBack = false;
        this.mesh.rotation.x = 0;
      }
    }

    // Check for obstacle collision
    if (this.environment.checkObstacleCollisions(this)) {
      // Stop at obstacle if not jumping or moving sideways
      if (!this.isJumping && Math.abs(this.xVelocity) < 0.1) {
        this.isBlockedByObstacle = true;
        this.forwardSpeed = 0;
        this.handleObstacleHit();
      }
    } else {
      // Clear obstacle block when no collision
      this.isBlockedByObstacle = false;
    }

    // Check for passed obstacles
    this.checkPassedObstacles();

    // Check for pendulum collisions
    if (this.environment.checkPendulumCollisions(this)) {
      this.handlePendulumHit();
    }

    // Only move forward if not knocked back and not blocked by obstacle
    if (!this.isKnockedBack && !this.isBlockedByObstacle) {
      this.zPosition -= this.forwardSpeed;
    }

    // Apply velocity to position
    this.xPosition += this.xVelocity;

    // Handle jumping
    if (this.isJumping) {
      this.mesh.position.y += this.jumpVelocity;
      this.jumpVelocity -= this.gravity;

      // Check if landed
      if (this.mesh.position.y <= this.groundY) {
        this.mesh.position.y = this.groundY;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.jumpCount = 0; // Reset jump count when landing
      }
    }

    // Adjust damping for smoother movement at slower speeds
    this.xVelocity *= 0.85;

    const segment = this.getCurrentSegment();
    if (!segment) return;

    // Check wall collisions
    this.handleWallCollisions(segment);

    // Update position
    this.mesh.position.x = this.xPosition;
    this.mesh.position.z = this.zPosition;

    if (this.isAlive) {
      this.updateCamera(segment.xPosition);
    }

    // Update sliding
    this.updateSlide(16); // Assuming 60fps, adjust if using different timing

    // Add speed indicator to score display
    this.updateScoreDisplay();
  }

  handleWallCollisions(segment) {
    const distanceFromCenter = Math.abs(this.xPosition);
    const isOutsideRoad = distanceFromCenter > this.maxOffset;

    if (isOutsideRoad) {
      const side = this.xPosition > 0 ? "right" : "left";
      const hasBarrier = segment.barriers[side].length > 0;

      if (hasBarrier) {
        // Bounce back from wall
        const bounceDirection = this.xPosition > 0 ? -1 : 1;

        // Set position back to road edge
        this.xPosition = this.maxOffset * (this.xPosition > 0 ? 1 : -1);

        // Apply strong bounce velocity
        this.xVelocity = bounceDirection * this.bounceStrength;
      } else {
        // No barrier, player can fall
        this.startFalling();
      }
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

  jump() {
    // Only allow jump if we haven't reached max jumps
    if (this.jumpCount < this.maxJumps) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpForce;
      this.jumpCount++;

      // Optional: Make second jump slightly weaker
      if (this.jumpCount === 2) {
        this.jumpVelocity = this.jumpForce * 0.8;
      }
    }
  }

  // Optional: Add visual feedback for double jump
  getJumpState() {
    if (!this.isJumping) return "grounded";
    return this.jumpCount === 1 ? "first-jump" : "second-jump";
  }

  // Optional: Add method to reset jump state
  resetJumps() {
    this.jumpCount = 0;
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.mesh.position.y = this.groundY;
  }

  startSlide() {
    if (!this.isSliding && !this.isJumping) {
      this.isSliding = true;
      this.slideTimer = 0;
      // Adjust player height for sliding
      this.mesh.scale.y = 0.25; // Flatten the player
      this.mesh.position.y = 2; // Lower position while sliding
    }
  }

  updateSlide(deltaTime) {
    if (this.isSliding) {
      this.slideTimer += deltaTime;
      if (this.slideTimer >= this.slideDuration) {
        // End slide
        this.isSliding = false;
        this.mesh.scale.y = 1; // Restore normal height
        this.mesh.position.y = this.groundY;
      }
    }
  }

  handlePendulumHit() {
    if (!this.isSliding) {
      this.isKnockedBack = true;
      this.knockbackTimer = 0;
      this.score = 0;
      this.updateScoreDisplay();
      // Reset speed
      this.resetSpeed();
    }
  }

  handleObstacleHit() {
    this.score = Math.max(0, this.score - 10);
    this.updateScoreDisplay();
    // Reset speed
    this.resetSpeed();
  }

  updateSpeed(deltaTime) {
    // Only increase speed if not blocked by obstacles or knocked back
    if (!this.isKnockedBack && !this.isFalling && !this.isBlockedByObstacle) {
      this.timeSinceLastHit += deltaTime;
      // Gradually increase speed (much slower now)
      this.currentSpeedMultiplier = Math.min(
        this.maxForwardSpeed / this.baseForwardSpeed,
        1 + this.timeSinceLastHit * this.speedIncreaseRate
      );
      this.forwardSpeed = this.baseForwardSpeed * this.currentSpeedMultiplier;
    }
  }

  resetSpeed() {
    this.currentSpeedMultiplier = 1.0;
    this.forwardSpeed = this.baseForwardSpeed;
    this.timeSinceLastHit = 0;
  }
}
