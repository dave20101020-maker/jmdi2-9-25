import { getMissionControlModules } from "./getMissionControlModules";
import { MODULE_TYPES } from "./moduleTypes";
import { test, expect } from "vitest";

test("always returns priority action first and AI entry last", () => {
  const modules = getMissionControlModules({});

  expect(modules[0].type).toBe(MODULE_TYPES.PRIORITY_ACTION);
  expect(modules[modules.length - 1].type).toBe(MODULE_TYPES.AI_ENTRY);
});
