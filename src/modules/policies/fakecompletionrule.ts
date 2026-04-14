import type { PolicyRule, PolicyCheckResult } from "../../core/types.js";

const ROLE_MARKERS: RegExp[] = [
  /\b(?:system|assistant|user|human|ai|llm|gpt|claude)\s*:/gi,
  /<\|(?:im_start|im_end|system|user|assistant)\|>/gi,
  /(?:^|\n)\s*(?:Human|Assistant)\s*:/gm,
  /<(?:system|user|assistant|human|ai)>/gi
];

export function createFakeCompletionRule(): PolicyRule {
  return {
    name: "FakeCompletionRule",
    severity: "block",

    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const regex of ROLE_MARKERS) {
        regex.lastIndex = 0;
        const match = regex.exec(promptText);

        if (match) {
          triggered.push(`Role-turn marker found: "${match[0].trim()}"`);
        }
      }

      if (triggered.length === 0) {
        return {
          name: "FakeCompletionRule",
          severity: "block",
          passed: true,
          message: "No fake completion markers detected"
        };
      }

      return {
        name: "FakeCompletionRule",
        severity: "block",
        passed: false,
        message: "Prompt contains role-turn markers (possible fake completion attack)",
        details: triggered
      };
    }
  };
}