
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
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
    formData.set('query', query);

    if (action === 'search') {
      // No transition for search as it's implicit on enter
      handleSearch(formData);
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
    <TooltipProvider>
      <form ref={formRef} onSubmit={onFormSubmit} className="space-y-6">
        <div className="rounded-lg border bg-card p-4 shadow-lg">
          <Label htmlFor="query-input" className="text-sm font-medium text-muted-foreground px-1 block mb-2">
            Ask anything...
          </Label>
          <div className="flex items-center relative">
            <ArrowRightCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground flex-shrink-0" /> 
            <Input
              id="query-input"
              type="text"
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="" 
              className="flex-grow border-input focus-visible:ring-accent focus-visible:border-accent shadow-sm p-3 pl-10 text-base h-12 rounded-md"
              aria-label="Research query input"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" type="button" aria-label="Upload PDF" 
                            className="h-9 w-9 text-muted-foreground hover:text-primary transition-transform duration-200 ease-in-out hover:scale-110 active:scale-100">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload PDF for analysis</p>
                  </TooltipContent>
                </Tooltip>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="font-semibold w-full sm:w-auto transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-98"
              onClick={() => handleSubmitLogic('research')}
              disabled={isResearchPending}
              aria-label="Perform an AI-enhanced deep research"
            >
              <Network className="mr-2 h-5 w-5" />
              {isResearchPending ? "Researching..." : "Deep Research"}
            </Button>
          </div>
        </div>
      </form>
    </TooltipProvider>
  );
}
