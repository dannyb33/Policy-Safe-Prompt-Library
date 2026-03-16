import type { PromptTemplate } from "../core/types.js";
import { loadTemplateById } from "./templates/templateStore.js";
import { renderTemplate } from "./templates/templateRenderer.js";
import { buildCacheKey, getCached, setCached } from "./renderCache.js";

export type RenderOutput = {
  output: string;
  usedPlaceholders: string[];
  fromCache: boolean;
};

export class JsonTemplateEngine {
  async getTemplate(id: string): Promise<PromptTemplate> { //load the template by its id, if not found throw an error
    const t = await loadTemplateById(id);
    if (!t) throw new Error(`Template not found: "${id}"`);
    return t;
  }

 
  validateInputs(template: PromptTemplate, inputs: Record<string, unknown>): string[] {
    const errors: string[] = [];

    for (const v of template.variables) {
      const val = inputs[v.name];

  
      if (v.required && (val === undefined || val === null || val === "")) {
        errors.push(`Missing required variable: "${v.name}"`);
        continue;
      }

      if (val === undefined || val === null) continue;

      if (v.type === "string") {
        if (typeof val !== "string") {
          errors.push(`Variable "${v.name}": expected string, got ${typeof val}`);
        }
      } 
      else if (v.type === "number") {
        if (typeof val !== "number" || Number.isNaN(val)) {
          errors.push(`Variable "${v.name}": expected number, got ${typeof val}`);
        }
      } 
      else if (v.type === "enum") {
        if (typeof val !== "string") {
          errors.push(`Variable "${v.name}": expected enum string, got ${typeof val}`);
        } else if (!v.options?.includes(val)) {
          errors.push(
            `Variable "${v.name}": "${val}" is not one of [${(v.options ?? []).join(", ")}]`
          );
        }
      }
    }

    return errors;
  }


  render(template: PromptTemplate, inputs: Record<string, unknown>): RenderOutput {
    const validationErrors = this.validateInputs(template, inputs);
    if (validationErrors.length > 0) {
      throw new Error(
        `Validation failed for template "${template.id}":\n` +
          validationErrors.map((e) => `  * ${e}`).join("\n")
      );
    }

    const version = template.version ?? 1;
    const cacheKey = buildCacheKey(template.id, version, inputs);
    const cached = getCached(cacheKey);
    if (cached !== undefined) {
      const placeholders = Object.keys(inputs);
      return { output: cached, usedPlaceholders: placeholders, fromCache: true };
    }

    const result = renderTemplate(template.content, inputs, { strict: true });
    if (!result.ok) {
      throw new Error(
        `Render failed for template "${template.id}":\n` +
          result.errors.map((e) => `  * ${e}`).join("\n")
      );
    }

    setCached(cacheKey, result.output);

    return { output: result.output, usedPlaceholders: result.usedPlaceholders, fromCache: false };
  }
}