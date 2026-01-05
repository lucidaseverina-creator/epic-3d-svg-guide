// Signed Distance Function library for true SDF-based 3D effects
import { Vector3, Face } from '@/types/engine';

// ============================================
// SDF Primitives
// ============================================

export const sdfSphere = (p: Vector3, center: Vector3, radius: number): number => {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const dz = p.z - center.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - radius;
};

export const sdfBox = (p: Vector3, center: Vector3, size: Vector3): number => {
  const dx = Math.abs(p.x - center.x) - size.x;
  const dy = Math.abs(p.y - center.y) - size.y;
  const dz = Math.abs(p.z - center.z) - size.z;
  
  const outsideDist = Math.sqrt(
    Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2 + Math.max(dz, 0) ** 2
  );
  const insideDist = Math.min(Math.max(dx, dy, dz), 0);
  
  return outsideDist + insideDist;
};

export const sdfTorus = (p: Vector3, center: Vector3, majorR: number, minorR: number): number => {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const dz = p.z - center.z;
  
  const q = Math.sqrt(dx * dx + dz * dz) - majorR;
  return Math.sqrt(q * q + dy * dy) - minorR;
};

// ============================================
// SDF Operations (smooth blending)
// ============================================

export const sdfUnion = (d1: number, d2: number): number => Math.min(d1, d2);

export const sdfIntersect = (d1: number, d2: number): number => Math.max(d1, d2);

export const sdfSubtract = (d1: number, d2: number): number => Math.max(d1, -d2);

// Smooth minimum for organic blending (polynomial smooth min)
export const sdfSmoothUnion = (d1: number, d2: number, k: number): number => {
  const h = Math.max(k - Math.abs(d1 - d2), 0) / k;
  return Math.min(d1, d2) - h * h * k * 0.25;
};

export const sdfSmoothSubtract = (d1: number, d2: number, k: number): number => {
  return -sdfSmoothUnion(-d1, d2, k);
};

// ============================================
// Gradient/Normal calculation via central differences
// ============================================

export const sdfNormal = (
  p: Vector3, 
  sdfFunc: (p: Vector3) => number,
  eps: number = 0.01
): Vector3 => {
  const nx = sdfFunc({ x: p.x + eps, y: p.y, z: p.z }) - sdfFunc({ x: p.x - eps, y: p.y, z: p.z });
  const ny = sdfFunc({ x: p.x, y: p.y + eps, z: p.z }) - sdfFunc({ x: p.x, y: p.y - eps, z: p.z });
  const nz = sdfFunc({ x: p.x, y: p.y, z: p.z + eps }) - sdfFunc({ x: p.x, y: p.y, z: p.z - eps });
  
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
};

// ============================================
// Metaball SDF - true smooth blending
// ============================================

export interface MetaballBlob {
  center: Vector3;
  radius: number;
}

export const sdfMetaballs = (p: Vector3, blobs: MetaballBlob[], smoothness: number = 0.5): number => {
  if (blobs.length === 0) return 1000;
  
  let result = sdfSphere(p, blobs[0].center, blobs[0].radius);
  
  for (let i = 1; i < blobs.length; i++) {
    const d = sdfSphere(p, blobs[i].center, blobs[i].radius);
    result = sdfSmoothUnion(result, d, smoothness * blobs[i].radius);
  }
  
  return result;
};

// ============================================
// Adaptive Octree Surface Extraction
// ============================================

interface OctreeNode {
  center: Vector3;
  size: number;
  children?: OctreeNode[];
  isSurface?: boolean;
}

// Check if an octree cell contains the isosurface
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

// Subdivide octree adaptively
const buildAdaptiveOctree = (
  center: Vector3,
  size: number,
  sdfFunc: (p: Vector3) => number,
  minSize: number,
  maxDepth: number,
  depth: number = 0
): OctreeNode | null => {
  // Check if this cell contains surface
  if (!cellContainsSurface(center, size, sdfFunc)) {
    return null; // No surface in this cell, skip entirely
  }
  
  const node: OctreeNode = { center, size, isSurface: true };
  
  // If we've reached minimum size or max depth, stop subdividing
  if (size <= minSize || depth >= maxDepth) {
    return node;
  }
  
  // Subdivide into 8 children
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
    node.isSurface = false; // Has children, so this node itself isn't a leaf
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

// Generate faces from octree leaf nodes
const generateFacesFromOctree = (
  node: OctreeNode,
  sdfFunc: (p: Vector3) => number,
  baseColor: string,
  faces: Face[]
): void => {
  if (node.children && node.children.length > 0) {
    // Recurse into children
    for (const child of node.children) {
      generateFacesFromOctree(child, sdfFunc, baseColor, faces);
    }
    return;
  }
  
  // Leaf node - generate surface quad
  const { center, size } = node;
  const halfSize = size / 2;
  
  // Get normal at center
  const normal = sdfNormal(center, sdfFunc, size * 0.1);
  
  // Find actual surface point by bisection from center
  const surfacePoint = findSurfacePoint(
    center,
    { x: center.x + normal.x * size, y: center.y + normal.y * size, z: center.z + normal.z * size },
    sdfFunc
  );
  
  // Create tangent vectors for the quad
  const absNx = Math.abs(normal.x);
  const absNy = Math.abs(normal.y);
  const absNz = Math.abs(normal.z);
  
  let tangent1: Vector3;
  let tangent2: Vector3;
  
  if (absNx <= absNy && absNx <= absNz) {
    tangent1 = { x: 0, y: -normal.z, z: normal.y };
  } else if (absNy <= absNz) {
    tangent1 = { x: -normal.z, y: 0, z: normal.x };
  } else {
    tangent1 = { x: -normal.y, y: normal.x, z: 0 };
  }
  
  const len1 = Math.sqrt(tangent1.x ** 2 + tangent1.y ** 2 + tangent1.z ** 2) || 1;
  tangent1 = { x: tangent1.x / len1, y: tangent1.y / len1, z: tangent1.z / len1 };
  
  tangent2 = {
    x: normal.y * tangent1.z - normal.z * tangent1.y,
    y: normal.z * tangent1.x - normal.x * tangent1.z,
    z: normal.x * tangent1.y - normal.y * tangent1.x,
  };
  
  const quadSize = halfSize * 0.9;
  
  // Create quad vertices
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
  
  // Calculate lighting based on normal
  const lightDir = { x: 0.5, y: 0.8, z: 0.3 };
  const lightLen = Math.sqrt(lightDir.x ** 2 + lightDir.y ** 2 + lightDir.z ** 2);
  const nLight = { x: lightDir.x / lightLen, y: lightDir.y / lightLen, z: lightDir.z / lightLen };
  
  const dot = Math.max(0, normal.x * nLight.x + normal.y * nLight.y + normal.z * nLight.z);
  const lightness = 35 + dot * 40;
  
  // Parse base color and apply lighting
  const hueMatch = baseColor.match(/hsl\((\d+)/);
  const hue = hueMatch ? parseInt(hueMatch[1]) : 20;
  
  faces.push({
    verts: [v1, v2, v3, v4],
    color: `hsl(${hue}, 90%, ${lightness}%)`,
    normal,
  });
};

// ============================================
// Main SDF Effect Generators
// ============================================

export const generateSDFMetaballs = (
  size: number,
  blobCount: number,
  time: number,
  smoothness: number = 0.5
): Face[] => {
  // Generate animated blob positions
  const blobs: MetaballBlob[] = [];
  
  for (let i = 0; i < blobCount; i++) {
    const angle = (i / blobCount) * Math.PI * 2 + time * 0.4;
    const vertAngle = time * 0.3 + i * 1.2;
    const orbitRadius = size * 0.35 + Math.sin(time * 0.7 + i) * size * 0.1;
    
    blobs.push({
      center: {
        x: Math.cos(angle) * orbitRadius,
        y: Math.sin(vertAngle) * size * 0.25,
        z: Math.sin(angle) * orbitRadius,
      },
      radius: size * 0.22 + Math.sin(time * 1.5 + i * 0.8) * size * 0.05,
    });
  }
  
  // Create SDF function for these metaballs
  const sdfFunc = (p: Vector3) => sdfMetaballs(p, blobs, smoothness * size * 0.3);
  
  // Build adaptive octree
  const boundSize = size * 1.5;
  const minCellSize = size * 0.08; // Adaptive resolution
  const maxDepth = 6;
  
  const octree = buildAdaptiveOctree(
    { x: 0, y: 0, z: 0 },
    boundSize,
    sdfFunc,
    minCellSize,
    maxDepth
  );
  
  const faces: Face[] = [];
  
  if (octree) {
    generateFacesFromOctree(octree, sdfFunc, 'hsl(25, 100%, 50%)', faces);
  }
  
  return faces;
};

export const generateSDFFluid = (
  size: number,
  particleCount: number,
  time: number
): Face[] => {
  // Generate fluid particle positions with gravity simulation
  const blobs: MetaballBlob[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const phase = time * 1.2 + i * 0.6;
    const wavePhase = Math.sin(phase * 0.5);
    
    blobs.push({
      center: {
        x: Math.sin(phase) * size * 0.3 + Math.cos(phase * 1.7) * size * 0.15,
        y: Math.sin(phase * 0.6 + i) * size * 0.25 - size * 0.2 + wavePhase * size * 0.1,
        z: Math.cos(phase * 0.8) * size * 0.3,
      },
      radius: size * 0.18 + Math.sin(time * 2 + i * 0.4) * size * 0.03,
    });
  }
  
  const sdfFunc = (p: Vector3) => sdfMetaballs(p, blobs, size * 0.25);
  
  const boundSize = size * 1.4;
  const minCellSize = size * 0.09;
  
  const octree = buildAdaptiveOctree(
    { x: 0, y: 0, z: 0 },
    boundSize,
    sdfFunc,
    minCellSize,
    5
  );
  
  const faces: Face[] = [];
  
  if (octree) {
    generateFacesFromOctree(octree, sdfFunc, 'hsl(200, 80%, 50%)', faces);
  }
  
  return faces;
};

export const generateSDFCloud = (
  size: number,
  puffCount: number,
  time: number
): Face[] => {
  const blobs: MetaballBlob[] = [];
  
  for (let i = 0; i < puffCount; i++) {
    const angle = (i / puffCount) * Math.PI * 2;
    const layerOffset = (i % 2) * size * 0.15;
    
    blobs.push({
      center: {
        x: Math.cos(angle) * size * 0.4 + Math.sin(time * 0.3 + i) * size * 0.05,
        y: size * 0.1 + layerOffset + Math.sin(time * 0.5 + i * 0.5) * size * 0.05,
        z: Math.sin(angle) * size * 0.35,
      },
      radius: size * 0.28 + Math.sin(i * 1.5) * size * 0.08,
    });
  }
  
  const sdfFunc = (p: Vector3) => sdfMetaballs(p, blobs, size * 0.4);
  
  const boundSize = size * 1.6;
  const minCellSize = size * 0.1;
  
  const octree = buildAdaptiveOctree(
    { x: 0, y: size * 0.1, z: 0 },
    boundSize,
    sdfFunc,
    minCellSize,
    5
  );
  
  const faces: Face[] = [];
  
  if (octree) {
    generateFacesFromOctree(octree, sdfFunc, 'hsl(210, 15%, 85%)', faces);
  }
  
  return faces;
};

// God rays as volumetric light shafts (SDF cylinder unions)
export const generateSDFGodRays = (
  size: number,
  rayCount: number,
  time: number
): Face[] => {
  const faces: Face[] = [];
  
  // God rays are better as geometric rather than SDF - using tapered cones
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + time * 0.08;
    const wobble = Math.sin(time * 2 + i * 0.9) * 0.1;
    
    const baseRadius = size * 0.05;
    const tipRadius = size * 0.2;
    const length = size * 1.8;
    
    const segments = 6;
    const lightIntensity = 0.5 + Math.sin(time * 3 + i * 0.7) * 0.3;
    
    for (let j = 0; j < segments; j++) {
      const a1 = (j / segments) * Math.PI * 2;
      const a2 = ((j + 1) / segments) * Math.PI * 2;
      
      // Transform ray direction
      const dirX = Math.cos(angle + wobble);
      const dirZ = Math.sin(angle + wobble);
      
      // Base vertices (at light source)
      const b1x = Math.cos(a1) * baseRadius;
      const b1z = Math.sin(a1) * baseRadius;
      const b2x = Math.cos(a2) * baseRadius;
      const b2z = Math.sin(a2) * baseRadius;
      
      // Tip vertices (spread out)
      const t1x = dirX * length + Math.cos(a1) * tipRadius;
      const t1z = dirZ * length + Math.sin(a1) * tipRadius;
      const t2x = dirX * length + Math.cos(a2) * tipRadius;
      const t2z = dirZ * length + Math.sin(a2) * tipRadius;
      
      const opacity = Math.floor(25 * lightIntensity);
      
      faces.push({
        verts: [
          { x: b1x, y: size * 0.9, z: b1z },
          { x: b2x, y: size * 0.9, z: b2z },
          { x: t2x, y: -size * 0.6, z: t2z },
          { x: t1x, y: -size * 0.6, z: t1z },
        ],
        color: `hsla(48, 100%, 80%, ${opacity}%)`,
      });
    }
  }
  
  return faces;
};

// Fire using SDF for organic flame shapes
export const generateSDFFire = (
  size: number,
  particleCount: number,
  time: number
): Face[] => {
  const blobs: MetaballBlob[] = [];
  
  // Create rising flame blobs
  for (let i = 0; i < particleCount; i++) {
    const lifeOffset = (time * 2 + i * 0.4) % 2;
    const life = lifeOffset / 2; // 0 to 1
    
    const baseAngle = (i / particleCount) * Math.PI * 2;
    const spread = life * size * 0.15;
    
    blobs.push({
      center: {
        x: Math.cos(baseAngle) * size * 0.15 + Math.sin(time * 3 + i) * spread,
        y: life * size * 0.7 - size * 0.2,
        z: Math.sin(baseAngle) * size * 0.15 + Math.cos(time * 2.5 + i * 1.3) * spread * 0.5,
      },
      radius: size * 0.15 * (1 - life * 0.6),
    });
  }
  
  const sdfFunc = (p: Vector3) => sdfMetaballs(p, blobs, size * 0.2);
  
  const boundSize = size * 1.3;
  const minCellSize = size * 0.08;
  
  const octree = buildAdaptiveOctree(
    { x: 0, y: size * 0.1, z: 0 },
    boundSize,
    sdfFunc,
    minCellSize,
    5
  );
  
  const faces: Face[] = [];
  
  if (octree) {
    generateFacesFromOctree(octree, sdfFunc, 'hsl(30, 100%, 55%)', faces);
  }
  
  return faces;
};

// Smoke using soft SDF blobs
export const generateSDFSmoke = (
  size: number,
  particleCount: number,
  time: number
): Face[] => {
  const blobs: MetaballBlob[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const lifeOffset = (time * 0.6 + i * 0.7) % 3;
    const life = lifeOffset / 3;
    
    const spiralAngle = life * Math.PI * 2 + i;
    const spread = life * size * 0.5;
    
    blobs.push({
      center: {
        x: Math.cos(spiralAngle) * spread * 0.6,
        y: life * size - size * 0.3,
        z: Math.sin(spiralAngle) * spread * 0.6,
      },
      radius: size * 0.2 * (0.4 + life * 0.6),
    });
  }
  
  const sdfFunc = (p: Vector3) => sdfMetaballs(p, blobs, size * 0.35);
  
  const boundSize = size * 1.5;
  const minCellSize = size * 0.12;
  
  const octree = buildAdaptiveOctree(
    { x: 0, y: size * 0.2, z: 0 },
    boundSize,
    sdfFunc,
    minCellSize,
    4
  );
  
  const faces: Face[] = [];
  
  if (octree) {
    generateFacesFromOctree(octree, sdfFunc, 'hsl(0, 0%, 55%)', faces);
  }
  
  return faces;
};
