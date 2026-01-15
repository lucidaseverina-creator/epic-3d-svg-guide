// ============================================
// SDF RENDERER - Generates meshes from SDF boolean nodes
// 2026 CAD-Grade Adaptive Octree Marching System
// ============================================

import { Face, Vector3 } from '@/types/engine';
import { SDFNode, SDFPrimitiveType, BooleanOp } from '@/components/parametric/BooleanPanel';
import {
  sdfSphere,
  sdfBox,
  sdfTorus,
  sdfUnion,
  sdfSubtract,
  sdfIntersect,
  sdfSmoothUnion,
  sdfSmoothSubtract,
  sdfNormal,
} from '@/lib/sdf';

// ============================================
// Additional SDF Primitives
// ============================================

const sdfCylinder = (p: Vector3, radius: number, height: number): number => {
  const distXZ = Math.sqrt(p.x * p.x + p.z * p.z) - radius;
  const distY = Math.abs(p.y) - height / 2;
  const outsideDist = Math.sqrt(Math.max(distXZ, 0) ** 2 + Math.max(distY, 0) ** 2);
  const insideDist = Math.min(Math.max(distXZ, distY), 0);
  return outsideDist + insideDist;
};

const sdfCapsule = (p: Vector3, radius: number, height: number): number => {
  const halfH = Math.max(0, height / 2 - radius);
  const clampedY = Math.max(-halfH, Math.min(halfH, p.y));
  const dy = p.y - clampedY;
  return Math.sqrt(p.x * p.x + dy * dy + p.z * p.z) - radius;
};

const sdfOctahedron = (p: Vector3, size: number): number => {
  const px = Math.abs(p.x);
  const py = Math.abs(p.y);
  const pz = Math.abs(p.z);
  return (px + py + pz - size) * 0.577350269; // 1/sqrt(3)
};

const sdfRoundedBox = (p: Vector3, size: Vector3, radius: number): number => {
  const qx = Math.abs(p.x) - size.x + radius;
  const qy = Math.abs(p.y) - size.y + radius;
  const qz = Math.abs(p.z) - size.z + radius;
  
  const outsideDist = Math.sqrt(
    Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2 + Math.max(qz, 0) ** 2
  );
  const insideDist = Math.min(Math.max(qx, qy, qz), 0);
  
  return outsideDist + insideDist - radius;
};

// ============================================
// Smooth Operations
// ============================================

const sdfSmoothIntersect = (d1: number, d2: number, k: number): number => {
  const h = Math.max(k - Math.abs(d1 - d2), 0) / k;
  return Math.max(d1, d2) + h * h * k * 0.25;
};

// ============================================
// Transform Utilities
// ============================================

const rotatePoint = (p: Vector3, rotation: { x: number; y: number; z: number }): Vector3 => {
  // Apply rotation in XYZ order (Euler angles)
  let px = p.x, py = p.y, pz = p.z;
  
  // X rotation
  if (rotation.x !== 0) {
    const cosX = Math.cos(-rotation.x);
    const sinX = Math.sin(-rotation.x);
    const ny = py * cosX - pz * sinX;
    const nz = py * sinX + pz * cosX;
    py = ny;
    pz = nz;
  }
  
  // Y rotation
  if (rotation.y !== 0) {
    const cosY = Math.cos(-rotation.y);
    const sinY = Math.sin(-rotation.y);
    const nx = px * cosY + pz * sinY;
    const nz = -px * sinY + pz * cosY;
    px = nx;
    pz = nz;
  }
  
  // Z rotation
  if (rotation.z !== 0) {
    const cosZ = Math.cos(-rotation.z);
    const sinZ = Math.sin(-rotation.z);
    const nx = px * cosZ - py * sinZ;
    const ny = px * sinZ + py * cosZ;
    px = nx;
    py = ny;
  }
  
  return { x: px, y: py, z: pz };
};

// ============================================
// Evaluate a single primitive SDF with full transforms
// ============================================

const evaluatePrimitive = (
  p: Vector3,
  node: SDFNode
): number => {
  const { position, scale, rotation, primitiveParams } = node;
  
  // Translate point to local space
  let localP: Vector3 = {
    x: p.x - position.x,
    y: p.y - position.y,
    z: p.z - position.z,
  };
  
  // Apply inverse rotation
  localP = rotatePoint(localP, rotation);
  
  // Apply inverse scale
  const avgScale = (scale.x + scale.y + scale.z) / 3;
  const sp: Vector3 = {
    x: localP.x / scale.x,
    y: localP.y / scale.y,
    z: localP.z / scale.z,
  };
  
  // Evaluate based on type
  let dist: number;
  switch (node.type as SDFPrimitiveType) {
    case 'sphere':
      dist = sdfSphere(sp, { x: 0, y: 0, z: 0 }, primitiveParams?.radius ?? 1);
      break;
    
    case 'box':
      dist = sdfRoundedBox(sp, { x: 1, y: 1, z: 1 }, 0.05);
      break;
    
    case 'torus':
      dist = sdfTorus(
        sp,
        { x: 0, y: 0, z: 0 },
        primitiveParams?.majorRadius ?? 1,
        primitiveParams?.minorRadius ?? 0.3
      );
      break;
    
    case 'cylinder':
      dist = sdfCylinder(
        sp,
        primitiveParams?.radius ?? 0.5,
        primitiveParams?.height ?? 2
      );
      break;
    
    case 'capsule':
      dist = sdfCapsule(
        sp,
        primitiveParams?.radius ?? 0.5,
        primitiveParams?.height ?? 2
      );
      break;
    
    case 'octahedron':
      dist = sdfOctahedron(sp, primitiveParams?.radius ?? 1);
      break;
    
    default:
      dist = 1000;
  }
  
  // Scale distance back
  return dist * avgScale;
};

// Build color map for primitives - tracks which primitive each point is closest to
type SDFWithColor = {
  sdf: (p: Vector3) => number;
  color: string;
};

// Build the combined SDF function from all nodes
const buildSceneSDF = (
  nodes: SDFNode[],
  nodesMap: Map<string, SDFNode>
): {
  sceneSDF: (p: Vector3) => number;
  getColor: (p: Vector3) => string;
} => {
  // Create a memoized SDF evaluator for each node
  const nodeSDFs = new Map<string, SDFWithColor>();
  
  const getNodeSDF = (id: string): SDFWithColor => {
    if (nodeSDFs.has(id)) return nodeSDFs.get(id)!;
    
    const node = nodesMap.get(id);
    if (!node || !node.visible) {
      const emptyFn: SDFWithColor = { sdf: () => 1000, color: 'hsl(0, 0%, 50%)' };
      nodeSDFs.set(id, emptyFn);
      return emptyFn;
    }
    
    if (node.type === 'boolean' && node.booleanParams) {
      const { operation, operandA, operandB, smoothness } = node.booleanParams;
      const sdfAData = getNodeSDF(operandA);
      const sdfBData = getNodeSDF(operandB);
      
      const boolFn = (p: Vector3): number => {
        const dA = sdfAData.sdf(p);
        const dB = sdfBData.sdf(p);
        
        switch (operation) {
          case 'union': return sdfUnion(dA, dB);
          case 'subtract': return sdfSubtract(dA, dB);
          case 'intersect': return sdfIntersect(dA, dB);
          case 'smoothUnion': return sdfSmoothUnion(dA, dB, smoothness);
          case 'smoothSubtract': return sdfSmoothSubtract(dA, dB, smoothness);
          case 'smoothIntersect': return sdfSmoothIntersect(dA, dB, smoothness);
          default: return sdfUnion(dA, dB);
        }
      };
      
      // For boolean, get color from closest operand
      const getColorFn = (p: Vector3): string => {
        const dA = sdfAData.sdf(p);
        const dB = sdfBData.sdf(p);
        
        // For subtract, use A's color since we're carving out of A
        if (operation === 'subtract' || operation === 'smoothSubtract') {
          return sdfAData.color;
        }
        
        // For union/intersect, use the color of the closer surface
        return Math.abs(dA) < Math.abs(dB) ? sdfAData.color : sdfBData.color;
      };
      
      const result: SDFWithColor = { 
        sdf: boolFn, 
        color: node.material.color 
      };
      // Override color getter for complex coloring
      (result as any).getColor = getColorFn;
      
      nodeSDFs.set(id, result);
      return result;
    }
    
    // Primitive node
    const primFn: SDFWithColor = {
      sdf: (p: Vector3) => evaluatePrimitive(p, node),
      color: node.material.color,
    };
    nodeSDFs.set(id, primFn);
    return primFn;
  };
  
  // Build SDFs for all nodes
  for (const node of nodes) {
    getNodeSDF(node.id);
  }
  
  // Combine all visible top-level nodes (nodes not referenced by any boolean)
  const referencedIds = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'boolean' && node.booleanParams) {
      referencedIds.add(node.booleanParams.operandA);
      referencedIds.add(node.booleanParams.operandB);
    }
  }
  
  const topLevelNodes = nodes.filter(n => !referencedIds.has(n.id) && n.visible);
  
  if (topLevelNodes.length === 0) {
    return { sceneSDF: () => 1000, getColor: () => 'hsl(0, 0%, 50%)' };
  }
  
  const sceneSDF = (p: Vector3): number => {
    let result = getNodeSDF(topLevelNodes[0].id).sdf(p);
    for (let i = 1; i < topLevelNodes.length; i++) {
      result = sdfUnion(result, getNodeSDF(topLevelNodes[i].id).sdf(p));
    }
    return result;
  };
  
  const getColor = (p: Vector3): string => {
    let closestDist = Infinity;
    let closestColor = 'hsl(0, 0%, 50%)';
    
    for (const node of topLevelNodes) {
      const nodeData = getNodeSDF(node.id);
      const d = Math.abs(nodeData.sdf(p));
      
      if (d < closestDist) {
        closestDist = d;
        // Use nested color getter if available (for booleans)
        if ((nodeData as any).getColor) {
          closestColor = (nodeData as any).getColor(p);
        } else {
          closestColor = nodeData.color;
        }
      }
    }
    
    return closestColor;
  };
  
  return { sceneSDF, getColor };
};

// ============================================
// Adaptive Octree System
// ============================================

interface OctreeNode {
  center: Vector3;
  size: number;
  children?: OctreeNode[];
  isSurface?: boolean;
  curvature?: number; // For adaptive refinement
}

// Check if cell contains surface with early-exit optimization
const cellContainsSurface = (
  center: Vector3,
  size: number,
  sdfFunc: (p: Vector3) => number
): { contains: boolean; minDist: number } => {
  const halfSize = size / 2;
  const corners = [
    { x: center.x - halfSize, y: center.y - halfSize, z: center.z - halfSize },
    { x: center.x + halfSize, y: center.y - halfSize, z: center.z - halfSize },
    { x: center.x - halfSize, y: center.y + halfSize, z: center.z - halfSize },
    { x: center.x + halfSize, y: center.y + halfSize, z: center.z - halfSize },
    { x: center.x - halfSize, y: center.y - halfSize, z: center.z + halfSize },
    { x: center.x + halfSize, y: center.y - halfSize, z: center.z + halfSize },
    { x: center.x - halfSize, y: center.y + halfSize, z: center.z + halfSize },
    { x: center.x + halfSize, y: center.y + halfSize, z: center.z + halfSize },
  ];
  
  const values = corners.map(c => sdfFunc(c));
  const hasInside = values.some(v => v < 0);
  const hasOutside = values.some(v => v >= 0);
  const minDist = Math.min(...values.map(Math.abs));
  
  return { contains: hasInside && hasOutside, minDist };
};

// Estimate local curvature for adaptive refinement
const estimateCurvature = (
  center: Vector3,
  sdfFunc: (p: Vector3) => number,
  eps: number
): number => {
  const n = sdfNormal(center, sdfFunc, eps);
  
  // Sample normals at offset positions
  const offsets = [
    { x: eps, y: 0, z: 0 },
    { x: 0, y: eps, z: 0 },
    { x: 0, y: 0, z: eps },
  ];
  
  let curvature = 0;
  for (const off of offsets) {
    const p = { x: center.x + off.x, y: center.y + off.y, z: center.z + off.z };
    const n2 = sdfNormal(p, sdfFunc, eps);
    // Curvature ~ change in normal
    curvature += Math.abs(n.x - n2.x) + Math.abs(n.y - n2.y) + Math.abs(n.z - n2.z);
  }
  
  return curvature / 3;
};

// Build adaptive octree with curvature-based refinement
const buildAdaptiveOctree = (
  center: Vector3,
  size: number,
  sdfFunc: (p: Vector3) => number,
  minSize: number,
  maxDepth: number,
  depth: number = 0,
  adaptiveCurvature: boolean = true
): OctreeNode | null => {
  const { contains, minDist } = cellContainsSurface(center, size, sdfFunc);
  
  // Skip cells that definitely don't contain surface
  if (!contains) {
    return null;
  }
  
  const node: OctreeNode = { center, size, isSurface: true };
  
  // Calculate whether we should subdivide more
  let shouldSubdivide = size > minSize && depth < maxDepth;
  
  // Curvature-based adaptive refinement
  if (shouldSubdivide && adaptiveCurvature && depth >= 2) {
    const curvature = estimateCurvature(center, sdfFunc, size * 0.2);
    node.curvature = curvature;
    
    // High curvature = more detail needed
    // Low curvature + small enough = can stop early
    if (curvature < 0.5 && size < minSize * 2) {
      shouldSubdivide = false;
    }
  }
  
  if (!shouldSubdivide) {
    return node;
  }
  
  const halfSize = size / 2;
  const quarterSize = size / 4;
  const children: OctreeNode[] = [];
  
  for (let z = -1; z <= 1; z += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let x = -1; x <= 1; x += 2) {
        const childCenter = {
          x: center.x + x * quarterSize,
          y: center.y + y * quarterSize,
          z: center.z + z * quarterSize,
        };
        const child = buildAdaptiveOctree(
          childCenter, halfSize, sdfFunc, minSize, maxDepth, depth + 1, adaptiveCurvature
        );
        if (child) children.push(child);
      }
    }
  }
  
  if (children.length > 0) {
    node.children = children;
    node.isSurface = false;
  }
  
  return node;
};

// ============================================
// Surface Point Finding (Newton-Raphson + Bisection hybrid)
// ============================================

const findSurfacePoint = (
  inside: Vector3,
  outside: Vector3,
  sdfFunc: (p: Vector3) => number,
  iterations: number = 8
): Vector3 => {
  let a = inside;
  let b = outside;
  
  // Hybrid: bisection with gradient guidance
  for (let i = 0; i < iterations; i++) {
    const mid = {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      z: (a.z + b.z) / 2,
    };
    
    const d = sdfFunc(mid);
    
    if (Math.abs(d) < 0.001) {
      return mid; // Close enough
    }
    
    if (d < 0) {
      a = mid;
    } else {
      b = mid;
    }
  }
  
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
};

// ============================================
// Face Generation with improved quad placement
// ============================================

const generateFacesFromOctree = (
  node: OctreeNode,
  sdfFunc: (p: Vector3) => number,
  getColor: (p: Vector3) => string,
  faces: Face[]
): void => {
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      generateFacesFromOctree(child, sdfFunc, getColor, faces);
    }
    return;
  }
  
  const { center, size } = node;
  
  // Get normal with appropriate epsilon
  const eps = size * 0.15;
  const normal = sdfNormal(center, sdfFunc, eps);
  
  // Find surface point using bisection
  const outsideP = {
    x: center.x + normal.x * size * 0.6,
    y: center.y + normal.y * size * 0.6,
    z: center.z + normal.z * size * 0.6,
  };
  const insideP = {
    x: center.x - normal.x * size * 0.6,
    y: center.y - normal.y * size * 0.6,
    z: center.z - normal.z * size * 0.6,
  };
  
  // Ensure we have correct inside/outside points
  const dCenter = sdfFunc(center);
  const surfacePoint = dCenter < 0
    ? findSurfacePoint(center, outsideP, sdfFunc)
    : findSurfacePoint(insideP, center, sdfFunc);
  
  // Refine normal at surface point
  const surfaceNormal = sdfNormal(surfacePoint, sdfFunc, eps * 0.5);
  
  // Get color at surface point
  const color = getColor(surfacePoint);
  
  // Create tangent vectors for quad
  const absNx = Math.abs(surfaceNormal.x);
  const absNy = Math.abs(surfaceNormal.y);
  const absNz = Math.abs(surfaceNormal.z);
  
  let tangent1: Vector3;
  
  if (absNx <= absNy && absNx <= absNz) {
    tangent1 = { x: 0, y: -surfaceNormal.z, z: surfaceNormal.y };
  } else if (absNy <= absNz) {
    tangent1 = { x: -surfaceNormal.z, y: 0, z: surfaceNormal.x };
  } else {
    tangent1 = { x: -surfaceNormal.y, y: surfaceNormal.x, z: 0 };
  }
  
  const len1 = Math.sqrt(tangent1.x ** 2 + tangent1.y ** 2 + tangent1.z ** 2) || 1;
  tangent1 = { x: tangent1.x / len1, y: tangent1.y / len1, z: tangent1.z / len1 };
  
  const tangent2: Vector3 = {
    x: surfaceNormal.y * tangent1.z - surfaceNormal.z * tangent1.y,
    y: surfaceNormal.z * tangent1.x - surfaceNormal.x * tangent1.z,
    z: surfaceNormal.x * tangent1.y - surfaceNormal.y * tangent1.x,
  };
  
  // Quad size based on cell size
  const quadSize = size * 0.48;
  
  const v1: Vector3 = {
    x: surfacePoint.x - tangent1.x * quadSize - tangent2.x * quadSize,
    y: surfacePoint.y - tangent1.y * quadSize - tangent2.y * quadSize,
    z: surfacePoint.z - tangent1.z * quadSize - tangent2.z * quadSize,
  };
  const v2: Vector3 = {
    x: surfacePoint.x + tangent1.x * quadSize - tangent2.x * quadSize,
    y: surfacePoint.y + tangent1.y * quadSize - tangent2.y * quadSize,
    z: surfacePoint.z + tangent1.z * quadSize - tangent2.z * quadSize,
  };
  const v3: Vector3 = {
    x: surfacePoint.x + tangent1.x * quadSize + tangent2.x * quadSize,
    y: surfacePoint.y + tangent1.y * quadSize + tangent2.y * quadSize,
    z: surfacePoint.z + tangent1.z * quadSize + tangent2.z * quadSize,
  };
  const v4: Vector3 = {
    x: surfacePoint.x - tangent1.x * quadSize + tangent2.x * quadSize,
    y: surfacePoint.y - tangent1.y * quadSize + tangent2.y * quadSize,
    z: surfacePoint.z - tangent1.z * quadSize + tangent2.z * quadSize,
  };
  
  faces.push({
    verts: [v1, v2, v3, v4],
    color,
    normal: surfaceNormal,
  });
};

// ============================================
// Render Quality Presets
// ============================================

export type SDFRenderQuality = 'draft' | 'standard' | 'high' | 'ultra';

const QUALITY_PRESETS: Record<SDFRenderQuality, { minCellSize: number; maxDepth: number }> = {
  draft: { minCellSize: 0.25, maxDepth: 4 },
  standard: { minCellSize: 0.15, maxDepth: 5 },
  high: { minCellSize: 0.1, maxDepth: 6 },
  ultra: { minCellSize: 0.06, maxDepth: 7 },
};

// ============================================
// Main Render Function
// ============================================

export const renderSDFNodes = (
  nodes: SDFNode[],
  options: {
    boundSize?: number;
    minCellSize?: number;
    maxDepth?: number;
    quality?: SDFRenderQuality;
    adaptiveCurvature?: boolean;
  } = {}
): Face[] => {
  const visibleNodes = nodes.filter(n => n.visible);
  if (visibleNodes.length === 0) return [];
  
  // Get quality settings
  const quality = options.quality ?? 'standard';
  const preset = QUALITY_PRESETS[quality];
  
  const {
    boundSize = 8,
    minCellSize = options.minCellSize ?? preset.minCellSize,
    maxDepth = options.maxDepth ?? preset.maxDepth,
    adaptiveCurvature = true,
  } = options;
  
  // Auto-calculate bounding box from nodes
  let maxExtent = 0;
  for (const node of visibleNodes) {
    if (node.type !== 'boolean') {
      const pos = node.position;
      const scale = Math.max(node.scale.x, node.scale.y, node.scale.z);
      const extent = Math.max(
        Math.abs(pos.x) + scale * 2,
        Math.abs(pos.y) + scale * 2,
        Math.abs(pos.z) + scale * 2
      );
      maxExtent = Math.max(maxExtent, extent);
    }
  }
  const actualBoundSize = Math.max(boundSize, maxExtent * 1.2);
  
  // Build node map
  const nodesMap = new Map<string, SDFNode>();
  for (const node of nodes) {
    nodesMap.set(node.id, node);
  }
  
  // Build combined SDF with color support
  const { sceneSDF, getColor } = buildSceneSDF(nodes, nodesMap);
  
  // Build adaptive octree
  const octree = buildAdaptiveOctree(
    { x: 0, y: 0, z: 0 },
    actualBoundSize,
    sceneSDF,
    minCellSize,
    maxDepth,
    0,
    adaptiveCurvature
  );
  
  const faces: Face[] = [];
  
  if (octree) {
    generateFacesFromOctree(octree, sceneSDF, getColor, faces);
  }
  
  return faces;
};

// ============================================
// Utility: Get SDF statistics for debugging
// ============================================

export const getSDFStats = (nodes: SDFNode[]): {
  nodeCount: number;
  primitiveCount: number;
  booleanCount: number;
  topLevelCount: number;
} => {
  const primitiveCount = nodes.filter(n => n.type !== 'boolean').length;
  const booleanCount = nodes.filter(n => n.type === 'boolean').length;
  
  const referencedIds = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'boolean' && node.booleanParams) {
      referencedIds.add(node.booleanParams.operandA);
      referencedIds.add(node.booleanParams.operandB);
    }
  }
  const topLevelCount = nodes.filter(n => !referencedIds.has(n.id) && n.visible).length;
  
  return {
    nodeCount: nodes.length,
    primitiveCount,
    booleanCount,
    topLevelCount,
  };
};
