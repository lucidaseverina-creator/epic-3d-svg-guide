import React, { useRef, useEffect, useCallback } from 'react';
import { 
  EffectType, 
  defaultMetaballConfig,
  defaultCloudConfig,
  defaultGodrayConfig,
  defaultWaterConfig,
  defaultFireConfig,
} from '@/effects/types';
import { MetaballRenderer } from '@/effects/MetaballRenderer';
import { CloudRenderer } from '@/effects/CloudRenderer';
import { GodrayRenderer } from '@/effects/GodrayRenderer';
import { WaterRenderer } from '@/effects/WaterRenderer';
import { FireRenderer } from '@/effects/FireRenderer';

interface EffectConfig {
  enabled: boolean;
  intensity: number;
}

interface EffectsCanvasProps {
  width: number;
  height: number;
  effects: Record<EffectType, EffectConfig>;
  lightingMode: 'day' | 'night';
}

export const EffectsCanvas: React.FC<EffectsCanvasProps> = ({
  width,
  height,
  effects,
  lightingMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderersRef = useRef<{
    metaballs?: MetaballRenderer;
    clouds?: CloudRenderer;
    godrays?: GodrayRenderer;
    water?: WaterRenderer;
    fire?: FireRenderer;
  }>({});
  const animationRef = useRef<number>();
  const lastTimeRef = useRef(performance.now());

  // Initialize renderers
  useEffect(() => {
    if (width <= 0 || height <= 0) return;

    renderersRef.current = {
      metaballs: new MetaballRenderer(defaultMetaballConfig, width, height),
      clouds: new CloudRenderer(defaultCloudConfig, width, height),
      godrays: new GodrayRenderer(defaultGodrayConfig, width, height),
      water: new WaterRenderer(defaultWaterConfig, width, height),
      fire: new FireRenderer(defaultFireConfig, width, height),
    };

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderers = renderersRef.current;
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Check if any effect is active
    const hasActiveEffect = Object.values(effects).some(e => e.enabled);
    
    if (!hasActiveEffect) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Render each active effect layer
    if (effects.water?.enabled && renderers.water) {
      renderers.water.update(dt);
      const dataUrl = renderers.water.render();
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.globalAlpha = effects.water.intensity;
          ctx.drawImage(img, 0, 0, width, height);
          ctx.globalAlpha = 1;
        };
        img.src = dataUrl;
      }
    }

    if (effects.clouds?.enabled && renderers.clouds) {
      renderers.clouds.update(dt);
      const dataUrl = renderers.clouds.render();
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.globalAlpha = effects.clouds.intensity * 0.8;
          ctx.drawImage(img, 0, 0, width, height);
          ctx.globalAlpha = 1;
        };
        img.src = dataUrl;
      }
    }

    if (effects.metaballs?.enabled && renderers.metaballs) {
      renderers.metaballs.update(dt);
      const dataUrl = renderers.metaballs.render();
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = effects.metaballs.intensity;
          ctx.drawImage(img, 0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
        };
        img.src = dataUrl;
      }
    }

    if (effects.fire?.enabled && renderers.fire) {
      renderers.fire.update(dt);
      const dataUrl = renderers.fire.render();
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = effects.fire.intensity;
          ctx.drawImage(img, 0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
        };
        img.src = dataUrl;
      }
    }

    if (effects.godrays?.enabled && renderers.godrays) {
      renderers.godrays.update(dt);
      const dataUrl = renderers.godrays.render();
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = effects.godrays.intensity * 0.6;
          ctx.drawImage(img, 0, 0, width, height);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
        };
        img.src = dataUrl;
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [effects, width, height]);

  // Start/stop animation based on active effects
  useEffect(() => {
    const hasActiveEffect = Object.values(effects).some(e => e.enabled);
    
    if (hasActiveEffect) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [effects, animate]);

  // Don't render canvas if no effects are active
  const hasActiveEffect = Object.values(effects).some(e => e.enabled);
  
  if (!hasActiveEffect || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'normal' }}
    />
  );
};
