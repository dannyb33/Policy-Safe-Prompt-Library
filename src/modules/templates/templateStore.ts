import fs from "node:fs/promises";
import path from "node:path";
import type { PromptTemplate } from "../../core/types.js";
const templatesPath = path.resolve(
  process.cwd(),
  "src/modules/templates/templates.json"
);

export async function loadAllTemplates(): Promise<PromptTemplate[]> {
  const raw = await fs.readFile(templatesPath, "utf-8");
  return JSON.parse(raw) as PromptTemplate[]; // We trust the JSON file, so we cast it directly to PromptTemplate[]
}

export async function loadTemplateById(id: string): Promise<PromptTemplate | null> {
  const all = await loadAllTemplates();
  return all.find((t) => t.id === id) ?? null;
}