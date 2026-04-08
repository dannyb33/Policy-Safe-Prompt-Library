import type { PolicyRule, PolicyCheckResult } from "./policyTypes.js";

const HIJACK_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "instruction override", 
      regex: /ignore\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|rules?|guidelines?|constraints?|prompts?)/gi },
  { label: "instruction override", 
      regex: /forget\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|context|everything)/gi },
  { label: "instruction override", 
      regex: /disregard\s+(?:all\s+)?(?:previous\s+)?(?:instructions?|rules?|guidelines?)/gi },
  { label: "privilege escalation", 
      regex: /(?:you\s+are\s+now\s+in|enter|enable|activate)\s+(?:admin|developer|unrestricted|god|debug|root|super)\s*mode/gi },
  { label: "privilege escalation", 
      regex: /admin\s+mode/gi },
  { label: "system prompt extraction", 
      regex: /what\s+(?:instructions?|prompts?|rules?|guidelines?)\s+(?:were|have)\s+you\s+(?:given|told|trained)/gi },
  { label: "system prompt extraction", 
      regex: /(?:reveal|show|display|print|output|repeat)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions?|settings)/gi },
  { label: "unrestricted persona", 
      regex: /pretend\s+(?:you\s+are|you're)\s+(?:an?\s+)?(?:unrestricted|uncensored|unfiltered|evil|jailbroken)/gi },
  { label: "unrestricted persona", regex: /\bDAN\b/g },
  { label: "safety bypass", 
      regex: /bypass\s+(?:your\s+)?(?:safety|security|content|ethical|filter|guard)/gi },
  { label: "safety bypass", 
      regex: /without\s+(?:any\s+)?(?:restrictions?|filters?|limitations?|safety|ethical\s+constraints?)/gi }
];

export function createAuthorityHijackRule(): PolicyRule {
  return {
    name: "AuthorityHijackRule",
    severity: "block",

    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const { label, regex } of HIJACK_PATTERNS) {
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
          name: "AuthorityHijackRule",
          severity: "block",
          passed: true,
          message: "No authority hijacking patterns detected"
        };
      }

      return {
        name: "AuthorityHijackRule",
        severity: "block",
        passed: false,
        message: "Prompt attempts to override system authority or extract instructions",
        details: triggered
      };
    }
  };
}