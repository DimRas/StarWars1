// Space background with stars effect

class Grid {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;

    // Stars properties
    this.stars = [];
    this.numStars = 300;
    this.nebulaColors = [
      "rgba(41, 73, 255, 0.1)",
      "rgba(140, 67, 255, 0.1)",
      "rgba(0, 143, 255, 0.1)",
    ];

    // Create stars
    this.setupStars();

    // Create nebula cloud points
    this.nebulaClouds = [];
    this.setupNebulaClouds();
  }

  // Initialize stars
  setupStars() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        brightness: Math.random() * 0.8 + 0.2,
        blinkSpeed: Math.random() * 0.05,
        blinkOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  // Create nebula cloud effect
  setupNebulaClouds() {
    for (let i = 0; i < 5; i++) {
      this.nebulaClouds.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 300 + 200,
        color:
          this.nebulaColors[
            Math.floor(Math.random() * this.nebulaColors.length)
          ],
        drift: {
          x: (Math.random() - 0.5) * 0.1,
          y: (Math.random() - 0.5) * 0.1,
        },
      });
    }
  }

  // Add a new distortion (kept for compatibility)
  addDistortion(x, y, force, decay) {
    // No longer used but kept for compatibility
  }

  // Add a camera shake method to the Grid class
  addCameraShake(duration, intensity) {
    this.shakeTime = duration || 10;
    this.shakeIntensity = intensity || 0.5;
    this.isShaking = true;
  }

  // Update stars positions and nebula
  update() {
    // Update stars
    this.stars.forEach((star) => {
      star.y += star.speed;

      // Reset stars that go off the bottom of the screen
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    });

    // Update nebula clouds
    this.nebulaClouds.forEach((cloud) => {
      cloud.x += cloud.drift.x;
      cloud.y += cloud.drift.y;

      // Wrap around screen
      if (cloud.x < -cloud.radius) cloud.x = this.width + cloud.radius;
      if (cloud.x > this.width + cloud.radius) cloud.x = -cloud.radius;
      if (cloud.y < -cloud.radius) cloud.y = this.height + cloud.radius;
      if (cloud.y > this.height + cloud.radius) cloud.y = -cloud.radius;
    });

    // Update camera shake
    if (this.isShaking) {
      this.shakeTime--;
      if (this.shakeTime <= 0) {
        this.isShaking = false;
      }
    }
  }

  // Render the space background
  render() {
    this.ctx.save();

    // Apply camera shake if active
    if (this.isShaking && this.shakeTime > 0) {
      const shakeOffsetX =
        (Math.random() * 2 - 1) * this.shakeIntensity * this.shakeTime;
      const shakeOffsetY =
        (Math.random() * 2 - 1) * this.shakeIntensity * this.shakeTime;
      this.ctx.translate(shakeOffsetX, shakeOffsetY);
    }

    // Fill the background with space color
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render nebula clouds
    this.renderNebula();

    // Render stars
    this.renderStars();

    this.ctx.restore();
  }

  // Render nebula clouds
  renderNebula() {
    this.nebulaClouds.forEach((cloud) => {
      const gradient = this.ctx.createRadialGradient(
        cloud.x,
        cloud.y,
        0,
        cloud.x,
        cloud.y,
        cloud.radius
      );

      gradient.addColorStop(0, cloud.color);
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // Render stars
  renderStars() {
    this.ctx.save();

    this.stars.forEach((star) => {
      // Calculate star brightness with blinking effect
      const time = performance.now() / 1000;
      const blink =
        0.5 * Math.sin(time * star.blinkSpeed + star.blinkOffset) + 0.5;
      const brightness = star.brightness * (0.7 + 0.3 * blink);

      // Draw star
      this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;

      // Draw larger stars with glow
      if (star.size > 1.5) {
        // Add glow effect for bigger stars
        this.ctx.shadowColor = "white";
        this.ctx.shadowBlur = 10;

        // Occasionally make a star shine brighter
        if (Math.random() < 0.001) {
          this.ctx.shadowBlur = 20;
          this.ctx.fillStyle = "rgba(255, 255, 255, 1)";
        }
      } else {
        this.ctx.shadowBlur = 0;
      }

      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  // Update dimensions when canvas resizes
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.setupStars();
    this.setupNebulaClouds();
  }
}
