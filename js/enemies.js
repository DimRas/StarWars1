// Enemy classes and spawning logic

class EnemyManager {
  constructor(canvas, ctx, particles, player, grid) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = particles;
    this.player = player;
    this.grid = grid;

    this.enemies = [];
    this.enemyProjectiles = []; // Array for enemy projectiles
    this.spawnTimer = 0;
    this.spawnRate = 120; // Frames between spawns
    this.difficultyTimer = 0;
    this.difficultyInterval = 1000; // Frames between difficulty increases
    this.maxEnemies = 20;
    this.score = 0;
    this.scoreMultiplier = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.multiplierTimer = 0;
    this.frameCount = 0; // Track frames for optimization

    // Boss properties
    this.bossActive = false;
    this.bossTimer = 1800; // Spawn boss every 30 seconds (60fps * 30)
    this.bossSpawnThreshold = 1800;
  }

  // Update all enemies and spawn new ones
  update() {
    // Increment frame counter
    this.frameCount++;

    // Update boss timer
    if (!this.bossActive) {
      this.bossTimer--;
      if (this.bossTimer <= 0) {
        this.spawnBoss();
        this.bossTimer = this.bossSpawnThreshold;
      }
    }

    // Update spawn timer
    this.spawnTimer++;
    if (
      this.spawnTimer >= this.spawnRate &&
      this.enemies.length < this.maxEnemies
    ) {
      this.spawn();
      this.spawnTimer = 0;
    }

    // Update difficulty
    this.difficultyTimer++;
    if (this.difficultyTimer >= this.difficultyInterval) {
      this.increaseDifficulty();
      this.difficultyTimer = 0;
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Update enemy position and behavior
      enemy.update();

      // Add trail particles for some enemy types
      if (enemy.type !== "wanderer" && Math.random() < 0.2) {
        this.particles.addTrail(
          enemy.position.x,
          enemy.position.y,
          enemy.color,
          1 + enemy.size / 10
        );
      }

      // Check for collision with player
      if (this.player.checkCollision(enemy)) {
        this.player.die(this.grid);
        // Don't remove the enemy, let it continue
      }

      // Check for collision with player projectiles
      if (this.player.checkProjectileCollision(enemy)) {
        if (enemy.health) {
          // Boss or other multi-hit enemy
          enemy.health--;

          // Track hit time for collision throttling in player.js
          enemy.lastHitTime = performance.now();

          // Create hit effect with reduced particles for performance
          const particleCount = enemy.isBoss ? 5 : 15; // Further reduced for boss

          // For boss hits, only create visual effects every 3rd hit to improve performance
          let shouldCreateEffects = !enemy.isBoss || enemy.health % 3 === 0;

          // Always show effects when boss is nearly destroyed
          if (enemy.isBoss && enemy.health <= 3) {
            shouldCreateEffects = true;
          }

          // Only create particles if allowed and we have available slots
          const availableParticles =
            this.particles.maxParticles - this.particles.particles.length;
          if (shouldCreateEffects && availableParticles > particleCount) {
            if (enemy.isBoss) {
              // Use the optimized boss hit effect
              this.particles.createBossHitEffect(
                enemy.position.x + random(-enemy.size / 4, enemy.size / 4),
                enemy.position.y + random(-enemy.size / 4, enemy.size / 4)
              );
            } else {
              // Normal hit effect for regular enemies
              this.particles.createExplosion(
                enemy.position.x + random(-enemy.size / 3, enemy.size / 3),
                enemy.position.y + random(-enemy.size / 3, enemy.size / 3),
                particleCount,
                "#ffffff",
                1.5, // Reduced speed
                1.5, // Reduced size
                0.08 // Faster decay
              );
            }
          }

          // Generate score for each hit
          const hitPoints = 50;
          this.score += hitPoints;

          // Limit score text frequency for boss to improve performance
          // Only show score text on every 5th hit
          if (
            (!enemy.isBoss || enemy.health % 5 === 0) &&
            (!enemy.lastScoreTime ||
              performance.now() - enemy.lastScoreTime > 300)
          ) {
            this.particles.createScoreText(
              enemy.position.x,
              enemy.position.y - enemy.size,
              hitPoints.toString(),
              "#ffffff"
            );
            enemy.lastScoreTime = performance.now();
          }

          // If health depleted, destroy the enemy
          if (enemy.health <= 0) {
            this.destroyEnemy(enemy, i);
          }
        } else {
          // Regular one-hit enemy
          this.destroyEnemy(enemy, i);
        }
        continue; // Skip the rest of this iteration
      }

      // Remove if off screen by a large margin
      if (
        enemy.position.x < -100 ||
        enemy.position.x > this.canvas.width + 100 ||
        enemy.position.y < -100 ||
        enemy.position.y > this.canvas.height + 100
      ) {
        this.enemies.splice(i, 1);

        // If it was a boss, update boss active state
        if (enemy.isBoss) {
          this.bossActive = false;
        }
      }
    }

    // Update enemy projectiles
    this.updateProjectiles();

    // Update combo timer
    if (this.combo > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Update multiplier timer
    if (this.scoreMultiplier > 1) {
      this.multiplierTimer--;
      if (this.multiplierTimer <= 0) {
        this.scoreMultiplier = 1;
      }
    }
  }

  // Update and check collisions for enemy projectiles
  updateProjectiles() {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.enemyProjectiles[i];

      // Update position
      projectile.position.add(projectile.velocity);

      // Add trail particles
      if (Math.random() < 0.3) {
        this.particles.addTrail(
          projectile.position.x,
          projectile.position.y,
          projectile.color,
          1
        );
      }

      // Check collision with player
      if (this.player.alive && !this.player.invulnerable) {
        const distance = Math.sqrt(
          Math.pow(projectile.position.x - this.player.position.x, 2) +
            Math.pow(projectile.position.y - this.player.position.y, 2)
        );

        if (distance < this.player.size + projectile.size) {
          this.player.die(this.grid);
          this.enemyProjectiles.splice(i, 1);
          continue;
        }
      }

      // Remove if off screen
      if (
        projectile.position.x < -20 ||
        projectile.position.x > this.canvas.width + 20 ||
        projectile.position.y < -20 ||
        projectile.position.y > this.canvas.height + 20
      ) {
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  // Fire enemy projectile
  fireProjectile(enemy, speed, size) {
    // Calculate direction to player
    const direction = Math.atan2(
      this.player.position.y - enemy.position.y,
      this.player.position.x - enemy.position.x
    );

    // Add some randomness to aim
    const accuracy = enemy.type === "spinner" ? 0.1 : 0.3; // Spinners are more accurate
    const randomDirection = direction + (Math.random() - 0.5) * accuracy;

    const projectile = {
      position: new Vector(enemy.position.x, enemy.position.y),
      velocity: new Vector(
        Math.cos(randomDirection) * speed,
        Math.sin(randomDirection) * speed
      ),
      size: size || 3,
      color: "#f00", // Red projectiles
    };

    this.enemyProjectiles.push(projectile);
  }

  // Render all enemies
  render() {
    // Render enemy projectiles
    this.enemyProjectiles.forEach((projectile) => {
      this.ctx.save();
      this.ctx.translate(projectile.position.x, projectile.position.y);

      // Draw glow
      const glow = createGlow(
        this.ctx,
        0,
        0,
        projectile.size * 1.5,
        projectile.color,
        0.8
      );

      this.ctx.fillStyle = glow || projectile.color;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, projectile.size, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    });

    // Render enemies
    this.enemies.forEach((enemy) => {
      this.ctx.save();
      this.ctx.translate(enemy.position.x, enemy.position.y);

      if (enemy.rotation !== undefined) {
        this.ctx.rotate(enemy.rotation);
      }

      // Draw based on enemy type
      if (enemy.type === "boss") {
        // Boss ship - Millennium Falcon style
        const s = enemy.size;

        // Draw boss health bar only every other frame to improve performance
        if (enemy.health && enemy.maxHealth && this.frameCount % 2 === 0) {
          this.ctx.save();
          this.ctx.rotate(-enemy.rotation); // Keep health bar unrotated

          // Health bar background
          this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          this.ctx.fillRect(-s, -s - 15, s * 2, 8);

          // Health bar fill
          const healthPercent = enemy.health / enemy.maxHealth;
          let healthColor;

          if (healthPercent > 0.6) healthColor = "#0f0"; // Green
          else if (healthPercent > 0.3) healthColor = "#ff0"; // Yellow
          else healthColor = "#f00"; // Red

          this.ctx.fillStyle = healthColor;
          this.ctx.fillRect(-s, -s - 15, s * 2 * healthPercent, 8);

          this.ctx.restore();
        }

        // Main hull color - using a mix of light gray with a slight bluish tint
        this.ctx.fillStyle = "#b8c4d0";

        // Main circular body
        this.ctx.beginPath();
        this.ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
        this.ctx.fill();

        // Add some colored hull plates - simplified when boss is being hit to improve performance
        const isCurrentlyBeingHit =
          enemy.lastHitTime && performance.now() - enemy.lastHitTime < 200;
        if (!isCurrentlyBeingHit) {
          this.ctx.fillStyle = "#8a9296"; // Darker gray for some panels
          this.ctx.beginPath();
          this.ctx.moveTo(-s * 0.4, -s * 0.6);
          this.ctx.lineTo(s * 0.2, -s * 0.7);
          this.ctx.lineTo(s * 0.1, -s * 0.3);
          this.ctx.lineTo(-s * 0.3, -s * 0.2);
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.fillStyle = "#9badb7"; // Another panel color
          this.ctx.beginPath();
          this.ctx.moveTo(-s * 0.7, s * 0.4);
          this.ctx.lineTo(-s * 0.2, s * 0.7);
          this.ctx.lineTo(s * 0.1, s * 0.5);
          this.ctx.lineTo(-s * 0.4, s * 0.2);
          this.ctx.closePath();
          this.ctx.fill();
        }

        // Mandibles/front prongs - slightly darker color
        this.ctx.fillStyle = "#939da8";
        this.ctx.beginPath();
        this.ctx.moveTo(s * 0.5, -s * 0.4);
        this.ctx.lineTo(s * 1.3, -s * 0.4);
        this.ctx.lineTo(s * 1.3, -s * 0.1);
        this.ctx.lineTo(s * 0.5, -s * 0.1);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(s * 0.5, s * 0.1);
        this.ctx.lineTo(s * 1.3, s * 0.1);
        this.ctx.lineTo(s * 1.3, s * 0.4);
        this.ctx.lineTo(s * 0.5, s * 0.4);
        this.ctx.closePath();
        this.ctx.fill();

        // Add red stripes on the mandibles - skip when being hit to improve performance
        if (!isCurrentlyBeingHit) {
          this.ctx.fillStyle = "#c1272d"; // Red stripe
          this.ctx.fillRect(s * 0.7, -s * 0.4, s * 0.15, s * 0.3);
          this.ctx.fillRect(s * 1.0, -s * 0.4, s * 0.15, s * 0.3);
          this.ctx.fillRect(s * 0.7, s * 0.1, s * 0.15, s * 0.3);
          this.ctx.fillRect(s * 1.0, s * 0.1, s * 0.15, s * 0.3);
        }

        // Cockpit with bright blue color
        this.ctx.fillStyle = "#4fc3f7"; // Brighter blue cockpit
        this.ctx.beginPath();
        this.ctx.arc(s * 0.4, -s * 0.55, s * 0.2, 0, Math.PI * 2);
        this.ctx.fill();

        // Darker outline around cockpit - skip when being hit to improve performance
        if (!isCurrentlyBeingHit) {
          this.ctx.strokeStyle = "#2196f3";
          this.ctx.lineWidth = s * 0.04;
          this.ctx.beginPath();
          this.ctx.arc(s * 0.4, -s * 0.55, s * 0.2, 0, Math.PI * 2);
          this.ctx.stroke();
        }

        // Rectangular details on main body with varied colors
        // Central rectangle - slightly yellow-tinged
        this.ctx.fillStyle = "#c0c0a8";
        this.ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6);

        // Side details - varied colors - skip when being hit to improve performance
        if (!isCurrentlyBeingHit) {
          this.ctx.fillStyle = "#7d8c96"; // Bluish-gray
          this.ctx.fillRect(-s * 0.7, -s * 0.2, s * 0.3, s * 0.4);

          this.ctx.fillStyle = "#94826a"; // Tan/brown panel
          this.ctx.fillRect(-s * 0.6, -s * 0.6, s * 0.3, s * 0.3);

          this.ctx.fillStyle = "#8a8a8a"; // Dark gray
          this.ctx.fillRect(s * 0.1, s * 0.3, s * 0.3, s * 0.3);
        }

        // Engine glow - brighter orange
        this.ctx.fillStyle = "#ff8c41";
        this.ctx.beginPath();
        this.ctx.arc(-s * 0.9, 0, s * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        // Add inner glow to engine
        this.ctx.fillStyle = "#ffcc80";
        this.ctx.beginPath();
        this.ctx.arc(-s * 0.9, 0, s * 0.15, 0, Math.PI * 2);
        this.ctx.fill();

        // Satellite dish - more silver/metallic - skip when being hit to improve performance
        if (!isCurrentlyBeingHit) {
          this.ctx.fillStyle = "#d1d6db";
          this.ctx.beginPath();
          this.ctx.arc(0, -s * 0.3, s * 0.15, 0, Math.PI * 2);
          this.ctx.fill();

          // Dish inner details
          this.ctx.fillStyle = "#8a9296";
          this.ctx.beginPath();
          this.ctx.arc(0, -s * 0.3, s * 0.08, 0, Math.PI * 2);
          this.ctx.fill();
        }

        // Panel lines for detail - completely skip when being hit to improve performance
        if (!isCurrentlyBeingHit) {
          this.ctx.strokeStyle = "#394249"; // Darker lines
          this.ctx.lineWidth = s * 0.03;

          // Circular panel lines
          this.ctx.beginPath();
          this.ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
          this.ctx.stroke();

          // Center-to-edge lines
          this.ctx.beginPath();
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(s * 0.8, 0);
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(-s * 0.8, s * 0.2);
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(-s * 0.8, -s * 0.2);
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(0, s * 0.8);
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(0, -s * 0.8);
          this.ctx.stroke();
        }

        // Damage indicators
        if (enemy.health && enemy.maxHealth) {
          const healthPercent = enemy.health / enemy.maxHealth;
          // Only draw damage indicators when not being actively hit
          if (!isCurrentlyBeingHit) {
            if (healthPercent < 0.7) {
              // First damage stage - red damage indicator
              this.ctx.fillStyle = "#f00";
              this.ctx.beginPath();
              this.ctx.arc(s * 0.2, s * 0.4, s * 0.08, 0, Math.PI * 2);
              this.ctx.fill();
            }

            if (healthPercent < 0.4) {
              // Second damage stage - smoke/fire particles
              // Reduce particle frequency to improve performance
              if (Math.random() < 0.05) {
                // Further reduced from 0.1 to 0.05
                // Only add smoke if we're not at particle capacity
                if (
                  this.particles.trailParticles.length <
                  this.particles.maxTrailParticles * 0.8
                ) {
                  this.particles.addTrail(
                    enemy.position.x +
                      s * 0.3 * Math.cos(enemy.rotation + Math.PI * 0.5),
                    enemy.position.y +
                      s * 0.3 * Math.sin(enemy.rotation + Math.PI * 0.5),
                    "#888", // Smoke
                    1.5 + Math.random() * 1.5 // Smaller smoke
                  );
                }
              }

              // Flickering damage light - reduce frequency to improve performance
              if (Math.random() < 0.1) {
                // Further reduced from 0.2 to 0.1
                this.ctx.fillStyle = "#ff0";
                this.ctx.beginPath();
                this.ctx.arc(-s * 0.5, s * 0.2, s * 0.05, 0, Math.PI * 2);
                this.ctx.fill();
              }
            }
          }
        }
      } else if (enemy.type === "seeker") {
        // Seeker ship (inspired by Delta-7 Jedi Starfighter / Arrow design from image)
        const s = enemy.size * 0.9;

        // Main body with color
        this.ctx.fillStyle = enemy.color;
        this.ctx.beginPath();
        this.ctx.moveTo(s * 2, 0); // Nose
        this.ctx.lineTo(s * 0.7, s * 0.7); // Right side
        this.ctx.lineTo(-s * 0.5, s * 0.7); // Back right
        this.ctx.lineTo(-s * 1, 0); // Back center
        this.ctx.lineTo(-s * 0.5, -s * 0.7); // Back left
        this.ctx.lineTo(s * 0.7, -s * 0.7); // Left side
        this.ctx.closePath();
        this.ctx.fill();

        // Central line detail
        this.ctx.fillStyle = "#fff";
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillRect(-s * 0.3, -s * 0.1, s * 2, s * 0.2);

        // Engine glow (simplified)
        this.ctx.globalAlpha = 0.8;
        this.ctx.fillStyle = "#ff6a00";
        this.ctx.beginPath();
        this.ctx.arc(-s * 0.8, 0, s * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (enemy.type === "wanderer") {
        // Wanderer ship (simplified TIE fighter variant)
        const s = enemy.size * 0.9;

        // Wing panels (simpler, with color)
        this.ctx.fillStyle = enemy.color;

        // Left wing
        this.ctx.beginPath();
        this.ctx.moveTo(-s * 0.3, -s * 0.3);
        this.ctx.lineTo(-s * 2, -s * 1.5);
        this.ctx.lineTo(-s * 2, s * 1.5);
        this.ctx.lineTo(-s * 0.3, s * 0.3);
        this.ctx.closePath();
        this.ctx.fill();

        // Right wing
        this.ctx.beginPath();
        this.ctx.moveTo(s * 0.3, -s * 0.3);
        this.ctx.lineTo(s * 2, -s * 1.5);
        this.ctx.lineTo(s * 2, s * 1.5);
        this.ctx.lineTo(s * 0.3, s * 0.3);
        this.ctx.closePath();
        this.ctx.fill();

        // Center pod
        this.ctx.fillStyle = "#333";
        this.ctx.beginPath();
        this.ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
        this.ctx.fill();

        // Single line structure (simplified)
        this.ctx.strokeStyle = "#fff";
        this.ctx.globalAlpha = 0.5;
        this.ctx.lineWidth = s * 0.1;
        this.ctx.beginPath();
        this.ctx.moveTo(-s * 2, 0);
        this.ctx.lineTo(s * 2, 0);
        this.ctx.stroke();
      } else if (enemy.type === "spinner") {
        // Spinner ship (simplified Y-Wing/ARC-170 fighter)
        const s = enemy.size * 0.9;

        // Main body
        this.ctx.fillStyle = "#ddd";
        this.ctx.beginPath();
        this.ctx.moveTo(s * 1.5, 0); // Nose
        this.ctx.lineTo(s * 0.8, s * 0.4);
        this.ctx.lineTo(-s * 1.2, s * 0.4);
        this.ctx.lineTo(-s * 1.5, 0);
        this.ctx.lineTo(-s * 1.2, -s * 0.4);
        this.ctx.lineTo(s * 0.8, -s * 0.4);
        this.ctx.closePath();
        this.ctx.fill();

        // Twin engines with color
        this.ctx.fillStyle = enemy.color;
        // Combined engines as one shape
        this.ctx.beginPath();
        this.ctx.rect(-s * 1.2, -s * 1.2, s * 0.8, s * 0.6);
        this.ctx.rect(-s * 1.2, s * 0.6, s * 0.8, s * 0.6);
        this.ctx.fill();

        // Simple engine glow
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = "#ff6a00";
        this.ctx.beginPath();
        this.ctx.arc(-s * 1.2, -s * 0.9, s * 0.3, 0, Math.PI * 2);
        this.ctx.arc(-s * 1.2, s * 0.9, s * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Cockpit
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = "#6ac5fe";
        this.ctx.beginPath();
        this.ctx.ellipse(s * 0, 0, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Default fallback: simple ship shape
        this.ctx.fillStyle = enemy.color;
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.size * 1.5, 0);
        this.ctx.lineTo(-enemy.size, enemy.size);
        this.ctx.lineTo(-enemy.size, -enemy.size);
        this.ctx.closePath();
        this.ctx.fill();
      }

      // Add glow effect for all ships after drawing ship details
      // This is more efficient than multiple separate glow operations
      this.ctx.globalAlpha = 0.3;
      const glow = createGlow(
        this.ctx,
        0,
        0,
        enemy.size * 1.5,
        enemy.color,
        0.3
      );
      if (glow) {
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, enemy.size * 1.8, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  // Spawn a new enemy
  spawn() {
    const types = ["seeker", "wanderer", "spinner"];
    const type = types[randomInt(0, types.length - 1)];

    let position;
    // Spawn outside the canvas
    const side = randomInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left

    switch (side) {
      case 0: // Top
        position = new Vector(random(0, this.canvas.width), -50);
        break;
      case 1: // Right
        position = new Vector(
          this.canvas.width + 50,
          random(0, this.canvas.height)
        );
        break;
      case 2: // Bottom
        position = new Vector(
          random(0, this.canvas.width),
          this.canvas.height + 50
        );
        break;
      case 3: // Left
        position = new Vector(-50, random(0, this.canvas.height));
        break;
    }

    // Create different enemy types
    let enemy;
    const color = randomColor();

    switch (type) {
      case "seeker":
        enemy = this.createSeeker(position, color);
        break;
      case "wanderer":
        enemy = this.createWanderer(position, color);
        break;
      case "spinner":
        enemy = this.createSpinner(position, color);
        break;
      default:
        enemy = this.createSeeker(position, color);
    }

    this.enemies.push(enemy);
  }

  // Create a seeker enemy (aggressively follows player)
  createSeeker(position, color) {
    const enemy = {
      type: "seeker",
      position,
      velocity: new Vector(0, 0),
      size: 10,
      color,
      speed: random(1, 2),
      rotation: 0,
      value: 100,
      shootTimer: 0,
      shootDelay: randomInt(100, 160), // Frames between shots
      update: () => {
        // Calculate direction to player
        const direction = Math.atan2(
          this.player.position.y - enemy.position.y,
          this.player.position.x - enemy.position.x
        );

        // Set rotation to face player
        enemy.rotation = direction;

        // Accelerate toward player
        enemy.velocity.x += Math.cos(direction) * 0.1;
        enemy.velocity.y += Math.sin(direction) * 0.1;

        // Limit speed
        const maxSpeed = enemy.speed;
        const currentSpeed = Math.sqrt(
          enemy.velocity.x * enemy.velocity.x +
            enemy.velocity.y * enemy.velocity.y
        );

        if (currentSpeed > maxSpeed) {
          enemy.velocity.x = (enemy.velocity.x / currentSpeed) * maxSpeed;
          enemy.velocity.y = (enemy.velocity.y / currentSpeed) * maxSpeed;
        }

        // Update position
        enemy.position.add(enemy.velocity);

        // Only shoot if close enough to player and timer is ready
        const distanceToPlayer = Math.sqrt(
          Math.pow(this.player.position.x - enemy.position.x, 2) +
            Math.pow(this.player.position.y - enemy.position.y, 2)
        );

        // Update shoot timer
        enemy.shootTimer++;

        // Shoot if timer reached and in range (and player is alive)
        if (
          enemy.shootTimer >= enemy.shootDelay &&
          distanceToPlayer < 400 &&
          this.player.alive
        ) {
          this.fireProjectile(enemy, 5, 4);
          enemy.shootTimer = 0;
          enemy.shootDelay = randomInt(100, 160); // Randomize next shot time
        }
      },
    };

    return enemy;
  }

  // Create a wanderer enemy (moves randomly)
  createWanderer(position, color) {
    const enemy = {
      type: "wanderer",
      position,
      velocity: new Vector(random(-1, 1), random(-1, 1)),
      size: 15,
      color,
      speed: random(0.5, 1.5),
      directionTimer: 0,
      directionChangeInterval: randomInt(60, 120),
      shootTimer: 0,
      shootDelay: randomInt(180, 300), // Less frequent shooting
      value: 50,
      update: () => {
        // Occasionally change direction
        enemy.directionTimer++;
        if (enemy.directionTimer >= enemy.directionChangeInterval) {
          enemy.velocity.x = random(-1, 1);
          enemy.velocity.y = random(-1, 1);
          enemy.directionTimer = 0;
          enemy.directionChangeInterval = randomInt(60, 120);
        }

        // Normalize and scale velocity
        const magnitude = Math.sqrt(
          enemy.velocity.x * enemy.velocity.x +
            enemy.velocity.y * enemy.velocity.y
        );

        if (magnitude > 0) {
          enemy.velocity.x = (enemy.velocity.x / magnitude) * enemy.speed;
          enemy.velocity.y = (enemy.velocity.y / magnitude) * enemy.speed;
        }

        // Update position
        enemy.position.add(enemy.velocity);

        // Bounce off edges
        if (enemy.position.x < 0 || enemy.position.x > this.canvas.width) {
          enemy.velocity.x *= -1;
        }

        if (enemy.position.y < 0 || enemy.position.y > this.canvas.height) {
          enemy.velocity.y *= -1;
        }

        // Set rotation to match movement direction
        if (magnitude > 0) {
          enemy.rotation = Math.atan2(enemy.velocity.y, enemy.velocity.x);
        }

        // Update shoot timer
        enemy.shootTimer++;

        // Shoot randomly (wanderers are unpredictable)
        if (
          enemy.shootTimer >= enemy.shootDelay &&
          Math.random() < 0.7 && // 70% chance to fire when ready
          this.player.alive
        ) {
          this.fireProjectile(enemy, 3, 5); // Slower but larger projectiles
          enemy.shootTimer = 0;
          enemy.shootDelay = randomInt(180, 300);
        }
      },
    };

    return enemy;
  }

  // Create a spinner enemy (orbits and shoots)
  createSpinner(position, color) {
    const enemy = {
      type: "spinner",
      position,
      velocity: new Vector(0, 0),
      size: 12,
      color,
      speed: random(2, 3),
      rotation: 0,
      rotationSpeed: random(0.02, 0.05) * (Math.random() > 0.5 ? 1 : -1),
      orbitRadius: random(100, 200),
      orbitAngle: random(0, Math.PI * 2),
      orbitSpeed: random(0.01, 0.02),
      targetPosition: new Vector(
        random(100, this.canvas.width - 100),
        random(100, this.canvas.height - 100)
      ),
      shootTimer: 0,
      shootDelay: randomInt(60, 120), // Faster firing rate
      burstCount: 0, // For burst fire pattern
      burstSize: 3, // Number of shots in a burst
      burstDelay: 10, // Frames between burst shots
      value: 150,
      update: () => {
        // Update orbit angle
        enemy.orbitAngle += enemy.orbitSpeed;

        // Calculate orbit position
        const targetX =
          enemy.targetPosition.x +
          Math.cos(enemy.orbitAngle) * enemy.orbitRadius;
        const targetY =
          enemy.targetPosition.y +
          Math.sin(enemy.orbitAngle) * enemy.orbitRadius;

        // Move toward orbit position
        const dx = targetX - enemy.position.x;
        const dy = targetY - enemy.position.y;

        enemy.velocity.x = dx * 0.05;
        enemy.velocity.y = dy * 0.05;

        // Update position
        enemy.position.add(enemy.velocity);

        // Update rotation for spinning effect
        enemy.rotation += enemy.rotationSpeed;

        // Occasionally move orbit center
        if (Math.random() < 0.005) {
          enemy.targetPosition = new Vector(
            random(100, this.canvas.width - 100),
            random(100, this.canvas.height - 100)
          );
        }

        // Determine direction to player for shooting (independent of rotation)
        const directionToPlayer = Math.atan2(
          this.player.position.y - enemy.position.y,
          this.player.position.x - enemy.position.x
        );

        // Update shoot timer
        enemy.shootTimer++;

        // Spinners use burst fire
        if (enemy.burstCount > 0 && enemy.shootTimer >= enemy.burstDelay) {
          // Fire the next shot in the burst
          this.fireProjectile(enemy, 7, 3); // Fast, smaller projectiles
          enemy.burstCount--;
          enemy.shootTimer = 0;
        } else if (
          enemy.burstCount === 0 &&
          enemy.shootTimer >= enemy.shootDelay &&
          this.player.alive
        ) {
          // Start a new burst
          this.fireProjectile(enemy, 7, 3);
          enemy.burstCount = enemy.burstSize - 1; // Already fired first shot
          enemy.shootTimer = 0;
          enemy.shootDelay = randomInt(60, 120); // Refresh delay for next burst
        }
      },
    };

    return enemy;
  }

  // Destroy an enemy and add score
  destroyEnemy(enemy, index) {
    // Create explosion effect - use smaller explosion for boss to prevent lag
    if (enemy.isBoss) {
      // For boss, create a more optimized explosion with fewer particles
      const explosionSize = Math.min(
        30,
        Math.floor(this.particles.maxParticles / 10)
      );

      // Create main explosion with fewer particles
      this.particles.createExplosion(
        enemy.position.x,
        enemy.position.y,
        explosionSize,
        enemy.color,
        3,
        3,
        0.03
      );

      // Add debris with limited count
      this.particles.createDebris(
        enemy.position.x,
        enemy.position.y,
        3, // Fewer debris pieces
        enemy.color,
        3
      );

      // Set boss inactive
      this.bossActive = false;
    } else {
      // Regular enemies - normal explosion
      this.particles.createExplosion(
        enemy.position.x,
        enemy.position.y,
        30,
        enemy.color,
        3,
        3,
        0.03
      );

      // Create debris
      this.particles.createDebris(
        enemy.position.x,
        enemy.position.y,
        5,
        enemy.color,
        3
      );
    }

    // Grid distortion removed to prevent background movement
    // this.grid.addDistortion(enemy.position.x, enemy.position.y, 0.5, 0.01);

    // Add score based on enemy type
    this.updateScore(enemy);

    // Remove enemy
    this.enemies.splice(index, 1);
  }

  // Update score when enemy is destroyed
  updateScore(enemy) {
    // Get base score value
    let points = enemy.value || 100;

    // Apply score multiplier
    points *= this.scoreMultiplier;

    // Update total score
    this.score += points;

    // Create score text effect
    this.particles.createScoreText(
      enemy.position.x,
      enemy.position.y - 20,
      points.toString(),
      enemy.color
    );

    // Update combo
    this.combo++;
    this.comboTimer = 120; // 2 seconds at 60fps

    // Update multiplier based on combo
    if (this.combo >= 10) {
      this.scoreMultiplier = 4;
      this.multiplierTimer = 300; // 5 seconds
    } else if (this.combo >= 5) {
      this.scoreMultiplier = 2;
      this.multiplierTimer = 300; // 5 seconds
    }
  }

  // Increase difficulty over time
  increaseDifficulty() {
    if (this.spawnRate > 30) {
      this.spawnRate -= 1;
    }

    if (this.maxEnemies < 50) {
      this.maxEnemies += 1;
    }
  }

  // Reset enemies for a new game
  reset() {
    this.enemies = [];
    this.enemyProjectiles = [];
    this.spawnTimer = 0;
    this.spawnRate = 120;
    this.difficultyTimer = 0;
    this.score = 0;
    this.scoreMultiplier = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.multiplierTimer = 0;
    this.bossActive = false;
    this.bossTimer = this.bossSpawnThreshold;
  }

  // Get current score
  getScore() {
    return this.score;
  }

  // Get current combo and multiplier
  getCombo() {
    return {
      combo: this.combo,
      multiplier: this.scoreMultiplier,
    };
  }

  // Spawn a boss enemy
  spawnBoss() {
    // Only spawn if no boss is active
    if (this.bossActive) return;

    this.bossActive = true;

    // Spawn from the top of the screen
    const position = new Vector(this.canvas.width / 2, -100);

    // Create the boss
    const boss = this.createBoss(position);
    this.enemies.push(boss);
  }

  // Create a boss enemy (large ship with multiple hit points)
  createBoss(position) {
    // Use a fixed color for boss to avoid randomColor() performance impact
    const color = "#a0b4c8"; // Light bluish-gray to match current design

    const boss = {
      type: "boss",
      isBoss: true,
      position,
      velocity: new Vector(0, 0),
      size: 45, // Much larger than normal enemies
      color,
      health: 20, // Takes 20 hits to destroy
      maxHealth: 20,
      speed: 1.5,
      rotation: 0,
      value: 1000, // High score value
      attackPhase: 0,
      phaseTimer: 0,
      shotTimer: 0,
      shotDelay: 20, // Increased from 10 to 20 (50% slower fire rate)
      burstCount: 0,
      burstSize: 5,
      lastHitTime: 0, // Track last hit time for performance optimization
      lastScoreTime: 0, // Track last score display time
      targetPosition: new Vector(this.canvas.width / 2, this.canvas.height / 4),
      // Pre-calculate some values to improve performance
      phaseTimerCoefficient: 0.05,
      update: () => {
        // Movement pattern: enter screen, stop at 1/4 height, then strafe left-right
        const targetY = this.canvas.height / 4;

        if (boss.position.y < targetY) {
          // Entering phase - move down until reaching target height
          boss.velocity.y = boss.speed;
        } else {
          // Battle phase - strafe horizontally
          boss.velocity.y = 0;

          // Update phase timer
          boss.phaseTimer++;

          // Change direction/pattern every few seconds
          if (boss.phaseTimer > 180) {
            // 3 seconds
            boss.attackPhase = (boss.attackPhase + 1) % 4;
            boss.phaseTimer = 0;
          }

          switch (boss.attackPhase) {
            case 0: // Move right
              boss.velocity.x = boss.speed;
              break;
            case 1: // Move left
              boss.velocity.x = -boss.speed;
              break;
            case 2: // Circular pattern
              boss.velocity.x =
                Math.cos(boss.phaseTimer * boss.phaseTimerCoefficient) *
                boss.speed *
                1.5;
              boss.velocity.y =
                Math.sin(boss.phaseTimer * boss.phaseTimerCoefficient) *
                boss.speed;
              break;
            case 3: // Hold position for heavy attack
              boss.velocity.x = 0;
              boss.velocity.y = 0;
              break;
          }

          // Screen boundary check
          if (boss.position.x < boss.size) {
            boss.position.x = boss.size;
            boss.velocity.x = Math.abs(boss.velocity.x);
          } else if (boss.position.x > this.canvas.width - boss.size) {
            boss.position.x = this.canvas.width - boss.size;
            boss.velocity.x = -Math.abs(boss.velocity.x);
          }

          if (boss.position.y < boss.size) {
            boss.position.y = boss.size;
            boss.velocity.y = Math.abs(boss.velocity.y);
          } else if (boss.position.y > this.canvas.height / 2) {
            boss.position.y = this.canvas.height / 2;
            boss.velocity.y = -Math.abs(boss.velocity.y);
          }
        }

        // Update position
        boss.position.add(boss.velocity);

        // Update rotation for visual effect (slower rotation)
        boss.rotation += 0.003; // Reduced from 0.005

        // Attack patterns based on health percentage
        boss.shotTimer++;
        const healthPercent = boss.health / boss.maxHealth;

        if (boss.shotTimer >= boss.shotDelay) {
          // Different attack patterns based on health and attack phase
          if (healthPercent < 0.3 && boss.attackPhase === 3) {
            // Desperate attack when low health - circle of projectiles
            this.fireCircleAttack(boss, 15, 5);
            boss.shotTimer = 0;
            boss.shotDelay = 120; // Doubled from 60 to 120 (50% slower rate)
          } else if (healthPercent < 0.6 && boss.attackPhase === 3) {
            // Mid-health special attack - 3-way spread
            for (let i = -1; i <= 1; i++) {
              const angle =
                Math.atan2(
                  this.player.position.y - boss.position.y,
                  this.player.position.x - boss.position.x
                ) +
                i * 0.2; // Spread angle

              this.fireProjectileAngle(boss, angle, 6, 5, "#f00");
            }
            boss.shotTimer = 0;
            // Add a delay after the spread shot
            boss.shotDelay = 40; // New delay to avoid immediate firing after spread
          } else {
            // Basic attacks
            // Target the player
            const angle = Math.atan2(
              this.player.position.y - boss.position.y,
              this.player.position.x - boss.position.x
            );

            // Fire a projectile
            this.fireProjectileAngle(boss, angle, 6, 5, "#f00");
            boss.shotTimer = 0;

            // Adjust shot delay based on health (faster when damaged, but still 50% slower than original)
            boss.shotDelay = Math.max(10, Math.floor(40 * healthPercent)); // Doubled from 5/20 to 10/40
          }
        }
      },
    };

    return boss;
  }

  // Fire projectile at a specific angle (helper for boss patterns)
  fireProjectileAngle(enemy, angle, speed, size, color) {
    const projectile = {
      position: new Vector(enemy.position.x, enemy.position.y),
      velocity: new Vector(Math.cos(angle) * speed, Math.sin(angle) * speed),
      size: size || 4,
      color: color || "#f00", // Red projectiles
    };

    this.enemyProjectiles.push(projectile);
  }

  // Fire projectiles in a circle pattern (for boss)
  fireCircleAttack(enemy, count, speed) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.fireProjectileAngle(enemy, angle, speed, 5, "#ff0");
    }
  }
}
