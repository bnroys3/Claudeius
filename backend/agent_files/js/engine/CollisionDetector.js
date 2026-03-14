/**
 * Collision Detection System for Neon Runner
 * Handles all collision detection with optimized algorithms
 */
export class CollisionDetector {
  
  /**
   * Check collision between two rectangular objects
   */
  static checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  /**
   * Check collision between two circular objects
   */
  static checkCircleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.radius + circle2.radius);
  }
  
  /**
   * Check collision between circle and rectangle
   */
  static checkCircleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
  }
  
  /**
   * Check if object is within canvas boundaries
   */
  static checkBoundaries(object, canvasWidth, canvasHeight) {
    const bounds = {
      left: object.x < 0,
      right: object.x + object.width > canvasWidth,
      top: object.y < 0,
      bottom: object.y + object.height > canvasHeight
    };
    
    return {
      isOutOfBounds: bounds.left || bounds.right || bounds.top || bounds.bottom,
      ...bounds
    };
  }
  
  /**
   * Get collision info with detailed data
   */
  static getCollisionInfo(obj1, obj2) {
    if (!this.checkRectCollision(obj1, obj2)) {
      return null;
    }
    
    // Calculate overlap amounts
    const overlapX = Math.min(obj1.x + obj1.width - obj2.x, obj2.x + obj2.width - obj1.x);
    const overlapY = Math.min(obj1.y + obj1.height - obj2.y, obj2.y + obj2.height - obj1.y);
    
    // Determine collision direction
    let direction = 'none';
    if (overlapX < overlapY) {
      direction = obj1.x < obj2.x ? 'right' : 'left';
    } else {
      direction = obj1.y < obj2.y ? 'down' : 'up';
    }
    
    return {
      hasCollision: true,
      overlapX,
      overlapY,
      direction
    };
  }
  
  /**
   * Spatial partitioning for performance optimization
   * Divide the game world into grid cells for efficient collision detection
   */
  static createSpatialGrid(objects, cellSize = 100) {
    const grid = new Map();
    
    objects.forEach(obj => {
      const cellX = Math.floor(obj.x / cellSize);
      const cellY = Math.floor(obj.y / cellSize);
      const key = `${cellX},${cellY}`;
      
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key).push(obj);
    });
    
    return grid;
  }
  
  /**
   * Get potential collision candidates using spatial partitioning
   */
  static getPotentialCollisions(object, grid, cellSize = 100) {
    const candidates = [];
    const cellX = Math.floor(object.x / cellSize);
    const cellY = Math.floor(object.y / cellSize);
    
    // Check surrounding cells
    for (let x = cellX - 1; x <= cellX + 1; x++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) {
        const key = `${x},${y}`;
        if (grid.has(key)) {
          candidates.push(...grid.get(key));
        }
      }
    }
    
    return candidates;
  }
}