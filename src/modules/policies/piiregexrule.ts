import type { PolicyRule, PolicyCheckResult } from "./policytypes.js";

const PII_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  {
    label: "email address",
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  },
  {
    label: "phone number",
    regex: /(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g,
  },
  {
    label: "US Social Security Number",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    label: "credit / debit card number",
    regex: /\b(?:\d{4}[\s\-]?){3}\d{1,7}\b/g,
  },
  {
    label: "IPv4 address",
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  },
  {
    label: "IPv6 address",
    regex: /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g,
  },
  {
    label: "IBAN bank account",
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]{0,16})?\b/g,
  },
  {
    label: "US passport number",
    regex: /\b[A-Z]{1,2}\d{6,8}\b/g,
  },
];

export function createPiiRegexRule(): PolicyRule {
  return {
    name: "PiiRegexRule",
    severity: "block",
    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const { label, regex } of PII_PATTERNS) {
        regex.lastIndex = 0;
        const match = regex.exec(promptText);
        if (match) {
          const raw = match[0];
          const redacted = raw.slice(0, 3) + "***";
          triggered.push(`${label} detected: "${redacted}"`);
        }
      }

      if (triggered.length === 0) {
        return {
          name: "PiiRegexRule",
          severity: "block",
          passed: true,
          message: "No structured PII detected",
        };
      }

      return {
        name: "PiiRegexRule",
        severity: "block",
        passed: false,
        message: "Prompt contains structured personal information",
        details: triggered,
      };
    },
  };
}