// SPH Fluid Simulation Engine
// Based on Smoothed Particle Hydrodynamics

import { EffectParticle, FluidConfig } from './types';

export class FluidSimulation {
  particles: EffectParticle[] = [];
  config: FluidConfig;
  width: number;
  height: number;
  private nextId = 0;
  
  constructor(config: FluidConfig, width: number, height: number) {
    this.config = config;
    this.width = width;
    this.height = height;
    this.initParticles();
  }
  
  private initParticles(): void {
    this.particles = [];
    const { particleCount } = this.config;
    
    // Initialize in a grid pattern at bottom
    const cols = Math.ceil(Math.sqrt(particleCount));
    const rows = Math.ceil(particleCount / cols);
    const spacing = 12;
    const offsetX = (this.width - cols * spacing) / 2;
    const offsetY = this.height - rows * spacing - 50;
    
    for (let i = 0; i < particleCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      this.particles.push({
        id: this.nextId++,
        x: offsetX + col * spacing + (Math.random() - 0.5) * 2,
        y: offsetY + row * spacing + (Math.random() - 0.5) * 2,
        vx: 0,
        vy: 0,
        life: 1,
        maxLife: 1,
        size: 6,
        color: this.config.color,
        density: 0,
        pressure: 0,
      });
    }
  }
  
  // SPH kernel functions
  private poly6(r: number, h: number): number {
    if (r >= h) return 0;
    const x = 1 - (r * r) / (h * h);
    return (315 / (64 * Math.PI * Math.pow(h, 9))) * x * x * x;
  }
  
  private spikyGrad(r: number, h: number): number {
    if (r >= h || r === 0) return 0;
    const x = 1 - r / h;
    return (-45 / (Math.PI * Math.pow(h, 6))) * x * x;
  }
  
  update(dt: number, mousePos?: { x: number; y: number; active: boolean }): void {
    const { viscosity, pressure, gravity, smoothingRadius } = this.config;
    const h = smoothingRadius * 100; // Scale for screen space
    const restDensity = 1000;
    const maxSpeed = 300;
    
    // Apply gravity
    for (const p of this.particles) {
      p.vy += gravity.y * 500 * dt;
      p.vx += gravity.x * 500 * dt;
    }
    
    // Mouse interaction
    if (mousePos?.active) {
      const forceRadius = 80;
      const forceStrength = 500;
      
      for (const p of this.particles) {
        const dx = p.x - mousePos.x;
        const dy = p.y - mousePos.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < forceRadius && dist > 0) {
          const force = (1 - dist / forceRadius) * forceStrength;
          p.vx += (dx / dist) * force * dt;
          p.vy += (dy / dist) * force * dt;
        }
      }
    }
    
    // Calculate densities
    const densities: number[] = new Array(this.particles.length).fill(0);
    
    for (let i = 0; i < this.particles.length; i++) {
      const pi = this.particles[i];
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const pj = this.particles[j];
        const dx = pj.x - pi.x;
        const dy = pj.y - pi.y;
        const r = Math.hypot(dx, dy);
        
        if (r < h) {
          const w = this.poly6(r, h);
          densities[i] += w;
          densities[j] += w;
        }
      }
    }
    
    // Calculate pressure forces and viscosity
    const forces: { x: number; y: number }[] = this.particles.map(() => ({ x: 0, y: 0 }));
    
    for (let i = 0; i < this.particles.length; i++) {
      const pi = this.particles[i];
      const pressureI = pressure * (densities[i] - restDensity);
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const pj = this.particles[j];
        const dx = pj.x - pi.x;
        const dy = pj.y - pi.y;
        const r = Math.hypot(dx, dy);
        
        if (r < h && r > 0) {
          const dir = { x: dx / r, y: dy / r };
          const pressureJ = pressure * (densities[j] - restDensity);
          
          // Pressure force
          const pressureForce = this.spikyGrad(r, h) * 
            (pressureI + pressureJ) / 
            (2 * Math.max(densities[i] * densities[j], 0.001));
          
          forces[i].x -= pressureForce * dir.x;
          forces[i].y -= pressureForce * dir.y;
          forces[j].x += pressureForce * dir.x;
          forces[j].y += pressureForce * dir.y;
          
          // Viscosity
          const relVelX = pj.vx - pi.vx;
          const relVelY = pj.vy - pi.vy;
          const viscLaplacian = this.poly6(r, h);
          const viscForce = viscosity * viscLaplacian / 
            Math.max(densities[i] + densities[j], 0.001);
          
          forces[i].x += viscForce * relVelX;
          forces[i].y += viscForce * relVelY;
          forces[j].x -= viscForce * relVelX;
          forces[j].y -= viscForce * relVelY;
        }
      }
    }
    
    // Integrate
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      p.vx += forces[i].x * dt;
      p.vy += forces[i].y * dt;
      
      // Clamp speed
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Store density for coloring
      p.density = densities[i];
      
      // Boundary collision
      const margin = p.size;
      const bounce = 0.3;
      
      if (p.x < margin) {
        p.x = margin;
        p.vx *= -bounce;
      }
      if (p.x > this.width - margin) {
        p.x = this.width - margin;
        p.vx *= -bounce;
      }
      if (p.y < margin) {
        p.y = margin;
        p.vy *= -bounce;
      }
      if (p.y > this.height - margin) {
        p.y = this.height - margin;
        p.vy *= -bounce;
      }
    }
  }
  
  resize(width: number, height: number): void {
    const scaleX = width / this.width;
    const scaleY = height / this.height;
    
    this.width = width;
    this.height = height;
    
    for (const p of this.particles) {
      p.x *= scaleX;
      p.y *= scaleY;
    }
  }
  
  reset(): void {
    this.initParticles();
  }
}
