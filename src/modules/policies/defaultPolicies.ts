import { createProhibitedWordsRule, DEFAULT_PROHIBITED_WORDS } from "./prohibitedWordsRule.js";
import type { PolicyRule } from "./policyTypes.js";

export function getDefaultPolicyRules(): PolicyRule[] {
  return [
    createProhibitedWordsRule(DEFAULT_PROHIBITED_WORDS, { // pass the list of prohibited words and options to the rule factory function
      caseSensitive: false, // 
      matchWholeWord: false,
    }),
  ];
}
// this function returns an array of default policy rules that can be used to check prompts. Currently, it includes a single rule that checks for prohibited words, using a predefined list and options for case sensitivity and whole word matching.
