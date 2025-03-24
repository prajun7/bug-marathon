export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Runway properties
    const fov = this.scene.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * 30;
    this.runwayWidth = height * this.scene.camera.aspect * 0.7;
    this.segmentLength = 80;
    this.visibleSegments = 12;

    // Enhanced turning parameters
    this.currentX = 0;
    this.targetX = 0;
    this.turnDirection = 0;
    this.turnTimer = 0;
    this.turnDuration = 3; // Shorter duration for more frequent turns
    this.turnMagnitude = 5; // Increased turn sharpness
    this.turnChance = 0.6; // 60% chance to turn (up from 30%)
    this.straightDuration = 2; // Shorter straight sections

    this.segments = [];
    this.createInitialSegments();
  }

  updatePath() {
    this.turnTimer--;

    // More frequent turn decisions
    if (this.turnTimer <= 0) {
      if (Math.random() < this.turnChance) {
        // Increased chance to turn
        // Possibility of continuing in same direction for longer curves
        if (this.turnDirection !== 0 && Math.random() < 0.3) {
          // Keep current direction
          this.turnTimer = this.turnDuration;
        } else {
          // New random direction
          this.turnDirection = Math.random() < 0.5 ? -1 : 1;
          this.turnTimer = this.turnDuration;
        }
      } else {
        this.turnDirection = 0;
        this.turnTimer = this.straightDuration;
      }
    }

    // Update current X position with more pronounced turns
    if (this.turnDirection !== 0) {
      this.currentX += this.turnDirection * this.turnMagnitude;

      // Add slight variation to turn magnitude for more natural feeling
      const turnVariation = (Math.random() - 0.5) * 0.5;
      this.currentX += this.turnDirection * turnVariation;

      // Limit maximum deviation with wider bounds
      this.currentX = Math.max(-70, Math.min(70, this.currentX));
    }

    // Add subtle wobble even during straight sections
    if (this.turnDirection === 0) {
      this.currentX += (Math.random() - 0.5) * 0.5;
    }
  }

  createSegment(zPosition) {
    // Update path direction
    this.updatePath();

    // Create runway with slight banking on turns
    const runwayGeometry = new THREE.BoxGeometry(
      this.runwayWidth,
      1,
      this.segmentLength
    );
    const runwayMaterial = new THREE.MeshPhongMaterial({
      color: 0x505050,
      roughness: 0.8,
      metalness: 0.2,
    });

    const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runway.position.set(
      this.currentX,
      -0.5,
      zPosition - this.segmentLength / 2
    );
    // Add slight banking effect on turns
    runway.rotation.z = -this.turnDirection * 0.05;
    runway.receiveShadow = true;
    this.scene.scene.add(runway);

    // Ground follows the path
    const groundGeometry = new THREE.PlaneGeometry(200, this.segmentLength);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x285728,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(
      this.currentX,
      -0.6,
      zPosition - this.segmentLength / 2
    );
    this.scene.scene.add(ground);

    // Add decorations following the path
    const decorations = [];
    const decorationSpacing = 20;

    for (let z = 0; z < this.segmentLength; z += decorationSpacing) {
      const leftDecoration = this.createDecoration();
      leftDecoration.position.set(
        this.currentX - (this.runwayWidth / 2 + 1),
        3,
        zPosition - z
      );
      // Tilt decorations slightly with turn
      leftDecoration.rotation.z = -this.turnDirection * 0.05;

      const rightDecoration = this.createDecoration();
      rightDecoration.position.set(
        this.currentX + (this.runwayWidth / 2 + 1),
        3,
        zPosition - z
      );
      rightDecoration.rotation.z = -this.turnDirection * 0.05;

      decorations.push(leftDecoration, rightDecoration);
      this.scene.scene.add(leftDecoration, rightDecoration);
    }

    return {
      runway,
      decorations,
      ground,
      zPosition,
      xPosition: this.currentX,
      turnDirection: this.turnDirection,
    };
  }

  createDecoration() {
    // Create temple-like column decoration
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      roughness: 0.8,
    });
    const decoration = new THREE.Mesh(geometry, material);
    decoration.castShadow = true;
    return decoration;
  }

  createInitialSegments() {
    for (let i = 0; i < this.visibleSegments; i++) {
      const segment = this.createSegment(-i * this.segmentLength);
      this.segments.push(segment);
    }
  }

  removeSegment(segment) {
    this.scene.scene.remove(segment.runway);
    this.scene.scene.remove(segment.ground);
    segment.decorations.forEach((dec) => this.scene.scene.remove(dec));
  }

  update(playerPosition) {
    // Check if we need to create new segments
    const lastSegment = this.segments[this.segments.length - 1];
    const distanceToLast = Math.abs(playerPosition.z - lastSegment.zPosition);

    if (distanceToLast < this.segmentLength * 5) {
      // Create new segment
      const newZ = lastSegment.zPosition - this.segmentLength;
      const newSegment = this.createSegment(newZ);
      this.segments.push(newSegment);

      // Remove old segment if we have too many
      if (this.segments.length > this.visibleSegments) {
        const oldSegment = this.segments.shift();
        this.removeSegment(oldSegment);
      }
    }
  }
}
