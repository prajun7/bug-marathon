import { Scene } from "./modules/scene.js";
import { Environment } from "./modules/environment.js";

class Game {
  constructor() {
    this.scene = new Scene();
    this.environment = new Environment(this.scene);

    // Start animation loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.scene.render();
  }
}

// Start the game when the window loads
window.addEventListener("load", () => {
  new Game();
});
