// ============================================
// REFERENCE PACK SYSTEM - Ortho Image Calibration
// ============================================

import { ReferencePack, ViewDef, ViewCal, ViewAxis, Px, Vec2 } from '@/types/parametric';

// ============= PIXEL TO METER CONVERSION =============

export function pxToMeters(px: Px, cal: ViewCal): Vec2 {
  const mpp = 1 / cal.pxPerMeter;
  const x = (px[0] - cal.originPx[0]) * mpp;
  const z = (px[1] - cal.originPx[1]) * mpp;
  return { x, z };
}

export function metersToPx(meters: Vec2, cal: ViewCal): Px {
  return [
    meters.x * cal.pxPerMeter + cal.originPx[0],
    meters.z * cal.pxPerMeter + cal.originPx[1],
  ];
}

// ============= CENTERLINE ALIGNMENT =============

export function centerlineAngle(cal: ViewCal): number {
  const [a, b] = cal.centerlinePx;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.atan2(dy, dx);
}

export function computePlaneTransform(view: ViewDef): {
  rotZ: number;
  scale: number;
  offsetX: number;
  offsetY: number;
} {
  const theta = centerlineAngle(view.cal);
  const rotZ = -theta;
  const scale = 1 / view.cal.pxPerMeter;
  
  return {
    rotZ,
    scale,
    offsetX: -view.cal.originPx[0] * scale,
    offsetY: -view.cal.originPx[1] * scale,
  };
}

// ============= VIEW AXIS MAPPING =============

// Convert local plane coordinates to world coordinates
export function planeToWorld(
  u: number,
  v: number,
  axis: ViewAxis
): { x: number; y: number; z: number } {
  switch (axis) {
    case 'TOP':
      return { x: u, y: 0, z: -v };
    case 'SIDE':
      return { x: u, y: -v, z: 0 };
    case 'FRONT':
      return { x: 0, y: -v, z: u };
    case 'REAR':
      return { x: 0, y: -v, z: -u };
  }
}

// Convert world coordinates to local plane coordinates
export function worldToPlane(
  pos: { x: number; y: number; z: number },
  axis: ViewAxis
): { u: number; v: number } {
  switch (axis) {
    case 'TOP':
      return { u: pos.x, v: -pos.z };
    case 'SIDE':
      return { u: pos.x, v: -pos.y };
    case 'FRONT':
      return { u: pos.z, v: -pos.y };
    case 'REAR':
      return { u: -pos.z, v: -pos.y };
  }
}

// ============= REFERENCE PACK FACTORY =============

export function createEmptyReferencePack(id: string, name: string): ReferencePack {
  return {
    id,
    name,
    units: 'meter',
    notes: '',
    views: {},
  };
}

export function createViewDef(
  imageUrl: string,
  axis: ViewAxis,
  imageWidth: number,
  imageHeight: number
): ViewDef {
  // Default calibration (1m = 100px, centered origin)
  const pxPerMeter = 100;
  
  return {
    imageUrl,
    axis,
    cal: {
      pxPerMeter,
      originPx: [imageWidth / 2, imageHeight / 2],
      centerlinePx: [
        [imageWidth * 0.1, imageHeight / 2],
        [imageWidth * 0.9, imageHeight / 2],
      ],
      anchorA_Px: [imageWidth * 0.1, imageHeight / 2],
      anchorB_Px: [imageWidth * 0.9, imageHeight / 2],
    },
    opacity: 0.55,
    visible: true,
  };
}

// ============= CALIBRATION HELPERS =============

// Compute pxPerMeter from scale bar
export function computeScaleFromBar(
  barStartPx: Px,
  barEndPx: Px,
  barLengthMeters: number
): number {
  const dx = barEndPx[0] - barStartPx[0];
  const dy = barEndPx[1] - barStartPx[1];
  const pixelLength = Math.sqrt(dx * dx + dy * dy);
  return pixelLength / barLengthMeters;
}

// Validate calibration
export function validateCalibration(cal: ViewCal): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (cal.pxPerMeter <= 0) {
    errors.push('pxPerMeter must be positive');
  }
  
  if (cal.centerlinePx[0][0] === cal.centerlinePx[1][0] &&
      cal.centerlinePx[0][1] === cal.centerlinePx[1][1]) {
    errors.push('Centerline points must be different');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============= DEMO REFERENCE PACK =============

export function createDemoReferencePack(): ReferencePack {
  return {
    id: 'demo-boat',
    name: 'Demo Boat',
    units: 'meter',
    notes: 'Demo reference pack for testing',
    views: {
      top: {
        imageUrl: '/placeholder.svg',
        axis: 'TOP',
        cal: {
          pxPerMeter: 100,
          originPx: [200, 150],
          centerlinePx: [[50, 150], [350, 150]],
          anchorA_Px: [350, 150],
          anchorB_Px: [50, 150],
        },
        opacity: 0.5,
        visible: true,
      },
      side: {
        imageUrl: '/placeholder.svg',
        axis: 'SIDE',
        cal: {
          pxPerMeter: 100,
          originPx: [200, 100],
          centerlinePx: [[50, 100], [350, 100]],
          anchorA_Px: [350, 100],
          anchorB_Px: [50, 100],
        },
        opacity: 0.5,
        visible: true,
      },
    },
  };
}
