import type { PolicyRule, PolicyCheckResult } from "./policyTypes.js";

export type ProhibitedWordsOptions = {
  caseSensitive?: boolean;
  matchWholeWord?: boolean;
};

export const DEFAULT_PROHIBITED_WORDS = [ // words we dont wanna use in prompts, we can expand this list later based on real-world testing and feedback. For now, these are common phrases that are often associated with attempts to bypass AI safety measures.
  "ignore all instructions",
  "bypass safety",
  "jailbreak",
  "drop database",
  "delete all data",
  "exfiltrate",
];

function escapeRegExp(value: string): string { // convert special characters in the word to be used in regex pattern, so if we have a prohibited word like "drop database", we want to match it exactly, not as a regex pattern. This function escapes characters that have special meaning in regex, such as ., *, +, ?, ^, $, (, ), |, [, ], \, so that they are treated as literal characters when building the regex pattern.
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegex(words: string[], options?: ProhibitedWordsOptions): RegExp | null { // build regular expression pattern
  const cleaned = words.map((w) => w.trim()).filter(Boolean); // eliminate spaces and empty strings, so if the user accidentally includes extra spaces or empty entries in the list of prohibited words, we clean it up to avoid issues when building the regex pattern. We trim each word to remove leading and trailing whitespace, and then filter out any empty strings that may result from trimming.
  if (cleaned.length === 0){
    return null; // if no word we finish
  }
  const pattern = cleaned.map(escapeRegExp).join("|"); // create a patron 
  const boundary = options?.matchWholeWord ? "\\b" : ""; // if matchWholeWord is true, we use \b to indicate a word boundary in the regex pattern, so that we only match the prohibited word when it appears as a whole word, not as part of another word. For example, if "drop" is a prohibited word and matchWholeWord is true, we want to match "drop" but not "dropdown". If matchWholeWord is false or not specified, we don't use word boundaries, so the regex will match the prohibited word even if it appears as part of another word.
  const flags = options?.caseSensitive ? "g" : "gi"; // do it global and dont care a bout capital letters
  return new RegExp(`${boundary}(?:${pattern})${boundary}`, flags);
}

export function createProhibitedWordsRule(
  words: string[],
  options?: ProhibitedWordsOptions
): PolicyRule {
  const regex = buildRegex(words, options); // create the regex pattern based on the list of prohibited words and options provided. This regex will be used to check if the prompt text contains any of the prohibited words, taking into account case sensitivity and whole word matching as specified in the options.

  return { // we are gona return different things 
    name: "ProhibitedWordsRule",
    check(promptText: string): PolicyCheckResult {
      if (!regex) {
        return {
          name: "ProhibitedWordsRule",
          passed: true,
          message: "No prohibited words configured",
        };
      }

      const matches = [...promptText.matchAll(regex)].map((match) => match[0]); // look for coincideces 
      if (matches.length === 0) { // no match
        return {
          name: "ProhibitedWordsRule",
          passed: true,
          message: "No prohibited words detected",
        };
      }

      const uniqueMatches = Array.from(new Set(matches)); // elimnates duplicates
      return {
        name: "ProhibitedWordsRule",
        passed: false,
        message: "Prompt contains prohibited words",
        details: uniqueMatches.map((m) => `Matched: "${m}"`),
      };
    },
  };
}
