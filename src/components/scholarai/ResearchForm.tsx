
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, Search, Network, Globe, Paperclip } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResearchFormProps {
  handleSearch: (formData: FormData) => Promise<void>;
  handleResearch: (formData: FormData) => Promise<void>;
}

export function ResearchForm({ handleSearch, handleResearch }: ResearchFormProps) {
  const [query, setQuery] = useState("");
  const [isSearchPending, startSearchTransition] = useTransition();
  const [isResearchPending, startResearchTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmitLogic = (action: 'search' | 'research') => {
    if (!query.trim()) {
      toast({
        title: "Query required",
        description: "Please enter a research question, keywords, or topic.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    // Ensure query state is used, as input is controlled by React state
    // FormData will pick up named inputs, but explicit set ensures correct value
    formData.set('query', query);


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

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmitLogic('search'); // Default to search on Enter
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl rounded-xl">
      <TooltipProvider>
        <CardHeader className="p-6 sm:p-8">
          <CardTitle className="text-3xl sm:text-4xl font-bold text-center text-primary">
            ScholarAI
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Your AI-Powered Research Assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-primary">
            What do you want to explore?
          </h2>
          <form ref={formRef} onSubmit={onFormSubmit} className="space-y-4">
            <div className="relative w-full">
              <Input
                type="text"
                name="query" // Important for FormData if not setting manually
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                className="p-4 pr-32 sm:pr-40 text-base shadow-md w-full" // Increased pr for 3 icons
                aria-label="Research query input"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-0.5 sm:space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" aria-label="Toggle language">
                      <Globe className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle language (conceptual)</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" aria-label="Upload PDF">
                      <Paperclip className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload PDF for analysis (conceptual)</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" aria-label="Voice input">
                      <Mic className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start voice input (conceptual)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
              <Button 
                type="submit" // This button will trigger form onSubmit
                className="flex-1 py-3 text-base" 
                disabled={isSearchPending || isResearchPending}
                aria-label="Perform a standard search"
              >
                <Search className="mr-2 h-4 w-4" />
                {isSearchPending ? "Searching..." : "Search"}
              </Button>
              <Button 
                type="button" // Changed to type="button"
                className="flex-1 py-3 text-base border-accent text-accent hover:bg-accent hover:text-accent-foreground focus:ring-accent"
                variant="outline"
                onClick={() => handleSubmitLogic('research')}
                disabled={isResearchPending || isSearchPending}
                aria-label="Perform an AI-enhanced deep research"
              >
                <Network className="mr-2 h-4 w-4" />
                {isResearchPending ? "Researching..." : "Deep Research"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="p-6 sm:p-8 text-xs text-muted-foreground text-center justify-center">
          <p>Tip: Use "Deep Research" for AI-powered query refinement and deeper analysis.</p>
        </CardFooter>
      </TooltipProvider>
    </Card>
  );
}
