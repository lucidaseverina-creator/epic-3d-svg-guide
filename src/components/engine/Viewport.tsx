import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { ProjectedFace, Vector3, ToolType, TransformDelta } from '@/types/engine';

interface ViewportProps {
  projectedFaces: ProjectedFace[];
  selectedObjectId?: string | null;
  activeTool?: ToolType;
  cameraRotation: Vector3;
  gridVisible?: boolean;
  onObjectClick?: (objectId: string | null) => void;
  onCameraRotate?: (rotation: Vector3) => void;
  onCameraPan?: (offset: Vector3) => void;
  onCameraZoom?: (delta: number) => void;
  onObjectTransform?: (objectId: string, transform: TransformDelta) => void;
}

export const Viewport: React.FC<ViewportProps> = ({
  projectedFaces,
  selectedObjectId,
  activeTool = 'select',
  cameraRotation,
  gridVisible = true,
  onObjectClick,
  onCameraRotate,
  onCameraPan,
  onCameraZoom,
  onObjectTransform,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Resize observer
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
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  // Get cursor for active tool
  const getCursor = useCallback(() => {
    if (isDragging || isPanning) return 'grabbing';
    if (isTransforming) {
      if (activeTool === 'move') return 'move';
      if (activeTool === 'rotate') return 'crosshair';
      if (activeTool === 'scale') return 'nwse-resize';
    }
    return 'default';
  }, [isDragging, isPanning, isTransforming, activeTool]);
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    if (e.button === 0) { // Left click
      if (activeTool !== 'select' && selectedObjectId) {
        setIsTransforming(true);
      } else {
        setIsDragging(true);
      }
    } else if (e.button === 2) { // Right click
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
      onCameraPan({ x: -dx * 2, y: dy * 2, z: 0 });
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
      const delta = e.deltaY > 0 ? 20 : -20;
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
      className="w-full h-full relative overflow-hidden bg-background"
      onContextMenu={handleContextMenu}
    >
      {/* Grid background */}
      {gridVisible && (
        <div
          className="absolute inset-0 viewport-grid opacity-30"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewportSize.width} ${viewportSize.height}`}
        preserveAspectRatio="none"
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
          
          {/* Drop shadow for depth */}
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        
        {/* Render faces in depth-sorted order (painter's algorithm) */}
        {projectedFaces.map((face, index) => {
          const pathData = generatePath(face);
          const objectId = face.objectId || 'unknown';
          
          return (
            <g key={index}>
              {/* Main face */}
              <path
                d={pathData}
                fill={face.color}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={0.5}
                onClick={(e) => handleFaceClick(e, objectId)}
                style={{ 
                  cursor: activeTool === 'select' ? 'pointer' : getCursor(),
                }}
              />
              
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
            x1={viewportSize.width / 2 - 30}
            y1={viewportSize.height / 2}
            x2={viewportSize.width / 2 + 30}
            y2={viewportSize.height / 2}
            stroke="hsl(var(--axis-x))"
            strokeWidth={2}
          />
          <line
            x1={viewportSize.width / 2}
            y1={viewportSize.height / 2 - 30}
            x2={viewportSize.width / 2}
            y2={viewportSize.height / 2 + 30}
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
    </div>
  );
};
