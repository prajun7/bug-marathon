export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Road properties
    this.roadWidth = 25;
    this.segmentLength = 100;
    this.visibleSegments = 15;

    // Path control points
    this.pathPoints = [];
    this.currentX = 0;
    this.currentZ = 0;
    this.segments = [];

    // Curve parameters
    this.curvePoints = 50; // More points = smoother curve
    this.curveAmplitude = 50; // How wide the curves can be
    this.straightDistance = 500; // Minimum straight section length

    // Track current path
    this.targetX = 0;

    // Cloud properties
    this.clouds = [];
    this.cloudSpawnTimer = 0;
    this.cloudSpawnInterval = 50;
    this.maxClouds = 80;

    // Create basic stone geometry
    this.stoneGeometry = new THREE.BoxGeometry(1, 0.5, 1);

    // Initialize path
    this.initializePath();
    this.createInitialSegments();
  }

  initializePath() {
    // Create initial straight path
    for (let i = 0; i < 10; i++) {
      this.pathPoints.push(new THREE.Vector3(0, -1, -i * this.segmentLength));
    }
  }

  generateNewPathPoints(zPosition) {
    // Decide if we should create a curve
    const shouldCurve =
      Math.random() < 0.3 && Math.abs(this.currentX) < this.curveAmplitude;

    if (shouldCurve) {
      // Create a smooth curve
      const curveDirection = Math.random() < 0.5 ? 1 : -1;
      const curveLength = this.segmentLength * 3;
      const controlPoint1 = new THREE.Vector3(
        this.currentX,
        -1,
        zPosition - curveLength / 3
      );
      const controlPoint2 = new THREE.Vector3(
        this.currentX + curveDirection * this.curveAmplitude,
        -1,
        zPosition - (curveLength * 2) / 3
      );
      const endPoint = new THREE.Vector3(
        this.currentX + curveDirection * this.curveAmplitude,
        -1,
        zPosition - curveLength
      );

      // Create curve
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(this.currentX, -1, zPosition),
        controlPoint1,
        controlPoint2,
        endPoint
      );

      // Get points along curve
      const points = curve.getPoints(this.curvePoints);
      this.pathPoints.push(...points);

      // Update current position
      this.currentX = endPoint.x;
      this.currentZ = endPoint.z;
    } else {
      // Add straight section
      this.pathPoints.push(
        new THREE.Vector3(this.currentX, -1, zPosition - this.segmentLength)
      );
    }
  }

  createSegment(zPosition) {
    // Generate new path points if needed
    if (this.pathPoints.length < this.visibleSegments * 2) {
      this.generateNewPathPoints(zPosition);
    }

    // Create road geometry using path points
    const roadShape = new THREE.Shape();
    roadShape.moveTo(-this.roadWidth / 2, 0);
    roadShape.lineTo(this.roadWidth / 2, 0);
    roadShape.lineTo(this.roadWidth / 2, this.segmentLength);
    roadShape.lineTo(-this.roadWidth / 2, this.segmentLength);
    roadShape.lineTo(-this.roadWidth / 2, 0);

    // Get current path segment
    const pathStart = this.pathPoints[0];
    const pathEnd = this.pathPoints[1];

    // Calculate road orientation
    const direction = new THREE.Vector3()
      .subVectors(pathEnd, pathStart)
      .normalize();
    const angle = Math.atan2(direction.x, direction.z);

    // Create road segment
    const roadGeometry = new THREE.BoxGeometry(
      this.roadWidth,
      2,
      this.segmentLength + 2
    );
    const roadMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 10,
    });

    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.copy(pathStart);
    road.rotation.y = angle;
    this.scene.scene.add(road);

    // Create barriers
    const barriers = this.createBarriers(pathStart.x, pathStart.z, angle);

    // Remove used path point
    this.pathPoints.shift();

    return {
      road,
      barriers,
      xPosition: pathStart.x,
      zPosition: pathStart.z,
      angle: angle,
    };
  }

  createBarriers(xPosition, zPosition, angle) {
    const barriers = { left: [], right: [] };

    if (Math.random() < 0.3) return barriers;

    const hasLeftWall = Math.random() < 0.6;
    const hasRightWall = Math.random() < 0.6;

    if (hasLeftWall) {
      this.createStoneWall(barriers.left, xPosition, zPosition, -1, angle);
    }
    if (hasRightWall) {
      this.createStoneWall(barriers.right, xPosition, zPosition, 1, angle);
    }

    return barriers;
  }

  createStoneWall(barrierArray, xPosition, zPosition, side, angle) {
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
        const offsetX = side * (this.roadWidth / 2 + 0.5);
        stone.position.set(
          xPosition + offsetX * Math.cos(angle) + xOffset,
          y * stoneHeight,
          zPosition - z + offsetX * Math.sin(angle)
        );

        stone.rotation.y = angle + (Math.random() - 0.5) * 0.1;
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
    const lastSegment = this.segments[this.segments.length - 1];
    if (!lastSegment) return;

    const newZ = lastSegment.zPosition - this.segmentLength;

    if (Math.abs(playerPosition.z - newZ) < this.segmentLength * 3) {
      const newSegment = this.createSegment(newZ);
      this.segments.push(newSegment);

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
}
