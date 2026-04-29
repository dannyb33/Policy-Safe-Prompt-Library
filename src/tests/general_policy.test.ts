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

describe('testMongoConnection', () => {
    it('tests policy query size from mongo', () => {
        expect(mongoRules).not.toHaveLength(0);
    })
});

describe('testDefaultPolicyRules', () => {
    it('returns default policy rules', () => {
        const result = getDefaultPolicyRules();

        expect(result).toHaveLength(10);
    })
});

describe('testDefaultPolicyRules', () => {
    it('returns default policy rules', () => {
        const result = checkPolicies("this is a normal prompt", mongoRules);

        expect(result.passed).toBe(true);
    })
});

describe('testMongoRulesCollection', () => {
    it('tests the default size of mongodb collection, health check for other tests', () => {
        expect(mongoRules).toHaveLength(8);
    })
});
