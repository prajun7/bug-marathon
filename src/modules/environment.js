export class Environment {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;

    // Runway properties
    this.runwayWidth = 15;
    this.runwayLength = 100;

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
    runway.position.set(0, -0.5, -this.runwayLength / 2); // Center the runway
    this.scene.scene.add(runway);

    // Add side barriers
    const barrierGeometry = new THREE.BoxGeometry(1, 2, this.runwayLength);
    const barrierMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });

    // Left barrier
    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.set(
      -(this.runwayWidth / 2 + 0.5), // Half runway width + half barrier width
      0.5, // Half barrier height
      -this.runwayLength / 2
    );

    // Right barrier
    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.set(
      this.runwayWidth / 2 + 0.5,
      0.5,
      -this.runwayLength / 2
    );

    this.scene.scene.add(leftBarrier);
    this.scene.scene.add(rightBarrier);

    // Add debug cube (green box) for reference
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 1, 0); // Position at start of runway
    this.scene.scene.add(cube);
  }

  update() {
    // No updates needed for now - runway is static
  }
}
