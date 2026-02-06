/**
 * Load .env from project root before any other server code runs.
 * Import this first in index.ts so ENV keys are available.
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
dotenv.config({ path: join(projectRoot, '.env') });
