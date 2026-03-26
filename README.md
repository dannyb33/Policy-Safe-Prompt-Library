**Policy-Safe-Prompt-Library**

This project provides a system for managing, rendering, and enforcing safety policies on prompt templates. The system supports both a CLI and server mode, with MongoDB as the backend for template storage.

Features:
- Prompt Template Management: Add, edit, list, and remove prompt templates.

- Policy Enforcement: Check prompts against customizable safety policies.

- Template Rendering: Render templates with variable substitution.

- CLI: Manage templates and run policy checks from the command line.

- MongoDB Integration: All templates and policy rules are stored in MongoDB.

Build the project:
-     npm run build

Link the CLI (for global use):
-      npm link

**Usage**

List templates:
-     policy-cli list

Show template info:
-      policy-cli info <template-id>

Render a template:
-     policy-cli run <template-id> --data '{"var1":"value1"}'

Check a prompt against policies:
-     policy-cli policy-check --prompt "your prompt here"

Admin commands: (add, edit, remove templates)
-     policy-cli admin-add --file path/to/template.json
-     policy-cli admin-edit <template-id> --file path/to/template.json
-     policy-cli admin-remove <template-id>
