// Volumetric Clouds Effect Renderer
// Uses layered noise for cloud density

import { CloudConfig, CloudPuff } from './types';
import { fbm2D, simplex2D, warpedNoise2D } from './noise';

export class CloudRenderer {
  config: CloudConfig;
  width: number;
  height: number;
  time: number = 0;
  puffs: CloudPuff[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor(config: CloudConfig, width: number, height: number) {
    this.config = config;
    this.width = width;
    this.height = height;
    this.initCanvas();
    this.initPuffs();
  }
  
  private initCanvas(): void {
    this.canvas = document.createElement('canvas');
    // Lower res for performance
    this.canvas.width = Math.floor(this.width / 2);
    this.canvas.height = Math.floor(this.height / 2);
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  private initPuffs(): void {
    this.puffs = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      this.puffs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.4,
        z: Math.random(),
        radius: 50 + Math.random() * 100,
        density: 0.3 + Math.random() * 0.7,
        age: Math.random() * 100,
      });
    }
  }
  
  update(dt: number): void {
    this.time += dt;
    const { speed } = this.config;
    
    // Move cloud puffs
    for (const puff of this.puffs) {
      puff.x += speed * 30 * dt;
      puff.age += dt;
      
      // Wrap around
      if (puff.x > this.width + puff.radius) {
        puff.x = -puff.radius;
        puff.y = Math.random() * this.height * 0.4;
        puff.density = 0.3 + Math.random() * 0.7;
      }
    }
  }
  
  render(): string {
    if (!this.canvas || !this.ctx) return '';
    
    const ctx = this.ctx;
    const { density, coverage, turbulence, layers } = this.config;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scaleX = this.width / w;
    const scaleY = this.height / h;
    
    // Clear with sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, 'rgba(100, 150, 255, 0.3)');
    skyGrad.addColorStop(1, 'rgba(200, 220, 255, 0.1)');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);
    
    // Parse cloud color
    const cloudColor = this.hexToRgb(this.config.color);
    const shadowColor = this.hexToRgb(this.config.secondaryColor || '#aabbcc');
    
    // Draw procedural clouds using noise
    const cloudRegionH = h * 0.5;
    
    for (let layer = 0; layer < layers; layer++) {
      const layerOffset = layer * 0.3;
      const layerAlpha = 0.4 - layer * 0.1;
      
      for (let y = 0; y < cloudRegionH; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const worldX = x * scaleX;
          const worldY = y * scaleY;
          
          // Multi-octave noise for cloud shape
          const noiseScale = 0.003;
          let cloudDensity = warpedNoise2D(
            (worldX + this.time * 20 * (layer + 1)) * noiseScale,
            worldY * noiseScale + layerOffset,
            turbulence
          );
          
          // Add detail noise
          cloudDensity += fbm2D(
            worldX * noiseScale * 3 + this.time * 10,
            worldY * noiseScale * 3,
            3
          ) * 0.3;
          
          // Threshold for cloud visibility
          const threshold = 1 - coverage;
          
          if (cloudDensity > threshold) {
            const t = (cloudDensity - threshold) / (1 - threshold);
            const alpha = Math.min(t * density * layerAlpha, 0.9);
            
            // Lighting: lighter on top, darker on bottom
            const lightFactor = 1 - (y / cloudRegionH) * 0.3;
            
            const r = Math.floor(cloudColor.r * lightFactor + shadowColor.r * (1 - lightFactor));
            const g = Math.floor(cloudColor.g * lightFactor + shadowColor.g * (1 - lightFactor));
            const b = Math.floor(cloudColor.b * lightFactor + shadowColor.b * (1 - lightFactor));
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.fillRect(x, y, 3, 3);
          }
        }
      }
    }
    
    // Draw volumetric puffs
    for (const puff of this.puffs) {
      const screenX = puff.x / scaleX;
      const screenY = puff.y / scaleY;
      const screenR = puff.radius / scaleX;
      
      // Animated wobble
      const wobble = simplex2D(puff.age, 0) * 5;
      
      const grad = ctx.createRadialGradient(
        screenX + wobble, screenY, 0,
        screenX, screenY, screenR
      );
      
      const alpha = puff.density * density * 0.5;
      grad.addColorStop(0, `rgba(${cloudColor.r}, ${cloudColor.g}, ${cloudColor.b}, ${alpha})`);
      grad.addColorStop(0.5, `rgba(${cloudColor.r}, ${cloudColor.g}, ${cloudColor.b}, ${alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenR, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return this.canvas.toDataURL();
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 255, g: 255, b: 255 };
  }
  
  resize(width: number, height: number): void {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    
    this.width = width;
    this.height = height;
    
    for (const puff of this.puffs) {
      puff.x *= scaleX;
      puff.y *= scaleY;
      puff.radius *= scaleX;
    }
    
    this.initCanvas();
  }
  
  reset(): void {
    this.time = 0;
    this.initPuffs();
  }
}
