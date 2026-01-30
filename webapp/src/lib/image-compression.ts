/**
 * Image compression utilities for reducing file sizes before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, only for JPEG
  maxSizeMB?: number;
  convertToJPEG?: boolean; // Convert PNG to JPEG if beneficial
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.85,
  maxSizeMB: 2,
  convertToJPEG: false,
};

/**
 * Compress an image file while preserving quality
 * Returns a new File object with reduced size
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for SVG files
  if (file.type === 'image/svg+xml') {
    return file;
  }

  // Check if already small enough
  const fileSizeMB = file.size / (1024 * 1024);
  if (opts.maxSizeMB && fileSizeMB < opts.maxSizeMB * 0.5) {
    // Already less than half the target size, don't compress
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        URL.revokeObjectURL(url);

        // Calculate target dimensions
        let { width, height } = img;
        const maxW = opts.maxWidth || width;
        const maxH = opts.maxHeight || height;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format
        let outputType = file.type;
        let quality = opts.quality || 0.85;

        // Convert PNG to JPEG if it would save space (and conversion allowed)
        if (opts.convertToJPEG && file.type === 'image/png') {
          // PNG with no transparency can benefit from JPEG conversion
          const imageData = ctx.getImageData(0, 0, width, height);
          const hasTransparency = checkTransparency(imageData);
          
          if (!hasTransparency) {
            outputType = 'image/jpeg';
          }
        }

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if compression actually reduced size
            if (blob.size >= file.size) {
              // Compressed version is larger, return original
              resolve(file);
              return;
            }

            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          outputType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Check if image has transparency
 */
function checkTransparency(imageData: ImageData): boolean {
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true; // Found transparent pixel
    }
  }
  return false;
}

/**
 * Get image file size in MB
 */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
