import JSZip from 'jszip';
import { exportToPNG } from './export';
import { CanvasObject } from '@/store/deckforge';

export interface DesignForExport {
  id: string;
  name: string;
  canvas_data: {
    objects: CanvasObject[];
  };
}

export async function batchExportDesigns(
  designs: DesignForExport[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('deckforge-designs');

  if (!folder) {
    throw new Error('Failed to create ZIP folder');
  }

  for (let i = 0; i < designs.length; i++) {
    const design = designs[i];
    
    // Update progress
    onProgress?.(i + 1, designs.length);

    try {
      // Export design to PNG
      const blob = await exportToPNG(design.canvas_data.objects, {
        scale: 3,
        format: 'png',
        includeBackground: true,
      });

      // Generate safe filename
      const safeFilename = design.name
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const filename = `${safeFilename}_${design.id.slice(0, 8)}.png`;

      // Add to ZIP
      folder.file(filename, blob);
    } catch (error) {
      console.error(`Failed to export design ${design.name}:`, error);
      // Continue with other designs even if one fails
    }
  }

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  return zipBlob;
}

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
