
"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Study } from '@/ai/flows/smart-search-flow'; // Still use Study type
import { smartSearch } from '@/ai/flows/smart-search-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Eye, ListFilter, FileWarning, BarChartHorizontalBig, ServerCrash, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

// Firebase imports
import { httpsCallable, type HttpsCallable, type HttpsCallableResult } from "firebase/functions";
import { functions as firebaseFunctionsApp } from '@/lib/firebase';

type ViewMode = 'summary' | 'detailed';
type SortByType = 'relevance' | 'year_desc' | 'year_asc' | 'study_type';

// This structure should match the output of your searchPapersUnified Firebase Function
export interface NormalizedPaper {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string | null;
  doi: string | null;
  pdf_link: string | null;
  source: string;
  citation_count: number | null;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<Study[]>([]); // UI still expects Study[]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [sortBy, setSortBy] = useState<SortByType>('relevance');
  const [initialErrorParamProcessed, setInitialErrorParamProcessed] = useState(false);

  const query = useMemo(() => searchParams.get('query'), [searchParams]);
  const refinedQuery = useMemo(() => searchParams.get('refinedQuery'), [searchParams]);
  const errorParam = useMemo(() => searchParams.get('error'), [searchParams]);
  const dataSource = useMemo(() => searchParams.get('dataSource'), [searchParams]);

  // Helper function to map NormalizedPaper to Study, if needed for direct Firebase call path
  const mapNormalizedPaperToStudy = useCallback((paper: NormalizedPaper): Study => {
    return {
      title: paper.title || "Untitled",
      authors: paper.authors || [],
      year: paper.year ?? new Date().getFullYear(),
      studyType: paper.source || "N/A", 
      sampleSize: "N/A", 
      keyFindings: paper.abstract || "No abstract available.",
      supportingQuote: undefined, 
    };
  }, []);

  useEffect(() => {
    if (errorParam && !initialErrorParamProcessed) {
      const specificError = errorParam === 'refinement_failed' 
        ? 'Query refinement failed. Using original query for search.' 
        : 'An unknown error occurred during refinement.';
      setError(specificError); 
      setInitialErrorParamProcessed(true);
    }

    async function fetchData() {
      const currentQuery = refinedQuery || query;
      if (!currentQuery) {
        if (!(errorParam && initialErrorParamProcessed)) {
            setError("No query provided.");
        }
        setIsLoading(false);
        setResults([]);
        return;
      }

      if (!(errorParam && initialErrorParamProcessed)) {
          setError(null); 
      }
      setIsLoading(true);
      
      try {
        if (dataSource === 'firebase') {
          console.log(`Fetching from Firebase for query: ${currentQuery}`);
          const searchPapersUnifiedCallable: HttpsCallable<{ query: string; limit?: number }, NormalizedPaper[]> = 
            httpsCallable(firebaseFunctionsApp, "searchPapersUnified");
          
          const response: HttpsCallableResult<NormalizedPaper[]> = await searchPapersUnifiedCallable({ query: currentQuery, limit: 20 });
          const papers = response.data;

          if (!Array.isArray(papers)) {
            console.error("Firebase function 'searchPapersUnified' (direct call) did not return an array. Data:", papers);
            throw new Error("Invalid data format from search service.");
          }
          
          setResults(papers.map(mapNormalizedPaperToStudy));
        } else {
          // Standard search now also uses Firebase via the updated smartSearch flow
          console.log(`Fetching via smartSearch Genkit flow (which calls Firebase) for query: ${currentQuery}`);
          const response = await smartSearch({ userQuery: currentQuery });
          setResults(response.studies || []);
        }
      } catch (e: any) {
        console.error("Error fetching search results on page:", e);
        let userFriendlyMessage = "We couldn't fetch results right now. Please try again later.";
        
        // Check for specific Firebase error codes if desired
        if (e.code === 'functions/internal' || e.message === 'internal' || e.code === 'internal') {
            userFriendlyMessage = "An internal server error occurred with the search service. Please try again later.";
        } else if (e.code) { // Other Firebase error codes
             userFriendlyMessage = `Search failed: ${e.message}. Please try again.`;
        } else if (e.message) { // Generic error message from smartSearch flow or other issues
            // Keep the userFriendlyMessage or customize if e.message is too technical
            // For example: if (e.message.includes("Network Error")) ...
        }
        setError(userFriendlyMessage);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    // Initial fetch or when searchParams change
    if (query || refinedQuery) {
        fetchData();
    } else if (!errorParam) { 
        setError("No query provided.");
        setIsLoading(false);
        setResults([]);
    } else { 
        setIsLoading(false); 
    }
    
  }, [query, refinedQuery, errorParam, dataSource, initialErrorParamProcessed, mapNormalizedPaperToStudy, searchParams]); // Added searchParams


  const sortedResults = useMemo(() => {
    let sorted = [...results];
    switch (sortBy) {
      case 'year_desc':
        sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case 'year_asc':
        sorted.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
        break;
      case 'study_type':
        sorted.sort((a, b) => (a.studyType || "").localeCompare(b.studyType || ""));
        break;
      case 'relevance':
      default:
        // Assuming results are already relevance-sorted from the API/Genkit flow
        break;
    }
    return sorted;
  }, [results, sortBy]);


  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <Card key={`skeleton-${i}`} className="w-full bg-white rounded-2xl shadow-lg p-6 mb-6">
        <CardHeader className="p-0 pb-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="p-0 space-y-3">
          <div className="flex space-x-2">
            <Skeleton className="h-7 w-24 rounded-full bg-green-600/10" />
            <Skeleton className="h-7 w-28 rounded-full bg-green-600/10" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
        <CardFooter className="p-0 pt-4 flex justify-end">
          <Skeleton className="h-9 w-28" />
        </CardFooter>
      </Card>
    ))
  );

  return (
      <main className="min-h-screen w-full bg-background flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-6xl">
          <Button 
            variant="outline" 
            asChild 
            className="mb-8 transition-all duration-200 ease-in-out hover:scale-105 border-[#0B1F3A] text-[#0B1F3A] hover:bg-[#0B1F3A]/10 hover:text-[#0B1F3A]"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>

          {(query || refinedQuery || (error && !error.startsWith("We couldn't fetch results right now") && !error.startsWith("An internal server error occurred") && !error.startsWith("Search failed:"))) && (
            <Card className="w-full bg-white rounded-2xl shadow-lg mb-8 p-6">
              <CardHeader className="p-0">
                <CardTitle className="text-sm sm:text-base font-semibold text-primary mb-3">Search Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                {query && (
                  <div>
                    <h3 className="font-semibold text-xs text-slate-700 mb-1">Original Query:</h3>
                    <p className="text-slate-600 bg-slate-100 p-2 rounded-md shadow-sm text-xs sm:text-sm">{query}</p>
                  </div>
                )}
                {refinedQuery && (
                  <div>
                    <h3 className="font-semibold text-xs text-slate-700 mb-1">Refined Query (AI):</h3>
                    <p className="text-slate-600 bg-slate-100 p-2 rounded-md shadow-sm text-xs sm:text-sm">{refinedQuery}</p>
                  </div>
                )}
                {error && !error.startsWith("We couldn't fetch results right now") && !error.startsWith("An internal server error occurred") && !error.startsWith("Search failed:") && (
                    <p className="text-red-600 pt-2 text-xs sm:text-sm">
                      {error}
                    </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mb-8 p-4 bg-white rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 self-start sm:self-center">
                <BarChartHorizontalBig className="h-5 w-5 text-[#0B1F3A]" />
                <span className="font-semibold text-[#0B1F3A] text-lg">
                  {isLoading ? 'Loading Results...' : `Search Results (${sortedResults.length})`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortByType)}>
                  <SelectTrigger 
                    className="w-full sm:w-auto bg-[#0B1F3A] text-white rounded-full hover:bg-[#0B1F3A]/90 transition text-xs px-4 py-2 h-9 focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1F3A]/50"
                    aria-label="Sort results by"
                  >
                    <ListFilter className="mr-2 h-3.5 w-3.5" />
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="year_desc">Year (Newest)</SelectItem>
                    <SelectItem value="year_asc">Year (Oldest)</SelectItem>
                    <SelectItem value="study_type">Study Type</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 rounded-full bg-slate-100 p-1 shadow-sm w-full sm:w-auto">
                  <Button
                    onClick={() => setViewMode('summary')}
                    className={`flex-1 sm:flex-none text-xs px-4 py-1.5 h-8 rounded-full transition-all duration-200 ease-in-out hover:scale-105 active:scale-98
                                ${viewMode === 'summary' ? 'bg-[#0B1F3A] text-white' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
                  >
                    <ListFilter className="mr-1.5 h-3.5 w-3.5" /> Summary
                  </Button>
                  <Button
                    onClick={() => setViewMode('detailed')}
                    className={`flex-1 sm:flex-none text-xs px-4 py-1.5 h-8 rounded-full transition-all duration-200 ease-in-out hover:scale-105 active:scale-98
                                ${viewMode === 'detailed' ? 'bg-[#0B1F3A] text-white' : 'bg-transparent text-slate-600 hover:bg-slate-200'}`}
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Detailed
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {error && (error.startsWith("We couldn't fetch results right now") || error.startsWith("An internal server error occurred") || error.startsWith("Search failed:")) && (
              <Card className="w-full bg-white rounded-2xl shadow-lg mb-6 border border-destructive/50">
                  <CardHeader className="p-6 flex flex-row items-center gap-3">
                      <ServerCrash className="h-8 w-8 text-destructive" />
                      <div>
                        <CardTitle className="text-destructive text-lg">Error Fetching Results</CardTitle>
                        <CardDescription className="text-slate-600">
                          {error}
                        </CardDescription>
                      </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                      <p className="text-xs text-slate-500 mt-1">
                        This might be due to a temporary issue with the external academic APIs or the search service itself. Please try a different query or try again in a few moments. If the problem persists, check the server logs for more details.
                      </p>
                  </CardContent>
              </Card>
          )}

          {isLoading ? (
            renderSkeletons()
          ) : !error && sortedResults.length === 0 ? ( 
            <Card className="w-full bg-white rounded-2xl shadow-lg">
              <CardContent className="p-8 text-center text-slate-500">
                <FileWarning className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-slate-700">No studies found.</p>
                <p className="text-md mt-1">Try refining your search terms or making your query more general.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {sortedResults.map((study, index) => (
                <motion.div
                  key={study.title + index + study.year + study.studyType} // Made key more unique
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Card className="w-full bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-2xl duration-300 ease-in-out flex flex-col">
                    <CardHeader className="p-0 pb-3">
                      <a 
                        href={ ((study as any).pdf_link || (study as any).doi ? `https://doi.org/${(study as any).doi}` : '#') } // pdf_link and doi are part of NormalizedPaper, not Study directly
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:underline" 
                        onClick={(e) => { if (!((study as any).pdf_link || (study as any).doi)) e.preventDefault(); }} 
                      >
                        <CardTitle className="text-xl font-semibold text-[#0B1F3A] hover:text-[#0B1F3A]/80 transition-colors">{study.title}</CardTitle>
                      </a>
                      <CardDescription className="text-sm text-slate-600 pt-1">
                        {study.authors.join(', ')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4 flex-grow">
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="secondary" className="bg-green-600/10 text-green-700 hover:bg-green-600/20 text-xs font-medium px-3 py-1">
                          Year: {study.year}
                        </Badge>
                        <Badge variant="secondary" className="bg-green-600/10 text-green-700 hover:bg-green-600/20 text-xs font-medium px-3 py-1">
                          {study.studyType} {/* This will now show source, e.g., "PubMed" */}
                        </Badge>
                        {study.sampleSize && study.sampleSize.toLowerCase() !== 'n/a' && (
                          <Badge variant="outline" className="text-slate-500 border-slate-300 text-xs font-medium px-3 py-1">
                              Sample: {study.sampleSize}
                          </Badge>
                        )}
                      </div>
                      
                      <Separator className="my-3 bg-slate-200" />

                      <div>
                        <h4 className="font-semibold text-md text-slate-700 mb-1">Key Findings:</h4> {/* This will now show the abstract */}
                        <p className={`text-slate-700 text-base leading-relaxed ${viewMode === 'summary' && study.keyFindings.length > 150 ? 'line-clamp-3' : ''}`}>
                          {study.keyFindings}
                        </p>
                      </div>

                      {study.supportingQuote && study.supportingQuote.toLowerCase() !== 'no specific quote available.' && (viewMode === 'detailed' || study.keyFindings.length <= 150) && (
                        <div className="pt-2">
                          <h4 className="font-semibold text-md text-slate-700 mb-1">Supporting Quote:</h4>
                          <blockquote className="border-l-4 border-green-500 pl-4 py-2 bg-slate-50 text-sm text-slate-600 italic rounded-r-md shadow-sm">
                            "{study.supportingQuote}"
                          </blockquote>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-0 pt-4 mt-auto flex justify-end">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:underline font-medium px-0 transition-all duration-200 ease-in-out hover:scale-105 active:scale-98"
                        onClick={() => console.log('Save/Export clicked for:', study.title)} // Placeholder
                      >
                        <Download className="mr-1.5 h-4 w-4 text-green-600" />
                        Save/Export
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading search results...</p>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
