// Core Vector Types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
  scale?: number;
  z?: number;
}

// Transform Delta for tool operations
export interface TransformDelta {
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
}

// Material System
export interface Material {
  id: string;
  color: string;
  ambient: number;
  diffuse: number;
  specular: number;
  shininess: number;
}

// Lighting System
export interface Light {
  type: 'ambient' | 'directional' | 'point';
  color: string;
  intensity: number;
  direction?: Vector3;
  position?: Vector3;
}

// Camera System
export interface Camera {
  position: Vector3;
  rotation: Vector3;
  fov: number;
  near: number;
  far: number;
}

// Face Types
export interface Face {
  verts: Vector3[];
  color: string;
  objectId?: string;
  normal?: Vector3;
}

export interface ProjectedFace extends Face {
  projectedVerts: Vector2[];
  depth: number;
  lightIntensity: number;
  isSelected?: boolean;
}

// Object Types
export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'pyramid' | 'metaballs' | 'fluidBlob' | 'cloudVolume';

export interface SceneObject {
  id: string;
  name: string;
  type: PrimitiveType;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  material: Material;
  visible: boolean;
  locked: boolean;
}

// SDF Object Types
export type SDFPrimitiveType = 'sdfBox' | 'sdfSphere' | 'sdfTorus' | 'sdfCapsule' | 'sdfOctahedron' | 'sdfPyramid' | 'boolean';
export type BooleanOperation = 'union' | 'subtract' | 'intersect' | 'smoothUnion' | 'smoothSubtract' | 'smoothIntersect';

export interface SDFObject {
  id: string;
  name: string;
  type: SDFPrimitiveType;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  material: Material;
  visible: boolean;
  locked: boolean;
  sdfParams?: {
    smoothFactor?: number;
    operation?: BooleanOperation;
    operandIds?: string[];
  };
}

// Scene State
export interface Scene {
  objects: SceneObject[];
  lights: Light[];
  camera: Camera;
  cursor3D: Vector3;
  selectedObjectId: string | null;
  gridVisible: boolean;
  axisVisible: boolean;
  lightingMode: 'day' | 'night';
}

// Tool Types
export type ToolType = 'select' | 'move' | 'rotate' | 'scale';

// Engine Types
export type EngineType = 'classic' | 'sdflux';

// Render Modes
export type RenderMode = 'solid' | 'wireframe' | 'normals' | 'xray';

// Camera Presets
export type CameraPreset = 'perspective' | 'front' | 'back' | 'top' | 'left' | 'right';

// Timeline State
export interface TimelineState {
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  loopMode: 'once' | 'loop' | 'pingpong';
}

// Drawer Types
export type DrawerPosition = 'top' | 'bottom';
export type DrawerHeight = 'full' | 'top-half' | 'bottom-half';
export type DrawerSide = 'left' | 'right';

export interface DrawerState {
  isOpen: boolean;
  height: DrawerHeight;
  drawerId: string | null;
}

// Engine Config
export interface EngineConfig {
  fov: number;
  cameraZ: number;
  ambientIntensity: number;
  directionalIntensity: number;
  lightDirection: Vector3;
}
