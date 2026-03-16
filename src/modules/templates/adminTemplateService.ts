import type { PromptTemplate } from "../../core/types.js";
import { loadAllTemplates, saveAllTemplates } from "./templateStore.js";
import { extractPlaceholders } from "./templateParser.js";
import { validateTemplateDefinition } from "./templateValidator.js";

export async function addTemplate(newTemplate: PromptTemplate): Promise<void> {
  const templates = await loadAllTemplates(); // charge all the templates

  const existingSameId = templates.filter((t) => t.id === newTemplate.id); // look for same id
  const nextVersion = existingSameId.length === 0 ? 1 : Math.max(...existingSameId.map((t) => t.version ?? 1)) + 1; // if no exist we put 1 , if it exist we put the max version + 1

  const toSave: PromptTemplate = {
    ...newTemplate, // copy all the properties of the new template
    version: newTemplate.version ?? nextVersion, // asing version
    createdAt: newTemplate.createdAt ?? new Date().toISOString(), // asing date
  };

  const dup = templates.some((t) => t.id === toSave.id && (t.version ?? 1) === (toSave.version ?? 1)); // look for a template with the same id and version, if we find it is a duplicate and we throw an error
  if (dup){
    throw new Error(`Template '${toSave.id}' version ${(toSave.version ?? 1)} already exists`);
  }

  const check = validateTemplateDefinition(newTemplate);
  if (check.errors.length > 0) {
    throw new Error(`Invalid template definition:\n- ${check.errors.join("\n- ")}`);
  }
  

  templates.push(newTemplate);
  await saveAllTemplates(templates); // save them
}


export async function updateTemplate(id: string, updated: PromptTemplate): Promise<void> {
  const templates = await loadAllTemplates(); // load all templates
  const existingSameId = templates.filter((t) => t.id === id); //look for template with same id 

  if (existingSameId.length === 0) throw new Error(`Template not found: ${id}`); 

  const nextVersion = Math.max(...existingSameId.map((t) => t.version ?? 1)) + 1; // get the highest version and add 1

  const toSave: PromptTemplate = { // create the new template to save with the updated content and the same id, but with the new version and the new date
    ...updated,
    id,
    version: nextVersion,
    createdAt: new Date().toISOString(),
  };

  const check = validateTemplateDefinition(updated);
  if (check.errors.length > 0) {
    throw new Error(`Invalid template definition:\n- ${check.errors.join("\n- ")}`);
  }

  templates.push(toSave); // add the new template to the list of templates
  await saveAllTemplates(templates);
}

export async function removeTemplate(id: string, version?: number): Promise<void> {
  const templates = await loadAllTemplates(); // load all templates
  const sameId = templates.filter((t) => t.id === id); // look for template with the same id

  if (sameId.length === 0) throw new Error(`Template not found: ${id}`); // check if it exist

  let toRemoveVersion: number; // seet the version to remove
  if (version !== undefined) { // if the version is specified we remove that version
    toRemoveVersion = version;
  } else { // if the version is not specified we remove the last version
    toRemoveVersion = Math.max(...sameId.map((t) => t.version ?? 1));
  }

  const after = templates.filter((t) => !(t.id === id && (t.version ?? 1) === toRemoveVersion)); // remove the template with the same id and version

  if (after.length === templates.length) { // same length means that we did not remove any template, so we throw an error
    throw new Error(`Template '${id}' version ${toRemoveVersion} not found`);
  }

  await saveAllTemplates(after);
}

export async function patchTemplate(
  id: string,
  patch: Partial<Omit<PromptTemplate, "id" | "version" | "createdAt">> // are optionals, but we cant patch the id 
): Promise<PromptTemplate> {
  const templates = await loadAllTemplates(); // load all templates

  const sameId = templates.filter((t) => t.id === id); //look for the same id
  if (sameId.length === 0) throw new Error(`Template not found: ${id}`); //checking as always if it exist


  const latest = sameId.reduce((best, cur) => {
    const bv = best.version ?? 1;
    const cv = cur.version ?? 1;
    return cv > bv ? cur : best;
  }); // look for latest version

  const nextVersion = Math.max(...sameId.map((t) => t.version ?? 1)) + 1;

  const toSave: PromptTemplate = { // createthe new one
    ...latest,
    ...patch,
    id,
    version: nextVersion,
    createdAt: new Date().toISOString(),
  };

  const check = validateTemplateDefinition(toSave); // validate the new template
  if (check.errors.length > 0) {
    throw new Error(`Invalid template definition:\n- ${check.errors.join("\n- ")}`);
  }

  templates.push(toSave); // safe it and save all templates
  await saveAllTemplates(templates);

  return toSave;
}