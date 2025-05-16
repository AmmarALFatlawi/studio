
'use server';
/**
 * @fileOverview A Genkit flow for extracting structured evidence from academic papers for the Deep Dive Notebook.
 *
 * - extractEvidence - A function that processes a paper's content and returns structured data.
 * - ExtractEvidenceInput - The input type for the extractEvidence function.
 * - ExtractedEvidenceData - The return type for the extractEvidence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractEvidenceInputSchema = z.object({
  paperContent: z.string().describe('The full text content of the academic paper.'),
});
export type ExtractEvidenceInput = z.infer<typeof ExtractEvidenceInputSchema>;

const ExtractedEvidenceDataSchema = z.object({
  title: z.string().describe('The full title of the paper.'),
  authors: z.array(z.string()).describe('List of authors as an array of strings.'),
  year: z.number().describe('Year of publication as a number.'),
  population: z.string().describe('Population or sample description (e.g., Adults aged 40-65, 150 university students).'),
  interventionOrTopic: z.string().describe('The main intervention, topic, or variable studied (e.g., 7+ hours of nightly sleep, Impact of social media).'),
  methodology: z.string().describe('Study methodology (e.g., RCT, Cross-sectional, Meta-analysis).'),
  keyResults: z.string().describe('Concise 1-2 sentence summary of the main results or findings in plain English.'),
  quote: z.string().optional().describe('A direct quote from the paper supporting the key results. Can be "No specific quote available." if none is found.'),
});
export type ExtractedEvidenceData = z.infer<typeof ExtractedEvidenceDataSchema>;

export async function extractEvidence(input: ExtractEvidenceInput): Promise<ExtractedEvidenceData> {
  return extractEvidenceFlow(input);
}

const extractEvidencePrompt = ai.definePrompt({
  name: 'extractEvidencePrompt',
  input: {schema: ExtractEvidenceInputSchema},
  output: {schema: ExtractedEvidenceDataSchema},
  prompt: `You are an expert research assistant. Your task is to extract structured information from the provided academic paper text.

Paper Content:
{{{paperContent}}}

Extract the following fields and return them in a structured JSON format:
- title: The full title of the paper.
- authors: List of authors (array of strings).
- year: Year of publication (number).
- population: Population or sample description (e.g., "Adults aged 40-65", "150 university students").
- interventionOrTopic: The main intervention, topic, or variable studied (e.g., "7+ hours of nightly sleep", "Impact of social media on adolescents").
- methodology: Study methodology (e.g., "Randomized Controlled Trial (RCT)", "Cross-sectional study", "Literature Review").
- keyResults: A concise 1-2 sentence summary of the main findings in plain English.
- quote: A direct quote from the paper that supports the key findings. If no specific quote is readily available or applicable, use "No specific quote available.".

Example of expected output structure for a paper:
{
  "title": "The Effect of Sleep on Cognitive Function",
  "authors": ["J. Smith", "A. Lee"],
  "year": 2023,
  "population": "Adults aged 40–65",
  "interventionOrTopic": "7+ hours of nightly sleep",
  "methodology": "Randomized Controlled Trial (RCT)",
  "keyResults": "Participants who slept more than 7 hours showed a 15% improvement in memory recall tests.",
  "quote": "‘Our findings indicate a significant correlation between extended sleep duration and improved cognitive performance.’"
}

Ensure the output strictly adheres to the JSON schema provided.
`,
});

const extractEvidenceFlow = ai.defineFlow(
  {
    name: 'extractEvidenceFlow',
    inputSchema: ExtractEvidenceInputSchema,
    outputSchema: ExtractedEvidenceDataSchema,
  },
  async (input: ExtractEvidenceInput) => {
    const {output} = await extractEvidencePrompt(input);
    if (!output) {
      // This case should ideally be handled by Genkit's schema validation throwing an error
      // or by the LLM reliably returning data in the specified format.
      // Adding a fallback for robustness.
      console.error('Extract Evidence Flow: LLM did not return a valid structured output.');
      throw new Error('Failed to extract evidence from the paper. The model did not return the expected data structure.');
    }
    return output;
  }
);
