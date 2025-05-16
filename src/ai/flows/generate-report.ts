'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating research reports based on analyzed data and chat history.
 *
 * - generateReport - A function that generates a research report.
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportInputSchema = z.object({
  analyzedData: z.string().describe('The analyzed data to be included in the report.'),
  chatHistory: z.string().describe('The chat history to be used for context in the report.'),
  reportType: z.enum(['summary', 'detailed']).default('summary').describe('The type of report to generate.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  report: z.string().describe('The generated research report.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are an AI research assistant. Your task is to generate a research report based on the analyzed data and chat history provided.

Analyzed Data: {{{analyzedData}}}
Chat History: {{{chatHistory}}}

Report Type: {{{reportType}}}

Based on the analyzed data and chat history, generate a {{reportType}} research report. The report should be well-structured and easy to understand.
`, // Changed from triple quotes to backticks for better readability
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
