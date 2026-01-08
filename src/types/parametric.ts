// ============================================
// UNIVERSAL PARAMETRIC ASSET ENGINE - Type System
// Based on MODELMAKER MASTER MONOLITH specification
// ============================================

// ============= CORE PRIMITIVES =============

export type Px = [number, number];
export type Vec2 = { x: number; z: number };
export type Vec3 = { x: number; y: number; z: number };
export type Quaternion = [number, number, number, number];

// ============= CURVE SYSTEM =============

export interface Curve1D {
  id: string;
  knots: CurveKnot[];
  eval(u: number): number;
  deriv?(u: number): number;
}

export interface CurveKnot {
  u: number;        // 0..1 normalized position
  value: number;    // Value at this knot
  handleIn?: number;  // Bezier handle (relative)
  handleOut?: number; // Bezier handle (relative)
  locked?: boolean;
}

// Cubic Bezier spline implementation
export interface BezierCurve1D extends Curve1D {
  type: 'bezier';
}

// Linear interpolation curve
export interface LinearCurve1D extends Curve1D {
  type: 'linear';
}

// ============= SECTION LAW =============

export interface SectionParams {
  vDepth: number;         // 0..1 - V-hull depth
  deadrise: number;       // 0..1 - Deadrise angle fraction
  bilgeRadius: number;    // 0..1 - Bilge curve radius
  chineSharpness: number; // 0..1 - Chine edge sharpness
  flare: number;          // -1..+1 - Tumblehome to flare
  railRadius: number;     // 0..1 - Rail edge rounding
  bodyPow: number;        // 0..1 - Body curve power
}

export interface SectionLaw {
  F(s: number, p: SectionParams): number; // returns t 0..1
}

// ============= BASE FORM SPEC =============

export interface BaseFormSpec {
  id: string;
  name: string;
  L: number;              // Length in meters
  B: Curve1D;             // Half-beam curve
  K: Curve1D;             // Keel/underside curve
  D: Curve1D;             // Deck/topside curve
  sectionAt(u: number): SectionParams;
  
  // Resolution
  Nu: number;             // Longitudinal samples
  Nv: number;             // Lateral samples
}

// ============= DESIGN COORDINATES =============

export interface VertexDesignAttrib {
  u: number;   // 0..1 longitudinal
  s: number;   // 0..1 lateral (0=centerline, 1=rail)
  side: 1 | -1; // Left/right
}

// ============= REFERENCE PACK =============

export type ViewAxis = 'TOP' | 'SIDE' | 'FRONT' | 'REAR';

export interface ViewCal {
  pxPerMeter: number;
  originPx: Px;
  centerlinePx: [Px, Px];
  anchorA_Px: Px;
  anchorB_Px: Px;
}

export interface ViewDef {
  imageUrl: string;
  axis: ViewAxis;
  cal: ViewCal;
  opacity: number;
  crop?: { x: number; y: number; width: number; height: number };
  visible: boolean;
}

export interface ReferencePack {
  id: string;
  name: string;
  units: 'meter';
  notes?: string;
  views: {
    top?: ViewDef;
    side?: ViewDef;
    front?: ViewDef;
    rear?: ViewDef;
  };
}

// ============= FEATURE NODE SYSTEM =============

export type FeatureStage = 'after_base' | 'after_cutouts' | 'before_finish';
export type FeatureOperationType = 'patch' | 'recess' | 'crease' | 'warp' | 'boss' | 'hole';

export interface MaskPrimitive {
  type: 'ellipse' | 'rect' | 'polygon' | 'pill';
  center?: Vec2;
  size?: Vec2;
  rotation?: number;
  vertices?: Vec2[];
  falloff?: number;
  falloffShape?: 'linear' | 'smooth' | 'sharp';
}

export interface FeatureNodeContract {
  id: string;
  name: string;
  stage: FeatureStage;
  targetRegion: { uMin: number; uMax: number; sMin: number; sMax: number };
  mask: MaskPrimitive;
  operation: FeatureOperationType;
  params: Record<string, number | string | boolean>;
  handles: FeatureHandle[];
  enabled: boolean;
}

export interface FeatureHandle {
  id: string;
  type: 'position' | 'radius' | 'angle' | 'scale';
  view: ViewAxis;
  position: Vec2;
  constrained?: boolean;
  min?: number;
  max?: number;
}

export interface FeatureGraph {
  nodes: FeatureNodeContract[];
  connections: { from: string; to: string }[];
}

// ============= COMPILER OUTPUTS =============

export interface LODLevel {
  level: number;
  geometry: Float32Array;  // Position buffer
  indices: Uint32Array;
  normals: Float32Array;
  uvs: Float32Array;
  designAttribs: { u: Float32Array; s: Float32Array };
}

export interface CollisionData {
  type: 'convex' | 'trimesh' | 'compound';
  vertices: Float32Array;
  indices?: Uint32Array;
  children?: CollisionData[];
}

export interface Hardpoint {
  id: string;
  name: string;
  position: Vec3;
  rotation: Quaternion;
  type: string;
  meta?: Record<string, unknown>;
}

export interface AssetBundle {
  id: string;
  name: string;
  lods: LODLevel[];
  collision: CollisionData;
  hardpoints: Hardpoint[];
  boundingBox: { min: Vec3; max: Vec3 };
  meta: {
    buildHash: string;
    timestamp: number;
    sourceSpec: string;
  };
}

// ============= ASSET SPEC =============

export interface AssetSpec {
  id: string;
  name: string;
  template: string;           // Template class name
  baseForm: BaseFormSpec;
  features: FeatureGraph;
  referencePack?: ReferencePack;
  buildConfig: BuildConfig;
}

export interface BuildConfig {
  lodLevels: number[];        // e.g., [1.0, 0.5, 0.25]
  generateCollision: boolean;
  collisionType: 'convex' | 'trimesh' | 'compound';
  generateHardpoints: boolean;
  diagnostics: boolean;
}

// ============= PARAMETRIC STATE =============

export interface ParametricState {
  spec: AssetSpec | null;
  activeView: ViewAxis;
  selectedCurve: 'B' | 'K' | 'D' | null;
  selectedKnotIndex: number | null;
  selectedFeatureId: string | null;
  isDragging: boolean;
  dragStart: Vec2 | null;
  
  // Display settings
  showReferencePack: boolean;
  showCurves: boolean;
  showMesh: boolean;
  showFeatureHandles: boolean;
  
  // Computed mesh (cached)
  cachedMesh: {
    positions: Float32Array;
    indices: Uint32Array;
    normals: Float32Array;
    designAttribs: { u: Float32Array; s: Float32Array };
  } | null;
}

// ============= EDITOR ACTIONS =============

export type ParametricAction =
  | { type: 'SET_SPEC'; payload: AssetSpec }
  | { type: 'UPDATE_CURVE_KNOT'; curve: 'B' | 'K' | 'D'; knotIndex: number; value: number }
  | { type: 'ADD_CURVE_KNOT'; curve: 'B' | 'K' | 'D'; u: number; value: number }
  | { type: 'REMOVE_CURVE_KNOT'; curve: 'B' | 'K' | 'D'; knotIndex: number }
  | { type: 'SET_ACTIVE_VIEW'; view: ViewAxis }
  | { type: 'SELECT_CURVE'; curve: 'B' | 'K' | 'D' | null }
  | { type: 'SELECT_KNOT'; knotIndex: number | null }
  | { type: 'SELECT_FEATURE'; featureId: string | null }
  | { type: 'UPDATE_FEATURE'; featureId: string; updates: Partial<FeatureNodeContract> }
  | { type: 'ADD_FEATURE'; feature: FeatureNodeContract }
  | { type: 'REMOVE_FEATURE'; featureId: string }
  | { type: 'SET_REFERENCE_PACK'; pack: ReferencePack }
  | { type: 'UPDATE_VIEW_CALIBRATION'; view: ViewAxis; cal: ViewCal }
  | { type: 'TOGGLE_DISPLAY'; setting: keyof Pick<ParametricState, 'showReferencePack' | 'showCurves' | 'showMesh' | 'showFeatureHandles'> }
  | { type: 'REBUILD_MESH' }
  | { type: 'SET_DRAGGING'; isDragging: boolean; dragStart?: Vec2 };

// ============= TEMPLATES =============

export type TemplateType = 'boat_hull' | 'car_body' | 'fuselage' | 'building_shell';

export interface TemplateDefinition {
  type: TemplateType;
  name: string;
  description: string;
  defaultSpec: Partial<BaseFormSpec>;
  defaultFeatures: FeatureNodeContract[];
  constraints: {
    minL?: number;
    maxL?: number;
    aspectRatio?: { min: number; max: number };
  };
}

// ============= PRESET SYSTEM =============

export interface Preset {
  id: string;
  name: string;
  description: string;
  template: TemplateType;
  thumbnail?: string;
  spec: Partial<AssetSpec>;
}

export interface PresetLibrary {
  presets: Preset[];
  categories: { id: string; name: string; presetIds: string[] }[];
}
