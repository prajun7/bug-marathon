export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Road properties
    this.roadWidth = 25;
    this.segmentLength = 100;
    this.visibleSegments = 10;

    // Track current path
    this.currentX = 0;
    this.targetX = 0;
    this.segments = [];

    // Cloud properties
    this.clouds = [];
    this.cloudSpawnTimer = 0;
    this.cloudSpawnInterval = 50;
    this.maxClouds = 80;

    // Add rock properties
    this.rockGeometries = this.createRockGeometries();

    // Add stone wall properties
    this.stoneGeometry = this.createStoneGeometry();

    // Initial cloud creation
    this.createInitialClouds();
    this.createInitialSegments();
  }

  createSegment(zPosition) {
    // Smooth curve calculation
    if (Math.random() < 0.1) {
      this.targetX = (Math.random() - 0.5) * 30;
    }
    this.currentX += (this.targetX - this.currentX) * 0.1;

    // Create tech-themed road platform
    const platformGeometry = new THREE.BoxGeometry(
      this.roadWidth,
      2,
      this.segmentLength
    );
    const platformMaterial = new THREE.MeshPhongMaterial({
      // Alternating between dark gray and lighter blue-gray
      color: Math.random() < 0.5 ? 0x2c3e50 : 0x34495e,
      shininess: 60,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(this.currentX, -1, zPosition);
    platform.castShadow = true;
    platform.receiveShadow = true;
    this.scene.scene.add(platform);

    // Create barriers (walls)
    const barriers = this.createBarriers(this.currentX, zPosition);

    return {
      platform,
      barriers,
      xPosition: this.currentX,
      zPosition,
    };
  }

  createRockGeometries() {
    // Create various rock shapes for reuse
    const rocks = [];
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.IcosahedronGeometry(1, 0); // Base rock shape

      // Randomly modify vertices to make rocks look different
      const positions = geometry.attributes.position;
      for (let j = 0; j < positions.count; j++) {
        positions.setXYZ(
          j,
          positions.getX(j) * (1 + Math.random() * 0.4),
          positions.getY(j) * (1 + Math.random() * 0.4),
          positions.getZ(j) * (1 + Math.random() * 0.4)
        );
      }
      rocks.push(geometry);
    }
    return rocks;
  }

  createStoneGeometry() {
    // Create a basic stone block shape
    return new THREE.BoxGeometry(1, 0.5, 1); // Height is half the width for proper stone block proportions
  }

  createBarriers(xPosition, zPosition) {
    const barriers = { left: [], right: [] };

    // Random chance for this segment to have walls (70% chance of having walls)
    if (Math.random() < 0.3) {
      return barriers; // No walls for this segment
    }

    // Random chance for each side
    const hasLeftWall = Math.random() < 0.6;
    const hasRightWall = Math.random() < 0.6;

    if (hasLeftWall) {
      this.createStoneWall(barriers.left, xPosition, zPosition, -1);
    }
    if (hasRightWall) {
      this.createStoneWall(barriers.right, xPosition, zPosition, 1);
    }

    return barriers;
  }

  createStoneWall(barrierArray, xPosition, zPosition, side) {
    const stoneMaterial = new THREE.MeshPhongMaterial({
      color: 0x707070, // Back to original gray color
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
    });

    // Wall parameters
    const wallHeight = 3; // Height in stone layers
    const stoneWidth = 1;
    const stoneHeight = 0.5;
    const stoneDepth = 1;

    // Create the wall along the segment
    for (let z = 0; z < this.segmentLength; z += stoneDepth) {
      for (let y = 0; y < wallHeight; y++) {
        // Offset every other layer for brick pattern
        const xOffset = (y % 2) * (stoneWidth / 2);

        const stone = new THREE.Mesh(this.stoneGeometry, stoneMaterial);

        // Position the stone in the wall
        stone.position.set(
          xPosition + side * (this.roadWidth / 2 + 0.5) + xOffset,
          y * stoneHeight,
          zPosition - z
        );

        // Add slight random rotation and position variation for natural look
        stone.rotation.y = (Math.random() - 0.5) * 0.1;
        stone.position.x += (Math.random() - 0.5) * 0.1;
        stone.position.y += (Math.random() - 0.5) * 0.05;

        this.scene.scene.add(stone);
        barrierArray.push(stone);

        // Add collision data
        stone.userData.isBarrier = true;
        stone.userData.pushForce = 15;
      }
    }
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
        cloud.position.z = playerPosition.z + (Math.random() * 400 - 200);
        cloud.position.y = Math.random() * 80 + 30;
      }

      // Remove clouds that are too far behind
      if (cloud.position.z - playerPosition.z > 300) {
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
        newCloud.position.z = playerPosition.z - 200 - Math.random() * 100;
        this.clouds.push(newCloud);
      }
    }
  }

  createInitialSegments() {
    for (let i = 0; i < this.visibleSegments; i++) {
      const segment = this.createSegment(-i * this.segmentLength);
      this.segments.push(segment);
    }
  }

  update(playerPosition) {
    // Update clouds with player position
    this.updateClouds(playerPosition);

    // Check if we need new segments
    const lastSegment = this.segments[this.segments.length - 1];
    const distanceToLast = Math.abs(playerPosition.z - lastSegment.zPosition);

    if (distanceToLast < this.segmentLength * 2) {
      const newZ = lastSegment.zPosition - this.segmentLength;
      const newSegment = this.createSegment(newZ);
      this.segments.push(newSegment);

      if (this.segments.length > this.visibleSegments) {
        const oldSegment = this.segments.shift();
        this.scene.scene.remove(oldSegment.platform);
        oldSegment.barriers.left.forEach((b) => this.scene.scene.remove(b));
        oldSegment.barriers.right.forEach((b) => this.scene.scene.remove(b));
      }
    }
  }
}
