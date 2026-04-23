#!/usr/bin/env node

import 'dotenv/config';
import { loadAllTemplates, loadLatestTemplates, sortAllByIdAndVersion } from "../modules/templates/templateStore.js";
import { addTemplate, updateTemplate, removeTemplate, patchTemplate } from "../modules/templates/adminTemplateService.js";
import { JsonTemplateEngine } from "../modules/templateEngine.js";
import { getDefaultPolicyRules } from "../modules/policies/defaultPolicies.js";
import { checkPolicies } from "../modules/policies/policyChecker.js";
import type { PromptTemplate } from "../core/types.js";
import { Command, program } from "commander";
import { cmdInfo, cmdList, cmdPolicyCheck, cmdRun, cmdRunWithLLM } from "./commands.js";
import { styleText } from 'node:util';
import { sendToLLM, testLLMConnection } from "../modules/llmConnector.js";

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
    .action(async (id, options, command) => {
      if (!id) command.error("[ERROR] Missing template-id");
      if (!options.data) command.error("[ERROR] Missing --data <json-string>");

      let inputs: Record<string, unknown>;
      try {
        inputs = JSON.parse(options.data);
      } catch (e: any){
        command.error(`[ERROR] ${e.message}`);
        process.exit(1);
      }

      await cmdRun(id, inputs);
    });

    program.command('policy-check')
      .description('Runs a prompt through a policy check')
      .requiredOption("--prompt \"<text>\"", "Prompt to run check on")
      .action(async (options, command) => {
        if (!options.prompt) command.error("[ERROR] --prompt \"<text>\" not found");

        await cmdPolicyCheck({prompt: options.prompt})
      });

    program.command('run-llm')
    .description('Render a template and send it to the LLM')
    .argument('<template-id>', 'template id')
    .option('--data <json-string>', 'variables json string')
    .action(async (id, options, command) => {
      // if (!id) command.error("[ERROR] Missing template-id");
      if (!options.data) command.error("[ERROR] Missing --data <json-string>");

      let inputs: Record<string, unknown>;
      try {
        inputs = JSON.parse(options.data);
      } catch (e: any){
        command.error(`[ERROR] ${e.message}`);
        process.exit(1);
      }

      await cmdRunWithLLM(id, inputs);
    });

    program.command('test-llm')
    .description('Test connectivity to the LLM')
    .action(async () => {
      const success = await testLLMConnection();
      if (!success) {
        console.error("> LLM connection test failed. Please ensure your LLM is running and at the configured URL.");
        process.exit(1);
      }
      else console.log("> LLM connection test passed!");
    });

  await program.parseAsync();
  process.exit(0);
}

main().catch((err) => {
  console.error("[FATAL]", err.message ?? err);
  process.exit(1);
});