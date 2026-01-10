// ============================================
// PARAMETRIC ENGINE LAYOUT - Main UI with Boolean Panel
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { useParametricEngine } from '@/hooks/useParametricEngine';
import { CurveEditor } from './CurveEditor';
import { ParametricProperties } from './ParametricProperties';
import { BooleanPanel, SDFNode, SDFPrimitiveType, BooleanOp } from './BooleanPanel';
import { Viewport } from '@/components/engine/Viewport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewAxis, FeatureNodeContract } from '@/types/parametric';
import { Face, ProjectedFace } from '@/types/engine';
import { rotateEuler, project, add, calculateNormal, dot, normalize } from '@/lib/math';
import { Box, FileDown, Plus, RotateCcw, Eye, Grid3X3, Layers, Settings } from 'lucide-react';

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
  const [cameraRotation, setCameraRotation] = useState({ x: 0.3, y: -0.4, z: 0 });
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 400 });
  
  // Active panel
  const [activePanel, setActivePanel] = useState<'parametric' | 'boolean'>('parametric');
  
  // SDF Boolean nodes state
  const [sdfNodes, setSdfNodes] = useState<SDFNode[]>([]);
  const [selectedSdfNodeId, setSelectedSdfNodeId] = useState<string | null>(null);
  
  // SDF Node handlers
  const handleAddSdfNode = useCallback((type: SDFPrimitiveType) => {
    const id = `sdf_${Date.now()}`;
    const newNode: SDFNode = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${sdfNodes.length + 1}`,
      type,
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
      visible: true,
      locked: false,
      primitiveParams: {
        radius: type === 'sphere' ? 1 : 0.5,
        majorRadius: type === 'torus' ? 1 : undefined,
        minorRadius: type === 'torus' ? 0.3 : undefined,
        height: type === 'cylinder' || type === 'capsule' ? 2 : undefined,
      },
    };
    setSdfNodes(prev => [...prev, newNode]);
    setSelectedSdfNodeId(id);
  }, [sdfNodes.length]);
  
  const handleUpdateSdfNode = useCallback((id: string, updates: Partial<SDFNode>) => {
    setSdfNodes(prev => prev.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  }, []);
  
  const handleDeleteSdfNode = useCallback((id: string) => {
    setSdfNodes(prev => prev.filter(node => node.id !== id));
    if (selectedSdfNodeId === id) {
      setSelectedSdfNodeId(null);
    }
  }, [selectedSdfNodeId]);
  
  const handleDuplicateSdfNode = useCallback((id: string) => {
    const node = sdfNodes.find(n => n.id === id);
    if (!node) return;
    
    const newId = `sdf_${Date.now()}`;
    const newNode: SDFNode = {
      ...node,
      id: newId,
      name: `${node.name} Copy`,
      position: {
        x: node.position.x + 0.5,
        y: node.position.y,
        z: node.position.z,
      },
    };
    setSdfNodes(prev => [...prev, newNode]);
    setSelectedSdfNodeId(newId);
  }, [sdfNodes]);
  
  const handleCreateBoolean = useCallback((operation: BooleanOp, operandA: string, operandB: string) => {
    const nodeA = sdfNodes.find(n => n.id === operandA);
    const nodeB = sdfNodes.find(n => n.id === operandB);
    if (!nodeA || !nodeB) return;
    
    const id = `bool_${Date.now()}`;
    const newNode: SDFNode = {
      id,
      name: `${nodeA.name} ${operation} ${nodeB.name}`,
      type: 'boolean',
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
      visible: true,
      locked: false,
      booleanParams: {
        operation,
        operandA,
        operandB,
        smoothness: operation.startsWith('smooth') ? 0.5 : 0,
      },
    };
    setSdfNodes(prev => [...prev, newNode]);
    setSelectedSdfNodeId(id);
  }, [sdfNodes]);
  
  // Feature handlers
  const handleAddFeature = useCallback((feature: FeatureNodeContract) => {
    dispatch({ type: 'ADD_FEATURE', feature });
  }, [dispatch]);
  
  const handleDeleteFeature = useCallback((featureId: string) => {
    dispatch({ type: 'REMOVE_FEATURE', featureId });
  }, [dispatch]);
  
  // Project mesh faces for viewport
  const projectedFaces = React.useMemo((): ProjectedFace[] => {
    if (!meshFaces.length) return [];
    
    const width = 800;
    const height = 600;
    const fov = 800;
    const scale = spec?.baseForm.L ? 80 / spec.baseForm.L : 20;
    
    const lightDir = normalize({ x: 0.5, y: 1, z: 0.5 });
    
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
      const diffuse = Math.max(0, dot(normal, lightDir));
      const lightIntensity = 0.3 + 0.7 * diffuse;
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
      {/* Left Panel - Mode Tabs */}
      <div className="w-80 border-r border-border/30 bg-panel/50 flex flex-col">
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">ModelMaker</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={initializeWithDefault}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Panel Mode Tabs */}
        <div className="border-b border-border/30">
          <div className="flex">
            <button
              className={`flex-1 p-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 ${
                activePanel === 'parametric' 
                  ? 'border-primary text-primary bg-primary/10' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActivePanel('parametric')}
            >
              <Settings className="w-3.5 h-3.5" />
              Parametric
            </button>
            <button
              className={`flex-1 p-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 ${
                activePanel === 'boolean' 
                  ? 'border-primary text-primary bg-primary/10' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActivePanel('boolean')}
            >
              <Layers className="w-3.5 h-3.5" />
              Boolean SDF
            </button>
          </div>
        </div>
        
        {/* Panel Content */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'parametric' ? (
            <ParametricProperties
              spec={spec}
              selectedFeatureId={state.selectedFeatureId}
              onUpdateLength={updateLength}
              onUpdateResolution={updateResolution}
              onToggleFeature={toggleFeature}
              onSelectFeature={(id) => dispatch({ type: 'SELECT_FEATURE', featureId: id })}
              onUpdateFeature={(id, updates) => dispatch({ type: 'UPDATE_FEATURE', featureId: id, updates })}
              onAddFeature={handleAddFeature}
              onDeleteFeature={handleDeleteFeature}
            />
          ) : (
            <BooleanPanel
              nodes={sdfNodes}
              selectedNodeId={selectedSdfNodeId}
              onSelectNode={setSelectedSdfNodeId}
              onAddNode={handleAddSdfNode}
              onUpdateNode={handleUpdateSdfNode}
              onDeleteNode={handleDeleteSdfNode}
              onDuplicateNode={handleDuplicateSdfNode}
              onCreateBoolean={handleCreateBoolean}
            />
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-12 border-b border-border/30 bg-panel/30 flex items-center px-4 gap-4">
          <span className="text-sm font-medium text-primary">{spec?.name || 'Untitled'}</span>
          <div className="text-xs text-muted-foreground">
            {activePanel === 'boolean' && sdfNodes.length > 0 && (
              <span>{sdfNodes.length} SDF objects</span>
            )}
          </div>
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
              {activePanel === 'boolean' && <div>SDF Nodes: {sdfNodes.length}</div>}
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
