import React, { useState, useMemo, useCallback } from 'react';
import { EngineType, ToolType, CameraPreset, RenderMode } from '@/types/engine';
import { EffectType } from '@/effects/types';
import { useScene } from '@/hooks/useScene';
import { renderScene, getDefaultConfig } from '@/lib/renderer';

import { TopBar } from '@/components/layout/TopBar';
import { IconBar } from '@/components/layout/IconBar';
import { MiniBar } from '@/components/layout/MiniBar';
import { BottomBar } from '@/components/layout/BottomBar';
import { Timeline } from '@/components/layout/Timeline';
import { Viewport } from '@/components/engine/Viewport';

import { DrawerContainer } from '@/components/drawers/DrawerContainer';
import { ObjectsDrawer } from '@/components/drawers/ObjectsDrawer';
import { LightingDrawer } from '@/components/drawers/LightingDrawer';
import { PropertiesDrawer } from '@/components/drawers/PropertiesDrawer';
import { EffectsPanel } from '@/components/effects/EffectsPanel';
import { EffectsCanvas } from '@/components/effects/EffectsCanvas';

interface EngineLayoutProps {
  engineType?: EngineType;
}

// Default effects state
const defaultEffects: Record<EffectType, { enabled: boolean; intensity: number }> = {
  metaballs: { enabled: false, intensity: 0.7 },
  fluid: { enabled: false, intensity: 0.5 },
  water: { enabled: false, intensity: 0.6 },
  clouds: { enabled: false, intensity: 0.5 },
  godrays: { enabled: false, intensity: 0.5 },
  particles: { enabled: false, intensity: 0.5 },
  fire: { enabled: false, intensity: 0.7 },
  smoke: { enabled: false, intensity: 0.5 },
};

export const EngineLayout: React.FC<EngineLayoutProps> = ({
  engineType: initialEngine = 'classic',
}) => {
  // Engine state
  const [currentEngine, setCurrentEngine] = useState<EngineType>(initialEngine);
  
  // Tool state
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  
  // Drawer state
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  
  // Viewport state
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [showStats, setShowStats] = useState(false);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  
  // Effects state
  const [effects, setEffects] = useState(defaultEffects);
  
  // Animation state
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Scene state from hook
  const {
    scene,
    selectedObject,
    selectObject,
    addObject,
    updateObject,
    applyTransform,
    deleteObject,
    rotateCamera,
    panCamera,
    zoomCamera,
    toggleGrid,
    setLightingMode,
    resetCamera,
  } = useScene();
  
  // Render config
  const config = useMemo(() => getDefaultConfig(), []);

  // Actual viewport size (reported by <Viewport />)
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 700 });

  // Render the scene
  const projectedFaces = useMemo(() => {
    return renderScene(scene, config, viewportSize.width, viewportSize.height);
  }, [scene, config, viewportSize]);
  
  // Handle drawer toggle
  const handleDrawerToggle = useCallback((drawerId: string) => {
    setActiveDrawer(prev => prev === drawerId ? null : drawerId);
  }, []);
  
  // Handle visibility toggle
  const handleToggleVisibility = useCallback((id: string) => {
    const obj = scene.objects.find(o => o.id === id);
    if (obj) {
      updateObject(id, { visible: !obj.visible });
    }
  }, [scene.objects, updateObject]);
  
  // Handle lock toggle
  const handleToggleLock = useCallback((id: string) => {
    const obj = scene.objects.find(o => o.id === id);
    if (obj) {
      updateObject(id, { locked: !obj.locked });
    }
  }, [scene.objects, updateObject]);
  
  // Effects handlers
  const handleToggleEffect = useCallback((effectType: EffectType) => {
    setEffects(prev => ({
      ...prev,
      [effectType]: {
        ...prev[effectType],
        enabled: !prev[effectType].enabled,
      },
    }));
  }, []);
  
  const handleEffectIntensity = useCallback((effectType: EffectType, intensity: number) => {
    setEffects(prev => ({
      ...prev,
      [effectType]: {
        ...prev[effectType],
        intensity,
      },
    }));
  }, []);
  
  // Render drawer content
  const renderDrawerContent = () => {
    switch (activeDrawer) {
      case 'objects':
        return (
          <ObjectsDrawer
            objects={scene.objects}
            selectedId={scene.selectedObjectId}
            onSelect={selectObject}
            onAdd={addObject}
            onDelete={deleteObject}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
          />
        );
      case 'lighting':
        return (
          <LightingDrawer
            lightingMode={scene.lightingMode}
            onLightingModeChange={setLightingMode}
          />
        );
      case 'effects':
        return (
          <EffectsPanel
            effects={effects}
            onToggleEffect={handleToggleEffect}
            onIntensityChange={handleEffectIntensity}
          />
        );
      case 'camera':
      case 'rendering':
      case 'settings':
      case 'boolean':
      case 'sdf-settings':
        return (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {activeDrawer.charAt(0).toUpperCase() + activeDrawer.slice(1)} settings coming soon
          </div>
        );
      default:
        return null;
    }
  };
  
  // Get drawer title
  const getDrawerTitle = (): string => {
    switch (activeDrawer) {
      case 'objects': return 'Objects';
      case 'camera': return 'Camera';
      case 'lighting': return 'Lighting';
      case 'rendering': return 'Rendering';
      case 'effects': return 'Effects';
      case 'settings': return 'Settings';
      case 'boolean': return 'Boolean Operations';
      case 'sdf-settings': return 'SDF Settings';
      default: return '';
    }
  };
  
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <TopBar
        currentEngine={currentEngine}
        onEngineChange={setCurrentEngine}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Icon Bar (Tools) */}
        <IconBar
          side="left"
          activeTool={activeTool}
          onToolChange={setActiveTool}
        />
        
        {/* Main Viewport Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Viewport */}
          <div className="flex-1 min-h-0 relative">
            <Viewport
              projectedFaces={projectedFaces}
              selectedObjectId={scene.selectedObjectId}
              activeTool={activeTool}
              cameraRotation={scene.camera.rotation}
              cameraPosition={scene.camera.position}
              cameraFov={scene.camera.fov}
              gridVisible={scene.gridVisible}
              renderMode={renderMode}
              onViewportResize={setViewportSize}
              onObjectClick={selectObject}
              onCameraRotate={rotateCamera}
              onCameraPan={panCamera}
              onCameraZoom={zoomCamera}
              onObjectTransform={applyTransform}
            />
            
            {/* Effects Canvas Overlay */}
            <EffectsCanvas
              width={viewportSize.width}
              height={viewportSize.height}
              effects={effects}
              lightingMode={scene.lightingMode}
            />
            
            {/* Properties panel when object selected */}
            {selectedObject && activeDrawer !== 'objects' && (
              <div className="absolute top-4 right-4 w-72 bg-panel/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-panel overflow-hidden z-20">
                <div className="h-8 flex items-center justify-between px-3 border-b border-border/30">
                  <span className="text-xs font-medium text-primary">Properties</span>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => selectObject(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  <PropertiesDrawer
                    object={selectedObject}
                    onUpdate={updateObject}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Timeline */}
          <Timeline
            currentFrame={currentFrame}
            totalFrames={120}
            fps={24}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onSeek={setCurrentFrame}
          />
          
          {/* Bottom Bar */}
          <BottomBar
            showGrid={scene.gridVisible}
            onToggleGrid={toggleGrid}
            lightingMode={scene.lightingMode}
            onLightingModeChange={setLightingMode}
            cameraPreset={cameraPreset}
            onCameraPresetChange={setCameraPreset}
            renderMode={renderMode}
            onRenderModeChange={setRenderMode}
            showStats={showStats}
            onToggleStats={() => setShowStats(!showStats)}
            showEffects={Object.values(effects).some(e => e.enabled)}
            onToggleEffects={() => handleDrawerToggle('effects')}
            objectCount={scene.objects.length}
            selectedObjectName={selectedObject?.name}
          />
        </div>
        
        {/* Mini Bar (Layers) */}
        <MiniBar
          objects={scene.objects}
          selectedId={scene.selectedObjectId}
          onSelect={selectObject}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
        />
        
        {/* Right Icon Bar (Drawers) */}
        <IconBar
          side="right"
          activeDrawer={activeDrawer}
          onDrawerToggle={handleDrawerToggle}
          supportsSDF={currentEngine === 'sdflux'}
        />
        
        {/* Drawer Container */}
        <DrawerContainer
          isOpen={activeDrawer !== null}
          title={getDrawerTitle()}
          onClose={() => setActiveDrawer(null)}
        >
          {renderDrawerContent()}
        </DrawerContainer>
      </div>
    </div>
  );
};
