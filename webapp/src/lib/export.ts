import { CanvasObject } from '@/store/deckforge';
import { DECK_WIDTH, DECK_HEIGHT } from '@/components/deckforge/WorkbenchStage';

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
  } = {}
): Promise<Blob> {
  const {
    scale = 3, // 3x for print quality
    format = 'png',
    quality = 0.95,
    includeBackground = true,
  } = options;

  // Create offscreen canvas at high resolution
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size (deck dimensions * scale for high DPI)
  canvas.width = DECK_WIDTH * scale;
  canvas.height = DECK_HEIGHT * scale;

  // Scale context for high DPI
  ctx.scale(scale, scale);

  // White background (print-ready)
  if (includeBackground) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, DECK_WIDTH, DECK_HEIGHT);
  }

  // Render each object in order (bottom to top)
  for (const obj of objects) {
    ctx.save();

    // Apply transformations
    const centerX = obj.x + (obj.width * obj.scaleX) / 2;
    const centerY = obj.y + (obj.height * obj.scaleY) / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((obj.rotation * Math.PI) / 180);
    ctx.globalAlpha = obj.opacity;

    // Apply blend mode
    if (obj.blendMode && obj.blendMode !== 'normal') {
      ctx.globalCompositeOperation = obj.blendMode;
    }

    const x = -(obj.width * obj.scaleX) / 2;
    const y = -(obj.height * obj.scaleY) / 2;
    const width = obj.width * obj.scaleX;
    const height = obj.height * obj.scaleY;

    // Render based on object type
    if (obj.type === 'image' && obj.src) {
      await renderImage(ctx, obj.src, x, y, width, height, obj);
    } else if (obj.type === 'text' && obj.text) {
      renderText(ctx, obj.text, x, y, width, height, obj);
    } else if (obj.type === 'shape') {
      renderShape(ctx, x, y, width, height, obj);
    } else if (obj.type === 'line') {
      renderLine(ctx, obj);
    }

    ctx.restore();
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

function renderText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  obj: CanvasObject
) {
  const fontSize = obj.fontSize || 20;
  const fontFamily = obj.fontFamily || 'Arial';

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
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
  } = {}
): Promise<Blob> {
  const { includeBackground = true } = options;

  // Create SVG document
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', DECK_WIDTH.toString());
  svg.setAttribute('height', DECK_HEIGHT.toString());
  svg.setAttribute('viewBox', `0 0 ${DECK_WIDTH} ${DECK_HEIGHT}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Add background
  if (includeBackground) {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', DECK_WIDTH.toString());
    bg.setAttribute('height', DECK_HEIGHT.toString());
    bg.setAttribute('fill', '#ffffff');
    svg.appendChild(bg);
  }

  // Add defs for gradients
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);

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
