export class Game {
  constructor() {
    this.scene = new Scene();
    this.environment = new Environment(this.scene);
    this.player = new Player(this.scene, this.environment);

    // Start the game loop
    this.gameLoop();
  }

  gameLoop = () => {
    // Update player and environment
    this.player.update();
    this.environment.update(this.player.mesh.position);

    // Update camera to follow player
    this.scene.updateCameraPosition(this.player.mesh.position);

    // Render scene
    this.scene.render();

    // Continue loop
    requestAnimationFrame(this.gameLoop);
  };
}
