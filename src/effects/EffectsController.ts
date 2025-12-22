// Main Effects Controller
// Orchestrates all effect renderers

import { EffectsState, EffectType, defaultEffectsState } from './types';
import { FluidSimulation } from './FluidSimulation';
import { MetaballRenderer } from './MetaballRenderer';
import { CloudRenderer } from './CloudRenderer';
import { GodrayRenderer } from './GodrayRenderer';
import { WaterRenderer } from './WaterRenderer';
import { FireRenderer } from './FireRenderer';

export class EffectsController {
  state: EffectsState;
  width: number;
  height: number;
  
  fluid: FluidSimulation | null = null;
  metaballs: MetaballRenderer | null = null;
  clouds: CloudRenderer | null = null;
  godrays: GodrayRenderer | null = null;
  water: WaterRenderer | null = null;
  fire: FireRenderer | null = null;
  
  constructor(width: number, height: number) {
    this.state = { ...defaultEffectsState };
    this.width = width;
    this.height = height;
  }
  
  enableEffect(effect: EffectType): void {
    if (!this.state.activeEffects.includes(effect)) {
      this.state.activeEffects.push(effect);
    }
    
    switch (effect) {
      case 'metaballs':
        this.state.metaballs.enabled = true;
        if (!this.metaballs) {
          this.metaballs = new MetaballRenderer(this.state.metaballs, this.width, this.height);
        }
        break;
      case 'fluid':
        this.state.fluid.enabled = true;
        if (!this.fluid) {
          this.fluid = new FluidSimulation(this.state.fluid, this.width, this.height);
        }
        break;
      case 'clouds':
        this.state.clouds.enabled = true;
        if (!this.clouds) {
          this.clouds = new CloudRenderer(this.state.clouds, this.width, this.height);
        }
        break;
      case 'godrays':
        this.state.godrays.enabled = true;
        if (!this.godrays) {
          this.godrays = new GodrayRenderer(this.state.godrays, this.width, this.height);
        }
        break;
      case 'water':
        this.state.water.enabled = true;
        if (!this.water) {
          this.water = new WaterRenderer(this.state.water, this.width, this.height);
        }
        break;
      case 'fire':
        this.state.fire.enabled = true;
        if (!this.fire) {
          this.fire = new FireRenderer(this.state.fire, this.width, this.height);
        }
        break;
    }
  }
  
  disableEffect(effect: EffectType): void {
    const idx = this.state.activeEffects.indexOf(effect);
    if (idx !== -1) {
      this.state.activeEffects.splice(idx, 1);
    }
    
    switch (effect) {
      case 'metaballs': this.state.metaballs.enabled = false; break;
      case 'fluid': this.state.fluid.enabled = false; break;
      case 'clouds': this.state.clouds.enabled = false; break;
      case 'godrays': this.state.godrays.enabled = false; break;
      case 'water': this.state.water.enabled = false; break;
      case 'fire': this.state.fire.enabled = false; break;
    }
  }
  
  toggleEffect(effect: EffectType): void {
    if (this.state.activeEffects.includes(effect)) {
      this.disableEffect(effect);
    } else {
      this.enableEffect(effect);
    }
  }
  
  update(dt: number, mousePos?: { x: number; y: number; active: boolean }): void {
    this.state.time += dt;
    
    if (this.state.metaballs.enabled && this.metaballs) {
      this.metaballs.update(dt);
    }
    if (this.state.fluid.enabled && this.fluid) {
      this.fluid.update(dt, mousePos);
    }
    if (this.state.clouds.enabled && this.clouds) {
      this.clouds.update(dt);
    }
    if (this.state.godrays.enabled && this.godrays) {
      this.godrays.update(dt);
    }
    if (this.state.water.enabled && this.water) {
      this.water.update(dt);
    }
    if (this.state.fire.enabled && this.fire) {
      this.fire.update(dt);
    }
  }
  
  getRenderedLayers(): { type: EffectType; dataUrl: string }[] {
    const layers: { type: EffectType; dataUrl: string }[] = [];
    
    if (this.state.clouds.enabled && this.clouds) {
      layers.push({ type: 'clouds', dataUrl: this.clouds.render() });
    }
    if (this.state.godrays.enabled && this.godrays) {
      layers.push({ type: 'godrays', dataUrl: this.godrays.render() });
    }
    if (this.state.water.enabled && this.water) {
      layers.push({ type: 'water', dataUrl: this.water.render() });
    }
    if (this.state.metaballs.enabled && this.metaballs) {
      layers.push({ type: 'metaballs', dataUrl: this.metaballs.render() });
    }
    if (this.state.fire.enabled && this.fire) {
      layers.push({ type: 'fire', dataUrl: this.fire.render() });
    }
    
    return layers;
  }
  
  getFluidParticles() {
    return this.fluid?.particles || [];
  }
  
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    
    this.metaballs?.resize(width, height);
    this.fluid?.resize(width, height);
    this.clouds?.resize(width, height);
    this.godrays?.resize(width, height);
    this.water?.resize(width, height);
    this.fire?.resize(width, height);
  }
  
  reset(): void {
    this.metaballs?.reset();
    this.fluid?.reset();
    this.clouds?.reset();
    this.godrays?.reset();
    this.water?.reset();
    this.fire?.reset();
  }
}
