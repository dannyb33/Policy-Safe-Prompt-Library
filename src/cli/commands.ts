import type { PromptTemplate } from "../core/types.js";
import { getDefaultPolicyRules } from "../modules/policies/defaultPolicies.js";
import { checkPolicies } from "../modules/policies/policyChecker.js";
import { JsonTemplateEngine } from "../modules/templateEngine.js";
import { addTemplate, patchTemplate, removeTemplate, updateTemplate } from "../modules/templates/adminTemplateService.js";
import { loadAllTemplates, loadLatestTemplates, sortAllByIdAndVersion } from "../modules/templates/templateStore.js";

export async function cmdInfo(id: string) {
  const engine = new JsonTemplateEngine();
  const template = await engine.getTemplate(id); // throws if not found

  console.log(`> ---------------------------------------------------`);
  console.log(`> Template ID  : ${template.id}`);
  console.log(`> Version      : ${template.version ?? 1}`);
  if (template.createdAt) {
    console.log(`> Created At   : ${template.createdAt}`);
  }
  console.log(`> Description  : ${template.description}`);
  console.log(`> ---------------------------------------------------`);
  console.log(`> Variables (${template.variables.length}):`);
  for (const v of template.variables) {
    const required = v.required ? "required" : "optional";
    const opts = v.type === "enum" && v.options ? ` [${v.options.join(", ")}]` : "";
    console.log(`>   • ${v.name}  (${v.type}${opts})  [${required}]`);
    if (v.description) console.log(`>     "${v.description}"`);
  }
  console.log(`> ---------------------------------------------------`);
  console.log(`> Content preview:`);
  console.log(`>   ${template.content.replace(/\n/g, "\n>   ")}`);
  console.log(`> ---------------------------------------------------`);
}

export async function cmdRun(id: string, inputs: Record<string, unknown>) {
  const engine = new JsonTemplateEngine();

  console.log(`> [INFO] Loading template '${id}'...`);
  const template = await engine.getTemplate(id); // throws if not found

  console.log(`> [INFO] Validating inputs...`);
  const validationErrors = engine.validateInputs(template, inputs);
  if (validationErrors.length > 0) {
    console.error("> [ERROR] Validation failed:");
    validationErrors.forEach((e) => console.error(`>   • ${e}`));
    process.exit(1);
  }
  console.log(`> [INFO] Inputs OK`);

  const { output, usedPlaceholders, fromCache } = engine.render(template, inputs);

  console.log(`> [INFO] Placeholders filled: ${usedPlaceholders.map((p) => `{{${p}}}`).join(", ")}`);
  console.log(`> [INFO] Cache: ${fromCache ? "HIT ⚡" : "MISS (stored for next time)"}`);
  console.log(`> ---------------------------------------------------`);
  console.log(`> [OUTPUT PROMPT]`);
  console.log(`> "${output}"`);
  console.log(`> ---------------------------------------------------`);
}

export async function cmdList() {
  const templates = await loadLatestTemplates();
  templates.forEach((t, i) => {
    console.log(`> ${i + 1}. ${t.id}@${t.version ?? 1}  [${t.description}]`);
  });
}

export async function cmdAdminAdd(t: PromptTemplate) {
  await addTemplate(t);
  console.log(`> [OK] Template '${t.id}' added.`);
}

export async function cmdAdminEdit(id: string, t: PromptTemplate) {
  await updateTemplate(id, t);
  console.log(`> [OK] Template '${id}' updated.`);
}

export async function cmdAdminRemove(id: string) {
  await removeTemplate(id);
  console.log(`> [OK] Template '${id}' removed.`);
}

export async function cmdAdminPatch(id: string, patch: Record<string, unknown>) {
  const saved = await patchTemplate(id, patch);
  console.log(`> [OK] Template '${id}' patched. New version: ${saved.version ?? 1}`);
}

export async function cmdAdminList(all: boolean) {

  if (all) {   // list all versions instead of only the latest ones
    const templates = await loadAllTemplates(); 
    const sorted = sortAllByIdAndVersion(templates);

    console.log("> Admin Templates (ALL versions):");
    sorted.forEach((t, i) => {
      console.log(`> ${i + 1}. ${t.id}@${t.version ?? 1}  [${t.description}]`);
    });
    return;
  }

  const latest = await loadLatestTemplates();
  console.log("> Admin Templates (LATEST only):");
  latest.forEach((t, i) => {
    console.log(`> ${i + 1}. ${t.id}@${t.version ?? 1}  [${t.description}]`);
  });
}

export async function cmdPolicyCheck(prompt: string) {
  const rules = getDefaultPolicyRules();
  const summary = checkPolicies(prompt, rules);

  console.log("> [INFO] Running policy checks...");
  summary.results.forEach((result) => {
    console.log(`>   - ${result.name}: ${result.passed ? "PASSED" : "FAILED"}`);
    if (!result.passed && result.message) {
      console.log(`>     Reason: ${result.message}`);
    }
  });

  if (summary.passed) {
    console.log("> [OK] Prompt passed policy checks.");
    return;
  }

  console.error("> [BLOCKED] Prompt failed policy checks.");
  if (summary.details.length > 0) {
    console.error("> Details:");
    summary.details.forEach((detail) => console.error(`>   • ${detail}`));
  }
  process.exit(1);
}