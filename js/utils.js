// Utility functions for the game

// Random number between min and max (inclusive)
const random = (min, max) => Math.random() * (max - min) + min;

// Random integer between min and max (inclusive)
const randomInt = (min, max) => Math.floor(random(min, max + 1));

// Random color generator
const randomColor = () => {
  const colors = ["#ff0", "#0ff", "#f0f", "#0f0", "#f00", "#00f"];
  return colors[randomInt(0, colors.length - 1)];
};

// Vector class for position, velocity, and acceleration calculations
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  // Add another vector to this vector
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  // Subtract another vector from this vector
  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  // Multiply this vector by a scalar
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  // Divide this vector by a scalar
  divide(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  // Get the magnitude (length) of this vector
  getMagnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Set the magnitude of this vector
  setMagnitude(magnitude) {
    const direction = this.getDirection();
    this.x = Math.cos(direction) * magnitude;
    this.y = Math.sin(direction) * magnitude;
    return this;
  }

  // Get the direction (angle) of this vector in radians
  getDirection() {
    return Math.atan2(this.y, this.x);
  }

  // Set the direction of this vector
  setDirection(direction) {
    const magnitude = this.getMagnitude();
    this.x = Math.cos(direction) * magnitude;
    this.y = Math.sin(direction) * magnitude;
    return this;
  }

  // Normalize this vector (make its magnitude 1)
  normalize() {
    const magnitude = this.getMagnitude();
    if (magnitude !== 0) {
      this.divide(magnitude);
    }
    return this;
  }

  // Limit the magnitude of this vector
  limit(max) {
    if (this.getMagnitude() > max) {
      this.normalize();
      this.multiply(max);
    }
    return this;
  }

  // Create a copy of this vector
  copy() {
    return new Vector(this.x, this.y);
  }

  // Calculate distance between this vector and another vector
  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Calculate direction from this vector to another vector
  directionTo(v) {
    const dx = v.x - this.x;
    const dy = v.y - this.y;
    return Math.atan2(dy, dx);
  }
}

// Calculate distance between two points
const distance = (x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

// Check collision between two circles
const circleCollision = (x1, y1, r1, x2, y2, r2) => {
  return distance(x1, y1, x2, y2) < r1 + r2;
};

// Clamp a value between min and max
const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

// Lerp (linear interpolation) between two values
const lerp = (start, end, amount) => {
  return start + (end - start) * amount;
};

// Color utilities
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Create a glowing effect for rendering
const createGlow = (ctx, x, y, radius, color, alpha = 1) => {
  const rgb = hexToRgb(color);
  if (!rgb) return;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
  gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
  gradient.addColorStop(
    0.5,
    `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.5})`
  );
  gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

  return gradient;
};
