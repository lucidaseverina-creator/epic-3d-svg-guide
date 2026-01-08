// ============================================
// SVG CURVE EDITOR - Ortho View Curve Editor
// ============================================

import React, { useMemo, useCallback, useState } from 'react';
import { Curve1D, ViewAxis, Vec2, CurveKnot } from '@/types/parametric';
import { sampleCurve } from '@/lib/parametric/curves';

interface CurveEditorProps {
  curves: {
    B: Curve1D;
    K: Curve1D;
    D: Curve1D;
  };
  view: ViewAxis;
  width: number;
  height: number;
  length: number;
  selectedCurve: 'B' | 'K' | 'D' | null;
  selectedKnotIndex: number | null;
  onSelectCurve: (curve: 'B' | 'K' | 'D' | null) => void;
  onSelectKnot: (index: number | null) => void;
  onUpdateKnot: (curve: 'B' | 'K' | 'D', index: number, value: number) => void;
}

// Scale factor for display
const SCALE = 100;
const PADDING = 40;

export const CurveEditor: React.FC<CurveEditorProps> = ({
  curves,
  view,
  width,
  height,
  length,
  selectedCurve,
  selectedKnotIndex,
  onSelectCurve,
  onSelectKnot,
  onUpdateKnot,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Transform u to x coordinate
  const uToX = useCallback((u: number) => {
    return PADDING + u * (width - 2 * PADDING);
  }, [width]);
  
  // Transform value to y coordinate
  const valueToY = useCallback((value: number) => {
    // Center at middle, scale by SCALE
    return height / 2 - value * SCALE;
  }, [height]);
  
  // Transform y to value
  const yToValue = useCallback((y: number) => {
    return (height / 2 - y) / SCALE;
  }, [height]);
  
  // Sample curves for display
  const curvePaths = useMemo(() => {
    const samples = 64;
    
    const sampleToPath = (curve: Curve1D, yOffset: number = 0) => {
      const points: string[] = [];
      for (let i = 0; i <= samples; i++) {
        const u = i / samples;
        const value = curve.eval(u) + yOffset;
        const x = uToX(u);
        const y = valueToY(value);
        points.push(`${x},${y}`);
      }
      return `M ${points.join(' L ')}`;
    };
    
    // For side view, show K and D directly
    // For top view, show B (half-beam)
    if (view === 'SIDE') {
      return {
        K: sampleToPath(curves.K),
        D: sampleToPath(curves.D),
      };
    } else {
      return {
        B: sampleToPath(curves.B),
        B_mirror: sampleToPath(curves.B).replace(/(\d+\.?\d*),(\d+\.?\d*)/g, (_, x, y) => {
          return `${x},${height - parseFloat(y) + height / 2 - valueToY(0)}`;
        }),
      };
    }
  }, [curves, view, uToX, valueToY, height]);
  
  // Get knots for current view
  const visibleKnots = useMemo(() => {
    if (view === 'SIDE') {
      return [
        { curve: 'K' as const, knots: curves.K.knots, color: 'hsl(var(--axis-y))' },
        { curve: 'D' as const, knots: curves.D.knots, color: 'hsl(var(--accent))' },
      ];
    } else {
      return [
        { curve: 'B' as const, knots: curves.B.knots, color: 'hsl(var(--axis-z))' },
      ];
    }
  }, [curves, view]);
  
  // Handle knot drag
  const handleKnotMouseDown = useCallback((
    curve: 'B' | 'K' | 'D',
    index: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onSelectCurve(curve);
    onSelectKnot(index);
    setIsDragging(true);
  }, [onSelectCurve, onSelectKnot]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || selectedCurve === null || selectedKnotIndex === null) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newValue = yToValue(y);
    
    onUpdateKnot(selectedCurve, selectedKnotIndex, newValue);
  }, [isDragging, selectedCurve, selectedKnotIndex, yToValue, onUpdateKnot]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Curve colors
  const curveColors = {
    B: 'hsl(var(--axis-z))',
    K: 'hsl(var(--axis-y))',
    D: 'hsl(var(--accent))',
  };
  
  return (
    <svg
      width={width}
      height={height}
      className="bg-background/50 rounded-lg border border-border/30"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity="0.3"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Centerline */}
      <line
        x1={PADDING}
        y1={height / 2}
        x2={width - PADDING}
        y2={height / 2}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.5"
      />
      
      {/* Axis labels */}
      <text x={width / 2} y={height - 10} fill="hsl(var(--muted-foreground))" fontSize="12" textAnchor="middle">
        u (0 → 1)
      </text>
      <text x={15} y={height / 2} fill="hsl(var(--muted-foreground))" fontSize="12" textAnchor="middle" transform={`rotate(-90, 15, ${height / 2})`}>
        value
      </text>
      
      {/* Curve paths */}
      {view === 'SIDE' && (
        <>
          <path
            d={curvePaths.K}
            fill="none"
            stroke={curveColors.K}
            strokeWidth={selectedCurve === 'K' ? 3 : 2}
            opacity={selectedCurve === 'K' ? 1 : 0.7}
            onClick={() => onSelectCurve('K')}
            className="cursor-pointer"
          />
          <path
            d={curvePaths.D}
            fill="none"
            stroke={curveColors.D}
            strokeWidth={selectedCurve === 'D' ? 3 : 2}
            opacity={selectedCurve === 'D' ? 1 : 0.7}
            onClick={() => onSelectCurve('D')}
            className="cursor-pointer"
          />
        </>
      )}
      
      {view === 'TOP' && curvePaths.B && (
        <>
          <path
            d={curvePaths.B}
            fill="none"
            stroke={curveColors.B}
            strokeWidth={selectedCurve === 'B' ? 3 : 2}
            opacity={selectedCurve === 'B' ? 1 : 0.7}
            onClick={() => onSelectCurve('B')}
            className="cursor-pointer"
          />
        </>
      )}
      
      {/* Knot handles */}
      {visibleKnots.map(({ curve, knots, color }) =>
        knots.map((knot, index) => {
          const x = uToX(knot.u);
          const y = valueToY(knot.value);
          const isSelected = selectedCurve === curve && selectedKnotIndex === index;
          
          return (
            <g key={`${curve}-${index}`}>
              {/* Knot handle */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 8 : 6}
                fill={isSelected ? 'hsl(var(--primary))' : color}
                stroke="hsl(var(--background))"
                strokeWidth="2"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleKnotMouseDown(curve, index, e)}
              />
              
              {/* Value label for selected knot */}
              {isSelected && (
                <text
                  x={x + 12}
                  y={y - 8}
                  fill="hsl(var(--foreground))"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  {knot.value.toFixed(2)}
                </text>
              )}
            </g>
          );
        })
      )}
      
      {/* View label */}
      <text x={width - PADDING} y={25} fill="hsl(var(--primary))" fontSize="14" textAnchor="end" fontWeight="bold">
        {view} VIEW
      </text>
      
      {/* Curve legend */}
      <g transform={`translate(${PADDING}, 20)`}>
        {view === 'SIDE' ? (
          <>
            <circle cx="0" cy="0" r="4" fill={curveColors.K} />
            <text x="10" y="4" fill="hsl(var(--foreground))" fontSize="10">K(u) Keel</text>
            <circle cx="80" cy="0" r="4" fill={curveColors.D} />
            <text x="90" y="4" fill="hsl(var(--foreground))" fontSize="10">D(u) Deck</text>
          </>
        ) : (
          <>
            <circle cx="0" cy="0" r="4" fill={curveColors.B} />
            <text x="10" y="4" fill="hsl(var(--foreground))" fontSize="10">B(u) Half-Beam</text>
          </>
        )}
      </g>
    </svg>
  );
};
