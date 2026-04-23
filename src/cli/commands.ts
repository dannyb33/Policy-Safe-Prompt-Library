import type { PolicyCheckInput, PolicyCheckSummary, PromptTemplate, RenderOutput } from "../core/types.js";
import { sendToLLM } from "../modules/llmConnector.js";
import { getDefaultPolicyRules } from "../modules/policies/defaultPolicies.js";
import { checkPolicies } from "../modules/policies/policyChecker.js";
import { JsonTemplateEngine } from "../modules/templateEngine.js";
import { addTemplate, patchTemplate, removeTemplate, updateTemplate } from "../modules/templates/adminTemplateService.js";
import { loadAllTemplates, loadLatestTemplates, sortAllByIdAndVersion } from "../modules/templates/templateStore.js";

const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT}`;

export async function cmdList() {
  const response = await fetch(`${API_BASE_URL}/api/templates`);
  if (!response.ok) {
    const error = await response.json();
    console.error(`Failed to fetch template list: ${error.error}`);
    process.exit(1);
  }

  const templates = await response.json() as [PromptTemplate];

  templates.forEach((t, i) => {
    console.log(`> ${i + 1}. ${t.id}@${t.version ?? 1}  [${t.description}]`);
  });
}

export async function cmdInfo(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/templates/${id}`);

  if (!response.ok) {
    const error = await response.json();
    console.error(`Failed to fetch template info: ${error.error}`);
    process.exit(1);
  }

  const template = await response.json() as PromptTemplate;

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
  const response = await fetch(`${API_BASE_URL}/api/templates/execute/${id}`, {
    method: 'POST',
    body: JSON.stringify(inputs),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`Failed to execute:\n${error.errors}`);
    process.exit(1);
  }

  const renderedObject = await response.json() as RenderOutput;

  console.log(`> [INFO] Placeholders filled: ${renderedObject.usedPlaceholders.map((p) => `{{${p}}}`).join(", ")}`);
  console.log(`> [INFO] Cache: ${renderedObject.fromCache ? "HIT ⚡" : "MISS (stored for next time)"}`);
  console.log(`> ---------------------------------------------------`);
  console.log(`> [OUTPUT PROMPT]`);
  console.log(`> "${renderedObject.output}"`);
  console.log(`> ---------------------------------------------------`);
}

export async function cmdRunWithLLM(id: string, inputs: Record<string, unknown>) {
  const engine = new JsonTemplateEngine();
  const template = await engine.getTemplate(id);
  const validationErrors = engine.validateInputs(template, inputs);

  if (validationErrors.length > 0) {
    validationErrors.forEach((e) => console.error(`> ${e}`));
    process.exit(1);
  }

  const renderedPrompt = engine.render(template, inputs);
  console.log(`> Rendered prompt:\n${renderedPrompt.output}`);

  const llmResponse = await sendToLLM(renderedPrompt.output);
  console.log(`> LLM Response:\n${llmResponse}`);
}
// Unnecessary for now...

// export async function cmdAdminPatch(id: string, patch: Record<string, unknown>) {
//   const saved = await patchTemplate(id, patch);
//   console.log(`> [OK] Template '${id}' patched. New version: ${saved.version ?? 1}`);
// }

// export async function cmdAdminList(all: boolean) {

//   if (all) {   // list all versions instead of only the latest ones
//     const templates = await loadAllTemplates(); 
//     const sorted = sortAllByIdAndVersion(templates);

//     console.log("> Admin Templates (ALL versions):");
//     sorted.forEach((t, i) => {
//       console.log(`> ${i + 1}. ${t.id}@${t.version ?? 1}  [${t.description}]`);
//     });
//     return;
//   }

//   const latest = await loadLatestTemplates();
//   console.log("> Admin Templates (LATEST only):");
//   latest.forEach((t, i) => {
//     console.log(`> ${i + 1}. ${t.id}@${t.version ?? 1}  [${t.description}]`);
//   });
// }

export async function cmdPolicyCheck(prompt: PolicyCheckInput) {
  const response = await fetch(`${API_BASE_URL}/api/policies/check`, {
    method: 'POST',
    body: JSON.stringify(prompt),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  const summary = await response.json() as PolicyCheckSummary;

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