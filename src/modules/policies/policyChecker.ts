import type { PolicyCheckInput, PolicyCheckSummary } from "../../core/types.js";
import type { PolicyRule, PolicyCheckResult } from "../../core/types.js";
import type { AsyncPolicyRule } from "./policytypes.js";

export function checkPolicies(promptText: string, rules: PolicyRule[]): PolicyCheckSummary {
  const results = rules.map((rule) => rule.check(promptText)); // check all rules and collect results
  const failed = results.filter((r) => !r.passed);//slect only the ones that failed
  const blockedFailed = failed.filter((r) => r.severity === "block");
  const warnedFailed  = failed.filter((r) => r.severity === "warn");

  const blockedReasons = blockedFailed.map((r) => r.message ?? `${r.name} failed`);
  const warnings = warnedFailed.map((r)  => r.message ?? `${r.name} triggered`);
  const details = failed.flatMap((r) => r.details ?? []);  // get details from failed rules, if any, and flatten them into a single array

  return {
    passed: blockedFailed.length === 0, // if there are no failed rules, then the prompt passed all checks
    results, // include results of all rules, both passed and failed, for transparency
    blockedReasons, // reasons for blocking, extracted from failed rules
    warnings, // messages for warnings, extracted from failed rules with severity "warn"
    details, // additional details from failed rules
  };
}

export async function checkPoliciesAsync(
  promptText: string,
  syncRules: PolicyRule[],
  asyncRules: AsyncPolicyRule[]
): Promise<PolicyCheckSummary> {
  const syncResults = syncRules.map((rule) => rule.check(promptText));
  const asyncResults = await Promise.all(asyncRules.map((rule) => rule.check(promptText)));
  const results = [...syncResults, ...asyncResults];

  const failed        = results.filter((r) => !r.passed);
  const blockedFailed = failed.filter((r) => r.severity === "block");
  const warnedFailed  = failed.filter((r) => r.severity === "warn");

  return {
    passed:        blockedFailed.length === 0,
    results,
    blockedReasons: blockedFailed.map((r) => r.message ?? `${r.name} failed`),
    warnings:       warnedFailed.map((r)  => r.message ?? `${r.name} triggered`),
    details:        failed.flatMap((r) => r.details ?? []),
  };
}