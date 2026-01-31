import React, { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { CanvasObject } from '@/store/deckforge';
import { DECK_WIDTH, DECK_HEIGHT } from './WorkbenchStage';

interface DeckGenerator3DProps {
  objects: CanvasObject[];
  onClose: () => void;
}

interface DeckParams {
  length: number;        // mm
  width: number;         // mm
  concaveDepth: number;  // mm
  noseKick: number;      // degrees
  tailKick: number;      // degrees
  thickness: number;     // mm
}

const DEFAULT_PARAMS: DeckParams = {
  length: 96,
  width: 26,
  concaveDepth: 2,
  noseKick: 15,
  tailKick: 18,
  thickness: 5,
};

// Deck shape presets
const DECK_PRESETS = {
  classic: {
    name: 'Classic Popsicle',
    params: { length: 96, width: 26, concaveDepth: 2, noseKick: 15, tailKick: 18, thickness: 5 },
  },
  street: {
    name: 'Street Deck',
    params: { length: 96, width: 28, concaveDepth: 2.5, noseKick: 18, tailKick: 20, thickness: 5 },
  },
  vert: {
    name: 'Vert Deck',
    params: { length: 100, width: 30, concaveDepth: 3, noseKick: 12, tailKick: 14, thickness: 6 },
  },
  cruiser: {
    name: 'Cruiser',
    params: { length: 90, width: 24, concaveDepth: 1.5, noseKick: 10, tailKick: 12, thickness: 4.5 },
  },
  tech: {
    name: 'Tech Deck',
    params: { length: 94, width: 25, concaveDepth: 3.5, noseKick: 20, tailKick: 22, thickness: 5 },
  },
};

function FingerboardDeck({ 
  params, 
  textureUrl 
}: { 
  params: DeckParams; 
  textureUrl: string | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Load texture from data URL
  React.useEffect(() => {
    if (textureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(textureUrl, (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        setTexture(loadedTexture);
      });
    }
  }, [textureUrl]);

  // Create deck geometry with concave and kicks
  const geometry = React.useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    const widthSegments = 40;
    const lengthSegments = 80;
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    
    const { length, width, concaveDepth, noseKick, tailKick, thickness } = params;
    
    // Convert degrees to radians
    const noseKickRad = (noseKick * Math.PI) / 180;
    const tailKickRad = (tailKick * Math.PI) / 180;
    
    // Generate top surface with concave and kicks
    for (let i = 0; i <= lengthSegments; i++) {
      for (let j = 0; j <= widthSegments; j++) {
        const x = (i / lengthSegments) * length - length / 2;
        const z = (j / widthSegments) * width - width / 2;
        
        // Concave curve (parabolic)
        const concave = -concaveDepth * (1 - Math.pow(2 * j / widthSegments - 1, 2));
        
        // Nose and tail kicks
        let kickY = 0;
        const normalizedX = i / lengthSegments;
        
        if (normalizedX < 0.15) {
          // Tail kick (smooth curve)
          const t = normalizedX / 0.15;
          kickY = (length / 2) * Math.sin(tailKickRad) * (1 - Math.cos(t * Math.PI / 2));
        } else if (normalizedX > 0.85) {
          // Nose kick (smooth curve)
          const t = (normalizedX - 0.85) / 0.15;
          kickY = (length / 2) * Math.sin(noseKickRad) * Math.sin(t * Math.PI / 2);
        }
        
        const y = concave + kickY;
        
        vertices.push(x, y, z);
        uvs.push(i / lengthSegments, j / widthSegments);
      }
    }
    
    // Generate indices for triangles
    for (let i = 0; i < lengthSegments; i++) {
      for (let j = 0; j < widthSegments; j++) {
        const a = i * (widthSegments + 1) + j;
        const b = a + widthSegments + 1;
        
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }
    
    // Add bottom surface (flat, offset by thickness)
    const topVertexCount = vertices.length / 3;
    for (let i = 0; i <= lengthSegments; i++) {
      for (let j = 0; j <= widthSegments; j++) {
        const x = (i / lengthSegments) * length - length / 2;
        const z = (j / widthSegments) * width - width / 2;
        const y = -thickness;
        
        vertices.push(x, y, z);
        uvs.push(i / lengthSegments, j / widthSegments);
      }
    }
    
    // Bottom surface indices (reversed winding)
    for (let i = 0; i < lengthSegments; i++) {
      for (let j = 0; j < widthSegments; j++) {
        const a = topVertexCount + i * (widthSegments + 1) + j;
        const b = a + widthSegments + 1;
        
        indices.push(a, a + 1, b);
        indices.push(b, a + 1, b + 1);
      }
    }
    
    // Add side edges to connect top and bottom
    // Left edge
    for (let i = 0; i < lengthSegments; i++) {
      const topA = i * (widthSegments + 1);
      const topB = (i + 1) * (widthSegments + 1);
      const botA = topVertexCount + topA;
      const botB = topVertexCount + topB;
      
      indices.push(topA, botA, topB);
      indices.push(botA, botB, topB);
    }
    
    // Right edge
    for (let i = 0; i < lengthSegments; i++) {
      const topA = i * (widthSegments + 1) + widthSegments;
      const topB = (i + 1) * (widthSegments + 1) + widthSegments;
      const botA = topVertexCount + topA;
      const botB = topVertexCount + topB;
      
      indices.push(topA, topB, botA);
      indices.push(botA, topB, botB);
    }
    
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    return geo;
  }, [params]);

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        map={texture}
        side={THREE.DoubleSide}
        color={texture ? '#ffffff' : '#8b7355'}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function Scene({ params, textureUrl }: { params: DeckParams; textureUrl: string | null }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[120, 80, 120]} fov={35} />
      <OrbitControls 
        enableDamping
        dampingFactor={0.05}
        minDistance={50}
        maxDistance={300}
        autoRotate
        autoRotateSpeed={0.5}
      />
      
      {/* Better lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[50, 50, 50]} 
        intensity={1.2} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-50, 30, -50]} intensity={0.4} />
      <pointLight position={[0, 50, 0]} intensity={0.3} color="#ffffff" />
      
      <FingerboardDeck params={params} textureUrl={textureUrl} />
      
      {/* Grid floor */}
      <gridHelper args={[300, 30, '#444444', '#2a2a2a']} position={[0, -10, 0]} />
      
      {/* Shadow catcher plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </>
  );
}

export default function DeckGenerator3D({ objects, onClose }: DeckGenerator3DProps) {
  const [params, setParams] = useState<DeckParams>(DEFAULT_PARAMS);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Generate high-quality texture from objects using canvas
  React.useEffect(() => {
    const canvas = document.createElement('canvas');
    const scale = 4; // Higher resolution for better quality
    canvas.width = DECK_WIDTH * scale;
    canvas.height = DECK_HEIGHT * scale;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Scale context for high-res rendering
    ctx.scale(scale, scale);
    
    // Background (wood texture color)
    ctx.fillStyle = '#f5e6d3';
    ctx.fillRect(0, 0, DECK_WIDTH, DECK_HEIGHT);
    
    // Render each object
    objects.forEach(obj => {
      ctx.save();
      
      // Apply opacity
      ctx.globalAlpha = obj.opacity || 1;
      
      // Apply rotation
      if (obj.rotation) {
        const centerX = obj.x + (obj.width || obj.radius || 0);
        const centerY = obj.y + (obj.height || obj.radius || 0);
        ctx.translate(centerX, centerY);
        ctx.rotate((obj.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      // Render based on type
      switch (obj.type) {
        case 'rect':
          if (obj.fill && obj.fill !== 'none') {
            ctx.fillStyle = obj.fill;
            ctx.fillRect(obj.x, obj.y, obj.width || 0, obj.height || 0);
          }
          if (obj.stroke) {
            ctx.strokeStyle = obj.stroke;
            ctx.lineWidth = obj.strokeWidth || 1;
            ctx.strokeRect(obj.x, obj.y, obj.width || 0, obj.height || 0);
          }
          break;
          
        case 'circle':
          ctx.beginPath();
          ctx.arc(obj.x + (obj.radius || 0), obj.y + (obj.radius || 0), obj.radius || 0, 0, Math.PI * 2);
          if (obj.fill && obj.fill !== 'none') {
            ctx.fillStyle = obj.fill;
            ctx.fill();
          }
          if (obj.stroke) {
            ctx.strokeStyle = obj.stroke;
            ctx.lineWidth = obj.strokeWidth || 1;
            ctx.stroke();
          }
          break;
          
        case 'text':
          ctx.font = `${obj.fontSize || 16}px ${obj.fontFamily || 'Arial'}`;
          ctx.fillStyle = obj.fill || '#000';
          ctx.textAlign = obj.align as CanvasTextAlign || 'left';
          ctx.fillText(obj.text || '', obj.x, obj.y);
          break;
          
        case 'line':
          if (obj.points && obj.points.length >= 4) {
            ctx.beginPath();
            ctx.moveTo(obj.points[0], obj.points[1]);
            for (let i = 2; i < obj.points.length; i += 2) {
              ctx.lineTo(obj.points[i], obj.points[i + 1]);
            }
            ctx.strokeStyle = obj.stroke || '#000';
            ctx.lineWidth = obj.strokeWidth || 2;
            ctx.stroke();
          }
          break;
      }
      
      ctx.restore();
    });
    
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png');
    setTextureUrl(dataUrl);
  }, [objects]);

  const handleParamChange = useCallback((key: keyof DeckParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const exportSTL = useCallback(() => {
    setExporting(true);
    
    // Create a temporary scene with the deck
    const scene = new THREE.Scene();
    const geometry = new THREE.BufferGeometry();
    
    // Recreate geometry (same as in component)
    const widthSegments = 40;
    const lengthSegments = 80;
    const vertices: number[] = [];
    const indices: number[] = [];
    
    const { length, width, concaveDepth, noseKick, tailKick, thickness } = params;
    
    const noseKickRad = (noseKick * Math.PI) / 180;
    const tailKickRad = (tailKick * Math.PI) / 180;
    
    // Top surface
    for (let i = 0; i <= lengthSegments; i++) {
      for (let j = 0; j <= widthSegments; j++) {
        const x = (i / lengthSegments) * length - length / 2;
        const z = (j / widthSegments) * width - width / 2;
        const concave = -concaveDepth * (1 - Math.pow(2 * j / widthSegments - 1, 2));
        
        let kickY = 0;
        const normalizedX = i / lengthSegments;
        if (normalizedX < 0.15) {
          const t = normalizedX / 0.15;
          kickY = (length / 2) * Math.sin(tailKickRad) * (1 - Math.cos(t * Math.PI / 2));
        } else if (normalizedX > 0.85) {
          const t = (normalizedX - 0.85) / 0.15;
          kickY = (length / 2) * Math.sin(noseKickRad) * Math.sin(t * Math.PI / 2);
        }
        
        vertices.push(x, concave + kickY, z);
      }
    }
    
    // Indices
    for (let i = 0; i < lengthSegments; i++) {
      for (let j = 0; j < widthSegments; j++) {
        const a = i * (widthSegments + 1) + j;
        const b = a + widthSegments + 1;
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }
    
    // Bottom surface
    const topVertexCount = vertices.length / 3;
    for (let i = 0; i <= lengthSegments; i++) {
      for (let j = 0; j <= widthSegments; j++) {
        const x = (i / lengthSegments) * length - length / 2;
        const z = (j / widthSegments) * width - width / 2;
        vertices.push(x, -thickness, z);
      }
    }
    
    for (let i = 0; i < lengthSegments; i++) {
      for (let j = 0; j < widthSegments; j++) {
        const a = topVertexCount + i * (widthSegments + 1) + j;
        const b = a + widthSegments + 1;
        indices.push(a, a + 1, b);
        indices.push(b, a + 1, b + 1);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    scene.add(mesh);
    
    // Export to STL
    const exporter = new STLExporter();
    const stlString = exporter.parse(scene);
    const blob = new Blob([stlString], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fingerboard-deck-${Date.now()}.stl`;
    link.click();
    
    setExporting(false);
  }, [params]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">3D Deck Generator</h2>
          <p className="text-sm text-gray-400">Convert your design to a 3D-printable model</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Controls Panel */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700/50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-white mb-1">🖨️ 3D Print Your Design</h3>
              <p className="text-xs text-gray-300">
                Turn your 2D deck art into a physical fingerboard. Adjust the shape, export as STL, 
                and send to any 3D printing service.
              </p>
            </div>

            {/* Preset Shapes */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Deck Shape Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DECK_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setParams(preset.params)}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors border border-gray-600"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Custom Parameters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Length: {params.length}mm
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="110"
                    step="1"
                    value={params.length}
                    onChange={(e) => handleParamChange('length', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Width: {params.width}mm
                  </label>
                  <input
                    type="range"
                    min="22"
                    max="32"
                    step="0.5"
                    value={params.width}
                    onChange={(e) => handleParamChange('width', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Concave Depth: {params.concaveDepth}mm
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.1"
                    value={params.concaveDepth}
                    onChange={(e) => handleParamChange('concaveDepth', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Nose Kick: {params.noseKick}°
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={params.noseKick}
                    onChange={(e) => handleParamChange('noseKick', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Tail Kick: {params.tailKick}°
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={params.tailKick}
                    onChange={(e) => handleParamChange('tailKick', Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Thickness: {params.thickness}mm
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="8"
                    step="0.5"
                    value={params.thickness}
                    onChange={(e) => handleParamChange('thickness', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Deck Stats */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-2">Deck Info</h3>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span>{(params.length * params.width * params.thickness / 1000).toFixed(2)} cm³</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Weight (PLA):</span>
                  <span>{(params.length * params.width * params.thickness / 1000 * 1.24).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Print Time (~):</span>
                  <span>{Math.ceil(params.length * params.width * params.thickness / 10000)}h</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={exportSTL}
                disabled={exporting}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                {exporting ? 'Exporting...' : '📥 Export STL for 3D Printing'}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Compatible with Shapeways, Sculpteo, and local 3D printers
              </p>
              <p className="text-xs text-gray-600 mt-1 text-center">
                Recommended: PLA or ABS filament, 0.2mm layer height
              </p>
            </div>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="flex-1 bg-black">
          <Canvas shadows>
            <Scene params={params} textureUrl={textureUrl} />
          </Canvas>
        </div>
      </div>
    </div>
  );
}
