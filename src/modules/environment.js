export class Environment {
  constructor(scene) {
    this.scene = scene;

    // Calculate runway width based on camera FOV and position
    const fov = this.scene.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * 30; // 30 is camera height
    this.runwayWidth = height * this.scene.camera.aspect * 0.8; // 80% of visible width
    this.runwayLength = 1000; // Very long runway

    this.createRunway();
  }

  createRunway() {
    // Create main runway
    const runwayGeometry = new THREE.BoxGeometry(
      this.runwayWidth,
      1,
      this.runwayLength
    );
    const runwayMaterial = new THREE.MeshPhongMaterial({
      color: 0x808080,
      roughness: 0.8,
    });

    const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runway.position.set(0, -0.5, -this.runwayLength / 2);
    this.scene.scene.add(runway);

    // Add side barriers
    const barrierGeometry = new THREE.BoxGeometry(2, 4, this.runwayLength);
    const barrierMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });

    // Left barrier
    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.set(
      -(this.runwayWidth / 2 + 1),
      1.5,
      -this.runwayLength / 2
    );

    // Right barrier
    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.set(
      this.runwayWidth / 2 + 1,
      1.5,
      -this.runwayLength / 2
    );

    this.scene.scene.add(leftBarrier);
    this.scene.scene.add(rightBarrier);

    // Add runway markings (stripes)
    this.addRunwayMarkings();
  }

  addRunwayMarkings() {
    const stripeWidth = 1;
    const stripeLength = 20;
    const stripeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    // Create stripes down the runway
    for (let z = 0; z < this.runwayLength; z += 50) {
      const stripeGeometry = new THREE.BoxGeometry(
        stripeWidth,
        0.1,
        stripeLength
      );
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, 0, -z);
      this.scene.scene.add(stripe);
    }
  }

  update() {
    // No updates needed for static runway
  }
}
