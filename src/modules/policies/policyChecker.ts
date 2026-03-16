import type { PolicyRule, PolicyCheckResult } from "./policyTypes.js";

export type PolicyCheckSummary = {
  passed: boolean; // all rules passed 
  results: PolicyCheckResult[]; // result of each rule check
  blockedReasons: string[]; // reasons 
  details: string[]; // details, maybe we can change it to be more structured later
};

export function checkPolicies(promptText: string, rules: PolicyRule[]): PolicyCheckSummary {
  const results = rules.map((rule) => rule.check(promptText)); // check all rules and collect results
  const failed = results.filter((r) => !r.passed);//slect only the ones that failed

  const blockedReasons = failed.map((r) => r.message ?? `${r.name} failed`);// create blocked reasons, use message if available, otherwise default to rule name
  const details = failed.flatMap((r) => r.details ?? []);  // get details from failed rules, if any, and flatten them into a single array

  return {
    passed: failed.length === 0, // if there are no failed rules, then the prompt passed all checks
    results, // include results of all rules, both passed and failed, for transparency
    blockedReasons, // reasons for blocking, extracted from failed rules
    details, // additional details from failed rules
  };
}
