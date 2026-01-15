export type OpenAiChatLaunchDetail = {
  draft?: string;
  aiContext?: Record<string, unknown> | null;
  mode?: string;
  module?: string;
  agentId?: string;
};

export function openAiChat(detail: OpenAiChatLaunchDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("northstar:open", { detail }));
}

export default {
  openAiChat,
};
