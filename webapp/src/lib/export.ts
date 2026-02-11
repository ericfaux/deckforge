import { CanvasObject } from '@/store/deckforge';
import { generateArcPath, generateWarpPath, pathPointsToSvgPath, hasTextWarp } from '@/lib/text-warp';
import { buildStrokePath, buildVariableWidthPath } from '@/components/deckforge/BrushTool';
import { iconMap } from '@/lib/icon-map';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

// Default deck dimensions (32mm standard size)
const DEFAULT_DECK_WIDTH = 96;
const DEFAULT_DECK_HEIGHT = 294;

export interface BackgroundGradientData {
  startColor: string;
  endColor: string;
  direction: 'linear' | 'radial';
  angle: number;
}

/**
 * Export canvas to high-resolution PNG
 * Uses HTML5 Canvas API to render all objects at high DPI
 */
export async function exportToPNG(
  objects: CanvasObject[],
  options: {
    scale?: number; // DPI scale (2 = 2x, 3 = 3x)
    format?: 'png' | 'jpeg';
    quality?: number; // 0-1 for JPEG quality
    includeBackground?: boolean;
    width?: number; // Custom deck width
    height?: number; // Custom deck height
    backgroundColor?: string;
    backgroundFillType?: 'solid' | 'gradient' | 'linear-gradient' | 'radial-gradient';
    backgroundGradient?: BackgroundGradientData;
  } = {}
): Promise<Blob> {
  const {
    scale = 3, // 3x for print quality
    format = 'png',
    quality = 0.95,
    includeBackground = true,
    width = DEFAULT_DECK_WIDTH,
    height = DEFAULT_DECK_HEIGHT,
    backgroundColor = '#ffffff',
    backgroundFillType = 'solid',
    backgroundGradient,
  } = options;

  // Create offscreen canvas at high resolution
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size (deck dimensions * scale for high DPI)
  canvas.width = width * scale;
  canvas.height = height * scale;

  // Scale context for high DPI
  ctx.scale(scale, scale);

  // Background (print-ready)
  if (includeBackground) {
    if ((backgroundFillType === 'gradient' || backgroundFillType === 'linear-gradient' || backgroundFillType === 'radial-gradient') && backgroundGradient) {
      let gradient: CanvasGradient;
      if (backgroundGradient.direction === 'radial' || backgroundFillType === 'radial-gradient') {
        const cx = (backgroundGradient.centerX ?? 0.5) * width;
        const cy = (backgroundGradient.centerY ?? 0.5) * height;
        const r = (backgroundGradient.radius ?? 0.5) * Math.max(width, height);
        gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      } else {
        const angle = backgroundGradient.angle * Math.PI / 180;
        const cx = width / 2;
        const cy = height / 2;
        const len = Math.max(width, height);
        const x1 = cx - Math.cos(angle) * len / 2;
        const y1 = cy - Math.sin(angle) * len / 2;
        const x2 = cx + Math.cos(angle) * len / 2;
        const y2 = cy + Math.sin(angle) * len / 2;
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      }
      // Use multi-stop gradient if available, fallback to start/end colors
      if (backgroundGradient.stops && backgroundGradient.stops.length > 0) {
        backgroundGradient.stops.forEach((stop: { offset: number; color: string }) => {
          gradient.addColorStop(stop.offset, stop.color);
        });
      } else {
        gradient.addColorStop(0, backgroundGradient.startColor);
        gradient.addColorStop(1, backgroundGradient.endColor);
      }
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = backgroundColor;
    }
    ctx.fillRect(0, 0, width, height);
  }

  // Render each object in order (bottom to top)
  for (const obj of objects) {
    await renderObject(ctx, obj, objects);
  }

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality
    );
  });
}

async function renderImage(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number,
  obj: CanvasObject
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Apply filters if any
      if (obj.contrast || obj.brightness || obj.grayscale || obj.threshold || obj.hueRotate || obj.invert) {
        ctx.filter = buildFilterString(obj);
      }

      ctx.drawImage(img, x, y, width, height);
      ctx.filter = 'none';
      resolve();
    };

    img.onerror = () => {
      console.error('Failed to load image:', src);
      // Draw placeholder
      ctx.fillStyle = '#cccccc';
      ctx.fillRect(x, y, width, height);
      resolve();
    };

    img.src = src;
  });
}

/**
 * Render a single object to the canvas context.
 * Handles all object types including groups (recursive).
 */
async function renderObject(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject,
  allObjects: CanvasObject[]
): Promise<void> {
  // Skip hidden objects
  if (obj.hidden) return;

  ctx.save();

  if (obj.type === 'group' && obj.children && obj.children.length > 0) {
    // Groups use origin-based transform (translate to obj.x/y, then rotate/scale)
    ctx.translate(obj.x, obj.y);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    ctx.scale(obj.scaleX, obj.scaleY);
    ctx.globalAlpha *= obj.opacity;

    if (obj.mixBlendMode && obj.mixBlendMode !== 'normal') {
      ctx.globalCompositeOperation = obj.mixBlendMode;
    }

    for (const child of obj.children) {
      await renderObject(ctx, child, allObjects);
    }
  } else if (obj.type === 'path' && obj.brushType) {
    // Brush strokes use absolute coordinates - apply rotation around center
    const centerX = obj.x + (obj.width * obj.scaleX) / 2;
    const centerY = obj.y + (obj.height * obj.scaleY) / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    ctx.globalAlpha *= obj.opacity;
    ctx.translate(-centerX, -centerY);

    await renderBrushStrokeCanvas(ctx, obj);
  } else if (obj.type === 'path' && obj.pathPoints && obj.pathPoints.length > 0) {
    // Pen tool paths use absolute coordinates - apply rotation around center
    const centerX = obj.x + (obj.width * obj.scaleX) / 2;
    const centerY = obj.y + (obj.height * obj.scaleY) / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    ctx.globalAlpha *= obj.opacity;
    ctx.translate(-centerX, -centerY);

    renderPenPath(ctx, obj);
  } else {
    // Standard center-based transform for image, text, shape, line, sticker, texture
    const centerX = obj.x + (obj.width * obj.scaleX) / 2;
    const centerY = obj.y + (obj.height * obj.scaleY) / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    ctx.globalAlpha *= obj.opacity;

    if (obj.blendMode && obj.blendMode !== 'normal') {
      ctx.globalCompositeOperation = obj.blendMode;
    }
    if (obj.mixBlendMode && obj.mixBlendMode !== 'normal') {
      ctx.globalCompositeOperation = obj.mixBlendMode;
    }

    const x = -(obj.width * obj.scaleX) / 2;
    const y = -(obj.height * obj.scaleY) / 2;
    const w = obj.width * obj.scaleX;
    const h = obj.height * obj.scaleY;

    if (obj.type === 'image' && obj.src) {
      await renderImage(ctx, obj.src, x, y, w, h, obj);
    } else if (obj.type === 'text' && obj.text) {
      renderText(ctx, obj.text, x, y, w, h, obj, allObjects);
    } else if (obj.type === 'shape') {
      renderShape(ctx, x, y, w, h, obj);
    } else if (obj.type === 'line') {
      renderLine(ctx, obj);
    } else if (obj.type === 'sticker' && obj.iconName) {
      await renderSticker(ctx, x, y, w, h, obj);
    } else if (obj.type === 'texture' && obj.textureUrl) {
      await renderTexture(ctx, x, y, w, h, obj);
    }
  }

  ctx.restore();
}

/**
 * Render a pen tool path (bezier curves) to Canvas 2D.
 * Path points are in absolute coordinates.
 */
function renderPenPath(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject
): void {
  if (!obj.pathPoints || obj.pathPoints.length === 0) return;

  ctx.beginPath();

  const p0 = obj.pathPoints[0];
  ctx.moveTo(p0.x, p0.y);

  for (let i = 1; i < obj.pathPoints.length; i++) {
    const point = obj.pathPoints[i];
    if (point.cp1x !== undefined && point.cp1y !== undefined) {
      if (point.cp2x !== undefined && point.cp2y !== undefined) {
        ctx.bezierCurveTo(
          point.cp1x, point.cp1y,
          point.cp2x, point.cp2y,
          point.x, point.y
        );
      } else {
        ctx.quadraticCurveTo(
          point.cp1x, point.cp1y,
          point.x, point.y
        );
      }
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }

  if (obj.pathClosed) {
    ctx.closePath();
    ctx.fillStyle = obj.fill || '#000000';
    ctx.fill();
  }

  if (obj.stroke) {
    ctx.strokeStyle = obj.stroke;
    ctx.lineWidth = obj.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Handle dash style
    const sw = obj.strokeWidth || 2;
    if (obj.strokeDashStyle === 'dashed') {
      ctx.setLineDash([sw * 4, sw * 3]);
    } else if (obj.strokeDashStyle === 'dotted') {
      ctx.setLineDash([sw * 0.5, sw * 2]);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/**
 * Render brush strokes (pencil, marker, calligraphy, spray) to Canvas 2D.
 * Points are in absolute coordinates (context already transformed).
 */
async function renderBrushStrokeCanvas(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject
): Promise<void> {
  const brushType = obj.brushType || 'pencil';
  const color = obj.stroke || '#ffffff';
  const size = obj.brushSize || 4;
  const points = obj.brushPoints || [];

  if (brushType === 'spray' && obj.sprayDots && obj.sprayDots.length > 0) {
    ctx.fillStyle = color;
    for (const dot of obj.sprayDots) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (brushType === 'calligraphy' && points.length >= 2) {
    const outlinePath = buildVariableWidthPath(points, size, true, 45);
    if (outlinePath) {
      const path2d = new Path2D(outlinePath);
      ctx.fillStyle = color;
      ctx.fill(path2d);
    }
    return;
  }

  if (brushType === 'marker') {
    const pts = obj.pathPoints?.length
      ? obj.pathPoints.map(p => ({ ...p, pressure: 0.5 }))
      : points;
    if (pts.length >= 2) {
      const pathD = buildStrokePath(pts);
      if (pathD) {
        const path2d = new Path2D(pathD);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha *= 0.6;
        ctx.stroke(path2d);
      }
    }
    return;
  }

  // Pencil (default)
  const hasPressure = points.length >= 2 && points.some(p => p.pressure !== 0.5);
  if (hasPressure && points.length >= 2) {
    const outlinePath = buildVariableWidthPath(points, size, true);
    if (outlinePath) {
      const path2d = new Path2D(outlinePath);
      ctx.fillStyle = color;
      ctx.fill(path2d);
    }
  } else {
    const pts = obj.pathPoints?.length
      ? obj.pathPoints.map(p => ({ ...p, pressure: 0.5 }))
      : points;
    if (pts.length >= 2) {
      const pathD = buildStrokePath(pts);
      if (pathD) {
        const path2d = new Path2D(pathD);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(path2d);
      }
    }
  }
}

/**
 * Render a Lucide icon sticker to Canvas 2D.
 * Converts the React icon component to SVG, then draws as image.
 */
async function renderSticker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  obj: CanvasObject
): Promise<void> {
  const IconComponent = iconMap[obj.iconName!];
  if (!IconComponent) return;

  const strokeW = obj.strokeWidth || 3;
  const strokeColor = obj.stroke || '#ffffff';
  const fillColor = obj.solidFill ? strokeColor : 'none';

  // Render icon component to SVG markup
  const svgMarkup = renderToStaticMarkup(
    createElement(IconComponent, {
      width: 24,
      height: 24,
      strokeWidth: strokeW,
      stroke: strokeColor,
      fill: fillColor,
    })
  );

  // Ensure SVG has namespace
  const svgString = svgMarkup.includes('xmlns')
    ? svgMarkup
    : svgMarkup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, width, height);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
}

/**
 * Render a texture image with blend mode to Canvas 2D.
 */
async function renderTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  obj: CanvasObject
): Promise<void> {
  if (!obj.textureUrl) return;

  // Apply blend mode for texture
  const blendMode = obj.blendMode || obj.mixBlendMode || 'multiply';
  if (blendMode && blendMode !== 'normal') {
    ctx.globalCompositeOperation = blendMode;
  }

  return new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, x, y, width, height);
      resolve();
    };
    img.onerror = () => {
      resolve();
    };
    img.src = obj.textureUrl!;
  });
}

/**
 * Sample points along an SVG path string for character placement.
 * Uses an offscreen SVG path element to get point positions.
 */
function samplePathPoints(pathData: string, numSamples: number): Array<{ x: number; y: number; angle: number }> {
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  const pathEl = document.createElementNS(svgNs, 'path');
  pathEl.setAttribute('d', pathData);
  svg.appendChild(pathEl);
  document.body.appendChild(svg);

  const totalLen = pathEl.getTotalLength();
  const points: Array<{ x: number; y: number; angle: number }> = [];

  for (let i = 0; i < numSamples; i++) {
    const dist = (i / Math.max(numSamples - 1, 1)) * totalLen;
    const pt = pathEl.getPointAtLength(dist);
    // Get tangent angle by sampling a nearby point
    const delta = 0.5;
    const ptNext = pathEl.getPointAtLength(Math.min(dist + delta, totalLen));
    const angle = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x);
    points.push({ x: pt.x, y: pt.y, angle });
  }

  document.body.removeChild(svg);
  return points;
}

function renderText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  obj: CanvasObject,
  allObjects: CanvasObject[] = []
) {
  const fontSize = obj.fontSize || 20;
  const fontFamily = obj.fontFamily || 'Arial';
  const fontWeight = obj.fontWeight || 'normal';
  const fontStyle = obj.fontStyle || 'normal';

  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';

  // Apply gradient or solid fill
  if (obj.fillType === 'linear-gradient' && obj.gradientStops) {
    const angle = (obj.gradientAngle || 0) * Math.PI / 180;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const x1 = centerX - Math.cos(angle) * width / 2;
    const y1 = centerY - Math.sin(angle) * height / 2;
    const x2 = centerX + Math.cos(angle) * width / 2;
    const y2 = centerY + Math.sin(angle) * height / 2;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    obj.gradientStops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
  } else if (obj.fillType === 'radial-gradient' && obj.gradientStops) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.max(width, height) / 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    obj.gradientStops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = obj.fill || '#000000';
  }

  // Apply drop shadow
  if (obj.dropShadow?.enabled) {
    ctx.shadowOffsetX = obj.dropShadow.offsetX;
    ctx.shadowOffsetY = obj.dropShadow.offsetY;
    ctx.shadowBlur = obj.dropShadow.blur;
    ctx.shadowColor = `${obj.dropShadow.color}${Math.round(obj.dropShadow.opacity * 255).toString(16).padStart(2, '0')}`;
  }

  // Apply filters
  if (obj.contrast || obj.brightness || obj.grayscale || obj.threshold) {
    ctx.filter = buildFilterString(obj);
  }

  // Check if text has warp
  const isWarped = hasTextWarp(obj);

  if (isWarped) {
    // Render warped text by placing individual characters along a path
    let pathData = '';

    if (obj.textPathId) {
      // Look up path from the objects list passed to this function
      const pathObj = allObjects.find((o: CanvasObject) => o.id === obj.textPathId);
      if (pathObj?.pathPoints) {
        pathData = pathPointsToSvgPath(pathObj.pathPoints, 0, 0);
      }
    } else if (obj.warpType && obj.warpType !== 'none') {
      if ((obj.warpType === 'arc-up' || obj.warpType === 'arc-down') && obj.arcAngle) {
        const direction = obj.warpType === 'arc-up'
          ? (obj.arcDirection || 'convex')
          : (obj.arcDirection === 'convex' ? 'concave' : 'convex');
        pathData = generateArcPath({
          width,
          height,
          radius: obj.arcRadius,
          angle: obj.arcAngle,
          direction,
        });
      } else {
        pathData = generateWarpPath({
          warpType: obj.warpType,
          width,
          height,
          intensity: obj.warpIntensity ?? 50,
        });
      }
    }

    if (pathData) {
      // Measure each character width
      const chars = text.split('');
      const charWidths = chars.map(ch => ctx.measureText(ch).width);
      const totalTextWidth = charWidths.reduce((sum, w) => sum + w, 0);

      // Sample enough points along the path
      const pathPoints = samplePathPoints(pathData, 200);
      if (pathPoints.length < 2) {
        // Fallback to flat text
        ctx.textAlign = 'center';
        ctx.fillText(text, x + width / 2, y + height / 2);
      } else {
        // Calculate path total length from samples
        let pathTotalLen = 0;
        for (let i = 1; i < pathPoints.length; i++) {
          const dx = pathPoints[i].x - pathPoints[i - 1].x;
          const dy = pathPoints[i].y - pathPoints[i - 1].y;
          pathTotalLen += Math.sqrt(dx * dx + dy * dy);
        }

        // Calculate start offset based on alignment
        let startDist = 0;
        if (obj.align === 'center') startDist = (pathTotalLen - totalTextWidth) / 2;
        else if (obj.align === 'right') startDist = pathTotalLen - totalTextWidth;
        startDist = Math.max(0, startDist);

        // Place each character
        let currentDist = startDist;
        ctx.textAlign = 'center';

        for (let i = 0; i < chars.length; i++) {
          const charCenter = currentDist + charWidths[i] / 2;

          // Find the point on the path at this distance
          let accDist = 0;
          let ptIdx = 0;
          for (let j = 1; j < pathPoints.length; j++) {
            const dx = pathPoints[j].x - pathPoints[j - 1].x;
            const dy = pathPoints[j].y - pathPoints[j - 1].y;
            const segLen = Math.sqrt(dx * dx + dy * dy);
            if (accDist + segLen >= charCenter) {
              ptIdx = j - 1;
              break;
            }
            accDist += segLen;
            ptIdx = j - 1;
          }

          const pt = pathPoints[Math.min(ptIdx, pathPoints.length - 1)];

          ctx.save();
          ctx.translate(x + pt.x, y + pt.y);
          ctx.rotate(pt.angle);
          ctx.fillText(chars[i], 0, 0);
          ctx.restore();

          currentDist += charWidths[i];
        }
      }
    } else {
      // No valid path, fallback to flat
      ctx.textAlign = 'center';
      ctx.fillText(text, x + width / 2, y + height / 2);
    }
  } else {
    // Standard flat text rendering
    ctx.textAlign = 'center';

    // Apply glow effect
    if (obj.glow?.enabled) {
      const glowIterations = 3;
      for (let i = 0; i < glowIterations; i++) {
        ctx.save();
        ctx.shadowColor = `${obj.glow.color}${Math.round(obj.glow.intensity * 255).toString(16).padStart(2, '0')}`;
        ctx.shadowBlur = obj.glow.radius * (i + 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillText(text, x + width / 2, y + height / 2);
        ctx.restore();
      }
    }

    ctx.fillText(text, x + width / 2, y + height / 2);
  }

  // Reset shadow and filter
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.filter = 'none';
}

function renderShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  obj: CanvasObject
) {
  const stroke = obj.stroke || '';
  const strokeWidth = obj.strokeWidth || 0;

  // Apply gradient or solid fill
  if (obj.fillType === 'linear-gradient' && obj.gradientStops) {
    const angle = (obj.gradientAngle || 0) * Math.PI / 180;
    const x1 = x + width / 2 - Math.cos(angle) * width / 2;
    const y1 = y + height / 2 - Math.sin(angle) * height / 2;
    const x2 = x + width / 2 + Math.cos(angle) * width / 2;
    const y2 = y + height / 2 + Math.sin(angle) * height / 2;
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    obj.gradientStops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
  } else if (obj.fillType === 'radial-gradient' && obj.gradientStops) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.max(width, height) / 2;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    obj.gradientStops.forEach(stop => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = obj.fill || '#000000';
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
  }

  // Apply drop shadow
  if (obj.dropShadow?.enabled) {
    ctx.shadowOffsetX = obj.dropShadow.offsetX;
    ctx.shadowOffsetY = obj.dropShadow.offsetY;
    ctx.shadowBlur = obj.dropShadow.blur;
    ctx.shadowColor = `${obj.dropShadow.color}${Math.round(obj.dropShadow.opacity * 255).toString(16).padStart(2, '0')}`;
  }

  // Apply filters
  if (obj.contrast || obj.brightness || obj.grayscale || obj.threshold) {
    ctx.filter = buildFilterString(obj);
  }

  // Apply glow effect (render shape multiple times with blur)
  if (obj.glow?.enabled) {
    const glowIterations = 3;
    for (let i = 0; i < glowIterations; i++) {
      ctx.save();
      ctx.shadowColor = `${obj.glow.color}${Math.round(obj.glow.intensity * 255).toString(16).padStart(2, '0')}`;
      ctx.shadowBlur = obj.glow.radius * (i + 1);
      ctx.globalCompositeOperation = 'lighter';
      
      switch (obj.shapeType) {
        case 'rect':
          ctx.fillRect(x, y, width, height);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'star':
          drawStar(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2);
          ctx.fill();
          break;
        case 'polygon':
          drawPolygon(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2, obj.polygonSides || 6);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    }
  }

  switch (obj.shapeType) {
    case 'rect':
      ctx.fillRect(x, y, width, height);
      if (stroke) ctx.strokeRect(x, y, width, height);
      break;

    case 'circle':
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
      ctx.fill();
      if (stroke) ctx.stroke();
      break;

    case 'star':
      drawStar(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2);
      ctx.fill();
      if (stroke) ctx.stroke();
      break;

    case 'polygon':
      drawPolygon(ctx, x + width / 2, y + height / 2, Math.min(width, height) / 2, obj.polygonSides || 6);
      ctx.fill();
      if (stroke) ctx.stroke();
      break;
  }

  // Reset shadow
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.filter = 'none';
}

function renderLine(
  ctx: CanvasRenderingContext2D,
  obj: CanvasObject
) {
  const stroke = obj.stroke || '#000000';
  const strokeWidth = obj.strokeWidth || 2;

  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = obj.lineCapStyle || 'round';

  const startX = 0;
  const startY = 0;
  const endX = obj.lineEndX || 100;
  const endY = obj.lineEndY || 0;

  ctx.beginPath();

  if (obj.lineType === 'curved' && obj.lineCurve) {
    // Bezier curve
    const controlX = (startX + endX) / 2;
    const controlY = (startY + endY) / 2 + obj.lineCurve;
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
  } else {
    // Straight line
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
  }

  ctx.stroke();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const points = 5;
  const innerRadius = radius * 0.4;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function drawPolygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) {
  const angle = (Math.PI * 2) / sides;

  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const px = x + radius * Math.cos(angle * i - Math.PI / 2);
    const py = y + radius * Math.sin(angle * i - Math.PI / 2);

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function buildFilterString(obj: CanvasObject): string {
  const filters: string[] = [];

  if (obj.contrast !== undefined && obj.contrast !== 100) {
    filters.push(`contrast(${obj.contrast}%)`);
  }
  if (obj.brightness !== undefined && obj.brightness !== 100) {
    filters.push(`brightness(${obj.brightness}%)`);
  }
  if (obj.grayscale !== undefined && obj.grayscale > 0) {
    filters.push(`grayscale(${obj.grayscale}%)`);
  }
  if (obj.threshold) {
    filters.push('contrast(300%)', 'grayscale(100%)');
  }
  if (obj.hueRotate !== undefined && obj.hueRotate > 0) {
    filters.push(`hue-rotate(${obj.hueRotate}deg)`);
  }
  if (obj.invert) {
    filters.push('invert(100%)');
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

/**
 * Export canvas to SVG (vector format)
 * Premium feature - scalable, editable vector export
 */
export async function exportToSVG(
  objects: CanvasObject[],
  options: {
    includeBackground?: boolean;
    width?: number; // Custom deck width (defaults to DECK_WIDTH)
    height?: number; // Custom deck height (defaults to DECK_HEIGHT)
    backgroundColor?: string;
    backgroundFillType?: 'solid' | 'gradient' | 'linear-gradient' | 'radial-gradient';
    backgroundGradient?: BackgroundGradientData;
  } = {}
): Promise<Blob> {
  const {
    includeBackground = true,
    width = DEFAULT_DECK_WIDTH,
    height = DEFAULT_DECK_HEIGHT,
    backgroundColor = '#ffffff',
    backgroundFillType = 'solid',
    backgroundGradient,
  } = options;

  // Create SVG document
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add defs for gradients
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);

  // Add background
  if (includeBackground) {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', width.toString());
    bg.setAttribute('height', height.toString());

    if ((backgroundFillType === 'gradient' || backgroundFillType === 'linear-gradient' || backgroundFillType === 'radial-gradient') && backgroundGradient) {
      const bgGradId = 'bg-gradient';
      const stops = backgroundGradient.stops && backgroundGradient.stops.length > 0
        ? backgroundGradient.stops
        : [{ offset: 0, color: backgroundGradient.startColor }, { offset: 1, color: backgroundGradient.endColor }];

      if (backgroundGradient.direction === 'radial' || backgroundFillType === 'radial-gradient') {
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        grad.setAttribute('id', bgGradId);
        grad.setAttribute('cx', `${(backgroundGradient.centerX ?? 0.5) * 100}%`);
        grad.setAttribute('cy', `${(backgroundGradient.centerY ?? 0.5) * 100}%`);
        grad.setAttribute('r', `${(backgroundGradient.radius ?? 0.5) * 100}%`);
        stops.forEach((s: { offset: number; color: string }) => {
          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop.setAttribute('offset', `${s.offset * 100}%`);
          stop.setAttribute('stop-color', s.color);
          grad.appendChild(stop);
        });
        defs.appendChild(grad);
      } else {
        const angle = backgroundGradient.angle * Math.PI / 180;
        const x1 = 50 - Math.cos(angle) * 50;
        const y1 = 50 - Math.sin(angle) * 50;
        const x2 = 50 + Math.cos(angle) * 50;
        const y2 = 50 + Math.sin(angle) * 50;
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', bgGradId);
        grad.setAttribute('x1', `${x1}%`);
        grad.setAttribute('y1', `${y1}%`);
        grad.setAttribute('x2', `${x2}%`);
        grad.setAttribute('y2', `${y2}%`);
        stops.forEach((s: { offset: number; color: string }) => {
          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop.setAttribute('offset', `${s.offset * 100}%`);
          stop.setAttribute('stop-color', s.color);
          grad.appendChild(stop);
        });
        defs.appendChild(grad);
      }
      bg.setAttribute('fill', `url(#${bgGradId})`);
    } else {
      bg.setAttribute('fill', backgroundColor);
    }
    svg.appendChild(bg);
  }

  // Render each object as SVG
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const element = await renderObjectToSVG(obj, defs, i);
    if (element) {
      svg.appendChild(element);
    }
  }

  // Convert to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);

  // Create blob
  return new Blob([svgString], { type: 'image/svg+xml' });
}

async function renderObjectToSVG(
  obj: CanvasObject,
  defs: SVGDefsElement,
  index: number
): Promise<SVGElement | null> {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  // Apply transform
  const centerX = obj.x + (obj.width * obj.scaleX) / 2;
  const centerY = obj.y + (obj.height * obj.scaleY) / 2;
  g.setAttribute(
    'transform',
    `translate(${centerX}, ${centerY}) rotate(${obj.rotation}) scale(${obj.scaleX}, ${obj.scaleY})`
  );
  g.setAttribute('opacity', obj.opacity.toString());

  const x = -obj.width / 2;
  const y = -obj.height / 2;

  if (obj.type === 'text' && obj.text) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', (obj.fontSize || 24).toString());
    text.setAttribute('font-family', obj.fontFamily || 'Arial');
    
    // Handle gradient fill
    if (obj.fillType && obj.fillType !== 'solid' && obj.gradientStops) {
      const gradientId = `gradient-${index}`;
      const gradient = createGradient(obj, gradientId);
      defs.appendChild(gradient);
      text.setAttribute('fill', `url(#${gradientId})`);
    } else {
      text.setAttribute('fill', obj.fill || '#000000');
    }

    // Apply filters
    if (obj.dropShadow?.enabled) {
      const filterId = `filter-${index}`;
      const filter = createDropShadowFilter(obj.dropShadow, filterId);
      defs.appendChild(filter);
      text.setAttribute('filter', `url(#${filterId})`);
    }

    text.textContent = obj.text;
    g.appendChild(text);
  } else if (obj.type === 'shape') {
    let shape: SVGElement | null = null;

    if (obj.shapeType === 'rect') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shape.setAttribute('x', x.toString());
      shape.setAttribute('y', y.toString());
      shape.setAttribute('width', obj.width.toString());
      shape.setAttribute('height', obj.height.toString());
    } else if (obj.shapeType === 'circle') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shape.setAttribute('cx', '0');
      shape.setAttribute('cy', '0');
      shape.setAttribute('r', (obj.width / 2).toString());
    } else if (obj.shapeType === 'star') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const starPath = createStarPath(obj.width / 2);
      shape.setAttribute('d', starPath);
    } else if (obj.shapeType === 'polygon') {
      shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const polygonPath = createPolygonPath(obj.width / 2, obj.polygonSides || 6);
      shape.setAttribute('d', polygonPath);
    }

    if (shape) {
      // Handle gradient fill
      if (obj.fillType && obj.fillType !== 'solid' && obj.gradientStops) {
        const gradientId = `gradient-${index}`;
        const gradient = createGradient(obj, gradientId);
        defs.appendChild(gradient);
        shape.setAttribute('fill', `url(#${gradientId})`);
      } else {
        shape.setAttribute('fill', obj.fill || '#000000');
      }

      if (obj.stroke) {
        shape.setAttribute('stroke', obj.stroke);
        shape.setAttribute('stroke-width', (obj.strokeWidth || 1).toString());
      }

      // Apply filters
      if (obj.dropShadow?.enabled) {
        const filterId = `filter-${index}`;
        const filter = createDropShadowFilter(obj.dropShadow, filterId);
        defs.appendChild(filter);
        shape.setAttribute('filter', `url(#${filterId})`);
      }

      g.appendChild(shape);
    }
  } else if (obj.type === 'path' && obj.pathPoints && obj.pathPoints.length > 0) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    let d = `M ${obj.pathPoints[0].x} ${obj.pathPoints[0].y}`;
    for (let i = 1; i < obj.pathPoints.length; i++) {
      const point = obj.pathPoints[i];
      if (point.cp1x !== undefined && point.cp1y !== undefined) {
        if (point.cp2x !== undefined && point.cp2y !== undefined) {
          d += ` C ${point.cp1x} ${point.cp1y} ${point.cp2x} ${point.cp2y} ${point.x} ${point.y}`;
        } else {
          d += ` Q ${point.cp1x} ${point.cp1y} ${point.x} ${point.y}`;
        }
      } else {
        d += ` L ${point.x} ${point.y}`;
      }
    }
    
    if (obj.pathClosed) {
      d += ' Z';
    }

    path.setAttribute('d', d);
    path.setAttribute('fill', obj.pathClosed ? (obj.fill || 'none') : 'none');
    path.setAttribute('stroke', obj.stroke || '#000000');
    path.setAttribute('stroke-width', (obj.strokeWidth || 2).toString());
    
    g.appendChild(path);
  } else if (obj.type === 'line') {
    const line = document.createElementNS('http://www.w3.org/2000/svg', obj.lineType === 'curved' ? 'path' : 'line');
    
    if (obj.lineType === 'curved' && obj.lineCurve) {
      const controlX = (obj.lineEndX || 100) / 2;
      const controlY = ((obj.lineEndY || 0) / 2) + obj.lineCurve;
      line.setAttribute('d', `M 0 0 Q ${controlX} ${controlY} ${obj.lineEndX || 100} ${obj.lineEndY || 0}`);
    } else {
      line.setAttribute('x1', '0');
      line.setAttribute('y1', '0');
      line.setAttribute('x2', (obj.lineEndX || 100).toString());
      line.setAttribute('y2', (obj.lineEndY || 0).toString());
    }
    
    line.setAttribute('stroke', obj.stroke || '#000000');
    line.setAttribute('stroke-width', (obj.strokeWidth || 2).toString());
    line.setAttribute('stroke-linecap', obj.lineCapStyle || 'round');
    line.setAttribute('fill', 'none');
    
    g.appendChild(line);
  } else if (obj.type === 'image' && obj.src) {
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('x', x.toString());
    image.setAttribute('y', y.toString());
    image.setAttribute('width', obj.width.toString());
    image.setAttribute('height', obj.height.toString());
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', obj.src);
    g.appendChild(image);
  }

  return g;
}

function createGradient(obj: CanvasObject, id: string): SVGElement {
  if (obj.fillType === 'linear-gradient' && obj.gradientStops) {
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', id);
    
    const angle = (obj.gradientAngle || 0) * Math.PI / 180;
    const x1 = 50 - Math.cos(angle) * 50;
    const y1 = 50 - Math.sin(angle) * 50;
    const x2 = 50 + Math.cos(angle) * 50;
    const y2 = 50 + Math.sin(angle) * 50;
    
    gradient.setAttribute('x1', `${x1}%`);
    gradient.setAttribute('y1', `${y1}%`);
    gradient.setAttribute('x2', `${x2}%`);
    gradient.setAttribute('y2', `${y2}%`);

    obj.gradientStops.forEach(stop => {
      const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stopElement.setAttribute('offset', `${stop.offset * 100}%`);
      stopElement.setAttribute('stop-color', stop.color);
      gradient.appendChild(stopElement);
    });

    return gradient;
  } else if (obj.fillType === 'radial-gradient' && obj.gradientStops) {
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    gradient.setAttribute('id', id);
    
    obj.gradientStops.forEach(stop => {
      const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stopElement.setAttribute('offset', `${stop.offset * 100}%`);
      stopElement.setAttribute('stop-color', stop.color);
      gradient.appendChild(stopElement);
    });

    return gradient;
  }

  return document.createElementNS('http://www.w3.org/2000/svg', 'g');
}

function createDropShadowFilter(shadow: { offsetX: number; offsetY: number; blur: number; color: string; opacity: number }, id: string): SVGElement {
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('x', '-50%');
  filter.setAttribute('y', '-50%');
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
  feDropShadow.setAttribute('dx', shadow.offsetX.toString());
  feDropShadow.setAttribute('dy', shadow.offsetY.toString());
  feDropShadow.setAttribute('stdDeviation', (shadow.blur / 2).toString());
  feDropShadow.setAttribute('flood-color', shadow.color);
  feDropShadow.setAttribute('flood-opacity', shadow.opacity.toString());

  filter.appendChild(feDropShadow);
  return filter;
}

function createStarPath(radius: number): string {
  const points = 5;
  const innerRadius = radius * 0.4;
  let d = '';

  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? radius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    if (i === 0) {
      d += `M ${x} ${y}`;
    } else {
      d += ` L ${x} ${y}`;
    }
  }

  d += ' Z';
  return d;
}

function createPolygonPath(radius: number, sides: number): string {
  const angle = (Math.PI * 2) / sides;
  let d = '';

  for (let i = 0; i < sides; i++) {
    const x = radius * Math.cos(angle * i - Math.PI / 2);
    const y = radius * Math.sin(angle * i - Math.PI / 2);

    if (i === 0) {
      d += `M ${x} ${y}`;
    } else {
      d += ` L ${x} ${y}`;
    }
  }

  d += ' Z';
  return d;
}

/**
 * Export canvas to PDF (Premium Feature)
 * Embeds high-resolution PNG in industry-standard PDF format
 */
export async function exportToPDF(
  objects: CanvasObject[],
  options: {
    scale?: number;
    includeBackground?: boolean;
    title?: string;
    backgroundColor?: string;
    backgroundFillType?: 'solid' | 'gradient' | 'linear-gradient' | 'radial-gradient';
    backgroundGradient?: BackgroundGradientData;
  } = {}
): Promise<Blob> {
  const { scale = 6, includeBackground = true, title = 'Fingerboard Design', backgroundColor, backgroundFillType, backgroundGradient } = options;

  // Dynamically import jspdf (code splitting)
  const { jsPDF } = await import('jspdf');

  // First, render the design as a high-res PNG
  const pngBlob = await exportToPNG(objects, {
    scale,
    format: 'png',
    includeBackground,
    backgroundColor,
    backgroundFillType,
    backgroundGradient,
  });

  // Convert blob to base64 data URL
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(pngBlob);
  });

  // Calculate PDF dimensions (in mm)
  // Deck dimensions in mm: 96mm x 294mm (standard fingerboard)
  const deckWidthMm = 96;
  const deckHeightMm = 294;

  // Create PDF in portrait orientation
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [deckWidthMm, deckHeightMm],
  });

  // Add metadata
  pdf.setProperties({
    title: title,
    subject: 'Fingerboard Design',
    author: 'DeckForge',
    keywords: 'fingerboard, deck, design',
    creator: 'DeckForge - deckforge.app',
  });

  // Add the image to PDF (fills entire page)
  pdf.addImage(
    dataUrl,
    'PNG',
    0,
    0,
    deckWidthMm,
    deckHeightMm,
    undefined,
    'FAST' // Compression mode
  );

  // Convert PDF to blob
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
