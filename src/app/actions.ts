"use server";

import { generatePersonalizedCareerReport } from "@/ai/flows/generate-personalized-career-report";
import type { GeneratePersonalizedCareerReportOutput } from "@/ai/flows/generate-personalized-career-report";
import { getResourceRecommendations } from "@/ai/flows/get-resource-recommendations";
import type { GetResourceRecommendationsOutput } from "@/ai/flows/get-resource-recommendations";
import { generateSkillMindMap } from "@/ai/flows/generate-skill-mindmap";
import type { GenerateSkillMindMapOutput } from "@/ai/flows/generate-skill-mindmap";
import { expandSkillNode } from "@/ai/flows/expand-skill-node";
import type { ExpandNodeInput, ExpandNodeOutput } from "@/ai/flows/expand-skill-node";
import { profileFormSchema, type ProfileFormValues, resourceFormSchema, type ResourceFormValues } from "@/lib/schemas";


type ReportActionResult = {
  success: boolean;
  data?: GeneratePersonalizedCareerReportOutput | null;
  error?: string;
};

export async function generateReportAction(values: ProfileFormValues): Promise<ReportActionResult> {
  const validatedFields = profileFormSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid form data.",
    };
  }

  const { degree, year, skills, q1, q2, q3, q4, q5 } = validatedFields.data;

  const input = {
    profile: {
      degree,
      year,
      skills,
    },
    quizAnswers: [q1, q2, q3, q4, q5],
  };

  try {
    const report = await generatePersonalizedCareerReport(input);
    return { success: true, data: report };
  } catch (error) {
    console.error("Error generating report:", error);
    return { success: false, error: "Failed to generate your career report. Please try again." };
  }
}

type ResourceActionResult = {
    success: boolean;
    data?: GetResourceRecommendationsOutput | null;
    error?: string;
};

export async function getResourcesAction(values: ResourceFormValues): Promise<ResourceActionResult> {
    const validatedFields = resourceFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            success: false,
            error: "Invalid form data.",
        };
    }

    const { skill } = validatedFields.data;

    try {
        const resources = await getResourceRecommendations({ skill });
        return { success: true, data: resources };
    } catch (error) {
        console.error("Error getting resources:", error);
        return { success: false, error: "Failed to get learning resources. Please try again." };
    }
}

type MindMapActionResult = {
    success: boolean;
    data?: GenerateSkillMindMapOutput | null;
    error?: string;
};

export async function generateMindMapAction(values: { skill: string; targetLevel?: string; currentLevel?: string }): Promise<MindMapActionResult> {
    console.log('generateMindMapAction called with:', values);
    
    if (!values.skill || values.skill.trim().length === 0) {
        return {
            success: false,
            error: "Skill is required.",
        };
    }

    const input = {
        skill: values.skill.trim(),
        targetLevel: values.targetLevel as any || 'expert',
        currentLevel: values.currentLevel as any || 'none',
    };

    console.log('Calling generateSkillMindMap with input:', input);

    try {
        const mindMap = await generateSkillMindMap(input);
        console.log('Generated mind map result:', JSON.stringify(mindMap, null, 2));
        return { success: true, data: mindMap };
    } catch (error) {
        console.error("Error generating mind map:", error);
        return { success: false, error: "Failed to generate skill mind map. Please try again." };
    }
}

type ExpandNodeActionResult = {
    success: boolean;
    data?: ExpandNodeOutput | null;
    error?: string;
};

export async function expandNodeAction(values: {
    nodeName: string;
    nodeDescription: string;
    nodeLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    parentSkill: string;
    currentLevel?: 'none' | 'beginner' | 'intermediate' | 'advanced';
}): Promise<ExpandNodeActionResult> {
    console.log('expandNodeAction called with:', values);
    
    if (!values.nodeName || values.nodeName.trim().length === 0) {
        return {
            success: false,
            error: "Node name is required.",
        };
    }

    const input: ExpandNodeInput = {
        nodeName: values.nodeName.trim(),
        nodeDescription: values.nodeDescription || 'No description available',
        nodeLevel: values.nodeLevel,
        parentSkill: values.parentSkill || 'Unknown Skill',
        currentLevel: values.currentLevel || 'none',
    };

    console.log('Calling expandSkillNode with input:', input);

    try {
        const expansion = await expandSkillNode(input);
        console.log('Generated node expansion:', JSON.stringify(expansion, null, 2));
        return { success: true, data: expansion };
    } catch (error) {
        console.error("Error expanding node:", error);
        return { success: false, error: "Failed to expand node content. Please try again." };
    }
}
