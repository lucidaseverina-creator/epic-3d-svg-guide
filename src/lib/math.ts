import { Vector3, Vector2 } from '@/types/engine';

// Vector Operations
export const add = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

export const subtract = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const multiply = (v: Vector3, s: number): Vector3 => ({
  x: v.x * s,
  y: v.y * s,
  z: v.z * s,
});

export const divide = (v: Vector3, s: number): Vector3 => ({
  x: v.x / s,
  y: v.y / s,
  z: v.z / s,
});

export const dot = (a: Vector3, b: Vector3): number => 
  a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const length = (v: Vector3): number => 
  Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

export const normalize = (v: Vector3): Vector3 => {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return divide(v, len);
};

// Rotation (Euler angles)
export const rotateX = (v: Vector3, angle: number): Vector3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x,
    y: v.y * cos - v.z * sin,
    z: v.y * sin + v.z * cos,
  };
};

export const rotateY = (v: Vector3, angle: number): Vector3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos + v.z * sin,
    y: v.y,
    z: -v.x * sin + v.z * cos,
  };
};

export const rotateZ = (v: Vector3, angle: number): Vector3 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
    z: v.z,
  };
};

export const rotateEuler = (v: Vector3, rotation: Vector3): Vector3 => {
  let result = rotateX(v, rotation.x);
  result = rotateY(result, rotation.y);
  result = rotateZ(result, rotation.z);
  return result;
};

// Projection
export const project = (
  v: Vector3,
  width: number,
  height: number,
  fov: number,
  cameraZ: number
): Vector2 => {
  const zOffset = v.z + cameraZ;
  const scale = zOffset > 10 ? fov / zOffset : fov / 10;
  
  return {
    x: v.x * scale + width / 2,
    y: -v.y * scale + height / 2,
    scale,
    z: v.z,
  };
};

// Transform point with object transform
export const transformPoint = (
  point: Vector3,
  position: Vector3,
  rotation: Vector3,
  scale: Vector3
): Vector3 => {
  // Scale
  let result: Vector3 = {
    x: point.x * scale.x,
    y: point.y * scale.y,
    z: point.z * scale.z,
  };
  
  // Rotate
  result = rotateEuler(result, rotation);
  
  // Translate
  result = add(result, position);
  
  return result;
};

// Calculate face normal
export const calculateNormal = (verts: Vector3[]): Vector3 => {
  if (verts.length < 3) return { x: 0, y: 0, z: 1 };
  
  const v1 = subtract(verts[1], verts[0]);
  const v2 = subtract(verts[2], verts[0]);
  
  return normalize(cross(v1, v2));
};

// Calculate face center
export const calculateCenter = (verts: Vector3[]): Vector3 => {
  const sum = verts.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y, z: acc.z + v.z }),
    { x: 0, y: 0, z: 0 }
  );
  return divide(sum, verts.length);
};

// Interpolation
export const lerp = (a: number, b: number, t: number): number => 
  a + (b - a) * t;

export const lerpVec3 = (a: Vector3, b: Vector3, t: number): Vector3 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: lerp(a.z, b.z, t),
});

// Easing functions
export const easeInOut = (t: number): number => 
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export const easeInCubic = (t: number): number => t * t * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

// Clamp
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

// Snap to grid
export const snapToGrid = (value: number, gridSize: number): number =>
  Math.round(value / gridSize) * gridSize;

// Constrain to axis
export const constrainToAxis = (
  delta: Vector3,
  axis: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'none'
): Vector3 => {
  switch (axis) {
    case 'x': return { x: delta.x, y: 0, z: 0 };
    case 'y': return { x: 0, y: delta.y, z: 0 };
    case 'z': return { x: 0, y: 0, z: delta.z };
    case 'xy': return { x: delta.x, y: delta.y, z: 0 };
    case 'xz': return { x: delta.x, y: 0, z: delta.z };
    case 'yz': return { x: 0, y: delta.y, z: delta.z };
    default: return delta;
  }
};
