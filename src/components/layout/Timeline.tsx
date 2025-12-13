import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TimelineSize = 'mini' | 'medium' | 'large';

interface TimelineProps {
  currentFrame?: number;
  totalFrames?: number;
  fps?: number;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onSeek?: (frame: number) => void;
}

const sizeConfig: Record<TimelineSize, { height: string; showTracks: boolean }> = {
  mini: { height: 'h-10', showTracks: false },
  medium: { height: 'h-24', showTracks: true },
  large: { height: 'h-48', showTracks: true },
};

export const Timeline: React.FC<TimelineProps> = ({
  currentFrame = 0,
  totalFrames = 120,
  fps = 24,
  isPlaying = false,
  onPlayPause,
  onSeek,
}) => {
  const [size, setSize] = useState<TimelineSize>('mini');
  
  const config = sizeConfig[size];
  
  // Convert frame to timecode
  const frameToTimecode = (frame: number): string => {
    const totalSeconds = Math.floor(frame / fps);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const frames = frame % fps;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };
  
  const cycleSize = () => {
    const sizes: TimelineSize[] = ['mini', 'medium', 'large'];
    const currentIndex = sizes.indexOf(size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setSize(sizes[nextIndex]);
  };
  
  return (
    <div 
      className={cn(
        "bg-panel border-t border-border/50 flex flex-col transition-all duration-300",
        config.height
      )}
    >
      {/* Header */}
      <div className="h-10 flex items-center px-4 gap-4 border-b border-border/30">
        {/* Size controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={cycleSize}
          >
            {size === 'mini' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Separator */}
        <div className="w-px h-5 bg-border/50" />
        
        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => onSeek?.(0)}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
            onClick={() => onSeek?.(totalFrames - 1)}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7"
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Separator */}
        <div className="w-px h-5 bg-border/50" />
        
        {/* Timecode */}
        <div className="font-mono text-xs tabular-nums">
          <span className="text-primary">{frameToTimecode(currentFrame)}</span>
          <span className="text-muted-foreground"> / {frameToTimecode(totalFrames)}</span>
        </div>
        
        {/* FPS */}
        <div className="text-xs text-muted-foreground">
          {fps} fps
        </div>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Frame number */}
        <div className="font-mono text-xs tabular-nums text-muted-foreground">
          Frame: <span className="text-foreground">{currentFrame}</span>
        </div>
      </div>
      
      {/* Timeline track area (shown in medium/large) */}
      {config.showTracks && (
        <div className="flex-1 flex">
          {/* Track labels */}
          <div className="w-32 border-r border-border/30 p-2">
            <div className="h-8 flex items-center text-xs text-muted-foreground">
              Object 1
            </div>
            <div className="h-8 flex items-center text-xs text-muted-foreground">
              Object 2
            </div>
          </div>
          
          {/* Timeline ruler and tracks */}
          <div className="flex-1 overflow-x-auto">
            {/* Ruler */}
            <div className="h-6 border-b border-border/30 flex items-end">
              {Array.from({ length: Math.ceil(totalFrames / 10) }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 relative"
                  style={{ width: 80 }}
                >
                  <div className="absolute bottom-0 left-0 w-px h-2 bg-border" />
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {i * 10}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Tracks */}
            <div className="relative">
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-primary z-10"
                style={{ left: (currentFrame / totalFrames) * 100 + '%' }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
              </div>
              
              {/* Track rows */}
              <div className="h-8 border-b border-border/20 timeline-track mx-2 mt-1" />
              <div className="h-8 border-b border-border/20 timeline-track mx-2 mt-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
