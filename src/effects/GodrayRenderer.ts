// God Rays (Crepuscular Rays) Effect Renderer
// Screen-space light shafts

import { GodrayConfig, GodRay } from './types';
import { simplex2D } from './noise';

export class GodrayRenderer {
  config: GodrayConfig;
  width: number;
  height: number;
  time: number = 0;
  rays: GodRay[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor(config: GodrayConfig, width: number, height: number) {
    this.config = config;
    this.width = width;
    this.height = height;
    this.initCanvas();
    this.initRays();
  }
  
  private initCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  private initRays(): void {
    this.rays = [];
    const { rayCount } = this.config;
    
    const baseAngle = -Math.PI / 6; // Slight downward angle
    const spreadAngle = Math.PI / 3;
    
    for (let i = 0; i < rayCount; i++) {
      const t = i / (rayCount - 1);
      this.rays.push({
        angle: baseAngle - spreadAngle / 2 + t * spreadAngle,
        length: 0.6 + Math.random() * 0.4,
        intensity: 0.5 + Math.random() * 0.5,
        width: 20 + Math.random() * 40,
      });
    }
  }
  
  update(dt: number): void {
    this.time += dt;
    
    // Animate ray intensity with noise
    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      const noise = simplex2D(i * 0.5, this.time * 0.3);
      ray.intensity = 0.4 + noise * 0.3 + 0.3;
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
    const { sunPosition, rayLength, decay, exposure, intensity } = this.config;
    const w = this.width;
    const h = this.height;
    
    // Clear with transparent
    ctx.clearRect(0, 0, w, h);
    
    // Sun position in screen space
    const sunX = sunPosition.x * w;
    const sunY = sunPosition.y * h;
    
    // Parse color
    const color = this.hexToRgb(this.config.color);
    
    // Draw sun glow
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
    sunGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.8})`);
    sunGrad.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.4})`);
    sunGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
    
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 150, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw god rays
    ctx.globalCompositeOperation = 'lighter';
    
    for (const ray of this.rays) {
      const rayLen = rayLength * Math.max(w, h) * ray.length;
      const endX = sunX + Math.cos(ray.angle) * rayLen;
      const endY = sunY + Math.sin(ray.angle) * rayLen;
      
      // Create gradient along ray
      const grad = ctx.createLinearGradient(sunX, sunY, endX, endY);
      const alpha = ray.intensity * exposure * intensity;
      
      grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      
      // Apply decay along ray
      let currentDecay = 1;
      for (let t = 0.1; t <= 1; t += 0.1) {
        currentDecay *= decay;
        grad.addColorStop(t, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * currentDecay})`);
      }
      
      // Draw ray as a tapered shape
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(ray.angle);
      
      ctx.beginPath();
      ctx.moveTo(0, -ray.width / 2);
      ctx.lineTo(rayLen, -ray.width / 4);
      ctx.lineTo(rayLen, ray.width / 4);
      ctx.lineTo(0, ray.width / 2);
      ctx.closePath();
      
      ctx.fillStyle = grad;
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.globalCompositeOperation = 'source-over';
    
    // Add atmospheric haze
    const hazeGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, Math.max(w, h));
    hazeGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.15})`);
    hazeGrad.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.05})`);
    hazeGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
    
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, 0, w, h);
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 255, g: 255, b: 200 };
  }
  
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.initCanvas();
  }
  
  reset(): void {
    this.time = 0;
    this.initRays();
  }
}
