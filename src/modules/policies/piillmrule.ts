import type { PolicyRule, PolicyCheckResult } from "./policytypes.js";

const HEURISTIC_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  {
    label: "name disclosure",
    regex: /\bmy\s+(?:full\s+)?name\s+is\s+[A-Z][a-z]+/gi,
  },
  {
    label: "name disclosure",
    regex: /\bI(?:'m| am)\s+(?:called|known as)\s+[A-Z][a-z]+/gi,
  },
  {
    label: "address disclosure",
    regex: /\bI\s+live\s+at\b/gi,
  },
  {
    label: "address disclosure",
    regex: /\bmy\s+(?:home\s+|current\s+|mailing\s+)?address\s+is\b/gi,
  },
  {
    label: "address disclosure",
    regex: /\bI\s+(?:reside|stay)\s+at\b/gi,
  },
  {
    label: "location disclosure",
    regex: /\bI(?:'m| am)\s+(?:located|based)\s+in\b/gi,
  },
  {
    label: "location disclosure",
    regex: /\bI\s+live\s+in\b/gi,
  },

  {
    label: "date of birth disclosure",
    regex: /\b(?:born\s+on|my\s+(?:date\s+of\s+birth|dob)\s+is)[^\n]{0,40}\d{4}\b/gi,
  },
  {
    label: "date of birth disclosure",
    regex: /\bI\s+was\s+born\s+(?:on|in)\b/gi,
  },

  {
    label: "age disclosure",
    regex: /\bI(?:'m| am)\s+\d{1,3}\s+years?\s+old\b/gi,
  },
  {
    label: "government ID disclosure",
    regex: /\bmy\s+(?:ssn|social\s+security(?:\s+number)?|passport(?:\s+number)?|driver(?:'s)?\s+licen[cs]e(?:\s+number)?|national\s+id)\s+is\b/gi,
  },
  {
    label: "medical disclosure",
    regex: /\bI\s+(?:have\s+been\s+diagnosed\s+with|suffer(?:ing)?\s+from|was\s+diagnosed\s+with)\b/gi,
  },
  {
    label: "medical disclosure",
    regex: /\bmy\s+(?:medical\s+condition|diagnosis|prescription|medication)\s+is\b/gi,
  },

  {
    label: "financial disclosure",
    regex: /\bmy\s+(?:account|card|bank|routing)\s+number\s+is\b/gi,
  },
  {
    label: "third-party name disclosure",
    regex: /\bmy\s+(?:friend|sister|brother|mother|father|colleague|wife|husband|partner)(?:'s)?\s+name\s+is\s+[A-Z][a-z]+/gi,
  },
];

export function createPiiLlmRule(): PolicyRule {
  return {
    name: "PiiHeuristicRule",
    severity: "warn",
    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const { label, regex } of HEURISTIC_PATTERNS) {
        regex.lastIndex = 0;
        const match = regex.exec(promptText);
        if (match) {
          triggered.push(`${label}: "${match[0].slice(0, 80).trim()}"`);
        }
      }

      if (triggered.length === 0) {
        return {
          name: "PiiHeuristicRule",
          severity: "warn",
          passed: true,
          message: "No unstructured PII disclosure phrases detected",
        };
      }

      return {
        name: "PiiHeuristicRule",
        severity: "warn",
        passed: false,
        message: "Prompt may contain personal information (heuristic match)",
        details: triggered,
      };
    },
  };
}