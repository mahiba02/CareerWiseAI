"use server";

/**
 * @fileOverview AI-powered node expansion for skill tree visualization
 * Generates detailed breakdowns when users click on tree nodes
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for expanded node content - now returns actual child nodes
const ChildNodeSchema = z.object({
  id: z.string().describe('Unique identifier'),
  name: z.string().describe('Name of the child topic'),
  description: z.string().describe('Detailed explanation'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).describe('Difficulty level'),
  estimatedTime: z.string().describe('Time to learn this subtopic'),
  prerequisites: z.array(z.string()).optional().describe('What to learn first'),
  learningResources: z.array(z.object({
    type: z.enum(['tutorial', 'documentation', 'video', 'practice', 'project']),
    title: z.string(),
    description: z.string(),
  })).optional().describe('Learning resources'),
  practiceProjects: z.array(z.string()).optional().describe('Hands-on projects'),
  keyTopics: z.array(z.string()).describe('Important subtopics within this skill'),
  isExpandable: z.boolean().describe('Whether this node can be further expanded'),
});

const ExpandedNodeContentSchema = z.object({
  childNodes: z.array(ChildNodeSchema).describe('Child nodes to add to the tree'),
  summary: z.string().describe('Brief overview of what this expansion covers'),
  totalEstimatedTime: z.string().describe('Total time for all child nodes'),
});

const ExpandNodeInputSchema = z.object({
  nodeName: z.string().describe('The name of the node to expand'),
  nodeDescription: z.string().describe('Current description of the node'),
  nodeLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).describe('Current difficulty level'),
  parentSkill: z.string().describe('The main skill this node belongs to'),
  currentLevel: z.enum(['none', 'beginner', 'intermediate', 'advanced']).optional().describe('User current skill level'),
});

export type ExpandNodeInput = z.infer<typeof ExpandNodeInputSchema>;

const ExpandNodeOutputSchema = z.object({
  expansion: ExpandedNodeContentSchema,
});

export type ExpandNodeOutput = z.infer<typeof ExpandNodeOutputSchema>;

// Retry logic for API calls
async function retryWithBackoff<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const isOverloaded = (err?.status === 503) || /overloaded|unavailable/i.test(String(err?.message || ''));
      if (i < attempts - 1 && isOverloaded) {
        const delay = 500 * Math.pow(2, i);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

const expandNodePrompt = ai.definePrompt({
  name: 'expandNodePrompt',
  input: { schema: ExpandNodeInputSchema },
  output: { schema: ExpandNodeOutputSchema },
  prompt: `You are an expert educator creating a learning tree. A user wants to expand the node "{{{nodeName}}}" in their {{{parentSkill}}} learning tree.

Current Node Details:
- Name: {{{nodeName}}}
- Description: {{{nodeDescription}}}
- Level: {{{nodeLevel}}}
- User's Current Level: {{{currentLevel}}}

Generate 4-6 child nodes that break down "{{{nodeName}}}" into specific, learnable components.

For example, if the node is "Foundational Math & Programming", the child nodes might be:
- "Linear Algebra"
- "Calculus"
- "Probability & Statistics" 
- "Python Programming"
- "Data Structures"
- "Algorithms"

For each child node, provide:

1. **Clear, specific name** (e.g., "Linear Algebra", "Convolutional Neural Networks")
2. **Detailed description** (2-3 sentences explaining what this involves)
3. **Appropriate difficulty level** (should progress logically from the parent)
4. **Realistic time estimate** (e.g., "2-3 weeks", "1 month")
5. **Key topics list** (3-5 specific things to learn within this node)
6. **Prerequisites** (what needs to be learned first)
7. **Learning resources** (2-3 specific learning activities)
8. **Practice projects** (1-2 hands-on projects)
9. **isExpandable: true** (so users can expand these nodes further)

Make sure the child nodes:
- Are **specific and actionable** learning units
- **Cover all important aspects** of the parent node
- **Progress logically** in difficulty
- Can be **further expanded** into more detailed subtopics
- Are **practical** and focused on real learning outcomes

The goal is to create child nodes that users can click on to expand even further, building a comprehensive learning tree.`,
});

const expandNodeFlow = ai.defineFlow(
  {
    name: 'expandNodeFlow',
    inputSchema: ExpandNodeInputSchema,
    outputSchema: ExpandNodeOutputSchema,
  },
  async input => {
    const { output } = await expandNodePrompt(input);
    return output!;
  }
);

export async function expandSkillNode(
  input: ExpandNodeInput,
): Promise<ExpandNodeOutput> {
  return await retryWithBackoff(
    () => expandNodeFlow(input),
    3,
  );
}