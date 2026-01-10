// ============================================
// PARAMETRIC PROPERTIES PANEL - Enhanced
// ============================================

import React from 'react';
import { AssetSpec, FeatureNodeContract, ViewAxis, MaskPrimitive } from '@/types/parametric';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FeatureAddDialog } from './FeatureAddDialog';
import { 
  Box, 
  Layers, 
  Anchor, 
  Settings2, 
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Move,
  Scale,
  Maximize2,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParametricPropertiesProps {
  spec: AssetSpec | null;
  selectedFeatureId: string | null;
  onUpdateLength: (length: number) => void;
  onUpdateResolution: (Nu: number, Nv: number) => void;
  onToggleFeature: (featureId: string) => void;
  onSelectFeature: (featureId: string | null) => void;
  onUpdateFeature: (featureId: string, updates: Partial<FeatureNodeContract>) => void;
  onAddFeature?: (feature: FeatureNodeContract) => void;
  onDeleteFeature?: (featureId: string) => void;
}

export const ParametricProperties: React.FC<ParametricPropertiesProps> = ({
  spec,
  selectedFeatureId,
  onUpdateLength,
  onUpdateResolution,
  onToggleFeature,
  onSelectFeature,
  onUpdateFeature,
  onAddFeature,
  onDeleteFeature,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    dimensions: true,
    resolution: true,
    features: true,
    selectedFeature: true,
    mask: false,
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  if (!spec) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        No asset loaded. Click "New Asset" to start.
      </div>
    );
  }
  
  const selectedFeature = spec.features.nodes.find(n => n.id === selectedFeatureId);
  
  // Update mask property helper
  const updateMaskProperty = (property: keyof MaskPrimitive, value: any) => {
    if (!selectedFeature) return;
    onUpdateFeature(selectedFeature.id, {
      mask: { ...selectedFeature.mask, [property]: value }
    });
  };
  
  // Update mask center
  const updateMaskCenter = (axis: 'x' | 'z', value: number) => {
    if (!selectedFeature) return;
    const currentCenter = selectedFeature.mask.center ?? { x: 0.5, z: 0.5 };
    onUpdateFeature(selectedFeature.id, {
      mask: { ...selectedFeature.mask, center: { ...currentCenter, [axis]: value } }
    });
  };
  
  // Update mask size
  const updateMaskSize = (axis: 'x' | 'z', value: number) => {
    if (!selectedFeature) return;
    const currentSize = selectedFeature.mask.size ?? { x: 0.2, z: 0.2 };
    onUpdateFeature(selectedFeature.id, {
      mask: { ...selectedFeature.mask, size: { ...currentSize, [axis]: value } }
    });
  };
  
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Asset Info */}
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Box className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{spec.name}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Template: {spec.template}
        </div>
      </div>
      
      {/* Dimensions */}
      <div className="border-b border-border/30">
        <button
          className="w-full p-3 flex items-center justify-between hover:bg-secondary/30"
          onClick={() => toggleSection('dimensions')}
        >
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Dimensions</span>
          </div>
          {expandedSections.dimensions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {expandedSections.dimensions && (
          <div className="p-3 pt-0 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Length (m)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[spec.baseForm.L]}
                  min={1}
                  max={15}
                  step={0.1}
                  onValueChange={([v]) => onUpdateLength(v)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={spec.baseForm.L.toFixed(1)}
                  onChange={(e) => onUpdateLength(parseFloat(e.target.value) || 1)}
                  className="w-16 h-7 text-xs"
                />
              </div>
            </div>
            
            {/* Quick dimension presets */}
            <div className="flex gap-1">
              {[2, 4, 6, 8, 10].map(L => (
                <Button
                  key={L}
                  variant={Math.abs(spec.baseForm.L - L) < 0.5 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-6 text-[10px]"
                  onClick={() => onUpdateLength(L)}
                >
                  {L}m
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Resolution */}
      <div className="border-b border-border/30">
        <button
          className="w-full p-3 flex items-center justify-between hover:bg-secondary/30"
          onClick={() => toggleSection('resolution')}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Resolution</span>
          </div>
          {expandedSections.resolution ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {expandedSections.resolution && (
          <div className="p-3 pt-0 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Longitudinal (Nu)</Label>
              <Slider
                value={[spec.baseForm.Nu]}
                min={8}
                max={64}
                step={4}
                onValueChange={([v]) => onUpdateResolution(v, spec.baseForm.Nv)}
                className="mt-1"
              />
              <div className="text-xs text-muted-foreground mt-1">{spec.baseForm.Nu} stations</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Lateral (Nv)</Label>
              <Slider
                value={[spec.baseForm.Nv]}
                min={4}
                max={32}
                step={2}
                onValueChange={([v]) => onUpdateResolution(spec.baseForm.Nu, v)}
                className="mt-1"
              />
              <div className="text-xs text-muted-foreground mt-1">{spec.baseForm.Nv} sections</div>
            </div>
            
            {/* Quick resolution presets */}
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-6 text-[10px]"
                onClick={() => onUpdateResolution(16, 8)}
              >
                Low
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-6 text-[10px]"
                onClick={() => onUpdateResolution(32, 16)}
              >
                Medium
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-6 text-[10px]"
                onClick={() => onUpdateResolution(48, 24)}
              >
                High
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Features */}
      <div className="border-b border-border/30">
        <button
          className="w-full p-3 flex items-center justify-between hover:bg-secondary/30"
          onClick={() => toggleSection('features')}
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Features</span>
            <span className="text-xs text-muted-foreground">({spec.features.nodes.length})</span>
          </div>
          {expandedSections.features ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {expandedSections.features && (
          <div className="p-2 pt-0 space-y-1">
            {/* Add Feature Button */}
            {onAddFeature && (
              <div className="mb-2">
                <FeatureAddDialog onAddFeature={onAddFeature} />
              </div>
            )}
            
            {spec.features.nodes.map((feature) => (
              <div
                key={feature.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md cursor-pointer group",
                  "hover:bg-secondary/30",
                  selectedFeatureId === feature.id && "bg-primary/20 border border-primary/50"
                )}
                onClick={() => onSelectFeature(feature.id)}
              >
                <button
                  className="p-1 hover:bg-secondary rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFeature(feature.id);
                  }}
                >
                  {feature.enabled ? (
                    <Eye className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{feature.name}</div>
                  <div className="text-[10px] text-muted-foreground">{feature.operation}</div>
                </div>
                
                {onDeleteFeature && (
                  <button
                    className="p-1 hover:bg-destructive/20 rounded text-destructive opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFeature(feature.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            
            {spec.features.nodes.length === 0 && (
              <div className="text-xs text-muted-foreground p-2">
                No features added
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Selected Feature Properties */}
      {selectedFeature && (
        <>
          <div className="border-b border-border/30">
            <button
              className="w-full p-3 flex items-center justify-between hover:bg-secondary/30"
              onClick={() => toggleSection('selectedFeature')}
            >
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{selectedFeature.name}</span>
              </div>
              {expandedSections.selectedFeature ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedSections.selectedFeature && (
              <div className="p-3 pt-0 space-y-3">
                {/* Common feature properties */}
                {(selectedFeature.operation === 'recess' || selectedFeature.operation === 'patch') && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {selectedFeature.operation === 'patch' ? 'Displacement' : 'Depth'}
                    </Label>
                    <Slider
                      value={[(selectedFeature.params.depth as number) ?? (selectedFeature.params.displacement as number) ?? 0.2]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={([v]) => onUpdateFeature(selectedFeature.id, {
                        params: { 
                          ...selectedFeature.params, 
                          [selectedFeature.operation === 'patch' ? 'displacement' : 'depth']: v 
                        }
                      })}
                      className="mt-1"
                    />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {((selectedFeature.params.depth as number) ?? (selectedFeature.params.displacement as number) ?? 0.2).toFixed(2)}m
                    </div>
                  </div>
                )}
                
                {selectedFeature.operation === 'crease' && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">Depth</Label>
                      <Slider
                        value={[(selectedFeature.params.depth as number) ?? 0.02]}
                        min={0}
                        max={0.1}
                        step={0.002}
                        onValueChange={([v]) => onUpdateFeature(selectedFeature.id, {
                          params: { ...selectedFeature.params, depth: v }
                        })}
                        className="mt-1"
                      />
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {((selectedFeature.params.depth as number) ?? 0.02).toFixed(3)}m
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Sharpness</Label>
                      <Slider
                        value={[(selectedFeature.params.sharpness as number) ?? 2]}
                        min={1}
                        max={5}
                        step={0.5}
                        onValueChange={([v]) => onUpdateFeature(selectedFeature.id, {
                          params: { ...selectedFeature.params, sharpness: v }
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Width</Label>
                      <Slider
                        value={[(selectedFeature.params.width as number) ?? 0.05]}
                        min={0.01}
                        max={0.2}
                        step={0.005}
                        onValueChange={([v]) => onUpdateFeature(selectedFeature.id, {
                          params: { ...selectedFeature.params, width: v }
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">S Position</Label>
                      <Slider
                        value={[(selectedFeature.params.sPosition as number) ?? 0.5]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => onUpdateFeature(selectedFeature.id, {
                          params: { ...selectedFeature.params, sPosition: v }
                        })}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Mask Properties */}
          <div className="border-b border-border/30">
            <button
              className="w-full p-3 flex items-center justify-between hover:bg-secondary/30"
              onClick={() => toggleSection('mask')}
            >
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Mask Shape</span>
              </div>
              {expandedSections.mask ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedSections.mask && (
              <div className="p-3 pt-0 space-y-3">
                <div className="text-xs text-muted-foreground capitalize mb-2">
                  Type: {selectedFeature.mask.type}
                </div>
                
                {/* Center Position */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Move className="w-3 h-3" /> Center
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-muted-foreground">U</span>
                      <Slider
                        value={[selectedFeature.mask.center?.x ?? 0.5]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => updateMaskCenter('x', v)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">S</span>
                      <Slider
                        value={[selectedFeature.mask.center?.z ?? 0.5]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => updateMaskCenter('z', v)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Size */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Size
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Width</span>
                      <Slider
                        value={[selectedFeature.mask.size?.x ?? 0.2]}
                        min={0.02}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => updateMaskSize('x', v)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Height</span>
                      <Slider
                        value={[selectedFeature.mask.size?.z ?? 0.2]}
                        min={0.02}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => updateMaskSize('z', v)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Falloff */}
                <div>
                  <Label className="text-xs text-muted-foreground">Edge Falloff</Label>
                  <Slider
                    value={[selectedFeature.mask.falloff ?? 0]}
                    min={0}
                    max={0.3}
                    step={0.01}
                    onValueChange={([v]) => updateMaskProperty('falloff', v)}
                    className="mt-1"
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {(selectedFeature.mask.falloff ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Stats */}
      <div className="p-3 mt-auto">
        <div className="text-[10px] text-muted-foreground space-y-1">
          <div>Vertices: {(spec.baseForm.Nu + 1) * (spec.baseForm.Nv + 1) * 2}</div>
          <div>Triangles: {spec.baseForm.Nu * spec.baseForm.Nv * 4}</div>
          <div>Features: {spec.features.nodes.filter(f => f.enabled).length} active</div>
        </div>
      </div>
    </div>
  );
};
