
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
import { Input } from "@/components/ui/input"; // Keep for potential future use if structure changes
import { Button } from "@/components/ui/button"; // Keep for potential future use if structure changes
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, SearchCode, ArrowUp } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";


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
    if (!query.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0)) {
      toast({
        title: "Query or File Required",
        description: "Please enter a research question or upload a file.",
        variant: "destructive",
      });
      return;
    }

    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set('query', query);


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
      handleSubmitLogic('search'); // Default action on Enter
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

  // Default form submission (e.g., triggered by Enter key or the primary submit button)
  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmitLogic('search');
  };

  const isSubmitDisabled = isResearchPending || (!query.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0));

  return (
    <TooltipProvider>
      <motion.form
        ref={formRef}
        onSubmit={onFormSubmit}
        className="w-full bg-card/70 text-card-foreground rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 backdrop-blur-sm p-6 sm:p-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="relative flex items-center border-b border-input/50 mb-4 sm:mb-6">
          {/* Input Field */}
          <motion.input
            id="query-input"
            type="text"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask anything..."
            className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none pl-3 pr-10 py-2 text-base h-auto"
            aria-label="Research query input"
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          name="document"
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelected}
          aria-label="Upload document"
        />

        {/* Action Buttons Container */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Aligned Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            {/* Plus Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  aria-label="Upload document or add context"
                  className="h-6 w-6 flex items-center justify-center rounded-full shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-in-out active:scale-95"
                  onClick={handlePlusButtonClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus className="h-3 w-3" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload document (PDF, DOC, TXT)</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Deep Research Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                 <motion.button
                  type="button"
                  className={cn(
                    "font-medium rounded-full px-3 h-7 text-xs flex items-center justify-center gap-1", 
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    "transition-all duration-200 ease-in-out active:scale-95",
                    isSubmitDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleSubmitLogic('research')}
                  disabled={isSubmitDisabled}
                  aria-label="Perform an AI-enhanced deep research"
                  whileHover={{ scale: isSubmitDisabled ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitDisabled ? 1 : 0.95 }}
                >
                  <SearchCode className="h-3 w-3 shrink-0 mr-1" /> 
                  Deep Research
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Perform AI-enhanced deep research using your query and/or uploaded document.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right Aligned Button (Send) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="submit"
                aria-label="Submit query"
                className={cn(
                    "h-6 w-6 flex items-center justify-center rounded-full shrink-0", 
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "transition-all duration-200 ease-in-out active:scale-95",
                    isSubmitDisabled && "opacity-50 cursor-not-allowed"
                  )}
                disabled={isSubmitDisabled}
                whileHover={{ scale: isSubmitDisabled ? 1 : 1.1 }}
                whileTap={{ scale: isSubmitDisabled ? 1 : 0.9 }}
              >
                <ArrowUp className="h-3 w-3" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Submit query</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.form>
    </TooltipProvider>
  );
}
