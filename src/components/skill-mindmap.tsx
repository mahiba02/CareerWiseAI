"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  Lightbulb, 
  Target,
  CheckCircle,
  Circle,
  Folder,
  FolderOpen,
  Brain,
  Zap,
  Award,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { GenerateSkillMindMapOutput } from "@/ai/flows/generate-skill-mindmap";

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

const levelColors = {
  beginner: "bg-green-100 text-green-800 border-green-300",
  intermediate: "bg-blue-100 text-blue-800 border-blue-300", 
  advanced: "bg-orange-100 text-orange-800 border-orange-300",
  expert: "bg-purple-100 text-purple-800 border-purple-300",
};

const levelIcons = {
  beginner: <Circle className="w-4 h-4" />,
  intermediate: <Target className="w-4 h-4" />,
  advanced: <Zap className="w-4 h-4" />,
  expert: <Award className="w-4 h-4" />,
};

const resourceTypeIcons = {
  tutorial: <BookOpen className="w-4 h-4 text-blue-500" />,
  project: <Folder className="w-4 h-4 text-green-500" />,
  practice: <Target className="w-4 h-4 text-orange-500" />,
  reading: <Brain className="w-4 h-4 text-purple-500" />,
};

interface MindMapNodeProps {
  node: MindMapNode;
  depth: number;
  onNodeComplete?: (nodeId: string) => void;
  completedNodes?: Set<string>;
}

function MindMapNodeComponent({ node, depth, onNodeComplete, completedNodes = new Set() }: MindMapNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const [showDetails, setShowDetails] = useState(false);
  
  const hasChildren = node.children && node.children.length > 0;
  const isCompleted = completedNodes.has(node.id);
  const maxDepth = 6;

  if (depth > maxDepth) return null;

  const handleToggleComplete = () => {
    if (onNodeComplete) {
      onNodeComplete(node.id);
    }
  };

  return (
    <div className={cn("relative", depth > 0 && "ml-6 mt-4")}>
      {/* Connection line for child nodes */}
      {depth > 0 && (
        <div className="absolute -left-6 top-6 w-6 h-0.5 bg-border"></div>
      )}
      
      {/* Vertical line for children */}
      {depth > 0 && hasChildren && isExpanded && (
        <div className="absolute -left-6 top-6 w-0.5 bg-border" style={{ height: 'calc(100% - 24px)' }}></div>
      )}

      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        isCompleted && "ring-2 ring-green-500 bg-green-50",
        depth === 0 && "shadow-lg border-2"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 h-6 w-6"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}
                
                {hasChildren ? (
                  isExpanded ? <FolderOpen className="w-5 h-5 text-primary" /> : <Folder className="w-5 h-5 text-primary" />
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center">
                    {levelIcons[node.level]}
                  </div>
                )}
                
                <CardTitle className={cn(
                  "text-lg leading-tight",
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  {node.name}
                </CardTitle>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={levelColors[node.level]}>
                  {node.level}
                </Badge>
                
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {node.estimatedTime}
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleComplete}
                  className={cn(
                    "ml-auto",
                    isCompleted ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <CardDescription className="text-sm leading-relaxed">
            {node.description}
          </CardDescription>
        </CardHeader>

        {/* Expandable details section */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-sm text-muted-foreground">
              <Lightbulb className="w-4 h-4 mr-2" />
              {showDetails ? 'Hide Details' : 'Show Learning Details'}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Prerequisites */}
              {node.prerequisites && Array.isArray(node.prerequisites) && node.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    Prerequisites
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {node.prerequisites.map((prereq, index) => (
                      <Badge key={`prereq-${index}`} variant="outline" className="text-xs">
                        {prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Topics */}
              {node.keyTopics && Array.isArray(node.keyTopics) && node.keyTopics.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    Key Topics
                  </h4>
                  <ul className="text-sm space-y-1">
                    {node.keyTopics.map((topic, index) => (
                      <li key={`topic-${index}`} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Resources */}
              {node.learningResources && Array.isArray(node.learningResources) && node.learningResources.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    Learning Resources
                  </h4>
                  <div className="space-y-2">
                    {node.learningResources.map((resource, index) => (
                      <div key={`resource-${index}`} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                        {resourceTypeIcons[resource.type]}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{resource.title}</div>
                          <div className="text-xs text-muted-foreground">{resource.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Projects */}
              {node.practiceProjects && Array.isArray(node.practiceProjects) && node.practiceProjects.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Practice Projects
                  </h4>
                  <ul className="text-sm space-y-1">
                    {node.practiceProjects.map((project, index) => (
                      <li key={`project-${index}`} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                        {project}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>

        {/* Children nodes */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {node.children!.map((child, index) => (
              <MindMapNodeComponent
                key={`${child.id}-${index}`}
                node={child}
                depth={depth + 1}
                onNodeComplete={onNodeComplete}
                completedNodes={completedNodes}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

interface SkillMindMapProps {
  mindMapData: GenerateSkillMindMapOutput["mindMap"];
}

export default function SkillMindMap({ mindMapData }: SkillMindMapProps) {
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());

  const handleNodeComplete = (nodeId: string) => {
    setCompletedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const calculateProgress = () => {
    const totalNodes = countNodes(mindMapData.root);
    const completedCount = completedNodes.size;
    return totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;
  };

  const countNodes = (node: MindMapNode): number => {
    let count = 1;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + countNodes(child), 0);
    }
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{mindMapData.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {mindMapData.description}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Total Time: {mindMapData.totalEstimatedTime}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Progress: {calculateProgress()}%
          </Badge>
        </div>
      </div>

      {/* Mind Map */}
      <div className="max-w-4xl mx-auto">
        <MindMapNodeComponent
          node={mindMapData.root as MindMapNode}
          depth={0}
          onNodeComplete={handleNodeComplete}
          completedNodes={completedNodes}
        />
      </div>
    </div>
  );
}