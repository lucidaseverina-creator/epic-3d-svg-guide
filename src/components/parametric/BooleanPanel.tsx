// ============================================
// BOOLEAN OPERATIONS PANEL - SDF Boolean UI
// ============================================

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Layers,
  Minus,
  Plus,
  Combine,
  Box,
  Circle,
  Square,
  Hexagon,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// SDF Primitive types
export type SDFPrimitiveType = 'sphere' | 'box' | 'torus' | 'cylinder' | 'capsule' | 'octahedron';

// Boolean operation types
export type BooleanOp = 'union' | 'subtract' | 'intersect' | 'smoothUnion' | 'smoothSubtract' | 'smoothIntersect';

// Material definition for SDF nodes
export interface SDFMaterial {
  color: string;
  roughness: number;
  metallic: number;
}

// SDF Node definition
export interface SDFNode {
  id: string;
  name: string;
  type: SDFPrimitiveType | 'boolean';
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  visible: boolean;
  locked: boolean;
  material: SDFMaterial;
  // For primitives
  primitiveParams?: {
    radius?: number;
    majorRadius?: number;
    minorRadius?: number;
    height?: number;
  };
  // For boolean operations
  booleanParams?: {
    operation: BooleanOp;
    operandA: string;
    operandB: string;
    smoothness: number;
  };
}

interface BooleanPanelProps {
  nodes: SDFNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (type: SDFPrimitiveType) => void;
  onUpdateNode: (id: string, updates: Partial<SDFNode>) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onCreateBoolean: (operation: BooleanOp, operandA: string, operandB: string) => void;
}

const PRIMITIVE_ICONS: Record<SDFPrimitiveType, React.ReactNode> = {
  sphere: <Circle className="w-4 h-4" />,
  box: <Square className="w-4 h-4" />,
  torus: <Circle className="w-4 h-4 opacity-60" />,
  cylinder: <Box className="w-4 h-4" />,
  capsule: <Box className="w-4 h-4 opacity-60" />,
  octahedron: <Hexagon className="w-4 h-4" />,
};

const BOOLEAN_OP_LABELS: Record<BooleanOp, string> = {
  union: 'Union',
  subtract: 'Subtract',
  intersect: 'Intersect',
  smoothUnion: 'Smooth Union',
  smoothSubtract: 'Smooth Subtract',
  smoothIntersect: 'Smooth Intersect',
};

// Color conversion helpers
const hslToHex = (hsl: string): string => {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return '#888888';
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'hsl(0, 0%, 50%)';
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

export const BooleanPanel: React.FC<BooleanPanelProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onCreateBoolean,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    primitives: true,
    booleans: true,
    properties: true,
  });
  
  const [booleanOperandA, setBooleanOperandA] = useState<string | null>(null);
  const [booleanOperandB, setBooleanOperandB] = useState<string | null>(null);
  const [selectedBooleanOp, setSelectedBooleanOp] = useState<BooleanOp>('union');
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const primitiveNodes = nodes.filter(n => n.type !== 'boolean');
  const booleanNodes = nodes.filter(n => n.type === 'boolean');
  
  const handleCreateBoolean = () => {
    if (booleanOperandA && booleanOperandB) {
      onCreateBoolean(selectedBooleanOp, booleanOperandA, booleanOperandB);
      setBooleanOperandA(null);
      setBooleanOperandB(null);
    }
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/30 flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Boolean Operations</span>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Add Primitives */}
        <div className="border-b border-border/30">
          <button
            className="w-full p-3 flex items-center justify-between hover:bg-secondary/30"
            onClick={() => toggleSection('primitives')}
          >
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Add Primitive</span>
            </div>
            {expandedSections.primitives ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.primitives && (
            <div className="p-3 pt-0">
              <div className="grid grid-cols-3 gap-2">
                {(['sphere', 'box', 'torus', 'cylinder', 'capsule', 'octahedron'] as SDFPrimitiveType[]).map(type => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="h-12 flex flex-col gap-1"
                    onClick={() => onAddNode(type)}
                  >
                    {PRIMITIVE_ICONS[type]}
                    <span className="text-[10px] capitalize">{type}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Boolean Operations */}
        <div className="border-b border-border/30">
          <button
            className="w-full p-3 flex items-center justify-between hover:bg-secondary/30"
            onClick={() => toggleSection('booleans')}
          >
            <div className="flex items-center gap-2">
              <Combine className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Create Boolean</span>
            </div>
            {expandedSections.booleans ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          {expandedSections.booleans && (
            <div className="p-3 pt-0 space-y-3">
              {/* Operation Type */}
              <div>
                <Label className="text-xs text-muted-foreground">Operation</Label>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(['union', 'subtract', 'intersect'] as BooleanOp[]).map(op => (
                    <Button
                      key={op}
                      variant={selectedBooleanOp === op ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedBooleanOp(op)}
                    >
                      {op === 'union' && <Plus className="w-3 h-3 mr-1" />}
                      {op === 'subtract' && <Minus className="w-3 h-3 mr-1" />}
                      {op === 'intersect' && <Combine className="w-3 h-3 mr-1" />}
                      {op.charAt(0).toUpperCase() + op.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {(['smoothUnion', 'smoothSubtract', 'smoothIntersect'] as BooleanOp[]).map(op => (
                    <Button
                      key={op}
                      variant={selectedBooleanOp === op ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 text-[10px]"
                      onClick={() => setSelectedBooleanOp(op)}
                    >
                      {BOOLEAN_OP_LABELS[op]}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Operands */}
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Operand A</Label>
                  <Select value={booleanOperandA ?? ''} onValueChange={setBooleanOperandA}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select shape..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.map(node => (
                        <SelectItem key={node.id} value={node.id} className="text-xs">
                          {node.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Operand B</Label>
                  <Select value={booleanOperandB ?? ''} onValueChange={setBooleanOperandB}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select shape..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.filter(n => n.id !== booleanOperandA).map(node => (
                        <SelectItem key={node.id} value={node.id} className="text-xs">
                          {node.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Create Button */}
              <Button
                className="w-full h-8"
                disabled={!booleanOperandA || !booleanOperandB}
                onClick={handleCreateBoolean}
              >
                <Combine className="w-4 h-4 mr-2" />
                Create Boolean
              </Button>
            </div>
          )}
        </div>
        
        {/* Node List */}
        <div className="border-b border-border/30">
          <div className="p-3 pb-0">
            <span className="text-xs font-medium text-muted-foreground">
              Scene ({nodes.length} objects)
            </span>
          </div>
          
          <div className="p-2 space-y-1">
            {nodes.map(node => (
              <div
                key={node.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md cursor-pointer group",
                  "hover:bg-secondary/30",
                  selectedNodeId === node.id && "bg-primary/20 border border-primary/50"
                )}
                onClick={() => onSelectNode(node.id)}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                
                {/* Color swatch */}
                <div 
                  className="w-4 h-4 rounded-sm border border-border/50 flex-shrink-0"
                  style={{ backgroundColor: node.material.color }}
                />
                
                <button
                  className="p-1 hover:bg-secondary rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateNode(node.id, { visible: !node.visible });
                  }}
                >
                  {node.visible ? (
                    <Eye className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{node.name}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">
                    {node.type === 'boolean' 
                      ? BOOLEAN_OP_LABELS[node.booleanParams?.operation ?? 'union']
                      : node.type
                    }
                  </div>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    className="p-1 hover:bg-secondary rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateNode(node.id);
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    className="p-1 hover:bg-destructive/20 rounded text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNode(node.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            
            {nodes.length === 0 && (
              <div className="text-xs text-muted-foreground p-3 text-center">
                No objects. Add a primitive to get started.
              </div>
            )}
          </div>
        </div>
        
        {/* Selected Node Properties */}
        {selectedNode && (
          <div className="border-b border-border/30">
            <button
              className="w-full p-3 flex items-center justify-between hover:bg-secondary/30"
              onClick={() => toggleSection('properties')}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{selectedNode.name}</span>
              </div>
              {expandedSections.properties ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedSections.properties && (
              <div className="p-3 pt-0 space-y-3">
                {/* Position */}
                <div>
                  <Label className="text-xs text-muted-foreground">Position</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(['x', 'y', 'z'] as const).map(axis => (
                      <div key={axis} className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase">{axis}</span>
                        <Input
                          type="number"
                          step="0.1"
                          value={selectedNode.position[axis].toFixed(2)}
                          onChange={(e) => onUpdateNode(selectedNode.id, {
                            position: { ...selectedNode.position, [axis]: parseFloat(e.target.value) || 0 }
                          })}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Scale */}
                <div>
                  <Label className="text-xs text-muted-foreground">Scale</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(['x', 'y', 'z'] as const).map(axis => (
                      <div key={axis} className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase">{axis}</span>
                        <Input
                          type="number"
                          step="0.1"
                          value={selectedNode.scale[axis].toFixed(2)}
                          onChange={(e) => onUpdateNode(selectedNode.id, {
                            scale: { ...selectedNode.scale, [axis]: parseFloat(e.target.value) || 0.1 }
                          })}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Rotation */}
                <div>
                  <Label className="text-xs text-muted-foreground">Rotation (deg)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(['x', 'y', 'z'] as const).map(axis => (
                      <div key={axis} className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase">{axis}</span>
                        <Input
                          type="number"
                          step="5"
                          value={Math.round(selectedNode.rotation[axis] * 180 / Math.PI)}
                          onChange={(e) => onUpdateNode(selectedNode.id, {
                            rotation: { ...selectedNode.rotation, [axis]: (parseFloat(e.target.value) || 0) * Math.PI / 180 }
                          })}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Primitive-specific params */}
                {selectedNode.type !== 'boolean' && selectedNode.primitiveParams && (
                  <div className="space-y-2">
                    {selectedNode.type === 'sphere' && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Radius</Label>
                        <Slider
                          value={[selectedNode.primitiveParams.radius ?? 1]}
                          min={0.1}
                          max={5}
                          step={0.1}
                          onValueChange={([v]) => onUpdateNode(selectedNode.id, {
                            primitiveParams: { ...selectedNode.primitiveParams, radius: v }
                          })}
                          className="mt-1"
                        />
                      </div>
                    )}
                    
                    {selectedNode.type === 'torus' && (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">Major Radius</Label>
                          <Slider
                            value={[selectedNode.primitiveParams.majorRadius ?? 1]}
                            min={0.2}
                            max={3}
                            step={0.1}
                            onValueChange={([v]) => onUpdateNode(selectedNode.id, {
                              primitiveParams: { ...selectedNode.primitiveParams, majorRadius: v }
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Minor Radius</Label>
                          <Slider
                            value={[selectedNode.primitiveParams.minorRadius ?? 0.3]}
                            min={0.05}
                            max={1}
                            step={0.05}
                            onValueChange={([v]) => onUpdateNode(selectedNode.id, {
                              primitiveParams: { ...selectedNode.primitiveParams, minorRadius: v }
                            })}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                    
                    {(selectedNode.type === 'cylinder' || selectedNode.type === 'capsule') && (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">Radius</Label>
                          <Slider
                            value={[selectedNode.primitiveParams.radius ?? 0.5]}
                            min={0.1}
                            max={3}
                            step={0.1}
                            onValueChange={([v]) => onUpdateNode(selectedNode.id, {
                              primitiveParams: { ...selectedNode.primitiveParams, radius: v }
                            })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Height</Label>
                          <Slider
                            value={[selectedNode.primitiveParams.height ?? 2]}
                            min={0.2}
                            max={5}
                            step={0.1}
                            onValueChange={([v]) => onUpdateNode(selectedNode.id, {
                              primitiveParams: { ...selectedNode.primitiveParams, height: v }
                            })}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Boolean-specific params */}
                {selectedNode.type === 'boolean' && selectedNode.booleanParams && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Smoothness</Label>
                      <Slider
                        value={[selectedNode.booleanParams.smoothness]}
                        min={0}
                        max={2}
                        step={0.05}
                        onValueChange={([v]) => onUpdateNode(selectedNode.id, {
                          booleanParams: { ...selectedNode.booleanParams!, smoothness: v }
                        })}
                        className="mt-1"
                      />
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {selectedNode.booleanParams.smoothness.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Material / Color */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <Label className="text-xs text-muted-foreground">Material</Label>
                  
                  {/* Color Picker */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Color</Label>
                    <div className="flex gap-2 mt-1 items-center">
                      <input
                        type="color"
                        value={hslToHex(selectedNode.material.color)}
                        onChange={(e) => onUpdateNode(selectedNode.id, {
                          material: { ...selectedNode.material, color: hexToHsl(e.target.value) }
                        })}
                        className="w-10 h-8 rounded border border-border cursor-pointer"
                      />
                      <div className="flex-1 grid grid-cols-6 gap-1">
                        {[
                          'hsl(200, 70%, 55%)', // Blue
                          'hsl(340, 70%, 55%)', // Pink
                          'hsl(120, 50%, 50%)', // Green
                          'hsl(45, 80%, 55%)',  // Orange
                          'hsl(280, 60%, 55%)', // Purple
                          'hsl(180, 60%, 50%)', // Cyan
                          'hsl(0, 70%, 55%)',   // Red
                          'hsl(60, 70%, 50%)',  // Yellow
                          'hsl(30, 70%, 50%)',  // Brown
                          'hsl(240, 50%, 55%)', // Indigo
                          'hsl(0, 0%, 60%)',    // Gray
                          'hsl(0, 0%, 30%)',    // Dark Gray
                        ].map(color => (
                          <button
                            key={color}
                            className={cn(
                              "w-5 h-5 rounded-sm border transition-transform hover:scale-110",
                              selectedNode.material.color === color ? "border-foreground scale-110" : "border-border/50"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => onUpdateNode(selectedNode.id, {
                              material: { ...selectedNode.material, color }
                            })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Roughness */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Roughness</Label>
                    <Slider
                      value={[selectedNode.material.roughness]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={([v]) => onUpdateNode(selectedNode.id, {
                        material: { ...selectedNode.material, roughness: v }
                      })}
                      className="mt-1"
                    />
                  </div>
                  
                  {/* Metallic */}
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Metallic</Label>
                    <Slider
                      value={[selectedNode.material.metallic]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={([v]) => onUpdateNode(selectedNode.id, {
                        material: { ...selectedNode.material, metallic: v }
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
