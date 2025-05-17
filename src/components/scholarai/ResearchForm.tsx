
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchCode, ArrowUp, Plus } from "lucide-react"; // Changed icons
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
    if (!query.trim() && action !== 'upload_pdf') { // Allow empty query if it's for PDF upload via Plus button
      toast({
        title: "Query required",
        description: "Please enter a research question, keywords, or topic.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set('query', query); // Ensure query is always set, even if empty for some actions

    if (action === 'search') {
      handleSearch(formData);
    } else if (action === 'research') {
      startResearchTransition(() => {
        handleResearch(formData);
      });
    }
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmitLogic('search'); // Default to search on Enter or main submit button
  };
  
  // Placeholder for file input logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handlePlusButtonClick = () => {
    // Trigger file input click
    // In a real scenario, you'd handle the file selection and processing.
    // For now, just a toast message.
    // fileInputRef.current?.click(); 
    toast({
        title: "Upload PDF",
        description: "File upload functionality via '+' button is not fully implemented yet.",
    });
  };

  return (
    <TooltipProvider>
      <form ref={formRef} onSubmit={onFormSubmit} className="w-full">
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-4 sm:p-5 w-full">
          <Label htmlFor="query-input" className="text-sm font-medium text-muted-foreground px-1 block mb-2">
            Ask anything
          </Label>
          <Input
            id="query-input"
            type="text"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="" // Placeholder is handled by the Label now
            className="w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-1 text-base h-auto mb-3 sm:mb-4"
            aria-label="Research query input"
          />
          {/* Hidden file input for the Plus button */}
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf" onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              toast({ title: "File Selected", description: e.target.files[0].name });
              // Here you would typically proceed with file upload/analysis
              // For example, calling handleResearch with an indicator that a PDF is involved
            }
          }}/>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    aria-label="Upload document or add context"
                    className="h-9 w-9 rounded-full shrink-0"
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
                size="sm"
                className="font-medium rounded-full px-4 py-2 h-9 text-xs sm:text-sm"
                onClick={() => handleSubmitLogic('search')}
                disabled={isResearchPending}
                aria-label="Perform a quick search"
              >
                Search
              </Button>

              <Button
                type="button"
                variant="secondary" // Using secondary for a filled, lighter background
                size="sm"
                className="font-medium rounded-full px-4 py-2 h-9 text-xs sm:text-sm"
                onClick={() => handleSubmitLogic('research')}
                disabled={isResearchPending}
                aria-label="Perform an AI-enhanced deep research"
              >
                <SearchCode className="mr-1.5 h-4 w-4 shrink-0" />
                {isResearchPending ? "Researching..." : "Deep research"}
              </Button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0" // Using secondary for gray filled button
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
