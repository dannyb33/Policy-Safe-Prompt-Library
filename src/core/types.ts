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

export interface PolicyCheckInput {
  prompt: string;
}

export type PolicyCheckResult = {
  name: string;
  passed: boolean;
  message?: string; // explain
  details?: string[];
};

export interface PolicyRule {
  name: string;
  check(promptText: string): PolicyCheckResult;
}

export type PolicyCheckSummary = {
  passed: boolean; // all rules passed 
  results: PolicyCheckResult[]; // result of each rule check
  blockedReasons: string[]; // reasons 
  details: string[]; // details, maybe we can change it to be more structured later
};
