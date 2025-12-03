import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env then environment-specific .env.<NODE_ENV>
dotenv.config({ path: path.resolve(__dirname, '.env') });
const envName = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `.env.${envName}`);
dotenv.config({ path: envPath });

console.log(`✓ Environment loaded: ${envName}`);
console.log(`✓ OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`✓ ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET'}`);
