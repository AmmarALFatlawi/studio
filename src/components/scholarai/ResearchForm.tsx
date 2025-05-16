"use client";

import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, Upload, Search, FlaskConical } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface ResearchFormProps {
  handleSearch: (formData: FormData) => Promise<void>;
  handleResearch: (formData: FormData) => Promise<void>;
}

export function ResearchForm({ handleSearch, handleResearch }: ResearchFormProps) {
  const [query, setQuery] = useState("");
  const [isSearchPending, startSearchTransition] = useTransition();
  const [isResearchPending, startResearchTransition] = useTransition();
  const { toast } = useToast();

  const onSubmit = (event: FormEvent<HTMLFormElement>, action: 'search' | 'research') => {
    event.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Query required",
        description: "Please enter a research question, keywords, or topic.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(event.currentTarget);
    formData.set('query', query); // Ensure query state is used

    if (action === 'search') {
      startSearchTransition(() => {
        handleSearch(formData);
      });
    } else if (action === 'research') {
      startResearchTransition(() => {
        handleResearch(formData);
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl rounded-xl">
      <CardHeader className="p-6 sm:p-8">
        <CardTitle className="text-3xl sm:text-4xl font-bold text-center text-primary">
          ScholarAI
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground pt-1">
          Your AI-Powered Research Assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-center text-foreground">
          What do you want to explore?
        </h2>
        <form className="space-y-4">
          <div className="relative flex items-center">
            <Input
              type="text"
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your research question, keywords, or topic..."
              className="pr-12 text-base py-3"
              aria-label="Research query input"
            />
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary" type="button" aria-label="Voice input (conceptual)">
              <Mic className="h-5 w-5" />
            </Button>
          </div>
          
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:border-primary hover:text-primary" type="button" aria-label="Upload documents (conceptual)">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents (PDFs, etc.)
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              type="submit" 
              className="flex-1 py-3 text-base" 
              variant="outline"
              onClick={(e) => onSubmit(e.target.closest('form'), 'search')}
              disabled={isSearchPending || isResearchPending}
              aria-label="Perform a standard search"
            >
              <Search className="mr-2 h-4 w-4" />
              {isSearchPending ? "Searching..." : "Search"}
            </Button>
            <Button 
              type="submit" 
              className="flex-1 py-3 text-base"
              onClick={(e) => onSubmit(e.target.closest('form'), 'research')}
              disabled={isResearchPending || isSearchPending}
              aria-label="Perform an AI-enhanced research"
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              {isResearchPending ? "Researching..." : "Research"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="p-6 sm:p-8 text-xs text-muted-foreground text-center justify-center">
        <p>Tip: Use "Research" for AI-powered query refinement and deeper analysis.</p>
      </CardFooter>
    </Card>
  );
}
