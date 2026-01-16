import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env then environment-specific .env.<NODE_ENV>
dotenv.config({ path: path.resolve(__dirname, ".env") });
const envName = process.env.NODE_ENV || "development";
const envPath = path.resolve(__dirname, `.env.${envName}`);
dotenv.config({ path: envPath });

// Log environment status (skip in test mode)
if (process.env.NODE_ENV !== "test") {
  console.log(`✓ Environment loaded: ${envName}`);
  console.log("[BOOT] AI provider env", {
    geminiApiKeyPresent: Boolean(process.env.GEMINI_API_KEY),
    openaiApiKeyPresent: Boolean(process.env.OPENAI_API_KEY),
    anthropicApiKeyPresent: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
