
"use client";

import type { Study } from '@/ai/flows/smart-search-flow'; // Import Study type
import { smartSearch } from '@/ai/flows/smart-search-flow'; // Import smartSearch flow
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, BarChart, Eye, List, FileWarning } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ClientOnly from '@/lib/ClientOnly';

type ViewMode = 'summary' | 'detailed';
type SortByType = 'relevance' | 'year_desc' | 'year_asc' | 'study_type';


export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [sortBy, setSortBy] = useState<SortByType>('relevance');
  const [initialErrorParamProcessed, setInitialErrorParamProcessed] = useState(false);

  const query = useMemo(() => searchParams.get('query'), [searchParams]);
  const refinedQuery = useMemo(() => searchParams.get('refinedQuery'), [searchParams]);
  const errorParam = useMemo(() => searchParams.get('error'), [searchParams]);

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
        setError("No query provided.");
        setIsLoading(false);
        setResults([]);
        return;
      }

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

    if (query || refinedQuery) {
        fetchData();
    } else if (!errorParam) { 
        setError("No query provided.");
        setIsLoading(false);
        setResults([]);
    } else {
        setIsLoading(false);
    }
    
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
      <Card key={`skeleton-${i}`} className="w-full shadow-lg rounded-lg mb-6">
        <CardHeader>
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-28" />
        </CardFooter>
      </Card>
    ))
  );

  return (
    <ClientOnly>
      <main className="min-h-screen w-full bg-background flex flex-col items-center p-6 md:px-12 md:py-8">
        <div className="w-full max-w-3xl">
          <Button variant="outline" asChild className="mb-8 transition-transform duration-200 ease-in-out hover:scale-105">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </Button>

          <Card className="w-full shadow-xl rounded-xl mb-8">
            <CardHeader className="p-6">
              <CardTitle className="text-2xl sm:text-3xl font-semibold text-primary">Search Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              {query && (
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">Original Query:</h3>
                  <p className="text-muted-foreground bg-muted p-3 rounded-md shadow-sm">{query}</p>
                </div>
              )}
              {refinedQuery && (
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">Refined Query (AI):</h3>
                  <p className="text-muted-foreground bg-muted p-3 rounded-md shadow-sm">{refinedQuery}</p>
                </div>
              )}
              {error && !error.startsWith("Failed to fetch search results") && (
                  <CardDescription className="text-destructive pt-2 text-sm">
                    {error}
                  </CardDescription>
              )}
            </CardContent>
          </Card>

          <div className="mb-8 p-4 bg-card rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 self-start sm:self-center">
                <BarChart className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground text-lg">Results Overview</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortByType)}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-background text-sm h-10 rounded-md shadow-sm">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Sort by: Relevance</SelectItem>
                    <SelectItem value="year_desc">Sort by: Year (Newest)</SelectItem>
                    <SelectItem value="year_asc">Sort by: Year (Oldest)</SelectItem>
                    <SelectItem value="study_type">Sort by: Study Type</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 rounded-md bg-muted p-1 shadow-sm w-full sm:w-auto">
                  <Button
                    variant={viewMode === 'summary' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('summary')}
                    className={`flex-1 sm:flex-none ${viewMode === 'summary' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'} transition-all duration-200 ease-in-out hover:scale-105 active:scale-98 h-9`}
                  >
                    <List className="mr-1.5 h-4 w-4" /> Summary
                  </Button>
                  <Button
                    variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('detailed')}
                    className={`flex-1 sm:flex-none ${viewMode === 'detailed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'} transition-all duration-200 ease-in-out hover:scale-105 active:scale-98 h-9`}
                  >
                    <Eye className="mr-1.5 h-4 w-4" /> Detailed
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {error && error.startsWith("Failed to fetch search results") && (
              <Card className="w-full shadow-lg rounded-xl mb-6 bg-destructive/10 border-destructive">
                  <CardHeader className="p-6">
                      <CardTitle className="text-destructive flex items-center"><FileWarning className="mr-2"/> Error Fetching Results</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                      <p className="text-destructive-foreground font-medium">{error}</p>
                      <p className="text-sm text-muted-foreground mt-2">The AI model might be unable to process this query or there could be a temporary issue. Please try a different query or try again later.</p>
                  </CardContent>
              </Card>
          )}

          {isLoading ? (
            renderSkeletons()
          ) : !error && sortedResults.length === 0 ? (
            <Card className="w-full shadow-lg rounded-xl">
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileWarning className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold">No studies found.</p>
                <p className="text-md mt-1">Try refining your search terms or making your query more general.</p>
              </CardContent>
            </Card>
          ) : (
            sortedResults.map((study, index) => (
              <Card key={study.title + index} className="w-full shadow-lg rounded-xl mb-6 hover:shadow-2xl transition-shadow duration-300 ease-in-out">
                <CardHeader className="p-6">
                  <a href="#" className="hover:underline" onClick={(e) => e.preventDefault()} >
                    <CardTitle className="text-xl font-semibold text-primary hover:text-primary/80 transition-colors">{study.title}</CardTitle>
                  </a>
                  <CardDescription className="text-sm text-muted-foreground pt-1">
                    {study.authors.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="secondary" className="bg-accent/20 text-accent-foreground hover:bg-accent/30 text-xs">
                      Year: {study.year}
                    </Badge>
                    <Badge variant="outline" className="border-primary/50 text-primary/90 hover:bg-primary/10 text-xs">
                      {study.studyType}
                    </Badge>
                    {study.sampleSize && study.sampleSize.toLowerCase() !== 'n/a' && (
                      <Badge variant="outline" className="text-muted-foreground text-xs">
                          Sample: {study.sampleSize}
                      </Badge>
                    )}
                  </div>
                  
                  <Separator className="my-4" />

                  <div>
                    <h4 className="font-semibold text-md text-foreground mb-1">Key Findings:</h4>
                    <p className={`text-foreground/90 text-sm leading-relaxed ${viewMode === 'summary' && study.keyFindings.length > 150 ? 'line-clamp-3' : ''}`}>
                      {study.keyFindings}
                    </p>
                  </div>

                  {study.supportingQuote && study.supportingQuote.toLowerCase() !== 'no specific quote available.' && (viewMode === 'detailed' || study.keyFindings.length <= 150) && (
                    <div className="pt-2">
                      <h4 className="font-semibold text-md text-foreground mb-1">Supporting Quote:</h4>
                      <blockquote className="border-l-4 border-accent pl-4 py-2 bg-muted/50 text-sm text-muted-foreground italic rounded-r-md shadow-sm">
                        "{study.supportingQuote}"
                      </blockquote>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end pt-2 pb-4 px-6">
                  <Button variant="ghost" size="sm" className="text-accent hover:bg-accent/10 hover:text-accent-foreground transition-all duration-200 ease-in-out hover:scale-105 active:scale-98">
                    <Download className="mr-2 h-4 w-4" />
                    Save/Export
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </main>
    </ClientOnly>
  );
}
