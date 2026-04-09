export type VariableType = "string" | "number" | "boolean" | "enum";

export interface VariableSchema {
  name: string;
  type: VariableType;
  description: string;
  required: boolean;
  options?: string[]; // only used if type === "enum"
}

export interface PromptTemplate { // This is the schema for the templates
  id: string;
  content: string;
  description: string;
  variables: VariableSchema[];
  version?: number; // version used for the Add template versioning system
  createdAt?: string; // ISO date string use for the Add template versioning system 
}

export type RenderOutput = {
  output: string;
  usedPlaceholders: string[];
  fromCache: boolean;
};
export type RuleSeverity = "block" | "warn";

export type PolicyCheckResult = {
  name: string;
  passed: boolean;
  severity: RuleSeverity;
  message?: string; // explain
  details?: string[];
};

export interface PolicyRule {
  name: string;
  severity: RuleSeverity;
  check(promptText: string): PolicyCheckResult;
}

export type PolicyCheckSummary = {
  passed: boolean; // all rules passed 
  results: PolicyCheckResult[]; // result of each rule check
  blockedReasons: string[]; // reasons 
  warnings: string[]; // messages for why prompt failed or was flagged(warning)
  details: string[]; // details, maybe we can change it to be more structured later
};

export interface PolicyCheckInput {
  prompt: string;
}

