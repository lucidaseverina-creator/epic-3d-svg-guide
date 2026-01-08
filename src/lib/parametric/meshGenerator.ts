// ============================================
// MESH GENERATOR - Curve-First Base Mesh
// Generates parametric surface from B/K/D curves
// ============================================

import { BaseFormSpec, VertexDesignAttrib, Vec3 } from '@/types/parametric';
import { universalSectionLaw } from './sectionLaw';

export interface GeneratedMesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  designAttribs: {
    u: Float32Array;
    s: Float32Array;
    side: Int8Array;
  };
  vertexCount: number;
  triangleCount: number;
}

// Cross product of two vectors
function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

// Normalize a vector
function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 1, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

// Subtract vectors
function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * Generate base mesh from BaseFormSpec
 * 
 * This implements the universal mesh synthesis algorithm:
 * 1. Sample u stations (0 to Nu)
 * 2. For each station, compute B, K, D and section params
 * 3. For each lateral sample (0 to Nv), compute section law t = F(s)
 * 4. Compute vertex position: x = (u - 0.5) * L, y = K + (D - K) * t, z = s * B
 * 5. Mirror for opposite side
 * 6. Build indices and normals
 */
export function generateBaseMesh(spec: BaseFormSpec): GeneratedMesh {
  const { L, B, K, D, sectionAt, Nu, Nv } = spec;
  const u0 = 0.5; // Center at origin
  
  // Calculate vertex counts
  // For each u station: (Nv + 1) vertices on each side, minus shared centerline
  // Total per side: (Nu + 1) * (Nv + 1)
  // Both sides share centerline vertices
  const verticesPerSide = (Nu + 1) * (Nv + 1);
  const totalVertices = verticesPerSide * 2 - (Nu + 1); // Subtract shared centerline
  
  // Preallocate arrays
  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const uAttribs = new Float32Array(totalVertices);
  const sAttribs = new Float32Array(totalVertices);
  const sideAttribs = new Int8Array(totalVertices);
  
  let vertexIndex = 0;
  
  // Generate right side (positive Z)
  for (let i = 0; i <= Nu; i++) {
    const u = i / Nu;
    const b = B.eval(u);
    const yK = K.eval(u);
    const yD = D.eval(u);
    const sectionParams = sectionAt(u);
    
    for (let j = 0; j <= Nv; j++) {
      const s = j / Nv;
      const t = universalSectionLaw.F(s, sectionParams);
      
      const x = (u - u0) * L;
      const y = yK + (yD - yK) * t;
      const z = s * b;
      
      const idx = vertexIndex * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      
      uAttribs[vertexIndex] = u;
      sAttribs[vertexIndex] = s;
      sideAttribs[vertexIndex] = 1;
      
      vertexIndex++;
    }
  }
  
  // Generate left side (negative Z), skip centerline (j=0)
  for (let i = 0; i <= Nu; i++) {
    const u = i / Nu;
    const b = B.eval(u);
    const yK = K.eval(u);
    const yD = D.eval(u);
    const sectionParams = sectionAt(u);
    
    for (let j = 1; j <= Nv; j++) {
      const s = j / Nv;
      const t = universalSectionLaw.F(s, sectionParams);
      
      const x = (u - u0) * L;
      const y = yK + (yD - yK) * t;
      const z = -s * b; // Negative Z for left side
      
      const idx = vertexIndex * 3;
      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      
      uAttribs[vertexIndex] = u;
      sAttribs[vertexIndex] = s;
      sideAttribs[vertexIndex] = -1;
      
      vertexIndex++;
    }
  }
  
  // Build indices
  // Right side quads
  const rightSideIndices: number[] = [];
  for (let i = 0; i < Nu; i++) {
    for (let j = 0; j < Nv; j++) {
      const v0 = i * (Nv + 1) + j;
      const v1 = i * (Nv + 1) + (j + 1);
      const v2 = (i + 1) * (Nv + 1) + j;
      const v3 = (i + 1) * (Nv + 1) + (j + 1);
      
      // Two triangles per quad
      rightSideIndices.push(v0, v2, v1);
      rightSideIndices.push(v1, v2, v3);
    }
  }
  
  // Left side quads
  const leftSideOffset = verticesPerSide;
  const leftSideIndices: number[] = [];
  
  for (let i = 0; i < Nu; i++) {
    for (let j = 0; j < Nv; j++) {
      // Handle centerline connection
      let v0: number, v1: number, v2: number, v3: number;
      
      if (j === 0) {
        // Connect to right side centerline
        v0 = i * (Nv + 1); // Right side centerline
        v1 = leftSideOffset + i * Nv;
        v2 = (i + 1) * (Nv + 1); // Right side centerline
        v3 = leftSideOffset + (i + 1) * Nv;
      } else {
        v0 = leftSideOffset + i * Nv + (j - 1);
        v1 = leftSideOffset + i * Nv + j;
        v2 = leftSideOffset + (i + 1) * Nv + (j - 1);
        v3 = leftSideOffset + (i + 1) * Nv + j;
      }
      
      // Reverse winding for left side
      leftSideIndices.push(v0, v1, v2);
      leftSideIndices.push(v1, v3, v2);
    }
  }
  
  const indices = new Uint32Array([...rightSideIndices, ...leftSideIndices]);
  
  // Compute normals
  computeNormals(positions, indices, normals);
  
  return {
    positions,
    normals,
    indices,
    designAttribs: {
      u: uAttribs,
      s: sAttribs,
      side: sideAttribs,
    },
    vertexCount: totalVertices,
    triangleCount: indices.length / 3,
  };
}

// Compute vertex normals from face normals
function computeNormals(
  positions: Float32Array,
  indices: Uint32Array,
  normals: Float32Array
): void {
  // Zero out normals
  normals.fill(0);
  
  // Accumulate face normals
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];
    
    const p0: Vec3 = {
      x: positions[i0 * 3],
      y: positions[i0 * 3 + 1],
      z: positions[i0 * 3 + 2],
    };
    const p1: Vec3 = {
      x: positions[i1 * 3],
      y: positions[i1 * 3 + 1],
      z: positions[i1 * 3 + 2],
    };
    const p2: Vec3 = {
      x: positions[i2 * 3],
      y: positions[i2 * 3 + 1],
      z: positions[i2 * 3 + 2],
    };
    
    const edge1 = sub(p1, p0);
    const edge2 = sub(p2, p0);
    const faceNormal = cross(edge1, edge2);
    
    // Add to each vertex
    for (const idx of [i0, i1, i2]) {
      normals[idx * 3] += faceNormal.x;
      normals[idx * 3 + 1] += faceNormal.y;
      normals[idx * 3 + 2] += faceNormal.z;
    }
  }
  
  // Normalize
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.sqrt(
      normals[i] * normals[i] +
      normals[i + 1] * normals[i + 1] +
      normals[i + 2] * normals[i + 2]
    );
    if (len > 0) {
      normals[i] /= len;
      normals[i + 1] /= len;
      normals[i + 2] /= len;
    }
  }
}

// Convert to Face array for SVG renderer
export function meshToFaces(
  mesh: GeneratedMesh,
  color: string = '#00ffff'
): { verts: Vec3[]; color: string; normal?: Vec3 }[] {
  const faces: { verts: Vec3[]; color: string; normal?: Vec3 }[] = [];
  
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const i0 = mesh.indices[i];
    const i1 = mesh.indices[i + 1];
    const i2 = mesh.indices[i + 2];
    
    const verts: Vec3[] = [
      {
        x: mesh.positions[i0 * 3],
        y: mesh.positions[i0 * 3 + 1],
        z: mesh.positions[i0 * 3 + 2],
      },
      {
        x: mesh.positions[i1 * 3],
        y: mesh.positions[i1 * 3 + 1],
        z: mesh.positions[i1 * 3 + 2],
      },
      {
        x: mesh.positions[i2 * 3],
        y: mesh.positions[i2 * 3 + 1],
        z: mesh.positions[i2 * 3 + 2],
      },
    ];
    
    const normal: Vec3 = {
      x: mesh.normals[i0 * 3],
      y: mesh.normals[i0 * 3 + 1],
      z: mesh.normals[i0 * 3 + 2],
    };
    
    // Vary color based on design coordinates
    const u = mesh.designAttribs.u[i0];
    const s = mesh.designAttribs.s[i0];
    const hue = 180 + u * 40 - s * 20;
    const lightness = 40 + s * 20;
    
    faces.push({
      verts,
      color: `hsl(${hue}, 80%, ${lightness}%)`,
      normal,
    });
  }
  
  return faces;
}
