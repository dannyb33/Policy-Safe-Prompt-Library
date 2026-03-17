import { loadAllTemplates, loadLatestTemplates, sortAllByIdAndVersion } from "../modules/templates/templateStore.js";
import { addTemplate, updateTemplate, removeTemplate, patchTemplate } from "../modules/templates/adminTemplateService.js";
import { JsonTemplateEngine } from "../modules/templateEngine.js";
import { getDefaultPolicyRules } from "../modules/policies/defaultPolicies.js";
import { checkPolicies } from "../modules/policies/policyChecker.js";
import type { PromptTemplate } from "../core/types.js";
import { Command, program } from "commander";
import { cmdAdminAdd, cmdAdminEdit, cmdAdminList, cmdAdminPatch, cmdAdminRemove, cmdInfo, cmdList, cmdPolicyCheck, cmdRun } from "./commands.js";


async function main() {
  const program = new Command();

  program
    .name('cli')
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
    .requiredOption('--template <json-string>', 'template JSON string')
    .action(async (options, command) => {
      if (!options.data) command.error("[ERROR] Missing --template '<json-string>'");

      let t: PromptTemplate;
      try {
        t = JSON.parse(options.data);
      } catch {
        command.error("[ERROR] --template is not valid JSON");
        process.exit(1);
      }

      await cmdAdminAdd(t);
    });

  program.command('admin-edit')
    .description('Edit a template from an id given a new JSON string')
    .argument('<template-id>', 'id of template to edit')
    .requiredOption('--template <json-string>', 'new template JSON string')
    .action(async (str, options, command) => {
      if (!str) command.error("[ERROR] missing <template-id>");
      if (!options.data) command.error("[ERROR] Missing --template '<json-string>'");

      let t: PromptTemplate;
      try {
        t = JSON.parse(options.data);
      } catch {
        command.error("[ERROR] --template is not valid JSON");
        process.exit(1);
      }

      await cmdAdminEdit(str, t);
    });

  program.command('admin-remove')
    .description('Remove a template given an id and an optional version number')
    .argument('<template-id>', 'id of template to remove')
    .option('--version <n>', 'version of template to remove')
    .action(async (str, options, command) => {
      if (!str) command.error("[ERROR] missing <template-id>");

      const version = options.version ? Number(options.version) : undefined;
      if (version) {
        const vInt = Number(version);
        if (!Number.isInteger(vInt) || vInt <= 0) {
          command.error("[ERROR] --version must be a positive integer");
        }
      }

      await cmdAdminRemove(str);
    });

  program.command('admin-patch')
    .description('Patch a template given an id and an optional version number')
    .argument('<template-id>', 'id of template to remove')
    .requiredOption('--patch <json-string>', 'JSON string of values to patch')
    .action(async (str, options, command) => {
      if (!str) command.error("[ERROR] missing <template-id>");
      if (!options.patch) command.error("[ERROR] missing --patch <json-string>")

      let patch: Record<string, unknown>;
      try {
        patch = JSON.parse(options.data);
      } catch {
        command.error("[ERROR] --patch <json-string> is an invalid JSON");
        process.exit(1);
      }

      await cmdAdminPatch(str, patch);
    });

    program.command('admin-list')
      .description('Show a list of templates')
      .option('--all', 'List all versions')
      .action(async (options) => {
        await cmdAdminList(options.all);
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