import GPTAdapter from "./GPTAdapter.js";
import LocalModelAdapter from "./LocalModelAdapter.js";

const resolveProvider = (value) =>
  String(value || "gpt")
    .trim()
    .toLowerCase();

export function getAIModelAdapter() {
  const provider = resolveProvider(process.env.AI_PROVIDER);
  if (provider === "local") return new LocalModelAdapter();
  return new GPTAdapter();
}

export default {
  getAIModelAdapter,
};
