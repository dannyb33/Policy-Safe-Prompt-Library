// @ts-ignore
import { MongoClient, Db, Collection } from "mongodb";
import type { PromptTemplate } from "../core/types.js";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb+srv://team1:policy@policy-cli.ura7x3u.mongodb.net/";
const MONGODB_DB = process.env.MONGODB_DB ?? "policy_safe_prompts";
const TEMPLATES_COLLECTION = "templates";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db && client) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(MONGODB_DB);

  return db;
}

export async function getTemplatesCollection(): Promise<Collection<PromptTemplate>> {
  const database = await connectDb();
  const collection = database.collection<PromptTemplate>(TEMPLATES_COLLECTION);

  await collection.createIndex({ id: 1, version: 1 }, { unique: true, background: true });
  await collection.createIndex({ id: 1, version: -1 }, { background: true });

  return collection;
}

export async function closeDb(): Promise<void> {
  if (!client) return;
  await client.close();
  client = null;
  db = null;
}
