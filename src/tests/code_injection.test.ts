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

describe('testDefaultPolicyRules', () => {
    it('returns default policy rules', () => {
        const result = getDefaultPolicyRules();

        expect(result).toHaveLength(10);
    })
});

describe('testMongoConnection', () => {
    it('tests policy query size from mongo', () => {
        expect(mongoRules).not.toHaveLength(0);
    })
});

describe('testDefaultPolicyRules', () => {
    it('returns default policy rules', () => {
        const result = checkPolicies("this is a normal prompt", mongoRules);

        expect(result.passed).toBe(true);
    })
});

describe('Code Injection Test', () => {

  // 1. SCRIPT TAG
  it('blocks script tag injection', () => {
    const result = checkPolicies(
      "<script>alert(1)</script>",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // 2. SHELL EXECUTION FUNCTIONS
  it('blocks exec/system/popen/subprocess calls', () => {
    const result = checkPolicies(
      "exec('rm -rf /')",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // 3. EVAL CALL
  it('blocks eval execution', () => {
    const result = checkPolicies(
      "eval('2+2')",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // 4. IMPORT STATEMENTS
  it('blocks import statements', () => {
    const result = checkPolicies(
      "import fs from 'fs'",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  it('blocks require statements', () => {
    const result = checkPolicies(
      "require('fs')",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // 5. FUNCTION DECLARATION
  it('blocks function declarations', () => {
    const result = checkPolicies(
      "function test() { return 1; }",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // 6. BACKTICK SHELL SUBSTITUTION
  it('blocks backtick shell substitution', () => {
    const result = checkPolicies(
      "`rm -rf /`",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // 7. $() COMMAND SUBSTITUTION
  it('blocks $() command substitution', () => {
    const result = checkPolicies(
      "$(rm -rf /)",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });

  // 8. SHEBANG DETECTION
  it('blocks shebang scripts', () => {
    const result = checkPolicies(
      "#!/bin/bash\necho hello",
      mongoRules
    );

    expect(result.passed).toBe(false);
  });


  it('allows code-like words without execution intent', () => {
    const result = checkPolicies(
      "I like the word function and eval in conversation",
      mongoRules
    );

    expect(result.passed).toBe(true);
  });

});
