import { Scene } from "./modules/scene.js";
import { Player } from "./modules/player.js";
import { ObstacleManager } from "./modules/obstacles.js";
import { Environment } from "./modules/environment.js";
import { Physics } from "./modules/physics.js";

class Game {
  constructor() {
    // Initialize core systems
    this.scene = new Scene();
    this.physics = new Physics();
    this.environment = new Environment(this.scene, this.physics);
    this.player = new Player(this.scene, this.physics);
    this.obstacleManager = new ObstacleManager(this.scene, this.physics);

    // Start game loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Update physics
    this.physics.update();

    // Update game objects
    this.player.update();
    this.obstacleManager.update();
    this.environment.update(this.player.position);

    // Render scene
    this.scene.render();
  }
}

// Start the game when the window loads
window.addEventListener("load", () => {
  new Game();
});
