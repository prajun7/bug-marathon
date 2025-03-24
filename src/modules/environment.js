export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Road properties
    this.roadWidth = 40;
    this.segmentLength = 100;
    this.visibleSegments = 15;

    this.segments = [];

    // Cloud properties
    this.clouds = [];
    this.maxClouds = 80;
    this.cloudSpawnTimer = 0;
    this.cloudSpawnInterval = 50;

    // Cloud boundaries
    this.cloudBounds = {
      minX: -300,
      maxX: 300,
      minY: 30,
      maxY: 150,
      minZ: -400,
      maxZ: 200,
    };

    // Initialize
    this.createInitialSegments();
    this.createInitialClouds();
  }

  createSegment(zPosition) {
    // Keep track of last few segments to prevent too many consecutive gaps
    if (!this.lastBarrierStates) {
      this.lastBarrierStates = [];
    }

    const roadGeometry = new THREE.BoxGeometry(
      this.roadWidth,
      2,
      this.segmentLength
    );
    const roadMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 10,
    });

    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(0, -1, zPosition);
    this.scene.scene.add(road);

    // Create barriers with pattern checking
    const barriers = this.createBarriers(zPosition);

    // Store the state of this segment's barriers
    this.lastBarrierStates.push({
      hasLeft: barriers.left.length > 0,
      hasRight: barriers.right.length > 0,
    });

    // Keep only last 3 states
    if (this.lastBarrierStates.length > 3) {
      this.lastBarrierStates.shift();
    }

    return {
      road,
      barriers,
      xPosition: 0,
      zPosition,
      angle: 0,
    };
  }

  createBarriers(zPosition) {
    const barriers = { left: [], right: [] };

    // Random chance to have barriers on each side
    const hasLeftBarrier = Math.random() < 0.7; // 70% chance for left barrier
    const hasRightBarrier = Math.random() < 0.7; // 70% chance for right barrier

    const barrierGeometry = new THREE.BoxGeometry(1, 4, this.segmentLength);
    const barrierMaterial = new THREE.MeshPhongMaterial({
      color: 0x707070,
      roughness: 0.8,
    });

    // Create left barrier only if random check passes
    if (hasLeftBarrier) {
      const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      leftBarrier.position.set(-this.roadWidth / 2, 2, zPosition);
      this.scene.scene.add(leftBarrier);
      barriers.left.push(leftBarrier);
    }

    // Create right barrier only if random check passes
    if (hasRightBarrier) {
      const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      rightBarrier.position.set(this.roadWidth / 2, 2, zPosition);
      this.scene.scene.add(rightBarrier);
      barriers.right.push(rightBarrier);
    }

    return barriers;
  }

  createInitialSegments() {
    for (let i = 0; i < this.visibleSegments; i++) {
      const segment = this.createSegment(-i * this.segmentLength);
      this.segments.push(segment);
    }
  }

  update(playerPosition) {
    if (!playerPosition) return;

    // Check if we need to add new segment
    const lastSegment = this.segments[this.segments.length - 1];
    if (!lastSegment) return;

    const newZ = lastSegment.zPosition - this.segmentLength;

    if (Math.abs(playerPosition.z - newZ) < this.segmentLength * 3) {
      // Add new segment
      const newSegment = this.createSegment(newZ);
      this.segments.push(newSegment);

      // Remove old segment if too many
      if (this.segments.length > this.visibleSegments) {
        const oldSegment = this.segments.shift();
        this.scene.scene.remove(oldSegment.road);
        oldSegment.barriers.left.forEach((b) => this.scene.scene.remove(b));
        oldSegment.barriers.right.forEach((b) => this.scene.scene.remove(b));
      }
    }

    // Update clouds with player position
    this.updateClouds(playerPosition);
  }

  createCloud() {
    const cloudGeometry = new THREE.SphereGeometry(5, 16, 16);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      color: 0xeeeeee,
      transparent: true,
      opacity: 0.5,
    });

    const cloud = new THREE.Group();

    // More spheres per cloud
    for (let i = 0; i < 12; i++) {
      const sphere = new THREE.Mesh(cloudGeometry, cloudMaterial);
      sphere.position.x = (Math.random() - 0.5) * 15;
      sphere.position.y = (Math.random() - 0.5) * 8;
      sphere.position.z = (Math.random() - 0.5) * 15;
      sphere.scale.set(
        Math.random() * 0.7 + 0.4,
        Math.random() * 0.5 + 0.2,
        Math.random() * 0.7 + 0.4
      );
      cloud.add(sphere);
    }

    // Wider distribution of clouds
    const side = Math.random() < 0.5 ? -1 : 1;
    cloud.position.set(
      (Math.random() * 150 + 50) * side,
      Math.random() * 80 + 30,
      Math.random() * 400 - 200
    );

    cloud.userData = {
      speed: Math.random() * 0.08 + 0.02,
      side: side,
    };

    this.scene.scene.add(cloud);
    return cloud;
  }

  createInitialClouds() {
    for (let i = 0; i < this.maxClouds; i++) {
      this.clouds.push(this.createCloud());
    }
  }

  updateClouds(playerPosition) {
    // Default position if playerPosition is undefined
    const zPos = playerPosition?.z || 0;

    // Update existing clouds
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];

      // Move cloud
      cloud.position.x += cloud.userData.speed * cloud.userData.side;

      // Add slight vertical movement
      cloud.position.y += Math.sin(Date.now() * 0.001 + i) * 0.03;

      // Check if cloud needs to be reset
      if (
        (cloud.userData.side > 0 && cloud.position.x > 200) ||
        (cloud.userData.side < 0 && cloud.position.x < -200)
      ) {
        // Reset cloud to opposite side
        cloud.position.x = -200 * cloud.userData.side;
        cloud.position.z = zPos + (Math.random() * 400 - 200);
        cloud.position.y = Math.random() * 80 + 30;
      }

      // Remove clouds that are too far behind
      if (cloud.position.z - zPos > 300) {
        this.scene.scene.remove(cloud);
        this.clouds.splice(i, 1);
      }
    }

    // Generate new clouds more frequently
    this.cloudSpawnTimer++;
    if (
      this.cloudSpawnTimer >= this.cloudSpawnInterval &&
      this.clouds.length < this.maxClouds
    ) {
      this.cloudSpawnTimer = 0;

      // Create multiple clouds at once
      for (let i = 0; i < 3; i++) {
        const newCloud = this.createCloud();
        // Position new cloud ahead
        newCloud.position.z = zPos - 200 - Math.random() * 100;
        this.clouds.push(newCloud);
      }
    }
  }
}
