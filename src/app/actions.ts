
'use server';

import { refineQuery } from '@/ai/flows/refine-query';
import { redirect } from 'next/navigation';

export async function handleSearch(formData: FormData) {
  const query = formData.get('query') as string;

  if (query && query.trim()) {
    // Standard search uses Genkit flow by default (no dataSource param)
    redirect(`/search-results?query=${encodeURIComponent(query.trim())}`);
  } else {
    redirect(`/search-results`);
  }
}

export async function handleResearch(formData: FormData) {
  const query = formData.get('query') as string;

  if (!query || !query.trim()) {
    redirect(`/search-results`); // Or handle error appropriately
    return;
  }

  const trimmedQuery = query.trim();

  try {
    // Query refinement can stay if desired.
    const refinedResult = await refineQuery({ query: trimmedQuery });
    const refinedQuery = refinedResult.refinedQuery;
    // Add dataSource=firebase to signal using the Firebase function for deep research
    redirect(`/search-results?query=${encodeURIComponent(trimmedQuery)}&refinedQuery=${encodeURIComponent(refinedQuery)}&dataSource=firebase`);
  } catch (error) {
    console.error("Error refining query:", error);
    // Fallback to using original query if refinement fails, but still use Firebase for deep research
    redirect(`/search-results?query=${encodeURIComponent(trimmedQuery)}&error=refinement_failed&dataSource=firebase`);
  }
}
