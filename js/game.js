// Main game class that ties everything together

class Game {
  constructor() {
    // DOM elements
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.scoreDisplay = document.getElementById("score");
    this.finalScoreDisplay = document.getElementById("finalScore");
    this.gameOverScreen = document.getElementById("gameOver");
    this.startMenu = document.getElementById("startMenu");
    this.pauseMenu = document.getElementById("pauseMenu");
    this.startButton = document.getElementById("startButton");
    this.restartButton = document.getElementById("restartButton");
    this.pauseButton = document.getElementById("pauseButton");
    this.resumeButton = document.getElementById("resumeButton");
    this.quitButton = document.getElementById("quitButton");

    // Game state
    this.isRunning = false;
    this.isPaused = false;
    this.animationFrameId = null;
    this.lastTime = 0;
    this.fps = 60;
    this.frameTime = 1000 / this.fps;
    this.accumulator = 0;

    // Detect if performance mode is needed
    this.performanceMode = this.shouldUsePerformanceMode();

    // Initialize canvas size
    this.resizeCanvas();

    // Game objects
    this.particles = new ParticleSystem(this.canvas, this.ctx);
    this.grid = new Grid(this.canvas, this.ctx);
    this.player = new Player(this.canvas, this.ctx, this.particles);
    this.enemyManager = new EnemyManager(
      this.canvas,
      this.ctx,
      this.particles,
      this.player,
      this.grid
    );

    // Event listeners
    window.addEventListener("resize", () => this.resizeCanvas());
    this.startButton.addEventListener("click", () => this.startGame());
    this.restartButton.addEventListener("click", () => this.restartGame());
    this.pauseButton.addEventListener("click", () => this.togglePause());
    this.resumeButton.addEventListener("click", () => this.resumeGame());
    this.quitButton.addEventListener("click", () => this.quitToMenu());

    // Keyboard shortcut for pause (Escape key)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isRunning) {
        this.togglePause();
      }
    });

    // Post-processing effects
    this.bloomCanvas = document.createElement("canvas");
    this.bloomCtx = this.bloomCanvas.getContext("2d");

    // Use lower blur strength in performance mode
    this.blurStrength = this.performanceMode ? 5 : 10;

    // Initialize
    this.showStartMenu();
  }

  // Detect if performance mode is needed based on device capabilities
  shouldUsePerformanceMode() {
    // Check for mobile devices which typically have lower performance
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Check for low-end devices based on available memory or hardware concurrency
    const isLowEndDevice =
      (navigator.deviceMemory && navigator.deviceMemory < 4) || // Less than 4GB RAM
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4); // Less than 4 cores

    return isMobile || isLowEndDevice;
  }

  // Resize canvas to fill the window
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Resize offscreen canvas too
    if (this.bloomCanvas) {
      this.bloomCanvas.width = this.canvas.width;
      this.bloomCanvas.height = this.canvas.height;
    }

    // Update grid if it exists
    if (this.grid) {
      this.grid.resize(this.canvas.width, this.canvas.height);
    }
  }

  // Show the start menu
  showStartMenu() {
    this.startMenu.classList.remove("hidden");
    this.gameOverScreen.classList.add("hidden");
    this.pauseMenu.classList.add("hidden");
    this.pauseButton.classList.add("hidden");
  }

  // Start a new game
  startGame() {
    this.startMenu.classList.add("hidden");
    this.gameOverScreen.classList.add("hidden");
    this.pauseMenu.classList.add("hidden");
    this.pauseButton.classList.remove("hidden");

    this.isRunning = true;
    this.isPaused = false;
    this.resetGame();
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  // Toggle pause state
  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  // Pause the game
  pauseGame() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    this.pauseMenu.classList.remove("hidden");

    // Stop the animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Resume the game
  resumeGame() {
    if (!this.isRunning || !this.isPaused) return;

    this.isPaused = false;
    this.pauseMenu.classList.add("hidden");

    // Restart the animation loop
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  // Quit to main menu
  quitToMenu() {
    this.isRunning = false;
    this.isPaused = false;
    this.pauseMenu.classList.add("hidden");
    this.pauseButton.classList.add("hidden");

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.showStartMenu();
  }

  // Restart the game after game over
  restartGame() {
    this.gameOverScreen.classList.add("hidden");
    this.pauseButton.classList.remove("hidden");
    this.isRunning = true;
    this.isPaused = false;
    this.resetGame();
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  // Reset game state
  resetGame() {
    this.player.reset();
    this.enemyManager.reset();
    this.particles.reset();
  }

  // Game loop using fixed time step
  gameLoop(currentTime) {
    if (!this.isRunning) return;

    // Request next frame first
    this.animationFrameId = requestAnimationFrame((time) =>
      this.gameLoop(time)
    );

    // Calculate time delta
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Add to accumulator
    this.accumulator += deltaTime;

    // Update game at fixed intervals
    while (this.accumulator >= this.frameTime) {
      this.update();
      this.accumulator -= this.frameTime;
    }

    // Render game
    this.render();

    // Check for game over
    if (!this.player.alive) {
      this.gameOver();
    }

    // Update score display
    this.updateScore();
  }

  // Update game state
  update() {
    this.grid.update();
    this.player.update(this.grid);
    this.enemyManager.update();
    this.particles.update();
  }

  // Render the game
  render() {
    // Render space background first
    this.grid.render();

    // Main rendering pass to bloom canvas
    this.bloomCtx.clearRect(
      0,
      0,
      this.bloomCanvas.width,
      this.bloomCanvas.height
    );

    // Draw entities to bloom canvas
    this.bloomCtx.save();
    this.bloomCtx.globalCompositeOperation = "lighter";

    this.particles.render();
    this.enemyManager.render();
    this.player.render();

    this.bloomCtx.restore();

    // Apply bloom effect
    this.applyBloom();

    // Copy bloom canvas to main canvas
    this.ctx.globalCompositeOperation = "lighter";
    this.ctx.drawImage(this.bloomCanvas, 0, 0);
    this.ctx.globalCompositeOperation = "source-over";
  }

  // Apply bloom (glow) effect to the rendered scene
  applyBloom() {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.bloomCanvas.width;
    tempCanvas.height = this.bloomCanvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Copy original content
    tempCtx.drawImage(this.bloomCanvas, 0, 0);

    // Reduce blur strength for better performance
    const optimizedBlurStrength = Math.min(this.blurStrength, 6);

    // Apply horizontal blur with fewer iterations
    this.bloomCtx.globalAlpha = 0.5;
    this.bloomCtx.globalCompositeOperation = "lighter";

    for (let i = 1; i <= optimizedBlurStrength; i += 1) {
      const weight = 1.0 - i / optimizedBlurStrength;
      this.bloomCtx.globalAlpha = 0.15 * weight;

      // Use larger offsets for fewer iterations but similar effect
      const offset = i * 2;
      this.bloomCtx.drawImage(tempCanvas, offset, 0);
      this.bloomCtx.drawImage(tempCanvas, -offset, 0);
    }

    // Apply vertical blur with fewer iterations
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(this.bloomCanvas, 0, 0);

    for (let i = 1; i <= optimizedBlurStrength; i += 1) {
      const weight = 1.0 - i / optimizedBlurStrength;
      this.bloomCtx.globalAlpha = 0.15 * weight;

      // Use larger offsets for fewer iterations but similar effect
      const offset = i * 2;
      this.bloomCtx.drawImage(tempCanvas, 0, offset);
      this.bloomCtx.drawImage(tempCanvas, 0, -offset);
    }

    // Reset alpha
    this.bloomCtx.globalAlpha = 1.0;
  }

  // Game over sequence
  gameOver() {
    this.isRunning = false;
    this.isPaused = false;

    // Hide pause button
    this.pauseButton.classList.add("hidden");
    this.pauseMenu.classList.add("hidden");

    // Update final score
    this.finalScoreDisplay.textContent = this.enemyManager.getScore();

    // Show game over screen after a short delay
    setTimeout(() => {
      this.gameOverScreen.classList.remove("hidden");
    }, 1500);
  }

  // Update score display
  updateScore() {
    // Get score and combo data
    const score = this.enemyManager.getScore();
    const comboData = this.enemyManager.getCombo();

    // Update score text
    this.scoreDisplay.textContent = score;

    // Visual effect for multiplier
    if (comboData.multiplier > 1) {
      const color =
        comboData.multiplier >= 3
          ? "#f0f"
          : comboData.multiplier >= 2
          ? "#ff0"
          : "#0ff";

      this.scoreDisplay.style.color = color;
      this.scoreDisplay.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;

      // Add multiplier text
      this.scoreDisplay.textContent += ` x${comboData.multiplier}`;
    } else {
      this.scoreDisplay.style.color = "#0ff";
      this.scoreDisplay.style.textShadow = "0 0 10px #0ff, 0 0 20px #0ff";
    }
  }
}

// Initialize the game when the page loads
window.addEventListener("load", () => {
  const game = new Game();
});
