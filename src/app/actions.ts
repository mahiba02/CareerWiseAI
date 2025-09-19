"use server";

import { generatePersonalizedCareerReport } from "@/ai/flows/generate-personalized-career-report";
import type { GeneratePersonalizedCareerReportOutput } from "@/ai/flows/generate-personalized-career-report";
import { getResourceRecommendations } from "@/ai/flows/get-resource-recommendations";
import type { GetResourceRecommendationsOutput } from "@/ai/flows/get-resource-recommendations";
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
