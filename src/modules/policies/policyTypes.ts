export type PolicyCheckResult = {
  name: string;
  passed: boolean;
  message?: string; // explain
  details?: string[];
};

export interface PolicyRule {
  name: string;
  check(promptText: string): PolicyCheckResult;
}
