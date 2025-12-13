import React from 'react';
import { Grid3X3, Sun, Moon, Box, BarChart2 } from 'lucide-react';
import { CameraPreset, RenderMode } from '@/types/engine';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface BottomBarProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  lightingMode: 'day' | 'night';
  onLightingModeChange: (mode: 'day' | 'night') => void;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
  renderMode?: RenderMode;
  onRenderModeChange?: (mode: RenderMode) => void;
  showStats?: boolean;
  onToggleStats?: () => void;
  objectCount: number;
  selectedObjectName?: string | null;
}

const cameraPresets: { id: CameraPreset; label: string }[] = [
  { id: 'perspective', label: 'Perspective' },
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'top', label: 'Top' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

const renderModes: { id: RenderMode; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'wireframe', label: 'Wireframe' },
  { id: 'xray', label: 'X-Ray' },
];

export const BottomBar: React.FC<BottomBarProps> = ({
  showGrid,
  onToggleGrid,
  lightingMode,
  onLightingModeChange,
  cameraPreset = 'perspective',
  onCameraPresetChange,
  renderMode = 'solid',
  onRenderModeChange,
  showStats = false,
  onToggleStats,
  objectCount,
  selectedObjectName,
}) => {
  return (
    <footer className="h-10 bg-panel border-t border-border/50 flex items-center px-4 gap-3 no-select">
      {/* Left section - View controls */}
      <div className="flex items-center gap-2">
        {/* Grid toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 gap-1.5 text-xs",
            showGrid ? "text-primary" : "text-muted-foreground"
          )}
          onClick={onToggleGrid}
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          <span>Grid</span>
        </Button>
        
        {/* Lighting mode */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1.5 text-xs"
          onClick={() => onLightingModeChange(lightingMode === 'day' ? 'night' : 'day')}
        >
          {lightingMode === 'day' ? (
            <Sun className="w-3.5 h-3.5 text-warning" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-primary" />
          )}
          <span className="capitalize">{lightingMode}</span>
        </Button>
      </div>
      
      {/* Separator */}
      <div className="w-px h-5 bg-border/50" />
      
      {/* Center section - Camera & Render */}
      <div className="flex items-center gap-2">
        {/* Camera preset */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5 text-xs">
              <Box className="w-3.5 h-3.5" />
              <span className="capitalize">{cameraPreset}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-panel border-border">
            {cameraPresets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => onCameraPresetChange?.(preset.id)}
                className={cameraPreset === preset.id ? 'bg-secondary' : ''}
              >
                {preset.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Render mode */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs capitalize">
              {renderMode}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-panel border-border">
            {renderModes.map((mode) => (
              <DropdownMenuItem
                key={mode.id}
                onClick={() => onRenderModeChange?.(mode.id)}
                className={renderMode === mode.id ? 'bg-secondary' : ''}
              >
                {mode.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Right section - Stats & Info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {/* Selected object */}
        {selectedObjectName && (
          <div className="text-primary">
            Selected: <span className="font-medium">{selectedObjectName}</span>
          </div>
        )}
        
        {/* Object count */}
        <div className="tabular-nums">
          Objects: {objectCount}
        </div>
        
        {/* Stats toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2",
            showStats ? "text-primary" : "text-muted-foreground"
          )}
          onClick={onToggleStats}
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </footer>
  );
};
