
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
  introduction: z.string().describe('The introduction section of the report (under 100 words).'),
  summaryOfEvidence: z.string().describe('The summary of evidence section, grouping findings by theme, trend, or contradiction.'),
  keyResultsTableMd: z.string().describe('A Markdown table summarizing: Study (Title, Year), Methodology, Population, and Key Result for prominent studies.'),
  conclusion: z.string().describe('The conclusion section, summarizing the state of evidence and any gaps.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  // For now, we'll return mock data matching the schema to avoid API key errors.
  // Later, replace this with the actual call to generateReportFlow(input).
  console.log("Mock generateReport called with topic:", input.researchTopic, "and", input.studies.length, "studies.");
  
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const introText = `This report critically examines the research topic: "${input.researchTopic}". It synthesizes findings from ${input.studies.length} key studies to provide a comprehensive overview of the current evidence base. The importance of this topic stems from its potential impact on public health and technological advancement. This investigation aims to clarify the existing knowledge landscape.`;
  
  const study1Title = input.studies[0]?.title || 'Example Study 1: Effect of Sunlight on Mood';
  const study1Year = input.studies[0]?.year || 2023;
  const study1Methodology = input.studies[0]?.methodology || 'RCT';
  const study1Population = input.studies[0]?.population || '100 Adults';
  const study1KeyResults = input.studies[0]?.keyResults || 'Increased exposure to sunlight correlated with improved mood scores.';

  const study2Title = input.studies[1]?.title || 'Example Study 2: AI in Education Review';
  const study2Year = input.studies[1]?.year || 2024;
  const study2Methodology = input.studies[1]?.methodology || 'Literature Review';
  const study2Population = input.studies[1]?.population || 'N/A (Review)';
  const study2KeyResults = input.studies[1]?.keyResults || 'AI shows potential to personalize learning but ethical concerns remain.';
  
  const study3Title = input.studies[2]?.title || 'Example Study 3: Caffeine & Memory Boost';
  const study3Year = input.studies[2]?.year || 2022;
  const study3Methodology = input.studies[2]?.methodology || 'Meta-analysis';
  const study3Population = input.studies[2]?.population || 'University Students';
  const study3KeyResults = input.studies[2]?.keyResults || 'Moderate caffeine intake linked to short-term memory improvement in students.';


  return {
    introduction: introText.length > 100 ? introText.substring(0, introText.lastIndexOf(' ', 97)) + '...' : introText,
    summaryOfEvidence: `The collected evidence, derived from ${input.studies.length} studies, presents several key themes. A significant portion of the research, notably from studies like "${study1Title}" and others employing ${study1Methodology}, points towards a positive correlation between X and Y. For instance, two studies highlighted the impact of intervention A. Conversely, some evidence, such as from "${study2Title}", suggests a nuance regarding population B, indicating that results may vary.`,
    keyResultsTableMd: `
| Study                                                    | Methodology                      | Population                               | Key Result                                                                                      |
| :------------------------------------------------------- | :------------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------ |
| ${study1Title} (${study1Year})            | ${study1Methodology}                     | ${study1Population}            | ${study1KeyResults}                   |
| ${study2Title} (${study2Year})                | ${study2Methodology}      | ${study2Population}          | ${study2KeyResults}                |
| ${study3Title} (${study3Year})                | ${study3Methodology}          | ${study3Population}   | ${study3KeyResults} |
`,
    conclusion: `In conclusion, the available evidence largely supports the efficacy of intervention X in population Y. However, the landscape is nuanced, with variations observed in studies employing different methodologies. Gaps in the current research include a lack of long-term longitudinal studies and studies on diverse demographic groups. Future research should prioritize addressing these gaps to provide a more complete understanding.`
  };
  // return generateReportFlow(input); // Uncomment when ready to use actual AI.
}


/*
// To re-enable API calls, uncomment the prompt and flow definitions below,
// and ensure the exported generateReport function calls generateReportFlow(input).

const generateReportPrompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are an expert scientific summarizer.
Your task is to generate a full research report based on the research topic and the following studies.
The report must be under 500 words in total and use plain academic language, avoiding repetition.

Research Topic: {{{researchTopic}}}

Extracted Data from Studies:
{{#each studies}}
---
Title: {{{this.title}}}
Authors: {{#each this.authors}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Year: {{{this.year}}}
Population/Sample: {{{this.population}}}
Intervention/Topic Studied: {{{this.interventionOrTopic}}}
Methodology: {{{this.methodology}}}
Key Results: {{{this.keyResults}}}
{{#if this.quote}}Supporting Quote: "{{{this.quote}}}"{{/if}}
---
{{/each}}

The report must include the following clearly separated sections:

1.  **Introduction**
    Explain the main research question or topic: "{{{researchTopic}}}".
    Mention why this topic matters in academic or real-world contexts.
    Keep this section under 100 words.

2.  **Summary of Evidence**
    Group the studies by trends or consistent findings.
    State how many studies support each theme.
    Highlight any contradictions.
    Keep it readable for non-experts.

3.  **Key Results Table** (Markdown table format)
    The table should have these columns: "Study" (formatted as "Title (Year)"), "Methodology", "Population", "Key Result".
    Select 2-4 of the most relevant or impactful studies from the provided "Extracted Data from Studies" for this table.
    Ensure the "Study" column combines the study's title and year, e.g., "The Effect of Sleep on Cognition (2023)".

    Example Markdown Table Format (Ensure your output matches this structure):
    | Study                                   | Methodology   | Population         | Key Result                                          |
    | :-------------------------------------- | :------------ | :----------------- | :-------------------------------------------------- |
    | The Effect of Sleep on Cognition (2023) | RCT           | Adults aged 40–65  | 15% increase in memory recall for 7+ hour sleepers. |
    | Sleep & Brain Health (2022)             | Meta-analysis | University Students| Combined data shows 12–18% cognitive boost.       |

4.  **Conclusion**
    Summarize the overall strength of evidence.
    Mention research gaps or areas for future study.
    Use academic but simple tone.

Ensure the output is a valid JSON object strictly adhering to the output schema.
The keyResultsTableMd field must be a string containing a valid Markdown table with the specified columns and "Study" column format.
Avoid any conversational preamble or sign-off.

Few-shot Output Sample:
{
  "introduction": "This report explores the relationship between sleep duration and cognitive performance in adults, a key area of interest in neuroscience and aging research. Understanding this link is crucial for public health initiatives aimed at promoting healthy aging and cognitive well-being.",
  "summaryOfEvidence": "Across five studies reviewed, longer sleep duration (typically defined as >7 hours per night) is consistently associated with measurable improvements in cognitive functions such as memory recall and processing speed. Four of these studies utilized randomized controlled trial (RCT) methodologies, providing strong evidence for a causal link. One cross-sectional analysis also supported this trend. However, one study focusing on a very specific elderly cohort with pre-existing sleep disorders showed no significant improvement, suggesting that the benefits of extended sleep might be moderated by underlying health conditions or age-related factors.",
  "keyResultsTableMd": "| Study                                   | Methodology   | Population         | Key Result                                          |\\n| :-------------------------------------- | :------------ | :----------------- | :-------------------------------------------------- |\\n| The Effect of Sleep on Cognition (2023) | RCT           | Adults aged 40–65  | Participants sleeping over 7 hours showed a 15% average increase in memory recall tests compared to the control group. |\\n| Sleep & Brain Health: A Meta-Analysis (2022)             | Meta-analysis | University Students (18-25 years) | Combined data from 12 studies (N=1500) indicates a 12–18% improvement in cognitive processing speed with optimal sleep.       |\\n| Cognitive Benefits of Napping (2021)    | Experimental  | Shift Workers      | Short naps (20-30 mins) improved alertness and reaction time significantly during night shifts. |",
  "conclusion": "The evidence robustly suggests a positive and significant relationship between adequate sleep duration and enhanced cognitive function in adult populations. Future research should focus on longitudinal studies to understand long-term impacts and explore interventions for specific populations, such as those with chronic illnesses or demanding work schedules, to optimize cognitive health through sleep."
}
`,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input: GenerateReportInput) => {
    const {output} = await generateReportPrompt(input);
    if (!output) {
      throw new Error('Report generation failed: LLM did not return a valid structured output.');
    }
    // Ensure markdown table newlines are correctly escaped if they come from LLM as \\n
    if (output.keyResultsTableMd) {
        output.keyResultsTableMd = output.keyResultsTableMd.replace(/\\n/g, '\n');
    }
    return output;
  }
);
*/
