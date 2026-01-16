import { AIModelAdapter } from "./AIModelAdapter.js";
import { callLLM } from "../../../services/llm.js";

export class GPTAdapter extends AIModelAdapter {
  constructor({ apiKey } = {}) {
    super();
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  async generateMessage({
    messages = [],
    model = "gpt-4-turbo",
    maxTokens = 800,
    jsonMode = false,
  } = {}) {
    try {
      const response = await callLLM({
        messages,
        model,
        maxTokens,
        jsonSchema: jsonMode ? { type: "object" } : undefined,
      });

      return { ok: true, contentText: response.text || "" };
    } catch (error) {
      return { ok: false, error: error.message || "LLM request failed" };
    }
  }
}

export default GPTAdapter;
