import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Group, Text } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Grid3X3, Ruler, Save, Share2, Trash2, RotateCcw, FolderOpen, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import Konva from 'konva';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  saveProject,
  loadProject,
  getMyProjects,
  deleteProject,
  calculateMaterials,
  type ParkObject,
  type FingerparkProject,
  type MaterialsEstimate,
} from '@/lib/fingerpark';

const GRID_SIZE = 20; // pixels per inch
const CANVAS_WIDTH = 48 * GRID_SIZE; // 48 inches (4 feet)
const CANVAS_HEIGHT = 36 * GRID_SIZE; // 36 inches (3 feet)

const OBSTACLES = {
  rails: [
    { id: 'flat-rail', name: 'Flat Rail', icon: '▬', defaultWidth: 8, defaultLength: 12, defaultHeight: 2 },
    { id: 'round-rail', name: 'Round Rail', icon: '─', defaultWidth: 8, defaultLength: 12, defaultHeight: 2 },
    { id: 'kinked-rail', name: 'Kinked Rail', icon: '╲', defaultWidth: 8, defaultLength: 12, defaultHeight: 2 },
  ],
  ledges: [
    { id: 'flat-ledge', name: 'Flat Ledge', icon: '▭', defaultWidth: 12, defaultLength: 16, defaultHeight: 3 },
    { id: 'angled-ledge', name: 'Angled Ledge', icon: '⟋', defaultWidth: 12, defaultLength: 16, defaultHeight: 3 },
  ],
  stairs: [
    { id: 'stair-set', name: 'Stair Set', icon: '▞', defaultWidth: 12, defaultLength: 12, defaultHeight: 4 },
    { id: 'gap', name: 'Gap', icon: '⎯⎯', defaultWidth: 12, defaultLength: 8, defaultHeight: 2 },
  ],
  ramps: [
    { id: 'quarter-pipe', name: 'Quarter Pipe', icon: '◜', defaultWidth: 12, defaultLength: 8, defaultHeight: 6 },
    { id: 'bank-ramp', name: 'Bank Ramp', icon: '◢', defaultWidth: 12, defaultLength: 8, defaultHeight: 4 },
    { id: 'launch-ramp', name: 'Launch Ramp', icon: '▲', defaultWidth: 10, defaultLength: 6, defaultHeight: 3 },
  ],
  boxes: [
    { id: 'flat-box', name: 'Flat Box', icon: '▢', defaultWidth: 12, defaultLength: 12, defaultHeight: 3 },
    { id: 'pyramid', name: 'Pyramid', icon: '▲', defaultWidth: 12, defaultLength: 12, defaultHeight: 4 },
    { id: 'manual-pad', name: 'Manual Pad', icon: '▬', defaultWidth: 16, defaultLength: 4, defaultHeight: 2 },
  ],
};

export default function FingerparkBuilder() {
  const [objects, setObjects] = useState<ParkObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [parkName, setParkName] = useState('My Fingerpark Setup');
  const stageRef = useRef<Konva.Stage>(null);

  // Save/Load state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showMaterialsDialog, setShowMaterialsDialog] = useState(false);
  const [saveDescription, setSaveDescription] = useState('');
  const [saveAsPublic, setSaveAsPublic] = useState(false);
  const [myProjects, setMyProjects] = useState<FingerparkProject[]>([]);
  const [materials, setMaterials] = useState<MaterialsEstimate | null>(null);

  const addObstacle = (obstacleTemplate: any) => {
    const newObstacle: ParkObject = {
      id: `${obstacleTemplate.id}-${Date.now()}`,
      type: obstacleTemplate.id.includes('rail') ? 'rail' :
            obstacleTemplate.id.includes('ledge') ? 'ledge' :
            obstacleTemplate.id.includes('stair') || obstacleTemplate.id.includes('gap') ? 'stairs' :
            obstacleTemplate.id.includes('ramp') || obstacleTemplate.id.includes('quarter') || obstacleTemplate.id.includes('bank') || obstacleTemplate.id.includes('launch') ? 'ramp' : 'box',
      subtype: obstacleTemplate.id,
      x: CANVAS_WIDTH / 2 - (obstacleTemplate.defaultLength * GRID_SIZE) / 2,
      y: CANVAS_HEIGHT / 2 - (obstacleTemplate.defaultWidth * GRID_SIZE) / 2,
      width: obstacleTemplate.defaultWidth * GRID_SIZE,
      length: obstacleTemplate.defaultLength * GRID_SIZE,
      height: obstacleTemplate.defaultHeight,
      rotation: 0,
      color: '#8B4513', // Brown wood color
    };

    setObjects([...objects, newObstacle]);
    setSelectedId(newObstacle.id);
    toast.success(`Added ${obstacleTemplate.name}`);
  };

  const updateObject = (id: string, updates: Partial<ParkObject>) => {
    setObjects(objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setObjects(objects.filter(obj => obj.id !== selectedId));
    setSelectedId(null);
    toast.success('Obstacle deleted');
  };

  const clearCanvas = () => {
    if (!confirm('Clear all obstacles?')) return;
    setObjects([]);
    setSelectedId(null);
    toast.success('Canvas cleared');
  };

  const exportBlueprint = () => {
    if (!stageRef.current) return;
    
    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${parkName.replace(/[^a-z0-9]/gi, '_')}_blueprint.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Blueprint exported!');
  };

  const handleSave = async () => {
    const result = await saveProject(parkName, objects, saveDescription, saveAsPublic, currentProjectId || undefined);
    if (result.success) {
      setCurrentProjectId(result.projectId || null);
      setShowSaveDialog(false);
      toast.success('Project saved!');
      setSaveDescription('');
      setSaveAsPublic(false);
    } else {
      toast.error(result.error || 'Failed to save project');
    }
  };

  const handleLoad = async (projectId: string) => {
    const project = await loadProject(projectId);
    if (project) {
      setObjects(project.objects);
      setParkName(project.name);
      setCurrentProjectId(project.id);
      setShowLoadDialog(false);
      toast.success(`Loaded "${project.name}"`);
    } else {
      toast.error('Failed to load project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Delete this project?')) return;
    const success = await deleteProject(projectId);
    if (success) {
      toast.success('Project deleted');
      loadMyProjects();
    } else {
      toast.error('Failed to delete project');
    }
  };

  const loadMyProjects = async () => {
    const projects = await getMyProjects();
    setMyProjects(projects);
  };

  const showMaterialsList = () => {
    const estimate = calculateMaterials(objects);
    setMaterials(estimate);
    setShowMaterialsDialog(true);
  };

  const selectedObject = objects.find(obj => obj.id === selectedId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Fingerpark Builder</h1>
            <Input
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
              className="w-64 h-8"
              placeholder="Park name..."
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className="gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              {showGrid ? 'Hide' : 'Show'} Grid
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadMyProjects();
                setShowLoadDialog(true);
              }}
              className="gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Load
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={showMaterialsList}
              className="gap-2"
              disabled={objects.length === 0}
            >
              <ShoppingCart className="w-4 h-4" />
              Materials List
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportBlueprint}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export Blueprint
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Obstacle Library Sidebar */}
        <div className="w-64 border-r border-border bg-card overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">
                Rails
              </h3>
              <div className="space-y-1">
                {OBSTACLES.rails.map((obstacle) => (
                  <button
                    key={obstacle.id}
                    onClick={() => addObstacle(obstacle)}
                    className="w-full text-left px-3 py-2 rounded bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span className="text-lg">{obstacle.icon}</span>
                    <span>{obstacle.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">
                Ledges
              </h3>
              <div className="space-y-1">
                {OBSTACLES.ledges.map((obstacle) => (
                  <button
                    key={obstacle.id}
                    onClick={() => addObstacle(obstacle)}
                    className="w-full text-left px-3 py-2 rounded bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span className="text-lg">{obstacle.icon}</span>
                    <span>{obstacle.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">
                Stairs
              </h3>
              <div className="space-y-1">
                {OBSTACLES.stairs.map((obstacle) => (
                  <button
                    key={obstacle.id}
                    onClick={() => addObstacle(obstacle)}
                    className="w-full text-left px-3 py-2 rounded bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span className="text-lg">{obstacle.icon}</span>
                    <span>{obstacle.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">
                Ramps
              </h3>
              <div className="space-y-1">
                {OBSTACLES.ramps.map((obstacle) => (
                  <button
                    key={obstacle.id}
                    onClick={() => addObstacle(obstacle)}
                    className="w-full text-left px-3 py-2 rounded bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span className="text-lg">{obstacle.icon}</span>
                    <span>{obstacle.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wider">
                Boxes
              </h3>
              <div className="space-y-1">
                {OBSTACLES.boxes.map((obstacle) => (
                  <button
                    key={obstacle.id}
                    onClick={() => addObstacle(obstacle)}
                    className="w-full text-left px-3 py-2 rounded bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span className="text-lg">{obstacle.icon}</span>
                    <span>{obstacle.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col bg-muted/20 overflow-auto">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-lg" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
              <Stage
                ref={stageRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={(e) => {
                  // Deselect when clicking on empty area
                  const clickedOnEmpty = e.target === e.target.getStage();
                  if (clickedOnEmpty) {
                    setSelectedId(null);
                  }
                }}
              >
                <Layer>
                  {/* Grid */}
                  {showGrid && (
                    <Group>
                      {Array.from({ length: Math.ceil(CANVAS_WIDTH / GRID_SIZE) + 1 }).map((_, i) => (
                        <Line
                          key={`v-${i}`}
                          points={[i * GRID_SIZE, 0, i * GRID_SIZE, CANVAS_HEIGHT]}
                          stroke="#e0e0e0"
                          strokeWidth={i % 5 === 0 ? 1.5 : 0.5}
                        />
                      ))}
                      {Array.from({ length: Math.ceil(CANVAS_HEIGHT / GRID_SIZE) + 1 }).map((_, i) => (
                        <Line
                          key={`h-${i}`}
                          points={[0, i * GRID_SIZE, CANVAS_WIDTH, i * GRID_SIZE]}
                          stroke="#e0e0e0"
                          strokeWidth={i % 5 === 0 ? 1.5 : 0.5}
                        />
                      ))}
                    </Group>
                  )}

                  {/* Obstacles */}
                  {objects.map((obj) => (
                    <Group
                      key={obj.id}
                      x={obj.x}
                      y={obj.y}
                      rotation={obj.rotation}
                      draggable
                      onClick={() => setSelectedId(obj.id)}
                      onDragEnd={(e) => {
                        updateObject(obj.id, {
                          x: e.target.x(),
                          y: e.target.y(),
                        });
                      }}
                    >
                      <Rect
                        width={obj.length}
                        height={obj.width}
                        fill={obj.color}
                        stroke={selectedId === obj.id ? '#3b82f6' : '#666'}
                        strokeWidth={selectedId === obj.id ? 3 : 1}
                        shadowColor="black"
                        shadowBlur={5}
                        shadowOpacity={0.3}
                        shadowOffsetY={2}
                      />
                      <Text
                        text={`${(obj.length / GRID_SIZE).toFixed(1)}" × ${(obj.width / GRID_SIZE).toFixed(1)}"`}
                        fontSize={10}
                        fill="white"
                        align="center"
                        verticalAlign="middle"
                        width={obj.length}
                        height={obj.width}
                      />
                    </Group>
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>

          {/* Canvas Footer */}
          <div className="border-t border-border bg-card px-4 py-2 text-sm text-muted-foreground">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
              <div>
                Canvas: {CANVAS_WIDTH / GRID_SIZE}" × {CANVAS_HEIGHT / GRID_SIZE}" | Grid: {showGrid ? 'On' : 'Off'}
              </div>
              <div>
                Objects: {objects.length} | Selected: {selectedId ? 'Yes' : 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedObject && (
          <div className="w-64 border-l border-border bg-card p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                  Properties
                </h3>
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <Label className="text-xs">Length (inches)</Label>
                <Input
                  type="number"
                  value={(selectedObject.length / GRID_SIZE).toFixed(1)}
                  onChange={(e) => updateObject(selectedId!, {
                    length: parseFloat(e.target.value) * GRID_SIZE
                  })}
                  step="0.5"
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Width (inches)</Label>
                <Input
                  type="number"
                  value={(selectedObject.width / GRID_SIZE).toFixed(1)}
                  onChange={(e) => updateObject(selectedId!, {
                    width: parseFloat(e.target.value) * GRID_SIZE
                  })}
                  step="0.5"
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Height (inches)</Label>
                <Input
                  type="number"
                  value={selectedObject.height}
                  onChange={(e) => updateObject(selectedId!, {
                    height: parseFloat(e.target.value)
                  })}
                  step="0.5"
                  className="h-8"
                />
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <Label className="text-xs">Rotation (degrees)</Label>
                <Input
                  type="number"
                  value={selectedObject.rotation}
                  onChange={(e) => updateObject(selectedId!, {
                    rotation: parseFloat(e.target.value)
                  })}
                  step="15"
                  className="h-8"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <input
                  type="color"
                  value={selectedObject.color}
                  onChange={(e) => updateObject(selectedId!, {
                    color: e.target.value
                  })}
                  className="w-full h-8 border border-border rounded"
                />
              </div>

              {/* Delete */}
              <Button
                onClick={deleteSelected}
                variant="destructive"
                className="w-full gap-2"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Obstacle
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Fingerpark Project</DialogTitle>
            <DialogDescription>
              Save your park setup to load later or share with others
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={parkName}
                onChange={(e) => setParkName(e.target.value)}
                placeholder="My awesome park setup..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Describe your park setup..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="public"
                checked={saveAsPublic}
                onChange={(e) => setSaveAsPublic(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="public" className="cursor-pointer">
                Make this project public (others can view and use it)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Load Fingerpark Project</DialogTitle>
            <DialogDescription>
              Select a saved project to load
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {myProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved projects yet. Create your first park setup!
              </div>
            ) : (
              <div className="space-y-2">
                {myProjects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{project.objects.length} obstacles</span>
                          <span>
                            Updated {new Date(project.updated_at).toLocaleDateString()}
                          </span>
                          {project.is_public && (
                            <span className="text-blue-500">Public</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleLoad(project.id)}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Materials List Dialog */}
      <Dialog open={showMaterialsDialog} onOpenChange={setShowMaterialsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Materials Estimate</DialogTitle>
            <DialogDescription>
              Estimated materials needed to build this park setup
            </DialogDescription>
          </DialogHeader>
          {materials && (
            <div className="space-y-4 py-4">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <div className="font-semibold text-foreground">Plywood</div>
                    <div className="text-sm text-muted-foreground">{materials.plywood.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{materials.plywood.sheets} sheets</div>
                    <div className="text-sm text-muted-foreground">
                      ${materials.plywood.cost.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <div className="font-semibold text-foreground">Lumber</div>
                    <div className="text-sm text-muted-foreground">{materials.lumber.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{materials.lumber.boards} boards</div>
                    <div className="text-sm text-muted-foreground">
                      ${materials.lumber.cost.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <div className="font-semibold text-foreground">Screws</div>
                    <div className="text-sm text-muted-foreground">{materials.screws.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">~{materials.screws.count} screws</div>
                    <div className="text-sm text-muted-foreground">
                      ${materials.screws.cost.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <div className="font-semibold text-foreground">Sandpaper</div>
                    <div className="text-sm text-muted-foreground">120-220 grit</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{materials.sandpaper.sheets} sheets</div>
                    <div className="text-sm text-muted-foreground">
                      ${materials.sandpaper.cost.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t-2 border-border">
                  <div className="font-bold text-lg text-foreground">Estimated Total</div>
                  <div className="font-bold text-lg text-foreground">
                    ${materials.total.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3">
                <p className="font-semibold mb-1">Note:</p>
                <p>
                  Prices are estimates and may vary by location. This list includes basic
                  materials. You may also need: wood glue, paint/stain, measuring tools,
                  saw, drill, and safety equipment.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowMaterialsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
