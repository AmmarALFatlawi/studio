
'use server';
/**
 * @fileOverview A Genkit flow to perform smart academic searches and return structured results.
 *
 * - smartSearch - A function that takes a user query and returns a list of relevant studies.
 * - SmartSearchInput - The input type for the smartSearch function.
 * - SmartSearchOutput - The return type for the smartSearch function, containing an array of studies.
 * - Study - The structure for an individual academic study.
 */

import {ai} from '@/ai/genkit'; // ai object is not directly used if only calling Firebase
import {z} from 'genkit';
import { httpsCallable } from "firebase/functions";
import { functions as firebaseFunctionsApp } from '@/lib/firebase'; // Ensure this path is correct

// Define NormalizedPaper structure if not imported from a shared types file
// This should match the output of your searchPapersUnified Firebase Function
interface NormalizedPaper {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string | null;
  doi: string | null;
  pdf_link: string | null;
  source: string;
  citation_count: number | null;
}

const SmartSearchInputSchema = z.object({
  userQuery: z.string().describe('The user query in plain English.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

const StudySchema = z.object({
  title: z.string().describe('Full title of the paper.'),
  authors: z.array(z.string()).describe('List of authors as an array of strings.'),
  year: z.number().describe('Year of publication as a number.'),
  studyType: z.string().describe('Type of study (e.g., RCT, Meta-analysis, or source like PubMed).'),
  sampleSize: z.string().describe('Sample size (e.g., "150 participants", "N/A for review").'),
  keyFindings: z.string().describe('A concise 1-2 sentence summary of the main findings in plain English.'),
  supportingQuote: z.string().optional().describe('A direct quote from the paper that supports the key findings. Can be "No specific quote available." if none is found.'),
});
export type Study = z.infer<typeof StudySchema>;

const SmartSearchOutputSchema = z.object({
  studies: z.array(StudySchema).describe('A list of relevant academic studies found.'),
});
export type SmartSearchOutput = z.infer<typeof SmartSearchOutputSchema>;

// Helper function to map NormalizedPaper to Study
const mapNormalizedPaperToStudy = (paper: NormalizedPaper): Study => {
  return {
    title: paper.title || "Untitled",
    authors: paper.authors || [],
    year: paper.year ?? new Date().getFullYear(), // Fallback year
    studyType: paper.source || "N/A", // Use source as studyType
    sampleSize: "N/A", // NormalizedPaper doesn't have this field
    keyFindings: paper.abstract || "No abstract available.",
    supportingQuote: undefined, // NormalizedPaper doesn't have this field
  };
};

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  console.log(`smartSearch Genkit flow called with query: "${input.userQuery}". Will call Firebase Function 'searchPapersUnified'.`);
  
  try {
    const searchPapersUnifiedCallable = httpsCallable<SmartSearchInput, NormalizedPaper[]>(firebaseFunctionsApp, "searchPapersUnified");
    const response = await searchPapersUnifiedCallable({ query: input.userQuery, limit: 20 }); // Pass limit, adjust as needed
    
    const papersFromFirebase = response.data;
    
    if (!Array.isArray(papersFromFirebase)) {
        console.error("Firebase function 'searchPapersUnified' did not return an array. Data:", papersFromFirebase);
        throw new Error("Invalid data format from search service.");
    }

    const mappedStudies = papersFromFirebase.map(mapNormalizedPaperToStudy);
    console.log(`Successfully fetched and mapped ${mappedStudies.length} studies from Firebase via smartSearch flow.`);
    return { studies: mappedStudies };

  } catch (error: any) {
    console.error("Error calling 'searchPapersUnified' Firebase Function from smartSearch flow:", error);
    // Re-throw or handle as appropriate for Genkit flow error handling
    // For now, re-throwing to let the caller (search-results page) handle it.
    throw new Error(`Failed to get search results via Firebase: ${error.message || 'Unknown error'}`);
  }
}

// Original Genkit prompt and flow for LLM-based search (now replaced by Firebase call)
// This part can be removed or kept for reference if you plan to use LLM search features later.
/*
const smartSearchPrompt = ai.definePrompt({
  name: 'smartSearchPrompt',
  input: {schema: SmartSearchInputSchema},
  output: {schema: SmartSearchOutputSchema},
  prompt: `You are an expert research assistant... (original prompt content)`,
});

const smartSearchFlow = ai.defineFlow(
  {
    name: 'smartSearchFlow',
    inputSchema: SmartSearchInputSchema,
    outputSchema: SmartSearchOutputSchema,
  },
  async (input: SmartSearchInput) => {
    // ... original flow logic ...
  }
);
*/
