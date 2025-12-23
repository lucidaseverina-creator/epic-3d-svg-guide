import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if any effect is enabled
  const hasActiveEffect = Object.values(effects).some(e => e.enabled);

  // Initialize renderers when dimensions are valid
  useEffect(() => {
    if (width <= 0 || height <= 0) return;

    console.log('EffectsCanvas: Initializing renderers', { width, height });

    renderersRef.current = {
      metaballs: new MetaballRenderer({ ...defaultMetaballConfig }, width, height),
      clouds: new CloudRenderer({ ...defaultCloudConfig }, width, height),
      godrays: new GodrayRenderer({ ...defaultGodrayConfig }, width, height),
      water: new WaterRenderer({ ...defaultWaterConfig }, width, height),
      fire: new FireRenderer({ ...defaultFireConfig }, width, height),
    };

    setIsInitialized(true);
    console.log('EffectsCanvas: Renderers initialized');

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);

  // Animation loop - renders directly from renderer canvases
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const renderers = renderersRef.current;
    const now = performance.now();
    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Render water layer
    if (effects.water?.enabled && renderers.water) {
      renderers.water.update(dt);
      renderers.water.renderToCanvas();
      const srcCanvas = renderers.water.getCanvas();
      if (srcCanvas) {
        ctx.globalAlpha = effects.water.intensity;
        ctx.drawImage(srcCanvas, 0, 0, width, height);
        ctx.globalAlpha = 1;
      }
    }

    // Render clouds layer
    if (effects.clouds?.enabled && renderers.clouds) {
      renderers.clouds.update(dt);
      renderers.clouds.renderToCanvas();
      const srcCanvas = renderers.clouds.getCanvas();
      if (srcCanvas) {
        ctx.globalAlpha = effects.clouds.intensity * 0.8;
        ctx.drawImage(srcCanvas, 0, 0, width, height);
        ctx.globalAlpha = 1;
      }
    }

    // Render metaballs layer
    if (effects.metaballs?.enabled && renderers.metaballs) {
      renderers.metaballs.update(dt);
      renderers.metaballs.renderToCanvas();
      const srcCanvas = renderers.metaballs.getCanvas();
      if (srcCanvas) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = effects.metaballs.intensity;
        ctx.drawImage(srcCanvas, 0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    }

    // Render fire layer
    if (effects.fire?.enabled && renderers.fire) {
      renderers.fire.update(dt);
      renderers.fire.renderToCanvas();
      const srcCanvas = renderers.fire.getCanvas();
      if (srcCanvas) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = effects.fire.intensity;
        ctx.drawImage(srcCanvas, 0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    }

    // Render godrays layer
    if (effects.godrays?.enabled && renderers.godrays) {
      renderers.godrays.update(dt);
      renderers.godrays.renderToCanvas();
      const srcCanvas = renderers.godrays.getCanvas();
      if (srcCanvas) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = effects.godrays.intensity * 0.6;
        ctx.drawImage(srcCanvas, 0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [effects, width, height]);

  // Start/stop animation based on active effects and initialization
  useEffect(() => {
    if (hasActiveEffect && isInitialized && width > 0 && height > 0) {
      console.log('EffectsCanvas: Starting animation loop');
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      console.log('EffectsCanvas: Stopping animation loop');
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [hasActiveEffect, isInitialized, animate, width, height]);

  // Don't render canvas if no effects are active or dimensions invalid
  if (!hasActiveEffect || width <= 0 || height <= 0) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        zIndex: 15,
      }}
    />
  );
};
