import type { PolicyCheckResult, PolicyRule, RuleSeverity } from "../../core/types.js";
import { getPoliciesCollection } from "../db.js";

type StoredPattern = {
  label: string;
  regex: string;
  flags?: string;
};

type StoredPolicyRule = {
  rule_type: string;
  name: string;
  severity: RuleSeverity;
  description?: string;
  patterns: StoredPattern[];
  messages?: {
    on_pass?: string;
    on_fail?: string;
  };
};

function compilePattern(pattern: StoredPattern): RegExp | null {
  try {
    return new RegExp(pattern.regex, pattern.flags ?? "gi");
  } catch {
    return null;
  }
}

function createRuleFromStoredDocument(doc: StoredPolicyRule): PolicyRule {
  const compiledPatterns = doc.patterns
    .map((pattern) => ({ label: pattern.label, regex: compilePattern(pattern) }))
    .filter((item): item is { label: string; regex: RegExp } => item.regex !== null);

  return {
    name: doc.name,
    severity: doc.severity,
    check(promptText: string): PolicyCheckResult {
      const details: string[] = [];

      for (const pattern of compiledPatterns) {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(promptText);
        if (match) {
          details.push(`${pattern.label}: "${match[0].slice(0, 120).trim()}"`);
        }
      }

      if (details.length === 0) {
        return {
          name: doc.name,
          severity: doc.severity,
          passed: true,
          message: doc.messages?.on_pass ?? `No ${doc.rule_type} patterns detected`,
        };
      }

      return {
        name: doc.name,
        severity: doc.severity,
        passed: false,
        message: doc.messages?.on_fail ?? doc.description ?? `${doc.name} failed`,
        details,
      };
    },
  };
}

export async function loadMongoPolicyRules(): Promise<PolicyRule[]> {
  const collection = await getPoliciesCollection();
  const docs = (await collection.find({}).toArray()) as unknown as StoredPolicyRule[];

  return docs
    .filter((doc) => Array.isArray(doc.patterns) && doc.patterns.length > 0)
    .map((doc) => createRuleFromStoredDocument(doc));
}
