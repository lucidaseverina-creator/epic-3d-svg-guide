// ============================================
// PARAMETRIC PROPERTIES PANEL
// ============================================

import React from 'react';
import { AssetSpec, FeatureNodeContract, ViewAxis } from '@/types/parametric';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  ChevronRight
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
}

export const ParametricProperties: React.FC<ParametricPropertiesProps> = ({
  spec,
  selectedFeatureId,
  onUpdateLength,
  onUpdateResolution,
  onToggleFeature,
  onSelectFeature,
  onUpdateFeature,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    dimensions: true,
    resolution: true,
    features: true,
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
            {spec.features.nodes.map((feature) => (
              <div
                key={feature.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md cursor-pointer",
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
        <div className="p-3 border-b border-border/30">
          <div className="text-xs font-medium text-primary mb-2">
            {selectedFeature.name} Properties
          </div>
          
          {selectedFeature.operation === 'recess' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Depth</Label>
                <Slider
                  value={[(selectedFeature.params.depth as number) ?? 0.2]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => onUpdateFeature(selectedFeature.id, {
                    params: { ...selectedFeature.params, depth: v }
                  })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          {selectedFeature.operation === 'crease' && (
            <div className="space-y-3">
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
            </div>
          )}
        </div>
      )}
      
      {/* Stats */}
      <div className="p-3 mt-auto">
        <div className="text-[10px] text-muted-foreground space-y-1">
          <div>Vertices: {(spec.baseForm.Nu + 1) * (spec.baseForm.Nv + 1) * 2}</div>
          <div>Triangles: {spec.baseForm.Nu * spec.baseForm.Nv * 4}</div>
        </div>
      </div>
    </div>
  );
};
