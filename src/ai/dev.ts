
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-report.ts';
import '@/ai/flows/refine-query.ts';
import '@/ai/flows/extract-data.ts';
import '@/ai/flows/smart-search-flow.ts';
import '@/ai/flows/extract-evidence-flow.ts'; 
import '@/ai/flows/chat-with-pdf-flow.ts';
import '@/ai/flows/assist-comment-flow.ts'; // Added new flow

// Ensure all flows are imported so Genkit can discover them.
// The generate-report flow has been updated, so this import is still correct.
