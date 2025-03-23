export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Runway properties
    const fov = this.scene.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * 30;
    this.runwayWidth = height * this.scene.camera.aspect * 0.8;
    this.segmentLength = 100; // Length of each runway segment
    this.visibleSegments = 15; // Number of segments to keep loaded

    // Store all runway segments
    this.segments = [];
    this.createInitialSegments();
  }

  createSegment(zPosition) {
    // Create runway segment
    const runwayGeometry = new THREE.BoxGeometry(
      this.runwayWidth,
      1,
      this.segmentLength
    );
    const runwayMaterial = new THREE.MeshPhongMaterial({
      color: 0x808080,
      roughness: 0.8,
    });

    const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runway.position.set(0, -0.5, zPosition - this.segmentLength / 2);
    this.scene.scene.add(runway);

    // Add side barriers
    const barrierGeometry = new THREE.BoxGeometry(2, 4, this.segmentLength);
    const barrierMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });

    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.set(
      -(this.runwayWidth / 2 + 1),
      1.5,
      zPosition - this.segmentLength / 2
    );

    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.set(
      this.runwayWidth / 2 + 1,
      1.5,
      zPosition - this.segmentLength / 2
    );

    this.scene.scene.add(leftBarrier);
    this.scene.scene.add(rightBarrier);

    // Add runway markings
    const stripes = this.createStripes(zPosition);

    return {
      runway,
      barriers: { left: leftBarrier, right: rightBarrier },
      stripes,
      zPosition,
    };
  }

  createStripes(zPosition) {
    const stripes = [];
    const stripeWidth = 1;
    const stripeLength = 20;
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    // Create stripes for this segment
    for (let z = 0; z < this.segmentLength; z += 50) {
      const stripeGeometry = new THREE.BoxGeometry(
        stripeWidth,
        0.1,
        stripeLength
      );
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, 0, zPosition - z);
      this.scene.scene.add(stripe);
      stripes.push(stripe);
    }
    return stripes;
  }

  createInitialSegments() {
    for (let i = 0; i < this.visibleSegments; i++) {
      const segment = this.createSegment(-i * this.segmentLength);
      this.segments.push(segment);
    }
  }

  removeSegment(segment) {
    this.scene.scene.remove(segment.runway);
    this.scene.scene.remove(segment.barriers.left);
    this.scene.scene.remove(segment.barriers.right);
    segment.stripes.forEach((stripe) => this.scene.scene.remove(stripe));
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
