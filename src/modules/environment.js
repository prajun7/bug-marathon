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

    // Create barriers (rocks)
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

  createBarriers(xPosition, zPosition) {
    const barriers = { left: [], right: [] };

    // Random chance for this segment to have any rocks (30% chance of no rocks)
    if (Math.random() < 0.3) {
      return barriers; // No rocks for this segment
    }

    // Random chance for each side
    const hasLeftRocks = Math.random() < 0.6;
    const hasRightRocks = Math.random() < 0.6;

    if (hasLeftRocks) {
      this.createRockBarrier(barriers.left, xPosition, zPosition, -1);
    }
    if (hasRightRocks) {
      this.createRockBarrier(barriers.right, xPosition, zPosition, 1);
    }

    return barriers;
  }

  createRockBarrier(barrierArray, xPosition, zPosition, side) {
    const rockMaterial = new THREE.MeshPhongMaterial({
      color: 0x707070, // Gray color for rocks
      roughness: 0.8, // Make it look rough
      metalness: 0.2,
      flatShading: true, // Give it a more jagged appearance
    });

    // Create a group of rocks along the segment
    const spacing = 8; // Space between rock groups
    for (let z = 0; z < this.segmentLength; z += spacing) {
      // Random chance to skip this rock group
      if (Math.random() < 0.3) continue;

      // Create a cluster of rocks at this position
      const rockCount = Math.floor(Math.random() * 3) + 2; // 2-4 rocks per cluster
      for (let i = 0; i < rockCount; i++) {
        const rockGeometry =
          this.rockGeometries[
            Math.floor(Math.random() * this.rockGeometries.length)
          ];
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);

        // Random size for each rock
        const scale = Math.random() * 1.5 + 1;
        rock.scale.set(scale, scale * 1.5, scale);

        // Position within the cluster
        rock.position.set(
          xPosition +
            side * (this.roadWidth / 2 + 1) +
            (Math.random() - 0.5) * 2,
          scale - 1,
          zPosition - z + (Math.random() - 0.5) * 2
        );

        // Random rotation
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );

        this.scene.scene.add(rock);
        barrierArray.push(rock);

        // Add collision data to the rock for future implementation
        rock.userData.isBarrier = true;
        rock.userData.pushForce = 10;
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
