// src/ai/flows/recommend-classes.ts
'use server';
/**
 * @fileOverview A class recommendation AI agent.
 *
 * - recommendClasses - A function that recommends classes based on user history and skill level.
 * - RecommendClassesInput - The input type for the recommendClasses function.
 * - RecommendClassesOutput - The return type for the recommendClasses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendClassesInputSchema = z.object({
  bookingHistory: z
    .string()
    .describe('The user booking history'),
  skillLevel: z.number().describe('The skill level of the user (e.g., 1.0, 1.5, ..., 7.0).'),
});
export type RecommendClassesInput = z.infer<typeof RecommendClassesInputSchema>;

const RecommendClassesOutputSchema = z.object({
  recommendedClasses: z
    .array(z.string())
    .describe('A list of recommended class descriptions based on the user history and skill level.'),
});
export type RecommendClassesOutput = z.infer<typeof RecommendClassesOutputSchema>;

export async function recommendClasses(input: RecommendClassesInput): Promise<RecommendClassesOutput> {
  return recommendClassesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendClassesPrompt',
  input: {schema: RecommendClassesInputSchema},
  output: {schema: RecommendClassesOutputSchema},
  prompt: `You are an AI assistant specializing in recommending classes to students in a Padel club.

  Based on the user's booking history and their skill level, recommend classes that would be a good fit for them.
  Consider the user's past activities and suggest classes that align with their interests and skill level.

  User Booking History: {{{bookingHistory}}}
  User Skill Level: {{{skillLevel}}}

  Provide a list of recommended class descriptions.
  Classes should be diverse and interesting to the user.
  Do not recommend similar classes.
  Keep the recommendations limited to at most 3 classes.
  If the user has no booking history, recommend popular classes for the given skill level.
  Do not include classes that do not fit the skill level.
  Be careful to never suggest classes that are above or below the skill level.
  Consider classes within 0.5 of the skill level. e.g., suggest classes for level 2 if the use skill level is 2.5
  `,
});

const recommendClassesFlow = ai.defineFlow(
  {
    name: 'recommendClassesFlow',
    inputSchema: RecommendClassesInputSchema,
    outputSchema: RecommendClassesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
