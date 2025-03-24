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

    // Create barriers (rails)
    const barriers = this.createBarriers(this.currentX, zPosition);

    return {
      platform,
      barriers,
      xPosition: this.currentX,
      zPosition,
    };
  }

  createBarriers(xPosition, zPosition) {
    const barriers = { left: [], right: [] };

    // Random chance for each side to have barriers
    const hasLeftBarrier = Math.random() < 0.7; // 70% chance for left barrier
    const hasRightBarrier = Math.random() < 0.7; // 70% chance for right barrier

    // Only create barriers if the side should have them
    if (!hasLeftBarrier && !hasRightBarrier) {
      // Ensure at least one side has barriers for safety
      const forcedSide = Math.random() < 0.5 ? "left" : "right";
      if (forcedSide === "left") {
        this.createSideBarrier(barriers.left, xPosition, zPosition, -1);
      } else {
        this.createSideBarrier(barriers.right, xPosition, zPosition, 1);
      }
    } else {
      if (hasLeftBarrier) {
        this.createSideBarrier(barriers.left, xPosition, zPosition, -1);
      }
      if (hasRightBarrier) {
        this.createSideBarrier(barriers.right, xPosition, zPosition, 1);
      }
    }

    return barriers;
  }

  createSideBarrier(barrierArray, xPosition, zPosition, side) {
    // Create tech-themed rails
    const railGeometry = new THREE.CylinderGeometry(
      0.3,
      0.3,
      this.segmentLength,
      8
    );
    const railMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00, // Matrix-style green
      shininess: 70,
      emissive: 0x003300,
    });

    // Random number of horizontal rails (1 to 3)
    const railCount = Math.floor(Math.random() * 3) + 1;

    // Create horizontal rails
    for (let height = 0; height < railCount; height++) {
      const rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(
        xPosition + side * (this.roadWidth / 2 + 0.5),
        height,
        zPosition
      );
      this.scene.scene.add(rail);
      barrierArray.push(rail);
    }

    // Random post spacing
    const postSpacing = Math.random() < 0.5 ? 10 : 20; // Either dense or sparse posts

    // Vertical posts
    const postGeometry = new THREE.CylinderGeometry(0.3, 0.3, railCount, 8);
    const postMaterial = new THREE.MeshPhongMaterial({
      color: 0x1abc9c,
      shininess: 70,
      emissive: 0x0f5c4b,
    });

    // Add posts with random spacing
    for (let z = 0; z < this.segmentLength; z += postSpacing) {
      // Random chance to skip a post
      if (Math.random() < 0.2) continue; // 20% chance to skip a post

      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(
        xPosition + side * (this.roadWidth / 2 + 0.5),
        railCount / 2,
        zPosition - z
      );
      this.scene.scene.add(post);
      barrierArray.push(post);
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
