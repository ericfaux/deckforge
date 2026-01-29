import { CanvasObject } from '@/store/deckforge';

/**
 * Parse SVG file and convert to canvas objects
 * Supports basic shapes: rect, circle, ellipse, path, polygon, polyline
 */
export async function importSVG(file: File): Promise<Omit<CanvasObject, 'id'>[]> {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  
  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid SVG file');
  }

  const svg = doc.querySelector('svg');
  if (!svg) {
    throw new Error('No SVG element found');
  }

  // Get SVG dimensions
  const viewBox = svg.getAttribute('viewBox');
  let svgWidth = parseFloat(svg.getAttribute('width') || '100');
  let svgHeight = parseFloat(svg.getAttribute('height') || '100');

  if (viewBox) {
    const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(parseFloat);
    svgWidth = vbWidth || svgWidth;
    svgHeight = vbHeight || svgHeight;
  }

  const objects: Omit<CanvasObject, 'id'>[] = [];

  // Parse all shape elements
  const shapes = svg.querySelectorAll('rect, circle, ellipse, path, polygon, polyline, line');
  
  shapes.forEach((element) => {
    const obj = parseElement(element as SVGElement, svgWidth, svgHeight);
    if (obj) {
      objects.push(obj);
    }
  });

  // If no shapes found, convert entire SVG to image
  if (objects.length === 0) {
    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    objects.push({
      type: 'image',
      x: 0,
      y: 0,
      width: Math.min(svgWidth, 200),
      height: Math.min(svgHeight, 200),
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      src: url,
    });
  }

  return objects;
}

function parseElement(element: SVGElement, svgWidth: number, svgHeight: number): Omit<CanvasObject, 'id'> | null {
  const tagName = element.tagName.toLowerCase();
  const fill = element.getAttribute('fill') || '#000000';
  const stroke = element.getAttribute('stroke') || '';
  const strokeWidth = parseFloat(element.getAttribute('stroke-width') || '0');
  const opacity = parseFloat(element.getAttribute('opacity') || '1');

  // Ignore invisible elements
  if (fill === 'none' && !stroke) {
    return null;
  }

  switch (tagName) {
    case 'rect':
      return parseRect(element as SVGRectElement, fill, stroke, strokeWidth, opacity);
    
    case 'circle':
      return parseCircle(element as SVGCircleElement, fill, stroke, strokeWidth, opacity);
    
    case 'ellipse':
      return parseEllipse(element as SVGEllipseElement, fill, stroke, strokeWidth, opacity);
    
    case 'line':
      return parseLine(element as SVGLineElement, stroke || fill, strokeWidth, opacity);
    
    case 'path':
    case 'polygon':
    case 'polyline':
      // For complex shapes, convert to embedded SVG image
      return parseComplexShape(element, svgWidth, svgHeight, opacity);
    
    default:
      return null;
  }
}

function parseRect(
  rect: SVGRectElement,
  fill: string,
  stroke: string,
  strokeWidth: number,
  opacity: number
): Omit<CanvasObject, 'id'> {
  const x = parseFloat(rect.getAttribute('x') || '0');
  const y = parseFloat(rect.getAttribute('y') || '0');
  const width = parseFloat(rect.getAttribute('width') || '100');
  const height = parseFloat(rect.getAttribute('height') || '100');

  return {
    type: 'shape',
    shapeType: 'rect',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity,
    scaleX: 1,
    scaleY: 1,
    fill: fill !== 'none' ? fill : undefined,
    stroke: stroke || undefined,
    strokeWidth,
  };
}

function parseCircle(
  circle: SVGCircleElement,
  fill: string,
  stroke: string,
  strokeWidth: number,
  opacity: number
): Omit<CanvasObject, 'id'> {
  const cx = parseFloat(circle.getAttribute('cx') || '50');
  const cy = parseFloat(circle.getAttribute('cy') || '50');
  const r = parseFloat(circle.getAttribute('r') || '25');

  return {
    type: 'shape',
    shapeType: 'circle',
    x: cx - r,
    y: cy - r,
    width: r * 2,
    height: r * 2,
    rotation: 0,
    opacity,
    scaleX: 1,
    scaleY: 1,
    fill: fill !== 'none' ? fill : undefined,
    stroke: stroke || undefined,
    strokeWidth,
  };
}

function parseEllipse(
  ellipse: SVGEllipseElement,
  fill: string,
  stroke: string,
  strokeWidth: number,
  opacity: number
): Omit<CanvasObject, 'id'> {
  const cx = parseFloat(ellipse.getAttribute('cx') || '50');
  const cy = parseFloat(ellipse.getAttribute('cy') || '50');
  const rx = parseFloat(ellipse.getAttribute('rx') || '25');
  const ry = parseFloat(ellipse.getAttribute('ry') || '25');

  return {
    type: 'shape',
    shapeType: 'circle', // Use circle for ellipse (will be scaled)
    x: cx - rx,
    y: cy - ry,
    width: rx * 2,
    height: ry * 2,
    rotation: 0,
    opacity,
    scaleX: 1,
    scaleY: ry / rx, // Scale to create ellipse effect
    fill: fill !== 'none' ? fill : undefined,
    stroke: stroke || undefined,
    strokeWidth,
  };
}

function parseLine(
  line: SVGLineElement,
  stroke: string,
  strokeWidth: number,
  opacity: number
): Omit<CanvasObject, 'id'> {
  const x1 = parseFloat(line.getAttribute('x1') || '0');
  const y1 = parseFloat(line.getAttribute('y1') || '0');
  const x2 = parseFloat(line.getAttribute('x2') || '100');
  const y2 = parseFloat(line.getAttribute('y2') || '100');

  return {
    type: 'line',
    x: x1,
    y: y1,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    rotation: 0,
    opacity,
    scaleX: 1,
    scaleY: 1,
    lineType: 'straight',
    lineEndX: x2 - x1,
    lineEndY: y2 - y1,
    stroke: stroke || '#000000',
    strokeWidth: strokeWidth || 2,
    lineCapStyle: 'round',
  };
}

function parseComplexShape(
  element: SVGElement,
  svgWidth: number,
  svgHeight: number,
  opacity: number
): Omit<CanvasObject, 'id'> {
  // Try to get bounding box, with fallback
  let bbox = { x: 0, y: 0, width: 100, height: 100 };
  
  try {
    // Temporarily attach to DOM to get accurate bounding box
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.style.position = 'absolute';
    tempSvg.style.visibility = 'hidden';
    const tempClone = element.cloneNode(true) as SVGElement;
    tempSvg.appendChild(tempClone);
    document.body.appendChild(tempSvg);
    
    if (tempClone.getBBox) {
      const computedBox = tempClone.getBBox();
      bbox = {
        x: computedBox.x,
        y: computedBox.y,
        width: computedBox.width,
        height: computedBox.height,
      };
    }
    
    document.body.removeChild(tempSvg);
  } catch (err) {
    console.warn('Failed to get accurate bounding box, using defaults', err);
  }
  
  // Clone the element and wrap in a standalone SVG
  const clone = element.cloneNode(true) as SVGElement;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
  svg.setAttribute('width', String(bbox.width));
  svg.setAttribute('height', String(bbox.height));
  svg.appendChild(clone);

  // Convert to blob URL
  const svgString = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  return {
    type: 'image',
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    rotation: 0,
    opacity,
    scaleX: 1,
    scaleY: 1,
    src: url,
  };
}

/**
 * Validate SVG file before import
 */
export function validateSVGFile(file: File): boolean {
  const validTypes = ['image/svg+xml', 'image/svg', 'text/xml'];
  const validExtensions = ['.svg'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  return hasValidType || hasValidExtension;
}
