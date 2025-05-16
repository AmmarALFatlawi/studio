"use client";

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const refinedQuery = searchParams.get('refinedQuery');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl text-primary">Search Results</CardTitle>
            {error && (
                <CardDescription className="text-destructive pt-2">
                  Error during research: {error === 'refinement_failed' ? 'Query refinement failed. Showing results for the original query.' : 'An unknown error occurred.'}
                </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {query ? (
              <div>
                <h3 className="font-semibold text-lg text-foreground">Original Query:</h3>
                <p className="text-muted-foreground bg-muted p-3 rounded-md">{query}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No query provided.</p>
            )}

            {refinedQuery && (
              <div>
                <h3 className="font-semibold text-lg text-foreground">Refined Query (AI):</h3>
                <p className="text-muted-foreground bg-muted p-3 rounded-md">{refinedQuery}</p>
              </div>
            )}
            
            <div className="pt-4">
              <p className="text-center text-muted-foreground">
                <em>(Search results would be displayed here)</em>
              </p>
              {/* Placeholder for actual search results listing */}
              <div className="mt-4 space-y-3">
                {[1,2,3].map(i => (
                  <Card key={i} className="p-4 bg-card border">
                    <CardTitle className="text-lg">Placeholder Result Title {i}</CardTitle>
                    <CardDescription>This is a placeholder for a search result item. Actual content like authors, year, findings, and quotes will appear here.</CardDescription>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
