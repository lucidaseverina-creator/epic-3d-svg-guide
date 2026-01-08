// ============================================
// PARAMETRIC ENGINE LAYOUT - Main UI
// ============================================

import React, { useEffect } from 'react';
import { useParametricEngine } from '@/hooks/useParametricEngine';
import { CurveEditor } from './CurveEditor';
import { ParametricProperties } from './ParametricProperties';
import { Viewport } from '@/components/engine/Viewport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewAxis, Face, ProjectedFace } from '@/types/parametric';
import { rotateEuler, project, add, calculateNormal, calculateLighting } from '@/lib/math';
import { Box, FileDown, Plus, RotateCcw, Eye, Grid3X3 } from 'lucide-react';

export const ParametricLayout: React.FC = () => {
  const {
    state,
    spec,
    meshFaces,
    dispatch,
    initializeWithDefault,
    updateLength,
    updateResolution,
    toggleFeature,
  } = useParametricEngine();
  
  // Initialize on mount
  useEffect(() => {
    initializeWithDefault();
  }, [initializeWithDefault]);
  
  // Camera state
  const [cameraRotation, setCameraRotation] = React.useState({ x: 0.3, y: -0.4, z: 0 });
  const [cameraPosition, setCameraPosition] = React.useState({ x: 0, y: 0, z: 400 });
  
  // Project mesh faces for viewport
  const projectedFaces = React.useMemo((): ProjectedFace[] => {
    if (!meshFaces.length) return [];
    
    const width = 800;
    const height = 600;
    const fov = 800;
    const scale = spec?.baseForm.L ? 80 / spec.baseForm.L : 20;
    
    const lights = [
      { type: 'ambient' as const, color: '#ffffff', intensity: 0.3 },
      { type: 'directional' as const, color: '#00ffff', intensity: 0.7, direction: { x: 0.5, y: 1, z: 0.5 } },
    ];
    
    return meshFaces.map((face, i) => {
      // Scale vertices
      const scaledVerts = face.verts.map(v => ({
        x: v.x * scale,
        y: v.y * scale,
        z: v.z * scale,
      }));
      
      // Rotate and project
      const rotatedVerts = scaledVerts.map(v => {
        const offset = add(v, { x: -cameraPosition.x, y: -cameraPosition.y, z: 0 });
        return rotateEuler(offset, cameraRotation);
      });
      
      const projectedVerts = rotatedVerts.map(v => 
        project(v, width, height, fov, cameraPosition.z)
      );
      
      // Calculate depth and lighting
      const center = {
        x: rotatedVerts.reduce((s, v) => s + v.x, 0) / 3,
        y: rotatedVerts.reduce((s, v) => s + v.y, 0) / 3,
        z: rotatedVerts.reduce((s, v) => s + v.z, 0) / 3,
      };
      
      const normal = face.normal || calculateNormal(rotatedVerts);
      const lightIntensity = calculateLighting(normal, lights);
      
      return {
        verts: scaledVerts,
        projectedVerts,
        depth: center.z + cameraPosition.z,
        color: face.color,
        lightIntensity,
      };
    }).filter(f => f.depth > 50);
  }, [meshFaces, cameraRotation, cameraPosition, spec]);
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Panel - Properties */}
      <div className="w-72 border-r border-border/30 bg-panel/50 flex flex-col">
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">ModelMaker</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={initializeWithDefault}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        <ParametricProperties
          spec={spec}
          selectedFeatureId={state.selectedFeatureId}
          onUpdateLength={updateLength}
          onUpdateResolution={updateResolution}
          onToggleFeature={toggleFeature}
          onSelectFeature={(id) => dispatch({ type: 'SELECT_FEATURE', featureId: id })}
          onUpdateFeature={(id, updates) => dispatch({ type: 'UPDATE_FEATURE', featureId: id, updates })}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-12 border-b border-border/30 bg-panel/30 flex items-center px-4 gap-4">
          <span className="text-sm font-medium text-primary">{spec?.name || 'Untitled'}</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 gap-1">
            <FileDown className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
        
        {/* Viewport + Curve Editor */}
        <div className="flex-1 flex">
          {/* 3D Viewport */}
          <div className="flex-1 relative">
            <Viewport
              projectedFaces={projectedFaces}
              cameraRotation={cameraRotation}
              cameraPosition={cameraPosition}
              cameraFov={800}
              gridVisible={true}
              onCameraRotate={setCameraRotation}
              onCameraZoom={(delta) => setCameraPosition(p => ({ ...p, z: Math.max(100, Math.min(1000, p.z + delta)) }))}
            />
            
            {/* Stats overlay */}
            <div className="absolute bottom-4 left-4 bg-panel/80 backdrop-blur-sm rounded-md p-2 text-xs font-mono text-primary">
              <div>Faces: {projectedFaces.length}</div>
              <div>L: {spec?.baseForm.L.toFixed(1)}m</div>
            </div>
          </div>
          
          {/* Curve Editor Panel */}
          <div className="w-96 border-l border-border/30 bg-panel/30 flex flex-col">
            <Tabs defaultValue="side" className="flex-1 flex flex-col">
              <TabsList className="mx-2 mt-2">
                <TabsTrigger value="side" className="text-xs">Side View</TabsTrigger>
                <TabsTrigger value="top" className="text-xs">Top View</TabsTrigger>
              </TabsList>
              
              {spec && (
                <>
                  <TabsContent value="side" className="flex-1 p-2">
                    <CurveEditor
                      curves={{
                        B: spec.baseForm.B,
                        K: spec.baseForm.K,
                        D: spec.baseForm.D,
                      }}
                      view="SIDE"
                      width={380}
                      height={300}
                      length={spec.baseForm.L}
                      selectedCurve={state.selectedCurve}
                      selectedKnotIndex={state.selectedKnotIndex}
                      onSelectCurve={(c) => dispatch({ type: 'SELECT_CURVE', curve: c })}
                      onSelectKnot={(i) => dispatch({ type: 'SELECT_KNOT', knotIndex: i })}
                      onUpdateKnot={(curve, index, value) => dispatch({
                        type: 'UPDATE_CURVE_KNOT',
                        curve,
                        knotIndex: index,
                        value,
                      })}
                    />
                  </TabsContent>
                  <TabsContent value="top" className="flex-1 p-2">
                    <CurveEditor
                      curves={{
                        B: spec.baseForm.B,
                        K: spec.baseForm.K,
                        D: spec.baseForm.D,
                      }}
                      view="TOP"
                      width={380}
                      height={300}
                      length={spec.baseForm.L}
                      selectedCurve={state.selectedCurve}
                      selectedKnotIndex={state.selectedKnotIndex}
                      onSelectCurve={(c) => dispatch({ type: 'SELECT_CURVE', curve: c })}
                      onSelectKnot={(i) => dispatch({ type: 'SELECT_KNOT', knotIndex: i })}
                      onUpdateKnot={(curve, index, value) => dispatch({
                        type: 'UPDATE_CURVE_KNOT',
                        curve,
                        knotIndex: index,
                        value,
                      })}
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
