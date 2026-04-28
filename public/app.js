const templateList = document.getElementById("template-list");
const templateInfo = document.getElementById("template-info");
const templatePlaceholder = document.getElementById("template-placeholder");
const refreshListBtn = document.getElementById("refresh-list");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
    const response = await fetch(`/api/templates/${encodeURIComponent(templateId)}`);
    const data = await response.json();

    if (!response.ok) {
      templatePlaceholder.textContent = `Unable to load template info: ${data?.error || "Unknown error"}`;
      return;
    }

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

loadTemplates();