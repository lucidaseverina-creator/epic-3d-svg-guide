// ============================================
// PARAMETRIC ENGINE - Main Hook
// ============================================

import { useState, useCallback, useMemo } from 'react';
import {
  AssetSpec,
  BaseFormSpec,
  ParametricState,
  ParametricAction,
  ViewAxis,
  ReferencePack,
  FeatureGraph,
  FeatureNodeContract,
  SectionParams,
} from '@/types/parametric';
import { createBezierCurve, createDefaultBoatCurves, updateCurveKnot } from '@/lib/parametric/curves';
import { generateBaseMesh, GeneratedMesh, meshToFaces } from '@/lib/parametric/meshGenerator';
import { createDefaultSectionParams, getBoatSectionParams } from '@/lib/parametric/sectionLaw';
import { applyFeature, createCockpitFeature, createChineFeature } from '@/lib/parametric/features';
import { createDemoReferencePack } from '@/lib/parametric/referencePack';

// Create initial parametric state
function createInitialState(): ParametricState {
  return {
    spec: null,
    activeView: 'TOP',
    selectedCurve: null,
    selectedKnotIndex: null,
    selectedFeatureId: null,
    isDragging: false,
    dragStart: null,
    showReferencePack: true,
    showCurves: true,
    showMesh: true,
    showFeatureHandles: true,
    cachedMesh: null,
  };
}

// Create default boat spec
function createDefaultBoatSpec(): AssetSpec {
  const curves = createDefaultBoatCurves();
  
  const baseForm: BaseFormSpec = {
    id: 'boat-base',
    name: 'Boat Hull',
    L: 4.0, // 4 meters
    B: curves.B,
    K: curves.K,
    D: curves.D,
    sectionAt: getBoatSectionParams,
    Nu: 32,
    Nv: 16,
  };
  
  const features: FeatureGraph = {
    nodes: [
      createCockpitFeature(0.15, 0.55, 0.2, 0.25),
      createChineFeature(0.45, 0.015),
    ],
    connections: [],
  };
  
  return {
    id: 'default-boat',
    name: 'Sailboat Hull',
    template: 'boat_hull',
    baseForm,
    features,
    referencePack: createDemoReferencePack(),
    buildConfig: {
      lodLevels: [1.0, 0.5, 0.25],
      generateCollision: true,
      collisionType: 'convex',
      generateHardpoints: true,
      diagnostics: true,
    },
  };
}

// Main parametric engine hook
export function useParametricEngine() {
  const [state, setState] = useState<ParametricState>(createInitialState);
  
  // Initialize with default spec
  const initializeWithDefault = useCallback(() => {
    const spec = createDefaultBoatSpec();
    setState(prev => ({ ...prev, spec }));
  }, []);
  
  // Generate mesh from current spec
  const generatedMesh = useMemo((): GeneratedMesh | null => {
    if (!state.spec) return null;
    
    try {
      // Generate base mesh
      const mesh = generateBaseMesh(state.spec.baseForm);
      
      // Apply features
      for (const feature of state.spec.features.nodes) {
        if (feature.enabled) {
          applyFeature(mesh, feature);
        }
      }
      
      return mesh;
    } catch (err) {
      console.error('Mesh generation error:', err);
      return null;
    }
  }, [state.spec]);
  
  // Convert mesh to renderable faces
  const meshFaces = useMemo(() => {
    if (!generatedMesh) return [];
    return meshToFaces(generatedMesh);
  }, [generatedMesh]);
  
  // Dispatch action
  const dispatch = useCallback((action: ParametricAction) => {
    setState(prev => {
      switch (action.type) {
        case 'SET_SPEC':
          return { ...prev, spec: action.payload };
          
        case 'UPDATE_CURVE_KNOT': {
          if (!prev.spec) return prev;
          
          const baseForm = prev.spec.baseForm;
          const curve = baseForm[action.curve];
          const updatedCurve = updateCurveKnot(curve, action.knotIndex, { value: action.value });
          
          return {
            ...prev,
            spec: {
              ...prev.spec,
              baseForm: {
                ...baseForm,
                [action.curve]: updatedCurve,
              },
            },
          };
        }
        
        case 'SET_ACTIVE_VIEW':
          return { ...prev, activeView: action.view };
          
        case 'SELECT_CURVE':
          return { ...prev, selectedCurve: action.curve, selectedKnotIndex: null };
          
        case 'SELECT_KNOT':
          return { ...prev, selectedKnotIndex: action.knotIndex };
          
        case 'SELECT_FEATURE':
          return { ...prev, selectedFeatureId: action.featureId };
          
        case 'UPDATE_FEATURE': {
          if (!prev.spec) return prev;
          
          const updatedNodes = prev.spec.features.nodes.map(node =>
            node.id === action.featureId ? { ...node, ...action.updates } : node
          );
          
          return {
            ...prev,
            spec: {
              ...prev.spec,
              features: {
                ...prev.spec.features,
                nodes: updatedNodes,
              },
            },
          };
        }
        
        case 'ADD_FEATURE': {
          if (!prev.spec) return prev;
          
          return {
            ...prev,
            spec: {
              ...prev.spec,
              features: {
                ...prev.spec.features,
                nodes: [...prev.spec.features.nodes, action.feature],
              },
            },
          };
        }
        
        case 'REMOVE_FEATURE': {
          if (!prev.spec) return prev;
          
          return {
            ...prev,
            spec: {
              ...prev.spec,
              features: {
                ...prev.spec.features,
                nodes: prev.spec.features.nodes.filter(n => n.id !== action.featureId),
              },
            },
            selectedFeatureId: prev.selectedFeatureId === action.featureId ? null : prev.selectedFeatureId,
          };
        }
        
        case 'SET_REFERENCE_PACK': {
          if (!prev.spec) return prev;
          
          return {
            ...prev,
            spec: {
              ...prev.spec,
              referencePack: action.pack,
            },
          };
        }
        
        case 'TOGGLE_DISPLAY': {
          return {
            ...prev,
            [action.setting]: !prev[action.setting],
          };
        }
        
        case 'SET_DRAGGING':
          return {
            ...prev,
            isDragging: action.isDragging,
            dragStart: action.dragStart ?? null,
          };
          
        default:
          return prev;
      }
    });
  }, []);
  
  // Update base form dimensions
  const updateLength = useCallback((L: number) => {
    if (!state.spec) return;
    
    dispatch({
      type: 'SET_SPEC',
      payload: {
        ...state.spec,
        baseForm: {
          ...state.spec.baseForm,
          L: Math.max(0.5, Math.min(20, L)),
        },
      },
    });
  }, [state.spec, dispatch]);
  
  // Update resolution
  const updateResolution = useCallback((Nu: number, Nv: number) => {
    if (!state.spec) return;
    
    dispatch({
      type: 'SET_SPEC',
      payload: {
        ...state.spec,
        baseForm: {
          ...state.spec.baseForm,
          Nu: Math.max(8, Math.min(128, Nu)),
          Nv: Math.max(4, Math.min(64, Nv)),
        },
      },
    });
  }, [state.spec, dispatch]);
  
  // Toggle feature
  const toggleFeature = useCallback((featureId: string) => {
    const feature = state.spec?.features.nodes.find(n => n.id === featureId);
    if (feature) {
      dispatch({
        type: 'UPDATE_FEATURE',
        featureId,
        updates: { enabled: !feature.enabled },
      });
    }
  }, [state.spec, dispatch]);
  
  return {
    state,
    spec: state.spec,
    generatedMesh,
    meshFaces,
    dispatch,
    initializeWithDefault,
    updateLength,
    updateResolution,
    toggleFeature,
  };
}
