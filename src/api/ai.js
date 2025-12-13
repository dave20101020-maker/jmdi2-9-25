import { api } from "@/utils/apiClient";

export const sendNorthStarMessage = async ({ message }) => {
  if (!message || typeof message !== "string") {
    throw new Error("Message is required for NorthStar AI chat");
  }

  try {
    const payload = { prompt: message };
    const response = await api.post("/api/ai", payload);

    if (response?.reply) {
      return { ok: true, response: response.reply };
    }

    return {
      ok: false,
      error: true,
      message: response?.error || "AI temporarily unavailable",
    };
  } catch (error) {
    console.error("NorthStar AI request failed", error);
    return {
      ok: false,
      error: true,
      message: "AI temporarily unavailable",
    };
  }
};
