export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Road properties
    this.roadWidth = 60;
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

    // Create basic stone geometry
    this.stoneGeometry = new THREE.BoxGeometry(1, 0.5, 1);

    // Add obstacle properties
    this.obstacles = [];
    this.obstacleSpawnDistance = 100;
    this.lastObstacleZ = -50;
    this.minObstacleSpacing = 50;
    this.maxObstacleSpacing = 100;

    // Pendulum properties
    this.pendulums = [];
    this.pendulumSpawnTimer = 0;
    this.pendulumSpawnInterval = Math.random() * 10000 + 10000; // Random 10-20 seconds
    this.lastPendulumZ = 0;
    this.minPendulumSpacing = 200; // Minimum distance between pendulums

    // Initialize
    this.createInitialSegments();
    this.createInitialClouds();
    this.spawnInitialObstacles();
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

    // Random chance for barriers on each side
    const hasLeftBarrier = Math.random() < 0.7; // 70% chance
    const hasRightBarrier = Math.random() < 0.7; // 70% chance

    // Create stone walls if random check passes
    if (hasLeftBarrier) {
      this.createStoneWall(barriers.left, -this.roadWidth / 2, zPosition);
    }

    if (hasRightBarrier) {
      this.createStoneWall(barriers.right, this.roadWidth / 2, zPosition);
    }

    return barriers;
  }

  createStoneWall(barrierArray, xPosition, zPosition) {
    const stoneMaterial = new THREE.MeshPhongMaterial({
      color: 0x708090,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
    });

    // Parameters for stone wall
    const wallHeight = 7; // Height in stones
    const wallLength = this.segmentLength;
    const stoneSpacing = 2; // Space between stones

    // Calculate number of stones needed
    const stonesPerRow = Math.floor(wallLength / stoneSpacing);

    // Create wall section
    for (let z = 0; z < stonesPerRow; z++) {
      for (let y = 0; y < wallHeight; y++) {
        const stone = new THREE.Mesh(this.stoneGeometry, stoneMaterial);

        // Add some random variation to each stone
        const xOffset = (Math.random() - 0.5) * 0.3;
        const yOffset = (Math.random() - 0.5) * 0.2;
        const zOffset = (Math.random() - 0.5) * 0.3;

        // Position stone
        stone.position.set(
          xPosition + xOffset,
          y * 0.5 + yOffset, // Stack stones vertically
          zPosition - z * stoneSpacing + zOffset
        );

        // Random rotation for variety
        stone.rotation.y = (Math.random() - 0.5) * 0.5;
        stone.rotation.x = (Math.random() - 0.5) * 0.2;
        stone.rotation.z = (Math.random() - 0.5) * 0.2;

        // Random scale for variety
        const scale = 0.8 + Math.random() * 0.4;
        stone.scale.set(scale, scale, scale);

        stone.userData.isBarrier = true;
        stone.userData.pushForce = 15;

        this.scene.scene.add(stone);
        barrierArray.push(stone);
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

    // Spawn new obstacles
    while (this.lastObstacleZ > playerPosition.z - this.obstacleSpawnDistance) {
      this.spawnObstacle();
    }

    // Clean up old obstacles
    this.obstacles = this.obstacles.filter((obstacle) => {
      const distanceFromPlayer = obstacle.mesh.position.z - playerPosition.z;
      if (distanceFromPlayer > 50) {
        this.scene.scene.remove(obstacle.mesh);
        return false;
      }
      return true;
    });

    // Update clouds with player position
    this.updateClouds(playerPosition.z);

    // Update pendulums with player position
    this.updatePendulums(playerPosition.z);
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

  updateClouds(playerZ) {
    // Default position if playerZ is undefined
    const zPos = playerZ || 0;

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

  // Add these new methods for obstacles
  spawnObstacle() {
    const z =
      this.lastObstacleZ -
      this.minObstacleSpacing -
      Math.random() * (this.maxObstacleSpacing - this.minObstacleSpacing);

    const x = (Math.random() - 0.5) * (this.roadWidth - 12);

    // Randomly choose obstacle type
    const obstacleType = Math.random() < 0.5 ? "cube" : "sphere";
    let mesh;

    if (obstacleType === "cube") {
      const geometry = new THREE.BoxGeometry(6, 6, 6);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.2,
      });
      mesh = new THREE.Mesh(geometry, material);
    } else {
      const geometry = new THREE.SphereGeometry(4, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 0.2,
        metalness: 0.5,
        roughness: 0.5,
      });
      mesh = new THREE.Mesh(geometry, material);
    }

    mesh.position.set(x, obstacleType === "cube" ? 3 : 4, z);
    mesh.userData.type = obstacleType;
    mesh.userData.counted = false; // Add this flag to track if we've counted this obstacle

    this.scene.scene.add(mesh);
    this.obstacles.push({ mesh });
    this.lastObstacleZ = z;
  }

  checkObstacleCollisions(player) {
    for (const obstacle of this.obstacles) {
      const isSphere = obstacle.mesh.userData.type === "sphere";

      // Adjust collision box based on obstacle type
      const obstacleSize = isSphere ? 4 : 3;

      const playerBox = {
        minX: player.mesh.position.x - 2,
        maxX: player.mesh.position.x + 2,
        minY: player.mesh.position.y - 4,
        maxY: player.mesh.position.y + 4,
        minZ: player.mesh.position.z - 2,
        maxZ: player.mesh.position.z + 2,
      };

      const obstacleBox = {
        minX: obstacle.mesh.position.x - obstacleSize,
        maxX: obstacle.mesh.position.x + obstacleSize,
        minY: obstacle.mesh.position.y - obstacleSize,
        maxY: obstacle.mesh.position.y + obstacleSize,
        minZ: obstacle.mesh.position.z - obstacleSize,
        maxZ: obstacle.mesh.position.z + obstacleSize,
      };

      if (this.checkBoxCollision(playerBox, obstacleBox)) {
        return true;
      }
    }
    return false;
  }

  checkBoxCollision(box1, box2) {
    return (
      box1.minX <= box2.maxX &&
      box1.maxX >= box2.minX &&
      box1.minY <= box2.maxY &&
      box1.maxY >= box2.minY &&
      box1.minZ <= box2.maxZ &&
      box1.maxZ >= box2.minZ
    );
  }

  spawnInitialObstacles() {
    // Spawn just 3 initial obstacles
    for (let i = 0; i < 3; i++) {
      this.spawnObstacle();
    }
  }

  createPendulum(zPosition, xPosition) {
    // Create the pendulum arm
    const armGeometry = new THREE.BoxGeometry(4, 30, 4);
    const armMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2,
    });
    const arm = new THREE.Mesh(armGeometry, armMaterial);

    // Create the pendulum weight (sphere)
    const weightGeometry = new THREE.SphereGeometry(8, 16, 16);
    const weightMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.2,
      metalness: 0.7,
      roughness: 0.3,
    });
    const weight = new THREE.Mesh(weightGeometry, weightMaterial);
    weight.position.y = -15; // Position at bottom of arm

    // Create pendulum group
    const pendulum = new THREE.Group();
    pendulum.add(arm);
    pendulum.add(weight);

    // Position the pendulum with random x position
    pendulum.position.set(xPosition, 35, zPosition);

    // Add swing properties with random initial angle
    pendulum.userData = {
      angle: Math.random() * Math.PI * 2, // Random starting angle
      swingSpeed: 0.02,
      maxAngle: Math.PI / 3, // Maximum swing angle
      zPosition: zPosition,
    };

    // Add warning indicator
    const warningGeometry = new THREE.CylinderGeometry(0.5, 0.5, 40, 8);
    const warningMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
    });
    const warning = new THREE.Mesh(warningGeometry, warningMaterial);
    warning.position.y = -20;
    pendulum.add(warning);

    this.scene.scene.add(pendulum);
    this.pendulums.push(pendulum);
  }

  updatePendulums(playerZ) {
    // Update spawn timer
    this.pendulumSpawnTimer += 16; // Assuming 60fps

    // Check if it's time to spawn a new pendulum
    if (this.pendulumSpawnTimer >= this.pendulumSpawnInterval) {
      this.pendulumSpawnTimer = 0;
      // Set new random interval for next spawn
      this.pendulumSpawnInterval = Math.random() * 10000 + 10000; // 10-20 seconds

      // Spawn pendulum at random position ahead of player
      const newZ = playerZ - 200; // Spawn ahead of player
      const randomX = (Math.random() - 0.5) * (this.roadWidth - 20); // Random position across road
      this.createPendulum(newZ, randomX);
    }

    // Update existing pendulums
    for (let i = this.pendulums.length - 1; i >= 0; i--) {
      const pendulum = this.pendulums[i];

      // Update swing animation
      pendulum.userData.angle += pendulum.userData.swingSpeed;
      pendulum.rotation.z =
        Math.sin(pendulum.userData.angle) * pendulum.userData.maxAngle;

      // Remove pendulums that are too far behind
      if (pendulum.position.z - playerZ > 100) {
        this.scene.scene.remove(pendulum);
        this.pendulums.splice(i, 1);
      }
    }
  }

  checkPendulumCollisions(player) {
    if (player.isSliding || player.isKnockedBack) return false; // No collision while sliding or already knocked back

    for (const pendulum of this.pendulums) {
      const weight = pendulum.children[1]; // The sphere weight
      const weightPos = weight.getWorldPosition(new THREE.Vector3());

      // Calculate pendulum weight's world position
      const weightBox = {
        minX: weightPos.x - 8,
        maxX: weightPos.x + 8,
        minY: weightPos.y - 8,
        maxY: weightPos.y + 8,
        minZ: weightPos.z - 8,
        maxZ: weightPos.z + 8,
      };

      const playerBox = {
        minX: player.mesh.position.x - 2,
        maxX: player.mesh.position.x + 2,
        minY: player.mesh.position.y - 4,
        maxY: player.mesh.position.y + 4,
        minZ: player.mesh.position.z - 2,
        maxZ: player.mesh.position.z + 2,
      };

      // Check if pendulum is in swing range of player
      if (this.checkBoxCollision(playerBox, weightBox)) {
        return true;
      }
    }
    return false;
  }
}
