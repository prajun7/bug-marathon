export class Physics {
  constructor() {
    // Set up CANNON.js world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -20, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    this.world.defaultContactMaterial.friction = 0.5;
    this.world.defaultContactMaterial.restitution = 0.3;

    // Store bodies for collision detection
    this.bodies = new Set();
  }

  addBody(body) {
    this.world.addBody(body);
    this.bodies.add(body);
  }

  removeBody(body) {
    this.world.removeBody(body);
    this.bodies.delete(body);
  }

  update() {
    this.world.step(1 / 60);
  }

  createBox(dimensions, position, mass = 0) {
    const shape = new CANNON.Box(
      new CANNON.Vec3(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2)
    );
    const body = new CANNON.Body({ mass, shape });
    body.position.copy(position);
    return body;
  }
}
