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