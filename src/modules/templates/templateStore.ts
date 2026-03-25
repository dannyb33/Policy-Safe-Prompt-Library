import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PromptTemplate } from "../../core/types.js";


const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const templatesPath = path.resolve(
  dirname,
  "../templates/templates.json"
);

export async function loadAllTemplates(): Promise<PromptTemplate[]> {
  const raw = await fs.readFile(templatesPath, "utf-8");
  return JSON.parse(raw) as PromptTemplate[]; // We trust the JSON file, so we cast it directly to PromptTemplate[]
}

export async function loadTemplateById(id: string): Promise<PromptTemplate | null> {
  const all = await loadAllTemplates();
  return all.find((t) => t.id === id) ?? null;
}

export async function saveAllTemplates(templates: PromptTemplate[]): Promise<void> { // we pass an array of PromptTemplate objects to save
  const raw = JSON.stringify(templates, null, 2); // convert the array to a pretty-printed JSON string
  await fs.writeFile(templatesPath, raw, "utf-8"); // write the JSON string back to the file, overwriting it
}


export function getLatestById(templates: PromptTemplate[]): PromptTemplate[] {
  const best = new Map<string, PromptTemplate>();//map to store the best version of each template by id

  for (const t of templates) {
    const v = t.version ?? 1; // if undefined use 1 as default version
    const prev = best.get(t.id); // see if we have save one with the same id before
    const prevV = prev?.version ?? 1; // if we have one before, get its version, if not use 1 as default
    if (!prev || v > prevV) best.set(t.id, t); // if we don't have one before or the current one has a higher version, we save it as the best one for this id, we choose the highest version
  }

  return [...best.values()].sort((a, b) => a.id.localeCompare(b.id)); // the ... means that we take the values of the map and create an array with them, then we sort the array by id in alphabetical order, so we have a consistent order when we return the latest templates
} 

export async function loadLatestTemplates(): Promise<PromptTemplate[]> { // get the latest one of each template
  const all = await loadAllTemplates();
  return getLatestById(all);
}

export async function loadTemplateByIdAndVersion(
  id: string, // we want to load a specific version of a template, if version is undefined we will load the latest one
  version?: number // the version of the template we want to load, if it's undefined we will load the latest one
): Promise<PromptTemplate | null> { 
  const all = await loadAllTemplates();// load the templates

  if (version !== undefined) {
    return all.find((t) => t.id === id && (t.version ?? 1) === version) ?? null; // if version is defined, we look for the template with the specific id and version, if we don't find it we return null
  }

  // if no version we look for the latest
  let latest: PromptTemplate | null = null;
  for (const t of all) { // recorremos todos los templates
    if (t.id !== id) continue;
    const v = t.version ?? 1; // get the verion
    const latestV = latest?.version ?? 1; // compare with the latest version
    if (!latest || v > latestV) latest = t; // update the last one
  }
  return latest;
}


export function sortAllByIdAndVersion(templates: PromptTemplate[]): PromptTemplate[] {
  const copy = [...templates].sort((a, b) => { // order the array
    const idCmp = a.id.localeCompare(b.id); // compare for id first
    if (idCmp !== 0){ // if the ids are different we return the comparison result, so we order by id
      return idCmp;
    } 
    return (a.version ?? 1) - (b.version ?? 1); // if the ids are the same we order by version, if version is undefined we use 1 as default, so we order by version in ascending order
  });
  return copy; // we return the sorted copy of the array, we don't want to modify the original array
}