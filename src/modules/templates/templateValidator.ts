import type { PromptTemplate } from "../../core/types.js";
import { extractPlaceholders } from "./templateParser.js";

export type TemplateValidationResult = {
  errors: string[];
  warnings: string[];
};

const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export function validateTemplateDefinition(t: PromptTemplate): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

        // eliminate spaces at begining and end --> trim
  if (!t.id || t.id.trim().length === 0) { // no exist or empty
    errors.push("Template id is required");
  }
  else if (!ID_REGEX.test(t.id)) {
    errors.push("Template id must follow /^[a-zA-Z0-9_-]+$/ pattern");
  }

  
  if (!t.description || t.description.trim().length === 0) {
    errors.push("Template description is required");
  }

  if (!t.content || t.content.trim().length === 0) {
    errors.push("Template content is required");
  }

  
  if (!Array.isArray(t.variables) || t.variables.length === 0) {
    errors.push("Template variables[] must be a non-empty array");
    return { errors, warnings }; // if is empty no need to continue
  }

  const seen = new Set<string>(); // set is beeter for duplicate, bacause it donest allow them
  for (const v of t.variables) {
    if (!v.name || v.name.trim().length === 0) {
      errors.push("Variable name is required");
      continue;
    }
    if (!ID_REGEX.test(v.name)) {
      errors.push(`Variable '${v.name}' name must match /^[a-zA-Z0-9_-]+$/`);
    }

    if (seen.has(v.name)) {
      errors.push(`Duplicate variable name: ${v.name}`);
    }
    seen.add(v.name); // we add the variable name to the set to track duplicates

    if (!v.type || !["string", "number", "enum"].includes(v.type)) {
      errors.push(`Variable '${v.name}' has invalid type '${String(v.type)}'`);
    }

    if (v.type === "enum") {
      if (!Array.isArray(v.options) || v.options.length === 0) {
        errors.push(`Enum variable '${v.name}' cant include empty options array`);
      }
    }

    if (typeof v.required !== "boolean") {
      errors.push(`Variable '${v.name}' required must be boolean`);
    }
  }

  const placeholders = extractPlaceholders(t.content);
  const declared = new Set(t.variables.map((x) => x.name)); // get the variables

  const missing = placeholders.filter((p) => !declared.has(p)); // variables usadas pero no declaradas
  if (missing.length > 0) {
    errors.push(`Template content uses undeclared variables: ${missing.join(", ")}`);
  }

  const unused = t.variables.map((x) => x.name).filter((n) => !placeholders.includes(n));// the other way, it will not be that bad 
  if (unused.length > 0) {
    warnings.push(`Declared variables not used in content: ${unused.join(", ")}`);
  }

  if (t.version !== undefined) {
    if (typeof t.version !== "number" || !Number.isInteger(t.version) || t.version <= 0) {
      errors.push("Template version must be a positive integer");
    }
  }


  if (t.createdAt !== undefined) {
    if (typeof t.createdAt !== "string" || Number.isNaN(Date.parse(t.createdAt))) {
      errors.push("Template createdAt must be an ISO date string");
    }
  }

  return { errors, warnings };
}