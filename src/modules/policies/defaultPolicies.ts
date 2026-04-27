import { createProhibitedWordsRule, DEFAULT_PROHIBITED_WORDS } from "./prohibitedWordsRule.js";
import { createAuthorityHijackRule } from "./authorityhijackrule.js";
import { createCodeInjectionRule } from "./codeinjectionrule.js";
import { createFakeCompletionRule } from "./fakecompletionrule.js";
import { createDataExfiltrationRule } from "./dataexfiltrationrule.js";
import { createReformattingRule } from "./reformattingrule.js";
import { createSocialManipulationRule } from "./socialmanipulationrule.js";
import { createTemplateInjectionRule } from "./templateinjectionrule.js";
import { createPiiRegexRule } from "./piiregexrule.js";
import { createPiiLlmRule} from "./piillmrule.js";
import type { PolicyRule } from "./policytypes.js";

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
    createPiiRegexRule(),
    createPiiLlmRule(),
    createReformattingRule(),
    createSocialManipulationRule(),
  ];
}
