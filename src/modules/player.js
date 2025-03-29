// At the top of the file, outside the class
const createHighScoreManager = () => {
  // Set the default high score to 88 if no high score is stored
  let privateHighScore = parseInt(localStorage.getItem("gameHighScore")) || 88;

  return {
    getHighScore: () => privateHighScore,
    updateHighScore: (score) => {
      // Only update if the new score is greater than the current high score
      if (score > privateHighScore) {
        privateHighScore = score;
        // Save to localStorage whenever we set a new high score
        localStorage.setItem("gameHighScore", privateHighScore.toString());
        return true;
      }
      return false;
    },
    resetHighScore: () => {
      privateHighScore = 88; // Reset to default high score of 88
      localStorage.setItem("gameHighScore", "88");
    },
  };
};

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
    this.speedIncreaseRate = 0.000025; // Significantly reduced from 0.0001
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
    this.maxOffsetWhileJumping = this.environment.roadWidth; // Max distance player can jump outside

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

    // Replace the highScore property with the manager
    this.highScoreManager = createHighScoreManager();

    this.createPlayer();
    this.setupControls();
    this.createRespawnText();
    this.createScoreDisplay();
    this.createHighScoreDisplay();
    this.createControlsDisplay();
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

  // Generate a random color that's different from road and rock colors
  generateRandomPlayerColor() {
    // Colors to avoid (road, rocks)
    const avoidColors = [0x333333, 0x708090];

    // Extended palette of vibrant colors that contrast well with the environment
    const colorOptions = [
      // Basic colors
      0xff0000, // Red
      0x0000ff, // Blue
      0xff00ff, // Magenta
      0xffff00, // Yellow
      0x00ffff, // Cyan
      0xff8000, // Orange
      0x8000ff, // Purple
      0xff0080, // Pink
      0x80ff00, // Lime
      0x00ff00, // Green

      // Additional colors
      0xff3366, // Rose
      0x9933ff, // Violet
      0x0099ff, // Azure blue
      0x00cc99, // Caribbean green
      0xffcc00, // Gold
      0xff6600, // Bright orange
      0x9900cc, // Indigo
      0xcc0066, // Crimson
      0x66ff33, // Bright lime
      0x33ccff, // Sky blue
      0xff99cc, // Light pink
      0xff3300, // Vermillion
      0x66ffcc, // Seafoam
      0x6600ff, // Electric purple
      0xff6699, // Hot pink
      0xccff00, // Chartreuse
      0x00ffaa, // Spring green
      0xaa00ff, // Electric violet
      0xffaa00, // Amber
    ];

    // Filter out any colors that are too similar to the ones we want to avoid
    const safeColors = colorOptions.filter((color) => {
      return !avoidColors.some(
        (avoidColor) => Math.abs(color - avoidColor) < 0x333333
      );
    });

    // Choose a random color from the safe colors
    const randomIndex = Math.floor(Math.random() * safeColors.length);
    return safeColors[randomIndex];
  }

  createPlayer() {
    // Make player bigger and brighter
    const geometry = new THREE.BoxGeometry(4, 8, 4);
    const material = new THREE.MeshStandardMaterial({
      color: this.generateRandomPlayerColor(),
      roughness: 0.5,
      metalness: 0.5,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 4, this.zPosition);
    this.scene.scene.add(this.mesh);
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
    scoreDiv.style.lineHeight = "1.5";
    scoreDiv.id = "scoreDisplay";
    document.body.appendChild(scoreDiv);
    this.scoreDisplay = scoreDiv;
    this.updateScoreDisplay();
  }

  createHighScoreDisplay() {
    const highScoreDiv = document.createElement("div");
    highScoreDiv.style.position = "absolute";
    highScoreDiv.style.top = "20px";
    highScoreDiv.style.right = "20px"; // Position on right side
    highScoreDiv.style.fontSize = "24px";
    highScoreDiv.style.color = "white";
    highScoreDiv.style.fontFamily = "Arial, sans-serif";
    highScoreDiv.style.padding = "10px";
    highScoreDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    highScoreDiv.style.borderRadius = "5px";
    highScoreDiv.id = "highScoreDisplay";
    document.body.appendChild(highScoreDiv);
    this.highScoreDisplay = highScoreDiv;
    this.updateHighScoreDisplay();
  }

  createControlsDisplay() {
    const controlsDiv = document.createElement("div");
    controlsDiv.style.position = "absolute";
    controlsDiv.style.top = "120px"; // Adjusted position to avoid overlap
    controlsDiv.style.left = "20px"; // Align with the score display
    controlsDiv.style.fontSize = "18px";
    controlsDiv.style.color = "white";
    controlsDiv.style.fontFamily = "Arial, sans-serif";
    controlsDiv.style.padding = "10px";
    controlsDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    controlsDiv.style.borderRadius = "5px";
    controlsDiv.style.lineHeight = "1.5";
    controlsDiv.id = "controlsDisplay";
    document.body.appendChild(controlsDiv);

    // Set the content of the controls display
    controlsDiv.innerHTML = `
        <strong>Controls:</strong><br>
        <span> A/D - Move Left/Right </span><br>
        <span>SPACE - Jump</span><br>
        <span>S - Slide</span><br>
    `;
  }

  updateScoreDisplay() {
    const speedPercentage = Math.round((this.currentSpeedMultiplier - 1) * 100);
    this.scoreDisplay.textContent = `Score: ${this.score}\nSpeed: ${speedPercentage}%`;
    this.scoreDisplay.style.whiteSpace = "pre-line";
  }

  updateHighScoreDisplay() {
    this.highScoreManager.updateHighScore(this.score);
    this.highScoreDisplay.textContent = `High Score: ${this.highScoreManager.getHighScore()}`;
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
        this.updateHighScoreDisplay();
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
    this.score = 0; // Reset score to 0
    this.resetSpeed(); // Reset speed to 0
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

    // Check for portal collisions
    const portal = this.environment.checkPortalCollisions(this);
    if (portal) {
      console.log('PORTAL COLLISION DETECTED!');
      this.teleportThroughPortal(portal);
    }

    // Only move forward if not knocked back and not blocked by obstacle
    if (!this.isKnockedBack && !this.isBlockedByObstacle) {
      this.zPosition -= this.forwardSpeed;
    }

    // Apply velocity to position
    this.xPosition += this.xVelocity;

    // Get the current segment first
    const segment = this.getCurrentSegment();
    if (!segment) return;

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

        // Check if player landed outside road boundaries
        this.checkLandingOutsideRoad(segment);
      }
    }

    // Adjust damping for smoother movement at slower speeds
    this.xVelocity *= 0.85;

    // Check wall collisions only if not jumping
    if (!this.isJumping) {
      this.handleWallCollisions(segment);
    }

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

  checkLandingOutsideRoad(segment) {
    // Check if player landed outside road boundaries
    const distanceFromCenter = Math.abs(this.xPosition);
    const isOutsideRoad = distanceFromCenter > this.maxOffset;

    if (isOutsideRoad) {
      // Player landed outside the road - make them fall regardless of barrier
      // This ensures you fall when landing outside, making the jump mechanic consistent
      this.startFalling();
    }
  }

  handleWallCollisions(segment) {
    // Use different boundary limits depending on whether player is jumping
    const currentMaxOffset = this.isJumping
      ? this.maxOffsetWhileJumping
      : this.maxOffset;
    const distanceFromCenter = Math.abs(this.xPosition);
    const isOutsideRoad = distanceFromCenter > currentMaxOffset;

    // If outside road and not jumping (normal movement)
    if (isOutsideRoad && !this.isJumping) {
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
    } else if (isOutsideRoad && this.isJumping) {
      // Player is jumping and has gone extremely far (past maxOffsetWhileJumping)
      // Only limit their position at the extreme boundary
      this.xPosition = currentMaxOffset * (this.xPosition > 0 ? 1 : -1);
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

      // Temporarily increase maxOffset to allow jumping outside walls
      this.maxOffsetWhileJumping = this.environment.roadWidth;

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

  checkPortalCollisions() {
    // Only check if player is alive and jumping (can only enter portals while jumping)
    if (!this.isAlive || !this.isJumping) return;

    // Check for portal collision using Environment's method
    const portal = this.environment.checkPortalCollisions(this);

    if (portal) {
      // Player has entered a portal
      this.teleportThroughPortal(portal);
    }
  }

  teleportThroughPortal(portal) {
    // Deactivate the portal so it can't be used again
    portal.active = false;

    // Create a teleport effect
    this.createTeleportEffect(portal.mesh.position);
    
    // Make sure we actually follow through with redirecting
    console.log('Entering portal:', portal);
    
    // Check if this is a Vibeverse Portal (it will have isVibeverse=true)
    if (portal.isVibeverse) {
      console.log('This is a Vibeverse portal! Redirecting...');
      // Redirect to portal.pieter.com with player data as query params
      this.redirectToVibeverse();
      return;
    } else {
      // Always redirect to Vibeverse for now (guaranteed to work)
      console.log('Treating all portals as Vibeverse portals for testing');
      this.redirectToVibeverse();
      return;
    }
    
    // The code below won't execute anymore as we're redirecting for all portals
    
    // Regular in-game portal teleportation
    // Teleport player forward
    this.zPosition -= 150; // Jump ahead 150 units

    // Random X position on the road
    this.xPosition = (Math.random() - 0.5) * (this.environment.roadWidth - 10);

    // Boost speed temporarily
    const originalSpeed = this.forwardSpeed;
    this.forwardSpeed *= 1.5;

    // Speed boost is temporary - gradually return to normal
    setTimeout(() => {
      this.forwardSpeed = originalSpeed;
    }, 3000);

    // Add bonus score for using portal
    this.score += 100;
  }

  createTeleportEffect(position) {
    // Create a flash effect at portal location
    const flashGeometry = new THREE.SphereGeometry(10, 32, 32);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: this.environment.portalColor,
      transparent: true,
      opacity: 0.7,
    });

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.scene.add(flash);

    // Animate the flash effect
    let scale = 1;
    const expandFlash = () => {
      scale += 0.2;
      flash.scale.set(scale, scale, scale);
      flash.material.opacity -= 0.05;

      if (flash.material.opacity > 0) {
        requestAnimationFrame(expandFlash);
      } else {
        this.scene.scene.remove(flash);
      }
    };

    requestAnimationFrame(expandFlash);
  }
  
  redirectToVibeverse() {
    // Build query parameters for the portal redirect
    const params = new URLSearchParams();
    
    // Add player data
    params.append('portal', 'true');
    
    // Get player name or generate a random one
    // Check different potential name properties based on the class structure
    const playerName = this.name || this.username || 'BugRunner_' + Math.floor(Math.random() * 1000);
    params.append('username', playerName);
    
    // Get player color in hex format
    let colorHex;
    if (this.colors && this.colorIndex !== undefined) {
      // If using the colors array
      colorHex = this.colors[this.colorIndex];
    } else if (this.mesh && this.mesh.material && this.mesh.material.color) {
      // If using Three.js material color
      colorHex = this.mesh.material.color.getHex();
    } else {
      // Default fallback color (bright green)
      colorHex = 0x00ff00;
    }
    
    // Format the color as a hex string
    const colorString = colorHex.toString(16).padStart(6, '0');
    params.append('color', colorString);
    
    // Add speed (in m/s)
    params.append('speed', this.forwardSpeed.toFixed(2));
    
    // Add reference to this game
    params.append('ref', window.location.href);
    
    // Create a URL with the portal destination and parameters
    const portalUrl = 'http://portal.pieter.com/?' + params.toString();
    
    // Create a preloading effect before redirecting
    console.log('Redirecting to Vibeverse Portal:', portalUrl);
    
    // Show a portal transition effect before redirecting
    const transitionOverlay = document.createElement('div');
    transitionOverlay.style.position = 'fixed';
    transitionOverlay.style.top = '0';
    transitionOverlay.style.left = '0';
    transitionOverlay.style.width = '100%';
    transitionOverlay.style.height = '100%';
    transitionOverlay.style.backgroundColor = '#00ff00';
    transitionOverlay.style.opacity = '0';
    transitionOverlay.style.transition = 'opacity 1s';
    transitionOverlay.style.zIndex = '1000';
    document.body.appendChild(transitionOverlay);
    
    // For debugging - add a visible message that we can see
    const debugMessage = document.createElement('div');
    debugMessage.style.position = 'fixed';
    debugMessage.style.top = '50%';
    debugMessage.style.left = '50%';
    debugMessage.style.transform = 'translate(-50%, -50%)';
    debugMessage.style.color = '#ffffff';
    debugMessage.style.fontSize = '24px';
    debugMessage.style.fontWeight = 'bold';
    debugMessage.style.zIndex = '1001';
    debugMessage.textContent = 'Redirecting to: ' + portalUrl;
    document.body.appendChild(debugMessage);
    
    // IMMEDIATELY change location - no timeout to make sure it happens
    window.location.href = portalUrl;
    
    // Backup plan with timeout (in case immediate redirect doesn't work)
    setTimeout(() => {
      console.log('Backup redirect happening now');
      window.location.replace(portalUrl);
    }, 500);
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
