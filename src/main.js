import { Scene } from "./modules/scene.js";
import { Environment } from "./modules/environment.js";
import { Player } from "./modules/player.js";

class Game {
  constructor() {
    this.scene = new Scene();
    this.environment = new Environment(this.scene);
    this.player = new Player(this.scene, this.environment);

    // Start animation loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    // Use fixed time step for stability
    const fixedDelta = 1 / 60;

    this.player.update();
    this.environment.update(this.player.mesh.position);
    this.scene.render();
  }
}

// Start the game when the window loads
window.addEventListener("load", () => {
  new Game();
});
