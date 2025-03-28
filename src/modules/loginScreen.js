export class LoginScreen {
  constructor(onGameStart) {
    this.onGameStart = onGameStart;
    // Get saved username from localStorage if available
    this.username = localStorage.getItem("bugMarathonUsername") || "";
    this.createLoginUI();
  }

  createLoginUI() {
    // Create container
    const container = document.createElement("div");
    container.id = "login-screen";
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 1000;
    `;

    // Create title
    const title = document.createElement("h1");
    title.textContent = "Bug Marathon";
    title.style.cssText = `
      color: #fff;
      margin-bottom: 30px;
      font-size: 48px;
    `;

    // Create username input
    const usernameInput = document.createElement("input");
    usernameInput.type = "text";
    usernameInput.placeholder = "Enter your username";
    // Pre-fill with saved username if available
    if (this.username) {
      usernameInput.value = this.username;
      // Need to set this variable here so we can reference it when we update the button state
      const savedUsername = this.username;
      // Use setTimeout to ensure this runs after the button is created and styled
      setTimeout(() => {
        if (savedUsername.trim() !== "") {
          startButton.disabled = false;
          startButton.style.backgroundColor = "#4CAF50";
          startButton.style.cursor = "pointer";
        }
      }, 0);
    }
    usernameInput.style.cssText = `
      padding: 10px;
      font-size: 18px;
      margin-bottom: 20px;
      width: 300px;
      border: none;
      border-radius: 5px;
    `;
    usernameInput.addEventListener("input", (e) => {
      this.username = e.target.value;

      // Enable/disable button based on username
      if (this.username.trim() !== "") {
        startButton.disabled = false;
        startButton.style.backgroundColor = "#4CAF50";
        startButton.style.cursor = "pointer";
      } else {
        startButton.disabled = true;
        startButton.style.backgroundColor = "#cccccc";
        startButton.style.cursor = "not-allowed";
      }
    });

    // Create start button
    const startButton = document.createElement("button");
    startButton.textContent = "Join the Game";
    startButton.disabled = true; // Disabled by default
    startButton.style.cssText = `
      padding: 10px 20px;
      font-size: 18px;
      background-color: #cccccc;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: not-allowed;
      transition: background-color 0.3s;
    `;
    startButton.addEventListener("mouseover", () => {
      if (!startButton.disabled) {
        startButton.style.backgroundColor = "#45a049";
      }
    });
    startButton.addEventListener("mouseout", () => {
      if (!startButton.disabled) {
        startButton.style.backgroundColor = "#4CAF50";
      }
    });
    startButton.addEventListener("click", () => {
      if (this.username.trim() !== "") {
        // Save username to localStorage
        localStorage.setItem("bugMarathonUsername", this.username);
        this.hide();
        this.onGameStart(this.username);
      }
    });

    // Append elements to container
    container.appendChild(title);
    container.appendChild(usernameInput);
    container.appendChild(startButton);

    // Append container to body
    document.body.appendChild(container);

    this.container = container;
  }

  hide() {
    if (this.container) {
      document.body.removeChild(this.container);
    }
  }
}
