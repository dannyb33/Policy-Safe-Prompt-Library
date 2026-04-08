import { createProhibitedWordsRule, DEFAULT_PROHIBITED_WORDS } from "./prohibitedWordsRule.js";
import type { PolicyRule } from "./policyTypes.js";
import { createAuthorityHijackRule } from "./authorityhijackrule.js";
import { createCodeInjectionRule } from "./codeinjectionrule.js";
import { createFakeCompletionRule } from "./fakecompletionrule.js";
import { createDataExfiltrationRule } from "./dataexfiltrationrule.js";
import { createReformattingRule } from "./reformattingrule.js";
import { createSocialManipulationRule } from "./socialmaniplulationrule.js";
import { createTemplateInjectionRule } from "./templateinjectionrule.js";

export function getDefaultPolicyRules(): PolicyRule[] {
  return [
    createProhibitedWordsRule(DEFAULT_PROHIBITED_WORDS, { // pass the list of prohibited words and options to the rule factory function
      caseSensitive: false, // 
      matchWholeWord: false,
    }),
    createAuthorityHijackRule(),
    createCodeInjectionRule(),
    createFakeCompletionRule(),
    createDataExfiltrationRule(),
    createTemplateInjectionRule(),
    createReformattingRule(),
    createSocialManipulationRule(),
  ];
}