import { CanvasObject } from '@/store/deckforge';
import { Template } from './templates';

/**
 * Generate a thumbnail image from template objects
 * Renders the template to a canvas and returns a data URL
 */
export function generateThumbnail(template: Template): string {
  // Create an offscreen canvas (96mm x 294mm at 3 pixels per mm = 288x882 px)
  const canvas = document.createElement('canvas');
  const SCALE = 3; // 3 pixels per mm for decent preview quality
  const WIDTH_MM = 96;
  const HEIGHT_MM = 294;
  
  canvas.width = WIDTH_MM * SCALE;
  canvas.height = HEIGHT_MM * SCALE;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Render each object
  for (const obj of template.objects) {
    ctx.save();
    
    // Apply transformations
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
    
    // Render based on type
    switch (obj.type) {
      case 'shape':
        renderShape(ctx, obj, width, height);
        break;
      case 'sticker':
        renderSticker(ctx, obj, width, height);
        break;
      case 'text':
        renderText(ctx, obj, width, height);
        break;
    }
    
    ctx.restore();
  }
  
  // Convert to data URL (JPEG for smaller size)
  return canvas.toDataURL('image/jpeg', 0.8);
}

function renderShape(ctx: CanvasRenderingContext2D, obj: any, width: number, height: number) {
  ctx.translate(-width / 2, -height / 2);
  
  // Handle gradient fills
  if (obj.fillType === 'linear-gradient' && obj.gradientStops) {
    const angle = (obj.gradientAngle || 0) * (Math.PI / 180);
    const x1 = width / 2 + Math.cos(angle) * width;
    const y1 = height / 2 + Math.sin(angle) * height;
    const x2 = width / 2 - Math.cos(angle) * width;
    const y2 = height / 2 - Math.sin(angle) * height;
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    obj.gradientStops.forEach((stop: any) => {
      gradient.addColorStop(stop.offset, stop.color);
    });
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = obj.fill || '#000000';
  }
  
  // Draw shape
  switch (obj.shapeType) {
    case 'rect':
      ctx.fillRect(0, 0, width, height);
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'star':
    case 'triangle':
      // Simple triangle for preview
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      break;
  }
  
  // Apply glow if present
  if (obj.glow?.enabled) {
    ctx.shadowColor = obj.glow.color;
    ctx.shadowBlur = (obj.glow.radius || 10) * (obj.glow.intensity || 1);
  }
}

function renderSticker(ctx: CanvasRenderingContext2D, obj: any, width: number, height: number) {
  ctx.translate(-width / 2, -height / 2);
  
  // For thumbnails, render stickers as colored circles
  ctx.fillStyle = obj.fill || '#000000';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // If solidFill, add an icon indicator (smaller circle in center)
  if (obj.solidFill) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderText(ctx: CanvasRenderingContext2D, obj: any, width: number, height: number) {
  ctx.translate(-width / 2, -height / 2);
  
  // For thumbnails, render text as rectangles (text rendering is complex)
  if (obj.stroke && obj.strokeWidth) {
    ctx.strokeStyle = obj.stroke;
    ctx.lineWidth = obj.strokeWidth;
    ctx.strokeRect(0, 0, width, height);
  }
  
  ctx.fillStyle = obj.fill || '#000000';
  ctx.fillRect(0, 0, width, height * 0.8);
}

/**
 * Generate thumbnails for all templates
 * Call this once when the app loads to populate thumbnails
 */
export function generateAllThumbnails(templates: Template[]): Template[] {
  return templates.map(template => ({
    ...template,
    thumbnail: template.thumbnail || generateThumbnail(template),
  }));
}
