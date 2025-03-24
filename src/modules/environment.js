export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Road properties
    this.roadWidth = 25;
    this.segmentLength = 100;
    this.visibleSegments = 15;

    // Spline control points
    this.splinePoints = [];
    this.currentX = 0;
    this.currentZ = 0;
    this.segments = [];

    // New curve parameters for smoother turns
    this.turnRadius = 200; // Larger radius for gentler curves
    this.turnSpeed = 0.02; // Slower turn speed
    this.isTurning = false;
    this.turnDirection = 0;
    this.straightCount = 0;
    this.minStraightSegments = 8; // Longer straight sections

    // Track current path
    this.targetX = 0;

    // Cloud properties
    this.clouds = [];
    this.cloudSpawnTimer = 0;
    this.cloudSpawnInterval = 50;
    this.maxClouds = 80;

    // Create basic stone geometry
    this.stoneGeometry = new THREE.BoxGeometry(1, 0.5, 1);

    // Initialize spline points
    this.initializeSplinePoints();
    this.createInitialSegments();
  }

  initializeSplinePoints() {
    // Create initial control points for a straight path
    for (let i = 0; i < 10; i++) {
      this.splinePoints.push(new THREE.Vector3(0, -1, -i * this.segmentLength));
    }
  }

  addSplinePoint() {
    const lastPoint = this.splinePoints[this.splinePoints.length - 1];

    // Calculate new control point with smooth curve
    const angle = Math.sin(this.currentZ * 0.01) * 0.5;
    const newX = this.currentX + Math.sin(angle) * this.roadWidth * 2;
    const newZ = lastPoint.z - this.segmentLength;

    this.splinePoints.push(new THREE.Vector3(newX, -1, newZ));

    if (this.splinePoints.length > 20) {
      this.splinePoints.shift();
    }

    this.currentZ = newZ;
    this.currentX = newX;
  }

  createSegment(zPosition) {
    // Add new spline point
    this.addSplinePoint();

    // Create smooth curve from points
    const curve = new THREE.CatmullRomCurve3(this.splinePoints);

    // Get position and rotation from curve
    const curvePoint = curve.getPoint(0.5);
    const tangent = curve.getTangent(0.5);
    const angle = Math.atan2(tangent.x, tangent.z);

    // Create road using the same geometry as before
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
    road.position.set(curvePoint.x, -1, zPosition);
    road.rotation.y = angle;
    this.scene.scene.add(road);

    // Create barriers that exactly match the road's edges
    const barriers = this.createMatchingBarriers(road);

    return {
      road,
      barriers,
      curve,
      xPosition: curvePoint.x,
      zPosition,
      angle,
    };
  }

  createMatchingBarriers(road) {
    const barriers = { left: [], right: [] };

    // Create barrier geometry that's slightly taller than the road
    const barrierGeometry = new THREE.BoxGeometry(
      1, // width
      4, // height
      this.segmentLength // same length as road segment
    );

    const barrierMaterial = new THREE.MeshPhongMaterial({
      color: 0x707070,
      flatShading: true,
    });

    // Create left barrier
    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    // Position exactly at left edge of road
    leftBarrier.position.copy(road.position);
    leftBarrier.position.x -= this.roadWidth / 2;
    leftBarrier.position.y += 2; // Raise up slightly
    leftBarrier.rotation.copy(road.rotation);
    leftBarrier.userData.isBarrier = true;
    leftBarrier.userData.pushForce = 15;
    this.scene.scene.add(leftBarrier);
    barriers.left.push(leftBarrier);

    // Create right barrier
    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    // Position exactly at right edge of road
    rightBarrier.position.copy(road.position);
    rightBarrier.position.x += this.roadWidth / 2;
    rightBarrier.position.y += 2; // Raise up slightly
    rightBarrier.rotation.copy(road.rotation);
    rightBarrier.userData.isBarrier = true;
    rightBarrier.userData.pushForce = 15;
    this.scene.scene.add(rightBarrier);
    barriers.right.push(rightBarrier);

    return barriers;
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
    if (!playerPosition) return;

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
