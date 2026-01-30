/**
 * Realistic skate park obstacle geometry
 * Based on real-world fingerboard park dimensions and angles
 */

export interface ShapePoints {
  path: string; // SVG path or Konva points
  type: 'svg' | 'polygon';
  points?: number[]; // For Konva polygon
}

/**
 * Generate quarter pipe shape with proper transition curve
 * @param width - Width in pixels
 * @param height - Height in pixels (ramp height)
 * @param length - Length/depth in pixels
 */
export function generateQuarterPipeShape(width: number, height: number, length: number): ShapePoints {
  // Quarter pipe has a curved transition (not a straight ramp)
  // Use an arc based on real skate park geometry
  // Typical: 7-foot radius for 4-foot height = 1.75:1 ratio
  
  const radius = height * 1.75;
  
  // Generate arc points for smooth curve
  const points: number[] = [];
  const segments = 20; // Smooth curve
  
  // Start at bottom left
  points.push(0, height);
  
  // Create transition curve
  for (let i = 0; i <= segments; i++) {
    const angle = (Math.PI / 2) * (i / segments); // 0 to 90 degrees
    const x = length - radius + radius * Math.cos(angle);
    const y = height - radius * Math.sin(angle);
    points.push(x, y);
  }
  
  // Complete the shape back to start
  points.push(length, height); // Bottom right
  points.push(0, height); // Back to bottom left
  
  return {
    type: 'polygon',
    points,
    path: '', // Not used for polygon
  };
}

/**
 * Generate bank ramp (angled incline)
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param length - Length in pixels
 */
export function generateBankRampShape(width: number, height: number, length: number): ShapePoints {
  // Simple angled ramp - straight incline
  const points = [
    0, height,     // Bottom left
    length, 0,     // Top right
    length, height, // Bottom right
    0, height      // Back to start
  ];
  
  return {
    type: 'polygon',
    points,
    path: '',
  };
}

/**
 * Generate launch ramp (kicker)
 * @param width - Width in pixels
 * @param height - Height in pixels (exit height)
 * @param length - Length in pixels
 */
export function generateLaunchRampShape(width: number, height: number, length: number): ShapePoints {
  // Launch ramp with steeper angle (typically 30-45 degrees)
  // Has a slight curve at the top for launch
  
  const curveStart = length * 0.7; // Start curve at 70% of length
  const points: number[] = [];
  
  // Bottom
  points.push(0, height);
  
  // Straight incline
  points.push(curveStart, height * 0.3);
  
  // Curved launch section
  const segments = 10;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = curveStart + (length - curveStart) * t;
    const y = height * 0.3 * (1 - t * t); // Quadratic curve for launch
    points.push(x, y);
  }
  
  // Complete shape
  points.push(length, height);
  points.push(0, height);
  
  return {
    type: 'polygon',
    points,
    path: '',
  };
}

/**
 * Generate half pipe shape (double quarter pipe)
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param length - Length in pixels (total span)
 */
export function generateHalfPipeShape(width: number, height: number, length: number): ShapePoints {
  const radius = height * 1.75;
  const midpoint = length / 2;
  const points: number[] = [];
  const segments = 20;
  
  // Left quarter pipe (upward curve)
  for (let i = 0; i <= segments; i++) {
    const angle = Math.PI + (Math.PI / 2) * (i / segments); // 180 to 270 degrees
    const x = radius + radius * Math.cos(angle);
    const y = height - radius * Math.sin(angle);
    points.push(x, y);
  }
  
  // Flat bottom
  points.push(midpoint - radius, height);
  points.push(midpoint + radius, height);
  
  // Right quarter pipe (upward curve)
  for (let i = 0; i <= segments; i++) {
    const angle = (3 * Math.PI / 2) - (Math.PI / 2) * (i / segments); // 270 to 180 degrees
    const x = length - radius + radius * Math.cos(angle);
    const y = height - radius * Math.sin(angle);
    points.push(x, y);
  }
  
  return {
    type: 'polygon',
    points,
    path: '',
  };
}

/**
 * Generate pyramid shape (four-sided ramp)
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param length - Length in pixels
 */
export function generatePyramidShape(width: number, height: number, length: number): ShapePoints {
  // Top-down view of pyramid - diamond shape
  const halfWidth = width / 2;
  const halfLength = length / 2;
  
  const points = [
    halfLength, 0,           // Top point
    length, halfWidth,       // Right point
    halfLength, width,       // Bottom point
    0, halfWidth,            // Left point
    halfLength, 0,           // Back to top
  ];
  
  return {
    type: 'polygon',
    points,
    path: '',
  };
}

/**
 * Generate rail shape (thin rectangle with rounded ends)
 * @param width - Width in pixels
 * @param length - Length in pixels
 */
export function generateRailShape(width: number, length: number): ShapePoints {
  // Simple rounded rectangle for rail
  const radius = Math.min(width / 2, 5); // Cap at 5px radius
  
  const points = [
    radius, 0,
    length - radius, 0,
    length, radius,
    length, width - radius,
    length - radius, width,
    radius, width,
    0, width - radius,
    0, radius,
    radius, 0,
  ];
  
  return {
    type: 'polygon',
    points,
    path: '',
  };
}

/**
 * Generate stairs shape (stepped)
 * @param width - Width in pixels
 * @param height - Height in pixels (total height)
 * @param length - Length in pixels
 * @param steps - Number of steps
 */
export function generateStairsShape(width: number, height: number, length: number, steps: number = 3): ShapePoints {
  const stepHeight = height / steps;
  const stepLength = length / steps;
  const points: number[] = [];
  
  // Start at bottom left
  points.push(0, height);
  
  // Create steps from bottom to top
  for (let i = 0; i < steps; i++) {
    const x = i * stepLength;
    const y = height - (i + 1) * stepHeight;
    
    // Vertical rise
    points.push(x, y);
    // Horizontal tread
    points.push(x + stepLength, y);
  }
  
  // Complete the shape
  points.push(length, 0); // Top right
  points.push(length, height); // Bottom right
  points.push(0, height); // Back to start
  
  return {
    type: 'polygon',
    points,
    path: '',
  };
}

/**
 * Get shape generator for obstacle subtype
 */
export function getShapeForObstacle(
  subtype: string,
  width: number,
  height: number,
  length: number
): ShapePoints | null {
  switch (subtype) {
    case 'quarter-pipe':
      return generateQuarterPipeShape(width, height, length);
    
    case 'bank-ramp':
      return generateBankRampShape(width, height, length);
    
    case 'launch-ramp':
      return generateLaunchRampShape(width, height, length);
    
    case 'half-pipe':
      return generateHalfPipeShape(width, height, length);
    
    case 'pyramid':
      return generatePyramidShape(width, height, length);
    
    case 'flat-rail':
    case 'round-rail':
    case 'kinked-rail':
      return generateRailShape(width, length);
    
    case 'stair-set':
      return generateStairsShape(width, height, length, 3);
    
    default:
      return null; // Use default rectangle
  }
}
