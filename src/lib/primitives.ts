import { Vector3, Face, PrimitiveType } from '@/types/engine';

// Generate box faces
export const generateBox = (size: number = 50): Face[] => {
  const s = size / 2;
  
  const vertices: Vector3[] = [
    { x: -s, y: -s, z: -s }, // 0
    { x:  s, y: -s, z: -s }, // 1
    { x:  s, y:  s, z: -s }, // 2
    { x: -s, y:  s, z: -s }, // 3
    { x: -s, y: -s, z:  s }, // 4
    { x:  s, y: -s, z:  s }, // 5
    { x:  s, y:  s, z:  s }, // 6
    { x: -s, y:  s, z:  s }, // 7
  ];
  
  const faces: Face[] = [
    // Front
    { verts: [vertices[4], vertices[5], vertices[6], vertices[7]], color: '#00ffff' },
    // Back
    { verts: [vertices[1], vertices[0], vertices[3], vertices[2]], color: '#00cccc' },
    // Top
    { verts: [vertices[7], vertices[6], vertices[2], vertices[3]], color: '#00eeee' },
    // Bottom
    { verts: [vertices[0], vertices[1], vertices[5], vertices[4]], color: '#00aaaa' },
    // Right
    { verts: [vertices[5], vertices[1], vertices[2], vertices[6]], color: '#00dddd' },
    // Left
    { verts: [vertices[0], vertices[4], vertices[7], vertices[3]], color: '#00bbbb' },
  ];
  
  return faces;
};

// Generate sphere faces
export const generateSphere = (radius: number = 50, segments: number = 16): Face[] => {
  const faces: Face[] = [];
  
  for (let lat = 0; lat < segments; lat++) {
    const theta1 = (lat / segments) * Math.PI;
    const theta2 = ((lat + 1) / segments) * Math.PI;
    
    for (let lon = 0; lon < segments; lon++) {
      const phi1 = (lon / segments) * 2 * Math.PI;
      const phi2 = ((lon + 1) / segments) * 2 * Math.PI;
      
      const v1: Vector3 = {
        x: radius * Math.sin(theta1) * Math.cos(phi1),
        y: radius * Math.cos(theta1),
        z: radius * Math.sin(theta1) * Math.sin(phi1),
      };
      
      const v2: Vector3 = {
        x: radius * Math.sin(theta1) * Math.cos(phi2),
        y: radius * Math.cos(theta1),
        z: radius * Math.sin(theta1) * Math.sin(phi2),
      };
      
      const v3: Vector3 = {
        x: radius * Math.sin(theta2) * Math.cos(phi2),
        y: radius * Math.cos(theta2),
        z: radius * Math.sin(theta2) * Math.sin(phi2),
      };
      
      const v4: Vector3 = {
        x: radius * Math.sin(theta2) * Math.cos(phi1),
        y: radius * Math.cos(theta2),
        z: radius * Math.sin(theta2) * Math.sin(phi1),
      };
      
      // Calculate color based on position
      const hue = (lon / segments) * 60 + 160; // Cyan range
      const lightness = 40 + (lat / segments) * 20;
      
      if (lat === 0) {
        faces.push({
          verts: [v1, v3, v4],
          color: `hsl(${hue}, 100%, ${lightness}%)`,
        });
      } else if (lat === segments - 1) {
        faces.push({
          verts: [v1, v2, v3],
          color: `hsl(${hue}, 100%, ${lightness}%)`,
        });
      } else {
        faces.push({
          verts: [v1, v2, v3, v4],
          color: `hsl(${hue}, 100%, ${lightness}%)`,
        });
      }
    }
  }
  
  return faces;
};

// Generate cylinder faces
export const generateCylinder = (radius: number = 30, height: number = 80, segments: number = 16): Face[] => {
  const faces: Face[] = [];
  const h = height / 2;
  
  const topCenter: Vector3 = { x: 0, y: h, z: 0 };
  const bottomCenter: Vector3 = { x: 0, y: -h, z: 0 };
  
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * 2 * Math.PI;
    const angle2 = ((i + 1) / segments) * 2 * Math.PI;
    
    const x1 = radius * Math.cos(angle1);
    const z1 = radius * Math.sin(angle1);
    const x2 = radius * Math.cos(angle2);
    const z2 = radius * Math.sin(angle2);
    
    // Side face
    faces.push({
      verts: [
        { x: x1, y: h, z: z1 },
        { x: x2, y: h, z: z2 },
        { x: x2, y: -h, z: z2 },
        { x: x1, y: -h, z: z1 },
      ],
      color: `hsl(${170 + (i / segments) * 30}, 100%, 50%)`,
    });
    
    // Top cap
    faces.push({
      verts: [
        topCenter,
        { x: x2, y: h, z: z2 },
        { x: x1, y: h, z: z1 },
      ],
      color: '#00ffee',
    });
    
    // Bottom cap
    faces.push({
      verts: [
        bottomCenter,
        { x: x1, y: -h, z: z1 },
        { x: x2, y: -h, z: z2 },
      ],
      color: '#00ccbb',
    });
  }
  
  return faces;
};

// Generate torus faces (fixed winding for correct outward normals)
export const generateTorus = (majorRadius: number = 40, minorRadius: number = 15, segments: number = 16): Face[] => {
  const faces: Face[] = [];
  
  for (let i = 0; i < segments; i++) {
    const theta1 = (i / segments) * 2 * Math.PI;
    const theta2 = ((i + 1) / segments) * 2 * Math.PI;
    
    for (let j = 0; j < segments; j++) {
      const phi1 = (j / segments) * 2 * Math.PI;
      const phi2 = ((j + 1) / segments) * 2 * Math.PI;
      
      const getVertex = (theta: number, phi: number): Vector3 => ({
        x: (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta),
        y: minorRadius * Math.sin(phi),
        z: (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta),
      });
      
      // Reversed winding order for correct outward-facing normals
      faces.push({
        verts: [
          getVertex(theta1, phi2),
          getVertex(theta2, phi2),
          getVertex(theta2, phi1),
          getVertex(theta1, phi1),
        ],
        color: `hsl(${(i / segments) * 40 + 180}, 100%, ${45 + (j / segments) * 15}%)`,
      });
    }
  }
  
  return faces;
};

// Generate cone faces
export const generateCone = (radius: number = 40, height: number = 80, segments: number = 16): Face[] => {
  const faces: Face[] = [];
  const h = height / 2;
  
  const apex: Vector3 = { x: 0, y: h, z: 0 };
  const baseCenter: Vector3 = { x: 0, y: -h, z: 0 };
  
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * 2 * Math.PI;
    const angle2 = ((i + 1) / segments) * 2 * Math.PI;
    
    const x1 = radius * Math.cos(angle1);
    const z1 = radius * Math.sin(angle1);
    const x2 = radius * Math.cos(angle2);
    const z2 = radius * Math.sin(angle2);
    
    // Side face
    faces.push({
      verts: [
        apex,
        { x: x2, y: -h, z: z2 },
        { x: x1, y: -h, z: z1 },
      ],
      color: `hsl(${175 + (i / segments) * 25}, 100%, 50%)`,
    });
    
    // Base
    faces.push({
      verts: [
        baseCenter,
        { x: x1, y: -h, z: z1 },
        { x: x2, y: -h, z: z2 },
      ],
      color: '#00bbaa',
    });
  }
  
  return faces;
};

// Generate pyramid faces
export const generatePyramid = (size: number = 50, height: number = 70): Face[] => {
  const s = size / 2;
  const h = height / 2;
  
  const apex: Vector3 = { x: 0, y: h, z: 0 };
  const base: Vector3[] = [
    { x: -s, y: -h, z: -s },
    { x:  s, y: -h, z: -s },
    { x:  s, y: -h, z:  s },
    { x: -s, y: -h, z:  s },
  ];
  
  const faces: Face[] = [
    // Front
    { verts: [apex, base[2], base[3]], color: '#00ffdd' },
    // Right
    { verts: [apex, base[1], base[2]], color: '#00eedd' },
    // Back
    { verts: [apex, base[0], base[1]], color: '#00ddcc' },
    // Left
    { verts: [apex, base[3], base[0]], color: '#00ccbb' },
    // Base
    { verts: [base[0], base[3], base[2], base[1]], color: '#00aabb' },
  ];
  
  return faces;
};

// Generate 3D metaball cluster faces using SDF-based marching
// Metaballs are implicit surfaces defined by the sum of distance fields
export const generateMetaballs = (size: number = 60, blobCount: number = 5, time: number = 0): Face[] => {
  const faces: Face[] = [];
  
  // Define blob positions (animated by time)
  const blobs: { x: number; y: number; z: number; radius: number }[] = [];
  for (let i = 0; i < blobCount; i++) {
    const angle = (i / blobCount) * Math.PI * 2 + time * 0.5;
    const radius = size * 0.3;
    blobs.push({
      x: Math.cos(angle) * radius * 0.6 + Math.sin(time + i) * 10,
      y: Math.sin(angle * 0.7 + time * 0.3) * radius * 0.4,
      z: Math.sin(angle) * radius * 0.6 + Math.cos(time * 0.8 + i) * 10,
      radius: size * 0.25 + Math.sin(time * 2 + i * 0.5) * 5,
    });
  }
  
  // SDF evaluation function
  const sdfMetaballs = (px: number, py: number, pz: number): number => {
    let sum = 0;
    for (const blob of blobs) {
      const dx = px - blob.x;
      const dy = py - blob.y;
      const dz = pz - blob.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      sum += (blob.radius * blob.radius) / distSq;
    }
    return 1.0 - sum; // Negative inside surface
  };
  
  // March through 3D grid and generate faces using marching cubes-like approach
  const gridSize = 12;
  const step = size * 1.5 / gridSize;
  const offset = -size * 0.75;
  
  for (let iz = 0; iz < gridSize; iz++) {
    for (let iy = 0; iy < gridSize; iy++) {
      for (let ix = 0; ix < gridSize; ix++) {
        const x = offset + ix * step;
        const y = offset + iy * step;
        const z = offset + iz * step;
        
        // Sample SDF at cell corners
        const s = step;
        const v000 = sdfMetaballs(x, y, z);
        const v100 = sdfMetaballs(x + s, y, z);
        const v010 = sdfMetaballs(x, y + s, z);
        const v110 = sdfMetaballs(x + s, y + s, z);
        const v001 = sdfMetaballs(x, y, z + s);
        const v101 = sdfMetaballs(x + s, y, z + s);
        const v011 = sdfMetaballs(x, y + s, z + s);
        const v111 = sdfMetaballs(x + s, y + s, z + s);
        
        // Check if surface crosses this cell
        const inside = (v: number) => v < 0;
        const hasInside = inside(v000) || inside(v100) || inside(v010) || inside(v110) ||
                          inside(v001) || inside(v101) || inside(v011) || inside(v111);
        const hasOutside = !inside(v000) || !inside(v100) || !inside(v010) || !inside(v110) ||
                           !inside(v001) || !inside(v101) || !inside(v011) || !inside(v111);
        
        if (hasInside && hasOutside) {
          // Generate faces for this cell - simplified quad approach
          const cx = x + s / 2;
          const cy = y + s / 2;
          const cz = z + s / 2;
          const hs = s * 0.45;
          
          // Calculate gradient for normal direction
          const eps = 0.1;
          const nx = sdfMetaballs(cx + eps, cy, cz) - sdfMetaballs(cx - eps, cy, cz);
          const ny = sdfMetaballs(cx, cy + eps, cz) - sdfMetaballs(cx, cy - eps, cz);
          const nz = sdfMetaballs(cx, cy, cz + eps) - sdfMetaballs(cx, cy, cz - eps);
          const nmag = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          
          // Create face perpendicular to gradient
          const hue = 20 + (cy / size) * 30; // Orange gradient
          const lightness = 50 + Math.abs(nx / nmag) * 20;
          
          // Generate quad aligned with dominant axis
          if (Math.abs(nx) >= Math.abs(ny) && Math.abs(nx) >= Math.abs(nz)) {
            faces.push({
              verts: [
                { x: cx, y: cy - hs, z: cz - hs },
                { x: cx, y: cy + hs, z: cz - hs },
                { x: cx, y: cy + hs, z: cz + hs },
                { x: cx, y: cy - hs, z: cz + hs },
              ],
              color: `hsl(${hue}, 100%, ${lightness}%)`,
            });
          } else if (Math.abs(ny) >= Math.abs(nz)) {
            faces.push({
              verts: [
                { x: cx - hs, y: cy, z: cz - hs },
                { x: cx + hs, y: cy, z: cz - hs },
                { x: cx + hs, y: cy, z: cz + hs },
                { x: cx - hs, y: cy, z: cz + hs },
              ],
              color: `hsl(${hue}, 100%, ${lightness}%)`,
            });
          } else {
            faces.push({
              verts: [
                { x: cx - hs, y: cy - hs, z: cz },
                { x: cx + hs, y: cy - hs, z: cz },
                { x: cx + hs, y: cy + hs, z: cz },
                { x: cx - hs, y: cy + hs, z: cz },
              ],
              color: `hsl(${hue}, 100%, ${lightness}%)`,
            });
          }
        }
      }
    }
  }
  
  return faces;
};

// Generate 3D fluid blob - represents SPH fluid as a deformable mesh
export const generateFluidBlob = (size: number = 50, particleCount: number = 8, time: number = 0): Face[] => {
  const faces: Face[] = [];
  
  // Simulate fluid particles as spheroids that merge
  const particles: { x: number; y: number; z: number; r: number }[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const phase = i * 0.7 + time;
    particles.push({
      x: Math.sin(phase) * size * 0.3 + Math.cos(phase * 1.3) * size * 0.1,
      y: Math.sin(phase * 0.8 + i) * size * 0.2 - size * 0.3 + Math.sin(time * 2 + i) * 5,
      z: Math.cos(phase * 0.9) * size * 0.3,
      r: size * 0.15 + Math.sin(time + i * 0.5) * 3,
    });
  }
  
  // Generate spheroid faces for each particle
  const segments = 8;
  for (const p of particles) {
    for (let lat = 0; lat < segments; lat++) {
      const theta1 = (lat / segments) * Math.PI;
      const theta2 = ((lat + 1) / segments) * Math.PI;
      
      for (let lon = 0; lon < segments; lon++) {
        const phi1 = (lon / segments) * 2 * Math.PI;
        const phi2 = ((lon + 1) / segments) * 2 * Math.PI;
        
        const getVert = (theta: number, phi: number): Vector3 => ({
          x: p.x + p.r * Math.sin(theta) * Math.cos(phi),
          y: p.y + p.r * Math.cos(theta),
          z: p.z + p.r * Math.sin(theta) * Math.sin(phi),
        });
        
        const hue = 200 + (p.y / size) * 30; // Blue gradient
        const lightness = 45 + (lat / segments) * 20;
        
        if (lat === 0) {
          faces.push({
            verts: [getVert(theta1, phi1), getVert(theta2, phi2), getVert(theta2, phi1)],
            color: `hsl(${hue}, 80%, ${lightness}%)`,
          });
        } else if (lat === segments - 1) {
          faces.push({
            verts: [getVert(theta1, phi1), getVert(theta1, phi2), getVert(theta2, phi2)],
            color: `hsl(${hue}, 80%, ${lightness}%)`,
          });
        } else {
          faces.push({
            verts: [getVert(theta1, phi1), getVert(theta1, phi2), getVert(theta2, phi2), getVert(theta2, phi1)],
            color: `hsl(${hue}, 80%, ${lightness}%)`,
          });
        }
      }
    }
  }
  
  return faces;
};

// Generate 3D volumetric cloud as layered mesh
export const generateCloudVolume = (size: number = 80, puffCount: number = 6, time: number = 0): Face[] => {
  const faces: Face[] = [];
  
  // Cloud puffs as overlapping spheroids
  const puffs: { x: number; y: number; z: number; rx: number; ry: number; rz: number }[] = [];
  
  for (let i = 0; i < puffCount; i++) {
    const angle = (i / puffCount) * Math.PI * 2;
    puffs.push({
      x: Math.cos(angle) * size * 0.35 + Math.sin(time * 0.5 + i) * 5,
      y: Math.sin(i * 0.8) * size * 0.15 + size * 0.1,
      z: Math.sin(angle) * size * 0.3,
      rx: size * 0.3 + Math.random() * size * 0.1,
      ry: size * 0.2 + Math.random() * size * 0.05,
      rz: size * 0.25 + Math.random() * size * 0.1,
    });
  }
  
  // Generate ellipsoid faces for each puff
  const segments = 10;
  for (const puff of puffs) {
    for (let lat = 0; lat < segments; lat++) {
      const theta1 = (lat / segments) * Math.PI;
      const theta2 = ((lat + 1) / segments) * Math.PI;
      
      for (let lon = 0; lon < segments; lon++) {
        const phi1 = (lon / segments) * 2 * Math.PI;
        const phi2 = ((lon + 1) / segments) * 2 * Math.PI;
        
        const getVert = (theta: number, phi: number): Vector3 => ({
          x: puff.x + puff.rx * Math.sin(theta) * Math.cos(phi),
          y: puff.y + puff.ry * Math.cos(theta),
          z: puff.z + puff.rz * Math.sin(theta) * Math.sin(phi),
        });
        
        // White/gray cloud colors with lighting variation
        const lightness = 85 + (lat / segments) * 15 - (1 - Math.abs(Math.cos(phi1))) * 10;
        
        if (lat === 0) {
          faces.push({
            verts: [getVert(theta1, phi1), getVert(theta2, phi2), getVert(theta2, phi1)],
            color: `hsl(210, 10%, ${lightness}%)`,
          });
        } else if (lat === segments - 1) {
          faces.push({
            verts: [getVert(theta1, phi1), getVert(theta1, phi2), getVert(theta2, phi2)],
            color: `hsl(210, 10%, ${lightness}%)`,
          });
        } else {
          faces.push({
            verts: [getVert(theta1, phi1), getVert(theta1, phi2), getVert(theta2, phi2), getVert(theta2, phi1)],
            color: `hsl(210, 10%, ${lightness}%)`,
          });
        }
      }
    }
  }
  
  return faces;
};

// Generate faces for a primitive type
export const generatePrimitiveFaces = (type: PrimitiveType, size: number = 50, time: number = 0): Face[] => {
  switch (type) {
    case 'box':
      return generateBox(size);
    case 'sphere':
      return generateSphere(size);
    case 'cylinder':
      return generateCylinder(size * 0.6, size * 1.6);
    case 'torus':
      return generateTorus(size * 0.8, size * 0.3);
    case 'cone':
      return generateCone(size * 0.8, size * 1.6);
    case 'pyramid':
      return generatePyramid(size, size * 1.4);
    case 'metaballs':
      return generateMetaballs(size, 5, time);
    case 'fluidBlob':
      return generateFluidBlob(size, 8, time);
    case 'cloudVolume':
      return generateCloudVolume(size, 6, time);
    default:
      return generateBox(size);
  }
};
