import React from 'react';
import { 
  Undo2, 
  Redo2, 
  History, 
  Columns,
  Copy,
  Clipboard,
  Trash2,
  Layers
} from 'lucide-react';
import { EngineType } from '@/types/engine';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  currentEngine: EngineType;
  onEngineChange: (engine: EngineType) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const engineLabels: Record<EngineType, string> = {
  classic: 'SVG Classic',
  sdflux: 'SDFlux',
};

export const TopBar: React.FC<TopBarProps> = ({
  currentEngine,
  onEngineChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  return (
    <header className="h-12 bg-panel border-b border-border/50 flex items-center px-4 gap-4 no-select">
      {/* Engine Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 text-primary hover:text-primary-glow"
          >
            <Layers className="w-4 h-4" />
            <span className="font-medium">{engineLabels[currentEngine]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-panel border-border">
          <DropdownMenuItem 
            onClick={() => onEngineChange('classic')}
            className={currentEngine === 'classic' ? 'bg-secondary' : ''}
          >
            SVG Classic
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => onEngineChange('sdflux')}
            className={currentEngine === 'sdflux' ? 'bg-secondary' : ''}
          >
            SDFlux (SDF)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Separator */}
      <div className="w-px h-6 bg-border/50" />
      
      {/* Edit Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="icon-btn w-8 h-8"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="icon-btn w-8 h-8"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="icon-btn w-8 h-8"
          title="History"
        >
          <History className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Separator */}
      <div className="w-px h-6 bg-border/50" />
      
      {/* Clipboard Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="icon-btn w-8 h-8"
          title="Copy (Ctrl+C)"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="icon-btn w-8 h-8"
          title="Paste (Ctrl+V)"
        >
          <Clipboard className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="icon-btn w-8 h-8"
          title="Delete (Del)"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* View Options */}
      <Button
        variant="ghost"
        size="icon"
        className="icon-btn w-8 h-8"
        title="Split View"
      >
        <Columns className="w-4 h-4" />
      </Button>
      
      {/* Brand */}
      <div className="text-xs text-muted-foreground font-mono">
        SVG<span className="text-gradient">3D</span>Engine
      </div>
    </header>
  );
};
