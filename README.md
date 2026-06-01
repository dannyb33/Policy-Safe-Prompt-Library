**Policy-Safe-Prompt-Library**

This project provides a system for managing, rendering, and enforcing safety policies on prompt templates. This system is hosted as a public API and can be accessed by a web-deployed GUI or a locally-run CLI. The API can also be run locally.

Features:
- Prompt Template Management: Add, edit, list, and remove prompt templates.

- Policy Enforcement: Check prompts against customizable safety policies.

- Template Rendering: Render templates with variable substitution.

- CLI: Manage templates and run policy checks from the command line.

- MongoDB Integration: All templates and policy rules are stored in MongoDB.

<br>

**Web Deployment**

GUI: https://policy-safe.discovery.cs.vt.edu/

API Documentation: https://policy-safe.discovery.cs.vt.edu/docs

<br>

**CLI Usage**

Build the project:
-     npm run build

Link the CLI (for global use):
-     npm link

*CLI Guide*

List templates:
-     policy-cli list

Show template info:
-      policy-cli info <template-id>

Render a template:
-     policy-cli run <template-id> --data '{"var1":"value1"}'

Check a prompt against policies:
-     policy-cli policy-check --prompt "your prompt here"

<br>

**Local API Usage**

Run the API:
-     npm run dev:server