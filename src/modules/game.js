import { Scene } from "./scene.js";
import { Environment } from "./environment.js";
import { Player } from "./player.js";
import { LoginScreen } from "./loginScreen.js";

export class Game {
  constructor() {
    console.log("Game initializing...");

    this.scene = new Scene();
    this.environment = new Environment(this.scene);
    this.gameStarted = false;

    // Add CSS for game overlay
    this.addStyles();

    // Bind methods
    this.animate = this.animate.bind(this);
    this.startGame = this.startGame.bind(this);

    // Show login screen first
    this.loginScreen = new LoginScreen(this.startGame);
  }

  startGame(username) {
    // Create player with the username from login
    this.player = new Player(this.scene, this.environment, username);
    console.log("Player initialized with username from login:", username);
    this.gameStarted = true;

    // Start the game loop
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

    // Don't update anything if game hasn't started
    if (!this.gameStarted) {
      this.scene.render();
      return;
    }

    // Update game state
    if (this.player.isAlive) {
      this.environment.update(this.player.mesh.position);
    }

    this.player.update();
    this.scene.render();
  }
}
