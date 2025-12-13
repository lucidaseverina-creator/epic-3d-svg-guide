import React from 'react';
import { 
  Target, 
  Move, 
  RotateCcw, 
  Maximize2,
  Box,
  Camera,
  Lightbulb,
  Code,
  Settings,
  Combine,
  Zap,
  Circle
} from 'lucide-react';
import { ToolType } from '@/types/engine';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IconBarProps {
  side: 'left' | 'right';
  activeTool?: ToolType;
  onToolChange?: (tool: ToolType) => void;
  activeDrawer?: string | null;
  onDrawerToggle?: (drawerId: string) => void;
  supportsSDF?: boolean;
}

interface IconButtonConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  type: 'tool' | 'drawer';
}

const leftTopButtons: IconButtonConfig[] = [
  { id: 'select', icon: <Target className="w-5 h-5" />, label: 'Select (Q)', type: 'tool' },
  { id: 'move', icon: <Move className="w-5 h-5" />, label: 'Move (G)', type: 'tool' },
  { id: 'rotate', icon: <RotateCcw className="w-5 h-5" />, label: 'Rotate (R)', type: 'tool' },
  { id: 'scale', icon: <Maximize2 className="w-5 h-5" />, label: 'Scale (S)', type: 'tool' },
];

const rightTopButtons: IconButtonConfig[] = [
  { id: 'objects', icon: <Box className="w-4 h-4" />, label: 'Objects', type: 'drawer' },
  { id: 'camera', icon: <Camera className="w-4 h-4" />, label: 'Camera', type: 'drawer' },
  { id: 'lighting', icon: <Lightbulb className="w-4 h-4" />, label: 'Lighting', type: 'drawer' },
  { id: 'rendering', icon: <Code className="w-4 h-4" />, label: 'Rendering', type: 'drawer' },
];

const rightBottomButtons: IconButtonConfig[] = [
  { id: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Settings', type: 'drawer' },
  { id: 'boolean', icon: <Combine className="w-4 h-4" />, label: 'Boolean Ops', type: 'drawer' },
];

export const IconBar: React.FC<IconBarProps> = ({
  side,
  activeTool = 'select',
  onToolChange,
  activeDrawer,
  onDrawerToggle,
  supportsSDF = false,
}) => {
  const isLeft = side === 'left';
  
  const topButtons = isLeft ? leftTopButtons : rightTopButtons;
  const bottomButtons = isLeft ? [] : [
    ...rightBottomButtons,
    ...(supportsSDF ? [{ 
      id: 'sdf-settings', 
      icon: <Zap className="w-4 h-4" />, 
      label: 'SDF Settings', 
      type: 'drawer' as const 
    }] : []),
  ];
  
  const handleClick = (button: IconButtonConfig) => {
    if (button.type === 'tool' && onToolChange) {
      onToolChange(button.id as ToolType);
    } else if (button.type === 'drawer' && onDrawerToggle) {
      onDrawerToggle(button.id);
    }
  };
  
  const isActive = (button: IconButtonConfig): boolean => {
    if (button.type === 'tool') {
      return activeTool === button.id;
    }
    return activeDrawer === button.id;
  };
  
  return (
    <div 
      className={cn(
        "w-12 h-full bg-panel flex flex-col py-2 gap-1",
        isLeft ? "border-r border-border/50" : "border-l border-border/50"
      )}
    >
      {/* Top buttons */}
      <div className="flex flex-col gap-1 px-1">
        {topButtons.map((button) => (
          <Tooltip key={button.id} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "icon-btn",
                  isActive(button) && "active"
                )}
                onClick={() => handleClick(button)}
              >
                {button.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={isLeft ? "right" : "left"}>
              {button.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Bottom buttons */}
      {bottomButtons.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          {bottomButtons.map((button) => (
            <Tooltip key={button.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "icon-btn",
                    isActive(button) && "active"
                  )}
                  onClick={() => handleClick(button)}
                >
                  {button.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isLeft ? "right" : "left"}>
                {button.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
};
