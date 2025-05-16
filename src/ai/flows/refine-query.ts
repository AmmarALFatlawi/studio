// src/ai/flows/refine-query.ts
'use server';

/**
 * @fileOverview Refines a casual research question into a precise academic query using AI.
 *
 * - refineQuery - A function that refines the query.
 * - RefineQueryInput - The input type for the refineQuery function.
 * - RefineQueryOutput - The return type for the refineQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineQueryInputSchema = z.object({
  query: z.string().describe('The casual research question to refine.'),
});
export type RefineQueryInput = z.infer<typeof RefineQueryInputSchema>;

const RefineQueryOutputSchema = z.object({
  refinedQuery: z.string().describe('The precise academic query.'),
});
export type RefineQueryOutput = z.infer<typeof RefineQueryOutputSchema>;

export async function refineQuery(input: RefineQueryInput): Promise<RefineQueryOutput> {
  return refineQueryFlow(input);
}

const refineQueryPrompt = ai.definePrompt({
  name: 'refineQueryPrompt',
  input: {schema: RefineQueryInputSchema},
  output: {schema: RefineQueryOutputSchema},
  prompt: `You are an expert academic research assistant. Your task is to refine a user's casual question into a precise academic-style search query.

Here are some examples:

User: "Does caffeine help with memory in old people?"
Refined: "Effect of caffeine intake on cognitive function in elderly adults"

User: "Can AI help doctors diagnose cancer?"
Refined: "Use of artificial intelligence in early-stage cancer diagnosis among clinicians"

User Question: {{{query}}}
Refined:`, // Removed extra newline here
});

const refineQueryFlow = ai.defineFlow(
  {
    name: 'refineQueryFlow',
    inputSchema: RefineQueryInputSchema,
    outputSchema: RefineQueryOutputSchema,
  },
  async input => {
    const {output} = await refineQueryPrompt(input);
    return output!;
  }
);
