import { jest } from "@jest/globals";
import {
  buildCheckoutSession,
  resolveWebhookEvent,
  handleWebhookEvent,
} from "../services/paymentService.js";
import User from "../models/User.js";

describe("paymentService in stub mode", () => {
  const mockUser = { _id: "user-123", id: "user-123" };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns a stub checkout session when Stripe is not configured", async () => {
    const session = await buildCheckoutSession({
      user: mockUser,
      plan: "premium",
    });

    expect(session.provider).toBe("stub");
    expect(session.url).toContain("checkout=stub");
    expect(session.id).toMatch(/stub_/);
  });

  it("treats webhook events as unverified in stub mode", async () => {
    const req = { body: { type: "test.event" } };
    const { provider, verified, event } = await resolveWebhookEvent(req);

    expect(provider).toBe("stub");
    expect(verified).toBe(false);
    expect(event.type).toBe("test.event");
  });

  it("applies subscription status updates when a checkout completes", async () => {
    const save = jest.fn();
    jest.spyOn(User, "findById").mockResolvedValue({ subscription: {}, save });

    const event = {
      type: "checkout.session.completed",
      data: { object: { metadata: { userId: "user-123" } } },
    };

    const result = await handleWebhookEvent(event);

    expect(result.handled).toBe(true);
    expect(User.findById).toHaveBeenCalledWith("user-123");
    expect(save).toHaveBeenCalled();
  });
});
