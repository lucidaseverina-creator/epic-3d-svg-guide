import {
  Scene,
  SceneObject,
  ProjectedFace,
  Face,
  Light,
  EngineConfig,
  Vector3,
} from '@/types/engine';
import {
  rotateEuler,
  transformPoint,
  project,
  calculateNormal,
  calculateCenter,
  dot,
  normalize,
  add,
  subtract,
  multiply,
} from '@/lib/math';
import { generatePrimitiveFaces } from '@/lib/primitives';

// Default lighting configurations
export const getLightsForMode = (mode: 'day' | 'night'): Light[] => {
  if (mode === 'day') {
    return [
      { type: 'ambient', color: '#ffffff', intensity: 0.6 },
      { type: 'directional', color: '#ffffee', intensity: 1.0, direction: { x: 1, y: 1, z: 0.5 } },
    ];
  } else {
    return [
      { type: 'ambient', color: '#8888ff', intensity: 0.3 },
      { type: 'directional', color: '#aaaaff', intensity: 0.5, direction: { x: -1, y: 1, z: 1 } },
    ];
  }
};

// Default engine config
export const getDefaultConfig = (): EngineConfig => ({
  fov: 800,
  cameraZ: 500,
  ambientIntensity: 0.3,
  directionalIntensity: 0.8,
  lightDirection: normalize({ x: 1, y: 1, z: 0.5 }),
});

// Calculate lighting intensity for a face
const calculateLighting = (
  normal: Vector3,
  lights: Light[],
  cameraRotation: Vector3
): number => {
  let totalIntensity = 0;
  
  for (const light of lights) {
    if (light.type === 'ambient') {
      totalIntensity += light.intensity;
    } else if (light.type === 'directional' && light.direction) {
      // Rotate light direction with camera
      const rotatedDirection = rotateEuler(light.direction, {
        x: -cameraRotation.x,
        y: -cameraRotation.y,
        z: -cameraRotation.z,
      });
      
      const normalizedDir = normalize(rotatedDirection);
      const intensity = Math.max(0, dot(normal, normalizedDir)) * light.intensity;
      totalIntensity += intensity;
    }
  }
  
  return Math.min(1, totalIntensity);
};

// Apply lighting to color
const applyLightingToColor = (color: string, intensity: number): string => {
  // Parse hex color
  const hex = color.replace('#', '');
  
  if (hex.length !== 6) {
    // Handle HSL or other formats
    return color;
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Apply lighting
  const factor = 0.2 + intensity * 0.8; // Keep some base brightness
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  
  return `rgb(${newR}, ${newG}, ${newB})`;
};

// Main render function
export const renderScene = (
  scene: Scene,
  config: EngineConfig,
  viewportWidth: number,
  viewportHeight: number
): ProjectedFace[] => {
  const projectedFaces: ProjectedFace[] = [];
  
  for (const obj of scene.objects) {
    if (!obj.visible) continue;
    
    // Generate base faces for this primitive type
    const baseFaces = generatePrimitiveFaces(obj.type, 50);
    
    for (const face of baseFaces) {
      // Transform vertices by object transform
      const transformedVerts = face.verts.map(v =>
        transformPoint(v, obj.position, obj.rotation, obj.scale)
      );
      
      // Apply camera rotation
      const rotatedVerts = transformedVerts.map(v =>
        rotateEuler(v, scene.camera.rotation)
      );
      
      // Calculate face center for depth
      const center = calculateCenter(rotatedVerts);

      // Calculate normal for lighting and backface culling
      let normal = calculateNormal(rotatedVerts);

      // Ensure normals point "outward" from the object's center (robust vs. inconsistent vertex winding)
      const objCenterCamera = rotateEuler(obj.position, scene.camera.rotation);
      const outward = normalize(subtract(center, objCenterCamera));
      if (dot(normal, outward) < 0) {
        normal = multiply(normal, -1);
      }

      // Backface culling: camera is effectively at z=-cameraZ looking toward +Z
      // so faces with normals pointing toward +Z are facing away from the camera.
      if (normal.z > 0.0001) continue;

      // Calculate lighting
      const lightIntensity = calculateLighting(normal, scene.lights, scene.camera.rotation);

      // Use object's material color instead of face color
      const litColor = applyLightingToColor(obj.material.color, lightIntensity);
      
      // Project vertices
      const projectedVerts = rotatedVerts.map(v =>
        project(v, viewportWidth, viewportHeight, config.fov, config.cameraZ)
      );
      
      // Use center Z for depth (more negative = further from camera)
      const depth = center.z;
      
      projectedFaces.push({
        verts: rotatedVerts,
        projectedVerts,
        color: litColor,
        depth,
        lightIntensity,
        objectId: obj.id,
        isSelected: obj.id === scene.selectedObjectId,
      });
    }
  }
  
  // Sort by depth: render far to near (more negative z first, then higher z on top)
  projectedFaces.sort((a, b) => a.depth - b.depth);
  
  return projectedFaces;
};
