export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Road properties
    this.roadWidth = 25;
    this.segmentLength = 100;
    this.visibleSegments = 15;

    // Curve control
    this.currentX = 0;
    this.currentZ = 0;
    this.currentAngle = 0;
    this.segments = [];

    // Curve parameters
    this.isCreatingCurve = false;
    this.curveDirection = 1;
    this.curveStrength = 0.02;
    this.straightSegments = 0;
    this.minStraightSegments = 5;
    this.curveSegments = 0;
    this.maxCurveSegments = 8;

    // Track current path
    this.targetX = 0;

    // Cloud properties
    this.clouds = [];
    this.cloudSpawnTimer = 0;
    this.cloudSpawnInterval = 50;
    this.maxClouds = 80;

    // Create basic stone geometry
    this.stoneGeometry = new THREE.BoxGeometry(1, 0.5, 1);

    // Initial cloud creation
    this.createInitialClouds();
    this.createInitialSegments();
  }

  createSegment(zPosition) {
    // Determine if we should start a curve
    if (
      !this.isCreatingCurve &&
      this.straightSegments >= this.minStraightSegments
    ) {
      if (Math.random() < 0.3) {
        // 30% chance to start a curve
        this.isCreatingCurve = true;
        this.curveDirection = Math.random() < 0.5 ? 1 : -1;
        this.curveSegments = 0;
        this.straightSegments = 0;
      }
    }

    // Handle curve creation
    if (this.isCreatingCurve) {
      this.curveSegments++;
      this.currentAngle += this.curveDirection * this.curveStrength;

      if (this.curveSegments >= this.maxCurveSegments) {
        this.isCreatingCurve = false;
        this.straightSegments = 0;
      }
    } else {
      this.straightSegments++;
    }

    // Calculate next position
    this.currentX += Math.sin(this.currentAngle) * this.segmentLength;
    const nextZ = zPosition;

    // Create road geometry
    const roadGeometry = new THREE.BoxGeometry(
      this.roadWidth,
      2,
      this.segmentLength + 1
    ); // +1 for overlap
    const roadMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 10,
    });

    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(this.currentX, -1, nextZ);
    road.rotation.y = this.currentAngle;
    this.scene.scene.add(road);

    // Add road markings (white lines)
    const markingGeometry = new THREE.PlaneGeometry(1, this.segmentLength);
    const markingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    // Center line
    const centerLine = new THREE.Mesh(markingGeometry, markingMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(this.currentX, -0.9, nextZ);
    centerLine.rotation.y = this.currentAngle;
    this.scene.scene.add(centerLine);

    // Create barriers
    const barriers = this.createBarriers(this.currentX, nextZ);

    return {
      road,
      barriers,
      centerLine,
      xPosition: this.currentX,
      zPosition: nextZ,
      angle: this.currentAngle,
    };
  }

  createBarriers(xPosition, zPosition) {
    const barriers = { left: [], right: [] };

    // Random chance for walls
    if (Math.random() < 0.3) {
      return barriers;
    }

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
      color: 0x707070,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
    });

    const wallHeight = 3;
    const stoneWidth = 1;
    const stoneHeight = 0.5;
    const stoneDepth = 1;

    for (let z = 0; z < this.segmentLength; z += stoneDepth) {
      for (let y = 0; y < wallHeight; y++) {
        const xOffset = (y % 2) * (stoneWidth / 2);

        const stone = new THREE.Mesh(this.stoneGeometry, stoneMaterial);

        // Position stones along curve
        const angleOffset = this.currentAngle;
        const xPos =
          xPosition + side * (this.roadWidth / 2 + 0.5) * Math.cos(angleOffset);
        const zPos =
          zPosition -
          z +
          side * (this.roadWidth / 2 + 0.5) * Math.sin(angleOffset);

        stone.position.set(xPos + xOffset, y * stoneHeight, zPos);

        stone.rotation.y = angleOffset + (Math.random() - 0.5) * 0.1;
        stone.position.x += (Math.random() - 0.5) * 0.1;
        stone.position.y += (Math.random() - 0.5) * 0.05;

        this.scene.scene.add(stone);
        barrierArray.push(stone);

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
    // Check if we need new segments
    const lastSegment = this.segments[this.segments.length - 1];
    if (!lastSegment) return;

    const newZ = lastSegment.zPosition - this.segmentLength;

    // Create new segment
    if (Math.abs(playerPosition.z - newZ) < this.segmentLength * 3) {
      const newSegment = this.createSegment(newZ);
      this.segments.push(newSegment);

      // Remove old segments
      if (this.segments.length > this.visibleSegments) {
        const oldSegment = this.segments.shift();
        this.scene.scene.remove(oldSegment.road);
        this.scene.scene.remove(oldSegment.centerLine);
        oldSegment.barriers.left.forEach((b) => this.scene.scene.remove(b));
        oldSegment.barriers.right.forEach((b) => this.scene.scene.remove(b));
      }
    }

    // Update clouds with player position
    this.updateClouds(playerPosition);
  }
}
