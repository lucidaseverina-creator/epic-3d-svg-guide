// Effects System Types

export type EffectType = 
  | 'metaballs'      // Lava lamp metaball blobs
  | 'fluid'          // SPH fluid simulation
  | 'water'          // Water surface waves
  | 'clouds'         // Volumetric clouds
  | 'godrays'        // Sun shafts / god rays
  | 'particles'      // Generic particle system
  | 'fire'           // Fire effect
  | 'smoke';         // Smoke/fog effect

export interface EffectConfig {
  enabled: boolean;
  intensity: number;
  color: string;
  secondaryColor?: string;
}

export interface MetaballConfig extends EffectConfig {
  blobCount: number;
  blobRadius: number;
  speed: number;
  smoothness: number;
  glowIntensity: number;
}

export interface FluidConfig extends EffectConfig {
  particleCount: number;
  viscosity: number;
  pressure: number;
  gravity: { x: number; y: number };
  smoothingRadius: number;
}

export interface WaterConfig extends EffectConfig {
  waveAmplitude: number;
  waveFrequency: number;
  waveSpeed: number;
  rippleCount: number;
  reflectivity: number;
}

export interface CloudConfig extends EffectConfig {
  density: number;
  coverage: number;
  speed: number;
  turbulence: number;
  layers: number;
}

export interface GodrayConfig extends EffectConfig {
  sunPosition: { x: number; y: number };
  rayCount: number;
  rayLength: number;
  decay: number;
  exposure: number;
}

export interface ParticleConfig extends EffectConfig {
  count: number;
  size: number;
  speed: number;
  lifetime: number;
  emitRate: number;
  spread: number;
}

export interface FireConfig extends EffectConfig {
  flames: number;
  height: number;
  turbulence: number;
  sparkCount: number;
}

export interface SmokeConfig extends EffectConfig {
  puffCount: number;
  rise: number;
  spread: number;
  dissipation: number;
}

// Particle for fluid/effects
export interface EffectParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  density?: number;
  pressure?: number;
  temperature?: number;
}

// Metaball blob
export interface Metaball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

// Cloud puff
export interface CloudPuff {
  x: number;
  y: number;
  z: number;
  radius: number;
  density: number;
  age: number;
}

// God ray
export interface GodRay {
  angle: number;
  length: number;
  intensity: number;
  width: number;
}

// Water ripple
export interface Ripple {
  x: number;
  y: number;
  radius: number;
  amplitude: number;
  phase: number;
  age: number;
}

// Effects state
export interface EffectsState {
  activeEffects: EffectType[];
  metaballs: MetaballConfig;
  fluid: FluidConfig;
  water: WaterConfig;
  clouds: CloudConfig;
  godrays: GodrayConfig;
  particles: ParticleConfig;
  fire: FireConfig;
  smoke: SmokeConfig;
  time: number;
}

// Default configs
export const defaultMetaballConfig: MetaballConfig = {
  enabled: false,
  intensity: 1,
  color: '#ff6600',
  secondaryColor: '#ffaa00',
  blobCount: 8,
  blobRadius: 40,
  speed: 1,
  smoothness: 1.5,
  glowIntensity: 0.8,
};

export const defaultFluidConfig: FluidConfig = {
  enabled: false,
  intensity: 1,
  color: '#3388ff',
  secondaryColor: '#88ccff',
  particleCount: 200,
  viscosity: 8,
  pressure: 5000,
  gravity: { x: 0, y: 0.3 },
  smoothingRadius: 0.4,
};

export const defaultWaterConfig: WaterConfig = {
  enabled: false,
  intensity: 1,
  color: '#2266cc',
  secondaryColor: '#88ddff',
  waveAmplitude: 20,
  waveFrequency: 0.02,
  waveSpeed: 2,
  rippleCount: 5,
  reflectivity: 0.6,
};

export const defaultCloudConfig: CloudConfig = {
  enabled: false,
  intensity: 1,
  color: '#ffffff',
  secondaryColor: '#ccddff',
  density: 0.6,
  coverage: 0.5,
  speed: 0.5,
  turbulence: 0.3,
  layers: 3,
};

export const defaultGodrayConfig: GodrayConfig = {
  enabled: false,
  intensity: 0.8,
  color: '#ffffcc',
  sunPosition: { x: 0.8, y: 0.2 },
  rayCount: 12,
  rayLength: 0.8,
  decay: 0.95,
  exposure: 0.5,
};

export const defaultParticleConfig: ParticleConfig = {
  enabled: false,
  intensity: 1,
  color: '#ffff88',
  count: 100,
  size: 4,
  speed: 2,
  lifetime: 3,
  emitRate: 10,
  spread: 0.5,
};

export const defaultFireConfig: FireConfig = {
  enabled: false,
  intensity: 1,
  color: '#ff4400',
  secondaryColor: '#ffaa00',
  flames: 20,
  height: 100,
  turbulence: 0.5,
  sparkCount: 30,
};

export const defaultSmokeConfig: SmokeConfig = {
  enabled: false,
  intensity: 1,
  color: '#666666',
  secondaryColor: '#333333',
  puffCount: 15,
  rise: 1,
  spread: 0.3,
  dissipation: 0.02,
};

export const defaultEffectsState: EffectsState = {
  activeEffects: [],
  metaballs: defaultMetaballConfig,
  fluid: defaultFluidConfig,
  water: defaultWaterConfig,
  clouds: defaultCloudConfig,
  godrays: defaultGodrayConfig,
  particles: defaultParticleConfig,
  fire: defaultFireConfig,
  smoke: defaultSmokeConfig,
  time: 0,
};
