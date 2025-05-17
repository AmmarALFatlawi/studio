
"use client";

import React, { useState, Suspense } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, MessageSquare, ChevronDown, ChevronRight, ArrowLeft, Download, Loader2 } from "lucide-react";
import type { ExtractedEvidenceData } from '@/ai/flows/extract-evidence-flow';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const initialMockStudies: ExtractedEvidenceData[] = [
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
    keyResults: "AI models demonstrate comparable or superior accuracy to human experts in identifying cancerous Pxomalies in several imaging modalities.",
  },
];

function NotebookContent() {
  const [studies, setStudies] = useState<ExtractedEvidenceData[]>(initialMockStudies);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnId: keyof ExtractedEvidenceData | 'study' | null } | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<number, boolean>>({});


  const handleCellChange = (rowIndex: number, columnId: keyof ExtractedEvidenceData, value: string) => {
    setStudies(prevStudies =>
      prevStudies.map((study, index) => {
        if (index === rowIndex) {
          if (columnId === 'year' && !isNaN(Number(value))) {
            return { ...study, [columnId]: Number(value) };
          }
          if (columnId === 'authors' && typeof value === 'string') {
             return { ...study, [columnId]: value.split(',').map(author => author.trim()) };
          }
          return { ...study, [columnId]: value };
        }
        return study;
      })
    );
  };
  
  const removeStudy = (rowIndex: number) => {
    setStudies(prevStudies => prevStudies.filter((_, index) => index !== rowIndex));
  };

  const toggleQuoteExpansion = (rowIndex: number) => {
    setExpandedQuotes(prev => ({ ...prev, [rowIndex]: !prev[rowIndex] }));
  };

  const renderEditableCell = (rowIndex: number, columnId: keyof ExtractedEvidenceData, value: string | string[] | number | undefined) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          handleCellChange(rowIndex, columnId, e.currentTarget.innerText);
          setEditingCell(null);
        }}
        onClick={() => setEditingCell({ rowIndex, columnId })}
        className={`p-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:bg-muted/50 rounded-md text-sm ${
          editingCell?.rowIndex === rowIndex && editingCell?.columnId === columnId ? 'ring-2 ring-ring bg-muted/50' : 'hover:bg-muted/30'
        }`}
      >
        {displayValue}
      </div>
    );
  };


  return (
    <main className="min-h-screen w-full bg-background p-6 md:px-12 md:py-8">
      <div className="max-w-5xl mx-auto w-full"> 
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="transition-transform duration-200 ease-in-out hover:scale-105">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-primary">Deep Dive Notebook</h1>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-98">
            <Download className="mr-2 h-4 w-4" />
            Export Notebook
          </Button>
        </div>
        
        <p className="text-muted-foreground mb-8 text-md">
          Review and edit the extracted evidence from your selected studies. Click on any cell to edit its content.
        </p>

        {studies.length === 0 ? (
          <Card className="text-center py-16 shadow-xl rounded-xl">
            <CardHeader>
                <FileText size={56} className="mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-2xl font-semibold text-foreground mb-2">Your Notebook is Empty</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-md">Add studies or upload documents to start populating your evidence table.</p>
                <Button asChild className="mt-6 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg active:scale-98">
                <Link href="/">Go to Search</Link>
                </Button>
            </CardContent>
          </Card>
        ) : (
        <div className="overflow-x-auto bg-card p-0 rounded-xl shadow-xl border">
          <Table className="min-w-full">
            <TableHeader className="bg-primary text-primary-foreground">
              <TableRow>
                <TableHead className="w-[300px] p-4 text-primary-foreground font-semibold text-sm">Study</TableHead>
                <TableHead className="w-[200px] p-4 text-primary-foreground font-semibold text-sm">Population / Sample</TableHead>
                <TableHead className="w-[200px] p-4 text-primary-foreground font-semibold text-sm">Intervention / Topic</TableHead>
                <TableHead className="w-[180px] p-4 text-primary-foreground font-semibold text-sm">Methodology</TableHead>
                <TableHead className="min-w-[350px] p-4 text-primary-foreground font-semibold text-sm">Key Results</TableHead>
                <TableHead className="min-w-[350px] p-4 text-primary-foreground font-semibold text-sm">Supporting Quote</TableHead>
                <TableHead className="w-[130px] p-4 text-center text-primary-foreground font-semibold text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studies.map((study, rowIndex) => (
                <TableRow key={rowIndex} className="group hover:bg-muted/20 transition-colors duration-150">
                  <TableCell className="align-top py-3 px-4">
                    <div className="font-semibold text-primary text-md">{study.title}</div>
                    <div className="text-xs text-muted-foreground mt-1.5">
                      {study.authors.join(', ')} ({study.year})
                    </div>
                  </TableCell>
                  <TableCell className="align-top p-1.5"> 
                    {renderEditableCell(rowIndex, 'population', study.population)}
                  </TableCell>
                  <TableCell className="align-top p-1.5">
                    {renderEditableCell(rowIndex, 'interventionOrTopic', study.interventionOrTopic)}
                  </TableCell>
                  <TableCell className="align-top p-1.5">
                    {renderEditableCell(rowIndex, 'methodology', study.methodology)}
                  </TableCell>
                  <TableCell className="align-top p-1.5">
                    {renderEditableCell(rowIndex, 'keyResults', study.keyResults)}
                  </TableCell>
                  <TableCell className="align-top py-3 px-4">
                    {study.quote && study.quote.toLowerCase() !== 'no specific quote available.' ? (
                      <div>
                        <button 
                          onClick={() => toggleQuoteExpansion(rowIndex)}
                          className="flex items-center text-xs text-accent hover:underline mb-1.5 font-medium"
                        >
                          {expandedQuotes[rowIndex] ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
                          {expandedQuotes[rowIndex] ? 'Hide' : 'Show'} Quote
                        </button>
                        {expandedQuotes[rowIndex] && (
                           <blockquote className="mt-1 p-1.5 border-l-4 border-accent bg-muted/30 text-sm text-muted-foreground rounded-r-md italic">
                            {renderEditableCell(rowIndex, 'quote', study.quote)}
                           </blockquote>
                        )}
                         {!expandedQuotes[rowIndex] && study.quote.length > 100 && (
                            <p className="text-sm text-muted-foreground italic line-clamp-2">
                                {study.quote.substring(0,100)}...
                            </p>
                         )}
                         {!expandedQuotes[rowIndex] && study.quote.length <= 100 && (
                            <p className="text-sm text-muted-foreground italic">
                                {study.quote}
                            </p>
                         )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No quote available.</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-3 px-4 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button variant="ghost" size="sm" className="h-8 w-full justify-start px-2.5 text-accent hover:bg-accent/10 hover:text-accent-foreground transition-all duration-150 ease-in-out hover:scale-105 active:scale-98">
                        <FileText size={14} className="mr-2" /> View Paper
                      </Button>
                       <Button variant="ghost" size="sm" className="h-8 w-full justify-start px-2.5 text-accent hover:bg-accent/10 hover:text-accent-foreground transition-all duration-150 ease-in-out hover:scale-105 active:scale-98">
                        <MessageSquare size={14} className="mr-2" /> Comment
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeStudy(rowIndex)} className="h-8 w-full justify-start px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive-foreground transition-all duration-150 ease-in-out hover:scale-105 active:scale-98">
                        <Trash2 size={14} className="mr-2" /> Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </div>
    </main>
  );
}


export default function NotebookPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading notebook...</p>
      </div>
    }>
      <NotebookContent />
    </Suspense>
  );
}

    