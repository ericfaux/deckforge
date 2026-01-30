import { useState, useEffect } from 'react';
import { useDeckForgeStore } from '@/store/deckforge';

interface SelectionBoxProps {
  deckX: number;
  deckY: number;
  stageScale: number;
}

export function SelectionBox({ deckX, deckY, stageScale }: SelectionBoxProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const { objects, setSelectedIds, activeTool } = useDeckForgeStore();

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Only activate selection box if no tool is active and clicking on empty space
      if (activeTool || !(e.target as HTMLElement).closest('svg')) return;
      
      const svg = (e.target as HTMLElement).closest('svg');
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left - deckX) / stageScale;
      const y = (e.clientY - rect.top - deckY) / stageScale;
      
      setStartPoint({ x, y });
      setEndPoint({ x, y });
      setIsDrawing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      
      const svg = document.querySelector('svg');
      if (!svg) return;
      
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left - deckX) / stageScale;
      const y = (e.clientY - rect.top - deckY) / stageScale;
      
      setEndPoint({ x, y });
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;
      
      // Calculate selection box bounds
      const minX = Math.min(startPoint.x, endPoint.x);
      const maxX = Math.max(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const maxY = Math.max(startPoint.y, endPoint.y);
      
      // Find all objects within the selection box
      const selectedIds = objects
        .filter(obj => {
          // Check if object center is within selection box
          const objCenterX = obj.x + obj.width / 2;
          const objCenterY = obj.y + obj.height / 2;
          
          return (
            objCenterX >= minX &&
            objCenterX <= maxX &&
            objCenterY >= minY &&
            objCenterY <= maxY
          );
        })
        .map(obj => obj.id);
      
      if (selectedIds.length > 0) {
        setSelectedIds(selectedIds);
      }
      
      setIsDrawing(false);
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing, startPoint, endPoint, objects, activeTool, deckX, deckY, stageScale, setSelectedIds]);

  if (!isDrawing) return null;

  const x = Math.min(startPoint.x, endPoint.x);
  const y = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3b82f6"
      strokeWidth={1 / stageScale}
      strokeDasharray={`${4 / stageScale} ${2 / stageScale}`}
      pointerEvents="none"
    />
  );
}
