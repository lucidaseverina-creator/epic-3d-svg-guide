// Noise functions for procedural effects

// Simplex/Perlin noise implementation
const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

// Permutation table
const perm = new Array(512);
const gradP = new Array(512);

// Seeded random
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Initialize permutation with seed
export function initNoise(seed: number = 0): void {
  const p = new Array(256);
  const random = seededRandom(seed);
  
  for (let i = 0; i < 256; i++) {
    p[i] = Math.floor(random() * 256);
  }
  
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    gradP[i] = GRAD3[perm[i] % 12];
  }
}

// Initialize with default seed
initNoise(42);

function dot2(g: number[], x: number, y: number): number {
  return g[0] * x + g[1] * y;
}

function dot3(g: number[], x: number, y: number, z: number): number {
  return g[0] * x + g[1] * y + g[2] * z;
}

// 2D Simplex Noise
export function simplex2D(x: number, y: number): number {
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);

  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;

  let i1: number, j1: number;
  if (x0 > y0) {
    i1 = 1;
    j1 = 0;
  } else {
    i1 = 0;
    j1 = 1;
  }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;

  const ii = i & 255;
  const jj = j & 255;
  const gi0 = gradP[ii + perm[jj]];
  const gi1 = gradP[ii + i1 + perm[jj + j1]];
  const gi2 = gradP[ii + 1 + perm[jj + 1]];

  let n0 = 0, n1 = 0, n2 = 0;

  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    t0 *= t0;
    n0 = t0 * t0 * dot2(gi0, x0, y0);
  }

  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    t1 *= t1;
    n1 = t1 * t1 * dot2(gi1, x1, y1);
  }

  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    t2 *= t2;
    n2 = t2 * t2 * dot2(gi2, x2, y2);
  }

  return 70 * (n0 + n1 + n2);
}

// 3D Simplex Noise
export function simplex3D(x: number, y: number, z: number): number {
  const F3 = 1 / 3;
  const G3 = 1 / 6;

  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);

  const t = (i + j + k) * G3;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;

  let i1: number, j1: number, k1: number;
  let i2: number, j2: number, k2: number;

  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1;
    } else {
      i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1;
    } else if (x0 < z0) {
      i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1;
    } else {
      i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0;
    }
  }

  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2 * G3;
  const y2 = y0 - j2 + 2 * G3;
  const z2 = z0 - k2 + 2 * G3;
  const x3 = x0 - 1 + 3 * G3;
  const y3 = y0 - 1 + 3 * G3;
  const z3 = z0 - 1 + 3 * G3;

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;

  const gi0 = gradP[ii + perm[jj + perm[kk]]];
  const gi1 = gradP[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
  const gi2 = gradP[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
  const gi3 = gradP[ii + 1 + perm[jj + 1 + perm[kk + 1]]];

  let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

  let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 >= 0) {
    t0 *= t0;
    n0 = t0 * t0 * dot3(gi0, x0, y0, z0);
  }

  let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 >= 0) {
    t1 *= t1;
    n1 = t1 * t1 * dot3(gi1, x1, y1, z1);
  }

  let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 >= 0) {
    t2 *= t2;
    n2 = t2 * t2 * dot3(gi2, x2, y2, z2);
  }

  let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 >= 0) {
    t3 *= t3;
    n3 = t3 * t3 * dot3(gi3, x3, y3, z3);
  }

  return 32 * (n0 + n1 + n2 + n3);
}

// Fractal Brownian Motion (FBM)
export function fbm2D(x: number, y: number, octaves: number = 4, lacunarity: number = 2, gain: number = 0.5): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * simplex2D(x * frequency, y * frequency);
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value;
}

export function fbm3D(x: number, y: number, z: number, octaves: number = 4, lacunarity: number = 2, gain: number = 0.5): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * simplex3D(x * frequency, y * frequency, z * frequency);
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value;
}

// Worley (cellular) noise
export function worley2D(x: number, y: number, scale: number = 1): number {
  const xi = Math.floor(x * scale);
  const yi = Math.floor(y * scale);
  const xf = (x * scale) - xi;
  const yf = (y * scale) - yi;

  let minDist = 1;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const cellX = xi + i;
      const cellY = yi + j;
      
      // Pseudo-random point in cell
      const random = seededRandom(cellX * 73856093 + cellY * 19349663);
      const px = i + random() - xf;
      const py = j + random() - yf;
      
      const dist = Math.sqrt(px * px + py * py);
      minDist = Math.min(minDist, dist);
    }
  }

  return minDist;
}

// Turbulence (absolute value noise)
export function turbulence2D(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * Math.abs(simplex2D(x * frequency, y * frequency));
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value;
}

// Ridged noise (for mountain/fire shapes)
export function ridged2D(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;

  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(simplex2D(x * frequency, y * frequency));
    value += amplitude * n * n;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value;
}

// Domain warping for organic look
export function warpedNoise2D(x: number, y: number, warpStrength: number = 0.5): number {
  const warpX = fbm2D(x, y, 2) * warpStrength;
  const warpY = fbm2D(x + 5.2, y + 1.3, 2) * warpStrength;
  return fbm2D(x + warpX, y + warpY, 4);
}
