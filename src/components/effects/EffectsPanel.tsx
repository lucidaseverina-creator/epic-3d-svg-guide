import React from 'react';
import { Flame, Droplets, Cloud, Sun, CircleDot, Wind, Waves, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { EffectType } from '@/effects/types';

interface EffectConfig {
  enabled: boolean;
  intensity: number;
}

interface EffectsPanelProps {
  effects: Record<EffectType, EffectConfig>;
  onToggleEffect: (effect: EffectType) => void;
  onIntensityChange: (effect: EffectType, intensity: number) => void;
}

const effectInfo: { type: EffectType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'metaballs', label: 'Metaballs', icon: <CircleDot className="w-4 h-4" />, color: 'text-orange-500' },
  { type: 'fluid', label: 'Fluid', icon: <Droplets className="w-4 h-4" />, color: 'text-blue-400' },
  { type: 'water', label: 'Water', icon: <Waves className="w-4 h-4" />, color: 'text-cyan-400' },
  { type: 'clouds', label: 'Clouds', icon: <Cloud className="w-4 h-4" />, color: 'text-slate-300' },
  { type: 'godrays', label: 'God Rays', icon: <Sun className="w-4 h-4" />, color: 'text-yellow-400' },
  { type: 'fire', label: 'Fire', icon: <Flame className="w-4 h-4" />, color: 'text-red-500' },
  { type: 'smoke', label: 'Smoke', icon: <Wind className="w-4 h-4" />, color: 'text-gray-400' },
  { type: 'particles', label: 'Particles', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-400' },
];

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  effects,
  onToggleEffect,
  onIntensityChange,
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Visual Effects
      </div>
      
      <div className="space-y-3">
        {effectInfo.map(({ type, label, icon, color }) => {
          const config = effects[type] || { enabled: false, intensity: 0.5 };
          
          return (
            <div
              key={type}
              className={cn(
                "p-3 rounded-lg border transition-all",
                config.enabled
                  ? "bg-secondary/50 border-primary/30"
                  : "bg-background/50 border-border/30 opacity-60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(color, config.enabled ? "" : "opacity-50")}>
                    {icon}
                  </span>
                  <Label className="text-sm font-medium">{label}</Label>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={() => onToggleEffect(type)}
                />
              </div>
              
              {config.enabled && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Intensity</span>
                    <span>{Math.round(config.intensity * 100)}%</span>
                  </div>
                  <Slider
                    value={[config.intensity * 100]}
                    onValueChange={([v]) => onIntensityChange(type, v / 100)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
