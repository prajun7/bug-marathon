import { Scene } from "./modules/scene.js";
import { Environment } from "./modules/environment.js";
import { Player } from "./modules/player.js";

class Game {
  constructor() {
    console.log("Game initializing...");

    this.scene = new Scene();
    this.environment = new Environment(this.scene);

    // Create player immediately
    this.player = new Player(this.scene, this.environment);
    console.log("Player initialized");

    this.animate = this.animate.bind(this);
    this.animate();
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.player) {
      this.player.update();
    }

    this.environment.update();
    this.scene.render();
  }
}

// Create game instance when window loads
window.addEventListener("load", () => {
  console.log("Window loaded, creating game...");
  new Game();
});
