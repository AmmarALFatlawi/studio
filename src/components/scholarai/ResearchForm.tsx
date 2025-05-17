
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, SearchCode, ArrowUp } from "lucide-react"; // Keep Search icon if used elsewhere, or remove if not. For now, keeping it.
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitLogic = (action: 'search' | 'research') => {
    if (!query.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) ) {
      toast({
        title: "Query or File Required",
        description: "Please enter a research question or upload a file.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    // formData.set('query', query); // Query is already part of form through input name="query"

    if (action === 'search') {
      handleSearch(formData);
    } else if (action === 'research') {
      startResearchTransition(() => {
        handleResearch(formData);
      });
    }
  };
  
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // Enter triggers search only if query is not empty or a file is selected
      if (query.trim() || (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0)) {
         handleSubmitLogic('search');
      } else {
         toast({
            title: "Query or File Required",
            description: "Please enter a research question or upload a file to submit.",
            variant: "destructive",
        });
      }
    }
  };
  
  const handlePlusButtonClick = () => {
    fileInputRef.current?.click(); 
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const fileName = event.target.files[0].name;
      toast({
        title: "File Selected",
        description: `${fileName} selected. You can now use 'Deep Research'.`,
      });
    }
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Default submit (e.g. via ArrowUp button) triggers 'search'
     if (query.trim() || (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0)) {
      handleSubmitLogic('search');
    } else {
      toast({
        title: "Query or File Required",
        description: "Please enter a research question or upload a file.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <form ref={formRef} onSubmit={onFormSubmit} className="w-full">
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-4 sm:p-5 w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              id="query-input"
              type="text"
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none pl-10 pr-3 py-3 text-lg h-auto" 
              aria-label="Research query input"
            />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            name="document"
            style={{ display: 'none' }} 
            accept=".pdf,.doc,.docx,.txt" 
            onChange={handleFileSelected}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 sm:mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    aria-label="Upload document or add context"
                    className="h-9 w-9 rounded-full shrink-0 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-95"
                    onClick={handlePlusButtonClick}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload document (PDF, DOC, TXT)</p>
                </TooltipContent>
              </Tooltip>

              {/* Search button removed based on user request */}

              <Button
                type="button"
                variant="secondary" 
                size="sm"
                className="font-medium rounded-full px-4 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-95"
                onClick={() => handleSubmitLogic('research')}
                disabled={isResearchPending || (!query.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0))}
                aria-label="Perform an AI-enhanced deep research"
              >
                <SearchCode className="mr-1.5 h-4 w-4 shrink-0" />
                {isResearchPending ? "Researching..." : "Deep Research"}
              </Button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  variant="default" 
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0 bg-primary text-primary-foreground transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-95"
                  aria-label="Submit query"
                  disabled={isResearchPending || (!query.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0))}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Submit query</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </form>
    </TooltipProvider>
  );
}
