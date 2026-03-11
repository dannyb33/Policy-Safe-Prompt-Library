//console.log("Hello World (CLI)");

import { loadAllTemplates, loadLatestTemplates, sortAllByIdAndVersion } from "../modules/templates/templateStore.js";import { addTemplate, updateTemplate, removeTemplate, patchTemplate } from "../modules/templates/adminTemplateService.js";
import type { PromptTemplate } from "../core/types.js";

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function cmdList() {
  const templates = await loadLatestTemplates();
  templates.forEach((t, i) => {
    console.log(`> ${i + 1}. ${t.id}@${t.version ?? 1}  [${t.description}]`);
  });
}

async function cmdAdminAdd() {
  const templateStr = parseArg("--template");
  if (!templateStr) {
    console.error("[ERROR] Missing --template '<json-string>'");
    process.exit(1);
  }

  let t: PromptTemplate;
  try {
    t = JSON.parse(templateStr);
  } catch {
    console.error("[ERROR] --template is not valid JSON");
    process.exit(1);
  }

  await addTemplate(t);
  console.log(`> [OK] Template '${t.id}' added.`);
}

async function cmdAdminEdit() {
  const id = process.argv[3];
  if (!id) {
    console.error("[ERROR] Missing <template-id>");
    process.exit(1);
  }

  const templateStr = parseArg("--template");
  if (!templateStr) {
    console.error("[ERROR] Missing --template '<json-string>'");
    process.exit(1);
  }

  let updated: PromptTemplate;
  try {
    updated = JSON.parse(templateStr);
  } catch {
    console.error("[ERROR] --template is not valid JSON");
    process.exit(1);
  }

  await updateTemplate(id, updated);
  console.log(`> [OK] Template '${id}' updated.`);
}

async function cmdAdminRemove() {
  const id = process.argv[3];
  if (!id) {
    console.error("[ERROR] Missing <template-id>");
    process.exit(1);
  }

  const vStr = parseArg("--version");
  const version = vStr ? Number(vStr) : undefined;
  if (vStr) {
    const version = Number(vStr);
    if (!Number.isInteger(version) || version <= 0) {
      console.error("[ERROR] --version must be a positive integer");
      process.exit(1);
    }
  }

  await removeTemplate(id);
  console.log(`> [OK] Template '${id}' removed.`);
}

async function cmdAdminPatch() {
  const id = process.argv[3];
  if (!id) {
    console.error("[ERROR] Missing <template-id>");
    process.exit(1);
  }

  const patchStr = parseArg("--patch");
  if (!patchStr) {
    console.error("[ERROR] Missing --patch '<json-string>'");
    process.exit(1);
  }

  let patch: any;
  try {
    patch = JSON.parse(patchStr);
  } catch {
    console.error("[ERROR] --patch is not valid JSON");
    process.exit(1);
  }

  const saved = await patchTemplate(id, patch);
  console.log(`> [OK] Template '${id}' patched. New version: ${saved.version ?? 1}`);
}


async function cmdAdminList() {
  const allFlag = process.argv.includes("--all"); // detect if they write -all to list all versions instead of only the latest ones

  if (allFlag) {
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

async function main() {
  const command = process.argv[2];

  if (command === "list") return cmdList();
  if (command === "admin-add") return cmdAdminAdd();
  if (command === "admin-edit") return cmdAdminEdit();
  if (command === "admin-remove") return cmdAdminRemove();
  if (command === "admin-patch") return cmdAdminPatch();
  if (command === "admin-list") return cmdAdminList();

  console.log("Usage:");
  console.log("  npm run cli list");
  console.log("  npm run cli admin-add --template '<json-string>'");
  console.log("  npm run cli -- admin-edit <template-id> --template '<json-string>'");
  console.log("  npm run cli -- admin-remove <template-id> [--version <n>]");
  console.log("  npm run cli -- admin-patch <template-id> --patch '<json-string>'");
  console.log("  npm run cli -- admin-list [--all]");
  process.exit(1);
}

main().catch((err) => {
  console.error("[FATAL]", err.message ?? err);
  process.exit(1);
});