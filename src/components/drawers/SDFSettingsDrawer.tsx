import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Zap, Cpu, Eye, Grid3X3 } from 'lucide-react';

export type SDFQuality = 'draft' | 'standard' | 'high' | 'ultra';

interface SDFSettingsDrawerProps {
  quality: SDFQuality;
  onQualityChange: (quality: SDFQuality) => void;
  showWireframe: boolean;
  onShowWireframeChange: (show: boolean) => void;
  adaptiveRefinement: boolean;
  onAdaptiveRefinementChange: (enabled: boolean) => void;
  maxDepth: number;
  onMaxDepthChange: (depth: number) => void;
}

const QUALITY_DESCRIPTIONS: Record<SDFQuality, string> = {
  draft: 'Fast preview, lower detail',
  standard: 'Balanced quality and speed',
  high: 'High detail, slower rendering',
  ultra: 'Maximum quality, very slow',
};

export const SDFSettingsDrawer: React.FC<SDFSettingsDrawerProps> = ({
  quality,
  onQualityChange,
  showWireframe,
  onShowWireframeChange,
  adaptiveRefinement,
  onAdaptiveRefinementChange,
  maxDepth,
  onMaxDepthChange,
}) => {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/30">
        <Zap className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">SDF Rendering Settings</span>
      </div>

      {/* Quality Preset */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          <Label className="text-xs font-medium">Quality Preset</Label>
        </div>
        <Select value={quality} onValueChange={(v) => onQualityChange(v as SDFQuality)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['draft', 'standard', 'high', 'ultra'] as SDFQuality[]).map((q) => (
              <SelectItem key={q} value={q}>
                <div className="flex flex-col">
                  <span className="capitalize">{q}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {QUALITY_DESCRIPTIONS[q]}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Adaptive Refinement */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label className="text-xs font-medium">Adaptive Refinement</Label>
            <p className="text-[10px] text-muted-foreground">
              Higher detail near surfaces
            </p>
          </div>
        </div>
        <Switch
          checked={adaptiveRefinement}
          onCheckedChange={onAdaptiveRefinementChange}
        />
      </div>

      {/* Max Octree Depth */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Max Octree Depth</Label>
          <span className="text-xs text-muted-foreground">{maxDepth}</span>
        </div>
        <Slider
          value={[maxDepth]}
          onValueChange={([v]) => onMaxDepthChange(v)}
          min={3}
          max={8}
          step={1}
          className="w-full"
        />
        <p className="text-[10px] text-muted-foreground">
          Higher values = more detail, slower performance
        </p>
      </div>

      {/* Wireframe Overlay */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label className="text-xs font-medium">Show Wireframe</Label>
            <p className="text-[10px] text-muted-foreground">
              Overlay mesh edges
            </p>
          </div>
        </div>
        <Switch
          checked={showWireframe}
          onCheckedChange={onShowWireframeChange}
        />
      </div>

      {/* Info Section */}
      <div className="bg-secondary/30 rounded-lg p-3 mt-4">
        <h4 className="text-xs font-medium mb-2">About SDF Rendering</h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Signed Distance Field (SDF) rendering uses adaptive octree marching to
          generate mesh geometry from mathematical distance functions. This enables
          smooth boolean operations like union, subtract, and intersect between
          primitive shapes.
        </p>
      </div>
    </div>
  );
};
