// Fire Effect Renderer
// Procedural fire with sparks

import { FireConfig, EffectParticle } from './types';
import { simplex2D, ridged2D, turbulence2D } from './noise';

export class FireRenderer {
  config: FireConfig;
  width: number;
  height: number;
  time: number = 0;
  sparks: EffectParticle[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private nextId = 0;
  
  constructor(config: FireConfig, width: number, height: number) {
    this.config = config;
    this.width = width;
    this.height = height;
    this.initCanvas();
    this.initSparks();
  }
  
  private initCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.floor(this.width / 2);
    this.canvas.height = Math.floor(this.height / 2);
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  private initSparks(): void {
    this.sparks = [];
    this.emitSparks(this.config.sparkCount);
  }
  
  private emitSparks(count: number): void {
    const baseX = this.width / 2;
    const baseY = this.height * 0.8;
    
    for (let i = 0; i < count; i++) {
      this.sparks.push({
        id: this.nextId++,
        x: baseX + (Math.random() - 0.5) * 100,
        y: baseY,
        vx: (Math.random() - 0.5) * 50,
        vy: -50 - Math.random() * 100,
        life: 1,
        maxLife: 1 + Math.random() * 2,
        size: 1 + Math.random() * 3,
        color: '#ffaa00',
        temperature: 1,
      });
    }
  }
  
  update(dt: number): void {
    this.time += dt;
    
    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const spark = this.sparks[i];
      
      // Apply forces
      spark.vy += 20 * dt; // Slight gravity
      spark.vx += (Math.random() - 0.5) * 100 * dt; // Turbulence
      
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      
      spark.life -= dt / spark.maxLife;
      spark.temperature = spark.life;
      
      if (spark.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }
    
    // Emit new sparks
    if (Math.random() < 0.5) {
      this.emitSparks(2);
    }
    
    // Limit spark count
    while (this.sparks.length > this.config.sparkCount * 2) {
      this.sparks.shift();
    }
  }
  
  render(): string {
    if (!this.canvas || !this.ctx) return '';
    
    const ctx = this.ctx;
    const { flames, height: fireHeight, turbulence, intensity } = this.config;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scaleX = this.width / w;
    const scaleY = this.height / h;
    
    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // Parse colors
    const coreColor = this.hexToRgb('#ffffaa');
    const midColor = this.hexToRgb(this.config.secondaryColor || '#ffaa00');
    const outerColor = this.hexToRgb(this.config.color);
    
    // Fire base position
    const fireBaseY = h * 0.8;
    const fireWidth = w * 0.6;
    const fireCenterX = w / 2;
    
    // Draw fire using noise-based flames
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const worldX = x * scaleX;
        const worldY = y * scaleY;
        
        // Distance from fire center
        const dx = (x - fireCenterX) / (fireWidth / 2);
        const distFromCenter = Math.abs(dx);
        
        // Height factor (fire intensity decreases with height)
        const heightFactor = 1 - Math.max(0, (fireBaseY - y) / (fireHeight / scaleY));
        
        if (heightFactor < 0 || heightFactor > 1 || distFromCenter > 1.5) {
          continue;
        }
        
        // Fire shape using ridged noise (creates flame-like peaks)
        const noiseScale = 0.02;
        const flameNoise = ridged2D(
          worldX * noiseScale + dx * 0.5,
          worldY * noiseScale - this.time * 3
        );
        
        // Turbulent distortion
        const turb = turbulence2D(
          worldX * noiseScale * 2,
          worldY * noiseScale * 2 - this.time * 2
        ) * turbulence;
        
        // Combine factors
        let fireIntensity = flameNoise * (1 - distFromCenter) * (1 - heightFactor * 0.8);
        fireIntensity += turb * 0.3;
        fireIntensity *= intensity;
        
        // Threshold
        if (fireIntensity < 0.2) continue;
        
        const idx = (y * w + x) * 4;
        
        // Color based on intensity (hot core -> cooler edges)
        let r: number, g: number, b: number, a: number;
        
        if (fireIntensity > 0.7) {
          // Hot core - white/yellow
          const t = (fireIntensity - 0.7) / 0.3;
          r = coreColor.r * t + midColor.r * (1 - t);
          g = coreColor.g * t + midColor.g * (1 - t);
          b = coreColor.b * t + midColor.b * (1 - t);
          a = 255;
        } else if (fireIntensity > 0.4) {
          // Mid - orange
          const t = (fireIntensity - 0.4) / 0.3;
          r = midColor.r * t + outerColor.r * (1 - t);
          g = midColor.g * t + outerColor.g * (1 - t);
          b = midColor.b * t + outerColor.b * (1 - t);
          a = 220 + t * 35;
        } else {
          // Outer - red/dark
          const t = (fireIntensity - 0.2) / 0.2;
          r = outerColor.r * t;
          g = outerColor.g * t;
          b = outerColor.b * t;
          a = t * 200;
        }
        
        data[idx] = Math.min(255, r);
        data[idx + 1] = Math.min(255, g);
        data[idx + 2] = Math.min(255, b);
        data[idx + 3] = Math.min(255, a);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Draw sparks
    ctx.globalCompositeOperation = 'lighter';
    
    for (const spark of this.sparks) {
      const screenX = spark.x / scaleX;
      const screenY = spark.y / scaleY;
      
      if (screenY > fireBaseY) continue;
      
      const grad = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, spark.size * 2
      );
      
      const temp = spark.temperature || 1;
      grad.addColorStop(0, `rgba(255, ${200 + temp * 55}, ${temp * 100}, ${temp})`);
      grad.addColorStop(1, 'rgba(255, 150, 0, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenX, screenY, spark.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add glow effect
    const glowGrad = ctx.createRadialGradient(
      fireCenterX, fireBaseY, 0,
      fireCenterX, fireBaseY, fireWidth
    );
    glowGrad.addColorStop(0, `rgba(255, 150, 50, ${intensity * 0.3})`);
    glowGrad.addColorStop(0.5, `rgba(255, 100, 0, ${intensity * 0.1})`);
    glowGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, fireBaseY - fireHeight / scaleY, w, fireHeight / scaleY + 50);
    
    ctx.globalCompositeOperation = 'source-over';
    
    return this.canvas.toDataURL();
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 255, g: 68, b: 0 };
  }
  
  resize(width: number, height: number): void {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    
    this.width = width;
    this.height = height;
    
    for (const spark of this.sparks) {
      spark.x *= scaleX;
      spark.y *= scaleY;
    }
    
    this.initCanvas();
  }
  
  reset(): void {
    this.time = 0;
    this.initSparks();
  }
}
