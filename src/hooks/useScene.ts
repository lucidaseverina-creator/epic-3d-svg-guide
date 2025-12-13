import { useState, useCallback, useMemo } from 'react';
import {
  Scene,
  SceneObject,
  PrimitiveType,
  Vector3,
  TransformDelta,
  Camera,
  Material,
} from '@/types/engine';
import { getLightsForMode } from '@/lib/renderer';

// Default materials
const defaultMaterials: Record<string, Material> = {
  cyan: {
    id: 'cyan',
    color: '#00ffff',
    ambient: 0.2,
    diffuse: 0.8,
    specular: 0.5,
    shininess: 32,
  },
  magenta: {
    id: 'magenta',
    color: '#ff00ff',
    ambient: 0.2,
    diffuse: 0.8,
    specular: 0.5,
    shininess: 32,
  },
  yellow: {
    id: 'yellow',
    color: '#ffff00',
    ambient: 0.2,
    diffuse: 0.8,
    specular: 0.5,
    shininess: 32,
  },
  orange: {
    id: 'orange',
    color: '#ff8800',
    ambient: 0.2,
    diffuse: 0.8,
    specular: 0.5,
    shininess: 32,
  },
  green: {
    id: 'green',
    color: '#00ff88',
    ambient: 0.2,
    diffuse: 0.8,
    specular: 0.5,
    shininess: 32,
  },
};

const materialKeys = Object.keys(defaultMaterials);

// Default camera
const defaultCamera: Camera = {
  position: { x: 0, y: 0, z: 500 },
  rotation: { x: 0.4, y: -0.5, z: 0 },
  fov: 800,
  near: 1,
  far: 2000,
};

// Create initial scene
const createInitialScene = (): Scene => ({
  objects: [
    {
      id: 'box-1',
      name: 'Cube 1',
      type: 'box',
      position: { x: -80, y: 30, z: 0 },
      rotation: { x: 0.3, y: 0.3, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: defaultMaterials.cyan,
      visible: true,
      locked: false,
    },
    {
      id: 'sphere-1',
      name: 'Sphere 1',
      type: 'sphere',
      position: { x: 80, y: -20, z: 20 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.9, y: 0.9, z: 0.9 },
      material: defaultMaterials.magenta,
      visible: true,
      locked: false,
    },
    {
      id: 'torus-1',
      name: 'Torus 1',
      type: 'torus',
      position: { x: 0, y: -60, z: -30 },
      rotation: { x: 0.5, y: 0.2, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material: defaultMaterials.yellow,
      visible: true,
      locked: false,
    },
  ],
  lights: getLightsForMode('night'),
  camera: defaultCamera,
  cursor3D: { x: 0, y: 0, z: 0 },
  selectedObjectId: null,
  gridVisible: true,
  axisVisible: true,
  lightingMode: 'night',
});

export const useScene = () => {
  const [scene, setScene] = useState<Scene>(createInitialScene);
  
  // Selected object
  const selectedObject = useMemo(() => {
    if (!scene.selectedObjectId) return null;
    return scene.objects.find(obj => obj.id === scene.selectedObjectId) || null;
  }, [scene.selectedObjectId, scene.objects]);
  
  // Select object
  const selectObject = useCallback((id: string | null) => {
    setScene(prev => ({
      ...prev,
      selectedObjectId: id,
    }));
  }, []);
  
  // Add object
  const addObject = useCallback((type: PrimitiveType) => {
    const id = `${type}-${Date.now()}`;
    const materialIndex = Math.floor(Math.random() * materialKeys.length);
    const material = defaultMaterials[materialKeys[materialIndex]];
    
    const newObject: SceneObject = {
      id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${scene.objects.length + 1}`,
      type,
      position: { 
        x: (Math.random() - 0.5) * 100, 
        y: (Math.random() - 0.5) * 100, 
        z: (Math.random() - 0.5) * 50 
      },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      material,
      visible: true,
      locked: false,
    };
    
    setScene(prev => ({
      ...prev,
      objects: [...prev.objects, newObject],
      selectedObjectId: id,
    }));
  }, [scene.objects.length]);
  
  // Update object
  const updateObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    setScene(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    }));
  }, []);
  
  // Apply transform (for tools)
  const applyTransform = useCallback((id: string, delta: TransformDelta) => {
    setScene(prev => ({
      ...prev,
      objects: prev.objects.map(obj => {
        if (obj.id !== id || obj.locked) return obj;
        
        return {
          ...obj,
          position: delta.position
            ? {
                x: obj.position.x + delta.position.x,
                y: obj.position.y + delta.position.y,
                z: obj.position.z + delta.position.z,
              }
            : obj.position,
          rotation: delta.rotation
            ? {
                x: obj.rotation.x + delta.rotation.x,
                y: obj.rotation.y + delta.rotation.y,
                z: obj.rotation.z + delta.rotation.z,
              }
            : obj.rotation,
          scale: delta.scale
            ? {
                x: obj.scale.x * delta.scale.x,
                y: obj.scale.y * delta.scale.y,
                z: obj.scale.z * delta.scale.z,
              }
            : obj.scale,
        };
      }),
    }));
  }, []);
  
  // Delete object
  const deleteObject = useCallback((id: string) => {
    setScene(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => obj.id !== id),
      selectedObjectId: prev.selectedObjectId === id ? null : prev.selectedObjectId,
    }));
  }, []);
  
  // Camera controls
  const rotateCamera = useCallback((rotation: Vector3) => {
    setScene(prev => ({
      ...prev,
      camera: {
        ...prev.camera,
        rotation: {
          x: Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotation.x)),
          y: rotation.y,
          z: rotation.z,
        },
      },
    }));
  }, []);
  
  const panCamera = useCallback((offset: Vector3) => {
    setScene(prev => ({
      ...prev,
      camera: {
        ...prev.camera,
        position: {
          x: prev.camera.position.x + offset.x,
          y: prev.camera.position.y + offset.y,
          z: prev.camera.position.z + offset.z,
        },
      },
    }));
  }, []);
  
  const zoomCamera = useCallback((delta: number) => {
    setScene(prev => ({
      ...prev,
      camera: {
        ...prev.camera,
        position: {
          ...prev.camera.position,
          z: Math.max(100, Math.min(2000, prev.camera.position.z + delta)),
        },
      },
    }));
  }, []);
  
  // Move 3D cursor
  const moveCursor3D = useCallback((position: Vector3) => {
    setScene(prev => ({
      ...prev,
      cursor3D: position,
    }));
  }, []);
  
  // Toggle grid
  const toggleGrid = useCallback(() => {
    setScene(prev => ({
      ...prev,
      gridVisible: !prev.gridVisible,
    }));
  }, []);
  
  // Toggle axis
  const toggleAxis = useCallback(() => {
    setScene(prev => ({
      ...prev,
      axisVisible: !prev.axisVisible,
    }));
  }, []);
  
  // Set lighting mode
  const setLightingMode = useCallback((mode: 'day' | 'night') => {
    setScene(prev => ({
      ...prev,
      lightingMode: mode,
      lights: getLightsForMode(mode),
    }));
  }, []);
  
  // Reset camera
  const resetCamera = useCallback(() => {
    setScene(prev => ({
      ...prev,
      camera: defaultCamera,
    }));
  }, []);
  
  return {
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
    moveCursor3D,
    toggleGrid,
    toggleAxis,
    setLightingMode,
    resetCamera,
  };
};
