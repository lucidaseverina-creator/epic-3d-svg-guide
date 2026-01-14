// ============================================
// SDF RENDERER - Generates meshes from SDF boolean nodes
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

// Additional SDF primitives
const sdfCylinder = (p: Vector3, center: Vector3, radius: number, height: number): number => {
  const dx = p.x - center.x;
  const dz = p.z - center.z;
  const distXZ = Math.sqrt(dx * dx + dz * dz) - radius;
  const distY = Math.abs(p.y - center.y) - height / 2;
  return Math.min(Math.max(distXZ, distY), 0) + Math.sqrt(Math.max(distXZ, 0) ** 2 + Math.max(distY, 0) ** 2);
};

const sdfCapsule = (p: Vector3, center: Vector3, radius: number, height: number): number => {
  const py = p.y - center.y;
  const halfH = height / 2 - radius;
  const clampedY = Math.max(-halfH, Math.min(halfH, py));
  const dx = p.x - center.x;
  const dy = py - clampedY;
  const dz = p.z - center.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - radius;
};

const sdfOctahedron = (p: Vector3, center: Vector3, size: number): number => {
  const px = Math.abs(p.x - center.x);
  const py = Math.abs(p.y - center.y);
  const pz = Math.abs(p.z - center.z);
  return (px + py + pz - size) * 0.577350269; // 1/sqrt(3)
};

// Smooth intersect operation
const sdfSmoothIntersect = (d1: number, d2: number, k: number): number => {
  const h = Math.max(k - Math.abs(d1 - d2), 0) / k;
  return Math.max(d1, d2) + h * h * k * 0.25;
};

// Evaluate a single primitive SDF
const evaluatePrimitive = (
  p: Vector3,
  node: SDFNode
): number => {
  const { position, scale, primitiveParams } = node;
  
  // Apply inverse scale to point
  const sp: Vector3 = {
    x: (p.x - position.x) / scale.x,
    y: (p.y - position.y) / scale.y,
    z: (p.z - position.z) / scale.z,
  };
  
  // Evaluate based on type
  switch (node.type as SDFPrimitiveType) {
    case 'sphere':
      return sdfSphere(sp, { x: 0, y: 0, z: 0 }, primitiveParams?.radius ?? 1) * Math.min(scale.x, scale.y, scale.z);
    
    case 'box':
      return sdfBox(sp, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }) * Math.min(scale.x, scale.y, scale.z);
    
    case 'torus':
      return sdfTorus(
        sp,
        { x: 0, y: 0, z: 0 },
        primitiveParams?.majorRadius ?? 1,
        primitiveParams?.minorRadius ?? 0.3
      ) * Math.min(scale.x, scale.y, scale.z);
    
    case 'cylinder':
      return sdfCylinder(
        sp,
        { x: 0, y: 0, z: 0 },
        primitiveParams?.radius ?? 0.5,
        primitiveParams?.height ?? 2
      ) * Math.min(scale.x, scale.y, scale.z);
    
    case 'capsule':
      return sdfCapsule(
        sp,
        { x: 0, y: 0, z: 0 },
        primitiveParams?.radius ?? 0.5,
        primitiveParams?.height ?? 2
      ) * Math.min(scale.x, scale.y, scale.z);
    
    case 'octahedron':
      return sdfOctahedron(sp, { x: 0, y: 0, z: 0 }, primitiveParams?.radius ?? 1) * Math.min(scale.x, scale.y, scale.z);
    
    default:
      return 1000;
  }
};

// Build the combined SDF function from all nodes
const buildSceneSDF = (
  nodes: SDFNode[],
  nodesMap: Map<string, SDFNode>
): (p: Vector3) => number => {
  // Create a memoized SDF evaluator for each node
  const nodeSDFs = new Map<string, (p: Vector3) => number>();
  
  const getNodeSDF = (id: string): ((p: Vector3) => number) => {
    if (nodeSDFs.has(id)) return nodeSDFs.get(id)!;
    
    const node = nodesMap.get(id);
    if (!node || !node.visible) {
      const emptyFn = () => 1000;
      nodeSDFs.set(id, emptyFn);
      return emptyFn;
    }
    
    if (node.type === 'boolean' && node.booleanParams) {
      const { operation, operandA, operandB, smoothness } = node.booleanParams;
      const sdfA = getNodeSDF(operandA);
      const sdfB = getNodeSDF(operandB);
      
      const boolFn = (p: Vector3): number => {
        const dA = sdfA(p);
        const dB = sdfB(p);
        
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
      
      nodeSDFs.set(id, boolFn);
      return boolFn;
    }
    
    // Primitive node
    const primFn = (p: Vector3) => evaluatePrimitive(p, node);
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
    return () => 1000;
  }
  
  return (p: Vector3): number => {
    let result = getNodeSDF(topLevelNodes[0].id)(p);
    for (let i = 1; i < topLevelNodes.length; i++) {
      result = sdfUnion(result, getNodeSDF(topLevelNodes[i].id)(p));
    }
    return result;
  };
};

// Adaptive octree node
interface OctreeNode {
  center: Vector3;
  size: number;
  children?: OctreeNode[];
  isSurface?: boolean;
}

// Check if cell contains surface
const cellContainsSurface = (
  center: Vector3,
  size: number,
  sdfFunc: (p: Vector3) => number
): boolean => {
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
  
  return hasInside && hasOutside;
};

// Build adaptive octree
const buildAdaptiveOctree = (
  center: Vector3,
  size: number,
  sdfFunc: (p: Vector3) => number,
  minSize: number,
  maxDepth: number,
  depth: number = 0
): OctreeNode | null => {
  if (!cellContainsSurface(center, size, sdfFunc)) {
    return null;
  }
  
  const node: OctreeNode = { center, size, isSurface: true };
  
  if (size <= minSize || depth >= maxDepth) {
    return node;
  }
  
  const halfSize = size / 2;
  const quarterSize = size / 4;
  const children: (OctreeNode | null)[] = [];
  
  for (let z = -1; z <= 1; z += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let x = -1; x <= 1; x += 2) {
        const childCenter = {
          x: center.x + x * quarterSize,
          y: center.y + y * quarterSize,
          z: center.z + z * quarterSize,
        };
        const child = buildAdaptiveOctree(childCenter, halfSize, sdfFunc, minSize, maxDepth, depth + 1);
        if (child) children.push(child);
      }
    }
  }
  
  if (children.length > 0) {
    node.children = children.filter(c => c !== null) as OctreeNode[];
    node.isSurface = false;
  }
  
  return node;
};

// Find surface point using bisection
const findSurfacePoint = (
  inside: Vector3,
  outside: Vector3,
  sdfFunc: (p: Vector3) => number,
  iterations: number = 6
): Vector3 => {
  let a = inside;
  let b = outside;
  
  for (let i = 0; i < iterations; i++) {
    const mid = {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      z: (a.z + b.z) / 2,
    };
    
    if (sdfFunc(mid) < 0) {
      a = mid;
    } else {
      b = mid;
    }
  }
  
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
};

// Generate faces from octree
const generateFacesFromOctree = (
  node: OctreeNode,
  sdfFunc: (p: Vector3) => number,
  baseColor: string,
  faces: Face[]
): void => {
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      generateFacesFromOctree(child, sdfFunc, baseColor, faces);
    }
    return;
  }
  
  const { center, size } = node;
  const normal = sdfNormal(center, sdfFunc, size * 0.1);
  
  const surfacePoint = findSurfacePoint(
    center,
    { x: center.x + normal.x * size, y: center.y + normal.y * size, z: center.z + normal.z * size },
    sdfFunc
  );
  
  // Create tangent vectors for quad
  const absNx = Math.abs(normal.x);
  const absNy = Math.abs(normal.y);
  const absNz = Math.abs(normal.z);
  
  let tangent1: Vector3;
  
  if (absNx <= absNy && absNx <= absNz) {
    tangent1 = { x: 0, y: -normal.z, z: normal.y };
  } else if (absNy <= absNz) {
    tangent1 = { x: -normal.z, y: 0, z: normal.x };
  } else {
    tangent1 = { x: -normal.y, y: normal.x, z: 0 };
  }
  
  const len1 = Math.sqrt(tangent1.x ** 2 + tangent1.y ** 2 + tangent1.z ** 2) || 1;
  tangent1 = { x: tangent1.x / len1, y: tangent1.y / len1, z: tangent1.z / len1 };
  
  const tangent2: Vector3 = {
    x: normal.y * tangent1.z - normal.z * tangent1.y,
    y: normal.z * tangent1.x - normal.x * tangent1.z,
    z: normal.x * tangent1.y - normal.y * tangent1.x,
  };
  
  const quadSize = size * 0.45;
  
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
    color: baseColor,
    normal,
  });
};

// Main render function - generates faces from SDF nodes
export const renderSDFNodes = (
  nodes: SDFNode[],
  options: {
    boundSize?: number;
    minCellSize?: number;
    maxDepth?: number;
    color?: string;
  } = {}
): Face[] => {
  const visibleNodes = nodes.filter(n => n.visible);
  if (visibleNodes.length === 0) return [];
  
  const {
    boundSize = 8,
    minCellSize = 0.15,
    maxDepth = 6,
    color = 'hsl(200, 70%, 55%)',
  } = options;
  
  // Build node map
  const nodesMap = new Map<string, SDFNode>();
  for (const node of nodes) {
    nodesMap.set(node.id, node);
  }
  
  // Build combined SDF
  const sceneSDF = buildSceneSDF(nodes, nodesMap);
  
  // Build adaptive octree
  const octree = buildAdaptiveOctree(
    { x: 0, y: 0, z: 0 },
    boundSize,
    sceneSDF,
    minCellSize,
    maxDepth
  );
  
  const faces: Face[] = [];
  
  if (octree) {
    generateFacesFromOctree(octree, sceneSDF, color, faces);
  }
  
  return faces;
};
