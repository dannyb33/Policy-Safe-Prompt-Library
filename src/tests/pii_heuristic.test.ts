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


describe('PII Heuristic Test', () => {

  // -------------------------
  // NAME DISCLOSURE
  // -------------------------

  it('detects name disclosure (full name is ...)', () => {
    const result = checkPolicies(
      "my full name is john",
      mongoRules
    );

    console.log(result);

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects name disclosure (I am called ...)', () => {
    const result = checkPolicies(
      "I'm called John",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // -------------------------
  // ADDRESS DISCLOSURE
  // -------------------------

  it('detects address disclosure (I live at)', () => {
    const result = checkPolicies(
      "I live at 123 main Street",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects address disclosure (my address is)', () => {
    const result = checkPolicies(
      "my home address is 42 Baker Street",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects residence phrasing', () => {
    const result = checkPolicies(
      "I reside at 10 Downing Street",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // -------------------------
  // LOCATION DISCLOSURE
  // -------------------------

  it('detects location disclosure (I live in)', () => {
    const result = checkPolicies(
      "I live in London",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects based-in location disclosure', () => {
    const result = checkPolicies(
      "I'm based in Zurich",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // -------------------------
  // DATE OF BIRTH / AGE
  // -------------------------

  it('detects date of birth disclosure', () => {
    const result = checkPolicies(
      "my date of birth is 1995",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects born on pattern', () => {
    const result = checkPolicies(
      "I was born in 1990",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects age disclosure', () => {
    const result = checkPolicies(
      "I'm 25 years old",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // -------------------------
  // GOVERNMENT ID
  // -------------------------

  it('detects SSN disclosure attempt', () => {
    const result = checkPolicies(
      "my ssn is 123-45-6789",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects passport number disclosure', () => {
    const result = checkPolicies(
      "my passport number is X1234567",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects driver license disclosure', () => {
    const result = checkPolicies(
      "my driver's license number is ABC123",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // -------------------------
  // MEDICAL DISCLOSURE
  // -------------------------

  it('detects diagnosis disclosure', () => {
    const result = checkPolicies(
      "I have been diagnosed with diabetes",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects medical condition statement', () => {
    const result = checkPolicies(
      "my medical condition is asthma",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // -------------------------
  // FINANCIAL DISCLOSURE
  // -------------------------

  it('detects bank account number disclosure', () => {
    const result = checkPolicies(
      "my account number is 12345678",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects card number disclosure', () => {
    const result = checkPolicies(
      "my card number is 4111111111111111",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // -------------------------
  // THIRD-PARTY PII
  // -------------------------

  it('detects third-party name disclosure', () => {
    const result = checkPolicies(
      "my sister's name is Emma",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('detects friend name disclosure', () => {
    const result = checkPolicies(
      "my friend's name is John",
      mongoRules
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // -------------------------
  // CONTROL CASES
  // -------------------------

  it('allows normal conversation', () => {
    const result = checkPolicies(
      "what is personal data in privacy laws",
      mongoRules
    );

    expect(result.warnings.length).toBe(0);
  });

  it('allows general medical discussion', () => {
    const result = checkPolicies(
      "what is diabetes",
      mongoRules
    );

    expect(result.warnings.length).toBe(0);
  });

});