
"use client";

import type { FormEvent } from 'react';
import { useState, useTransition, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    }
  };

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
      <motion.form
        ref={formRef}
        onSubmit={onFormSubmit}
        className="w-full bg-card/70 text-card-foreground rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 backdrop-blur-sm p-6 sm:p-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="relative flex items-center">
          <motion.input
            id="query-input"
            type="text"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Ask anything..."
            className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none pl-3 pr-10 py-4 text-xl h-auto"
            aria-label="Research query input"
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
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

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 sm:mt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  aria-label="Upload document or add context"
                  className="h-12 w-12 flex items-center justify-center rounded-full shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-in-out active:scale-95"
                  onClick={handlePlusButtonClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus className="h-6 w-6" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload document (PDF, DOC, TXT)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  variant="secondary"
                  className={cn(
                    "font-medium rounded-full px-5 h-10 text-sm flex items-center justify-center gap-1.5",
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    "transition-all duration-200 ease-in-out active:scale-95"
                  )}
                  onClick={() => handleSubmitLogic('research')}
                  disabled={isResearchPending || (!query.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0))}
                  aria-label="Perform an AI-enhanced deep research"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SearchCode className="h-5 w-5 shrink-0" />
                  {isResearchPending ? "Researching..." : "Deep Research"}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Perform AI-enhanced deep research using your query and/or uploaded document.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="submit"
                variant="default"
                className={cn(
                  "h-12 w-12 flex items-center justify-center rounded-full shrink-0",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "transition-all duration-200 ease-in-out active:scale-95"
                )}
                aria-label="Submit query"
                disabled={isResearchPending || (!query.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0))}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowUp className="h-6 w-6" />
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

    