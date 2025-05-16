
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { generateReport, type GenerateReportInput, type GenerateReportOutput, type StudyData } from '@/ai/flows/generate-report';
import { ArrowLeft, Edit3, RefreshCw, Clipboard as ClipboardIcon, Download, Copy, Link2, FileText, MessageSquarePlus } from "lucide-react";
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CommentAssistantDialog } from '@/components/collaboration/CommentAssistantDialog'; // Added import

// Mock data for studies, similar to ExtractedEvidenceData from notebook
const mockStudiesInput: StudyData[] = [
  {
    title: "The Impact of Remote Work on Employee Productivity: A Longitudinal Study",
    authors: ["Dr. Alice Wonderland", "Dr. Bob The Builder"],
    year: 2023,
    population: "500 employees from 10 tech companies",
    interventionOrTopic: "Transition to full-time remote work",
    methodology: "Longitudinal Survey & Productivity Metrics Analysis",
    keyResults: "Productivity increased by 10% on average, but collaborative task efficiency saw a slight decrease of 5%.",
    quote: "While individual task output improved, metrics related to complex collaborative projects indicated a need for better remote teamwork tools."
  },
  {
    title: "Mindfulness Meditation and Stress Reduction in College Students",
    authors: ["Prof. Charles Xavier", "Dr. Jean Grey"],
    year: 2022,
    population: "150 undergraduate students",
    interventionOrTopic: "8-week mindfulness meditation program",
    methodology: "Randomized Controlled Trial (RCT)",
    keyResults: "Students in the mindfulness group reported a significant 30% reduction in perceived stress levels compared to the control group.",
    quote: "The study provides strong evidence for the efficacy of mindfulness-based interventions in managing stress among college students."
  },
  {
    title: "AI in Early Cancer Detection: A Systematic Review",
    authors: ["Dr. Emily Carter", "Dr. Ben Stone"],
    year: 2024,
    population: "N/A (Review of 120 peer-reviewed articles)",
    interventionOrTopic: "Application of AI algorithms in diagnostic imaging for cancer",
    methodology: "Systematic Review and Meta-analysis",
    keyResults: "AI models demonstrate comparable or superior accuracy to human experts in identifying cancerous anomalies in several imaging modalities.",
    quote: "No specific quote available."
  },
];

const mockResearchTopic = "The impact of modern workplace practices and AI on productivity and well-being.";

// Simple Markdown table to HTML parser
interface TableData {
  headers: string[];
  rows: string[][];
}

function parseMarkdownTable(markdown: string): TableData | null {
  if (!markdown) return null;
  const lines = markdown.trim().split('\n');
  if (lines.length < 2) return null; // Header and separator line needed

  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
  // Basic check for separator line
  if (!lines[1].includes('---')) return null; 
  
  const rows = lines.slice(2).map(line => 
    line.split('|').map(cell => cell.trim()).filter((cell, index) => index < headers.length || (index === 0 && cell === '')) // Handle potential empty first cell from leading |
    .filter((cell, index) => headers[index] !== undefined || cell !== '') // ensure we only take cells for defined headers
  ).filter(row => row.length === headers.length && row.some(cell => cell !== ''));


  // Filter out rows that don't match header count after initial parse
  const validRows = rows.filter(row => row.length === headers.length);

  return { headers, rows: validRows };
}


const RenderedMarkdownTable: React.FC<{ markdown: string }> = ({ markdown }) => {
  const tableData = useMemo(() => parseMarkdownTable(markdown), [markdown]);

  if (!tableData || tableData.headers.length === 0) {
    return <p className="text-muted-foreground italic">Could not render table from Markdown.</p>;
  }

  return (
    <div className="overflow-x-auto my-4 border rounded-md">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            {tableData.headers.map((header, index) => (
              <th key={index} className="px-4 py-2 text-left text-sm font-semibold text-foreground tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-sm text-foreground whitespace-normal">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export default function ReportComposerPage() {
  const [reportData, setReportData] = useState<GenerateReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // State for Comment Assistant Dialog
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedTextForComment, setSelectedTextForComment] = useState("");
  const MOCK_REPORT_ID = "report-composer-001"; // Example report ID

  const sampleReportSnippet = "The initial findings suggest a strong correlation between daily exercise and improved cognitive scores in the elderly population. However, the study acknowledges limitations regarding the homogeneity of its sample, primarily consisting of retired academics from a single urban center. Future research should aim to replicate these findings in more diverse demographic groups and explore long-term effects beyond a six-month period.";


  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true);
      setError(null);
      try {
        const input: GenerateReportInput = {
          studies: mockStudiesInput,
          researchTopic: mockResearchTopic,
        };
        const response = await generateReport(input);
        setReportData(response);
      } catch (e: any) {
        console.error("Error generating report:", e);
        setError(`Failed to generate report: ${e.message || 'Unknown error'}`);
        toast({
          title: "Error Generating Report",
          description: e.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [toast]);

  const Section: React.FC<{ title: string; content: string | React.ReactNode; onCopy: () => void; onComment?: () => void }> = 
    ({ title, content, onCopy, onComment }) => (
    <Card className="mb-6 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-2xl font-semibold text-primary font-sans">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {onComment && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label={`Comment on ${title}`} onClick={onComment}>
              <MessageSquarePlus size={18} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label={`Edit ${title}`} onClick={() => toast({ title: `Edit ${title}`, description: "This feature is not yet implemented."})}>
            <Edit3 size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label={`Regenerate ${title}`} onClick={() => toast({ title: `Regenerate ${title}`, description: "This feature is not yet implemented."})}>
            <RefreshCw size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label={`Copy ${title}`} onClick={onCopy}>
            <ClipboardIcon size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {typeof content === 'string' ? <p className="text-foreground font-serif leading-relaxed whitespace-pre-line">{content}</p> : content}
      </CardContent>
    </Card>
  );

  const copyToClipboard = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: `${sectionName} Copied!`, description: "Content copied to clipboard." }))
      .catch(err => toast({ title: "Copy Failed", description: `Could not copy: ${err}`, variant: "destructive" }));
  };

  const handleOpenCommentDialog = (text: string) => {
    setSelectedTextForComment(text);
    setIsCommentDialogOpen(true);
  };

  const handleSaveComment = (commentData: {
    reportId: string;
    originalSelection: string;
    comment: string;
    suggestedEdit?: string;
    tag: string;
    userIntent: string;
  }) => {
    // In a real app, you'd send this to a backend or state management
    console.log("Comment to save:", commentData);
    // For now, just log it. The dialog will show a toast.
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-1/4 mb-4" /> {/* Back button skeleton */}
          <Skeleton className="h-10 w-1/2 mb-8" /> {/* Page title skeleton */}
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="mb-6 shadow-md">
              <CardHeader>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center justify-center">
        <FileText size={48} className="text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Report Generation Failed</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">{error}</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back Home
          </Link>
        </Button>
      </div>
    );
  }

  if (!reportData) {
     return (
      <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center justify-center">
        <FileText size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">No Report Data</h2>
        <p className="text-muted-foreground mb-6">Could not load report data. Please try again.</p>
         <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back Home
          </Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Button variant="outline" asChild className="mb-2 sm:mb-0">
              <Link href="/notebook"> {/* Or back to where studies were selected from */}
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Notebook
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-primary font-sans mt-2">Generated Research Report</h1>
            <p className="text-muted-foreground font-sans">Review, edit, and export your AI-generated report below.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 self-start sm:self-center">
            <Button variant="outline" className="text-accent border-accent hover:bg-accent/10 hover:text-accent-foreground" onClick={() => toast({ title: "Publish Link", description: "This feature is not yet implemented."})}>
              <Link2 className="mr-2 h-4 w-4" /> Publish Link
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => toast({ title: "Download PDF", description: "This feature is not yet implemented."})}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button onClick={() => copyToClipboard(
              `# Introduction\n\n${reportData.introduction}\n\n## Summary of Evidence\n\n${reportData.summaryOfEvidence}\n\n## Key Results Table\n\n${reportData.keyResultsTableMd}\n\n## Conclusion\n\n${reportData.conclusion}`,
              "Full Report Markdown"
            )}>
              <Copy className="mr-2 h-4 w-4" /> Copy Markdown
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Sample Report Snippet for Commenting */}
        <Card className="mb-6 shadow-md">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary font-sans">Sample Report Snippet</CardTitle>
                <CardDescription>Use this snippet to test the AI Comment Assistant.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-foreground font-serif leading-relaxed whitespace-pre-line mb-4">
                    {sampleReportSnippet}
                </p>
                <Button 
                    variant="outline" 
                    onClick={() => handleOpenCommentDialog(sampleReportSnippet)}
                    className="text-accent border-accent hover:bg-accent/10 hover:text-accent-foreground"
                >
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Comment on this Snippet
                </Button>
            </CardContent>
        </Card>

        <Separator className="my-6" />


        <Section 
          title="Introduction" 
          content={reportData.introduction} 
          onCopy={() => copyToClipboard(reportData.introduction, "Introduction")}
          onComment={() => handleOpenCommentDialog(reportData.introduction)}
        />
        <Section 
          title="Summary of Evidence" 
          content={reportData.summaryOfEvidence} 
          onCopy={() => copyToClipboard(reportData.summaryOfEvidence, "Summary of Evidence")}
          onComment={() => handleOpenCommentDialog(reportData.summaryOfEvidence)}
        />
        <Section 
          title="Key Results Table" 
          content={<RenderedMarkdownTable markdown={reportData.keyResultsTableMd} />}
          onCopy={() => copyToClipboard(reportData.keyResultsTableMd, "Key Results Table")}
          // Commenting on a table might be complex, omitting for now
        />
        <Section 
          title="Conclusion" 
          content={reportData.conclusion}
          onCopy={() => copyToClipboard(reportData.conclusion, "Conclusion")}
          onComment={() => handleOpenCommentDialog(reportData.conclusion)}
        />

      </div>

      {selectedTextForComment && (
        <CommentAssistantDialog
            isOpen={isCommentDialogOpen}
            onOpenChange={setIsCommentDialogOpen}
            selectedContent={selectedTextForComment}
            reportId={MOCK_REPORT_ID}
            onCommentSave={handleSaveComment}
        />
      )}
    </div>
  );
}

