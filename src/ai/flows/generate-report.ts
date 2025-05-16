
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating structured research reports
 * based on extracted data from multiple studies.
 *
 * - generateReport - A function that generates a structured research report.
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Assuming ExtractedEvidenceDataSchema is defined in extract-evidence-flow.ts and is compatible
// If not, it should be defined here or imported appropriately.
// For this example, let's re-define a similar structure for clarity if not directly importing.

const StudyDataSchema = z.object({
  title: z.string().describe('The full title of the paper.'),
  authors: z.array(z.string()).describe('List of authors as an array of strings.'),
  year: z.number().describe('Year of publication as a number.'),
  population: z.string().optional().describe('Population or sample description (e.g., Adults aged 40-65, 150 university students).'),
  interventionOrTopic: z.string().optional().describe('The main intervention, topic, or variable studied (e.g., 7+ hours of nightly sleep, Impact of social media).'),
  methodology: z.string().describe('Study methodology (e.g., RCT, Cross-sectional, Meta-analysis).'),
  keyResults: z.string().describe('Concise 1-2 sentence summary of the main results or findings in plain English.'),
  quote: z.string().optional().describe('A direct quote from the paper supporting the key results. Can be "No specific quote available." if none is found.'),
});
export type StudyData = z.infer<typeof StudyDataSchema>;


const GenerateReportInputSchema = z.object({
  studies: z.array(StudyDataSchema).describe('An array of extracted data from multiple studies.'),
  researchTopic: z.string().describe('The initial research question or topic the report is about, providing context for the introduction.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  introduction: z.string().describe('The introduction section of the report.'),
  summaryOfEvidence: z.string().describe('The summary of evidence section, grouping findings by theme, trend, or contradiction.'),
  keyResultsTableMd: z.string().describe('A Markdown table summarizing: Study (Title, Year), Methodology, and Key Results for prominent studies.'),
  conclusion: z.string().describe('The conclusion section, summarizing the state of evidence and any gaps.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  // For now, we'll return mock data matching the schema to avoid API key errors.
  // Later, replace this with the actual call to generateReportFlow(input).
  console.log("Mock generateReport called with topic:", input.researchTopic, "and", input.studies.length, "studies.");
  
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    introduction: `This report critically examines the research topic: "${input.researchTopic}". It synthesizes findings from ${input.studies.length} key studies to provide a comprehensive overview of the current evidence base. The importance of this topic stems from its potential impact on [mention general area of impact, e.g., public health, technological advancement, educational practices].`,
    summaryOfEvidence: `The collected evidence, derived from ${input.studies.length} studies, presents several key themes. A significant portion of the research, notably from studies like "${input.studies[0]?.title || 'Example Study 1'}" and others employing ${input.studies[0]?.methodology || 'robust methodologies'}, points towards [mention a common trend or finding, e.g., a positive correlation between X and Y]. For instance, [number, e.g., three] studies highlighted [specific theme]. Conversely, some evidence, such as from "${input.studies[1]?.title || 'Example Study 2'}", suggests [a counterpoint or nuance], indicating that [explain contradiction or alternative perspective].`,
    keyResultsTableMd: `
| Study                                                    | Method                      | Result                                                                                      |
| :------------------------------------------------------- | :-------------------------- | :------------------------------------------------------------------------------------------ |
| ${input.studies[0]?.title || 'Effect of Sunlight on Mood'} (${input.studies[0]?.year || 2023})            | ${input.studies[0]?.methodology || 'RCT'}                     | ${input.studies[0]?.keyResults || 'Increased exposure to sunlight correlated with improved mood scores.'}                   |
| ${input.studies[1]?.title || 'AI in Education Review'} (${input.studies[1]?.year || 2024})                | ${input.studies[1]?.methodology || 'Literature Review'}      | ${input.studies[1]?.keyResults || 'AI shows potential to personalize learning but ethical concerns remain.'}                |
| ${input.studies[2]?.title || 'Caffeine & Memory Boost'} (${input.studies[2]?.year || 2022})                | ${input.studies[2]?.methodology || 'Meta-analysis'}          | ${input.studies[2]?.keyResults || 'Moderate caffeine intake linked to short-term memory improvement in students.'} |
`,
    conclusion: `In conclusion, the available evidence largely supports [reiterate main finding, e.g., the beneficial effects of X on Y]. However, the landscape is nuanced, with [mention a key variability or contradiction, e.g., differing results in specific populations]. Gaps in the current research include [mention a gap, e.g., a lack of long-term longitudinal studies or studies on diverse demographic groups]. Future research should prioritize [suggestion for future research]. This comprehensive understanding is crucial for [reiterate importance/application].`
  };
}

// const generateReportPrompt = ai.definePrompt({
//   name: 'generateReportPrompt',
//   input: {schema: GenerateReportInputSchema},
//   output: {schema: GenerateReportOutputSchema},
//   prompt: `You are an expert research summarization agent.
// Your task is to write a structured, concise, and accurate report based on the extracted data from multiple studies provided below.
// The report should be under 500 words and use plain academic language, avoiding repetition.

// Research Topic: {{{researchTopic}}}

// Extracted Data from Studies:
// {{#each studies}}
// ---
// Title: {{{this.title}}}
// Authors: {{#each this.authors}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
// Year: {{{this.year}}}
// Population/Sample: {{{this.population}}}
// Intervention/Topic Studied: {{{this.interventionOrTopic}}}
// Methodology: {{{this.methodology}}}
// Key Results: {{{this.keyResults}}}
// {{#if this.quote}}Supporting Quote: "{{{this.quote}}}"{{/if}}
// ---
// {{/each}}

// Based on the research topic and the extracted data, generate a report with the following sections:

// 1.  **Introduction**: Briefly explain the research question or topic and its importance. (1-2 sentences)
// 2.  **Summary of Evidence**: Group findings by theme, trend, or contradiction. Mention the number of studies supporting each point where appropriate. (2-3 paragraphs)
// 3.  **Key Results Table**: Create a Markdown table with three columns: "Study", "Method", and "Result". For the "Study" column, include the study title and year (e.g., "Title of Study (Year)"). Select 2-4 of the most relevant or impactful studies for this table.
//     Example Markdown Table:
//     | Study                                   | Method   | Result                                                     |
//     | :-------------------------------------- | :------- | :--------------------------------------------------------- |
//     | The Effect of Sleep on Cognition (2023) | RCT      | 15% increase in memory recall for 7+ hour sleepers.        |
//     | Sleep & Brain Health (2022)             | Meta     | Combined data shows 12–18% cognitive boost.              |
// 4.  **Conclusion**: One paragraph summarizing the overall state of evidence, key takeaways, and any notable gaps or areas for future research. (1-2 sentences)

// Ensure the output is a valid JSON object strictly adhering to the output schema.
// The keyResultsTableMd field must be a string containing a valid Markdown table.
// Avoid any conversational preamble or sign-off.
// Use plain academic language and keep the total report under 500 words.

// Example of desired output structure (content will vary based on input):
// {
//   "introduction": "This report explores the relationship between sleep duration and cognitive performance in adults, a key area of interest in neuroscience and aging research.",
//   "summaryOfEvidence": "Across five studies, longer sleep duration (typically >7 hours) is associated with measurable improvements in memory recall and processing speed. Four of the studies used randomized controlled trials, while one employed cross-sectional analysis. One study showed no significant improvement, suggesting individual variability or confounding factors.",
//   "keyResultsTableMd": "| Study                                   | Method   | Result                                          |\n| :-------------------------------------- | :------- | :---------------------------------------------- |\n| The Effect of Sleep on Cognition (2023) | RCT      | 15% increase in memory recall...                |\n| Sleep & Brain Health (2022)             | Meta     | Combined data shows 12–18% cognitive boost.   |",
//   "conclusion": "The evidence suggests a positive relationship between longer sleep and improved cognitive function in adults. However, variations in study design and population size highlight the need for further large-scale longitudinal research."
// }
// `,
// });

// const generateReportFlow = ai.defineFlow(
//   {
//     name: 'generateReportFlow',
//     inputSchema: GenerateReportInputSchema,
//     outputSchema: GenerateReportOutputSchema,
//   },
//   async (input) => {
//     const {output} = await generateReportPrompt(input);
//     if (!output) {
//       throw new Error('Report generation failed: LLM did not return a valid structured output.');
//     }
//     return output;
//   }
// );

// To re-enable API calls, uncomment the prompt and flow definitions above,
// and change the export:
// export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
//   return generateReportFlow(input);
// }
CDATA