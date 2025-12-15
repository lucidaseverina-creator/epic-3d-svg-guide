import React, { useMemo } from 'react';
import { Vector3 } from '@/types/engine';
import { cn } from '@/lib/utils';

interface CameraGizmoProps {
  rotation: Vector3;
  onPreset: (preset: 'front' | 'back' | 'left' | 'right' | 'top') => void;
  className?: string;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const CameraGizmo: React.FC<CameraGizmoProps> = ({ rotation, onPreset, className }) => {
  // Tiny hint of where the camera is "looking" based on yaw/pitch.
  const hint = useMemo(() => {
    const yaw = rotation.y;
    const pitch = rotation.x;
    const hx = Math.cos(yaw) * Math.cos(pitch);
    const hy = -Math.sin(pitch);
    const hz = Math.sin(yaw) * Math.cos(pitch);
    return { x: hx, y: hy, z: hz };
  }, [rotation.x, rotation.y]);

  const glow = clamp01((hint.z + 1) / 2);

  return (
    <aside
      className={cn(
        'pointer-events-auto select-none rounded-lg border border-border/50 bg-panel/80 backdrop-blur-xl shadow-panel',
        className
      )}
      aria-label="Camera gizmo"
    >
      <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
        <span className="text-[11px] tracking-wide text-muted-foreground">VIEW</span>
        <span
          className="text-[10px] font-mono text-muted-foreground"
          style={{ opacity: 0.35 + glow * 0.65 }}
        >
          yaw {rotation.y.toFixed(2)}
        </span>
      </div>
      <div className="p-2 grid grid-cols-3 gap-1">
        <button
          className="h-8 rounded-md bg-muted/20 hover:bg-muted/30 text-xs text-foreground"
          onClick={() => onPreset('top')}
          type="button"
        >
          TOP
        </button>
        <button
          className="h-8 rounded-md bg-muted/20 hover:bg-muted/30 text-xs text-foreground"
          onClick={() => onPreset('front')}
          type="button"
        >
          FRONT
        </button>
        <button
          className="h-8 rounded-md bg-muted/20 hover:bg-muted/30 text-xs text-foreground"
          onClick={() => onPreset('back')}
          type="button"
        >
          BACK
        </button>
        <button
          className="h-8 rounded-md bg-muted/20 hover:bg-muted/30 text-xs text-foreground"
          onClick={() => onPreset('left')}
          type="button"
        >
          LEFT
        </button>
        <div className="h-8 rounded-md bg-muted/10 border border-border/30" />
        <button
          className="h-8 rounded-md bg-muted/20 hover:bg-muted/30 text-xs text-foreground"
          onClick={() => onPreset('right')}
          type="button"
        >
          RIGHT
        </button>
      </div>
    </aside>
  );
};
