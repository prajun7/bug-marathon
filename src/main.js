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

    // Add CSS for game overlay
    this.addStyles();

    this.animate = this.animate.bind(this);
    this.animate();
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #respawnText {
        font-family: Arial, sans-serif;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Update game state
    if (this.player.isAlive) {
      this.environment.update(this.player.mesh.position);
    }

    this.player.update();
    this.scene.render();
  }
}

// Create game instance when window loads
window.addEventListener("load", () => {
  console.log("Window loaded, creating game...");
  new Game();
});
