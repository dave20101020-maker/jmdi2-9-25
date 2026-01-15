import OpenAI from "openai";
import { AIModelAdapter } from "./AIModelAdapter.js";

export class GPTAdapter extends AIModelAdapter {
  constructor({ apiKey } = {}) {
    super();
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
  }

  async generateMessage({
    messages = [],
    model = "gpt-4-turbo",
    maxTokens = 800,
    jsonMode = false,
  } = {}) {
    if (!this.client) {
      return {
        ok: false,
        error: "OpenAI client not configured",
      };
    }

    try {
      const response = await this.client.beta.messages.create({
        model,
        max_tokens: maxTokens,
        messages,
        betas: jsonMode ? ["openai-beta.json-mode-latest"] : undefined,
      });

      const content = response.content?.[0];
      if (!content || content.type !== "text") {
        return { ok: false, error: "Unexpected response type from OpenAI" };
      }

      return { ok: true, contentText: content.text || "" };
    } catch (error) {
      return { ok: false, error: error.message || "OpenAI request failed" };
    }
  }
}

export default GPTAdapter;
