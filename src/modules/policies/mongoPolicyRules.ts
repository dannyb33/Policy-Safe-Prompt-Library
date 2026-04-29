import type { PolicyCheckResult, PolicyRule, RuleSeverity } from "../../core/types.js";
import { getPoliciesCollection } from "../db.js";

// { label, regex, flags }
type FlatPattern = {
  label: string;
  regex: string;
  flags?: string;
};

// { category, regexes: [{ regex, flags }] }
type NestedPattern = {
  category: string;
  regexes: Array<{ regex: string; flags?: string }>;
};

type StoredPolicyRule = {
  rule_type: string;
  name: string;
  severity: RuleSeverity;
  description?: string;
  patterns: Array<FlatPattern | NestedPattern>;
  messages?: {
    on_pass?: string;
    on_fail?: string;
  };
};

type CompiledPattern = { label: string; regex: RegExp };

// normalize patterns from atlas 
function normalisePatterns(patterns: Array<FlatPattern | NestedPattern>): CompiledPattern[] {
  const result: CompiledPattern[] = [];

  for (const p of patterns) {
    if ("regexes" in p) {
      // nested format
      for (const r of p.regexes) {
        try {
          result.push({ label: p.category, regex: new RegExp(r.regex, r.flags ?? "gi") });
        } catch { /* skip invalid regex */ }
      }
    } else {
      // flat format
      try {
        result.push({ label: p.label, regex: new RegExp(p.regex, p.flags ?? "gi") });
      } catch { /* skip invalid regex */ }
    }
  }

  return result;
}

function createRuleFromStoredDocument(doc: StoredPolicyRule): PolicyRule {
  const compiledPatterns = normalisePatterns(doc.patterns);

  return {
    name: doc.name,
    severity: doc.severity,
    check(promptText: string): PolicyCheckResult {
      const details: string[] = [];

      for (const pattern of compiledPatterns) {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(promptText);
        if (match) {
          details.push(`"${match[0].slice(0, 120).trim()}"`);
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
