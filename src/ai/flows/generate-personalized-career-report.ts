'use server';

/**
 * @fileOverview A personalized career report generator AI agent.
 *
 * - generatePersonalizedCareerReport - A function that handles the career report generation process.
 * - GeneratePersonalizedCareerReportInput - The input type for the generatePersonalizedCareerReport function.
 * - GeneratePersonalizedCareerReportOutput - The return type for the generatePersonalizedCareerReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedCareerReportInputSchema = z.object({
  profile: z.object({
    degree: z.string().describe('The degree/major of the student.'),
    year: z.string().describe('The year of study of the student.'),
    skills: z.string().describe('The technical skills of the student, comma-separated.'),
  }).describe('The academic profile of the student.'),
  quizAnswers: z.array(z.string()).describe('The answers to the psychometric quiz.'),
});
export type GeneratePersonalizedCareerReportInput = z.infer<typeof GeneratePersonalizedCareerReportInputSchema>;

// Recursive skill tree node
const SkillTreeNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    name: z.string().describe('The name of the skill or category.'),
    description: z.string().optional().describe('A brief explanation of why this skill category is important.'),
    projectIdea: z.string().optional().describe('A small, actionable project idea for this skill.'),
    proTip: z.string().optional().describe('An insider tip or advice related to the skill.'),
    children: z.array(SkillTreeNodeSchema).optional().describe('Sub-skills or topics.'),
  })
);

const GeneratePersonalizedCareerReportOutputSchema = z.object({
  careerRecommendations: z.array(z.object({
    title: z.string().describe('The title of the career recommendation.'),
    description: z.string().describe('The description of the career recommendation.'),
  })).describe('The top 3 career recommendations for the student.'),
  fitReasoning: z.array(z.object({
    title: z.string().describe('The title of the career recommendation.'),
    reason: z.string().describe('The reasoning behind why this career is a good fit for the student.'),
  })).describe('The reasoning behind why each career recommendation is a good fit for the student.'),
  learningPlans: z.array(z.object({
    skill: z.string().describe('The skill to be learned.'),
    plan: z.array(z.object({
      day: z.number().describe('The day of the learning plan.'),
      task: z.string().describe('The task to be completed on this day.'),
    })).describe('The 7-day learning plan for the skill.'),
  })).describe('A list of personalized 7-day learning plans for the student based on recommended careers.'),
  // Note: Using z.any() for root to avoid recursive JSON schema emission warnings in tooling
  skillTree: z.object({
    title: z.string().describe('The title of the skill tree, usually for the top career recommendation.'),
    root: z.any().describe('The root node of the skill tree.'),
  }).describe('A hierarchical skill tree for the top recommended career.'),
});
export type GeneratePersonalizedCareerReportOutput = z.infer<typeof GeneratePersonalizedCareerReportOutputSchema>;

async function retryWithBackoff<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const isOverloaded = (err?.status === 503) || /overloaded|unavailable/i.test(String(err?.message || ''));
      if (i < attempts - 1 && isOverloaded) {
        const delay = 500 * Math.pow(2, i); // 500ms, 1s, 2s
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

export async function generatePersonalizedCareerReport(
  input: GeneratePersonalizedCareerReportInput,
): Promise<GeneratePersonalizedCareerReportOutput> {
  return await retryWithBackoff(
    () => generatePersonalizedCareerReportFlow(input),
    3,
  );
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedCareerReportPrompt',
  input: { schema: GeneratePersonalizedCareerReportInputSchema },
  output: { schema: GeneratePersonalizedCareerReportOutputSchema },
  prompt: `You are an expert career coach and curriculum designer specializing in guiding university students in India towards their dream tech careers. Your tone is motivational, encouraging, and knowledgeable.

Your primary goal is to generate a comprehensive and personalized career report. The centerpiece of this report is a hierarchical "Skill Tree" for the student's top career recommendation.

Instructions for the Skill Tree:

1. Hierarchical Structure: The tree must be deeply nested. Start with broad, foundational domains (like "Core CS Fundamentals", "Programming Languages") and break them down into specific technologies, libraries, and individual concepts.
2. Add Explanations: For each major category (any node that has children), include a brief \`description\` explaining why this skill area is crucial for the career path.
3. Make it Actionable: For specific, learnable skills (usually leaf nodes), provide a practical \`projectIdea\`. This should be a small, tangible project that helps the student apply the skill and build their portfolio.
4. Provide Insider Tips: Where appropriate, add a \`proTip\` to offer advice, suggest a best practice, or recommend a type of resource.
5. Personalize: Tailor the emphasis of the tree based on the student's existing skills, making it a truly personalized roadmap.

Student Profile:
- Degree: {{{profile.degree}}}
- Year of Study: {{{profile.year}}}
- Existing Skills: {{{profile.skills}}}
- Quiz Answers: {{{quizAnswers}}}

Output Format:
You must respond with a valid JSON object. In addition to the \`careerRecommendations\`, \`fitReasoning\`, and \`learningPlans\`, create the \`skillTree\` object precisely in this structure:

{
  "careerRecommendations": [ ... ],
  "fitReasoning": [ ... ],
  "learningPlans": [ ... ],
  "skillTree": {
    "title": "Skill Tree for <Top Career>",
    "root": {
      "name": "<Root Name>",
      "description": "<Root description>",
      "children": [ { "name": "...", "description": "...", "children": [ ... ] } ]
    }
  }
}
`,
});

const generatePersonalizedCareerReportFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedCareerReportFlow',
    inputSchema: GeneratePersonalizedCareerReportInputSchema,
    outputSchema: GeneratePersonalizedCareerReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
