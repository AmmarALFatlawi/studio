
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, SearchCode, ArrowUp } from "lucide-react";
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
      // Optionally, you could update the UI to show the selected file name
    }
  };

  // This function is called when the form is submitted by pressing Enter in the input
  // or by clicking the primary submit button (ArrowUp).
  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        <div className="bg-card text-card-foreground rounded-2xl shadow-xl p-3 sm:p-4">
          <div className="relative flex items-center">
            {/* Removed explicit Label "Ask anything..." */}
            <Input
              id="query-input"
              type="text"
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask anything..."
              className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none pl-3 pr-10 py-3 text-lg h-auto"
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
            aria-label="Upload document"
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
              
              {/* "Search" button removed as per user request */}

              <Button
                type="button"
                variant="secondary"
                className="font-medium rounded-full px-2 h-7 text-xs transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-95"
                onClick={() => handleSubmitLogic('research')}
                disabled={isResearchPending || (!query.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0))}
                aria-label="Perform an AI-enhanced deep research"
              >
                <SearchCode className="mr-1 h-3 w-3 shrink-0" />
                {isResearchPending ? "Researching..." : "Deep Research"}
              </Button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit" // This makes it the default submit button for the form
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
