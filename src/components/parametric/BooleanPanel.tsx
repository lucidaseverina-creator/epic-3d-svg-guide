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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
