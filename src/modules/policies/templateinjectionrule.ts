import type { PolicyRule, PolicyCheckResult } from "./policyTypes.js";

const TEMPLATE_INJECT_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "placeholder injection", 
    regex: /\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g },
  { label: "XML tag injection", 
    regex: /<\/?\s*(?:system|user|assistant|template|prompt|instruction)\s*>/gi },
  { label: "template setting override", 
    regex: /(?:change|override|update|set|modify)\s+(?:the\s+)?(?:template|system\s+prompt|base\s+prompt|instructions?)\s+to/gi },
  { label: "template setting override", 
    regex: /(?:ignore|discard|replace)\s+(?:the\s+)?(?:template|system\s+prompt|base\s+prompt)/gi },
  { label: "instruction append", 
    regex: /(?:additional|new|extra)\s+instructions?:/gi},
  { label: "prompt delimiter", 
    regex: /---\s*(?:END|BEGIN|SYSTEM|USER|ASSISTANT)\s*---/gi},
];

export function createTemplateInjectionRule(): PolicyRule {
  return {
    name: "TemplateInjectionRule",
    severity: "block",
    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const { label, regex } of TEMPLATE_INJECT_PATTERNS) {
        regex.lastIndex = 0;
        const match = regex.exec(promptText);
        if (match) {
          triggered.push(`${label}: "${match[0].slice(0, 100).trim()}"`);
        }
      }

      if (triggered.length === 0) {
        return {
          name: "TemplateInjectionRule",
          severity: "block",
          passed: true,
          message: "No template injection patterns detected", 
        };
      }

      return {
        name: "TemplateInjectionRule",
        severity: "block",
        passed: false,
        message: "User input contains template injection patterns",
        details: triggered,
      };
    },
  };
}