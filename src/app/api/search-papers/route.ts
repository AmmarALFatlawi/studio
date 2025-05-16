
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

interface SearchPapersRequestBody {
  query: string;
  limit?: number;
}

export interface UnifiedPaperResult {
  title: string;
  authors: string[];
  year: number | null;
  source: string; // e.g., "Semantic Scholar", "arXiv", "OpenAlex"
  abstract: string | null;
  study_type?: string | null; // e.g., "RCT", "Meta-analysis"
  citation_count?: number | null;
  pdf_link?: string | null; // Link to open access PDF
  doi?: string | null;
}

// -----------------------------------------------------------------------------
// API Route Handler
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchPapersRequestBody;
    const { query, limit = 50 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required and must be a string.' }, { status: 400 });
    }

    const effectiveLimit = Math.min(Math.max(1, limit), 100); // Ensure limit is between 1 and 100

    // --- Placeholder for actual API calls and data processing ---
    // In a real implementation, you would:
    // 1. Call each academic API asynchronously.
    // 2. Normalize their diverse responses into the `UnifiedPaperResult` format.
    // 3. Merge and deduplicate results.
    // 4. Rank results based on relevance, year, citations.
    // 5. Handle errors from each API gracefully.

    // --- Helper function to simulate fetching from a source (replace with actual API calls) ---
    const fetchFromSource = async (sourceName: string, searchQuery: string, sourceLimit: number): Promise<UnifiedPaperResult[]> => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      // TODO: Implement actual API call logic for each source
      // Example:
      // if (sourceName === 'Semantic Scholar') { /* call Semantic Scholar API */ }
      // if (sourceName === 'OpenAlex') { /* call OpenAlex API */ }
      // ... and so on for Crossref, arXiv, PubMed, CORE

      // For now, return mock data
      const mockResults: UnifiedPaperResult[] = [];
      for (let i = 0; i < Math.min(sourceLimit, 5); i++) {
        mockResults.push({
          title: `Mock Paper ${i + 1} from ${sourceName} about ${searchQuery}`,
          authors: [`Author A${i}`, `Author B${i}`],
          year: 2020 + Math.floor(Math.random() * 5),
          source: sourceName,
          abstract: `This is a mock abstract for a paper found on ${sourceName} related to "${searchQuery}". It discusses various important findings and methodologies. The quick brown fox jumps over the lazy dog. The five boxing wizards jump quickly.`,
          study_type: Math.random() > 0.5 ? 'RCT' : 'Literature Review',
          citation_count: Math.floor(Math.random() * 200),
          pdf_link: Math.random() > 0.3 ? `https://example.com/${sourceName.toLowerCase()}/paper${i+1}.pdf` : null,
          doi: `10.1000/mock-${sourceName.toLowerCase()}-${i+1}`,
        });
      }
      return mockResults;
    };

    // Simulate fetching from all sources in parallel
    // Adjust individual limits as needed, ensuring total doesn't vastly exceed `effectiveLimit` before deduplication
    const sources = [
      { name: 'Semantic Scholar', fetchLimit: Math.ceil(effectiveLimit / 3) },
      { name: 'OpenAlex', fetchLimit: Math.ceil(effectiveLimit / 3) },
      { name: 'arXiv', fetchLimit: Math.ceil(effectiveLimit / 3) },
      // Add Crossref, PubMed, CORE here
    ];

    let allResults: UnifiedPaperResult[] = [];
    // In a real scenario, you'd use Promise.allSettled for resilience
    for (const source of sources) {
        try {
            const sourceResults = await fetchFromSource(source.name, query, source.fetchLimit);
            allResults = allResults.concat(sourceResults);
        } catch (error) {
            console.error(`Error fetching from ${source.name}:`, error);
            // Continue with other sources
        }
    }
    
    // --- TODO: Implement Deduplication ---
    // Deduplicate based on DOI, or a combination of title, authors, and year
    // For example:
    // const uniqueResults = allResults.filter((paper, index, self) => 
    //   index === self.findIndex((p) => (
    //     (p.doi && p.doi === paper.doi) || (p.title === paper.title && p.year === paper.year)
    //   ))
    // );
    // For this mock, we'll just use allResults
    let uniqueResults = allResults; // Replace with actual deduplication

    // --- TODO: Implement Ranking ---
    // Rank by source confidence (if available), year (desc), citation_count (desc)
    uniqueResults.sort((a, b) => {
        if (b.year !== a.year && a.year && b.year) return b.year - a.year;
        if (b.citation_count !== a.citation_count && a.citation_count && b.citation_count) return b.citation_count - a.citation_count;
        return 0;
    });
    
    // Apply final limit
    const finalResults = uniqueResults.slice(0, effectiveLimit);

    return NextResponse.json(finalResults);

  } catch (error: any) {
    console.error('Error in /api/search-papers:', error);
    return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
  }
}

/**
 * Backend Logic Checklist for each provider:
 * 
 * Semantic Scholar:
 * - API Endpoint: /v1/paper/search?query={query}&fields=title,authors,year,abstract,citationCount,openAccessPdf,doi
 * - Extract: title, authors, year, abstract, citationCount, openAccessPdf.url, doi
 * - Requires API key
 * 
 * OpenAlex:
 * - API Endpoint: https://api.openalex.org/works?search={query} (or filter by title: display_name.search={query})
 * - Extract: display_name (as title), authorships (authors), publication_year, cited_by_count, 
 *            open_access.oa_url (as pdf_link), doi (e.g., from ids.doi)
 * 
 * Crossref:
 * - API Endpoint: https://api.crossref.org/works?query.bibliographic={query} (or query.title)
 * - Extract: title (array, take first), author (array), published-print.date-parts[0][0] (year), DOI, URL, abstract (if present from <abstract> element)
 *
 * arXiv:
 * - API Endpoint: http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results={limit}
 * - Parse Atom XML: entry.title, entry.author.name, entry.summary (abstract), entry.published (year part), 
 *                  entry.link (filter for type="application/pdf" for pdf_link), entry.id (can be used for DOI or link)
 * 
 * PubMed/NCBI (Entrez):
 * 1. ESearch: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmax={limit}&retmode=json
 *    - Get: list of PMIDs
 * 2. ESummary/EFetch: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={comma_separated_pmids}&retmode=json
 *    - Extract for each PMID: title, authors (name), pubdate (year part), source (journal), abstract (often missing in esummary, efetch might be better for abstract)
 *    - EFetch (for abstracts if needed): https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&retmode=xml&rettype=abstract
 *
 * CORE:
 * - API Endpoint: https://core.ac.uk/api-v2/articles/search/{query}?apiKey={YOUR_API_KEY}
 * - Requires API key (free)
 * - Extract: title, authors (array), abstract, year, downloadUrl (as pdf_link), doi
 * 
 * Normalization Notes:
 * - Author names: Normalize to an array of strings, e.g., ["First Last", "Another First Last"].
 * - Year: Ensure it's a number.
 * - Abstract: Handle cases where it might be missing or truncated.
 * - pdf_link: Prioritize direct PDF links.
 * - Deduplication: Crucial. Best by DOI if available, otherwise a combination of title + first author + year.
 * - Ranking: Consider relevance scores from APIs if available, then recency (year), then citation count.
 * 
 * General Implementation Notes:
 * - Use async/await for all fetches.
 * - Implement robust error handling and retry logic (e.g., using a library like `p-retry` or `async-retry`) for each external API call.
 * - Set timeouts for API requests.
 * - Attach metadata: original source API, any relevance_score from that API, open_access status.
 * - Consider caching results (e.g., Redis, Firestore cache layer) for common queries.
 * - Add logging/tracing for performance monitoring and debugging.
 * - API Key Management: Use environment variables for API keys. NEVER hardcode them.
 */

    