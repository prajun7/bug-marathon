export class ObstacleManager {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.obstacles = [];
    this.spawnDistance = -30;
    this.removeDistance = 10;
    this.spawnInterval = 2000; // milliseconds

    this.startSpawning();
  }

  startSpawning() {
    setInterval(() => this.spawnObstacle(), this.spawnInterval);
  }

  spawnObstacle() {
    const types = ["jump", "lateral", "sphere"];
    const type = types[Math.floor(Math.random() * types.length)];

    let obstacle;
    switch (type) {
      case "jump":
        obstacle = this.createJumpObstacle();
        break;
      case "lateral":
        obstacle = this.createLateralObstacle();
        break;
      case "sphere":
        obstacle = this.createSphereObstacle();
        break;
    }

    this.obstacles.push(obstacle);
  }

  createJumpObstacle() {
    const geometry = new THREE.BoxGeometry(2, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);

    // Random x position within track bounds
    const x = (Math.random() - 0.5) * 8;
    mesh.position.set(x, 0.5, this.spawnDistance);

    this.scene.scene.add(mesh);

    const body = this.physics.createBox({ x: 2, y: 1, z: 1 }, mesh.position);
    this.physics.addBody(body);

    return { mesh, body, type: "jump" };
  }

  createLateralObstacle() {
    const geometry = new THREE.BoxGeometry(4, 2, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    const mesh = new THREE.Mesh(geometry, material);

    const x = (Math.random() - 0.5) * 8;
    mesh.position.set(x, 1, this.spawnDistance);

    this.scene.scene.add(mesh);

    const body = this.physics.createBox({ x: 4, y: 2, z: 1 }, mesh.position);
    this.physics.addBody(body);

    return { mesh, body, type: "lateral" };
  }

  createSphereObstacle() {
    const geometry = new THREE.SphereGeometry(0.5);
    const material = new THREE.MeshPhongMaterial({ color: 0xff00ff });
    const mesh = new THREE.Mesh(geometry, material);

    const x = (Math.random() - 0.5) * 8;
    mesh.position.set(x, 0.5, this.spawnDistance);

    this.scene.scene.add(mesh);

    const shape = new CANNON.Sphere(0.5);
    const body = new CANNON.Body({ mass: 1, shape });
    body.position.copy(mesh.position);
    this.physics.addBody(body);

    return { mesh, body, type: "sphere" };
  }

  update() {
    // Update obstacles
    this.obstacles.forEach((obstacle) => {
      obstacle.mesh.position.copy(obstacle.body.position);
      obstacle.mesh.quaternion.copy(obstacle.body.quaternion);

      // Move sphere obstacles towards player
      if (obstacle.type === "sphere") {
        obstacle.body.velocity.z = 5;
      }
    });

    // Remove obstacles that are behind the player
    this.obstacles = this.obstacles.filter((obstacle) => {
      if (obstacle.mesh.position.z > this.removeDistance) {
        this.scene.scene.remove(obstacle.mesh);
        this.physics.removeBody(obstacle.body);
        return false;
      }
      return true;
    });
  }
}
