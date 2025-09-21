"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import Tree from "react-d3-tree";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  BookOpen, 
  Target, 
  Users, 
  Brain, 
  ChevronDown, 
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Plus,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GenerateSkillMindMapOutput } from "@/ai/flows/generate-skill-mindmap";
import { expandNodeAction } from "@/app/actions";

type MindMapNode = {
  id: string;
  name: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedTime: string;
  prerequisites?: string[];
  learningResources?: Array<{
    type: 'tutorial' | 'project' | 'practice' | 'reading';
    title: string;
    description: string;
  }>;
  practiceProjects?: string[];
  keyTopics?: string[];
  children?: MindMapNode[];
  isExpandable: boolean;
};

// Create a sample tree structure as fallback
const createSampleTree = (skillName: string): any => {
  return {
    name: skillName || 'Learning Path',
    attributes: {
      id: 'root',
      description: `Comprehensive learning path for ${skillName}`,
      level: 'beginner',
      estimatedTime: '3-6 months',
      prerequisites: [],
      learningResources: [
        {
          type: 'tutorial',
          title: 'Getting Started',
          description: `Introduction to ${skillName} fundamentals`
        }
      ],
      practiceProjects: [`Build a simple ${skillName} project`],
      keyTopics: ['Basics', 'Core Concepts', 'Best Practices'],
      isExpandable: true,
    },
    children: [
      {
        name: 'Fundamentals',
        attributes: {
          id: 'fundamentals',
          description: 'Core concepts and basic principles',
          level: 'beginner',
          estimatedTime: '2-4 weeks',
          prerequisites: [],
          learningResources: [],
          practiceProjects: [],
          keyTopics: ['Basic concepts', 'Getting started'],
          isExpandable: false,
        },
        children: []
      },
      {
        name: 'Intermediate Concepts',
        attributes: {
          id: 'intermediate',
          description: 'Building on the fundamentals',
          level: 'intermediate',
          estimatedTime: '4-8 weeks',
          prerequisites: ['Fundamentals'],
          learningResources: [],
          practiceProjects: [],
          keyTopics: ['Advanced features', 'Real-world application'],
          isExpandable: false,
        },
        children: []
      }
    ]
  };
};
const transformToTreeData = (node: any): any => {
  if (!node) {
    return null;
  }

  // Create a safe transformation that handles missing or malformed data
  const safeNode = {
    name: node.name || node.title || 'Unknown Skill',
    attributes: {
      id: node.id || `node-${Math.random().toString(36).substr(2, 9)}`,
      description: node.description || 'No description available',
      level: node.level || 'beginner',
      estimatedTime: node.estimatedTime || 'N/A',
      prerequisites: Array.isArray(node.prerequisites) ? node.prerequisites : [],
      learningResources: Array.isArray(node.learningResources) ? node.learningResources : [],
      practiceProjects: Array.isArray(node.practiceProjects) ? node.practiceProjects : [],
      keyTopics: Array.isArray(node.keyTopics) ? node.keyTopics : [],
      isExpandable: Boolean(node.isExpandable),
    },
    children: [],
  };

  // Recursively transform children if they exist
  if (Array.isArray(node.children) && node.children.length > 0) {
    safeNode.children = node.children.map(transformToTreeData).filter(Boolean);
  }

  return safeNode;
};

const levelColors: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#3b82f6", 
  advanced: "#f97316",
  expert: "#a855f7",
};

// Function to get appropriate icon based on skill name
const getSkillIcon = (skillName: string): string => {
  const name = skillName.toLowerCase();
  
  if (name.includes('python') || name.includes('programming')) return '🐍';
  if (name.includes('javascript') || name.includes('js')) return '⚡';
  if (name.includes('react') || name.includes('frontend')) return '⚛️';
  if (name.includes('data') || name.includes('analytics')) return '📊';
  if (name.includes('machine') || name.includes('ai') || name.includes('ml')) return '🤖';
  if (name.includes('design') || name.includes('ui/ux')) return '🎨';
  if (name.includes('cloud') || name.includes('aws') || name.includes('azure')) return '☁️';
  if (name.includes('database') || name.includes('sql')) return '🗄️';
  if (name.includes('mobile') || name.includes('app')) return '📱';
  if (name.includes('web') || name.includes('html') || name.includes('css')) return '🌐';
  if (name.includes('security') || name.includes('cyber')) return '🔒';
  if (name.includes('devops') || name.includes('deployment')) return '🚀';
  if (name.includes('test') || name.includes('qa')) return '🧪';
  if (name.includes('math') || name.includes('algorithm')) return '📐';
  if (name.includes('business') || name.includes('management')) return '💼';
  
  // Default icons for generic terms
  return '🎯';
};

// Custom node component for the tree
const CustomNode = ({ nodeDatum, toggleNode, orientation, onExpand, isExpanding, expandedNodes }: any) => {
  const [showDetails, setShowDetails] = useState(false);
  const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
  const level = nodeDatum.attributes?.level || 'beginner';
  const nodeId = nodeDatum.attributes?.id || nodeDatum.name;
  const isCurrentlyExpanding = isExpanding === nodeId;
  const isAlreadyExpanded = expandedNodes && expandedNodes.has(nodeId);
  
  return (
    <g>
      {/* Main node hexagon instead of circle */}
      <g data-interactive="true">
        {/* Shadow for hexagon */}
        <path
          d="M-16.32,11 L-16.32,-9 L1,-19 L18.32,-9 L18.32,11 L1,21 Z"
          fill="rgba(0,0,0,0.1)"
          stroke="none"
        />
        {/* Hexagon path */}
        <path
          d="M-17.32,10 L-17.32,-10 L0,-20 L17.32,-10 L17.32,10 L0,20 Z"
          fill={levelColors[level as keyof typeof levelColors] || levelColors.beginner}
          stroke="#ffffff"
          strokeWidth={2}
          style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          onClick={hasChildren ? toggleNode : undefined}
        />
        {/* Skill icon inside hexagon */}
        <text
          x={0}
          y={5}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="16"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {getSkillIcon(nodeDatum.name)}
        </text>
      </g>
      
      {/* Expand/collapse indicator for tree structure */}
      {hasChildren && (
        <g data-interactive="true">
          <circle
            r={6}
            fill="#ffffff"
            stroke={levelColors[level as keyof typeof levelColors] || levelColors.beginner}
            strokeWidth={2}
            transform="translate(0, 0)"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill={levelColors[level as keyof typeof levelColors] || levelColors.beginner}
            fontSize="12"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            {nodeDatum.__rd3t?.collapsed ? '+' : '−'}
          </text>
        </g>
      )}

      {/* AI Expand button - shown for nodes that haven't been expanded yet */}
      {!isAlreadyExpanded && (
        <g transform="translate(28, -10)" data-interactive="true">
          <circle
            r={10}
            fill={isCurrentlyExpanding ? "#3b82f6" : "#10b981"}
            stroke="#ffffff"
            strokeWidth={2}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            onClick={(e) => {
              e.stopPropagation();
              onExpand(nodeDatum);
            }}
          />
          {isCurrentlyExpanding ? (
            <g transform="translate(-4, -4)">
              <circle r="3" fill="#ffffff" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
              </circle>
            </g>
          ) : (
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              +
            </text>
          )}
        </g>
      )}

      {/* Expanded indicator - shown for nodes that have been expanded */}
      {isAlreadyExpanded && (
        <g transform="translate(28, -10)" data-interactive="true">
          <circle
            r={10}
            fill="#059669"
            stroke="#ffffff"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >
            ✓
          </text>
        </g>
      )}
      
      {/* Node name with background box */}
      <g>
        {/* Background rectangle for text */}
        <rect
          x={-Math.max(nodeDatum.name.length * 4.5, 80) / 2}
          y={hasChildren ? -45 : -40}
          width={Math.max(nodeDatum.name.length * 4.5, 80)}
          height={20}
          fill="#ffffff"
          stroke="#e5e7eb"
          strokeWidth={1}
          rx={4}
          opacity={0.95}
        />
        {/* Node name text */}
        <text
          x={0}
          y={hasChildren ? -30 : -25}
          textAnchor="middle"
          fill="#1f2937"
          fontSize="13"
          fontWeight="700"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {nodeDatum.name}
        </text>
      </g>

      {/* Level badge with improved styling */}
      <g transform="translate(35, 8)">
        <rect
          x={-25}
          y={0}
          width={50}
          height={18}
          fill={levelColors[level as keyof typeof levelColors] || levelColors.beginner}
          rx={9}
          opacity={0.9}
          stroke="#ffffff"
          strokeWidth={1}
        />
        <text
          x={0}
          y={13}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontWeight="700"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </text>
      </g>
      
      {/* Time estimate with background */}
      <g transform="translate(-60, 35)">
        <rect
          x={-20}
          y={0}
          width={40}
          height={16}
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth={1}
          rx={8}
          opacity={0.9}
        />
        <text
          x={0}
          y={12}
          textAnchor="middle"
          fill="#374151"
          fontSize="10"
          fontWeight="600"
          fontFamily="Inter, system-ui, -apple-system, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          ⏱ {nodeDatum.attributes?.estimatedTime || 'N/A'}
        </text>
      </g>
    </g>
  );
};

interface SkillTreeVisualizationProps {
  mindMapData: GenerateSkillMindMapOutput["mindMap"];
}

export default function SkillTreeVisualization({ mindMapData }: SkillTreeVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Map<string, any>>(new Map());
  const [expandingNodeId, setExpandingNodeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  // Mouse interaction states for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTranslate, setLastTranslate] = useState({ x: 0, y: 0 });
  
  // Dynamic tree data that can be updated when nodes are expanded
  const [dynamicTreeData, setDynamicTreeData] = useState<any>(null);

  // Transform data to tree format
  const treeData = useMemo(() => {
    // If we have dynamic tree data (after expansions), use that
    if (dynamicTreeData) {
      return dynamicTreeData;
    }

    if (!mindMapData) {
      console.log('No mindMapData provided');
      return null;
    }

    console.log('Full mindMapData structure:', JSON.stringify(mindMapData, null, 2));

    let rootNode = mindMapData.root;

    // If root is missing or malformed, try to create a structure from available data
    if (!rootNode || typeof rootNode !== 'object') {
      console.log('No valid root found, creating fallback structure');
      const skillName = mindMapData.title || 'Unknown Skill';
      const fallbackTree = createSampleTree(skillName);
      setDynamicTreeData(fallbackTree);
      return fallbackTree;
    }

    console.log('Processing root node:', rootNode);
    const result = transformToTreeData(rootNode);
    
    // If transformation fails or returns empty, use sample
    if (!result || !result.name) {
      console.log('Transformation failed, using sample tree');
      const skillName = mindMapData.title || rootNode.name || 'Unknown Skill';
      const fallbackTree = createSampleTree(skillName);
      setDynamicTreeData(fallbackTree);
      return fallbackTree;
    }
    
    console.log('Transformed tree data:', result);
    // Initialize dynamic tree data with the original tree
    setDynamicTreeData(result);
    return result;
  }, [mindMapData, dynamicTreeData]);

  const handleNodeClick = useCallback((nodeDatum: any) => {
    setSelectedNode(nodeDatum);
  }, []);

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start dragging if clicking on interactive elements
    const target = e.target as HTMLElement;
    
    // Check if the target or any parent has data-interactive attribute
    let element = target;
    while (element && element !== e.currentTarget) {
      if (element.getAttribute && element.getAttribute('data-interactive') === 'true') {
        return;
      }
      if (element.tagName === 'circle' || element.tagName === 'path') {
        return; // Don't drag when clicking on node elements
      }
      element = element.parentElement as HTMLElement;
    }
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastTranslate(translate);
  }, [translate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setTranslate({
      x: lastTranslate.x + deltaX,
      y: lastTranslate.y + deltaY
    });
  }, [isDragging, dragStart, lastTranslate]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setIsDragging(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 3);
    
    // Calculate new translate to zoom towards mouse position
    const zoomRatio = newZoom / zoom;
    const newTranslateX = mouseX - (mouseX - translate.x) * zoomRatio;
    const newTranslateY = mouseY - (mouseY - translate.y) * zoomRatio;
    
    setZoom(newZoom);
    setTranslate({ x: newTranslateX, y: newTranslateY });
  }, [zoom, translate]);

  // Function to find and update a node in the tree structure
  const updateNodeInTree = useCallback((tree: any, targetNodeId: string, newChildren: any[]): any => {
    if (!tree) return tree;

    // Check if this is the target node
    const currentNodeId = tree.attributes?.id || tree.name;
    if (currentNodeId === targetNodeId) {
      return {
        ...tree,
        children: [...(tree.children || []), ...newChildren]
      };
    }

    // Recursively check children
    if (tree.children && tree.children.length > 0) {
      return {
        ...tree,
        children: tree.children.map((child: any) => 
          updateNodeInTree(child, targetNodeId, newChildren)
        )
      };
    }

    return tree;
  }, []);

  // Function to expand a node with AI-generated content
  const expandNode = useCallback(async (nodeData: any) => {
    const nodeId = nodeData.attributes?.id || nodeData.name;
    
    // Don't expand if already expanding this node
    if (expandingNodeId === nodeId) return;
    
    // If already expanded, just show the content
    if (expandedNodes.has(nodeId)) {
      setSelectedNode(nodeData);
      return;
    }

    setExpandingNodeId(nodeId);

    startTransition(async () => {
      try {
        const result = await expandNodeAction({
          nodeName: nodeData.name,
          nodeDescription: nodeData.attributes?.description || 'No description available',
          nodeLevel: nodeData.attributes?.level || 'beginner',
          parentSkill: mindMapData.title || 'Unknown Skill',
          currentLevel: 'beginner' // You can make this dynamic based on user profile
        });

        if (result.success && result.data) {
          // Transform AI-generated child nodes to tree format
          const newChildNodes = result.data.expansion.childNodes.map((childNode: any) => ({
            name: childNode.name,
            attributes: {
              id: childNode.id,
              description: childNode.description,
              level: childNode.level,
              estimatedTime: childNode.estimatedTime,
              prerequisites: childNode.prerequisites || [],
              learningResources: childNode.learningResources || [],
              practiceProjects: childNode.practiceProjects || [],
              keyTopics: childNode.keyTopics || [],
              isExpandable: childNode.isExpandable,
            },
            children: [] // New nodes start without children
          }));

          // Update the tree structure by adding children to the expanded node
          const updatedTree = updateNodeInTree(dynamicTreeData || treeData, nodeId, newChildNodes);
          setDynamicTreeData(updatedTree);
          
          // Store the expanded content for tracking
          const newExpandedNodes = new Map(expandedNodes);
          newExpandedNodes.set(nodeId, result.data.expansion);
          setExpandedNodes(newExpandedNodes);

          toast({
            title: "Node Expanded! 🌱",
            description: `Added ${newChildNodes.length} child nodes to ${nodeData.name}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Expansion Failed",
            description: result.error || "Failed to expand node content. Please try again.",
          });
        }
      } catch (error) {
        console.error('Error expanding node:', error);
        toast({
          variant: "destructive",
          title: "Unexpected Error",
          description: "Something went wrong while expanding the node.",
        });
      } finally {
        setExpandingNodeId(null);
      }
    });
  }, [expandedNodes, expandingNodeId, mindMapData.title, toast, startTransition, updateNodeInTree, dynamicTreeData, treeData]);

  const nodeSize = { x: 300, y: 100 };
  const separation = { siblings: 2, nonSiblings: 2 };

  const resetView = () => {
    setTranslate({ x: 0, y: 0 });
    setZoom(1);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));

  // Show error if no valid tree data
  if (!treeData) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Unable to display skill tree</h3>
          <p className="text-muted-foreground">
            The AI generated data could not be properly formatted for visualization.
            Please try generating the mind map again.
          </p>
          <details className="text-left max-w-md mx-auto">
            <summary className="cursor-pointer text-sm text-muted-foreground mb-2">Show debug info</summary>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">
              {JSON.stringify(mindMapData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{mindMapData.title}</h2>
          <p className="text-muted-foreground mt-2">{mindMapData.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset View
          </Button>
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree Visualization */}
        <div className={cn(
          "bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-lg relative mindmap-container",
          isFullscreen ? "lg:col-span-3 h-[80vh]" : "lg:col-span-2 h-[600px]"
        )}>
          <div 
            className="h-full w-full relative select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none'
            }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            <Tree
              data={treeData}
              orientation="vertical"
              pathFunc="step"
              nodeSize={nodeSize}
              separation={separation}
              translate={translate}
              zoom={zoom}
              onNodeClick={handleNodeClick}
              renderCustomNodeElement={(rd3tProps) => 
                <CustomNode 
                  {...rd3tProps} 
                  onExpand={expandNode}
                  isExpanding={expandingNodeId}
                  expandedNodes={expandedNodes}
                />
              }
              enableLegacyTransitions={true}
              transitionDuration={300}
              collapsible={true}
              initialDepth={2}
            />
          </div>
        </div>

        {/* Node Details Panel */}
        {!isFullscreen && (
          <div className="space-y-4">
            {selectedNode ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: levelColors[(selectedNode.attributes?.level || 'beginner') as keyof typeof levelColors] }}
                    />
                    {selectedNode.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedNode.attributes?.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Level and Time */}
                  <div className="flex gap-2">
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: levelColors[(selectedNode.attributes?.level || 'beginner') as keyof typeof levelColors],
                        color: levelColors[(selectedNode.attributes?.level || 'beginner') as keyof typeof levelColors]
                      }}
                    >
                      {selectedNode.attributes?.level?.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedNode.attributes?.estimatedTime}
                    </Badge>
                  </div>

                  {/* Prerequisites */}
                  {selectedNode.attributes?.prerequisites?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-red-500" />
                        Prerequisites
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.attributes.prerequisites.map((prereq: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {prereq}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Topics */}
                  {selectedNode.attributes?.keyTopics?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-500" />
                        Key Topics
                      </h4>
                      <ul className="text-sm space-y-1">
                        {selectedNode.attributes.keyTopics.map((topic: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Learning Resources */}
                  {selectedNode.attributes?.learningResources?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-500" />
                        Learning Resources
                      </h4>
                      <div className="space-y-2">
                        {selectedNode.attributes.learningResources.map((resource: any, index: number) => (
                          <div key={index} className="p-2 rounded bg-muted/50">
                            <div className="font-medium text-sm">{resource.title}</div>
                            <div className="text-xs text-muted-foreground">{resource.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practice Projects */}
                  {selectedNode.attributes?.practiceProjects?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-500" />
                        Practice Projects
                      </h4>
                      <ul className="text-sm space-y-1">
                        {selectedNode.attributes.practiceProjects.map((project: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                            {project}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Information about tree expansion */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Interactive Tree</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click the green <strong>+</strong> button on any node to expand it with AI-generated child topics. 
                      Expanded nodes show a <strong>✓</strong> checkmark.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click on any node in the tree to see detailed information</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Level Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(levelColors).map(([level, color]) => (
                  <div key={level} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm capitalize">{level}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p><strong>Tree Navigation:</strong> Click on nodes with children to expand/collapse branches</p>
            <p><strong>Node Details:</strong> Click anywhere on a node to see detailed learning information</p>
            <p><strong>Controls:</strong> Use zoom controls and reset view button for better navigation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}