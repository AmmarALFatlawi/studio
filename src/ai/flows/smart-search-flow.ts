
'use server';
/**
 * @fileOverview A Genkit flow to perform smart academic searches and return structured results.
 *
 * - smartSearch - A function that takes a user query and returns a list of relevant studies.
 * - SmartSearchInput - The input type for the smartSearch function.
 * - SmartSearchOutput - The return type for the smartSearch function, containing an array of studies.
 * - Study - The structure for an individual academic study.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSearchInputSchema = z.object({
  userQuery: z.string().describe('The user query in plain English.'),
  // Optionally, PDF content could be added here later
  // pdfContent: z.string().optional().describe('The content of an uploaded PDF document.')
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const StudySchema = z.object({
  title: z.string().describe('Full title of the paper.'),
  authors: z.array(z.string()).describe('List of authors as an array of strings.'),
  year: z.number().describe('Year of publication as a number.'),
  studyType: z.string().describe('Type of study (e.g., RCT, Meta-analysis).'),
  sampleSize: z.string().describe('Sample size (e.g., "150 participants", "N/A for review").'),
  keyFindings: z.string().describe('A concise 1-2 sentence summary of the main findings in plain English.'),
  supportingQuote: z.string().optional().describe('A direct quote from the paper that supports the key findings. Can be "No specific quote available." if none is found.'),
});
export type Study = z.infer<typeof StudySchema>;

const SmartSearchOutputSchema = z.object({
  studies: z.array(StudySchema).describe('A list of relevant academic studies found.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  return smartSearchFlow(input);
}

const smartSearchPrompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  input: {schema: SmartSearchInputSchema},
  output: {schema: SmartSearchOutputSchema},
  prompt: `You are an expert research assistant. Your task is to find relevant academic studies based on the user's query and return structured information for each study. Search across academic databases and available documents.

User Query: "{{userQuery}}"

For each relevant study found, provide the following details in the specified JSON structure.

Example 1:
If the query was "effectiveness of mindfulness in reducing stress" and a paper was found:
{
  "title": "The Impact of Mindfulness-Based Stress Reduction on Perceived Stress Levels",
  "authors": ["J. Doe", "A. Smith"],
  "year": 2022,
  "studyType": "Randomized Controlled Trial",
  "sampleSize": "120 university students",
  "keyFindings": "Participants in the MBSR group showed a significant reduction in perceived stress compared to the control group. The benefits were maintained at a 3-month follow-up.",
  "supportingQuote": "The MBSR intervention led to a statistically significant decrease in scores on the Perceived Stress Scale (PSS) (p < .001)."
}

Example 2:
If the query was "AI in medical diagnosis" and a review paper was found:
{
  "title": "Artificial Intelligence in Medical Diagnostics: A Comprehensive Review",
  "authors": ["B. Lee", "C. Garcia"],
  "year": 2023,
  "studyType": "Literature Review",
  "sampleSize": "85 articles reviewed",
  "keyFindings": "AI demonstrates high potential in improving diagnostic accuracy and efficiency across various medical fields, particularly in image analysis. Ethical considerations and data privacy remain key challenges.",
  "supportingQuote": "Our review indicates that deep learning models, particularly CNNs, have achieved expert-level performance in tasks such as tumor detection and diabetic retinopathy screening."
}

Return a JSON object with a key "studies" containing a list of such structured summaries. If no relevant studies are found, return an empty list for "studies".
Ensure the output is a valid JSON object adhering to the defined output schema. For authors, provide a JSON array of strings. For year, provide a number.
`,
});

const smartSearchFlow = ai.defineFlow(
  {
    name: 'smartSearchFlow',
    inputSchema: SmartSearchInputSchema,
    outputSchema: SmartSearchOutputSchema,
  },
  async (input: SmartSearchInput) => {
    // In a real scenario, you might use tools here to search academic databases.
    // For now, the prompt guides the LLM to generate this based on its knowledge.
    const {output} = await smartSearchPrompt(input);

    if (!output) {
        // Handle cases where the LLM might not return valid JSON or expected structure
        // For robustness, you could attempt to parse output.text() if output is not structured.
        // However, with `output: {schema: SmartSearchOutputSchema}`, Genkit attempts to parse.
        // If parsing fails, output would be null or an error might be thrown depending on Genkit version/config.
        console.error('Smart Search Flow: LLM did not return a valid structured output.');
        return { studies: [] };
    }
    
    // Ensure studies is always an array, even if the LLM returns null or undefined for it.
    return { studies: output.studies || [] };
  }
);
