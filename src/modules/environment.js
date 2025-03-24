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
    this.createClouds();
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
      emissive: 0x003300, // Slight glow effect
    });

    // Horizontal rails
    for (let height of [0, 1, 2]) {
      // Three rails high
      const leftRail = new THREE.Mesh(railGeometry, railMaterial);
      const rightRail = new THREE.Mesh(railGeometry, railMaterial);

      leftRail.rotation.x = Math.PI / 2;
      rightRail.rotation.x = Math.PI / 2;

      leftRail.position.set(
        xPosition - this.roadWidth / 2 - 0.5,
        height,
        zPosition
      );
      rightRail.position.set(
        xPosition + this.roadWidth / 2 + 0.5,
        height,
        zPosition
      );

      this.scene.scene.add(leftRail);
      this.scene.scene.add(rightRail);
      barriers.left.push(leftRail);
      barriers.right.push(rightRail);
    }

    // Vertical posts with different color
    const postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    const postMaterial = new THREE.MeshPhongMaterial({
      color: 0x1abc9c, // Cyan-ish tech color
      shininess: 70,
      emissive: 0x0f5c4b, // Slight glow
    });

    for (let z = 0; z < this.segmentLength; z += 20) {
      const leftPost = new THREE.Mesh(postGeometry, postMaterial);
      const rightPost = new THREE.Mesh(postGeometry, postMaterial);

      leftPost.position.set(
        xPosition - this.roadWidth / 2 - 0.5,
        1.5,
        zPosition - z
      );
      rightPost.position.set(
        xPosition + this.roadWidth / 2 + 0.5,
        1.5,
        zPosition - z
      );

      this.scene.scene.add(leftPost);
      this.scene.scene.add(rightPost);
      barriers.left.push(leftPost);
      barriers.right.push(rightPost);
    }

    return barriers;
  }

  createClouds() {
    const createCloud = () => {
      const cloudGeometry = new THREE.SphereGeometry(5, 16, 16);
      const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xeeeeee,
        transparent: true,
        opacity: 0.6,
      });

      const cloud = new THREE.Group();

      // Create more spheres for denser clouds
      for (let i = 0; i < 8; i++) {
        // Increased from 5 to 8
        const sphere = new THREE.Mesh(cloudGeometry, cloudMaterial);
        sphere.position.x = (Math.random() - 0.5) * 12;
        sphere.position.y = (Math.random() - 0.5) * 6;
        sphere.position.z = (Math.random() - 0.5) * 12;
        sphere.scale.set(
          Math.random() * 0.6 + 0.4,
          Math.random() * 0.4 + 0.2,
          Math.random() * 0.6 + 0.4
        );
        cloud.add(sphere);
      }

      return cloud;
    };

    // Create more clouds
    for (let i = 0; i < 40; i++) {
      // Increased from 20 to 40
      const cloud = createCloud();
      cloud.position.set(
        (Math.random() - 0.5) * 300, // Wider spread
        Math.random() * 60 + 20, // More varied height
        (Math.random() - 0.5) * 300 // Wider spread
      );
      this.clouds.push(cloud);
      this.scene.scene.add(cloud);
    }
  }

  updateClouds() {
    this.clouds.forEach((cloud) => {
      cloud.position.x += 0.03; // Slightly slower cloud movement
      if (cloud.position.x > 150) {
        cloud.position.x = -150;
      }
    });
  }

  createInitialSegments() {
    for (let i = 0; i < this.visibleSegments; i++) {
      const segment = this.createSegment(-i * this.segmentLength);
      this.segments.push(segment);
    }
  }

  update(playerPosition) {
    // Update clouds
    this.updateClouds();

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
