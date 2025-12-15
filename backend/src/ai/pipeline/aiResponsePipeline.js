/**
 * AI Response Pipeline (Persistence Gate)
 *
 * Base44-style rule enforcement:
 * - The AI must persist at least one structured record (goal/plan/habit/screening/log)
 *   BEFORE returning a user-facing response.
 * - Advice-only responses are blocked.
 * - If persistence fails, the response must explain the failure.
 *
 * This implementation is deterministic and works without modifying model prompts:
 * - Always saves an "AI coaching log" item.
 * - Best-effort extraction of additional items from the assistant text.
 */

import crypto from "crypto";
import {
  addItemToMemory,
  updateGlobalConversationHistory,
  updateConversationHistory,
} from "../orchestrator/memoryStore.js";

const newId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random()}`;
  }
};

const normalizeType = (raw) => {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (!v) return null;
  if (v === "goal") return "smartgoal";
  if (v === "smartgoal" || v === "smart_goal") return "smartgoal";
  if (v === "plan") return "lifeplan";
  if (v === "lifeplan" || v === "life_plan") return "lifeplan";
  if (v === "habit") return "habit";
  if (v === "screening" || v === "assessment" || v === "assessment_result") {
    return "screening";
  }
  if (v === "protocol") return "lifeplan";
  if (v === "log" || v === "journal" || v === "note") return "log";
  return null;
};

function extractTaggedItems(assistantText) {
  const text = String(assistantText || "");
  const items = [];

  // Simple, deterministic line-based tags that appear in several prompts.
  // Examples:
  //   Habit: "Evening Wind-Down"
  //   SmartGoal: "3 walks this week"
  //   LifePlan: "Anxiety Mastery Protocol"
  //   Screening: "GAD-7" (score 12)
  const tagRegex =
    /^(habit|smartgoal|smart\s*goal|goal|lifeplan|life\s*plan|plan|screening|assessment|protocol)\s*:\s*(.+)$/gim;
  let match;
  while ((match = tagRegex.exec(text))) {
    const type = normalizeType(match[1]);
    const title = String(match[2] || "")
      .trim()
      .replace(/^"|"$/g, "");
    if (!type || !title) continue;
    items.push({ type, title, content: title });
  }

  return items;
}

function looksLikeAdvice(text) {
  const t = String(text || "").trim();
  if (!t) return false;

  // Heuristic: bullets, numbered steps, or imperative verbs.
  if (/^\s*([-*]|\d+\.)\s+/m.test(t)) return true;
  if (
    /\b(try|do|start|stop|avoid|focus|aim|plan|practice|track|schedule)\b/i.test(
      t
    )
  )
    return true;
  return t.length > 40;
}

function buildSaveConfirmation(saveSummary) {
  if (!saveSummary?.saved) {
    return `\n\nI couldn’t save this to your account/session (${
      saveSummary?.error || "unknown error"
    }). I’m pausing coaching advice until saving works—please retry in a moment.`;
  }

  const count = Array.isArray(saveSummary.items) ? saveSummary.items.length : 0;
  if (count === 0) {
    return `\n\nSaved: coaching log.`;
  }

  const labels = saveSummary.items
    .map((it) => {
      const action = it.action ? `${it.action}:` : "";
      const place = it.pillar ? `@${it.pillar}` : "";
      return `${action}${it.type}${place}`;
    })
    .join(", ");
  return `\n\nSaved (${count}): ${labels}.`;
}

function normalizeTitleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getPillarItemsArray(memory, pillar) {
  const pillarMem = memory?.pillars?.[pillar];
  if (!pillarMem || !Array.isArray(pillarMem.items)) return [];
  return pillarMem.items;
}

function findExistingByTypeAndTitle(memory, pillar, type, title) {
  if (!type || !title) return null;
  const items = getPillarItemsArray(memory, pillar);
  const wantedType = normalizeType(type);
  const wantedTitle = normalizeTitleKey(title);

  for (const it of items) {
    if (!it) continue;
    const itType = normalizeType(it.type);
    const itTitle = normalizeTitleKey(it.title);
    if (itType === wantedType && itTitle === wantedTitle) return it;
  }
  return null;
}

/**
 * Enforces persistence-before-response.
 *
 * @param {Object} params
 * @param {Object} params.memory - in-memory memory object (mutable)
 * @param {string} params.pillar - selected pillar (may be "general")
 * @param {string} params.userMessage
 * @param {string} params.assistantText
 * @param {string} params.agentName
 * @param {(userId: string, memory: any) => Promise<void>} params.saveMemoryFn
 * @param {string} params.userId
 */
export async function applyPersistenceGate({
  memory,
  pillar,
  userMessage,
  assistantText,
  agentName,
  saveMemoryFn,
  userId,
}) {
  const text = String(assistantText || "").trim();
  const now = new Date().toISOString();

  const proposed = extractTaggedItems(text);

  // Always save an interaction log first (Base44-style).
  const logItem = {
    id: newId(),
    type: "log",
    title: `${agentName || "AI"} coaching log`,
    pillar,
    content: {
      userMessage: String(userMessage || "").slice(0, 2000),
      assistantText: text.slice(0, 4000),
    },
  };

  const savedItems = [
    {
      type: "log",
      id: logItem.id,
      pillar,
      storage: "memory",
      action: "created",
    },
  ];

  try {
    // Always save to global conversational memory (cross-pillar).
    updateGlobalConversationHistory(memory, userMessage, text);

    addItemToMemory(memory, pillar, logItem);

    for (const item of proposed) {
      const existing = findExistingByTypeAndTitle(
        memory,
        pillar,
        item.type,
        item.title
      );

      if (existing) {
        existing.updatedAt = now;
        existing.lastMentionedAt = now;
        existing.content = {
          ...(existing.content || {}),
          title: existing.title || item.title,
          lastMentionedFrom: "assistant_text",
        };

        savedItems.push({
          type: normalizeType(item.type) || item.type,
          id: existing.id || existing._id || null,
          pillar,
          storage: "memory",
          action: "updated",
        });
        continue;
      }

      const record = {
        id: newId(),
        type: item.type,
        title: item.title,
        pillar,
        content: {
          title: item.title,
          extractedFrom: "assistant_text",
          createdAt: now,
        },
      };
      addItemToMemory(memory, pillar, record);
      savedItems.push({
        type: item.type,
        id: record.id,
        pillar,
        storage: "memory",
        action: "created",
      });
    }

    const saveSummary = { saved: true, items: savedItems };

    // Must include an explicit save confirmation in the user-facing response.
    const finalText = `${text}${buildSaveConfirmation(saveSummary)}`;

    // Persist the final user-visible text in conversation history.
    updateConversationHistory(memory, pillar, userMessage, finalText);

    // Persist updates now (before responding).
    await saveMemoryFn(userId, memory);

    return { ok: true, text: finalText, saveSummary };
  } catch (error) {
    const saveSummary = {
      saved: false,
      items: [],
      error: error?.message || "save_failed",
    };

    // Non-negotiable: no advice-only responses.
    // If we cannot save, do not deliver coaching advice.
    const blocked = looksLikeAdvice(text)
      ? buildSaveConfirmation(saveSummary)
      : `${text}${buildSaveConfirmation(saveSummary)}`;

    return { ok: false, text: blocked.trim(), saveSummary };
  }
}

/**
 * Conversation-only persistence (for NorthStar / general).
 * Saves transcript to GLOBAL conversational memory and (optionally) general thread.
 * Does NOT create structured items.
 */
export async function persistConversationOnly({
  memory,
  userMessage,
  assistantText,
  saveMemoryFn,
  userId,
}) {
  const text = String(assistantText || "").trim();

  try {
    updateGlobalConversationHistory(memory, userMessage, text);
    await saveMemoryFn(userId, memory);
    return {
      ok: true,
      text,
      saveSummary: {
        saved: true,
        items: [],
        conversationSaved: true,
        structuredSaved: false,
      },
    };
  } catch (error) {
    return {
      ok: false,
      text:
        "I couldn’t save this conversation to your account/session (" +
        (error?.message || "save_failed") +
        "). Please retry in a moment.",
      saveSummary: {
        saved: false,
        items: [],
        error: error?.message || "save_failed",
        conversationSaved: false,
        structuredSaved: false,
      },
    };
  }
}
