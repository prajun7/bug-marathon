import { Game } from "./modules/game.js";

// Create game instance when window loads
window.addEventListener("load", () => {
  console.log("Window loaded, creating game...");
  new Game();
});
