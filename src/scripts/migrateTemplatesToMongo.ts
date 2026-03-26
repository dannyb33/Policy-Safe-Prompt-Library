import fs from "node:fs/promises";
import path from "node:path";
import { getTemplatesCollection, closeDb } from "../modules/db.js";

async function main() {
  const templatesPath = path.resolve(process.cwd(), "src/modules/templates/templates.json");
  const raw = await fs.readFile(templatesPath, "utf-8");
  const templates = JSON.parse(raw) as any[];

  const collection = await getTemplatesCollection();
  await collection.deleteMany({});
  if (templates.length > 0) {
    await collection.insertMany(templates);
  }

  console.log(`Migrated ${templates.length} templates to MongoDB.`);
  await closeDb();
}

main().catch((err) => {
  console.error("Migration failed", err);
  process.exit(1);
});
