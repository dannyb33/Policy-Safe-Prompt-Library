#!/usr/bin/env node

import fs from "node:fs/promises";
import type { PromptTemplate } from "../core/types.js";
import { Command } from "commander";
import {
  cmdAdminAdd,
  cmdAdminEdit,
  cmdAdminImport,
  cmdAdminList,
  cmdAdminPatch,
  cmdAdminRemove,
  cmdInfo,
  cmdList,
  cmdPolicyCheck,
  cmdRun,
} from "./commands.js";

async function parseJsonInput<T>(
  command: Command,
  options: Record<string, unknown>,
  config: { inlineKey: string; fileKey: string; label: string }
): Promise<T> {
  const inlineValue = options[config.inlineKey];
  const fileValue = options[config.fileKey];

  if (inlineValue && fileValue) {
    command.error(`[ERROR] Use either --${config.inlineKey} or --${config.fileKey}, not both.`);
  }
  if (!inlineValue && !fileValue) {
    command.error(`[ERROR] Missing --${config.inlineKey} or --${config.fileKey}.`);
  }

  let raw: string;
  if (fileValue) {
    try {
      raw = await fs.readFile(String(fileValue), "utf-8");
    } catch (err) {
      command.error(`[ERROR] Cannot read file: ${String(fileValue)}`);
      process.exit(1);
    }
  } else {
    raw = String(inlineValue);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    const source = fileValue ? `file ${String(fileValue)}` : `--${config.inlineKey}`;
    command.error(`[ERROR] ${config.label} JSON is invalid from ${source}`);
    process.exit(1);
  }
}


async function main() {
  const program = new Command();

  program
    .name('policy-cli')
    .description('CLI for prompt templating and policy checking')
    .version('0.1.0')
    .showHelpAfterError()
    .showSuggestionAfterError();

  program.command('list')
    .description('Show a list of current templates')
    .action(cmdList);

  program.command('info')
    .description('Show details about a template')
    .argument('<template-id>', 'template id')
    .action((id) => cmdInfo(id));

  program.command('run')
    .description('Render a template with given variables')
    .argument('<template-id>', 'template id')
    .option('--data <json-string>', 'variables json string')
    .action((id, options, command) => {
      if (!id) command.error("[ERROR] Missing template-id");
      if (!options.data) command.error("[ERROR] Missing --data <json-string>");

      let inputs: Record<string, unknown>;
      try {
        inputs = JSON.parse(options.data);
      } catch {
        command.error("[ERROR] --data <json-string> is an invalid JSON");
        process.exit(1);
      }

      cmdRun(id, inputs);
    });

  program.command('admin-add')
    .description('Add a template from a JSON string')
    .option('--template <json-string>', 'template JSON string')
    .option('--file <path>', 'template JSON file')
    .action(async (options, command) => {
      const t = await parseJsonInput<PromptTemplate>(command, options, {
        inlineKey: "template",
        fileKey: "file",
        label: "Template",
      });

      await cmdAdminAdd(t);
    });

  program.command('admin-edit')
    .description('Edit a template from an id given a new JSON string')
    .argument('<template-id>', 'id of template to edit')
    .option('--template <json-string>', 'new template JSON string')
    .option('--file <path>', 'template JSON file')
    .action(async (str, options, command) => {
      if (!str) command.error("[ERROR] missing <template-id>");
      const t = await parseJsonInput<PromptTemplate>(command, options, {
        inlineKey: "template",
        fileKey: "file",
        label: "Template",
      });

      await cmdAdminEdit(str, t);
    });

  program.command('admin-remove')
    .description('Remove a template given an id and an optional version number')
    .argument('[template-id]', 'id of template to remove')
    .option('--version <n>', 'version of template to remove')
    .option('--file <path>', 'JSON file containing { "id": "...", "version"?: n }')
    .action(async (str, options, command) => {
      let id = str;
      let version = options.version ? Number(options.version) : undefined;

      if (options.file) {
        const payload = await parseJsonInput<{ id: string; version?: number }>(command, options, {
          inlineKey: "template",
          fileKey: "file",
          label: "Remove",
        });

        id = payload.id;
        version = payload.version;
      }

      if (!id) command.error("[ERROR] missing <template-id> or --file");

      if (version !== undefined) {
        const vInt = Number(version);
        if (!Number.isInteger(vInt) || vInt <= 0) {
          command.error("[ERROR] --version must be a positive integer");
        }
      }

      await cmdAdminRemove(id, version);
    });

  program.command('admin-patch')
    .description('Patch a template given an id and an optional version number')
    .argument('<template-id>', 'id of template to remove')
    .option('--patch <json-string>', 'JSON string of values to patch')
    .option('--file <path>', 'patch JSON file')
    .action(async (str, options, command) => {
      if (!str) command.error("[ERROR] missing <template-id>");
      const patch = await parseJsonInput<Record<string, unknown>>(command, options, {
        inlineKey: "patch",
        fileKey: "file",
        label: "Patch",
      });

      await cmdAdminPatch(str, patch);
    });

    program.command('admin-list')
      .description('Show a list of templates')
      .option('--all', 'List all versions')
      .action(async (options) => {
        await cmdAdminList(options.all);
      });

    program.command('admin-import')
      .description('Import one or more templates from a JSON file')
      .requiredOption('--file <path>', 'JSON file containing a template or array of templates')
      .action(async (options, command) => {
        const payload = await parseJsonInput<PromptTemplate | PromptTemplate[]>(command, options, {
          inlineKey: "template",
          fileKey: "file",
          label: "Template",
        });

        await cmdAdminImport(payload);
      });

    program.command('policy-check')
      .description('Runs a prompt through a policy check')
      .requiredOption("--prompt \"<text>\"", "Prompt to run check on")
      .action(async (options, command) => {
        if (!options.prompt) command.error("[ERROR] --prompt \"<text>\" not found");

        await cmdPolicyCheck(options.prompt)
      });

  program.parse();
}

main().catch((err) => {
  console.error("[FATAL]", err.message ?? err);
  process.exit(1);
});