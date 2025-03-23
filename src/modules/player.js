export class Player {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;

    // Player settings
    this.speed = 5;
    this.jumpForce = 5;
    this.lateralSpeed = 3;
    this.isJumping = false;

    // Start position
    this.startPosition = { x: 0, y: 3, z: 0 };
    this.createPlayer();
    this.setupControls();
  }

  createPlayer() {
    // Visual representation
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.startPosition);
    this.scene.scene.add(this.mesh);

    // Physics body
    this.body = this.physics.createBox(
      { x: 1, y: 2, z: 1 },
      this.startPosition,
      5 // mass
    );

    // Set initial velocity
    this.body.velocity.set(0, 0, -this.speed);
    this.physics.addBody(this.body);
  }

  setupControls() {
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.moveLeft();
          break;
        case "ArrowRight":
          this.moveRight();
          break;
        case " ": // Space
          this.jump();
          break;
        case "Enter":
          this.sprint();
          break;
      }
    });
  }

  moveLeft() {
    if (this.body.velocity.x > -this.lateralSpeed) {
      this.body.velocity.x = -this.lateralSpeed;
    }
  }

  moveRight() {
    if (this.body.velocity.x < this.lateralSpeed) {
      this.body.velocity.x = this.lateralSpeed;
    }
  }

  jump() {
    if (!this.isJumping) {
      this.body.velocity.y = this.jumpForce;
      this.isJumping = true;
      setTimeout(() => {
        this.isJumping = false;
      }, 1000);
    }
  }

  sprint() {
    this.speed *= 1.5;
    setTimeout(() => {
      this.speed /= 1.5;
    }, 1000);
  }

  update() {
    // Update mesh position to match physics body
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);

    // Constant forward movement
    this.body.velocity.z = -this.speed;
  }

  get position() {
    return this.body.position;
  }
}
