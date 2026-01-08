// ============================================
// SECTION LAW - F(s; SectionParams) → t
// Converts lateral coordinate to height fraction
// ============================================

import { SectionParams, SectionLaw } from '@/types/parametric';

// Smoothstep function
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Smooth minimum for blending
function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * h * k / 6;
}

// Create default section params
export function createDefaultSectionParams(): SectionParams {
  return {
    vDepth: 0.3,
    deadrise: 0.2,
    bilgeRadius: 0.4,
    chineSharpness: 0.3,
    flare: 0.1,
    railRadius: 0.2,
    bodyPow: 0.5,
  };
}

// Interpolate section params
export function lerpSectionParams(
  a: SectionParams,
  b: SectionParams,
  t: number
): SectionParams {
  return {
    vDepth: a.vDepth + t * (b.vDepth - a.vDepth),
    deadrise: a.deadrise + t * (b.deadrise - a.deadrise),
    bilgeRadius: a.bilgeRadius + t * (b.bilgeRadius - a.bilgeRadius),
    chineSharpness: a.chineSharpness + t * (b.chineSharpness - a.chineSharpness),
    flare: a.flare + t * (b.flare - a.flare),
    railRadius: a.railRadius + t * (b.railRadius - a.railRadius),
    bodyPow: a.bodyPow + t * (b.bodyPow - a.bodyPow),
  };
}

/**
 * Universal Section Law Implementation
 * 
 * F(s; p) returns t ∈ [0,1] where:
 * - s=0 is centerline (keel)
 * - s=1 is rail (max beam)
 * - t=0 is bottom (keel height)
 * - t=1 is top (deck height)
 * 
 * The section law must represent:
 * 1. Deep V hulls vs shallow (vDepth)
 * 2. Round bilges vs hard chines (bilgeRadius, chineSharpness)
 * 3. Flare/tumblehome (flare)
 * 4. Rail rounding (railRadius)
 */
export const universalSectionLaw: SectionLaw = {
  F(s: number, p: SectionParams): number {
    // Clamp s to valid range
    s = Math.max(0, Math.min(1, s));
    
    // === 1. Base rise curve ===
    // Power-based rise from keel to rail
    const basePow = 1 + p.bodyPow * 2; // 1 to 3
    let t = Math.pow(s, basePow);
    
    // === 2. V-hull blend ===
    // Add V-shape at centerline
    if (p.vDepth > 0) {
      const vFactor = p.vDepth;
      const vShape = 1 - Math.pow(1 - s, 2); // Parabolic V
      const deadriseOffset = p.deadrise * s * 0.3;
      t = t * (1 - vFactor) + vShape * vFactor + deadriseOffset;
    }
    
    // === 3. Bilge/Chine knee ===
    // Transition region at bilge
    const bilgePos = 0.3 + p.bilgeRadius * 0.3; // 0.3 to 0.6
    const chineWidth = 0.1 + (1 - p.chineSharpness) * 0.2;
    
    if (s > bilgePos - chineWidth && s < bilgePos + chineWidth) {
      const bilgeT = (s - (bilgePos - chineWidth)) / (2 * chineWidth);
      const sharpness = 1 + p.chineSharpness * 4; // 1 to 5
      const bilgeCurve = Math.pow(bilgeT, sharpness);
      
      // Blend bilge curve
      const blendFactor = smoothstep(bilgePos - chineWidth, bilgePos + chineWidth, s);
      t = t * (1 - blendFactor * 0.3) + bilgeCurve * blendFactor * 0.3;
    }
    
    // === 4. Flare/Tumblehome ===
    // Adjust upper body angle
    if (s > 0.5) {
      const upperS = (s - 0.5) / 0.5; // 0 to 1 in upper half
      const flareFactor = p.flare * 0.2;
      t = t + upperS * flareFactor;
    }
    
    // === 5. Rail rounding ===
    // Smooth transition at rail
    if (s > 0.85) {
      const railS = (s - 0.85) / 0.15;
      const railCurve = 1 - Math.pow(1 - railS, 2) * p.railRadius;
      t = t * (1 - railS * 0.1) + railCurve * railS * 0.1;
    }
    
    // Ensure t is in valid range
    return Math.max(0, Math.min(1, t));
  }
};

// Section law for car bodies
export const carSectionLaw: SectionLaw = {
  F(s: number, p: SectionParams): number {
    s = Math.max(0, Math.min(1, s));
    
    // Cars have more rectangular sections
    // Bottom is flat, sides are vertical/angled, top rounds over
    
    // Flat bottom region
    if (s < 0.1) {
      return 0;
    }
    
    // Side walls (mostly vertical)
    if (s < 0.9) {
      const sideT = (s - 0.1) / 0.8;
      const flareFactor = 1 + p.flare * 0.3;
      return 0.1 + sideT * 0.8 * flareFactor;
    }
    
    // Roof rounding
    const roofT = (s - 0.9) / 0.1;
    const roofCurve = 1 - Math.pow(1 - roofT, 2) * p.railRadius;
    return 0.9 + roofCurve * 0.1;
  }
};

// Get section params for boat at station u
export function getBoatSectionParams(u: number): SectionParams {
  // Vary section shape along length
  const base = createDefaultSectionParams();
  
  // Stern is flatter
  if (u < 0.2) {
    const t = u / 0.2;
    return lerpSectionParams(
      { ...base, vDepth: 0.1, bilgeRadius: 0.2 },
      base,
      t
    );
  }
  
  // Bow is sharper
  if (u > 0.8) {
    const t = (u - 0.8) / 0.2;
    return lerpSectionParams(
      base,
      { ...base, vDepth: 0.6, bilgeRadius: 0.6, chineSharpness: 0.5 },
      t
    );
  }
  
  return base;
}
