#!/usr/bin/env node

import 'dotenv/config';
import { loadAllTemplates, loadLatestTemplates, sortAllByIdAndVersion } from "../modules/templates/templateStore.js";
import { addTemplate, updateTemplate, removeTemplate, patchTemplate } from "../modules/templates/adminTemplateService.js";
import { JsonTemplateEngine } from "../modules/templateEngine.js";
import { getDefaultPolicyRules } from "../modules/policies/defaultPolicies.js";
import { checkPolicies } from "../modules/policies/policyChecker.js";
import type { PromptTemplate } from "../core/types.js";
import { Command, program } from "commander";
import { cmdBatch, cmdInfo, cmdList, cmdPolicyCheck, cmdRun } from "./commands.js";
import { styleText } from 'node:util';
import fs from "node:fs/promises";

async function main() {
  const program = new Command();

  program
    .name('policy-cli')
    .description(`\n*************************************************\n
* CLI for prompt templating and policy checking *\n
*************************************************`)
    .usage('[options] <input>')
    .version('0.1.0')
    .showHelpAfterError()
    .showSuggestionAfterError();

  program.configureHelp({
    styleTitle: (str) => styleText('bold', str),
    styleCommandText: (str) => styleText('magenta', str),
    styleCommandDescription: (str) => styleText('green', str),
    styleDescriptionText: (str) => styleText('italic', str),
    styleOptionText: (str) => styleText('yellow', str),
    styleArgumentText: (str) => styleText('red', str),
    styleSubcommandText: (str) => styleText('blue', str),
  });

  program.command('list')
    .description('Show a list of current templates')
    .action(await cmdList);

  program.command('info')
    .description('Show details about a template')
    .argument('<template-id>', 'template id')
    .action(async (id) => await cmdInfo(id));

  program.command('run')
    .description('Render a template with given variables')
    .argument('<template-id>', 'template id')
    .option('--data <json-string>', 'variables json string')
    .option('--json-file <path>', 'path to a JSON file with variables')
    .action(async (id, options, command) => {
      if (!id) command.error("[ERROR] Missing template-id");
      const hasData = typeof options.data === "string";
      const hasJsonFile = typeof options.jsonFile === "string";

      if (hasData && hasJsonFile) {
        command.error("[ERROR] Use either --data or --json-file, not both");
      }

      if (!hasData && !hasJsonFile) {
        command.error("[ERROR] Missing --data <json-string> or --json-file <path>");
      }

      let inputs: Record<string, unknown>;
      try {
        if (hasJsonFile) {
          const raw = await fs.readFile(options.jsonFile, "utf-8");
          inputs = JSON.parse(raw);
        } else {
          inputs = JSON.parse(options.data);
        }
      } catch (e: any){
        command.error(`[ERROR] ${e.message}`);
        process.exit(1);
      }

      await cmdRun(id, inputs);
    });

  program.command('batch')
    .description('Run a batch of template operations from a JSON file')
    .requiredOption('--file <path>', 'path to batch operations JSON file')
    .option('--continue-on-error', 'continue processing on errors', false)
    .action(async (options, command) => {
      if (!options.file) command.error("[ERROR] Missing --file <path>");
      await cmdBatch(options.file, { continueOnError: options.continueOnError });
    });

    program.command('policy-check')
      .description('Runs a prompt through a policy check')
      .requiredOption("--prompt \"<text>\"", "Prompt to run check on")
      .action(async (options, command) => {
        if (!options.prompt) command.error("[ERROR] --prompt \"<text>\" not found");

        await cmdPolicyCheck({prompt: options.prompt})
      });

  await program.parseAsync();
  process.exit(0);
}

main().catch((err) => {
  console.error("[FATAL]", err.message ?? err);
  process.exit(1);
});