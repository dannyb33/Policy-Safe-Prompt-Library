import { getTemplatesCollection } from "../db.js";
import type { PromptTemplate } from "../../core/types.js";

export async function loadAllTemplates(): Promise<PromptTemplate[]> {
  // Loads all templates from MongoDB Atlas
  const collection = await getTemplatesCollection();
  return await collection.find().toArray();
}

export async function loadTemplateById(id: string): Promise<PromptTemplate | null> {
  // Loads the latest version of a template by its id from MongoDB Atlas
  const collection = await getTemplatesCollection();
  return (await collection.find({ id }).sort({ version: -1 }).limit(1).next()) ?? null;
}

export async function saveAllTemplates(templates: PromptTemplate[]): Promise<void> { // we pass an array of PromptTemplate objects to save
  // Overwrites all templates in MongoDB Atlas with the provided array
  const collection = await getTemplatesCollection();
  await collection.deleteMany({});
  if (templates.length > 0) {
    await collection.insertMany(templates);
  }
}

// getLatestById, loadLatestTemplates, loadTemplateByIdAndVersion, sortAllByIdAndVersion remain unchanged

// Returns only the latest version of each template (by id)
export async function loadLatestTemplates(): Promise<PromptTemplate[]> {
  const collection = await getTemplatesCollection();
  // Get all templates, sort by id and version descending
  const all = await collection.find().sort({ id: 1, version: -1 }).toArray();
  // Deduplicate by id, keeping only the first (highest version)
  const seen = new Set();
  const latest: PromptTemplate[] = [];
  for (const t of all) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      latest.push(t);
    }
  }
  return latest;
}

// Sorts templates by id (asc) and version (desc)
export function sortAllByIdAndVersion(templates: PromptTemplate[]): PromptTemplate[] {
  return templates.slice().sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    // Descending version
    return (b.version ?? 1) - (a.version ?? 1);
  });
}