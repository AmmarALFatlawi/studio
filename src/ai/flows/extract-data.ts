'use server';
/**
 * @fileOverview This file defines a Genkit flow for extracting key data from research papers.
 *
 * The flow takes a research paper's content as input and extracts information such as sample size, methods, and findings.
 * It returns a structured object containing the extracted data.
 *
 * @file
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDataInputSchema = z.object({
  paperContent: z.string().describe('The content of the research paper.'),
});

export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

const ExtractDataOutputSchema = z.object({
  sampleSize: z.string().describe('The sample size used in the study.'),
  methods: z.string().describe('The methods used in the study.'),
  findings: z.string().describe('The key findings of the study.'),
});

export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

const extractDataPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: {schema: ExtractDataInputSchema},
  output: {schema: ExtractDataOutputSchema},
  prompt: `You are a research assistant tasked with extracting key data from research papers.\n\nGiven the following research paper content, extract the sample size, methods, and key findings.\n\nPaper Content: {{{paperContent}}}\n\nPresent the extracted data in a structured format.\n\nSample Size:\nMethods:\nFindings:\n`,
});

const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async input => {
    const {output} = await extractDataPrompt(input);
    return output!;
  }
);
