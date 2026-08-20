import { describe, expect, it } from "vitest";
import { PaymentConfigurationError, StripePaymentProvider } from "./stripe-payment-provider.js";

describe("StripePaymentProvider configuration", () => {
  it("rejects an empty secret", () => {
    expect(() => new StripePaymentProvider("")).toThrow(PaymentConfigurationError);
  });

  it("rejects live Stripe credentials", () => {
    expect(() => new StripePaymentProvider("sk_live_forbidden")).toThrow("Somente chaves Stripe de teste");
  });

  it("accepts a structurally valid sandbox credential", () => {
    const provider = new StripePaymentProvider("sk_test_placeholder_for_tests");

    expect(provider.mode).toBe("test");
  });
});
