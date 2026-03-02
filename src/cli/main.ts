//console.log("Hello World (CLI)");

import { loadAllTemplates } from "../modules/templates/templateStore.js";

async function main() {
  const command = process.argv[2];

  if (command !== "list") {
    console.log("Usage:");
    console.log("  npm run cli list");
    process.exit(1);
  }

  const templates = await loadAllTemplates();
  console.log("> Available Templates:");
  templates.forEach((t, i) => {
    console.log(`> ${i + 1}. ${t.id}  [${t.description}]`);
  });
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
}); 