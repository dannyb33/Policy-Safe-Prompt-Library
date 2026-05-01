**Policy-Safe-Prompt-Library**

Policy-Safe-Prompt-Library is a prompt templating and safety-checking system for building reusable prompts, validating them against policy rules, and optionally sending rendered prompts to an LLM. It supports both an API and a CLI, with MongoDB used to store templates and policy rule data.

**Purpose**

The purpose of this project is to make prompt workflows safer and more reusable. Instead of manually writing prompts each time, users can store templates, fill in variables consistently, run policy checks before use, and test the final output through a connected LLM endpoint.

**Project Goals**

- Build reusable prompt templates with variable-based input.
- Store templates and policy data in MongoDB for persistence.
- Detect unsafe prompt content such as prompt injection, jailbreaking attempts, and personal data exposure.
- Provide a CLI for fast local testing and template execution.
- Provide an API layer that the CLI and GUI can use consistently.
- Support optional LLM execution after rendering a template.

**Setup**

Install dependencies:

```bash
npm install
```

Build the project:

```bash
npm run build
```

Link the CLI for global use:

```bash
npm link
```

Start the API server in a separate terminal:

```bash
npm run dev:server
```

The CLI depends on the API being available. By default, it uses `http://localhost:4000/api` unless `API_BASE_URL` is set in `.env`.

**CLI Commands**

Show all available commands:

```bash
policy-cli --help
```

List templates:

```bash
policy-cli list
```

Show template details:

```bash
policy-cli info <template-id>
```

Render a template with JSON input data:

```bash
policy-cli run <template-id> --data '{"var1":"value1"}'
```

Run a policy check on plain text:

```bash
policy-cli policy-check --prompt "your prompt here"
```

Render a template and send the result to the configured LLM:

```bash
policy-cli run-llm <template-id> --data '{"var1":"value1"}'
```

Test connectivity to the configured LLM endpoint:

```bash
policy-cli test-llm
```

**Example Workflow**

1. Start the API server with `npm run dev:server`.
2. Use `policy-cli list` to find an available template.
3. Inspect the template fields with `policy-cli info <template-id>`.
4. Render the prompt with `policy-cli run <template-id> --data '{...}'`.
5. Check risky text with `policy-cli policy-check --prompt "..."`.
6. If needed, run the rendered prompt through the LLM with `policy-cli run-llm <template-id> --data '{...}'`.
