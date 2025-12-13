import { describe, expect, test } from "vitest";
import {
  getDisplayName,
  normalizeFriend,
  normalizePending,
} from "../Friends.jsx";

describe("Friends helpers", () => {
  test("getDisplayName prefers full_name then username then email prefix", () => {
    expect(getDisplayName({ full_name: "Alice A" })).toBe("Alice A");
    expect(getDisplayName({ username: "alice" })).toBe("alice");
    expect(getDisplayName({ email: "bob@example.com" })).toBe("bob");
    expect(getDisplayName({})).toBe("Friend");
  });

  test("normalizeFriend maps friend document to view model", () => {
    const doc = {
      _id: "123",
      friendId: { email: "carol@example.com", full_name: "Carol C" },
      shareInsights: false,
    };
    const result = normalizeFriend(doc);
    expect(result.id).toBe("123");
    expect(result.friendEmail).toBe("carol@example.com");
    expect(result.friendName).toBe("Carol C");
    expect(result.shareInsights).toBe(false);
  });

  test("normalizePending keeps requester info and invite note", () => {
    const doc = {
      _id: "999",
      userId: { email: "dan@example.com", username: "dan" },
      inviteNote: "hey",
    };
    const result = normalizePending(doc);
    expect(result.id).toBe("999");
    expect(result.requesterEmail).toBe("dan@example.com");
    expect(result.requesterName).toBe("dan");
    expect(result.inviteNote).toBe("hey");
  });
});
