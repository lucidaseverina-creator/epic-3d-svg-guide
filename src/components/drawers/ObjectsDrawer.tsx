import React from 'react';
import { Box, Circle, Cylinder, Hexagon, Triangle, Donut, Trash2, Eye, EyeOff, Lock, Unlock, Droplets, Cloud, Flame } from 'lucide-react';
import { SceneObject, PrimitiveType } from '@/types/engine';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ObjectsDrawerProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: PrimitiveType) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
}

const primitiveButtons: { type: PrimitiveType; icon: React.ReactNode; label: string }[] = [
  { type: 'box', icon: <Box className="w-4 h-4" />, label: 'Box' },
  { type: 'sphere', icon: <Circle className="w-4 h-4" />, label: 'Sphere' },
  { type: 'cylinder', icon: <Cylinder className="w-4 h-4" />, label: 'Cylinder' },
  { type: 'cone', icon: <Triangle className="w-4 h-4" />, label: 'Cone' },
  { type: 'torus', icon: <Donut className="w-4 h-4" />, label: 'Torus' },
  { type: 'pyramid', icon: <Hexagon className="w-4 h-4" />, label: 'Pyramid' },
];

const effectButtons: { type: PrimitiveType; icon: React.ReactNode; label: string }[] = [
  { type: 'metaballs', icon: <Flame className="w-4 h-4 text-orange-500" />, label: 'Metaballs' },
  { type: 'fluidBlob', icon: <Droplets className="w-4 h-4 text-blue-400" />, label: 'Fluid' },
  { type: 'cloudVolume', icon: <Cloud className="w-4 h-4 text-gray-300" />, label: 'Cloud' },
];

export const ObjectsDrawer: React.FC<ObjectsDrawerProps> = ({
  objects,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onToggleVisibility,
  onToggleLock,
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Add primitives */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          Add Primitive
        </div>
        <div className="grid grid-cols-3 gap-2">
          {primitiveButtons.map((prim) => (
            <Button
              key={prim.type}
              variant="outline"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 bg-secondary/30 border-border/50 hover:bg-secondary hover:border-primary/50"
              onClick={() => onAdd(prim.type)}
            >
              {prim.icon}
              <span className="text-[10px]">{prim.label}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Add 3D Effects */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          Add 3D Effect
        </div>
        <div className="grid grid-cols-3 gap-2">
          {effectButtons.map((effect) => (
            <Button
              key={effect.type}
              variant="outline"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 bg-secondary/30 border-border/50 hover:bg-secondary hover:border-primary/50"
              onClick={() => onAdd(effect.type)}
            >
              {effect.icon}
              <span className="text-[10px]">{effect.label}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Object list */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          Scene Objects ({objects.length})
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
          {objects.map((obj) => (
            <div
              key={obj.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded cursor-pointer",
                "border border-transparent hover:border-border/50",
                "transition-all duration-150",
                selectedId === obj.id && "bg-primary/10 border-primary/30"
              )}
              onClick={() => onSelect(obj.id)}
            >
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: obj.material.color }}
              />
              
              {/* Name */}
              <span className="flex-1 text-sm truncate">{obj.name}</span>
              
              {/* Type badge */}
              <span className="text-[10px] text-muted-foreground uppercase">
                {obj.type}
              </span>
              
              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  className="p-1 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(obj.id);
                  }}
                >
                  {obj.visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
                <button
                  className="p-1 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(obj.id);
                  }}
                >
                  {obj.locked ? (
                    <Lock className="w-3 h-3 text-warning" />
                  ) : (
                    <Unlock className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
                <button
                  className="p-1 hover:text-destructive transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(obj.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          
          {objects.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No objects in scene
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
