
'use server';
/**
 * @fileOverview A Genkit flow to assist users in formulating clear and constructive comments on selected text from a research report.
 *
 * - assistComment - A function that takes selected report content and a user's initial thought,
 *   returning a refined comment, an optional suggested edit for the original text, and a relevant tag.
 * - AssistCommentInput - The input type for the assistComment function.
 * - AssistCommentOutput - The return type for the assistComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssistCommentInputSchema = z.object({
  selectedContent: z.string().describe('The text content selected by the user from the research report.'),
  userIntent: z.string().describe('The user_s initial draft, question, or idea for the comment regarding the selected content.'),
});
export type AssistCommentInput = z.infer<typeof AssistCommentInputSchema>;

const AssistCommentOutputSchema = z.object({
  comment: z.string().describe('A clear, concise, and constructive comment or question formulated by the AI based on the user_s intent and selected content.'),
  suggestedEdit: z.string().optional().describe('An optional suggestion for how the original selectedContent could be improved or clarified. This is provided if the user_s intent implies a critique or a way to enhance the original text.'),
  tag: z.string().describe('A relevant tag for the comment or the section being commented on (e.g., Methodology, Results, Clarity, Bias, Suggestion).'),
});
export type AssistCommentOutput = z.infer<typeof AssistCommentOutputSchema>;

export async function assistComment(input: AssistCommentInput): Promise<AssistCommentOutput> {
  // For now, returning mock data to avoid API key errors and allow UI development.
  // Replace with actual call to assistCommentFlow(input) when API is ready.
  console.log("Mock assistComment called with:", input);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate AI processing time

  let mockTag = "General";
  if (input.userIntent.toLowerCase().includes("method")) mockTag = "Methodology";
  else if (input.userIntent.toLowerCase().includes("result")) mockTag = "Results";
  else if (input.userIntent.toLowerCase().includes("bias")) mockTag = "Bias";
  else if (input.userIntent.toLowerCase().includes("question")) mockTag = "Question";


  const mockResponse: AssistCommentOutput = {
    comment: `Refined comment based on user intent: "${input.userIntent}". The selected text states: "${input.selectedContent.substring(0, 50)}...". Consider rephrasing for clarity.`,
    suggestedEdit: `Original: "${input.selectedContent.substring(0,50)}..." Suggestion: Perhaps clarify the relationship between X and Y.`,
    tag: mockTag,
  };

  if (input.userIntent.toLowerCase().includes("great point")) {
    mockResponse.suggestedEdit = undefined;
    mockResponse.comment = `This is a insightful point: "${input.selectedContent.substring(0, 50)}...". User agrees: "${input.userIntent}".`;
  }


  return mockResponse;
  // return assistCommentFlow(input); // Uncomment when API is ready
}

/*
// Uncomment this section when ready to use actual AI calls
const assistCommentPrompt = ai.definePrompt({
  name: 'assistCommentPrompt',
  input: {schema: AssistCommentInputSchema},
  output: {schema: AssistCommentOutputSchema},
  prompt: `You are an expert AI research collaborator embedded in a workspace called Contvia.
A user has selected a piece of text from a research report and wants to leave a comment or ask a question about it.
Your task is to help them write a clear, constructive, and academically appropriate comment.
You should also suggest an optional edit to the original text if the user's intent implies a critique or potential improvement, and provide a relevant tag.

Selected Content from the report:
"""
{{{selectedContent}}}
"""

User's initial thought/intent for the comment:
"""
{{{userIntent}}}
"""

Based on the "Selected Content" and "User's initial thought/intent", generate the following:

1.  **Comment**:
    *   If the user's intent is a question, phrase it clearly and concisely.
    *   If it's an observation, make it constructive.
    *   If it's praise, acknowledge it.
    *   Ensure the comment directly relates to the "Selected Content".

2.  **Suggested Edit** (Optional):
    *   If the user's intent or your analysis of the "SelectedContent" suggests a way the original text could be improved for clarity, accuracy, or completeness, provide a specific suggested edit.
    *   Phrase this as a constructive suggestion (e.g., "Consider rephrasing to...", "Perhaps clarify...", "It might be clearer if...").
    *   If no edit is necessary or implied, omit this field or leave it empty.

3.  **Tag**:
    *   Suggest a single, relevant tag for this comment or the section of the report.
    *   Examples: Methodology, Results, Discussion, Introduction, Conclusion, Clarity, Bias, Sample Size, Interpretation, Suggestion, Question.
    *   Choose the most fitting tag based on the context.

Example Response Format:
{
  "comment": "Regarding the participant engagement, were there any dropouts during the cognitive training, and if so, how were they accounted for in the analysis?",
  "suggestedEdit": "To enhance clarity on participant retention, consider adding a sentence specifying the number of dropouts and the method of handling missing data, such as 'Of the initial participants, X dropped out, and an intent-to-treat analysis was performed.'",
  "tag": "Methodology"
}

Another Example (Praise, no edit needed):
User Intent: "This is a great way to summarize the findings!"
Selected Content: "Key findings include X, Y, and Z."
{
  "comment": "This is an excellent and concise summary of the key findings.",
  "tag": "Results"
}

Another Example (Question about a term):
User Intent: "What does 'ecological validity' mean here?"
Selected Content: "The study demonstrated high ecological validity."
{
  "comment": "Could you please clarify what 'ecological validity' refers to in the context of this study's design and findings?",
  "tag": "Clarity"
}

Ensure your output is a valid JSON object strictly adhering to the defined schema.
`,
});

const assistCommentFlow = ai.defineFlow(
  {
    name: 'assistCommentFlow',
    inputSchema: AssistCommentInputSchema,
    outputSchema: AssistCommentOutputSchema,
  },
  async (input: AssistCommentInput) => {
    const {output} = await assistCommentPrompt(input);
    if (!output) {
      // This case should ideally be handled by Genkit's schema validation or the LLM reliably returning data.
      throw new Error('AI failed to generate an assisted comment. Output was null.');
    }
    return output;
  }
);
*/
