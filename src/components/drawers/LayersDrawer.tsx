// ============================================
// LAYERS DRAWER - Unified layers for scene objects + SDF nodes
// ============================================

import React from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Box,
  Circle,
  Square,
  Hexagon,
  Combine,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SceneObject } from '@/types/engine';
import { SDFNode, SDFPrimitiveType } from '@/components/parametric/BooleanPanel';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface LayersDrawerProps {
  // Scene objects
  sceneObjects: SceneObject[];
  selectedSceneId: string | null;
  onSelectSceneObject: (id: string | null) => void;
  onDeleteSceneObject: (id: string) => void;
  onToggleSceneVisibility: (id: string) => void;
  onToggleSceneLock: (id: string) => void;
  
  // SDF nodes
  sdfNodes: SDFNode[];
  selectedSdfId: string | null;
  onSelectSdfNode: (id: string | null) => void;
  onAddSdfNode: (type: SDFPrimitiveType) => void;
  onDeleteSdfNode: (id: string) => void;
  onDuplicateSdfNode: (id: string) => void;
  onToggleSdfVisibility: (id: string) => void;
  onToggleSdfLock: (id: string) => void;
}

const PRIMITIVE_ICONS: Record<SDFPrimitiveType | 'boolean', React.ReactNode> = {
  sphere: <Circle className="w-4 h-4" />,
  box: <Square className="w-4 h-4" />,
  torus: <Circle className="w-4 h-4 opacity-60" />,
  cylinder: <Box className="w-4 h-4" />,
  capsule: <Box className="w-4 h-4 opacity-60" />,
  octahedron: <Hexagon className="w-4 h-4" />,
  boolean: <Combine className="w-4 h-4" />,
};

const PRIMITIVES_LIST: SDFPrimitiveType[] = [
  'sphere',
  'box',
  'torus',
  'cylinder',
  'capsule',
  'octahedron',
];

export const LayersDrawer: React.FC<LayersDrawerProps> = ({
  sceneObjects,
  selectedSceneId,
  onSelectSceneObject,
  onDeleteSceneObject,
  onToggleSceneVisibility,
  onToggleSceneLock,
  sdfNodes,
  selectedSdfId,
  onSelectSdfNode,
  onAddSdfNode,
  onDeleteSdfNode,
  onDuplicateSdfNode,
  onToggleSdfVisibility,
  onToggleSdfLock,
}) => {
  const [sceneExpanded, setSceneExpanded] = React.useState(true);
  const [sdfExpanded, setSdfExpanded] = React.useState(true);
  const [addMenuOpen, setAddMenuOpen] = React.useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* SDF Nodes Section */}
      <Collapsible open={sdfExpanded} onOpenChange={setSdfExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              {sdfExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
              <Combine className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">SDF Shapes</span>
            </div>
            <span className="text-xs text-muted-foreground">{sdfNodes.length}</span>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {/* Add primitive buttons */}
          <div className="px-3 py-2 border-b border-border/30">
            <div className="flex flex-wrap gap-1">
              {PRIMITIVES_LIST.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={() => onAddSdfNode(type)}
                  title={`Add ${type}`}
                >
                  {PRIMITIVE_ICONS[type]}
                  <span className="ml-1 capitalize">{type}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* SDF Node list */}
          <div className="py-1">
            {sdfNodes.length === 0 ? (
              <div className="px-3 py-4 text-center text-muted-foreground text-xs">
                No SDF shapes yet. Add one above.
              </div>
            ) : (
              sdfNodes.map((node) => (
                <div
                  key={node.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 cursor-pointer",
                    "hover:bg-muted/50 transition-colors group",
                    selectedSdfId === node.id && "bg-primary/10 border-l-2 border-primary"
                  )}
                  onClick={() => onSelectSdfNode(node.id)}
                >
                  {/* Icon */}
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ backgroundColor: node.material.color + '30' }}
                  >
                    {PRIMITIVE_ICONS[node.type as SDFPrimitiveType | 'boolean']}
                  </div>
                  
                  {/* Name */}
                  <span className="flex-1 text-xs truncate">{node.name}</span>
                  
                  {/* Quick actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1 hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSdfVisibility(node.id);
                      }}
                      title={node.visible ? 'Hide' : 'Show'}
                    >
                      {node.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      className="p-1 hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSdfNode(node.id);
                      }}
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      className="p-1 hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSdfNode(node.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Status indicators */}
                  {!node.visible && (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                  {node.locked && (
                    <Lock className="w-3 h-3 text-warning" />
                  )}
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Scene Objects Section */}
      <Collapsible open={sceneExpanded} onOpenChange={setSceneExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors border-t border-border/30">
            <div className="flex items-center gap-2">
              {sceneExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              )}
              <Box className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-foreground">Scene Objects</span>
            </div>
            <span className="text-xs text-muted-foreground">{sceneObjects.length}</span>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="py-1">
            {sceneObjects.length === 0 ? (
              <div className="px-3 py-4 text-center text-muted-foreground text-xs">
                No scene objects.
              </div>
            ) : (
              sceneObjects.map((obj) => (
                <div
                  key={obj.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 cursor-pointer",
                    "hover:bg-muted/50 transition-colors group",
                    selectedSceneId === obj.id && "bg-primary/10 border-l-2 border-primary"
                  )}
                  onClick={() => onSelectSceneObject(obj.id)}
                >
                  {/* Color swatch */}
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: obj.material.color }}
                  />
                  
                  {/* Name */}
                  <span className="flex-1 text-xs truncate">{obj.name}</span>
                  
                  {/* Quick actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1 hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSceneVisibility(obj.id);
                      }}
                      title={obj.visible ? 'Hide' : 'Show'}
                    >
                      {obj.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      className="p-1 hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSceneLock(obj.id);
                      }}
                      title={obj.locked ? 'Unlock' : 'Lock'}
                    >
                      {obj.locked ? (
                        <Lock className="w-3 h-3 text-warning" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      className="p-1 hover:text-destructive transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSceneObject(obj.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
