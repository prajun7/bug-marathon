export class Environment {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;

    // Track segments
    this.segments = [];
    this.segmentLength = 30; // Longer segments
    this.segmentWidth = 10;
    this.visibleSegments = 4; // More visible segments

    this.createInitialSegments();
  }

  createSegment(position) {
    // Visual representation
    const geometry = new THREE.BoxGeometry(
      this.segmentWidth,
      1,
      this.segmentLength
    );
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      roughness: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    this.scene.scene.add(mesh);

    // Add side barriers
    const barrierGeometry = new THREE.BoxGeometry(0.5, 2, this.segmentLength);
    const barrierMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });

    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.set(
      position.x - (this.segmentWidth / 2 + 0.25),
      position.y + 1,
      position.z
    );

    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.set(
      position.x + (this.segmentWidth / 2 + 0.25),
      position.y + 1,
      position.z
    );

    this.scene.scene.add(leftBarrier);
    this.scene.scene.add(rightBarrier);

    // Physics body for the track
    const body = this.physics.createBox(
      { x: this.segmentWidth, y: 1, z: this.segmentLength },
      position,
      0 // mass (0 = static)
    );
    this.physics.addBody(body);

    // Physics bodies for barriers
    const leftBarrierBody = this.physics.createBox(
      { x: 0.5, y: 2, z: this.segmentLength },
      leftBarrier.position,
      0
    );
    const rightBarrierBody = this.physics.createBox(
      { x: 0.5, y: 2, z: this.segmentLength },
      rightBarrier.position,
      0
    );
    this.physics.addBody(leftBarrierBody);
    this.physics.addBody(rightBarrierBody);

    return {
      mesh,
      body,
      position,
      barriers: {
        left: { mesh: leftBarrier, body: leftBarrierBody },
        right: { mesh: rightBarrier, body: rightBarrierBody },
      },
    };
  }

  createInitialSegments() {
    for (let i = 0; i < this.visibleSegments; i++) {
      const position = new THREE.Vector3(
        0,
        0, // Moved up to y=0
        -i * this.segmentLength
      );
      this.segments.push(this.createSegment(position));
    }
  }

  update(playerPosition) {
    // Check if we need to create new segments
    const lastSegment = this.segments[this.segments.length - 1];
    if (-playerPosition.z > lastSegment.position.z - this.segmentLength) {
      // Create new segment
      const newPosition = new THREE.Vector3(
        0,
        -0.5,
        lastSegment.position.z - this.segmentLength
      );
      this.segments.push(this.createSegment(newPosition));

      // Remove old segment
      if (this.segments.length > this.visibleSegments) {
        const oldSegment = this.segments.shift();
        this.scene.scene.remove(oldSegment.mesh);
        this.physics.removeBody(oldSegment.body);

        // Remove barriers
        this.scene.scene.remove(oldSegment.barriers.left.mesh);
        this.scene.scene.remove(oldSegment.barriers.right.mesh);
        this.physics.removeBody(oldSegment.barriers.left.body);
        this.physics.removeBody(oldSegment.barriers.right.body);
      }
    }
  }
}
