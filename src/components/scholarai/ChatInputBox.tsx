
"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, ExternalLink } from "lucide-react";

interface ChatInputBoxProps {
  onSendMessage?: (message: string) => void;
  className?: string;
}

export function ChatInputBox({ onSendMessage, className }: ChatInputBoxProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (inputValue.trim()) {
      if (onSendMessage) {
        onSendMessage(inputValue.trim());
      } else {
        // Fallback if no handler is provided, e.g., for standalone use/demo
        console.log("ChatInputBox: Send:", inputValue.trim());
      }
      setInputValue(""); // Clear input after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height to allow shrinking
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Recalculate
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height before calculating new height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <Card className={`w-full shadow-md rounded-lg border border-border ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
        <CardTitle className="text-base font-medium text-primary">Chat</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => console.log("Expand clicked (not implemented)")}>
                <ExternalLink size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Expand chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-0">
        {/* Input area with specific background */}
        <div className="relative p-4 bg-[#F8F8F8] dark:bg-muted/30 rounded-b-lg">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the report or its underlying data"
            className="w-full py-3 pl-4 pr-14 text-sm md:text-base text-[#333333] dark:text-foreground 
                       bg-transparent border border-gray-300 dark:border-gray-600 rounded-md 
                       focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0
                       shadow-none resize-none overflow-y-auto min-h-[50px] max-h-[150px]"
            rows={1}
            style={{ scrollbarWidth: 'thin' }} // For Firefox
          />
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 mr-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90
                               disabled:bg-muted disabled:text-muted-foreground"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                  >
                    <ArrowRight size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
