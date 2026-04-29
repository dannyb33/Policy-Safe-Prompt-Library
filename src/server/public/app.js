const templateList = document.getElementById("template-list");
const templateInfo = document.getElementById("template-info");
const templatePlaceholder = document.getElementById("template-placeholder");
const refreshListBtn = document.getElementById("refresh-list");
const runTemplateIdInput = document.getElementById("run-template-id");
const runFieldsPlaceholder = document.getElementById("run-fields-placeholder");
const runFields = document.getElementById("run-fields");
const runTemplateBtn = document.getElementById("run-template-btn");
const runOutput = document.getElementById("run-output");
const policyPromptInput = document.getElementById("policy-prompt");
const runPolicyCheckBtn = document.getElementById("run-policy-check");
const policyOutput = document.getElementById("policy-output");

let activeRunTemplate = null;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showRunOutput(text, failed = false) {
  runOutput.textContent = text;
  runOutput.classList.remove("hidden");
  runOutput.classList.toggle("run-failed", failed);
}

function buildTemplateExecutionLines(result) {
  const lines = [];
  lines.push(`> [INFO] Placeholders filled: ${(result.usedPlaceholders || []).map((p) => `{{${p}}}`).join(", ") || "(none)"}`);
  lines.push(`> [INFO] Cache: ${result.fromCache ? "HIT" : "MISS"}`);
  lines.push("> ---------------------------------------------------");
  lines.push("> [OUTPUT PROMPT]");
  lines.push(`> \"${result.output || ""}\"`);
  lines.push("> ---------------------------------------------------");
  return lines;
}

function setRunFieldsPlaceholder(text) {
  runFieldsPlaceholder.textContent = text;
  runFieldsPlaceholder.classList.remove("hidden");
}

function createRunField(variable) {
  const wrapper = document.createElement("div");
  wrapper.className = "run-field";

  const label = document.createElement("label");
  label.className = "run-field-label";
  label.htmlFor = `run-field-${variable.name}`;
  label.textContent = `${variable.name}${variable.required ? " *" : ""}`;

  const help = document.createElement("div");
  help.className = "run-field-help";
  help.textContent = variable.description || `${variable.type} input`;

  let input;

  if (variable.type === "enum") {
    input = document.createElement("select");
    input.className = "run-input";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = `Select ${variable.name}`;
    input.appendChild(emptyOption);

    for (const option of variable.options || []) {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.textContent = option;
      input.appendChild(optionEl);
    }
  } else if (variable.type === "boolean") {
    input = document.createElement("select");
    input.className = "run-input";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = `Select ${variable.name}`;
    input.appendChild(emptyOption);

    ["true", "false"].forEach((value) => {
      const optionEl = document.createElement("option");
      optionEl.value = value;
      optionEl.textContent = value;
      input.appendChild(optionEl);
    });
  } else if (variable.type === "number") {
    input = document.createElement("input");
    input.className = "run-input";
    input.type = "number";
    input.placeholder = `Enter ${variable.name}`;
  } else {
    input = document.createElement("textarea");
    input.className = "run-input";
    input.rows = 3;
    input.placeholder = `Enter ${variable.name}`;
  }

  input.id = `run-field-${variable.name}`;
  input.dataset.variableName = variable.name;
  input.dataset.variableType = variable.type;
  input.dataset.required = String(Boolean(variable.required));

  wrapper.appendChild(label);
  wrapper.appendChild(help);
  wrapper.appendChild(input);

  return wrapper;
}

function renderRunFields(template) {
  activeRunTemplate = template;
  runFields.innerHTML = "";

  if (!Array.isArray(template.variables) || template.variables.length === 0) {
    setRunFieldsPlaceholder("This template does not require any variables.");
    return;
  }

  runFieldsPlaceholder.classList.add("hidden");
  for (const variable of template.variables) {
    runFields.appendChild(createRunField(variable));
  }
}

async function fetchTemplate(templateId) {
  const response = await fetch(`/api/templates/${encodeURIComponent(templateId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Unknown error");
  }

  return data;
}

async function loadRunTemplateSchema(templateId) {
  const trimmedTemplateId = templateId.trim();
  if (!trimmedTemplateId) {
    activeRunTemplate = null;
    runFields.innerHTML = "";
    setRunFieldsPlaceholder("Select a template to load its input fields.");
    return;
  }

  setRunFieldsPlaceholder("Loading template input fields...");
  runFields.innerHTML = "";

  try {
    const template = await fetchTemplate(trimmedTemplateId);
    renderRunFields(template);
  } catch (error) {
    activeRunTemplate = null;
    runFields.innerHTML = "";
    setRunFieldsPlaceholder(`Unable to load input fields: ${error.message}`);
  }
}

function collectRunVariables() {
  const variables = {};
  const fieldElements = runFields.querySelectorAll("[data-variable-name]");

  for (const field of fieldElements) {
    const variableName = field.dataset.variableName;
    const variableType = field.dataset.variableType;
    const required = field.dataset.required === "true";
    const rawValue = field.value.trim();

    if (!rawValue) {
      if (required) {
        throw new Error(`Please enter a value for ${variableName}.`);
      }
      continue;
    }

    if (variableType === "number") {
      const numericValue = Number(rawValue);
      if (Number.isNaN(numericValue)) {
        throw new Error(`${variableName} must be a number.`);
      }
      variables[variableName] = numericValue;
      continue;
    }

    if (variableType === "boolean") {
      variables[variableName] = rawValue === "true";
      continue;
    }

    variables[variableName] = rawValue;
  }

  return variables;
}

function renderRunResult(templateResult, llmResult, llmError = null) {
  const lines = buildTemplateExecutionLines(templateResult);
  lines.push("> [INFO] Sending rendered prompt to LLM...");
  lines.push("> ---------------------------------------------------");

  if (llmError) {
    lines.push("> [ERROR] Error in operation.");
    lines.push(`> ${llmError}`);
    lines.push("> ---------------------------------------------------");
    showRunOutput(lines.join("\n"), true);
    return;
  }

  lines.push("> [LLM RESPONSE]");
  lines.push(`> \"${llmResult || ""}\"`);
  lines.push("> ---------------------------------------------------");
  showRunOutput(lines.join("\n"), false);
}

async function runTemplate() {
  const templateId = runTemplateIdInput.value.trim();

  if (!templateId) {
    showRunOutput("> [ERROR] Please enter a template ID.", true);
    return;
  }

  try {
    if (!activeRunTemplate || activeRunTemplate.id !== templateId) {
      await loadRunTemplateSchema(templateId);
    }
  } catch (_error) {
    showRunOutput("> [ERROR] Could not load template input fields.", true);
    return;
  }

  let variables;
  try {
    variables = collectRunVariables();
  } catch (error) {
    showRunOutput(`> [ERROR] ${error.message}`, true);
    return;
  }

  runTemplateBtn.disabled = true;
  runTemplateBtn.textContent = "Running...";

  try {
    const response = await fetch(`/api/templates/execute/${encodeURIComponent(templateId)}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(variables),
    });

    const data = await response.json();

    if (!response.ok) {
      showRunOutput(`> [ERROR] Failed to execute:\n${data?.errors || data?.error || "Unknown error"}`, true);
      return;
    }

    const llmResponse = await fetch(`/api/llm/run/${encodeURIComponent(templateId)}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(variables),
    });

    const llmData = await llmResponse.json();
    if (!llmResponse.ok) {
      renderRunResult(data, null, llmData?.errors || llmData?.error || "Unknown error");
      return;
    }

    renderRunResult(data, llmData?.response || "");
  } catch (_error) {
    showRunOutput("> [ERROR] Could not execute template + LLM due to a network/server issue.", true);
  } finally {
    runTemplateBtn.disabled = false;
    runTemplateBtn.textContent = "Run template + LLM";
  }
}

function renderPolicySummary(summary) {
  const lines = ["> [INFO] Running policy checks..."];

  for (const result of summary.results || []) {
    lines.push(`>   - ${result.name}: ${result.passed ? "PASSED" : "FAILED"}`);
    if (!result.passed && result.message) {
      lines.push(`>     Reason: ${result.message}`);
    }
  }

  if (summary.passed) {
    lines.push("> [OK] Prompt passed policy checks.");
    policyOutput.classList.remove("policy-failed");
  } else {
    lines.push("> [BLOCKED] Prompt failed policy checks.");
    if (Array.isArray(summary.details) && summary.details.length > 0) {
      lines.push("> Details:");
      for (const detail of summary.details) {
        lines.push(`>   - ${detail}`);
      }
    }
    policyOutput.classList.add("policy-failed");
  }

  policyOutput.textContent = lines.join("\n");
  policyOutput.classList.remove("hidden");
}

async function runPolicyCheck() {
  const prompt = policyPromptInput.value.trim();

  if (!prompt) {
    policyOutput.textContent = "> [ERROR] Please enter a prompt before running policy check.";
    policyOutput.classList.remove("hidden");
    policyOutput.classList.add("policy-failed");
    return;
  }

  runPolicyCheckBtn.disabled = true;
  runPolicyCheckBtn.textContent = "Running...";

  try {
    const response = await fetch("/api/policies/check", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!data || !Array.isArray(data.results)) {
      policyOutput.textContent = `> [ERROR] Unexpected response: ${JSON.stringify(data)}`;
      policyOutput.classList.remove("hidden");
      policyOutput.classList.add("policy-failed");
      return;
    }

    renderPolicySummary(data);
  } catch (_error) {
    policyOutput.textContent = "> [ERROR] Could not run policy check due to a network/server issue.";
    policyOutput.classList.remove("hidden");
    policyOutput.classList.add("policy-failed");
  } finally {
    runPolicyCheckBtn.disabled = false;
    runPolicyCheckBtn.textContent = "Run policy check";
  }
}

// template info rednering  
function renderTemplateInfo(template) {
  const variables = (template.variables || [])
    .map((variable) => {
      const optional = variable.required ? "required" : "optional";
      const opts = variable.type === "enum" && Array.isArray(variable.options)
        ? ` [${variable.options.join(", ")}]`
        : "";

      return `<li><strong>${escapeHtml(variable.name)}</strong> (${escapeHtml(variable.type)}${escapeHtml(opts)}) - ${optional}<br />${escapeHtml(variable.description || "No description")}</li>`;
    })
    .join("");

  templateInfo.innerHTML = `
    <p><strong>ID:</strong> ${escapeHtml(template.id)}</p>
    <p><strong>Version:</strong> ${escapeHtml(String(template.version || 1))}</p>
    <p><strong>Description:</strong> ${escapeHtml(template.description || "")}</p>
    <p><strong>Created:</strong> ${escapeHtml(template.createdAt || "Unknown")}</p>
    <p><strong>Variables (${Array.isArray(template.variables) ? template.variables.length : 0}):</strong></p>
    <ul>${variables || "<li>No variables</li>"}</ul>
    <p><strong>Content:</strong></p>
    <pre>${escapeHtml(template.content || "")}</pre>
  `;

  templateInfo.classList.remove("hidden");
  templatePlaceholder.classList.add("hidden");
}


async function loadTemplateInfo(templateId) {
  templatePlaceholder.textContent = "Loading template info...";
  templatePlaceholder.classList.remove("hidden");
  templateInfo.classList.add("hidden");

  try {
    const data = await fetchTemplate(templateId);
    renderTemplateInfo(data);
  } catch (_error) {
    templatePlaceholder.textContent = "Unable to load template info due to a network error.";
  }
}

async function loadTemplates() {
  templateList.innerHTML = "<li>Loading templates...</li>";

  try {
    const response = await fetch("/api/templates");
    const templates = await response.json();

    if (!response.ok) {
      templateList.innerHTML = `<li>Could not fetch templates: ${escapeHtml(templates?.error || "Unknown error")}</li>`;
      return;
    }

    if (!Array.isArray(templates) || templates.length === 0) {
      templateList.innerHTML = "<li>No templates found.</li>";
      return;
    }

    templateList.innerHTML = "";

    templates.forEach((template) => {
      const item = document.createElement("li");
      const button = document.createElement("button");

      button.type = "button";
      button.className = "template-item";
      button.innerHTML = `
        <div class="template-id">${escapeHtml(template.id)} @v${escapeHtml(String(template.version || 1))}</div>
        <div class="template-description">${escapeHtml(template.description || "")}</div>
      `;

      button.addEventListener("click", () => {
        runTemplateIdInput.value = template.id;
        loadRunTemplateSchema(template.id);
        loadTemplateInfo(template.id);
      });

      item.appendChild(button);
      templateList.appendChild(item);
    });
  } catch (_error) {
    templateList.innerHTML = "<li>Could not fetch templates due to a network error.</li>";
  }
}

refreshListBtn.addEventListener("click", loadTemplates);
runTemplateBtn.addEventListener("click", runTemplate);
runPolicyCheckBtn.addEventListener("click", runPolicyCheck);

runTemplateIdInput.addEventListener("change", () => {
  loadRunTemplateSchema(runTemplateIdInput.value);
});

runTemplateIdInput.addEventListener("blur", () => {
  loadRunTemplateSchema(runTemplateIdInput.value);
});

policyPromptInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    runPolicyCheck();
  }
});

loadTemplates();