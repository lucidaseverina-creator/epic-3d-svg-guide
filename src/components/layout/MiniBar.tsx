import React from 'react';
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { SceneObject } from '@/types/engine';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MiniBarProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  className?: string;
}

export const MiniBar: React.FC<MiniBarProps> = ({
  objects,
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  className,
}) => {
  return (
    <div 
      className={cn(
        "w-12 h-full bg-panel border-r border-border/50 flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="py-2 px-1 border-b border-border/30">
        <div className="text-[10px] text-muted-foreground text-center font-medium uppercase tracking-wider">
          Layers
        </div>
      </div>
      
      {/* Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-1 px-1">
        {objects.map((obj) => (
          <Tooltip key={obj.id} delayDuration={300}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "relative aspect-square mb-1 rounded cursor-pointer",
                  "border border-border/30 overflow-hidden group",
                  "hover:border-primary/50 transition-all duration-150",
                  selectedId === obj.id && "border-primary bg-primary/10"
                )}
                onClick={() => onSelect(obj.id)}
              >
                {/* Object thumbnail/preview */}
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: obj.material.color + '20',
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: obj.material.color }}
                  />
                </div>
                
                {/* Selection indicator */}
                {selectedId === obj.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                )}
                
                {/* Hover controls */}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <button
                    className="p-1 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility?.(obj.id);
                    }}
                  >
                    {obj.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    className="p-1 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock?.(obj.id);
                    }}
                  >
                    {obj.locked ? (
                      <Lock className="w-3 h-3 text-warning" />
                    ) : (
                      <Unlock className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
                
                {/* Status indicators */}
                {!obj.visible && (
                  <div className="absolute top-0.5 right-0.5">
                    <EyeOff className="w-2 h-2 text-muted-foreground" />
                  </div>
                )}
                {obj.locked && (
                  <div className="absolute bottom-0.5 right-0.5">
                    <Lock className="w-2 h-2 text-warning" />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <div className="text-xs">
                <div className="font-medium">{obj.name}</div>
                <div className="text-muted-foreground capitalize">{obj.type}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      
      {/* Footer */}
      <div className="py-1 px-1 border-t border-border/30">
        <div className="text-[10px] text-muted-foreground text-center tabular-nums">
          {objects.length}
        </div>
      </div>
    </div>
  );
};
