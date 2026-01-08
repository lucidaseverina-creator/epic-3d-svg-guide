// ============================================
// FEATURE NODE SYSTEM - Feature Operations
// Patch, Recess, Crease, Warp, Boss/Hole
// ============================================

import {
  FeatureNodeContract,
  MaskPrimitive,
  FeatureOperationType,
  Vec2,
} from '@/types/parametric';
import { GeneratedMesh } from './meshGenerator';

// ============= MASK EVALUATION =============

// Evaluate mask at design coordinates (u, s)
export function evaluateMask(
  mask: MaskPrimitive,
  u: number,
  s: number
): number {
  let value = 0;
  
  switch (mask.type) {
    case 'ellipse': {
      const cx = mask.center?.x ?? 0.5;
      const cz = mask.center?.z ?? 0.5;
      const rx = (mask.size?.x ?? 0.2) / 2;
      const rz = (mask.size?.z ?? 0.2) / 2;
      
      const dx = (u - cx) / rx;
      const dz = (s - cz) / rz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < 1) {
        value = 1;
      }
      break;
    }
    
    case 'rect': {
      const cx = mask.center?.x ?? 0.5;
      const cz = mask.center?.z ?? 0.5;
      const hx = (mask.size?.x ?? 0.2) / 2;
      const hz = (mask.size?.z ?? 0.2) / 2;
      
      if (Math.abs(u - cx) < hx && Math.abs(s - cz) < hz) {
        value = 1;
      }
      break;
    }
    
    case 'pill': {
      const cx = mask.center?.x ?? 0.5;
      const cz = mask.center?.z ?? 0.5;
      const hx = (mask.size?.x ?? 0.3) / 2;
      const r = (mask.size?.z ?? 0.1) / 2;
      
      // Pill shape: rectangle with semicircle ends
      if (Math.abs(u - cx) < hx - r) {
        if (Math.abs(s - cz) < r) {
          value = 1;
        }
      } else {
        // End caps
        const endX = u < cx ? cx - (hx - r) : cx + (hx - r);
        const dist = Math.sqrt((u - endX) ** 2 + (s - cz) ** 2);
        if (dist < r) {
          value = 1;
        }
      }
      break;
    }
    
    case 'polygon': {
      if (mask.vertices && mask.vertices.length >= 3) {
        value = pointInPolygon(u, s, mask.vertices) ? 1 : 0;
      }
      break;
    }
  }
  
  // Apply falloff
  if (value > 0 && mask.falloff && mask.falloff > 0) {
    value = applyFalloff(value, mask.falloff, mask.falloffShape ?? 'smooth');
  }
  
  return value;
}

// Point in polygon test
function pointInPolygon(x: number, z: number, vertices: Vec2[]): boolean {
  let inside = false;
  const n = vertices.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].x;
    const zi = vertices[i].z;
    const xj = vertices[j].x;
    const zj = vertices[j].z;
    
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Apply falloff shaping
function applyFalloff(
  value: number,
  falloff: number,
  shape: 'linear' | 'smooth' | 'sharp'
): number {
  const t = Math.max(0, Math.min(1, value / falloff));
  
  switch (shape) {
    case 'linear':
      return t;
    case 'smooth':
      return t * t * (3 - 2 * t); // Smoothstep
    case 'sharp':
      return t * t * t;
    default:
      return t;
  }
}

// ============= FEATURE OPERATIONS =============

// Apply patch displacement
export function applyPatch(
  mesh: GeneratedMesh,
  mask: MaskPrimitive,
  params: {
    displacement: number;
    direction: 'normal' | 'y' | 'custom';
    customDirection?: { x: number; y: number; z: number };
  }
): void {
  for (let i = 0; i < mesh.vertexCount; i++) {
    const u = mesh.designAttribs.u[i];
    const s = mesh.designAttribs.s[i];
    const maskValue = evaluateMask(mask, u, s);
    
    if (maskValue > 0) {
      const displacement = params.displacement * maskValue;
      
      let dx = 0, dy = 0, dz = 0;
      
      if (params.direction === 'normal') {
        dx = mesh.normals[i * 3] * displacement;
        dy = mesh.normals[i * 3 + 1] * displacement;
        dz = mesh.normals[i * 3 + 2] * displacement;
      } else if (params.direction === 'y') {
        dy = displacement;
      } else if (params.customDirection) {
        dx = params.customDirection.x * displacement;
        dy = params.customDirection.y * displacement;
        dz = params.customDirection.z * displacement;
      }
      
      mesh.positions[i * 3] += dx;
      mesh.positions[i * 3 + 1] += dy;
      mesh.positions[i * 3 + 2] += dz;
    }
  }
}

// Apply recess cut
export function applyRecess(
  mesh: GeneratedMesh,
  mask: MaskPrimitive,
  params: {
    depth: number;
    wallAngle: number; // 0 = vertical, positive = outward slope
  }
): void {
  for (let i = 0; i < mesh.vertexCount; i++) {
    const u = mesh.designAttribs.u[i];
    const s = mesh.designAttribs.s[i];
    const maskValue = evaluateMask(mask, u, s);
    
    if (maskValue > 0) {
      // Negative displacement (inward)
      const depth = -params.depth * maskValue;
      
      // Apply along normal
      mesh.positions[i * 3] += mesh.normals[i * 3] * depth;
      mesh.positions[i * 3 + 1] += mesh.normals[i * 3 + 1] * depth;
      mesh.positions[i * 3 + 2] += mesh.normals[i * 3 + 2] * depth;
    }
  }
}

// Apply crease line
export function applyCrease(
  mesh: GeneratedMesh,
  params: {
    startU: number;
    endU: number;
    sPosition: number;
    width: number;
    depth: number;
    sharpness: number;
  }
): void {
  for (let i = 0; i < mesh.vertexCount; i++) {
    const u = mesh.designAttribs.u[i];
    const s = mesh.designAttribs.s[i];
    
    // Check if within U range
    if (u < params.startU || u > params.endU) continue;
    
    // Distance from crease line
    const sDist = Math.abs(s - params.sPosition);
    
    if (sDist < params.width) {
      // Crease profile
      const t = sDist / params.width;
      const profile = Math.pow(1 - t, params.sharpness);
      const displacement = -params.depth * profile;
      
      // Apply along normal
      mesh.positions[i * 3] += mesh.normals[i * 3] * displacement;
      mesh.positions[i * 3 + 1] += mesh.normals[i * 3 + 1] * displacement;
      mesh.positions[i * 3 + 2] += mesh.normals[i * 3 + 2] * displacement;
    }
  }
}

// Apply vector warp field
export function applyWarp(
  mesh: GeneratedMesh,
  mask: MaskPrimitive,
  params: {
    warpField: (u: number, s: number) => { x: number; y: number; z: number };
    strength: number;
  }
): void {
  for (let i = 0; i < mesh.vertexCount; i++) {
    const u = mesh.designAttribs.u[i];
    const s = mesh.designAttribs.s[i];
    const maskValue = evaluateMask(mask, u, s);
    
    if (maskValue > 0) {
      const warp = params.warpField(u, s);
      const strength = params.strength * maskValue;
      
      mesh.positions[i * 3] += warp.x * strength;
      mesh.positions[i * 3 + 1] += warp.y * strength;
      mesh.positions[i * 3 + 2] += warp.z * strength;
    }
  }
}

// ============= FEATURE NODE FACTORY =============

export function createFeatureNode(
  id: string,
  name: string,
  operation: FeatureOperationType,
  mask: MaskPrimitive,
  params: Record<string, number | string | boolean> = {}
): FeatureNodeContract {
  return {
    id,
    name,
    stage: 'after_base',
    targetRegion: { uMin: 0, uMax: 1, sMin: 0, sMax: 1 },
    mask,
    operation,
    params,
    handles: [],
    enabled: true,
  };
}

// Create cockpit recess feature (for boats)
export function createCockpitFeature(
  uStart: number = 0.2,
  uEnd: number = 0.6,
  sInset: number = 0.15,
  depth: number = 0.3
): FeatureNodeContract {
  return createFeatureNode(
    'cockpit',
    'Cockpit Recess',
    'recess',
    {
      type: 'rect',
      center: { x: (uStart + uEnd) / 2, z: 0.5 },
      size: { x: uEnd - uStart, z: 1 - sInset * 2 },
      falloff: 0.05,
      falloffShape: 'smooth',
    },
    { depth, wallAngle: 0 }
  );
}

// Create hull chine crease
export function createChineFeature(
  sPosition: number = 0.4,
  depth: number = 0.02
): FeatureNodeContract {
  return createFeatureNode(
    'chine',
    'Hull Chine',
    'crease',
    {
      type: 'rect',
      center: { x: 0.5, z: sPosition },
      size: { x: 1, z: 0.1 },
    },
    { startU: 0.1, endU: 0.9, sPosition, width: 0.05, depth, sharpness: 2 }
  );
}

// Apply feature to mesh
export function applyFeature(
  mesh: GeneratedMesh,
  feature: FeatureNodeContract
): void {
  if (!feature.enabled) return;
  
  switch (feature.operation) {
    case 'patch':
      applyPatch(mesh, feature.mask, {
        displacement: feature.params.displacement as number ?? 0.1,
        direction: (feature.params.direction as 'normal' | 'y') ?? 'normal',
      });
      break;
      
    case 'recess':
      applyRecess(mesh, feature.mask, {
        depth: feature.params.depth as number ?? 0.2,
        wallAngle: feature.params.wallAngle as number ?? 0,
      });
      break;
      
    case 'crease':
      applyCrease(mesh, {
        startU: feature.params.startU as number ?? 0,
        endU: feature.params.endU as number ?? 1,
        sPosition: feature.params.sPosition as number ?? 0.5,
        width: feature.params.width as number ?? 0.05,
        depth: feature.params.depth as number ?? 0.02,
        sharpness: feature.params.sharpness as number ?? 2,
      });
      break;
      
    case 'warp':
      // Warp requires a custom warp field function
      break;
      
    case 'boss':
    case 'hole':
      // These would modify topology - placeholder
      break;
  }
}
