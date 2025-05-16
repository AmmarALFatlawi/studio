import { config } from 'dotenv';
config();

import '@/ai/flows/generate-report.ts';
import '@/ai/flows/refine-query.ts';
import '@/ai/flows/extract-data.ts';