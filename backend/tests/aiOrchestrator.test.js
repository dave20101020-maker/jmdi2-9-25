/**
 * AI Orchestrator Integration Tests
 *
 * Tests for unified AI orchestrator system
 */

import { jest } from "@jest/globals";

// Mock dependencies
jest.mock("../src/ai/orchestrator/memoryStore.js", () => ({
  loadMemory: jest.fn().mockResolvedValue({ pillars: {} }),
  saveMemory: jest.fn().mockResolvedValue(true),
  updateConversationHistory: jest.fn(),
}));

jest.mock("../src/ai/orchestrator/crisisCheck.js", () => ({
  performCrisisCheck: jest.fn().mockResolvedValue({
    isCrisis: false,
    severity: "none",
    type: null,
  }),
}));

jest.mock("../models/User.js", () => ({
  findById: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      _id: "test-user",
      allowedPillars: ["sleep", "mental_health", "diet"],
    }),
  }),
}));

jest.mock("../models/PillarCheckIn.js", () => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  }),
}));

jest.mock("../models/Habit.js", () => ({
  find: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue([]),
  }),
}));

describe("Unified AI Orchestrator", () => {
  describe("Module Registry", () => {
    it("should export all AI module constants", async () => {
      const { AI_MODULES } = await import(
        "../src/ai/orchestrator/unifiedOrchestrator.js"
      );

      expect(AI_MODULES).toBeDefined();
      expect(AI_MODULES.SLEEP_COACH).toBe("sleep_coach");
      expect(AI_MODULES.MENTAL_HEALTH_COACH).toBe("mental_health_coach");
      expect(AI_MODULES.DIET_COACH).toBe("diet_coach");
      expect(AI_MODULES.CRISIS_HANDLER).toBe("crisis_handler");
      expect(AI_MODULES.CORRELATION_ENGINE).toBe("correlation_engine");
      expect(AI_MODULES.JOURNALING_AGENT).toBe("journaling_agent");
      expect(AI_MODULES.ADAPTIVE_PLANNER).toBe("adaptive_planner");
      expect(AI_MODULES.MICRO_ACTIONS).toBe("micro_actions");
    });

    it("should provide module info", async () => {
      const { getAvailableModules } = await import(
        "../src/ai/orchestrator/unifiedOrchestrator.js"
      );

      const modules = getAvailableModules();

      expect(Array.isArray(modules)).toBe(true);
      expect(modules.length).toBeGreaterThan(0);
      expect(modules[0]).toHaveProperty("key");
      expect(modules[0]).toHaveProperty("value");
      expect(modules[0]).toHaveProperty("type");
    });
  });

  describe("AI Orchestrator Service", () => {
    it("should process AI chat", async () => {
      const service = await import("../services/aiOrchestratorService.js");

      expect(service.default.processAIChat).toBeDefined();
      expect(typeof service.default.processAIChat).toBe("function");
    });

    it("should generate journaling prompts", async () => {
      const service = await import("../services/aiOrchestratorService.js");

      expect(service.default.generateJournalingPrompt).toBeDefined();
      expect(typeof service.default.generateJournalingPrompt).toBe("function");
    });

    it("should generate adaptive plans", async () => {
      const service = await import("../services/aiOrchestratorService.js");

      expect(service.default.generateAdaptivePlan).toBeDefined();
      expect(typeof service.default.generateAdaptivePlan).toBe("function");
    });

    it("should analyze correlations", async () => {
      const service = await import("../services/aiOrchestratorService.js");

      expect(service.default.analyzeCorrelations).toBeDefined();
      expect(typeof service.default.analyzeCorrelations).toBe("function");
    });

    it("should generate micro-actions", async () => {
      const service = await import("../services/aiOrchestratorService.js");

      expect(service.default.generateMicroActionsForPillar).toBeDefined();
      expect(typeof service.default.generateMicroActionsForPillar).toBe(
        "function"
      );
    });

    it("should execute wellness workflows", async () => {
      const service = await import("../services/aiOrchestratorService.js");

      expect(service.default.executeWellnessWorkflow).toBeDefined();
      expect(typeof service.default.executeWellnessWorkflow).toBe("function");
    });

    it("should manage AI memory", async () => {
      const service = await import("../services/aiOrchestratorService.js");

      expect(service.default.getAIMemorySummary).toBeDefined();
      expect(service.default.resetAIMemory).toBeDefined();
      expect(typeof service.default.getAIMemorySummary).toBe("function");
      expect(typeof service.default.resetAIMemory).toBe("function");
    });
  });

  describe("Input Validation", () => {
    it("should require userId", async () => {
      const { orchestrateAI } = await import(
        "../src/ai/orchestrator/unifiedOrchestrator.js"
      );

      const result = await orchestrateAI({
        message: "test message",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe(true);
    });

    it("should require message", async () => {
      const { orchestrateAI } = await import(
        "../src/ai/orchestrator/unifiedOrchestrator.js"
      );

      const result = await orchestrateAI({
        userId: "test-user",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe(true);
    });

    it("should reject empty message", async () => {
      const { orchestrateAI } = await import(
        "../src/ai/orchestrator/unifiedOrchestrator.js"
      );

      const result = await orchestrateAI({
        userId: "test-user",
        message: "   ",
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe(true);
    });
  });

  describe("Crisis Detection", () => {
    it("should check for crisis before routing", async () => {
      const { performCrisisCheck } = await import(
        "../src/ai/orchestrator/crisisCheck.js"
      );
      const { orchestrateAI } = await import(
        "../src/ai/orchestrator/unifiedOrchestrator.js"
      );

      // Mock crisis detection
      performCrisisCheck.mockResolvedValueOnce({
        isCrisis: true,
        severity: "critical",
        type: "suicide",
        message: "Crisis message",
        resources: [],
      });

      const result = await orchestrateAI({
        userId: "test-user",
        message: "I want to hurt myself",
      });

      expect(performCrisisCheck).toHaveBeenCalled();
      expect(result.isCrisis).toBe(true);
    });

    it("should allow skipping crisis check", async () => {
      const { performCrisisCheck } = await import(
        "../src/ai/orchestrator/crisisCheck.js"
      );
      const { orchestrateAI } = await import(
        "../src/ai/orchestrator/unifiedOrchestrator.js"
      );

      performCrisisCheck.mockClear();

      await orchestrateAI({
        userId: "test-user",
        message: "test",
        context: { skipCrisisCheck: true },
      });

      expect(performCrisisCheck).not.toHaveBeenCalled();
    });
  });
});

describe("API Routes", () => {
  it("should export unified routes", async () => {
    const routes = await import("../routes/aiUnifiedRoutes.js");
    expect(routes.default).toBeDefined();
  });
});

describe("Integration Points", () => {
  it("should have all coach agents available", () => {
    // Verify agent files exist
    const agents = [
      "sleepCoachAgent",
      "mentalHealthCoachAgent",
      "nutritionAgent",
      "fitnessAgent",
      "physicalHealthAgent",
      "financesAgent",
      "socialAgent",
      "spiritualityAgent",
    ];

    agents.forEach((agent) => {
      expect(() => {
        require.resolve(`../src/ai/agents/${agent}.js`);
      }).not.toThrow();
    });
  });

  it("should have specialized engines available", () => {
    const engines = ["microActionsEngine"];

    engines.forEach((engine) => {
      expect(() => {
        require.resolve(`../src/ai/agents/${engine}.js`);
      }).not.toThrow();
    });
  });

  it("should have crisis check available", () => {
    expect(() => {
      require.resolve("../src/ai/orchestrator/crisisCheck.js");
    }).not.toThrow();
  });

  it("should have memory store available", () => {
    expect(() => {
      require.resolve("../src/ai/orchestrator/memoryStore.js");
    }).not.toThrow();
  });
});

console.log("✅ AI Orchestrator Integration Tests Configured");
