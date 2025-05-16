'use server';

import { refineQuery } from '@/ai/flows/refine-query';
import { redirect } from 'next/navigation';

export async function handleSearch(formData: FormData) {
  const query = formData.get('query') as string;

  if (query && query.trim()) {
    redirect(`/search-results?query=${encodeURIComponent(query.trim())}`);
  } else {
    // Optionally handle empty query, though client-side validation should catch this.
    // For now, redirecting to search-results without a query will show "No query provided."
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
    const refinedResult = await refineQuery({ query: trimmedQuery });
    const refinedQuery = refinedResult.refinedQuery;
    redirect(`/search-results?query=${encodeURIComponent(trimmedQuery)}&refinedQuery=${encodeURIComponent(refinedQuery)}`);
  } catch (error) {
    console.error("Error refining query:", error);
    // Fallback to simple search with an error flag, or show an error message on the current page.
    // For now, redirecting with an error param.
    redirect(`/search-results?query=${encodeURIComponent(trimmedQuery)}&error=refinement_failed`);
  }
}
