import type { PolicyRule, PolicyCheckResult } from "./policyTypes.js";

const CODE_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: "script tag", regex: /<script[\s>]/gi },
  { label: "shell operator", regex: /\b(?:exec|system|popen|subprocess)\s*\(/gi },
  { label: "eval call", regex: /\beval\s*\(/gi },
  { label: "import statement", regex: /(?:^|\n)\s*(?:import\s+\w|from\s+\w+\s+import|require\s*\()/gm },
  { label: "function declaration", regex: /\bfunction\s+\w+\s*\(/gi },
  { label: "shell substitution", regex: /`[^`]{1,200}`/g },
  { label: "shell substitution", regex: /\$\([^)]{1,200}\)/g },
  { label: "shebang", regex: /^#!\s*\/(?:bin|usr)/m }
];

export function createCodeInjectionRule(): PolicyRule {
  return {
    name: "CodeInjectionRule",
    severity: "block",
    check(promptText: string): PolicyCheckResult {
      const triggered: string[] = [];

      for (const { label, regex } of CODE_PATTERNS) {
        regex.lastIndex = 0;
        const match = regex.exec(promptText);
        if (match) {
          triggered.push(
            `Detected ${label}: "${match[0].slice(0, 60).trim()}"`
          );
        }
      }

      if (triggered.length === 0) {
        return {
          name: "CodeInjectionRule",
          severity: "block",
          passed: true,
          message: "No code injection patterns detected"
        };
      }

      return {
        name: "CodeInjectionRule",
        severity: "block",
        passed: false,
        message:
          "Prompt contains executable code patterns (possible code injection)",
        details: triggered
      };
    }
  };
}