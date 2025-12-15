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

// Generate faces for a primitive type
export const generatePrimitiveFaces = (type: PrimitiveType, size: number = 50): Face[] => {
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
    default:
      return generateBox(size);
  }
};
