import { describe, it, expect, beforeAll } from "vitest";
import { getDefaultPolicyRules } from "../modules/policies/defaultPolicies.js";
import { loadMongoPolicyRules } from "../modules/policies/mongoPolicyRules.js";
import type { PolicyRule } from "../core/types.js";
import { checkPolicies } from "../modules/policies/policyChecker.js";

let mongoRules: PolicyRule[];

beforeAll(async () => {
    try {
        const rules = await loadMongoPolicyRules();
        if (rules.length > 0) {
            mongoRules = rules;
        }
    } catch (e: any) {
        console.warn("[policy-check] MongoDB rules unavailable, using local defaults:", e.message);
    }
});

describe('PII Regex Test', () => {

  // -------------------------
  // EMAIL
  // -------------------------

  it('detects email addresses', () => {
    const result = checkPolicies(
      "contact me at john.doe@example.com",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // -------------------------
  // PHONE NUMBER
  // -------------------------

  it('detects US phone numbers', () => {
    const result = checkPolicies(
      "my number is 555-123-4567",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  it('detects international phone format', () => {
    const result = checkPolicies(
      "call me at +1 555 123 4567",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // -------------------------
  // SSN
  // -------------------------

  it('detects SSN format', () => {
    const result = checkPolicies(
      "my ssn is 123-45-6789",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // -------------------------
  // CREDIT / DEBIT CARD
  // -------------------------

  it('detects credit card number format', () => {
    const result = checkPolicies(
      "4111 1111 1111 1111",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  it('detects spaced card number format', () => {
    const result = checkPolicies(
      "my card is 1234-5678-9012-3456",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // -------------------------
  // IPV4
  // -------------------------

  it('detects IPv4 addresses', () => {
    const result = checkPolicies(
      "server is 192.168.1.1",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // -------------------------
  // IPV6
  // -------------------------

  it('detects IPv6 addresses', () => {
    const result = checkPolicies(
      "addr is 2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // -------------------------
  // IBAN
  // -------------------------

  it('detects IBAN bank account', () => {
    const result = checkPolicies(
      "my IBAN is DE89370400440532013000",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // -------------------------
  // PASSPORT NUMBER
  // -------------------------

  it('detects US passport number format', () => {
    const result = checkPolicies(
      "passport number is A1234567",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // -------------------------
  // CONTROL CASES
  // -------------------------

  it('allows normal text without PII', () => {
    const result = checkPolicies(
      "what is an email address format",
      mongoRules
    );

    expect(result.passed).toBe(true);
  });

  it('allows discussion of IP concepts', () => {
    const result = checkPolicies(
      "what is an IP address",
      mongoRules
    );

    expect(result.passed).toBe(true);
  });

});