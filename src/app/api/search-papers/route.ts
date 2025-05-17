
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

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
  source: string; 
  abstract: string | null;
  study_type?: string | null; 
  citation_count?: number | null;
  pdf_link?: string | null; 
  doi?: string | null;
}

// --- API Specific Types (Simplified) ---

// Semantic Scholar
interface SemanticScholarRawPaper {
  paperId: string; title: string; abstract: string | null; year: number | null;
  citationCount: number | null; openAccessPdf: { url: string; status: string } | null;
  authors: Array<{ authorId: string | null; name: string }>; doi: string | null;
}
interface SemanticScholarResponse { total: number; data: SemanticScholarRawPaper[]; }

// OpenAlex
interface OpenAlexAuthor { name: string; }
interface OpenAlexAuthorship { author: OpenAlexAuthor; }
interface OpenAlexLocation { pdf_url: string | null; }
interface OpenAlexRawPaper {
  display_name: string; authorships: OpenAlexAuthorship[]; publication_year: number | null;
  cited_by_count: number | null; doi: string | null; open_access: { oa_url: string | null };
  primary_location: OpenAlexLocation | null;
}
interface OpenAlexResponse { results: OpenAlexRawPaper[]; }

// arXiv
interface ArXivEntryLink { "@_href": string; "@_title"?: string; "@_type"?: string; }
interface ArXivEntry {
  title: string | { "#text": string }; author: Array<{ name: string }> | { name: string };
  summary: string | { "#text": string }; published: string; id: string;
  link: ArXivEntryLink[] | ArXivEntryLink;
}
interface ArXivFeed { entry: ArXivEntry[] | ArXivEntry; }
interface ArXivResponse { feed: ArXivFeed; }

// CORE
interface CoreRawPaper {
  title: string; authors: string[]; yearPublished?: number; abstract: string | null;
  downloadUrl: string | null; doi: string | null; citationCount?: number; // Assuming this field might exist
}
interface CoreV3Response { results: CoreRawPaper[]; }


// PubMed
interface PubMedSummary {
  uid: string; title: string; authors: Array<{ name: string }>; pubdate: string;
  source: string; abstract?: string; articleids: Array<{ idtype: string; value: string }>;
}
interface ESearchResult { esearchresult: { idlist: string[] } }
interface ESummaryResult { result: { [key: string]: PubMedSummary } }


// -----------------------------------------------------------------------------
// Helper Functions for each API
// -----------------------------------------------------------------------------

const SEMANTIC_SCHOLAR_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;
const CORE_API_KEY = process.env.CORE_API_KEY;
const NCBI_API_KEY = process.env.NCBI_API_KEY; // Optional for PubMed

async function fetchSemanticScholar(query: string, limit: number): Promise<UnifiedPaperResult[]> {
  if (!SEMANTIC_SCHOLAR_API_KEY) {
    console.warn("[Semantic Scholar] API key missing. Skipping.");
    return [];
  }
  const fields = "title,authors,year,abstract,citationCount,openAccessPdf,doi";
  const apiUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=${fields}&limit=${limit}`;
  try {
    const response = await fetch(apiUrl, { headers: { "x-api-key": SEMANTIC_SCHOLAR_API_KEY } });
    if (!response.ok) {
      console.error(`[Semantic Scholar] API Error: ${response.status}`, await response.text());
      return [];
    }
    const result = (await response.json()) as SemanticScholarResponse;
    return result.data?.map(p => ({
      title: p.title, authors: p.authors?.map(a => a.name) || [], year: p.year,
      source: "Semantic Scholar", abstract: p.abstract, citation_count: p.citationCount,
      doi: p.doi, pdf_link: p.openAccessPdf?.url || null,
    })) || [];
  } catch (error) {
    console.error("[Semantic Scholar] Fetch error:", error);
    return [];
  }
}

async function fetchOpenAlex(query: string, limit: number): Promise<UnifiedPaperResult[]> {
  const apiUrl = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${limit}&mailto=${process.env.OPENALEX_EMAIL || 'scholarai@example.com'}`; // Add mailto for politeness
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`[OpenAlex] API Error: ${response.status}`, await response.text());
      return [];
    }
    const result = (await response.json()) as OpenAlexResponse;
    return result.results?.map(p => ({
      title: p.display_name, authors: p.authorships?.map(a => a.author.name).filter(Boolean) || [],
      year: p.publication_year, source: "OpenAlex", abstract: null, // Abstract not directly in search
      citation_count: p.cited_by_count, doi: p.doi ? p.doi.replace("https://doi.org/", "") : null,
      pdf_link: p.open_access?.oa_url || p.primary_location?.pdf_url || null,
    })) || [];
  } catch (error) {
    console.error("[OpenAlex] Fetch error:", error);
    return [];
  }
}

async function fetchArXiv(query: string, limit: number): Promise<UnifiedPaperResult[]> {
  const apiUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`[arXiv] API Error: ${response.status}`, await response.text());
      return [];
    }
    const xmlData = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const result = parser.parse(xmlData) as ArXivResponse;
    const entries = result.feed?.entry ? (Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry]) : [];
    
    return entries.map(entry => {
      let pdfLink: string | null = null;
      const links = entry.link ? (Array.isArray(entry.link) ? entry.link : [entry.link]) : [];
      const pdfEntry = links.find(l => l["@_title"] === "pdf" && l["@_type"] === "application/pdf");
      if (pdfEntry) pdfLink = pdfEntry["@_href"];
      else {
        const primaryLink = links.find(l => l["@_href"]?.includes('arxiv.org/pdf/'));
        if (primaryLink) pdfLink = primaryLink["@_href"];
      }
      const arxivIdMatch = entry.id?.match(/arxiv\.org\/abs\/([\d.]+)/);
      const doiFromId = arxivIdMatch ? `10.48550/arXiv.${arxivIdMatch[1]}` : null;

      return {
        title: typeof entry.title === 'string' ? entry.title : entry.title["#text"],
        authors: Array.isArray(entry.author) ? entry.author.map(a => a.name) : (entry.author ? [entry.author.name] : []),
        year: entry.published ? new Date(entry.published).getFullYear() : null,
        source: "arXiv", abstract: typeof entry.summary === 'string' ? entry.summary : entry.summary["#text"],
        citation_count: null, doi: doiFromId, pdf_link: pdfLink,
      };
    });
  } catch (error) {
    console.error("[arXiv] Fetch error:", error);
    return [];
  }
}

async function fetchCore(query: string, limit: number): Promise<UnifiedPaperResult[]> {
  if (!CORE_API_KEY) {
    console.warn("[CORE] API key missing. Skipping.");
    return [];
  }
  const apiUrl = `https://api.core.ac.uk/v3/search/works?q=${encodeURIComponent(query)}&limit=${limit}`;
  try {
    const response = await fetch(apiUrl, { headers: { "Authorization": `Bearer ${CORE_API_KEY}` } });
    if (!response.ok) {
      console.error(`[CORE] API Error: ${response.status}`, await response.text());
      return [];
    }
    const result = (await response.json()) as CoreV3Response;
    return result.results?.map(p => ({
      title: p.title, authors: p.authors || [], year: p.yearPublished || null,
      source: "CORE", abstract: p.abstract, citation_count: p.citationCount || null,
      doi: p.doi, pdf_link: p.downloadUrl,
    })) || [];
  } catch (error) {
    console.error("[CORE] Fetch error:", error);
    return [];
  }
}

async function fetchPubMed(query: string, limit: number): Promise<UnifiedPaperResult[]> {
  const apiKeyParam = NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : "";
  const eSearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${limit}&retmode=json${apiKeyParam}`;
  let pmids: string[] = [];
  try {
    const esearchResponse = await fetch(eSearchUrl);
    if (!esearchResponse.ok) {
      console.error(`[PubMed ESearch] API Error: ${esearchResponse.status}`, await esearchResponse.text());
      return [];
    }
    const esearchResult = (await esearchResponse.json()) as ESearchResult;
    pmids = esearchResult.esearchresult?.idlist || [];
    if (pmids.length === 0) return [];
  } catch (error) {
    console.error("[PubMed ESearch] Fetch error:", error);
    return [];
  }

  const eSummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=json${apiKeyParam}`;
  try {
    const esummaryResponse = await fetch(eSummaryUrl);
    if (!esummaryResponse.ok) {
      console.error(`[PubMed ESummary] API Error: ${esummaryResponse.status}`, await esummaryResponse.text());
      return [];
    }
    const esummaryResult = (await esummaryResponse.json()) as ESummaryResult;
    const summaries = esummaryResult.result;
    return Object.values(summaries).map(s => {
      const yearMatch = s.pubdate?.match(/\b\d{4}\b/);
      const doiEntry = s.articleids?.find(id => id.idtype === "doi");
      return {
        title: s.title, authors: s.authors?.map(a => a.name) || [],
        year: yearMatch ? parseInt(yearMatch[0], 10) : null, source: "PubMed",
        abstract: s.abstract || null, citation_count: null, // Not directly in esummary
        doi: doiEntry?.value || null, pdf_link: doiEntry?.value ? `https://doi.org/${doiEntry.value}` : null,
      };
    });
  } catch (error) {
    console.error("[PubMed ESummary] Fetch error:", error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// API Route Handler
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchPapersRequestBody;
    const { query, limit = 50 } = body; // Default to 50, will be capped later

    if (!query || typeof query !== 'string' || query.trim() === "") {
      return NextResponse.json({ error: 'Query is required and must be a non-empty string.' }, { status: 400 });
    }

    const effectiveLimit = Math.min(Math.max(1, limit), 50); // Cap final limit at 50
    // Fetch slightly more from each source to allow for deduplication and better ranking pool
    const internalLimitPerSource = Math.ceil(effectiveLimit / 2.5) > 10 ? Math.ceil(effectiveLimit / 2.5) : 10;


    console.log(`Unified search for: "${query}", effectiveLimit: ${effectiveLimit}, internalLimitPerSource: ${internalLimitPerSource}`);

    const sourcesPromises = [
      fetchSemanticScholar(query, internalLimitPerSource),
      fetchOpenAlex(query, internalLimitPerSource),
      fetchArXiv(query, internalLimitPerSource),
      fetchCore(query, internalLimitPerSource),
      fetchPubMed(query, internalLimitPerSource),
    ];

    const resultsFromAllSources = await Promise.allSettled(sourcesPromises);

    let combinedResults: UnifiedPaperResult[] = [];
    resultsFromAllSources.forEach((resultSet, index) => {
      const sourceName = ["Semantic Scholar", "OpenAlex", "arXiv", "CORE", "PubMed"][index]; // Match order of promises
      if (resultSet.status === "fulfilled" && Array.isArray(resultSet.value)) {
        console.log(`[${sourceName}] Fetched: ${resultSet.value.length} results`);
        combinedResults = combinedResults.concat(resultSet.value);
      } else if (resultSet.status === "rejected") {
        console.error(`[${sourceName}] API call failed:`, resultSet.reason);
      }
    });
    
    console.log(`Total results before deduplication: ${combinedResults.length}`);

    // Deduplication (simple strategy: by DOI if present, then by normalized title + year)
    const uniqueResultsMap = new Map<string, UnifiedPaperResult>();
    combinedResults.forEach(paper => {
      let key: string;
      if (paper.doi) {
        key = paper.doi.toLowerCase().trim();
      } else {
        // Normalize title: lowercase and remove common punctuation for better matching
        const normalizedTitle = paper.title?.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()']/g,"") || "untitled";
        key = `${normalizedTitle}_${paper.year || "noyear"}`;
      }
      
      if (!uniqueResultsMap.has(key)) {
        uniqueResultsMap.set(key, paper);
      } else {
        // Prefer entry with more info (e.g., citation count, abstract, PDF link)
        const existing = uniqueResultsMap.get(key)!;
        if (!existing.abstract && paper.abstract) existing.abstract = paper.abstract;
        if ((existing.citation_count === null || existing.citation_count === undefined) && paper.citation_count !== null && paper.citation_count !== undefined) {
          existing.citation_count = paper.citation_count;
        }
        if (!existing.pdf_link && paper.pdf_link) existing.pdf_link = paper.pdf_link;
        // Could add more merging logic here, e.g., prefer specific sources
      }
    });
    let dedupedResults = Array.from(uniqueResultsMap.values());
    console.log(`Total results after deduplication: ${dedupedResults.length}`);
    
    // Ranking: citation_count (desc), year (desc)
    dedupedResults.sort((a, b) => {
      const citationA = a.citation_count ?? -1; // Treat null/undefined citations as lowest
      const citationB = b.citation_count ?? -1;
      if (citationB !== citationA) return citationB - citationA;

      const yearA = a.year ?? 0; // Treat null/undefined years as oldest
      const yearB = b.year ?? 0;
      if (yearB !== yearA) return yearB - yearA;
      
      return (a.title || "").localeCompare(b.title || ""); // Fallback sort
    });
    
    const finalResults = dedupedResults.slice(0, effectiveLimit);
    console.log(`Returning ${finalResults.length} final results for query: "${query}"`);

    return NextResponse.json(finalResults);

  } catch (error: any) {
    console.error('Error in /api/search-papers:', error);
    return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
  }
}
