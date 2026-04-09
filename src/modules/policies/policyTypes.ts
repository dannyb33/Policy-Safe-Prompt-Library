export type RuleSeverity = "block" | "warn";

export type PolicyCheckResult = {
  name: string;
  passed: boolean;
  severity: RuleSeverity;
  message?: string; // explain
  details?: string[];
};

export interface PolicyRule {
  name: string;
  severity: RuleSeverity;
  check(promptText: string): PolicyCheckResult;
}
