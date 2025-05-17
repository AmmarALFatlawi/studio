
"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { generateReport, type GenerateReportInput, type GenerateReportOutput, type StudyData } from '@/ai/flows/generate-report';
import { ArrowLeft, Edit3, RefreshCw, Clipboard as ClipboardIcon, Download, Copy, Link2, FileText, MessageSquarePlus, FileWarning, Loader2 } from "lucide-react";
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CommentAssistantDialog } from '@/components/collaboration/CommentAssistantDialog';

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

interface TableData {
  headers: string[];
  rows: string[][];
}

function parseMarkdownTable(markdown: string): TableData | null {
  if (!markdown) return null;
  const lines = markdown.trim().split('\n');
  if (lines.length < 2) return null; 

  const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
  if (!lines[1].includes('---')) return null; 
  
  const rows = lines.slice(2).map(line => 
    line.split('|').map(cell => cell.trim()).filter((cell, index) => index < headers.length || (index === 0 && cell === ''))
    .filter((cell, index) => headers[index] !== undefined || cell !== '')
  ).filter(row => row.length === headers.length && row.some(cell => cell !== ''));

  const validRows = rows.filter(row => row.length === headers.length);
  return { headers, rows: validRows };
}

const RenderedMarkdownTable: React.FC<{ markdown: string }> = ({ markdown }) => {
  const tableData = useMemo(() => parseMarkdownTable(markdown), [markdown]);

  if (!tableData || tableData.headers.length === 0) {
    return <p className="text-muted-foreground italic text-sm">Could not render table from Markdown.</p>;
  }

  return (
    <div className="overflow-x-auto my-4 border border-border rounded-lg shadow">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            {tableData.headers.map((header, index) => (
              <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/20 transition-colors">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm text-foreground whitespace-normal">
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


function ReportComposerContent() {
  const [reportData, setReportData] = useState<GenerateReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [selectedTextForComment, setSelectedTextForComment] = useState("");
  const MOCK_REPORT_ID = "report-composer-001";

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

  const copyToClipboard = useCallback((text: string, sectionName: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: `${sectionName} Copied!`, description: "Content copied to clipboard." }))
      .catch(err => toast({ title: "Copy Failed", description: `Could not copy: ${err}`, variant: "destructive" }));
  }, [toast]);

  const downloadFile = useCallback((content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: `${fileName} Downloaded`, description: "Check your downloads folder." });
  }, [toast]);

  const generateFullReportMarkdown = useCallback(() => {
    if (!reportData) return "";
    return `# Introduction\n\n${reportData.introduction}\n\n## Summary of Evidence\n\n${reportData.summaryOfEvidence}\n\n## Key Results Table\n\n${reportData.keyResultsTableMd}\n\n## Conclusion\n\n${reportData.conclusion}`;
  }, [reportData]);

  const generateStudiesCsv = useCallback(() => {
    const headers = "Title,Authors,Year,Study Type,Sample Size,Key Result,Supporting Quote\n";
    const rows = mockStudiesInput.map(study =>
      `"${study.title.replace(/"/g, '""')}","${study.authors.join('; ').replace(/"/g, '""')}","${study.year}","${(study.methodology || '').replace(/"/g, '""')}","${(study.population || '').replace(/"/g, '""')}","${study.keyResults.replace(/"/g, '""')}","${(study.quote || '').replace(/"/g, '""')}"`
    ).join("\n");
    return headers + rows;
  }, []);

  const generateStudiesRis = useCallback(() => {
    return mockStudiesInput.map(study => {
      let risString = `TY  - JOUR\n`; 
      risString += `TI  - ${study.title}\n`;
      study.authors.forEach(author => {
        risString += `AU  - ${author}\n`;
      });
      risString += `PY  - ${study.year}\n`;
      risString += `ER  - \n`;
      return risString;
    }).join("\n");
  }, []);


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
    console.log("Comment to save:", commentData);
  };

  const Section: React.FC<{ title: string; content: string | React.ReactNode; onCopy: () => void; onComment?: () => void }> = 
    ({ title, content, onCopy, onComment }) => (
    <Card className="mb-8 shadow-xl rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 p-6 border-b">
        <CardTitle className="text-2xl font-semibold text-primary">{title}</CardTitle>
        <div className="flex items-center gap-1.5">
          {onComment && (
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors" aria-label={`Comment on ${title}`} onClick={onComment}>
              <MessageSquarePlus size={20} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors" aria-label={`Edit ${title}`} onClick={() => toast({ title: `Edit ${title}`, description: "This feature is not yet implemented."})}>
            <Edit3 size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors" aria-label={`Regenerate ${title}`} onClick={() => toast({ title: `Regenerate ${title}`, description: "This feature is not yet implemented."})}>
            <RefreshCw size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors" aria-label={`Copy ${title}`} onClick={onCopy}>
            <ClipboardIcon size={20} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {typeof content === 'string' ? <p className="text-foreground/90 font-serif text-base md:text-lg leading-relaxed whitespace-pre-line">{content}</p> : content}
      </CardContent>
    </Card>
  );


  if (isLoading) {
    return (
      <main className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-3xl">
          <Skeleton className="h-10 w-1/4 mb-6" /> 
          <Skeleton className="h-12 w-3/5 mb-10" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="mb-8 shadow-xl rounded-xl">
              <CardHeader className="p-6 border-b">
                <Skeleton className="h-8 w-1/3 mb-2" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-full mb-3" />
                <Skeleton className="h-6 w-full mb-3" />
                <Skeleton className="h-6 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen w-full bg-background flex flex-col items-center justify-center text-center p-6 md:p-8">
        <FileWarning size={64} className="text-destructive mb-6" />
        <h2 className="text-3xl font-semibold text-destructive mb-3">Report Generation Failed</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">{error}</p>
        <Button asChild className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-98">
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" /> Go Back Home
          </Link>
        </Button>
      </main>
    );
  }

  if (!reportData) {
     return (
      <main className="min-h-screen w-full bg-background flex flex-col items-center justify-center text-center p-6 md:p-8">
        <FileText size={64} className="text-muted-foreground mb-6" />
        <h2 className="text-3xl font-semibold text-foreground mb-3">No Report Data</h2>
        <p className="text-lg text-muted-foreground mb-8">Could not load report data. Please try again.</p>
         <Button asChild className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-98">
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" /> Go Back Home
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-background p-6 md:px-12 md:py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <Button variant="outline" asChild className="mb-3 sm:mb-0 transition-transform duration-200 ease-in-out hover:scale-105">
              <Link href="/notebook"> 
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Notebook
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-primary mt-2">Generated Research Report</h1>
            <p className="text-md text-muted-foreground mt-1">Review, edit, and export your AI-generated report.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 mt-4 sm:mt-0 self-start sm:self-center w-full sm:w-auto">
            <Button variant="outline" className="text-accent border-accent hover:bg-accent/10 hover:text-accent-foreground font-medium w-full sm:w-auto transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-98" onClick={() => toast({ title: "Publish Link", description: "This feature is not yet implemented."})}>
              <Link2 className="mr-2 h-4 w-4" /> Publish Link
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium w-full sm:w-auto transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-98" onClick={() => toast({ title: "Download PDF", description: "This feature is not yet implemented."})}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-10">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(generateFullReportMarkdown(), "Full Report Markdown")} className="transition-all duration-200 ease-in-out hover:scale-105 active:scale-98">
              <Copy className="mr-2 h-4 w-4" /> Copy Full Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadFile(generateStudiesCsv(), 'contvia_evidence_table.csv', 'text/csv;charset=utf-8;')} className="transition-all duration-200 ease-in-out hover:scale-105 active:scale-98">
              <Download className="mr-2 h-4 w-4" /> Download Evidence (CSV)
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadFile(generateStudiesRis(), 'contvia_citations.ris', 'application/x-research-info-systems')} className="transition-all duration-200 ease-in-out hover:scale-105 active:scale-98">
              <Download className="mr-2 h-4 w-4" /> Download Citations (RIS)
            </Button>
        </div>


        <Separator className="my-8" />

        <Card className="mb-8 shadow-xl rounded-xl">
            <CardHeader className="p-6 border-b">
                <CardTitle className="text-xl font-semibold text-primary">Sample Report Snippet</CardTitle>
                <CardDescription className="text-sm">Use this snippet to test the AI Comment Assistant.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <p className="text-foreground/90 font-serif text-base md:text-lg leading-relaxed whitespace-pre-line mb-4">
                    {sampleReportSnippet}
                </p>
                <Button 
                    variant="outline" 
                    onClick={() => handleOpenCommentDialog(sampleReportSnippet)}
                    className="text-accent border-accent hover:bg-accent/10 hover:text-accent-foreground font-medium transition-all duration-200 ease-in-out hover:scale-105 active:scale-98"
                >
                    <MessageSquarePlus className="mr-2 h-4 w-4" /> Comment on this Snippet
                </Button>
            </CardContent>
        </Card>

        <Separator className="my-8" />

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
    </main>
  );
}

export default function ReportComposerPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading report composer...</p>
      </div>
    }>
      <ReportComposerContent />
    </Suspense>
  );
}

    