import type { PromptTemplate } from "../core/types.js";
import { loadTemplateById } from "./templates/templateStore.js";

export class JsonTemplateEngine {
  async getTemplate(id: string): Promise<PromptTemplate> {
    const t = await loadTemplateById(id);
    if (!t) throw new Error(`Template not found: ${id}`);
    return t;
  }

  validateInputs(template: PromptTemplate, inputs: Record<string, any>): string[] {
    const errors: string[] = []; // we initialize empty array to collect error messages

    for (const v of template.variables) { // we loop through each variable defined in the template
      const val = inputs[v.name]; // we get the value provided for this variable in the inputs

      if (v.required && (val === undefined || val === null || val === "")) { // check if it exists and is not empty if it's required
        errors.push(`Missing required variable: ${v.name}`);
        continue;
      }

      if (val === undefined || val === null) continue;

      if (v.type === "string") {
        if (typeof val !== "string") errors.push(`Invalid type for ${v.name}: expected string`);
      } 
      else if (v.type === "number") {
        if (typeof val !== "number" || Number.isNaN(val)) errors.push(`Invalid type for ${v.name}: expected number`);
      } 
      else if (v.type === "enum") {
        if (typeof val !== "string") {
          errors.push(`Invalid type for ${v.name}: expected enum string`);
        } else if (!v.options?.includes(val)) {
          errors.push(
            `Invalid value for ${v.name}: expected one of [${(v.options ?? []).join(", ")}]`
          );
        }
      }
    }

    return errors;
  }

  render(template: PromptTemplate, inputs: Record<string, any>): string {
    return template.content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, varName: string) => {
      const v = inputs[varName];
      return v === undefined || v === null ? "" : String(v);
    });
  }
}