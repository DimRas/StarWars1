// Particle system for explosions and visual effects

class ParticleSystem {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];
    this.trailParticles = [];

    // Set maximum number of particles to prevent performance issues
    this.maxParticles = 200;
    this.maxTrailParticles = 100;
  }

  // Create an explosion of particles at the given position
  createExplosion(x, y, count, color, speed, size, decay) {
    // Limit particle count based on current count
    const availableSlots = this.maxParticles - this.particles.length;
    if (availableSlots <= 0) return;

    // Adjust count to not exceed available slots
    const adjustedCount = Math.min(count, availableSlots);

    for (let i = 0; i < adjustedCount; i++) {
      const angle = random(0, Math.PI * 2);
      const velocity = new Vector(
        Math.cos(angle) * random(0.5, speed),
        Math.sin(angle) * random(0.5, speed)
      );

      this.particles.push({
        position: new Vector(x, y),
        velocity,
        size: random(1, size),
        color,
        alpha: 1,
        decay: decay * random(0.8, 1.2),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.1, 0.1),
        shape: Math.random() > 0.7 ? "square" : "circle",
      });
    }
  }

  // Create a massive explosion like in the reference image
  createMassiveExplosion(x, y) {
    // Define explosion colors
    const colors = [
      "#ffffff", // White (bright center)
      "#ffff00", // Yellow
      "#ffa500", // Orange
      "#ff4500", // Red-orange
      "#ff0000", // Red (outer edges)
    ];

    // Create bright central flash
    const flashSize = 120;
    this.particles.push({
      position: new Vector(x, y),
      velocity: new Vector(0, 0),
      size: flashSize,
      color: "#ffffff",
      alpha: 1,
      decay: 0.03,
      rotation: 0,
      rotationSpeed: 0,
      shape: "circle",
      isFlash: true,
    });

    // Create expanding shockwave ring
    this.particles.push({
      position: new Vector(x, y),
      velocity: new Vector(0, 0),
      initialSize: 10,
      size: 10,
      maxSize: 300,
      growthRate: 5,
      color: "#ffcc00",
      alpha: 0.7,
      decay: 0.02,
      rotation: 0,
      rotationSpeed: 0,
      shape: "ring",
    });

    // Create multiple layers of particles
    // Core explosion particles (fast and bright)
    const coreCount = Math.min(
      100,
      (this.maxParticles - this.particles.length) / 3
    );
    for (let i = 0; i < coreCount; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(3, 8);
      const velocity = new Vector(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      // Select color based on speed (faster = brighter)
      const colorIndex = Math.floor(random(0, 2)); // Brighter colors for core

      this.particles.push({
        position: new Vector(x, y),
        velocity,
        size: random(5, 12),
        color: colors[colorIndex],
        alpha: random(0.8, 1),
        decay: random(0.01, 0.02),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.2, 0.2),
        shape: Math.random() > 0.5 ? "circle" : "square",
        lifetime: 0,
        maxLifetime: 60 + Math.random() * 60,
      });
    }

    // Medium explosion particles (medium speed and brightness)
    const mediumCount = Math.min(
      100,
      (this.maxParticles - this.particles.length) / 3
    );
    for (let i = 0; i < mediumCount; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(1.5, 4);
      const velocity = new Vector(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      // Select color based on speed
      const colorIndex = Math.floor(random(1, 4)); // Middle colors

      this.particles.push({
        position: new Vector(x, y),
        velocity,
        size: random(3, 8),
        color: colors[colorIndex],
        alpha: random(0.6, 0.9),
        decay: random(0.008, 0.015),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.15, 0.15),
        shape: Math.random() > 0.3 ? "circle" : "square",
        lifetime: 0,
        maxLifetime: 90 + Math.random() * 90,
      });
    }

    // Outer explosion particles (slower and dimmer)
    const outerCount = Math.min(100, this.maxParticles - this.particles.length);
    for (let i = 0; i < outerCount; i++) {
      const angle = random(0, Math.PI * 2);
      const speed = random(0.5, 2);
      const velocity = new Vector(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      // Select color based on speed
      const colorIndex = Math.floor(random(2, 5)); // Darker colors for outer

      this.particles.push({
        position: new Vector(x, y),
        velocity,
        size: random(1, 4),
        color: colors[colorIndex],
        alpha: random(0.3, 0.7),
        decay: random(0.005, 0.01),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.1, 0.1),
        shape: "circle",
        lifetime: 0,
        maxLifetime: 120 + Math.random() * 120,
      });
    }

    // Create small secondary explosions
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const distance = random(20, 60);
        const angle = random(0, Math.PI * 2);
        const secondaryX = x + Math.cos(angle) * distance;
        const secondaryY = y + Math.sin(angle) * distance;

        // Create a smaller explosion at the secondary position
        const secondaryCount = 20;
        const secondarySize = random(3, 6);
        const secondarySpeed = random(2, 4);
        this.createExplosion(
          secondaryX,
          secondaryY,
          secondaryCount,
          colors[Math.floor(random(1, 3))], // Yellow or orange
          secondarySpeed,
          secondarySize,
          0.02
        );
      }, random(100, 500)); // Delay the secondary explosion
    }
  }

  // Create debris particles (larger and more distinct than explosion particles)
  createDebris(x, y, count, color, speed) {
    // Limit debris count based on current count
    const availableSlots = this.maxParticles - this.particles.length;
    if (availableSlots <= 0) return;

    // Adjust count to not exceed available slots
    const adjustedCount = Math.min(count, availableSlots);

    for (let i = 0; i < adjustedCount; i++) {
      const angle = random(0, Math.PI * 2);
      const velocity = new Vector(
        Math.cos(angle) * random(1, speed),
        Math.sin(angle) * random(1, speed)
      );

      this.particles.push({
        position: new Vector(x, y),
        velocity,
        size: random(3, 6),
        color,
        alpha: 1,
        decay: random(0.01, 0.03),
        rotation: random(0, Math.PI * 2),
        rotationSpeed: random(-0.2, 0.2),
        shape: Math.random() > 0.5 ? "triangle" : "square",
      });
    }
  }

  // Create score particles that float upward
  createScoreParticle(x, y, score, color) {
    // Only create if we have room
    if (this.particles.length >= this.maxParticles) return;

    this.particles.push({
      position: new Vector(x, y),
      velocity: new Vector(random(-0.5, 0.5), random(-2, -1)),
      size: 10,
      color,
      alpha: 1,
      decay: 0.02,
      rotation: 0,
      rotationSpeed: 0,
      text: `+${score}`,
      isScore: true,
    });
  }

  // Create text score display that floats upward (renamed version of createScoreParticle)
  createScoreText(x, y, text, color) {
    // Only create if we have room
    if (this.particles.length >= this.maxParticles) return;

    this.particles.push({
      position: new Vector(x, y),
      velocity: new Vector(random(-0.5, 0.5), random(-2, -1)),
      size: 12,
      color,
      alpha: 1,
      decay: 0.02,
      rotation: 0,
      rotationSpeed: 0,
      text: `+${text}`,
      isScore: true,
    });
  }

  // Add trail particle behind an entity
  addTrail(x, y, color, size) {
    // Only add if we haven't reached the maximum
    if (this.trailParticles.length >= this.maxTrailParticles) {
      // Remove oldest trail particle to make room
      this.trailParticles.shift();
    }

    this.trailParticles.push({
      position: new Vector(x, y),
      size,
      color,
      alpha: 0.5,
      decay: 0.05,
    });
  }

  // Update all particles
  update() {
    // Update regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Apply velocity
      particle.position.add(particle.velocity);

      // Apply gravity and damping if needed
      particle.velocity.multiply(0.98); // Air resistance

      // Update rotation
      if (particle.rotation !== undefined) {
        particle.rotation += particle.rotationSpeed;
      }

      // Update ring particles size
      if (particle.shape === "ring" && particle.growthRate) {
        particle.size = Math.min(
          particle.size + particle.growthRate,
          particle.maxSize
        );
        // Reduce alpha as the ring grows
        particle.alpha = Math.max(
          0.7 * (1 - particle.size / particle.maxSize),
          0
        );
      }

      // Track lifetime for particles with maxLifetime
      if (particle.maxLifetime !== undefined) {
        particle.lifetime = (particle.lifetime || 0) + 1;
        if (particle.lifetime >= particle.maxLifetime) {
          particle.alpha = 0; // Mark for removal
        }
      }

      // Reduce alpha based on decay rate
      particle.alpha -= particle.decay;

      // Remove particles that have faded out
      if (particle.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const trail = this.trailParticles[i];
      trail.alpha -= trail.decay;

      if (trail.alpha <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
  }

  // Render all particles
  render() {
    // Render trail particles first (they go below regular particles)
    this.trailParticles.forEach((trail) => {
      this.ctx.save();
      this.ctx.globalAlpha = trail.alpha;
      this.ctx.globalCompositeOperation = "lighter";

      // Draw glow
      const glow = createGlow(
        this.ctx,
        trail.position.x,
        trail.position.y,
        trail.size,
        trail.color,
        trail.alpha
      );

      this.ctx.beginPath();
      this.ctx.fillStyle = glow || trail.color;
      this.ctx.arc(
        trail.position.x,
        trail.position.y,
        trail.size,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      this.ctx.restore();
    });

    // Render regular particles
    this.particles.forEach((particle) => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.globalCompositeOperation = "lighter";

      // Position for drawing
      this.ctx.translate(particle.position.x, particle.position.y);

      if (particle.rotation !== undefined) {
        this.ctx.rotate(particle.rotation);
      }

      // Draw the particle based on its shape
      if (particle.isScore) {
        // Score text
        this.ctx.fillStyle = particle.color;
        this.ctx.font = `bold ${particle.size}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(particle.text, 0, 0);

        // Glow effect for text
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(particle.text, 0, 0);
      } else if (particle.isFlash) {
        // Central explosion flash
        const gradient = this.ctx.createRadialGradient(
          0,
          0,
          0,
          0,
          0,
          particle.size
        );
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.3, "rgba(255, 255, 0, 0.8)");
        gradient.addColorStop(0.7, "rgba(255, 165, 0, 0.4)");
        gradient.addColorStop(1, "rgba(255, 69, 0, 0)");

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Add extra glow
        this.ctx.shadowColor = "#ffff00";
        this.ctx.shadowBlur = 30;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (particle.shape === "ring") {
        // Expanding shockwave ring
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = Math.max(1, particle.size / 15);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.stroke();

        // Add glow to the ring
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (particle.shape === "square") {
        // Square particle
        // Draw glow effect
        const glow = createGlow(
          this.ctx,
          0,
          0,
          particle.size * 1.5,
          particle.color,
          particle.alpha
        );

        this.ctx.fillStyle = glow || particle.color;
        this.ctx.fillRect(
          -particle.size,
          -particle.size,
          particle.size * 2,
          particle.size * 2
        );
      } else if (particle.shape === "triangle") {
        // Triangle particle
        // Draw glow effect
        const glow = createGlow(
          this.ctx,
          0,
          0,
          particle.size * 1.5,
          particle.color,
          particle.alpha
        );

        this.ctx.fillStyle = glow || particle.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -particle.size * 1.5);
        this.ctx.lineTo(-particle.size, particle.size);
        this.ctx.lineTo(particle.size, particle.size);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        // Default: circle particle
        // Draw glow effect
        const glow = createGlow(
          this.ctx,
          0,
          0,
          particle.size * 1.5,
          particle.color,
          particle.alpha
        );

        this.ctx.fillStyle = glow || particle.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  // Reset all particles
  reset() {
    this.particles = [];
    this.trailParticles = [];
  }

  // Create a smaller, optimized hit effect for bosses
  createBossHitEffect(x, y) {
    // Only add a few particles
    const particleCount = 5;

    // Fast implementation with minimal particles
    for (let i = 0; i < particleCount; i++) {
      const angle = random(0, Math.PI * 2);
      const velocity = new Vector(
        Math.cos(angle) * random(0.5, 1.5),
        Math.sin(angle) * random(0.5, 1.5)
      );

      this.particles.push({
        position: new Vector(x, y),
        velocity,
        size: random(1, 3),
        color: "#ffffff",
        alpha: 0.7,
        decay: 0.1,
        rotation: 0,
        rotationSpeed: 0,
        shape: "circle",
      });
    }

    // Add a single flash at hit location
    this.particles.push({
      position: new Vector(x, y),
      velocity: new Vector(0, 0),
      size: 8,
      color: "#ffff00",
      alpha: 0.5,
      decay: 0.2,
      rotation: 0,
      rotationSpeed: 0,
      shape: "circle",
      isFlash: true,
    });
  }
}
