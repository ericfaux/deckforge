/**
 * Extract dominant colors from an image using canvas and color quantization
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

export async function extractColorsFromImage(
  imageUrl: string,
  numColors: number = 6
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Create canvas to analyze image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Resize image for faster processing (max 200px)
        const maxSize = 200;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Sample pixels (every 4th pixel for speed)
        const samples: RGB[] = [];
        for (let i = 0; i < pixels.length; i += 16) { // 16 = 4 pixels
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          // Skip very dark or very light pixels (usually not interesting)
          const brightness = (r + g + b) / 3;
          if (brightness < 20 || brightness > 235) continue;
          
          samples.push({ r, g, b });
        }
        
        if (samples.length === 0) {
          resolve([]);
          return;
        }
        
        // Simple k-means clustering to find dominant colors
        let clusters: RGB[] = [];
        
        // Initialize clusters with random samples
        for (let i = 0; i < numColors; i++) {
          const idx = Math.floor(Math.random() * samples.length);
          clusters.push({ ...samples[idx] });
        }
        
        // Run k-means iterations
        for (let iter = 0; iter < 10; iter++) {
          // Assign samples to nearest cluster
          const assignments: number[] = [];
          for (const sample of samples) {
            let minDist = Infinity;
            let minIdx = 0;
            
            for (let i = 0; i < clusters.length; i++) {
              const dist = colorDistance(sample, clusters[i]);
              if (dist < minDist) {
                minDist = dist;
                minIdx = i;
              }
            }
            
            assignments.push(minIdx);
          }
          
          // Update cluster centers
          const newClusters: RGB[] = Array(numColors).fill(null).map(() => ({ r: 0, g: 0, b: 0 }));
          const counts = Array(numColors).fill(0);
          
          for (let i = 0; i < samples.length; i++) {
            const clusterIdx = assignments[i];
            newClusters[clusterIdx].r += samples[i].r;
            newClusters[clusterIdx].g += samples[i].g;
            newClusters[clusterIdx].b += samples[i].b;
            counts[clusterIdx]++;
          }
          
          for (let i = 0; i < numColors; i++) {
            if (counts[i] > 0) {
              clusters[i] = {
                r: Math.round(newClusters[i].r / counts[i]),
                g: Math.round(newClusters[i].g / counts[i]),
                b: Math.round(newClusters[i].b / counts[i]),
              };
            }
          }
        }
        
        // Convert to hex and return
        const colors = clusters
          .filter(c => c.r !== 0 || c.g !== 0 || c.b !== 0)
          .map(c => rgbToHex(c.r, c.g, c.b));
        
        resolve(colors);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

export function generateComplementaryColor(hex: string): string {
  // Remove #
  const rgb = hex.replace('#', '');
  const r = parseInt(rgb.substr(0, 2), 16);
  const g = parseInt(rgb.substr(2, 2), 16);
  const b = parseInt(rgb.substr(4, 2), 16);
  
  // Complementary is opposite on color wheel (180° hue shift)
  // Convert to HSL, shift hue, convert back
  return rgbToHex(255 - r, 255 - g, 255 - b);
}

export function generateAnalogousColors(hex: string, count: number = 2): string[] {
  // This is a simplified version - would need full RGB->HSL->RGB conversion for accuracy
  const colors: string[] = [];
  
  const rgb = hex.replace('#', '');
  let r = parseInt(rgb.substr(0, 2), 16);
  let g = parseInt(rgb.substr(2, 2), 16);
  let b = parseInt(rgb.substr(4, 2), 16);
  
  for (let i = 0; i < count; i++) {
    // Shift colors slightly
    r = (r + 30) % 256;
    g = (g - 15) % 256;
    b = (b + 45) % 256;
    colors.push(rgbToHex(Math.max(0, r), Math.max(0, g), Math.max(0, b)));
  }
  
  return colors;
}
