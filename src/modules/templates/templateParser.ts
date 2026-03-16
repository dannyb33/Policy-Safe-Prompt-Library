import type { PromptTemplate, VariableSchema } from "../../core/types.js";



export function extractPlaceholders(content: string): string[] {
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g; // matches {{ variableName }} with optional whitespace

  const found = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    found.add(match[1]!);
  }

  return [...found];
}