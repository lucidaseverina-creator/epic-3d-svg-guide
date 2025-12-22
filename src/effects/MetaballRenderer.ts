// Metaball (Lava Lamp) Effect Renderer
// Uses SDF-based metaball rendering

import { Metaball, MetaballConfig } from './types';
import { simplex2D } from './noise';

export class MetaballRenderer {
  metaballs: Metaball[] = [];
  config: MetaballConfig;
  width: number;
  height: number;
  time: number = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  
  constructor(config: MetaballConfig, width: number, height: number) {
    this.config = config;
    this.width = width;
    this.height = height;
    this.initMetaballs();
    this.initCanvas();
  }
  
  private initCanvas(): void {
    this.canvas = document.createElement('canvas');
    // Use lower resolution for performance
    this.canvas.width = Math.floor(this.width / 4);
    this.canvas.height = Math.floor(this.height / 4);
    this.ctx = this.canvas.getContext('2d')!;
    this.imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
  }
  
  private initMetaballs(): void {
    this.metaballs = [];
    const { blobCount, blobRadius } = this.config;
    
    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2;
      const radius = Math.random() * 100 + 50;
      
      this.metaballs.push({
        id: i,
        x: this.width / 2 + Math.cos(angle) * radius,
        y: this.height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: blobRadius * (0.5 + Math.random() * 0.5),
        color: this.config.color,
      });
    }
  }
  
  update(dt: number): void {
    this.time += dt;
    const { speed } = this.config;
    
    for (const ball of this.metaballs) {
      // Add noise-based movement
      const noiseX = simplex2D(ball.id * 0.1, this.time * 0.3) * 0.5;
      const noiseY = simplex2D(ball.id * 0.1 + 100, this.time * 0.3) * 0.5;
      
      ball.vx += noiseX * speed;
      ball.vy += noiseY * speed;
      
      // Damping
      ball.vx *= 0.98;
      ball.vy *= 0.98;
      
      // Update position
      ball.x += ball.vx * speed * 50 * dt;
      ball.y += ball.vy * speed * 50 * dt;
      
      // Boundary bounce
      const margin = ball.radius;
      if (ball.x < margin) { ball.x = margin; ball.vx *= -1; }
      if (ball.x > this.width - margin) { ball.x = this.width - margin; ball.vx *= -1; }
      if (ball.y < margin) { ball.y = margin; ball.vy *= -1; }
      if (ball.y > this.height - margin) { ball.y = this.height - margin; ball.vy *= -1; }
    }
  }
  
  // Render to offscreen canvas and return as data URL
  render(): string {
    if (!this.canvas || !this.ctx || !this.imageData) {
      return '';
    }
    
    const { smoothness, glowIntensity } = this.config;
    const data = this.imageData.data;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scaleX = this.width / w;
    const scaleY = this.height / h;
    
    // Parse colors
    const color = this.hexToRgb(this.config.color);
    const color2 = this.hexToRgb(this.config.secondaryColor || this.config.color);
    
    // Clear
    data.fill(0);
    
    // Calculate metaball field
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const worldX = x * scaleX;
        const worldY = y * scaleY;
        
        // Sum of inverse distance to all metaballs
        let sum = 0;
        for (const ball of this.metaballs) {
          const dx = worldX - ball.x;
          const dy = worldY - ball.y;
          const distSq = dx * dx + dy * dy;
          sum += (ball.radius * ball.radius) / distSq;
        }
        
        // Threshold for metaball surface
        const threshold = smoothness;
        
        if (sum > threshold) {
          const idx = (y * w + x) * 4;
          
          // Interpolate between colors based on field intensity
          const t = Math.min((sum - threshold) / threshold, 1);
          const glowT = Math.min(sum / (threshold * 3), 1) * glowIntensity;
          
          // Color with glow
          data[idx] = Math.min(255, color.r * (1 - t) + color2.r * t + 50 * glowT);
          data[idx + 1] = Math.min(255, color.g * (1 - t) + color2.g * t + 30 * glowT);
          data[idx + 2] = Math.min(255, color.b * (1 - t) + color2.b * t);
          data[idx + 3] = Math.min(255, 200 + 55 * glowT);
        }
      }
    }
    
    this.ctx.putImageData(this.imageData, 0, 0);
    return this.canvas.toDataURL();
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 255, g: 102, b: 0 };
  }
  
  resize(width: number, height: number): void {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    
    this.width = width;
    this.height = height;
    
    for (const ball of this.metaballs) {
      ball.x *= scaleX;
      ball.y *= scaleY;
    }
    
    this.initCanvas();
  }
  
  reset(): void {
    this.time = 0;
    this.initMetaballs();
  }
}
