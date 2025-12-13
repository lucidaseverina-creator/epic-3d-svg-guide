import React from 'react';
import { SceneObject, Vector3 } from '@/types/engine';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertiesDrawerProps {
  object: SceneObject | null;
  onUpdate: (id: string, updates: Partial<SceneObject>) => void;
}

interface Vector3InputProps {
  label: string;
  value: Vector3;
  onChange: (value: Vector3) => void;
  step?: number;
}

const Vector3Input: React.FC<Vector3InputProps> = ({
  label,
  value,
  onChange,
  step = 1,
}) => {
  const handleChange = (axis: 'x' | 'y' | 'z', newValue: string) => {
    const num = parseFloat(newValue) || 0;
    onChange({ ...value, [axis]: num });
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-axis-x" />
            <span className="text-[10px] text-axis-x">X</span>
          </div>
          <Input
            type="number"
            value={value.x.toFixed(1)}
            onChange={(e) => handleChange('x', e.target.value)}
            step={step}
            className="h-7 text-xs bg-secondary/50 border-border/50"
          />
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-axis-y" />
            <span className="text-[10px] text-axis-y">Y</span>
          </div>
          <Input
            type="number"
            value={value.y.toFixed(1)}
            onChange={(e) => handleChange('y', e.target.value)}
            step={step}
            className="h-7 text-xs bg-secondary/50 border-border/50"
          />
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-axis-z" />
            <span className="text-[10px] text-axis-z">Z</span>
          </div>
          <Input
            type="number"
            value={value.z.toFixed(1)}
            onChange={(e) => handleChange('z', e.target.value)}
            step={step}
            className="h-7 text-xs bg-secondary/50 border-border/50"
          />
        </div>
      </div>
    </div>
  );
};

export const PropertiesDrawer: React.FC<PropertiesDrawerProps> = ({
  object,
  onUpdate,
}) => {
  if (!object) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-muted-foreground text-sm">
          No object selected
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* Object Info */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          Object Info
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Name</Label>
            <Input
              value={object.name}
              onChange={(e) => onUpdate(object.id, { name: e.target.value })}
              className="h-7 text-xs bg-secondary/50 border-border/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground">Type</Label>
              <div className="h-7 px-2 flex items-center text-xs bg-secondary/30 rounded border border-border/30 capitalize">
                {object.type}
              </div>
            </div>
            <div className="flex-1">
              <Label className="text-[10px] text-muted-foreground">ID</Label>
              <div className="h-7 px-2 flex items-center text-[10px] font-mono bg-secondary/30 rounded border border-border/30 truncate">
                {object.id}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transform */}
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          Transform
        </div>
        
        <Vector3Input
          label="Position"
          value={object.position}
          onChange={(pos) => onUpdate(object.id, { position: pos })}
          step={1}
        />
        
        <Vector3Input
          label="Rotation"
          value={{
            x: object.rotation.x * (180 / Math.PI),
            y: object.rotation.y * (180 / Math.PI),
            z: object.rotation.z * (180 / Math.PI),
          }}
          onChange={(rot) => onUpdate(object.id, { 
            rotation: {
              x: rot.x * (Math.PI / 180),
              y: rot.y * (Math.PI / 180),
              z: rot.z * (Math.PI / 180),
            }
          })}
          step={5}
        />
        
        <Vector3Input
          label="Scale"
          value={object.scale}
          onChange={(scale) => onUpdate(object.id, { scale })}
          step={0.1}
        />
      </div>
      
      {/* Material */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          Material
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border border-border/50"
            style={{ backgroundColor: object.material.color }}
          />
          <Input
            type="color"
            value={object.material.color}
            onChange={(e) => onUpdate(object.id, { 
              material: { ...object.material, color: e.target.value }
            })}
            className="flex-1 h-8 p-0 border-0 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};
