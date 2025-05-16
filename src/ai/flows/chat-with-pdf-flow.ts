
'use server';
/**
 * @fileOverview A Genkit flow for answering questions based on the content of an academic paper or report.
 *
 * - chatWithPdf - A function that takes paper/report content and a user question, returning an answer derived solely from the provided text.
 * - ChatWithPdfInput - The input type for the chatWithPdf function.
 * - ChatWithPdfOutput - The return type for the chatWithPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithPdfInputSchema = z.object({
  paperContent: z.string().describe('The full extracted text content of the academic paper or report.'),
  userQuestion: z.string().describe('The user_s question about the paper/report content.'),
});
export type ChatWithPdfInput = z.infer<typeof ChatWithPdfInputSchema>;

const ChatWithPdfOutputSchema = z.object({
  answer: z.string().describe('A direct answer to the question, based ONLY on the provided document. If the answer is not found, this field explains that and may suggest exploring external sources.'),
  quote: z.string().optional().describe('A direct quote from the document supporting the answer, if available and relevant.'),
  source: z.string().optional().describe('The section or source location within the document where the information was found (e.g., Methods, Results, Discussion, Not mentioned).'),
});
export type ChatWithPdfOutput = z.infer<typeof ChatWithPdfOutputSchema>;

export async function chatWithPdf(input: ChatWithPdfInput): Promise<ChatWithPdfOutput> {
  return chatWithPdfFlow(input);
}

const chatWithPdfPrompt = ai.definePrompt({
  name: 'chatWithPdfPrompt',
  input: {schema: ChatWithPdfInputSchema},
  output: {schema: ChatWithPdfOutputSchema},
  prompt: `You are an expert AI research assistant built into an academic research platform called Contvia.
Your job is to answer any user question about the content of the provided academic paper or research report.
You must only use the content provided in the document below. Do not guess, generalize, or hallucinate.

Document Content:
"""
{{{paperContent}}}
"""

User Question:
{{{userQuestion}}}

Follow these instructions carefully:
1. Understand the user’s intent. Are they asking about methods, results, limitations, sample size, conclusions, or something else?
2. Search the provided Document Content for the answer.
3. If you find an answer:
   - Summarize it clearly in plain academic language for the 'answer' field.
   - If a direct quote supports the answer, include it in the 'quote' field.
   - Indicate the section where the information was found (e.g., Methods, Results, Introduction, Conclusion) in the 'source' field. If the section is not explicitly named but identifiable (e.g., first paragraph), describe it.
4. If the answer is NOT AVAILABLE in the text:
   - The 'answer' field must state: "That information doesn’t appear in this document. Would you like to explore it in external sources or related papers?"
   - The 'quote' field should be omitted or empty.
   - The 'source' field should be "Not mentioned".
5. Always respond using the specified output format. Your tone should be clear, professional, and academic. Avoid fluff.

Few-Shot Examples of desired output format:

Example 1:
User Question: What was the sample size?
Expected Output:
{
  "answer": "The study included 500 participants between the ages of 18 and 65.",
  "quote": "A total of 500 individuals were recruited from local clinics.",
  "source": "Methods"
}

Example 2:
User Question: Did they mention any limitations?
Expected Output:
{
  "answer": "Yes, the authors noted that the study relied on self-reported data and lacked diversity in the sample.",
  "quote": "A key limitation is the homogeneous nature of our participant group.",
  "source": "Discussion"
}

Example 3:
User Question: Did they compare different age groups?
Expected Output:
{
  "answer": "This document does not mention age-based comparisons. Would you like me to help you explore this in other studies?",
  "source": "Not mentioned"
}

Now, answer the current User Question based on the provided Document Content. Ensure your output is a valid JSON object matching the defined schema.
`,
});

const chatWithPdfFlow = ai.defineFlow(
  {
    name: 'chatWithPdfFlow',
    inputSchema: ChatWithPdfInputSchema,
    outputSchema: ChatWithPdfOutputSchema,
  },
  async (input: ChatWithPdfInput) => {
    const {output} = await chatWithPdfPrompt(input);
    if (!output) {
      // This case should ideally be handled by Genkit's schema validation or the LLM reliably returning data.
      // Fallback for robustness.
      console.error('ChatWithPdf Flow: LLM did not return a valid structured output.');
      return {
        answer: "I encountered an issue processing this request. Please try rephrasing your question or try again later.",
      };
    }
    return output;
  }
);

