
"use client";

import type { Study } from '@/ai/flows/smart-search-flow'; // Import Study type
import { smartSearch } from '@/ai/flows/smart-search-flow'; // Import smartSearch flow
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, BarChart, Eye, List } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ClientOnly from '@/lib/ClientOnly'; // Import ClientOnly

type ViewMode = 'summary' | 'detailed';
type SortByType = 'relevance' | 'year_desc' | 'year_asc' | 'study_type';


export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Default to true
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [sortBy, setSortBy] = useState<SortByType>('relevance');
  const [initialErrorParamProcessed, setInitialErrorParamProcessed] = useState(false);

  // Memoize query, refinedQuery, and errorParam to stabilize useEffect dependencies if needed,
  // or ensure searchParams itself is the primary dependency for logic that reads from it.
  const query = useMemo(() => searchParams.get('query'), [searchParams]);
  const refinedQuery = useMemo(() => searchParams.get('refinedQuery'), [searchParams]);
  const errorParam = useMemo(() => searchParams.get('error'), [searchParams]);

  useEffect(() => {
    // Process error from URL param only once
    if (errorParam && !initialErrorParamProcessed) {
      const specificError = errorParam === 'refinement_failed' 
        ? 'Query refinement failed. Using original query for search.' 
        : 'An unknown error occurred during refinement.';
      setError(specificError);
      setInitialErrorParamProcessed(true); // Mark as processed
    }

    async function fetchData() {
      const currentQuery = refinedQuery || query;
      if (!currentQuery) {
        setError("No query provided.");
        setIsLoading(false);
        setResults([]);
        return;
      }

      // Only reset non-param error if errorParam was not the source or already processed
      if (!(errorParam && initialErrorParamProcessed)) {
          setError(null); 
      }
      setIsLoading(true);
      
      try {
        const response = await smartSearch({ userQuery: currentQuery });
        setResults(response.studies || []);
      } catch (e: any) {
        console.error("Error fetching search results:", e);
        setError(`Failed to fetch search results: ${e.message || 'Unknown error'}`);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }

    // Ensure params are available before fetching.
    // searchParams object itself can be used as a dependency.
    // Check if query exists, as fetchData depends on it.
    if (query || refinedQuery) {
        fetchData();
    } else if (!errorParam) { // If no query and no errorParam, set to no query provided
        setError("No query provided.");
        setIsLoading(false);
        setResults([]);
    } else {
        // If there's an errorParam but no query, loading should stop.
        // The error from errorParam should already be set.
        setIsLoading(false);
    }
    
  // Dependencies: query, refinedQuery, and errorParam are derived from searchParams.
  // Adding searchParams itself ensures the effect runs if any param changes.
  // initialErrorParamProcessed is included to control the one-time processing of errorParam.
  }, [query, refinedQuery, errorParam, searchParams, initialErrorParamProcessed]);


  const sortedResults = useMemo(() => {
    let sorted = [...results];
    switch (sortBy) {
      case 'year_desc':
        sorted.sort((a, b) => b.year - a.year);
        break;
      case 'year_asc':
        sorted.sort((a, b) => a.year - b.year);
        break;
      case 'study_type':
        sorted.sort((a, b) => a.studyType.localeCompare(b.studyType));
        break;
      case 'relevance':
      default:
        break;
    }
    return sorted;
  }, [results, sortBy]);


  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <Card key={`skeleton-${i}`} className="w-full shadow-md rounded-lg mb-4">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-8 w-24" />
        </CardFooter>
      </Card>
    ))
  );

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <Button variant="outline" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>

          <Card className="w-full shadow-lg rounded-xl mb-8">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl text-primary">Search Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {query && (
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Original Query:</h3>
                  <p className="text-muted-foreground bg-muted p-3 rounded-md">{query}</p>
                </div>
              )}
              {refinedQuery && (
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Refined Query (AI):</h3>
                  <p className="text-muted-foreground bg-muted p-3 rounded-md">{refinedQuery}</p>
                </div>
              )}
              {error && !error.startsWith("Failed to fetch search results") && (
                  <CardDescription className="text-destructive pt-2">
                    {error}
                  </CardDescription>
              )}
            </CardContent>
          </Card>

          <div className="mb-6 p-4 bg-card rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Filter & View Options</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortByType)}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background text-sm">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Sort by: Relevance</SelectItem>
                    <SelectItem value="year_desc">Sort by: Year (Newest)</SelectItem>
                    <SelectItem value="year_asc">Sort by: Year (Oldest)</SelectItem>
                    <SelectItem value="study_type">Sort by: Study Type</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 rounded-md bg-muted p-0.5">
                  <Button
                    variant={viewMode === 'summary' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('summary')}
                    className={viewMode === 'summary' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
                  >
                    <List className="mr-1.5 h-4 w-4" /> Summary
                  </Button>
                  <Button
                    variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('detailed')}
                    className={viewMode === 'detailed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
                  >
                    <Eye className="mr-1.5 h-4 w-4" /> Detailed
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {error && error.startsWith("Failed to fetch search results") && (
              <Card className="w-full shadow-md rounded-lg mb-4 bg-destructive/10 border-destructive">
                  <CardHeader>
                      <CardTitle className="text-destructive">Error Fetching Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-destructive-foreground">{error}</p>
                      <p className="text-sm text-muted-foreground mt-2">The AI model might be unable to process this query or there could be a temporary issue. Please try a different query or try again later.</p>
                  </CardContent>
              </Card>
          )}


          {isLoading ? (
            renderSkeletons()
          ) : !error && sortedResults.length === 0 ? (
            <Card className="w-full shadow-md rounded-lg">
              <CardContent className="p-6 text-center text-muted-foreground">
                <p className="text-lg">No studies found for your query.</p>
                <p className="text-sm mt-1">Try refining your search terms or making your query more general.</p>
              </CardContent>
            </Card>
          ) : (
            sortedResults.map((study, index) => (
              <Card key={study.title + index} className="w-full shadow-md rounded-lg mb-4 hover:shadow-xl transition-shadow duration-200">
                <CardHeader>
                  <a href="#" className="hover:underline" onClick={(e) => e.preventDefault()} /* Placeholder link */>
                    <CardTitle className="text-xl text-primary hover:text-primary/80">{study.title}</CardTitle>
                  </a>
                  <CardDescription className="text-sm text-muted-foreground pt-1">
                    {study.authors.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="secondary" className="bg-accent/20 text-accent-foreground hover:bg-accent/30">
                      Year: {study.year}
                    </Badge>
                    <Badge variant="outline" className="border-accent text-accent hover:bg-accent/10">
                      {study.studyType}
                    </Badge>
                    {study.sampleSize && study.sampleSize.toLowerCase() !== 'n/a' && (
                      <Badge variant="outline" className="text-muted-foreground">
                          Sample: {study.sampleSize}
                      </Badge>
                    )}
                  </div>
                  
                  <Separator className="my-3" />

                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Key Findings:</h4>
                    <p className={`text-foreground/90 ${viewMode === 'summary' && study.keyFindings.length > 150 ? 'line-clamp-3' : ''}`}>
                      {study.keyFindings}
                    </p>
                  </div>

                  {study.supportingQuote && study.supportingQuote.toLowerCase() !== 'no specific quote available.' && (viewMode === 'detailed' || study.keyFindings.length <= 150) && (
                    <div className="pt-2">
                      <h4 className="font-semibold text-foreground mb-1">Supporting Quote:</h4>
                      <blockquote className="border-l-4 border-accent pl-3 py-1 bg-muted/50 text-sm text-muted-foreground italic rounded-r-md">
                        "{study.supportingQuote}"
                      </blockquote>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end pt-2 pb-4 px-6">
                  <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10 hover:text-accent-foreground">
                    <Download className="mr-2 h-4 w-4" />
                    Save/Export
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </ClientOnly>
  );
}

