
'use server';
/**
 * @fileOverview A Genkit flow to perform smart academic searches and return structured results.
 *
 * - smartSearch - A function that takes a user query and returns a list of relevant studies.
 * - SmartSearchInput - The input type for the smartSearch function.
 * - SmartSearchOutput - The return type for the smartSearch function, containing an array of studies.
 * - Study - The structure for an individual academic study.
 */

// import {ai} from '@/ai/genkit'; // Genkit ai object not used if only calling Firebase
import {z} from 'genkit';
import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { functions as firebaseFunctionsApp } from '@/lib/firebase'; // Ensure this path is correct
import type { NormalizedPaper } from '@/app/search-results/page'; // Assuming NormalizedPaper is exported from here or a shared types file

const SmartSearchInputSchema = z.object({
  userQuery: z.string().describe('The user query in plain English.'),
});
export type SmartSearchInput = z.infer<typeof SmartSearchInputSchema>;

// Keep StudySchema as it's the expected output structure for the UI
const StudySchema = z.object({
  title: z.string().describe('Full title of the paper.'),
  authors: z.array(z.string()).describe('List of authors as an array of strings.'),
  year: z.number().nullable().describe('Year of publication as a number or null.'),
  studyType: z.string().describe('Type of study (e.g., RCT, Meta-analysis, or source like PubMed).'),
  sampleSize: z.string().optional().describe('Sample size (e.g., "150 participants", "N/A for review").'),
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
    year: paper.year, // Already number | null
    studyType: paper.source || "N/A", // Use source from NormalizedPaper as studyType
    sampleSize: "N/A", // NormalizedPaper doesn't have this, default
    keyFindings: paper.abstract || "No abstract available.", // Use abstract as keyFindings
    supportingQuote: undefined, // NormalizedPaper doesn't have this
  };
};

export async function smartSearch(input: SmartSearchInput): Promise<SmartSearchOutput> {
  console.log(`smartSearch Genkit flow called with query: "${input.userQuery}". Will call Firebase Function 'searchPapersUnified'.`);
  
  try {
    const searchPapersUnifiedCallable = httpsCallable<SmartSearchInput, NormalizedPaper[]>(firebaseFunctionsApp, "searchPapersUnified");
    
    // Assuming SmartSearchInput is compatible or you adjust the data passed
    const response: HttpsCallableResult<NormalizedPaper[]> = await searchPapersUnifiedCallable({ query: input.userQuery, limit: 20 });
    
    const papersFromFirebase = response.data;
    
    if (!Array.isArray(papersFromFirebase)) {
        console.error("Firebase function 'searchPapersUnified' (called from smartSearch flow) did not return an array. Data:", papersFromFirebase);
        throw new Error("Invalid data format from search service.");
    }

    const mappedStudies = papersFromFirebase.map(mapNormalizedPaperToStudy);
    console.log(`Successfully fetched and mapped ${mappedStudies.length} studies from Firebase via smartSearch flow.`);
    return { studies: mappedStudies };

  } catch (error: any) {
    let errorMessage = 'Unknown error';
    if (error.message) {
      errorMessage = error.message;
    }
    let errorCode = 'N/A';
    if (error.code) { // Firebase errors often have a 'code' property
      errorCode = error.code;
    }
    console.error(
      `Error calling 'searchPapersUnified' Firebase Function from smartSearch flow. Code: ${errorCode}, Message: ${errorMessage}`,
      error // Log the full error object for all details
    );
    // Re-throw or handle as appropriate for Genkit flow error handling
    // For now, re-throwing to let the caller (search-results page) handle it.
    // Include the error code in the re-thrown error message for better client-side context.
    throw new Error(`Failed to get search results via Firebase: ${errorCode} - ${errorMessage}`);
  }
}
