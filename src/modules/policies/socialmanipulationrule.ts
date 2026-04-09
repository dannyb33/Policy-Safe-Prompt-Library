import type { PolicyRule, PolicyCheckResult } from "../../core/types.js";

const MANIPULATION_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "phishing email request", 
      regex: /(?:write|generate|create|draft)\s+(?:a\s+)?(?:phishing|scam|fake)\s+(?:email|message|text)/gi },
  { label: "impersonation request", 
      regex: /(?:impersonate|pretend\s+to\s+be|pose\s+as|act\s+as)\s+(?:a\s+)?(?:bank|government|official|CEO|executive|employee|support\s+agent)/gi },
  { label: "impersonation request", 
      regex: /write\s+(?:as|like)\s+(?:a\s+)?(?:bank|government|official|CEO|executive|employee|support\s+agent)/gi },
  { label: "social engineering script", 
      regex: /(?:script|template)\s+(?:to\s+)?(?:trick|deceive|manipulate|convince)\s+(?:someone|a\s+user|people)/gi },
  { label: "manipulation language", 
      regex: /(?:create|write|generate)\s+(?:a\s+)?(?:message|email|text)\s+(?:that\s+)?(?:creates?\s+(?:urgency|fear|panic)|manipulates?)/gi },
];

export function createSocialManipulationRule(): PolicyRule {
  return {
    name: "SocialManipulationRule",
    severity: "warn",
    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const { label, regex } of MANIPULATION_PATTERNS) {
        regex.lastIndex = 0;
        const match = regex.exec(promptText);
        if (match) {
          triggered.push(`${label}: "${match[0].slice(0, 100).trim()}"`);
        }
      }

      if (triggered.length === 0) {
        return { name: "SocialManipulationRule", severity: "warn", passed: true, message: "No social manipulation patterns detected" };
      }

      return {
        name: "SocialManipulationRule",
        severity: "warn",
        passed: false,
        message: "Prompt may be requesting manipulative or deceptive content",
        details: triggered,
      };
    },
  };
}