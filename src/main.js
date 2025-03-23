import { Scene } from "./modules/scene.js";
import { Environment } from "./modules/environment.js";
import { Player } from "./modules/player.js";

class Game {
  constructor() {
    this.scene = new Scene();
    this.environment = new Environment(this.scene);
    this.player = new Player(this.scene);

    // Start animation loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.player.update();
    this.scene.render();
  }
}

// Start the game when the window loads
window.addEventListener("load", () => {
  new Game();
});
