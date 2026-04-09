import type { PolicyRule, PolicyCheckResult } from "../../core/types.js";

const REFORMAT_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "Base64 encoding request", 
      regex: /\b(?:respond|answer|reply|output|encode|write)\b[^.!?\n]{0,60}\bbase\s*64\b/gi },
  { label: "hex encoding request", 
      regex: /\b(?:respond|answer|reply|output|encode|write)\b[^.!?\n]{0,60}\bhex(?:adecimal)?\b/gi },
  { label: "ROT13 encoding request", 
      regex: /\brot\s*13\b/gi },
  { label: "binary encoding request", 
      regex: /\b(?:respond|answer|reply|output)\b[^.!?\n]{0,60}\b(?:in\s+)?binary\b/gi },
  { label: "Caesar cipher request", 
      regex: /\bcaesar\s+cipher\b/gi },
  { label: "morse code request", 
      regex: /\bmorse\s+code\b/gi },
  { label: "Unicode obfuscation", regex: /\\u[0-9a-fA-F]{4}/g },
  { label: "HTML entity obfuscation", regex: /&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]{2,8});/g },
];

export function createReformattingRule(): PolicyRule {
  return {
    name: "ReformattingRule",
    severity: "warn",
    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const { label, regex } of REFORMAT_PATTERNS) {
        regex.lastIndex = 0;
        const match = regex.exec(promptText);
        if (match) {
          triggered.push(`${label}: "${match[0].slice(0, 80).trim()}"`);
        }
      }

      if (triggered.length === 0) {
        return {
          name: "ReformattingRule",
          severity: "warn",
          passed: true,
          message: "No suspicious reformatting instructions detected",
        };
      }

      return {
        name: "ReformattingRule",
        severity: "warn",
        passed: false,
        message: "Prompt requests suspicious output encoding (possible reformatting attack)",
        details: triggered,
      };
    },
  };
}