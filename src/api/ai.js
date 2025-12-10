import { api } from "@/utils/apiClient";

export const sendNorthStarMessage = async ({
  message,
  pillar,
  explicitMode,
}) => {
  if (!message || typeof message !== "string") {
    throw new Error("Message is required for NorthStar AI chat");
  }

  try {
    const payload = { message };
    if (pillar) payload.pillar = pillar;
    if (typeof explicitMode === "boolean") payload.explicitMode = explicitMode;

    const response = await api.post("/api/ai/chat", payload);
    return response;
  } catch (error) {
    console.error("NorthStar AI request failed", error);
    return {
      ok: false,
      error: true,
      message: "AI temporarily unavailable",
      pillar,
    };
  }
};
