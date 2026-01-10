// ============================================
// ADD FEATURE DIALOG - Create new features
// ============================================

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FeatureNodeContract, FeatureOperationType, MaskPrimitive } from '@/types/parametric';
import { Plus, Box, Circle, Square, Hexagon } from 'lucide-react';
import { createFeatureNode } from '@/lib/parametric/features';

interface FeatureAddDialogProps {
  onAddFeature: (feature: FeatureNodeContract) => void;
}

const OPERATION_DESCRIPTIONS: Record<FeatureOperationType, string> = {
  patch: 'Add surface displacement',
  recess: 'Create an indented area',
  crease: 'Add a sharp line detail',
  warp: 'Deform with vector field',
  boss: 'Raised protrusion',
  hole: 'Cut-through opening',
};

const MASK_TYPES: { type: MaskPrimitive['type']; label: string; icon: React.ReactNode }[] = [
  { type: 'ellipse', label: 'Ellipse', icon: <Circle className="w-4 h-4" /> },
  { type: 'rect', label: 'Rectangle', icon: <Square className="w-4 h-4" /> },
  { type: 'pill', label: 'Pill', icon: <Box className="w-4 h-4" /> },
  { type: 'polygon', label: 'Polygon', icon: <Hexagon className="w-4 h-4" /> },
];

export const FeatureAddDialog: React.FC<FeatureAddDialogProps> = ({ onAddFeature }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('New Feature');
  const [operation, setOperation] = useState<FeatureOperationType>('recess');
  const [maskType, setMaskType] = useState<MaskPrimitive['type']>('ellipse');
  
  // Position
  const [centerU, setCenterU] = useState(0.5);
  const [centerS, setCenterS] = useState(0.5);
  
  // Size
  const [sizeU, setSizeU] = useState(0.2);
  const [sizeS, setSizeS] = useState(0.2);
  
  // Feature params
  const [depth, setDepth] = useState(0.15);
  const [falloff, setFalloff] = useState(0.05);
  
  const handleCreate = () => {
    const id = `feature_${Date.now()}`;
    
    const mask: MaskPrimitive = {
      type: maskType,
      center: { x: centerU, z: centerS },
      size: { x: sizeU, z: sizeS },
      falloff,
      falloffShape: 'smooth',
    };
    
    const params: Record<string, number | string | boolean> = {};
    
    if (operation === 'recess') {
      params.depth = depth;
      params.wallAngle = 0;
    } else if (operation === 'patch') {
      params.displacement = depth;
      params.direction = 'normal';
    } else if (operation === 'crease') {
      params.startU = centerU - sizeU / 2;
      params.endU = centerU + sizeU / 2;
      params.sPosition = centerS;
      params.width = sizeS;
      params.depth = depth * 0.1;
      params.sharpness = 2;
    }
    
    const feature = createFeatureNode(id, name, operation, mask, params);
    onAddFeature(feature);
    setOpen(false);
    
    // Reset form
    setName('New Feature');
    setOperation('recess');
    setMaskType('ellipse');
    setCenterU(0.5);
    setCenterS(0.5);
    setSizeU(0.2);
    setSizeS(0.2);
    setDepth(0.15);
    setFalloff(0.05);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 w-full">
          <Plus className="w-3.5 h-3.5" />
          Add Feature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Feature</DialogTitle>
          <DialogDescription>
            Create a new parametric feature to modify the surface.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Feature name..."
            />
          </div>
          
          {/* Operation Type */}
          <div className="space-y-2">
            <Label>Operation</Label>
            <Select value={operation} onValueChange={(v) => setOperation(v as FeatureOperationType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['patch', 'recess', 'crease', 'warp', 'boss', 'hole'] as FeatureOperationType[]).map(op => (
                  <SelectItem key={op} value={op}>
                    <div className="flex flex-col">
                      <span className="capitalize">{op}</span>
                      <span className="text-xs text-muted-foreground">{OPERATION_DESCRIPTIONS[op]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Mask Type */}
          <div className="space-y-2">
            <Label>Mask Shape</Label>
            <div className="flex gap-2">
              {MASK_TYPES.map(({ type, label, icon }) => (
                <Button
                  key={type}
                  variant={maskType === type ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => setMaskType(type)}
                >
                  {icon}
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Center U (longitudinal)</Label>
              <Slider
                value={[centerU]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => setCenterU(v)}
              />
              <div className="text-xs text-muted-foreground text-center">{centerU.toFixed(2)}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Center S (lateral)</Label>
              <Slider
                value={[centerS]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => setCenterS(v)}
              />
              <div className="text-xs text-muted-foreground text-center">{centerS.toFixed(2)}</div>
            </div>
          </div>
          
          {/* Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Size U</Label>
              <Slider
                value={[sizeU]}
                min={0.05}
                max={0.8}
                step={0.01}
                onValueChange={([v]) => setSizeU(v)}
              />
              <div className="text-xs text-muted-foreground text-center">{sizeU.toFixed(2)}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Size S</Label>
              <Slider
                value={[sizeS]}
                min={0.05}
                max={0.8}
                step={0.01}
                onValueChange={([v]) => setSizeS(v)}
              />
              <div className="text-xs text-muted-foreground text-center">{sizeS.toFixed(2)}</div>
            </div>
          </div>
          
          {/* Depth/Displacement */}
          <div className="space-y-2">
            <Label className="text-xs">
              {operation === 'patch' ? 'Displacement' : 'Depth'}
            </Label>
            <Slider
              value={[depth]}
              min={0.01}
              max={0.5}
              step={0.01}
              onValueChange={([v]) => setDepth(v)}
            />
            <div className="text-xs text-muted-foreground text-center">{depth.toFixed(2)}m</div>
          </div>
          
          {/* Falloff */}
          <div className="space-y-2">
            <Label className="text-xs">Edge Falloff</Label>
            <Slider
              value={[falloff]}
              min={0}
              max={0.2}
              step={0.005}
              onValueChange={([v]) => setFalloff(v)}
            />
            <div className="text-xs text-muted-foreground text-center">{falloff.toFixed(3)}</div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            Create Feature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
