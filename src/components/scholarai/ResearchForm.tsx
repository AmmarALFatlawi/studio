
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Search, SearchCode, ArrowUp } from "lucide-react";
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
    // formData.set('query', query); // query is already part of form through input name="query"

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
      if (query.trim()) {
        handleSubmitLogic('search');
      } else {
        // Optionally show a toast if Enter is pressed with no query,
        // or let the main submit button's disabled state handle it visually.
        toast({
            title: "Query required",
            description: "Please type a query before submitting.",
            variant: "destructive",
        });
      }
    }
  };
  
  const handlePlusButtonClick = () => {
    // In a real scenario, trigger file input and handle file selection.
    fileInputRef.current?.click(); 
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const fileName = event.target.files[0].name;
      toast({
        title: "File Selected (Stub)",
        description: `${fileName} selected. PDF analysis not yet implemented.`,
      });
      // Here you would typically set file state and potentially call handleResearch with file data
      // For now, we'll just show a message.
      // Example: handleResearch(formDataWithFile);
      // Reset file input to allow selecting the same file again
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim()) {
      handleSubmitLogic('search');
    } else {
      toast({
          title: "Query required",
          description: "Please type a query before submitting.",
          variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <form ref={formRef} onSubmit={onFormSubmit} className="w-full">
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-4 sm:p-5 w-full"> {/* Changed sm:p-6 to sm:p-5 for slightly less padding */}
          <Label htmlFor="query-input" className="text-sm font-medium text-muted-foreground px-1 block mb-2">
            Ask anything
          </Label>
          <div className="relative flex items-center">
             {/* This div is now the container for icon + input */}
            <Input
              id="query-input"
              type="text"
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1 text-lg h-auto" 
              aria-label="Research query input"
            />
          </div>
          
          {/* Hidden file input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".pdf" 
            onChange={handleFileSelected}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 sm:mt-4">
            <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap for button group responsiveness */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    aria-label="Upload document or add context"
                    className="h-9 w-9 rounded-full shrink-0" // btn-circle style
                    onClick={handlePlusButtonClick}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload PDF or add context</p>
                </TooltipContent>
              </Tooltip>

              <Button
                type="button"
                variant="outline"
                size="sm" // h-9 from size="sm"
                className="font-medium rounded-full px-4" // btn-pill style (py-2 is part of size="sm")
                onClick={() => handleSubmitLogic('search')}
                disabled={isResearchPending || !query.trim()}
                aria-label="Perform a quick search"
              >
                <Search className="mr-1.5 h-4 w-4 shrink-0" /> Search
              </Button>

              <Button
                type="button"
                variant="secondary" 
                size="sm"
                className="font-medium rounded-full px-4" // btn-pill style
                onClick={() => handleSubmitLogic('research')}
                disabled={isResearchPending || !query.trim()}
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
                  variant="secondary" // Changed to secondary for gray filled look
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0" // btn-circle style
                  aria-label="Submit query"
                  disabled={isResearchPending || !query.trim()}
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
