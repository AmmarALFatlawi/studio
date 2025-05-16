
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, MessageSquare } from "lucide-react";
import { assistComment, type AssistCommentInput, type AssistCommentOutput } from '@/ai/flows/assist-comment-flow';
import { useToast } from '@/hooks/use-toast';

interface CommentAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContent: string;
  reportId: string; // Or some identifier for where the comment belongs
  onCommentSave: (commentData: {
    reportId: string;
    originalSelection: string;
    comment: string;
    suggestedEdit?: string;
    tag: string;
    userIntent: string;
  }) => void;
}

export function CommentAssistantDialog({
  isOpen,
  onOpenChange,
  selectedContent,
  reportId,
  onCommentSave,
}: CommentAssistantDialogProps) {
  const [userIntent, setUserIntent] = useState("");
  const [aiAssistance, setAiAssistance] = useState<AssistCommentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Reset state when dialog is closed or selectedContent changes
    if (isOpen) {
        // Optionally pre-fill if needed, or just ensure it's clean
        // setUserIntent(""); 
        // setAiAssistance(null);
    } else {
      setUserIntent("");
      setAiAssistance(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Reset user intent and AI assistance if selected content changes while dialog is open
  useEffect(() => {
    setUserIntent("");
    setAiAssistance(null);
  }, [selectedContent]);


  const handleGetAssistance = async () => {
    if (!userIntent.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your initial thought or question for the comment.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setAiAssistance(null);
    try {
      const input: AssistCommentInput = {
        selectedContent,
        userIntent,
      };
      const response = await assistComment(input);
      setAiAssistance(response);
    } catch (error: any) {
      console.error("Error getting AI assistance:", error);
      toast({
        title: "AI Assistance Failed",
        description: error.message || "Could not get suggestions from AI.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveComment = () => {
    if (!aiAssistance?.comment && !userIntent.trim()) {
        toast({
            title: "Cannot Save",
            description: "Please provide an initial comment or generate AI assistance first.",
            variant: "destructive",
        });
        return;
    }

    // If AI assistance was used, save that. Otherwise, save the user's direct intent as the comment.
    const commentToSave = aiAssistance?.comment || userIntent;
    const tagToSave = aiAssistance?.tag || "General"; // Default tag if no AI assistance

    onCommentSave({
      reportId,
      originalSelection: selectedContent,
      comment: commentToSave,
      suggestedEdit: aiAssistance?.suggestedEdit,
      tag: tagToSave,
      userIntent: userIntent, // Always save the original user intent
    });
    toast({
        title: "Comment Saved (Mock)",
        description: "Your comment has been logged to the console."
    })
    onOpenChange(false); // Close dialog on save
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl shadow-xl rounded-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-primary flex items-center text-xl">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            AI Comment Assistant
          </DialogTitle>
          <DialogDescription className="pt-1">
            Refine your comment on the selected text. The AI can help clarify your thoughts or suggest improvements.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1 pr-3">
          <div>
            <Label htmlFor="selected-content" className="font-semibold text-foreground text-base">
              Selected Text from Report:
            </Label>
            <p
              id="selected-content"
              className="mt-2 text-sm text-muted-foreground bg-muted/80 p-3 rounded-md max-h-40 overflow-y-auto border"
            >
              "{selectedContent}"
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-intent" className="font-semibold text-foreground text-base">
              Your Initial Thought / Question:
            </Label>
            <Textarea
              id="user-intent"
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder="E.g., 'This seems unclear', 'What about X?', 'Great point!'"
              className="min-h-[100px] text-base"
            />
          </div>

          <Button onClick={handleGetAssistance} disabled={isLoading || !userIntent.trim()} className="w-full sm:w-auto justify-center py-3 text-base bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "Getting Suggestions..." : "Assist with AI"}
          </Button>

          {aiAssistance && (
            <div className="mt-4 p-4 border border-primary/30 rounded-md bg-primary/5 space-y-4 shadow-sm">
              <div>
                <Label className="font-semibold text-primary text-base">AI Suggested Comment:</Label>
                <p className="mt-1 text-sm text-card-foreground whitespace-pre-line bg-background p-2 rounded-md border">
                  {aiAssistance.comment}
                </p>
              </div>
              {aiAssistance.suggestedEdit && (
                 <div>
                    <Label className="font-semibold text-primary text-base">AI Suggested Edit for Original Text:</Label>
                    <p className="mt-1 text-sm text-card-foreground italic whitespace-pre-line bg-background p-2 rounded-md border">
                      {aiAssistance.suggestedEdit}
                    </p>
                </div>
              )}
               <div>
                <Label className="font-semibold text-primary text-base">Suggested Tag:</Label>
                <Badge variant="secondary" className="ml-2 text-sm py-1 px-2 bg-accent/20 text-accent-foreground">
                  {aiAssistance.tag}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" className="py-2 px-4 text-base">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveComment} disabled={(!aiAssistance?.comment && !userIntent.trim()) || isLoading} className="py-2 px-4 text-base">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
