export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Runway properties
    const fov = this.scene.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * 30;
    this.runwayWidth = height * this.scene.camera.aspect * 0.7; // Slightly narrower
    this.segmentLength = 80;
    this.visibleSegments = 12;

    // Store all runway segments
    this.segments = [];
    this.createInitialSegments();
  }

  createSegment(zPosition) {
    // Create textured runway
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
    runway.position.set(0, -0.5, zPosition - this.segmentLength / 2);
    runway.receiveShadow = true;
    this.scene.scene.add(runway);

    // Create decorated barriers
    const barrierGeometry = new THREE.BoxGeometry(2, 6, this.segmentLength);
    const barrierMaterial = new THREE.MeshPhongMaterial({
      color: 0x505050,
      roughness: 0.7,
      metalness: 0.3,
    });

    // Add temple-like decorations on barriers
    const decorationSpacing = 20;
    const decorations = [];

    for (let z = 0; z < this.segmentLength; z += decorationSpacing) {
      const leftDecoration = this.createDecoration();
      leftDecoration.position.set(
        -(this.runwayWidth / 2 + 1),
        3,
        zPosition - z
      );

      const rightDecoration = this.createDecoration();
      rightDecoration.position.set(this.runwayWidth / 2 + 1, 3, zPosition - z);

      decorations.push(leftDecoration, rightDecoration);
      this.scene.scene.add(leftDecoration, rightDecoration);
    }

    // Add ground texture beyond runway
    const groundGeometry = new THREE.PlaneGeometry(200, this.segmentLength);
    const groundMaterial = new THREE.MeshPhongMaterial({
      color: 0x285728, // Dark grass color
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.6, zPosition - this.segmentLength / 2);
    this.scene.scene.add(ground);

    return {
      runway,
      decorations,
      ground,
      zPosition,
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
