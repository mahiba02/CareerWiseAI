'use server';

/**
 * @fileOverview A career recommendation AI agent.
 *
 * - getCareerRecommendations - A function that handles the career recommendation process.
 * - CareerRecommendationsInput - The input type for the getCareerRecommendations function.
 * - CareerRecommendationsOutput - The return type for the getCareerRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CareerRecommendationsInputSchema = z.object({
  profile: z.object({
    degree: z.string().describe('The user\'s degree/major.'),
    year: z.string().describe('The user\'s year of study.'),
    skills: z.string().describe('The user\'s technical skills, comma-separated.'),
  }).describe('The user\'s academic profile.'),
  quizAnswers: z.array(z.string()).describe('The user\'s answers to the psychometric quiz.'),
});
export type CareerRecommendationsInput = z.infer<typeof CareerRecommendationsInputSchema>;

const CareerRecommendationsOutputSchema = z.object({
  careerRecommendations: z.array(z.object({
    title: z.string().describe('The title of the career recommendation.'),
    description: z.string().describe('A brief description of the career recommendation.'),
  })).describe('A list of career recommendations.'),
  fitReasoning: z.array(z.object({
    title: z.string().describe('The title of the career recommendation.'),
    reason: z.string().describe('The reason why this career is a good fit for the user.'),
  })).describe('A list of reasons why each career is a good fit for the user.'),
  learningPlan: z.object({
    skill: z.string().describe('A key skill to develop.'),
    plan: z.array(z.object({
      day: z.number().describe('The day number.'),
      task: z.string().describe('A task to complete on this day.'),
    })).describe('A 7-day learning plan to develop the skill.'),
  }).describe('A learning plan to help the user get started.'),
});
export type CareerRecommendationsOutput = z.infer<typeof CareerRecommendationsOutputSchema>;

export async function getCareerRecommendations(input: CareerRecommendationsInput): Promise<CareerRecommendationsOutput> {
  return recommendationsToolFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendationsToolPrompt',
  input: {schema: CareerRecommendationsInputSchema},
  output: {schema: CareerRecommendationsOutputSchema},
  prompt: `You are a career advisor specializing in providing personalized career recommendations to university students in India.

  Based on the student's academic profile and psychometric quiz results, provide the top 3 career recommendations, explain why each career is a good fit for the student, and provide a 7-day learning plan to help the student get started in one of the recommended career paths.

  Academic Profile:
  Degree: {{{profile.degree}}}
  Year of Study: {{{profile.year}}}
  Technical Skills: {{{profile.skills}}}

  Psychometric Quiz Results: {{{quizAnswers}}}

  Respond with a JSON object with the following structure:
  {
    "careerRecommendations": [
      {"title": "Career Title", "description": "Career Description"},
      {"title": "Career Title", "description": "Career Description"},
      {"title": "Career Title", "description": "Career Description"}
    ],
    "fitReasoning": [
      {"title": "Career Title", "reason": "Reason why this career is a good fit"},
      {"title": "Career Title", "reason": "Reason why this career is a good fit"},
      {"title": "Career Title", "reason": "Reason why this career is a good fit"}
    ],
    "learningPlan": {
      "skill": "Skill to develop",
      "plan": [
        {"day": 1, "task": "Task for day 1"},
        {"day": 2, "task": "Task for day 2"},
        {"day": 3, "task": "Task for day 3"},
        {"day": 4, "task": "Task for day 4"},
        {"day": 5, "task": "Task for day 5"},
        {"day": 6, "task": "Task for day 6"},
        {"day": 7, "task": "Task for day 7"}
      ]
    }
  }
  `,
});

const recommendationsToolFlow = ai.defineFlow(
  {
    name: 'recommendationsToolFlow',
    inputSchema: CareerRecommendationsInputSchema,
    outputSchema: CareerRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
