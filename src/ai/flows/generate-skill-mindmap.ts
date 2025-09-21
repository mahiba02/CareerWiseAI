"use server";

/**
 * @fileOverview AI-powered skill mind map generator that creates comprehensive learning trees
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Mind map node structure
const MindMapNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().describe('Unique identifier for the node'),
  name: z.string().describe('The name of the skill or concept'),
  description: z.string().describe('Detailed explanation of what this skill involves'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).describe('Difficulty level'),
  estimatedTime: z.string().describe('Estimated time to learn this skill (e.g., "2 weeks", "1 month")'),
  prerequisites: z.array(z.string()).optional().describe('List of prerequisite skills'),
  learningResources: z.array(z.object({
    type: z.enum(['tutorial', 'project', 'practice', 'reading']),
    title: z.string(),
    description: z.string(),
  })).optional().describe('Specific learning activities for this skill'),
  practiceProjects: z.array(z.string()).optional().describe('Hands-on projects to reinforce learning'),
  keyTopics: z.array(z.string()).optional().describe('Important subtopics within this skill'),
  children: z.array(MindMapNodeSchema).optional().describe('Sub-skills or components'),
  isExpandable: z.boolean().describe('Whether this node has detailed sub-components'),
}));

const GenerateSkillMindMapInputSchema = z.object({
  skill: z.string().describe('The skill to create a mind map for'),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional().describe('Target mastery level'),
  currentLevel: z.enum(['none', 'beginner', 'intermediate', 'advanced']).optional().describe('Current skill level'),
});

export type GenerateSkillMindMapInput = z.infer<typeof GenerateSkillMindMapInputSchema>;

const GenerateSkillMindMapOutputSchema = z.object({
  mindMap: z.object({
    title: z.string().describe('Title of the mind map'),
    description: z.string().describe('Overview of the learning path'),
    totalEstimatedTime: z.string().describe('Total estimated time to complete the full learning path'),
    root: MindMapNodeSchema.describe('The root node of the mind map'),
  }),
});

export type GenerateSkillMindMapOutput = z.infer<typeof GenerateSkillMindMapOutputSchema>;

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

const prompt = ai.definePrompt({
  name: 'generateSkillMindMapPrompt',
  input: { schema: GenerateSkillMindMapInputSchema },
  output: { schema: GenerateSkillMindMapOutputSchema },
  prompt: `Create a comprehensive learning mind map for the skill "{{{skill}}}".

Target Level: {{{targetLevel}}}
Current Level: {{{currentLevel}}}

Generate a structured learning tree with:

1. A root node representing the main skill
2. 3-5 child nodes representing major areas/topics within this skill
3. Each node should have:
   - A clear, descriptive name
   - A detailed description (2-3 sentences)
   - Appropriate difficulty level (beginner/intermediate/advanced/expert)
   - Realistic time estimate (e.g., "2 weeks", "1 month")
   - List of key topics to learn
   - At least one practice project suggestion

Structure the response as a mind map with:
- title: "Mastering {{{skill}}}"
- description: Brief overview of the learning path
- totalEstimatedTime: Total time needed
- root: The main skill node with children representing major learning areas

Focus on creating a practical, actionable learning roadmap that progresses logically from basic to advanced concepts.`,
});

const generateSkillMindMapFlow = ai.defineFlow(
  {
    name: 'generateSkillMindMapFlow',
    inputSchema: GenerateSkillMindMapInputSchema,
    outputSchema: GenerateSkillMindMapOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateSkillMindMap(
  input: GenerateSkillMindMapInput,
): Promise<GenerateSkillMindMapOutput> {
  return await retryWithBackoff(
    () => generateSkillMindMapFlow(input),
    3,
  );
}