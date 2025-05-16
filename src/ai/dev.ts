
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-report.ts';
import '@/ai/flows/refine-query.ts';
import '@/ai/flows/extract-data.ts';
import '@/ai/flows/smart-search-flow.ts'; // Added new flow
