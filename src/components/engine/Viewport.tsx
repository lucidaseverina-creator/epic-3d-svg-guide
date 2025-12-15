import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { ProjectedFace, Vector3, Vector2, ToolType, TransformDelta } from '@/types/engine';
import { rotateEuler, project } from '@/lib/math';

interface ViewportProps {
  projectedFaces: ProjectedFace[];
  selectedObjectId?: string | null;
  activeTool?: ToolType;
  cameraRotation: Vector3;
  cameraPosition: Vector3;
  cameraFov: number;
  gridVisible?: boolean;
  renderMode?: 'solid' | 'wireframe' | 'normals' | 'xray';
  onObjectClick?: (objectId: string | null) => void;
  onCameraRotate?: (rotation: Vector3) => void;
  onCameraPan?: (offset: Vector3) => void;
  onCameraZoom?: (delta: number) => void;
  onObjectTransform?: (objectId: string, transform: TransformDelta) => void;
}

// Generate 3D grid floor lines
const generateGridFloor = (
  size: number,
  divisions: number,
  cameraRotation: Vector3,
  width: number,
  height: number,
  fov: number,
  cameraZ: number
): { lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] } => {
  const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  const step = size / divisions;
  const half = size / 2;
  const gridY = -80; // Grid floor Y position

  for (let i = 0; i <= divisions; i++) {
    const pos = -half + i * step;
    const isMajor = i % 4 === 0;
    const opacity = isMajor ? 0.4 : 0.15;

    // Lines along X axis
    const xStart: Vector3 = { x: -half, y: gridY, z: pos };
    const xEnd: Vector3 = { x: half, y: gridY, z: pos };
    
    const xStartRot = rotateEuler(xStart, cameraRotation);
    const xEndRot = rotateEuler(xEnd, cameraRotation);
    
    const xStartProj = project(xStartRot, width, height, fov, cameraZ);
    const xEndProj = project(xEndRot, width, height, fov, cameraZ);
    
    // Only add if both points are in front of camera
    if (xStartRot.z + cameraZ > 50 && xEndRot.z + cameraZ > 50) {
      lines.push({
        x1: xStartProj.x,
        y1: xStartProj.y,
        x2: xEndProj.x,
        y2: xEndProj.y,
        opacity,
      });
    }

    // Lines along Z axis
    const zStart: Vector3 = { x: pos, y: gridY, z: -half };
    const zEnd: Vector3 = { x: pos, y: gridY, z: half };
    
    const zStartRot = rotateEuler(zStart, cameraRotation);
    const zEndRot = rotateEuler(zEnd, cameraRotation);
    
    const zStartProj = project(zStartRot, width, height, fov, cameraZ);
    const zEndProj = project(zEndRot, width, height, fov, cameraZ);
    
    if (zStartRot.z + cameraZ > 50 && zEndRot.z + cameraZ > 50) {
      lines.push({
        x1: zStartProj.x,
        y1: zStartProj.y,
        x2: zEndProj.x,
        y2: zEndProj.y,
        opacity,
      });
    }
  }

  return { lines };
};

export const Viewport: React.FC<ViewportProps> = ({
  projectedFaces,
  selectedObjectId,
  activeTool = 'select',
  cameraRotation,
  cameraPosition,
  cameraFov,
  gridVisible = true,
  renderMode = 'solid',
  onObjectClick,
  onCameraRotate,
  onCameraPan,
  onCameraZoom,
  onObjectTransform,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [viewportSize, setViewportSize] = useState({ width: 1920, height: 1080 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Resize observer - make viewport fill container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setViewportSize({ width: rect.width, height: rect.height });
        }
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);
  
  // Generate 3D grid floor
  const gridFloor = useMemo(() => {
    if (!gridVisible) return { lines: [] };
    return generateGridFloor(
      600, // size
      24,  // divisions
      cameraRotation,
      viewportSize.width,
      viewportSize.height,
      cameraFov,
      cameraPosition.z
    );
  }, [gridVisible, cameraRotation, viewportSize, cameraFov, cameraPosition.z]);
  
  // Get cursor for active tool
  const getCursor = useCallback(() => {
    if (isDragging) return 'grabbing';
    if (isPanning) return 'move';
    if (isTransforming) {
      if (activeTool === 'move') return 'move';
      if (activeTool === 'rotate') return 'crosshair';
      if (activeTool === 'scale') return 'nwse-resize';
    }
    return 'grab';
  }, [isDragging, isPanning, isTransforming, activeTool]);
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    if (e.button === 0) { // Left click - orbit
      if (activeTool !== 'select' && selectedObjectId) {
        setIsTransforming(true);
      } else {
        setIsDragging(true);
      }
    } else if (e.button === 1 || e.button === 2) { // Middle or Right click - pan
      setIsPanning(true);
    }
  }, [activeTool, selectedObjectId]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    if (isTransforming && selectedObjectId && onObjectTransform) {
      if (activeTool === 'move') {
        const sensitivity = 0.5;
        onObjectTransform(selectedObjectId, {
          position: { x: dx * sensitivity, y: -dy * sensitivity, z: 0 },
        });
      } else if (activeTool === 'rotate') {
        onObjectTransform(selectedObjectId, {
          rotation: { x: dy * 0.01, y: dx * 0.01, z: 0 },
        });
      } else if (activeTool === 'scale') {
        const scaleDelta = 1 + dy * 0.005;
        onObjectTransform(selectedObjectId, {
          scale: { x: scaleDelta, y: scaleDelta, z: scaleDelta },
        });
      }
    } else if (isDragging && onCameraRotate) {
      const newRotation: Vector3 = {
        x: cameraRotation.x + dy * 0.005,
        y: cameraRotation.y + dx * 0.005,
        z: cameraRotation.z,
      };
      newRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, newRotation.x));
      onCameraRotate(newRotation);
    } else if (isPanning && onCameraPan) {
      onCameraPan({ x: -dx * 0.5, y: dy * 0.5, z: 0 });
    }
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [
    lastMousePos, isTransforming, isDragging, isPanning,
    selectedObjectId, activeTool, cameraRotation,
    onObjectTransform, onCameraRotate, onCameraPan,
  ]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
    setIsTransforming(false);
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (onCameraZoom) {
      // Smooth zoom with scroll wheel
      const delta = e.deltaY * 0.5;
      onCameraZoom(delta);
    }
  }, [onCameraZoom]);
  
  const handleFaceClick = useCallback((e: React.MouseEvent, objectId: string) => {
    e.stopPropagation();
    if (activeTool === 'select' && onObjectClick) {
      onObjectClick(objectId === selectedObjectId ? null : objectId);
    }
  }, [activeTool, selectedObjectId, onObjectClick]);
  
  const handleBackgroundClick = useCallback(() => {
    if (activeTool === 'select' && onObjectClick) {
      onObjectClick(null);
    }
  }, [activeTool, onObjectClick]);
  
  // Context menu prevention
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);
  
  // Generate path data for face
  const generatePath = useCallback((face: ProjectedFace): string => {
    if (face.projectedVerts.length === 0) return '';
    
    const first = face.projectedVerts[0];
    let path = `M ${first.x} ${first.y}`;
    
    for (let i = 1; i < face.projectedVerts.length; i++) {
      const v = face.projectedVerts[i];
      path += ` L ${v.x} ${v.y}`;
    }
    
    path += ' Z';
    return path;
  }, []);
  
  // Count unique objects for stats
  const objectCount = useMemo(() => {
    const ids = new Set<string>();
    for (const face of projectedFaces) {
      if (face.objectId) ids.add(face.objectId);
    }
    return ids.size;
  }, [projectedFaces]);
  
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-background"
      onContextMenu={handleContextMenu}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewportSize.width} ${viewportSize.height}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleBackgroundClick}
      >
        {/* SVG Definitions */}
        <defs>
          {/* Selection gradient */}
          <linearGradient id="selectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
            <stop offset="50%" stopColor="hsl(280, 100%, 60%)" />
            <stop offset="100%" stopColor="hsl(330, 81%, 60%)" />
          </linearGradient>
          
          {/* Selection glow filter */}
          <filter id="selectionGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feFlood floodColor="hsl(280, 100%, 60%)" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Grid glow */}
          <filter id="gridGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* 3D Grid Floor */}
        {gridVisible && (
          <g className="grid-floor">
            {gridFloor.lines.map((line, i) => (
              <line
                key={`grid-${i}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="hsl(var(--primary))"
                strokeWidth={1}
                opacity={line.opacity}
                filter="url(#gridGlow)"
              />
            ))}
          </g>
        )}
        
        {/* Render faces in depth-sorted order (painter's algorithm) */}
        {projectedFaces.map((face, index) => {
          const pathData = generatePath(face);
          const objectId = face.objectId || 'unknown';
          
          // Calculate face center for normal visualization
          const centerX = face.projectedVerts.reduce((sum, v) => sum + v.x, 0) / face.projectedVerts.length;
          const centerY = face.projectedVerts.reduce((sum, v) => sum + v.y, 0) / face.projectedVerts.length;
          
          return (
            <g key={index}>
              {/* Main face */}
              {renderMode === 'solid' && (
                <path
                  d={pathData}
                  fill={face.color}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth={0.5}
                  onClick={(e) => handleFaceClick(e, objectId)}
                  style={{ 
                    cursor: activeTool === 'select' ? 'pointer' : getCursor(),
                  }}
                />
              )}
              
              {/* Wireframe mode */}
              {renderMode === 'wireframe' && (
                <path
                  d={pathData}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1}
                  opacity={0.8}
                  onClick={(e) => handleFaceClick(e, objectId)}
                />
              )}
              
              {/* Normals mode - show wireframe + normal indicators */}
              {renderMode === 'normals' && (
                <>
                  <path
                    d={pathData}
                    fill="rgba(0, 255, 255, 0.1)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={0.5}
                    opacity={0.6}
                  />
                  {/* Normal indicator line (pointing toward camera = green) */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={2}
                    fill="hsl(120, 100%, 50%)"
                  />
                </>
              )}
              
              {/* Selection highlight */}
              {face.isSelected && (
                <path
                  d={pathData}
                  fill="none"
                  stroke="url(#selectionGradient)"
                  strokeWidth={3}
                  filter="url(#selectionGlow)"
                  opacity={0.8}
                  pointerEvents="none"
                  className="selection-glow"
                />
              )}
            </g>
          );
        })}
        
        {/* Center axis indicator */}
        <g opacity={0.6}>
          <line
            x1={viewportSize.width / 2 - 40}
            y1={viewportSize.height / 2}
            x2={viewportSize.width / 2 + 40}
            y2={viewportSize.height / 2}
            stroke="hsl(var(--axis-x))"
            strokeWidth={2}
          />
          <line
            x1={viewportSize.width / 2}
            y1={viewportSize.height / 2 - 40}
            x2={viewportSize.width / 2}
            y2={viewportSize.height / 2 + 40}
            stroke="hsl(var(--axis-y))"
            strokeWidth={2}
          />
        </g>
      </svg>
      
      {/* Viewport overlay info */}
      <div className="absolute top-3 left-3 stats-display">
        <div>{viewportSize.width} × {viewportSize.height}</div>
        <div>Objects: {objectCount}</div>
        <div>Faces: {projectedFaces.length}</div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground/50 font-mono">
        <div>Left drag: Orbit • Right drag: Pan • Scroll: Zoom</div>
      </div>
    </div>
  );
};