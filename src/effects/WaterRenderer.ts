// Water Surface with Waves Effect Renderer
// Simulates water surface with waves and ripples

import { WaterConfig, Ripple } from './types';
import { simplex2D, fbm2D } from './noise';

export class WaterRenderer {
  config: WaterConfig;
  width: number;
  height: number;
  time: number = 0;
  ripples: Ripple[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor(config: WaterConfig, width: number, height: number) {
    this.config = config;
    this.width = width;
    this.height = height;
    this.initCanvas();
    this.initRipples();
  }
  
  private initCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.floor(this.width / 2);
    this.canvas.height = Math.floor(this.height / 2);
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  private initRipples(): void {
    this.ripples = [];
    const { rippleCount } = this.config;
    
    for (let i = 0; i < rippleCount; i++) {
      this.addRipple(
        Math.random() * this.width,
        this.height * 0.3 + Math.random() * this.height * 0.5
      );
    }
  }
  
  addRipple(x: number, y: number): void {
    this.ripples.push({
      x,
      y,
      radius: 0,
      amplitude: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      age: 0,
    });
    
    // Limit ripple count
    if (this.ripples.length > 20) {
      this.ripples.shift();
    }
  }
  
  update(dt: number): void {
    this.time += dt;
    
    // Update ripples
    const { waveSpeed } = this.config;
    
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      ripple.age += dt;
      ripple.radius += waveSpeed * 50 * dt;
      ripple.amplitude *= 0.98; // Decay
      
      // Remove old ripples
      if (ripple.amplitude < 0.01) {
        this.ripples.splice(i, 1);
      }
    }
    
    // Occasionally add new ripples
    if (Math.random() < 0.02) {
      this.addRipple(
        Math.random() * this.width,
        this.height * 0.3 + Math.random() * this.height * 0.5
      );
    }
  }
  
  render(): string {
    this.renderToCanvas();
    return this.canvas?.toDataURL() || '';
  }
  
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }
  
  renderToCanvas(): void {
    if (!this.canvas || !this.ctx) return;
    
    const ctx = this.ctx;
    const { waveAmplitude, waveFrequency, reflectivity } = this.config;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scaleX = this.width / w;
    const scaleY = this.height / h;
    
    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // Parse colors
    const waterColor = this.hexToRgb(this.config.color);
    const highlightColor = this.hexToRgb(this.config.secondaryColor || '#88ddff');
    
    // Water surface starts at 30% height
    const waterY = Math.floor(h * 0.3);
    
    // Draw water surface with waves
    for (let y = waterY; y < h; y++) {
      const depth = (y - waterY) / (h - waterY);
      
      for (let x = 0; x < w; x++) {
        const worldX = x * scaleX;
        const worldY = y * scaleY;
        
        // Wave displacement
        let waveOffset = 0;
        
        // Main wave pattern
        waveOffset += Math.sin(worldX * waveFrequency + this.time * 2) * waveAmplitude * 0.3;
        waveOffset += Math.sin(worldX * waveFrequency * 0.7 + this.time * 1.5 + 1) * waveAmplitude * 0.2;
        
        // Add noise for organic look
        waveOffset += fbm2D(worldX * 0.01, this.time * 0.5, 2) * waveAmplitude * 0.5;
        
        // Ripple contributions
        for (const ripple of this.ripples) {
          const dx = worldX - ripple.x;
          const dy = worldY - ripple.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (Math.abs(dist - ripple.radius) < 50) {
            const rippleWave = Math.sin((dist - ripple.radius) * 0.3 + ripple.phase);
            const falloff = Math.max(0, 1 - Math.abs(dist - ripple.radius) / 50);
            waveOffset += rippleWave * ripple.amplitude * falloff * waveAmplitude;
          }
        }
        
        // Calculate normal for lighting (simplified)
        const normalY = 1 - Math.abs(waveOffset / waveAmplitude) * 0.5;
        
        // Fresnel-like reflection based on view angle (simulated)
        const fresnel = Math.pow(1 - normalY, 2) * reflectivity;
        
        // Water color with depth darkening
        const depthFactor = 1 - depth * 0.5;
        
        const r = Math.floor(waterColor.r * depthFactor * (1 - fresnel) + highlightColor.r * fresnel);
        const g = Math.floor(waterColor.g * depthFactor * (1 - fresnel) + highlightColor.g * fresnel);
        const b = Math.floor(waterColor.b * depthFactor * (1 - fresnel) + highlightColor.b * fresnel);
        
        // Apply wave highlight
        const highlight = waveOffset > 0 ? waveOffset / waveAmplitude * 0.3 : 0;
        
        const alpha = 0.6 + depth * 0.3;
        
        ctx.fillStyle = `rgba(${Math.min(255, r + highlight * 100)}, ${Math.min(255, g + highlight * 100)}, ${Math.min(255, b + highlight * 50)}, ${alpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    
    // Draw wave crests as lines
    ctx.strokeStyle = `rgba(${highlightColor.r}, ${highlightColor.g}, ${highlightColor.b}, 0.5)`;
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const baseY = waterY + i * 30;
      
      for (let x = 0; x < w; x++) {
        const worldX = x * scaleX;
        const wave = Math.sin(worldX * waveFrequency + this.time * 2 + i) * 5;
        const noise = simplex2D(worldX * 0.02, this.time + i) * 3;
        
        if (x === 0) {
          ctx.moveTo(x, baseY + wave + noise);
        } else {
          ctx.lineTo(x, baseY + wave + noise);
        }
      }
      
      ctx.stroke();
    }
    
    // Add caustic light patterns underwater
    ctx.globalCompositeOperation = 'lighter';
    
    for (let i = 0; i < 10; i++) {
      const causticX = (simplex2D(i * 0.5, this.time * 0.3) + 1) * 0.5 * w;
      const causticY = waterY + 20 + i * 20;
      
      const grad = ctx.createRadialGradient(causticX, causticY, 0, causticX, causticY, 30);
      grad.addColorStop(0, 'rgba(200, 230, 255, 0.2)');
      grad.addColorStop(1, 'rgba(200, 230, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(causticX, causticY, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 34, g: 102, b: 204 };
  }
  
  resize(width: number, height: number): void {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    
    this.width = width;
    this.height = height;
    
    for (const ripple of this.ripples) {
      ripple.x *= scaleX;
      ripple.y *= scaleY;
      ripple.radius *= scaleX;
    }
    
    this.initCanvas();
  }
  
  reset(): void {
    this.time = 0;
    this.initRipples();
  }
}
