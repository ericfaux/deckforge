import { CanvasObject } from '@/store/deckforge';
import { Template } from './templates';

/**
 * Generate a thumbnail image from template objects
 * Renders the template to a canvas and returns a data URL
 */
export function generateThumbnail(template: Template): string {
  const canvas = document.createElement('canvas');
  const SCALE = 3;
  const WIDTH_MM = 96;
  const HEIGHT_MM = 294;

  canvas.width = WIDTH_MM * SCALE;
  canvas.height = HEIGHT_MM * SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw solid fallback background (no transparency in thumbnails)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const obj of template.objects) {
    ctx.save();

    const x = obj.x * SCALE;
    const y = obj.y * SCALE;
    const width = obj.width * SCALE;
    const height = obj.height * SCALE;

    ctx.translate(x + width / 2, y + height / 2);
    if (obj.rotation) {
      ctx.rotate((obj.rotation * Math.PI) / 180);
    }
    ctx.scale(obj.scaleX || 1, obj.scaleY || 1);
    if (obj.opacity !== undefined) {
      ctx.globalAlpha = obj.opacity;
    }

    switch (obj.type) {
      case 'shape':
        renderShape(ctx, obj, width, height, SCALE);
        break;
      case 'sticker':
        renderSticker(ctx, obj, width, height);
        break;
      case 'text':
        renderText(ctx, obj, width, height, SCALE);
        break;
      case 'line':
        renderLine(ctx, obj, width, height, SCALE);
        break;
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

function renderShape(
  ctx: CanvasRenderingContext2D,
  obj: any,
  width: number,
  height: number,
  scale: number,
) {
  ctx.translate(-width / 2, -height / 2);

  // Handle patterns
  if (obj.patternType) {
    renderPattern(ctx, obj, width, height, scale);
    return;
  }

  // Set fill style
  if (obj.fillType === 'linear-gradient' && obj.gradientStops) {
    const angle = ((obj.gradientAngle || 0) - 90) * (Math.PI / 180);
    const cx = width / 2;
    const cy = height / 2;
    const len = Math.max(width, height);
    const x1 = cx - Math.cos(angle) * len / 2;
    const y1 = cy - Math.sin(angle) * len / 2;
    const x2 = cx + Math.cos(angle) * len / 2;
    const y2 = cy + Math.sin(angle) * len / 2;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    obj.gradientStops.forEach((stop: any) => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
  } else if (obj.fillType === 'radial-gradient' && obj.gradientStops) {
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2,
    );
    obj.gradientStops.forEach((stop: any) => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = obj.fill || '#000000';
  }

  // Apply glow before drawing
  if (obj.glow?.enabled) {
    ctx.shadowColor = obj.glow.color;
    ctx.shadowBlur = (obj.glow.radius || 10) * (obj.glow.intensity || 1);
  }

  // Draw shape
  switch (obj.shapeType) {
    case 'rect':
      if (obj.fill !== 'transparent') {
        ctx.fillRect(0, 0, width, height);
      }
      if (obj.stroke && obj.strokeWidth) {
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth * scale;
        ctx.strokeRect(0, 0, width, height);
      }
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
      if (obj.fill !== 'transparent') {
        ctx.fill();
      }
      if (obj.stroke && obj.strokeWidth) {
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth * scale;
        ctx.stroke();
      }
      break;
    case 'star': {
      const cx = width / 2;
      const cy = height / 2;
      const outerR = Math.min(width, height) / 2;
      const innerR = outerR * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'polygon': {
      const sides = obj.polygonSides || 6;
      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) / 2;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const px = cx + r * Math.cos(a);
        const py = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      ctx.fillRect(0, 0, width, height);
  }
}

function renderPattern(
  ctx: CanvasRenderingContext2D,
  obj: any,
  width: number,
  height: number,
  scale: number,
) {
  const primary = obj.patternPrimaryColor || '#000000';
  const secondary = obj.patternSecondaryColor || '#ffffff';
  const patternScale = obj.patternScale || 1;

  switch (obj.patternType) {
    case 'checkerboard': {
      const cellSize = 8 * scale * patternScale;
      for (let row = 0; row < Math.ceil(height / cellSize); row++) {
        for (let col = 0; col < Math.ceil(width / cellSize); col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? primary : secondary;
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
      break;
    }
    case 'diagonal-stripes': {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = primary;
      const stripeW = 6 * scale * patternScale;
      const gap = stripeW * 2;
      ctx.save();
      ctx.clip();
      for (let i = -height; i < width + height; i += gap) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.lineTo(i + height + stripeW, height);
        ctx.lineTo(i + stripeW, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }
    case 'halftone': {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = primary;
      const dotSize = 3 * scale * patternScale;
      const spacing = 8 * scale * patternScale;
      for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'speed-lines': {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1 * scale * patternScale;
      const lineSpacing = 5 * scale * patternScale;
      for (let y = 0; y < height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y + (Math.random() - 0.5) * 4 * scale);
        ctx.stroke();
      }
      break;
    }
    case 'crosshatch': {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 0.5 * scale * patternScale;
      const spacing = 6 * scale * patternScale;
      // Forward diagonal
      for (let i = -height; i < width + height; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + height, height);
        ctx.stroke();
      }
      // Backward diagonal
      for (let i = -height; i < width + height; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(width - i, 0);
        ctx.lineTo(width - i - height, height);
        ctx.stroke();
      }
      break;
    }
    case 'noise': {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);
      // Simple noise approximation with random dots
      const noiseScale = patternScale;
      for (let i = 0; i < width * height * 0.05 * noiseScale; i++) {
        const nx = Math.random() * width;
        const ny = Math.random() * height;
        const alpha = Math.random() * 0.3;
        ctx.fillStyle = `rgba(${hexToRgb(primary)}, ${alpha})`;
        ctx.fillRect(nx, ny, 1.5 * scale, 1.5 * scale);
      }
      break;
    }
    case 'tie-dye': {
      // Psychedelic tie-dye effect with overlapping circles
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);
      const colors = [primary, secondary, mixColors(primary, secondary)];
      const numCircles = 12;
      for (let i = 0; i < numCircles; i++) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const r = (30 + Math.random() * 60) * scale * patternScale;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, colors[i % colors.length] + '88');
        gradient.addColorStop(0.5, colors[(i + 1) % colors.length] + '44');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
      break;
    }
    case 'hexagons': {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1 * scale * patternScale;
      const hexSize = 10 * scale * patternScale;
      const hexHeight = hexSize * Math.sqrt(3);
      for (let row = -1; row < Math.ceil(height / hexHeight) + 1; row++) {
        for (let col = -1; col < Math.ceil(width / (hexSize * 1.5)) + 1; col++) {
          const cx = col * hexSize * 1.5;
          const cy = row * hexHeight + (col % 2 ? hexHeight / 2 : 0);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = cx + hexSize * 0.6 * Math.cos(a);
            const py = cy + hexSize * 0.6 * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }
    default:
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, width, height);
  }
}

function renderSticker(ctx: CanvasRenderingContext2D, obj: any, width: number, height: number) {
  ctx.translate(-width / 2, -height / 2);

  // Apply glow
  if (obj.glow?.enabled) {
    ctx.shadowColor = obj.glow.color;
    ctx.shadowBlur = (obj.glow.radius || 10) * (obj.glow.intensity || 1);
  }

  ctx.fillStyle = obj.fill || '#000000';

  // Render different icon shapes based on iconName
  const name = (obj.iconName || '').toLowerCase();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2;

  if (name === 'skull') {
    // Skull approximation: circle head + jaw
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.1, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    // Eye holes
    ctx.fillStyle = getContrastColor(obj.fill || '#000000');
    ctx.globalAlpha = (obj.opacity || 1) * 0.8;
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.15, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.25, cy - r * 0.15, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.05);
    ctx.lineTo(cx - r * 0.08, cy + r * 0.2);
    ctx.lineTo(cx + r * 0.08, cy + r * 0.2);
    ctx.closePath();
    ctx.fill();
  } else if (name === 'flame') {
    // Flame shape
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.9);
    ctx.bezierCurveTo(cx + r * 0.3, cy - r * 0.3, cx + r * 0.8, cy, cx + r * 0.4, cy + r * 0.5);
    ctx.bezierCurveTo(cx + r * 0.6, cy + r * 0.1, cx + r * 0.1, cy + r * 0.3, cx, cy + r * 0.9);
    ctx.bezierCurveTo(cx - r * 0.1, cy + r * 0.3, cx - r * 0.6, cy + r * 0.1, cx - r * 0.4, cy + r * 0.5);
    ctx.bezierCurveTo(cx - r * 0.8, cy, cx - r * 0.3, cy - r * 0.3, cx, cy - r * 0.9);
    ctx.closePath();
    ctx.fill();
  } else if (name === 'star') {
    // 5-pointed star
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const starR = i % 2 === 0 ? r * 0.9 : r * 0.4;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const px = cx + starR * Math.cos(a);
      const py = cy + starR * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (name === 'zap') {
    // Lightning bolt
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.1, cy - r * 0.9);
    ctx.lineTo(cx - r * 0.3, cy);
    ctx.lineTo(cx + r * 0.1, cy - r * 0.05);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.9);
    ctx.lineTo(cx + r * 0.3, cy);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.05);
    ctx.closePath();
    ctx.fill();
  } else if (name === 'heart') {
    ctx.beginPath();
    const topY = cy - r * 0.3;
    ctx.moveTo(cx, cy + r * 0.7);
    ctx.bezierCurveTo(cx - r * 1.2, cy - r * 0.1, cx - r * 0.6, topY - r * 0.6, cx, topY + r * 0.1);
    ctx.bezierCurveTo(cx + r * 0.6, topY - r * 0.6, cx + r * 1.2, cy - r * 0.1, cx, cy + r * 0.7);
    ctx.closePath();
    ctx.fill();
  } else if (name === 'shield') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.8);
    ctx.lineTo(cx + r * 0.7, cy - r * 0.5);
    ctx.lineTo(cx + r * 0.7, cy + r * 0.1);
    ctx.bezierCurveTo(cx + r * 0.7, cy + r * 0.6, cx, cy + r * 0.9, cx, cy + r * 0.9);
    ctx.bezierCurveTo(cx, cy + r * 0.9, cx - r * 0.7, cy + r * 0.6, cx - r * 0.7, cy + r * 0.1);
    ctx.lineTo(cx - r * 0.7, cy - r * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (name === 'crown') {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy + r * 0.5);
    ctx.lineTo(cx - r * 0.7, cy - r * 0.2);
    ctx.lineTo(cx - r * 0.35, cy + r * 0.1);
    ctx.lineTo(cx, cy - r * 0.6);
    ctx.lineTo(cx + r * 0.35, cy + r * 0.1);
    ctx.lineTo(cx + r * 0.7, cy - r * 0.2);
    ctx.lineTo(cx + r * 0.7, cy + r * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (name === 'eye') {
    // Eye shape
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.9, cy);
    ctx.bezierCurveTo(cx - r * 0.4, cy - r * 0.6, cx + r * 0.4, cy - r * 0.6, cx + r * 0.9, cy);
    ctx.bezierCurveTo(cx + r * 0.4, cy + r * 0.6, cx - r * 0.4, cy + r * 0.6, cx - r * 0.9, cy);
    ctx.closePath();
    ctx.fill();
    // Pupil
    ctx.fillStyle = getContrastColor(obj.fill || '#000000');
    ctx.globalAlpha = (obj.opacity || 1) * 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (name === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.8);
    ctx.lineTo(cx + r * 0.6, cy);
    ctx.lineTo(cx, cy + r * 0.8);
    ctx.lineTo(cx - r * 0.6, cy);
    ctx.closePath();
    ctx.fill();
  } else if (name === 'x') {
    const thickness = r * 0.25;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-thickness / 2, -r * 0.7, thickness, r * 1.4);
    ctx.fillRect(-r * 0.7, -thickness / 2, r * 1.4, thickness);
    ctx.restore();
  } else if (name === 'crosshair') {
    // Crosshair: circle + cross
    ctx.strokeStyle = obj.fill || '#000000';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.85);
    ctx.lineTo(cx, cy + r * 0.85);
    ctx.moveTo(cx - r * 0.85, cy);
    ctx.lineTo(cx + r * 0.85, cy);
    ctx.stroke();
  } else {
    // Default: filled circle with inner marker
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    if (obj.solidFill) {
      ctx.fillStyle = getContrastColor(obj.fill || '#000000');
      ctx.globalAlpha = (obj.opacity || 1) * 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderText(
  ctx: CanvasRenderingContext2D,
  obj: any,
  width: number,
  height: number,
  scale: number,
) {
  ctx.translate(-width / 2, -height / 2);

  if (!obj.text) return;

  // Apply text shadow
  if (obj.textShadow?.enabled) {
    ctx.shadowColor = obj.textShadow.color;
    ctx.shadowOffsetX = obj.textShadow.offsetX * scale;
    ctx.shadowOffsetY = obj.textShadow.offsetY * scale;
    ctx.shadowBlur = obj.textShadow.blur * scale;
  }

  const fontSize = (obj.fontSize || 10) * scale;
  const fontWeight = obj.fontWeight || 'normal';
  const fontStyle = obj.fontStyle || 'normal';
  const fontFamily = obj.fontFamily || 'Impact';
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}, Impact, Arial, sans-serif`;
  ctx.fillStyle = obj.fill || '#000000';
  ctx.textAlign = (obj.align as CanvasTextAlign) || 'center';
  ctx.textBaseline = 'middle';

  let displayText = obj.text;
  if (obj.textTransform === 'uppercase') displayText = displayText.toUpperCase();
  else if (obj.textTransform === 'lowercase') displayText = displayText.toLowerCase();

  // Calculate text position
  let textX: number;
  if (obj.align === 'left') textX = 0;
  else if (obj.align === 'right') textX = width;
  else textX = width / 2;

  // Apply letter spacing by drawing character by character if needed
  if (obj.letterSpacing && obj.letterSpacing > 0) {
    ctx.textAlign = 'left';
    const spacing = obj.letterSpacing * scale;
    const chars = displayText.split('');
    const totalWidth = chars.reduce((w: number, c: string) => w + ctx.measureText(c).width + spacing, 0) - spacing;

    let startX: number;
    if (obj.align === 'center') startX = (width - totalWidth) / 2;
    else if (obj.align === 'right') startX = width - totalWidth;
    else startX = 0;

    let curX = startX;
    for (const char of chars) {
      ctx.fillText(char, curX, height / 2);
      curX += ctx.measureText(char).width + spacing;
    }
  } else {
    ctx.fillText(displayText, textX, height / 2);
  }
}

function renderLine(
  ctx: CanvasRenderingContext2D,
  obj: any,
  width: number,
  height: number,
  scale: number,
) {
  ctx.translate(-width / 2, -height / 2);

  ctx.strokeStyle = obj.stroke || obj.fill || '#000000';
  ctx.lineWidth = (obj.strokeWidth || 1) * scale;
  ctx.lineCap = obj.lineCapStyle || 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo((obj.lineEndX || width) * scale, (obj.lineEndY || 0) * scale);
  ctx.stroke();
}

// ── Utilities ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex).split(', ').map(Number);
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

function mixColors(color1: string, color2: string): string {
  const rgb1 = hexToRgb(color1).split(', ').map(Number);
  const rgb2 = hexToRgb(color2).split(', ').map(Number);
  const r = Math.round((rgb1[0] + rgb2[0]) / 2);
  const g = Math.round((rgb1[1] + rgb2[1]) / 2);
  const b = Math.round((rgb1[2] + rgb2[2]) / 2);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate thumbnails for all templates
 */
export function generateAllThumbnails(templates: Template[]): Template[] {
  return templates.map(template => ({
    ...template,
    thumbnail: template.thumbnail || generateThumbnail(template),
  }));
}
