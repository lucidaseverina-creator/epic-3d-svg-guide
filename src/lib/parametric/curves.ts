// ============================================
// CURVE SYSTEM - Curve1D Implementation
// Bezier spline curves for B(u), K(u), D(u)
// ============================================

import { Curve1D, CurveKnot, BezierCurve1D } from '@/types/parametric';

// Clamp value to range
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Cubic Bezier interpolation between two points
function cubicBezier(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  
  return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3;
}

// Cubic Bezier derivative
function cubicBezierDeriv(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  
  return 3 * mt2 * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t2 * (p3 - p2);
}

// Create a Bezier curve from knots
export function createBezierCurve(id: string, knots: CurveKnot[]): BezierCurve1D {
  // Sort knots by u
  const sortedKnots = [...knots].sort((a, b) => a.u - b.u);
  
  // Ensure we have at least 2 knots
  if (sortedKnots.length < 2) {
    throw new Error('Curve must have at least 2 knots');
  }
  
  const eval_ = (u: number): number => {
    u = clamp(u, 0, 1);
    
    // Find the segment containing u
    let segmentIndex = 0;
    for (let i = 0; i < sortedKnots.length - 1; i++) {
      if (u >= sortedKnots[i].u && u <= sortedKnots[i + 1].u) {
        segmentIndex = i;
        break;
      }
    }
    
    const k0 = sortedKnots[segmentIndex];
    const k1 = sortedKnots[segmentIndex + 1];
    
    // Normalize t within segment
    const segmentLength = k1.u - k0.u;
    const t = segmentLength > 0 ? (u - k0.u) / segmentLength : 0;
    
    // Control points for cubic Bezier
    const p0 = k0.value;
    const p3 = k1.value;
    
    // Handle out from k0, handle in to k1
    const handleOut = k0.handleOut ?? (k1.value - k0.value) / 3;
    const handleIn = k1.handleIn ?? (k1.value - k0.value) / 3;
    
    const p1 = p0 + handleOut;
    const p2 = p3 - handleIn;
    
    return cubicBezier(p0, p1, p2, p3, t);
  };
  
  const deriv = (u: number): number => {
    u = clamp(u, 0, 1);
    
    // Find the segment containing u
    let segmentIndex = 0;
    for (let i = 0; i < sortedKnots.length - 1; i++) {
      if (u >= sortedKnots[i].u && u <= sortedKnots[i + 1].u) {
        segmentIndex = i;
        break;
      }
    }
    
    const k0 = sortedKnots[segmentIndex];
    const k1 = sortedKnots[segmentIndex + 1];
    
    const segmentLength = k1.u - k0.u;
    const t = segmentLength > 0 ? (u - k0.u) / segmentLength : 0;
    
    const p0 = k0.value;
    const p3 = k1.value;
    const handleOut = k0.handleOut ?? (k1.value - k0.value) / 3;
    const handleIn = k1.handleIn ?? (k1.value - k0.value) / 3;
    const p1 = p0 + handleOut;
    const p2 = p3 - handleIn;
    
    // Scale derivative by segment length
    const rawDeriv = cubicBezierDeriv(p0, p1, p2, p3, t);
    return segmentLength > 0 ? rawDeriv / segmentLength : 0;
  };
  
  return {
    id,
    type: 'bezier',
    knots: sortedKnots,
    eval: eval_,
    deriv,
  };
}

// Create a linear interpolation curve
export function createLinearCurve(id: string, knots: CurveKnot[]): Curve1D {
  const sortedKnots = [...knots].sort((a, b) => a.u - b.u);
  
  if (sortedKnots.length < 2) {
    throw new Error('Curve must have at least 2 knots');
  }
  
  const eval_ = (u: number): number => {
    u = clamp(u, 0, 1);
    
    // Find surrounding knots
    for (let i = 0; i < sortedKnots.length - 1; i++) {
      if (u >= sortedKnots[i].u && u <= sortedKnots[i + 1].u) {
        const k0 = sortedKnots[i];
        const k1 = sortedKnots[i + 1];
        const t = (u - k0.u) / (k1.u - k0.u);
        return k0.value + t * (k1.value - k0.value);
      }
    }
    
    return sortedKnots[sortedKnots.length - 1].value;
  };
  
  return {
    id,
    knots: sortedKnots,
    eval: eval_,
  };
}

// Update a knot value in a curve
export function updateCurveKnot(
  curve: Curve1D,
  knotIndex: number,
  updates: Partial<CurveKnot>
): Curve1D {
  const newKnots = curve.knots.map((knot, i) =>
    i === knotIndex ? { ...knot, ...updates } : knot
  );
  
  if ('type' in curve && (curve as BezierCurve1D).type === 'bezier') {
    return createBezierCurve(curve.id, newKnots);
  }
  return createLinearCurve(curve.id, newKnots);
}

// Add a knot to a curve
export function addCurveKnot(
  curve: Curve1D,
  u: number,
  value?: number
): Curve1D {
  // If no value provided, evaluate curve at u
  const knotValue = value ?? curve.eval(u);
  
  const newKnot: CurveKnot = { u, value: knotValue };
  const newKnots = [...curve.knots, newKnot].sort((a, b) => a.u - b.u);
  
  if ('type' in curve && (curve as BezierCurve1D).type === 'bezier') {
    return createBezierCurve(curve.id, newKnots);
  }
  return createLinearCurve(curve.id, newKnots);
}

// Remove a knot from a curve (maintain minimum 2 knots)
export function removeCurveKnot(
  curve: Curve1D,
  knotIndex: number
): Curve1D {
  if (curve.knots.length <= 2) {
    return curve; // Can't remove - need at least 2 knots
  }
  
  const newKnots = curve.knots.filter((_, i) => i !== knotIndex);
  
  if ('type' in curve && (curve as BezierCurve1D).type === 'bezier') {
    return createBezierCurve(curve.id, newKnots);
  }
  return createLinearCurve(curve.id, newKnots);
}

// Sample curve at N points
export function sampleCurve(curve: Curve1D, n: number): number[] {
  const samples: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    samples.push(curve.eval(u));
  }
  return samples;
}

// Compute curve fairness (second derivative energy)
export function computeCurveFairness(curve: Curve1D, samples: number = 50): number {
  const values = sampleCurve(curve, samples);
  let energy = 0;
  
  for (let i = 1; i < values.length - 1; i++) {
    const secondDeriv = values[i + 1] - 2 * values[i] + values[i - 1];
    energy += secondDeriv * secondDeriv;
  }
  
  return energy;
}

// Create default B/K/D curves for boat hull
export function createDefaultBoatCurves(): { B: BezierCurve1D; K: BezierCurve1D; D: BezierCurve1D } {
  // B(u) - Half beam curve (widest at mid, tapering to bow/stern)
  const B = createBezierCurve('B', [
    { u: 0, value: 0.3, handleOut: 0.15 },      // Transom (stern)
    { u: 0.2, value: 0.9, handleIn: 0.1, handleOut: 0.1 },
    { u: 0.5, value: 1.0, handleIn: 0.05, handleOut: -0.05 }, // Max beam
    { u: 0.8, value: 0.7, handleIn: -0.1, handleOut: -0.2 },
    { u: 1, value: 0.05, handleIn: -0.2 },      // Bow point
  ]);
  
  // K(u) - Keel/rocker curve (bottom profile)
  const K = createBezierCurve('K', [
    { u: 0, value: -0.1, handleOut: 0 },        // Stern
    { u: 0.3, value: -0.15, handleIn: -0.02, handleOut: -0.02 },
    { u: 0.7, value: -0.1, handleIn: 0, handleOut: 0.05 },
    { u: 1, value: 0.1, handleIn: 0.1 },        // Bow (lifted)
  ]);
  
  // D(u) - Deck/sheer curve (top profile)
  const D = createBezierCurve('D', [
    { u: 0, value: 0.3, handleOut: 0.02 },      // Transom height
    { u: 0.3, value: 0.25, handleIn: -0.02, handleOut: 0 },
    { u: 0.7, value: 0.3, handleIn: 0, handleOut: 0.05 },
    { u: 1, value: 0.5, handleIn: 0.1 },        // Bow (higher)
  ]);
  
  return { B, K, D };
}

// Create default curves for car body
export function createDefaultCarCurves(): { B: BezierCurve1D; K: BezierCurve1D; D: BezierCurve1D } {
  const B = createBezierCurve('B', [
    { u: 0, value: 0.85, handleOut: 0.05 },     // Rear
    { u: 0.3, value: 0.95, handleIn: 0.03, handleOut: 0.02 },
    { u: 0.7, value: 0.95, handleIn: 0.02, handleOut: -0.03 },
    { u: 1, value: 0.8, handleIn: -0.05 },      // Front
  ]);
  
  const K = createBezierCurve('K', [
    { u: 0, value: 0, handleOut: 0 },
    { u: 1, value: 0, handleIn: 0 },
  ]);
  
  const D = createBezierCurve('D', [
    { u: 0, value: 0.4, handleOut: 0.1 },       // Trunk
    { u: 0.25, value: 0.5, handleIn: 0.05, handleOut: 0.1 },
    { u: 0.4, value: 0.8, handleIn: 0.1, handleOut: 0.05 }, // Roof peak
    { u: 0.6, value: 0.8, handleIn: 0.02, handleOut: -0.1 },
    { u: 0.85, value: 0.45, handleIn: -0.1, handleOut: -0.05 },
    { u: 1, value: 0.35, handleIn: -0.03 },     // Hood
  ]);
  
  return { B, K, D };
}
