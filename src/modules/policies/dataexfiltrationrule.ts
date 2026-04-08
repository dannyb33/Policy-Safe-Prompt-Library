import type { PolicyRule, PolicyCheckResult } from "./policyTypes.js";

const EXFIL_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "API key request", 
      regex: /(?:show|give|reveal|print|output|return|display|leak|share)\s+(?:the\s+|your\s+|all\s+)?(?:api[\s_-]?key|secret[\s_-]?key|access[\s_-]?token|auth[\s_-]?token)/gi },
  { label: "env variable request", 
      regex: /(?:show|print|output|reveal|read)\s+(?:all\s+)?(?:env(?:ironment)?\s+variables?|process\.env|\.env\s+file)/gi },
  { label: "connection string request", 
      regex: /(?:show|reveal|print|output)\s+(?:the\s+)?(?:connection[\s_-]?string|database[\s_-]?url|db[\s_-]?password)/gi },
  { label: "credential dump", 
      regex: /(?:stored|saved|configured)\s+(?:credentials?|passwords?|secrets?)/gi },
  { label: "training data extraction", 
      regex: /(?:what|show|output)\s+(?:data\s+were\s+you\s+trained|(?:is\s+in\s+)?your\s+(?:training\s+data|memory|context\s+window))/gi },
  { label: "key pattern fishing", 
      regex: /sk-[a-zA-Z0-9]{20,}/g },
  { label: "key pattern fishing", 
      regex: /(?:bearer|token)\s+[a-zA-Z0-9\-._~+/]{20,}/gi }
];

export function createDataExfiltrationRule(): PolicyRule {
  return {
    name: "DataExfiltrationRule",
    severity: "block",

    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const { label, regex } of EXFIL_PATTERNS) {
        regex.lastIndex = 0;
        const match = regex.exec(promptText);

        if (match) {
          triggered.push(
            `${label}: "${match[0].slice(0, 100).trim()}"`
          );
        }
      }

      if (triggered.length === 0) {
        return {
          name: "DataExfiltrationRule",
          severity: "block",
          passed: true,
          message: "No data exfiltration patterns detected"
        };
      }

      return {
        name: "DataExfiltrationRule",
        severity: "block",
        passed: false,
        message: "Prompt attempts to extract sensitive credentials or internal data",
        details: triggered
      };
    }
  };
}