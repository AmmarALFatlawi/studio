
'use server';
/**
 * @fileOverview A Genkit flow for answering questions based on the content of an academic paper.
 *
 * - chatWithPdf - A function that takes paper content and a user question, returning an answer derived solely from the paper.
 * - ChatWithPdfInput - The input type for the chatWithPdf function.
 * - ChatWithPdfOutput - The return type for the chatWithPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithPdfInputSchema = z.object({
  paperContent: z.string().describe('The full extracted text content of the academic paper.'),
  userQuestion: z.string().describe('The user_s question about the paper content.'),
});
export type ChatWithPdfInput = z.infer<typeof ChatWithPdfInputSchema>;

const ChatWithPdfOutputSchema = z.object({
  directAnswer: z.string().describe('A direct answer to the question, based ONLY on the paper. If the answer is not found, this field explains that.'),
  supportingQuote: z.string().optional().describe('A direct quote from the paper supporting the answer, if available and relevant.'),
  sectionLocation: z.string().optional().describe('The section of the paper where the information was found (e.g., Methods, Results, Discussion, Not mentioned).'),
});
export type ChatWithPdfOutput = z.infer<typeof ChatWithPdfOutputSchema>;

export async function chatWithPdf(input: ChatWithPdfInput): Promise<ChatWithPdfOutput> {
  return chatWithPdfFlow(input);
}

const chatWithPdfPrompt = ai.definePrompt({
  name: 'chatWithPdfPrompt',
  input: {schema: ChatWithPdfInputSchema},
  output: {schema: ChatWithPdfOutputSchema},
  prompt: `You are a domain-aware AI research assistant helping a researcher analyze a specific academic paper.
Your task is to answer the user's question based ONLY on the provided paper content.

Paper Content:
"""
{{{paperContent}}}
"""

User Question:
{{{userQuestion}}}

Instructions:
- ONLY answer using the content of the paper provided above. Do NOT use any external knowledge or make assumptions beyond the text.
- If the answer is explicitly mentioned in the paper, summarize it clearly and provide it as the 'directAnswer'.
- If the answer is partially implied by the paper, explain the possible interpretation as the 'directAnswer', making it clear it's an interpretation based on the text.
- If the answer is not present in the paper, the 'directAnswer' must state: "This paper does not provide that information. Would you like me to help you look in other studies?"
- If relevant and the information is found, provide a 'supportingQuote' (a direct short quote from the paper).
- If relevant and the information is found, indicate the 'sectionLocation' (e.g., Abstract, Introduction, Methods, Results, Discussion, Conclusion). If not found or not applicable, you can state "Not mentioned".
- Keep your tone helpful, accurate, and scientific. Avoid making unsupported claims.
- Ensure the output is a valid JSON object adhering to the defined output schema.

Few-Shot Examples of expected output format:

Example 1:
User Question: What was the sample size used in this study?
Expected Output:
{
  "directAnswer": "The study included a total of 500 adult participants aged 18–65.",
  "supportingQuote": "A total of 500 individuals were recruited from urban clinics.",
  "sectionLocation": "Methods"
}

Example 2:
User Question: Did they report any limitations?
Expected Output:
{
  "directAnswer": "Yes, the authors noted limited diversity in their participant pool and short follow-up duration as limitations.",
  "supportingQuote": "A key limitation of this study is its reliance on self-reported data and a lack of long-term observation.",
  "sectionLocation": "Discussion"
}

Example 3:
User Question: Was this study peer-reviewed?
Expected Output:
{
  "directAnswer": "This paper does not provide that information. Would you like me to help you look in other studies?",
  "sectionLocation": "Not mentioned"
}

Now, answer the current User Question based on the provided Paper Content.
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
        directAnswer: "I encountered an issue processing this request. Please try rephrasing your question or try again later.",
      };
    }
    return output;
  }
);
