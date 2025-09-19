"use client";

import { cn } from "@/lib/utils";
import { Folder, FileText, Lightbulb, TestTube2, BookOpen } from "lucide-react";
import type { GeneratePersonalizedCareerReportOutput } from "@/ai/flows/generate-personalized-career-report";

type SkillNode = {
  name: string;
  description?: string;
  projectIdea?: string;
  proTip?: string;
  children?: SkillNode[];
};

type SkillTreeProps = {
  tree: GeneratePersonalizedCareerReportOutput["skillTree"];
};

const TreeNode = ({ node, isLast }: { node: SkillNode; isLast: boolean }) => {
  const hasChildren = node.children && node.children.length > 0;
  const Icon = hasChildren ? Folder : FileText;

  return (
    <div className={cn("relative", !isLast && "pb-6")}>      
      {!isLast && <div className="absolute top-2 left-[7px] w-0.5 h-full bg-border -z-10"></div>}
      
      <div className="flex items-start">
        <div className="flex-shrink-0 h-5 flex items-center">
            <div className="w-[7px]"></div>
            <div className="w-4 border-b border-border"></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center pt-0.5">
            <Icon className="w-4 h-4 mr-2 text-primary shrink-0" />
            <span className={cn("font-semibold text-lg", { "text-foreground": hasChildren, "text-foreground/80": !hasChildren })}>
              {node.name}
            </span>
          </div>

          <div className="pl-6 mt-1 space-y-3">
            {node.description && (
                <div className="flex items-start gap-2 text-muted-foreground">
                    <BookOpen className="w-4 h-4 mt-1 shrink-0" />
                    <p className="text-sm">{node.description}</p>
                </div>
            )}
            {node.projectIdea && (
                <div className="flex items-start gap-2 text-muted-foreground">
                    <TestTube2 className="w-4 h-4 mt-1 shrink-0 text-blue-500" />
                    <p className="text-sm"><span className="font-semibold text-foreground/90">Project Idea:</span> {node.projectIdea}</p>
                </div>
            )}
            {node.proTip && (
                <div className="flex items-start gap-2 text-muted-foreground">
                    <Lightbulb className="w-4 h-4 mt-1 shrink-0 text-yellow-500" />
                    <p className="text-sm"><span className="font-semibold text-foreground/90">Pro Tip:</span> {node.proTip}</p>
                </div>
            )}

            {hasChildren && (
              <div className="pt-2">
                {node.children?.map((child, index) => (
                  <TreeNode key={index} node={child} isLast={index === node.children!.length - 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function SkillTree({ tree }: SkillTreeProps) {
  if (!tree || !tree.root) {
    return null;
  }

  return (
    <section>
      <h2 className="text-3xl font-bold mb-4">
         {tree.title}
      </h2>
      <div className="p-6 rounded-lg bg-card border">
        <TreeNode node={tree.root as SkillNode} isLast={true} />
      </div>
    </section>
  );
}
