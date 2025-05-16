
"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // For potentially better editing experience
import { FileText, Trash2, MessageSquare, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import type { ExtractedEvidenceData } from '@/ai/flows/extract-evidence-flow'; // Import the type
import Link from 'next/link';

// Mock data based on ExtractedEvidenceData type
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
    // quote: "No specific quote available." // Example of optional quote
  },
];


export default function NotebookPage() {
  const [studies, setStudies] = useState<ExtractedEvidenceData[]>(initialMockStudies);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnId: keyof ExtractedEvidenceData | 'study' | null } | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Record<number, boolean>>({});

  // In a real app, you'd fetch this data, perhaps based on selected studies or uploaded PDFs
  // For now, we use mock data.
  // useEffect(() => {
  //   // Example: fetchNotebookData().then(data => setStudies(data));
  // }, []);

  const handleCellChange = (rowIndex: number, columnId: keyof ExtractedEvidenceData, value: string) => {
    // This is a simple in-memory update.
    // In a real app, you'd likely have a more robust state management (e.g., Zustand, Redux)
    // and potentially API calls to save changes.
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

  const renderEditableCell = (rowIndex: number, columnId: keyof ExtractedEvidenceData, value: string | string[] | number) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          handleCellChange(rowIndex, columnId, e.currentTarget.innerText);
          setEditingCell(null);
        }}
        onClick={() => setEditingCell({ rowIndex, columnId })}
        className={`p-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-ring focus:bg-muted/50 rounded-sm ${
          editingCell?.rowIndex === rowIndex && editingCell?.columnId === columnId ? 'ring-2 ring-ring bg-muted/50' : 'hover:bg-muted/30'
        }`}
      >
        {displayValue}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="mb-0">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-primary">Deep Dive Notebook</h1>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Export Notebook
          </Button>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Review and edit the extracted evidence from your selected studies. Click on any cell to edit its content.
          Changes are not saved in this demo.
        </p>

        {studies.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your Notebook is Empty</h2>
            <p className="text-muted-foreground">Add studies or upload documents to start populating your evidence table.</p>
            <Button asChild className="mt-4">
              <Link href="/">Go to Search</Link>
            </Button>
          </div>
        ) : (
        <div className="overflow-x-auto bg-card p-0 rounded-lg shadow-md border">
          <Table className="min-w-full">
            <TableHeader className="bg-primary text-primary-foreground">
              <TableRow>
                <TableHead className="w-[250px] text-primary-foreground">Study</TableHead>
                <TableHead className="w-[180px] text-primary-foreground">Population / Sample</TableHead>
                <TableHead className="w-[150px] text-primary-foreground">Intervention / Topic</TableHead>
                <TableHead className="w-[150px] text-primary-foreground">Methodology</TableHead>
                <TableHead className="min-w-[300px] text-primary-foreground">Key Results</TableHead>
                <TableHead className="min-w-[300px] text-primary-foreground">Supporting Quote</TableHead>
                <TableHead className="w-[120px] text-center text-primary-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studies.map((study, rowIndex) => (
                <TableRow key={rowIndex} className="group hover:bg-muted/10">
                  <TableCell className="align-top py-3">
                    <div className="font-semibold text-primary">{study.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {study.authors.join(', ')} ({study.year})
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-3">
                    {renderEditableCell(rowIndex, 'population', study.population)}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    {renderEditableCell(rowIndex, 'interventionOrTopic', study.interventionOrTopic)}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    {renderEditableCell(rowIndex, 'methodology', study.methodology)}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    {renderEditableCell(rowIndex, 'keyResults', study.keyResults)}
                  </TableCell>
                  <TableCell className="align-top py-3">
                    {study.quote && study.quote.toLowerCase() !== 'no specific quote available.' ? (
                      <div>
                        <button 
                          onClick={() => toggleQuoteExpansion(rowIndex)}
                          className="flex items-center text-xs text-accent hover:underline mb-1"
                        >
                          {expandedQuotes[rowIndex] ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                          {expandedQuotes[rowIndex] ? 'Hide' : 'Show'} Quote
                        </button>
                        {expandedQuotes[rowIndex] && (
                           <blockquote className="mt-1 p-2 border-l-4 border-accent bg-muted/30 text-sm text-muted-foreground rounded-r-sm italic">
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
                  <TableCell className="align-top py-3 text-center">
                    <div className="flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <Button variant="ghost" size="sm" className="h-7 w-full justify-start px-2 text-accent hover:bg-accent/10 hover:text-accent-foreground">
                        <FileText size={14} className="mr-1.5" /> View Paper
                      </Button>
                       <Button variant="ghost" size="sm" className="h-7 w-full justify-start px-2 text-accent hover:bg-accent/10 hover:text-accent-foreground">
                        <MessageSquare size={14} className="mr-1.5" /> Comment
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeStudy(rowIndex)} className="h-7 w-full justify-start px-2 text-destructive hover:bg-destructive/10 hover:text-destructive-foreground">
                        <Trash2 size={14} className="mr-1.5" /> Remove
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
    </div>
  );
}
