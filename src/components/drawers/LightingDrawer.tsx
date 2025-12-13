import React from 'react';
import { Sun, Moon, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface LightingDrawerProps {
  lightingMode: 'day' | 'night';
  onLightingModeChange: (mode: 'day' | 'night') => void;
}

export const LightingDrawer: React.FC<LightingDrawerProps> = ({
  lightingMode,
  onLightingModeChange,
}) => {
  return (
    <div className="p-4 space-y-6">
      {/* Mode Selection */}
      <div>
        <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
          Lighting Mode
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 gap-2 bg-secondary/30 border-border/50",
              lightingMode === 'day' && "bg-warning/20 border-warning/50 text-warning"
            )}
            onClick={() => onLightingModeChange('day')}
          >
            <Sun className="w-4 h-4" />
            Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 gap-2 bg-secondary/30 border-border/50",
              lightingMode === 'night' && "bg-primary/20 border-primary/50 text-primary"
            )}
            onClick={() => onLightingModeChange('night')}
          >
            <Moon className="w-4 h-4" />
            Night
          </Button>
        </div>
      </div>
      
      {/* Ambient Light */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Ambient Intensity
          </span>
          <span className="text-xs font-mono text-foreground">
            {lightingMode === 'day' ? '0.60' : '0.30'}
          </span>
        </div>
        <Slider
          defaultValue={[lightingMode === 'day' ? 60 : 30]}
          max={100}
          step={1}
          className="w-full"
          disabled
        />
      </div>
      
      {/* Directional Light */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Directional Intensity
          </span>
          <span className="text-xs font-mono text-foreground">
            {lightingMode === 'day' ? '1.00' : '0.50'}
          </span>
        </div>
        <Slider
          defaultValue={[lightingMode === 'day' ? 100 : 50]}
          max={100}
          step={1}
          className="w-full"
          disabled
        />
      </div>
      
      {/* Preview */}
      <div>
        <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
          Preview
        </div>
        <div 
          className={cn(
            "h-20 rounded-lg flex items-center justify-center transition-all duration-500",
            lightingMode === 'day' 
              ? "bg-gradient-to-br from-orange-200/20 via-yellow-100/20 to-blue-100/10"
              : "bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-blue-900/30"
          )}
        >
          <Lightbulb 
            className={cn(
              "w-8 h-8 transition-all duration-500",
              lightingMode === 'day' ? "text-warning drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" : "text-primary/60"
            )} 
          />
        </div>
      </div>
    </div>
  );
};
