
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Network, Paperclip, ArrowRightCircle } from "lucide-react";
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

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmitLogic('search'); // Default to search on Enter
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg rounded-xl">
      <TooltipProvider>
        <CardHeader className="p-6 sm:p-8 text-center">
          <CardTitle className="text-3xl sm:text-4xl font-bold text-primary">
            Contvia
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-1">
            The only research workplace you need
          </CardDescription>
          <CardDescription className="text-sm text-muted-foreground pt-1">
            Your AI-Powered Research Assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <form ref={formRef} onSubmit={onFormSubmit} className="space-y-4">
            <div className="rounded-lg border bg-card p-3 shadow-sm">
              <Label htmlFor="query-input" className="text-xs text-muted-foreground px-1">Ask anything...</Label>
              <div className="flex items-center mt-1">
                <ArrowRightCircle className="h-5 w-5 text-muted-foreground ml-1 mr-2 flex-shrink-0" /> 
                <Input
                  id="query-input"
                  type="text"
                  name="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="" 
                  className="flex-grow border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1 text-base h-auto"
                  aria-label="Research query input"
                />
                <div className="pl-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" type="button" aria-label="Upload PDF" className="h-8 w-8">
                          <Paperclip className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload PDF for analysis</p>
                      </TooltipContent>
                    </Tooltip>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-3 justify-center">
                {/* Search button removed as per request */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="font-semibold"
                  onClick={() => handleSubmitLogic('research')}
                  disabled={isResearchPending || isSearchPending}
                  aria-label="Perform an AI-enhanced deep research"
                >
                  <Network className="mr-1.5 h-4 w-4" />
                  {isResearchPending ? "Researching..." : "Deep Research"}
                </Button>
              </div>
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
